/**
 * The little WebGL2 the effects need, in place of three.js. It reproduces what three.js did for them: shaders get
 * the same prelude three.js gave a ShaderMaterial (so the GLSL files are unchanged and `#include <colorspace_fragment>`
 * still converts to sRGB), images upload as sRGB textures the same way, and canvas sizing, matrices and plane
 * geometry follow three.js's own formulas, so every effect draws the same pixels it did before.
 */

const PRECISION = 'precision highp float;\nprecision highp int;\nprecision highp sampler2D;\n';

const VERTEX_PRELUDE = `#version 300 es
#define attribute in
#define varying out
#define texture2D texture
${PRECISION}uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
#ifdef USE_INSTANCING
attribute mat4 instanceMatrix;
#endif
attribute vec3 position;
attribute vec2 uv;
`;

const FRAGMENT_PRELUDE = `#version 300 es
#define varying in
layout(location = 0) out highp vec4 pc_fragColor;
#define gl_FragColor pc_fragColor
#define texture2D texture
${PRECISION}vec4 sRGBTransferOETF( in vec4 value ) {
\treturn vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}
vec4 linearToOutputTexel( vec4 value ) {
\treturn sRGBTransferOETF( vec4( value.rgb * mat3( 1.0000,-0.0000,-0.0000,-0.0000,1.0000,0.0000,0.0000,0.0000,1.0000 ), value.a ) );
}
`;

export type GL = WebGL2RenderingContext;

/** A WebGL2 context with the state three.js set up on every renderer. */
export function createContext(canvas: HTMLCanvasElement, attrs: WebGLContextAttributes): GL | null {
  const gl = canvas.getContext('webgl2', { stencil: false, preserveDrawingBuffer: false, powerPreference: 'high-performance', ...attrs });
  if (!gl) return null;
  gl.clearColor(0, 0, 0, 1);
  gl.clearDepth(1);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.frontFace(gl.CCW);
  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);
  return gl;
}

/** Size the drawing buffer like three.js's setSize(width, height, false) at the given pixel ratio. */
export function setSize(gl: GL, width: number, height: number, ratio: number) {
  gl.canvas.width = Math.floor(width * ratio);
  gl.canvas.height = Math.floor(height * ratio);
  gl.viewport(0, 0, Math.round(width * ratio), Math.round(height * ratio));
}

/** Clear colour, depth and stencil (as three.js's autoClear does before each render). */
export function clear(gl: GL) {
  gl.depthMask(true);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
}

/** Depth and face culling for one draw: three.js's state for depthTest/depthWrite and FrontSide/DoubleSide. */
export function drawState(gl: GL, { depth, doubleSide }: { depth: boolean; doubleSide: boolean }) {
  if (doubleSide) gl.disable(gl.CULL_FACE);
  else gl.enable(gl.CULL_FACE);
  if (depth) gl.enable(gl.DEPTH_TEST);
  else gl.disable(gl.DEPTH_TEST);
  gl.depthMask(depth);
}

type UniformValue = number | ArrayLike<number>;

export type Program = {
  program: WebGLProgram;
  attrib: (name: string) => number;
  /** set uniforms by name; values follow the uniform's GLSL type, samplers take a texture unit */
  set: (values: Record<string, UniformValue>) => void;
  dispose: () => void;
};

export function createProgram(gl: GL, vertex: string, fragment: string, { instancing = false } = {}): Program {
  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const defines = instancing ? '#define USE_INSTANCING\n' : '';
  const vs = compile(gl.VERTEX_SHADER, VERTEX_PRELUDE.replace(PRECISION, PRECISION + defines) + vertex);
  const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT_PRELUDE + fragment.replace('#include <colorspace_fragment>', 'gl_FragColor = linearToOutputTexel( gl_FragColor );'));
  const program = gl.createProgram()!;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.bindAttribLocation(program, 0, 'position');
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('WebGL program:', gl.getProgramInfoLog(program), gl.getShaderInfoLog(vs), gl.getShaderInfoLog(fs));
  }
  gl.deleteShader(vs);
  gl.deleteShader(fs);

  const uniforms = new Map<string, { loc: WebGLUniformLocation; type: number }>();
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) as number;
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i)!;
    uniforms.set(info.name, { loc: gl.getUniformLocation(program, info.name)!, type: info.type });
  }
  const set = (values: Record<string, UniformValue>) => {
    gl.useProgram(program);
    for (const name in values) {
      const u = uniforms.get(name);
      if (!u) continue;
      const v = values[name] as any;
      switch (u.type) {
        case gl.FLOAT: gl.uniform1f(u.loc, v); break;
        case gl.FLOAT_VEC2: gl.uniform2f(u.loc, v[0], v[1]); break;
        case gl.FLOAT_VEC3: gl.uniform3f(u.loc, v[0], v[1], v[2]); break;
        case gl.FLOAT_MAT4: gl.uniformMatrix4fv(u.loc, false, v); break;
        default: gl.uniform1i(u.loc, v); // samplers, ints, bools
      }
    }
  };
  return { program, attrib: (name) => gl.getAttribLocation(program, name), set, dispose: () => gl.deleteProgram(program) };
}

/** An array buffer bound to a vertex attribute of the currently bound vertex array. */
export function attribute(gl: GL, location: number, data: Float32Array, size: number, { divisor = 0, usage = gl.STATIC_DRAW } = {}) {
  const buffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, usage);
  if (location < 0) return buffer;
  // a mat4 takes four consecutive vec4 locations
  const slots = size === 16 ? 4 : 1;
  for (let i = 0; i < slots; i++) {
    gl.enableVertexAttribArray(location + i);
    gl.vertexAttribPointer(location + i, slots === 4 ? 4 : size, gl.FLOAT, false, slots === 4 ? 64 : size * 4, i * 16);
    if (divisor) gl.vertexAttribDivisor(location + i, divisor);
  }
  return buffer;
}

export type Mesh = { vao: WebGLVertexArrayObject; count: number; buffers: WebGLBuffer[]; dispose: () => void };

/** three.js's PlaneGeometry(width, height, widthSegments, heightSegments), bound to `program`'s position and uv. */
export function plane(gl: GL, program: Program, width: number, height: number, widthSegments = 1, heightSegments = 1): Mesh {
  const hw = width / 2;
  const hh = height / 2;
  const gx = Math.floor(widthSegments);
  const gy = Math.floor(heightSegments);
  const gx1 = gx + 1;
  const gy1 = gy + 1;
  const sw = width / gx;
  const sh = height / gy;
  const positions = new Float32Array(gx1 * gy1 * 3);
  const uvs = new Float32Array(gx1 * gy1 * 2);
  let p = 0;
  let t = 0;
  for (let iy = 0; iy < gy1; iy++) {
    const y = iy * sh - hh;
    for (let ix = 0; ix < gx1; ix++) {
      positions[p++] = ix * sw - hw;
      positions[p++] = -y;
      positions[p++] = 0;
      uvs[t++] = ix / gx;
      uvs[t++] = 1 - iy / gy;
    }
  }
  const indices = new Uint16Array(gx * gy * 6);
  let k = 0;
  for (let iy = 0; iy < gy; iy++) {
    for (let ix = 0; ix < gx; ix++) {
      const a = ix + gx1 * iy;
      const b = ix + gx1 * (iy + 1);
      const c = ix + 1 + gx1 * (iy + 1);
      const d = ix + 1 + gx1 * iy;
      indices[k++] = a; indices[k++] = b; indices[k++] = d;
      indices[k++] = b; indices[k++] = c; indices[k++] = d;
    }
  }
  const vao = gl.createVertexArray()!;
  gl.bindVertexArray(vao);
  const buffers = [attribute(gl, program.attrib('position'), positions, 3), attribute(gl, program.attrib('uv'), uvs, 2)];
  const index = gl.createBuffer()!;
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
  buffers.push(index);
  gl.bindVertexArray(null);
  return {
    vao,
    count: indices.length,
    buffers,
    dispose: () => {
      buffers.forEach((b) => gl.deleteBuffer(b));
      gl.deleteVertexArray(vao);
    },
  };
}

/** Load an image the way three.js's TextureLoader does. */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** An sRGB image texture, uploaded like a three.js Texture with SRGBColorSpace, linear filtering and clamped edges. */
export function imageTexture(gl: GL, img: HTMLImageElement, unit = 0) {
  const texture = gl.createTexture()!;
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.SRGB8_ALPHA8, img.width, img.height);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, img);
  return texture;
}

/** Bind `texture` to a texture unit. */
export function bindTexture(gl: GL, texture: WebGLTexture, unit = 0) {
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, texture);
}

/** A CSS colour channel (0-255) in linear light, as three.js's Color stores it. */
export function linear(channel: number) {
  const c = Math.min(255, channel) / 255;
  return c < 0.04045 ? c * 0.0773993808 : Math.pow(c * 0.9478672986 + 0.0521327014, 2.4);
}

/** A CSS rgb() colour in linear light. */
export function rgb(css: string): [number, number, number] {
  const [r, g, b] = css.match(/\d+/g)!.map(Number);
  return [linear(r), linear(g), linear(b)];
}

/** Release the context right away (three.js's forceContextLoss). */
export function loseContext(gl: GL) {
  gl.getExtension('WEBGL_lose_context')?.loseContext();
}

/** Column-major perspective projection, as three.js's PerspectiveCamera (zoom 1, no view offset). */
export function perspective(fov: number, aspect: number, near: number, far: number) {
  const top = (near * Math.tan((Math.PI / 180) * 0.5 * fov)) / 1;
  const height = 2 * top;
  const width = aspect * height;
  const left = -0.5 * width;
  const right = left + width;
  const bottom = top - height;
  const x = (2 * near) / (right - left);
  const y = (2 * near) / (top - bottom);
  const a = (right + left) / (right - left);
  const b = (top + bottom) / (top - bottom);
  const c = -(far + near) / (far - near);
  const d = (-2 * far * near) / (far - near);
  return new Float32Array([x, 0, 0, 0, 0, y, 0, 0, a, b, c, -1, 0, 0, d, 0]);
}

/** Column-major orthographic projection, as three.js's OrthographicCamera (zoom 1, no view offset). */
export function orthographic(l: number, r: number, t: number, btm: number, near: number, far: number) {
  const dx = (r - l) / 2;
  const dy = (t - btm) / 2;
  const cx = (r + l) / 2;
  const cy = (t + btm) / 2;
  const left = cx - dx;
  const right = cx + dx;
  const top = cy + dy;
  const bottom = cy - dy;
  const x = 2 / (right - left);
  const y = 2 / (top - bottom);
  const a = -(right + left) / (right - left);
  const b = -(top + bottom) / (top - bottom);
  const c = -2 / (far - near);
  const d = -(far + near) / (far - near);
  return new Float32Array([x, 0, 0, 0, 0, y, 0, 0, 0, 0, c, 0, a, b, d, 1]);
}

/** Column-major model-view for a camera on the z axis looking at the origin and an object scaled then moved. */
export function modelView(cameraZ: number, scaleX = 1, scaleY = 1, z = 0) {
  return new Float32Array([scaleX, 0, 0, 0, 0, scaleY, 0, 0, 0, 0, 1, 0, 0, 0, z - cameraZ, 1]);
}
