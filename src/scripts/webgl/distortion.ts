/**
 * Elastic image: a finely subdivided plane that stretches towards the
 * pointer's movement, with a little colour split while it moves.
 * Used for the hero image of each case study. It only redraws while the image is still settling after the
 * pointer moved, and never while it is off screen or the tab is hidden.
 *
 * Host: <div data-gl="distortion" data-src="/images/…">
 */
import { bindTexture, clear, createContext, createProgram, drawState, imageTexture, loadImage, loseContext, modelView, orthographic, plane as planeMesh, rgb, setSize } from './gl';
import { fragment, vertex } from './distortion.glsl';

const SETTINGS = {
  background: 'rgb(0, 0, 0)',
  effectRadius: 0.46,
  softness: 1.8,
  pullStrength: 0.42,
  textureWarp: 0.17,
  chromatic: 0.011,
  followSpeed: 8,
  maxMotion: 0.22,
  returnSpeed: 9,
  fillZoom: 1.1,
  dpr: 1.5,
};

type Vec = { x: number; y: number };
const lerp = (v: Vec, to: Vec, k: number) => {
  v.x += (to.x - v.x) * k;
  v.y += (to.y - v.y) * k;
};

export function mountDistortion(host: HTMLElement) {
  const src = host.dataset.src;
  const s = SETTINGS;
  let disposed = false;
  let raf = 0;

  // a canvas of its own, styled as three.js styled its renderer's canvas
  const canvas = document.createElement('canvas');
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.touchAction = 'none';
  const gl = createContext(canvas, { alpha: true, depth: true, antialias: true, premultipliedAlpha: true });
  if (!gl) return;
  host.appendChild(canvas);
  const background = rgb(s.background);
  gl.clearColor(background[0], background[1], background[2], 1);

  const program = createProgram(gl, vertex, fragment);
  // black until the image has loaded
  const placeholder = gl.createTexture()!;
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, placeholder);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, 1, 1);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
  let texture: WebGLTexture = placeholder;

  program.set({
    uTexture: 0,
    uHasTexture: 0,
    uImageSize: [1, 1],
    uBackgroundColor: background,
    uPlaneAspect: 1.6,
    uPointer: [0, 0],
    uVelocity: [0, 0],
    uRadius: s.effectRadius,
    uSoftness: s.softness,
    uPullStrength: s.pullStrength,
    uTextureWarp: s.textureWarp,
    uChromatic: s.chromatic,
  });
  const mesh = planeMesh(gl, program, 1, 1, 220, 140);
  const scale = { x: 1, y: 1 };

  const target = { x: 0, y: 0 };
  const follow = { x: 0, y: 0 };
  const velocity = { x: 0, y: 0 };
  const delta = { x: 0, y: 0 };
  let tracking = false;
  let last = performance.now();
  let inView = true;
  let pageVisible = document.visibilityState !== 'hidden';
  // start the loop (if it is not running) when something changed the picture
  const wake = () => {
    if (disposed || raf || !inView || !pageVisible) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };

  const resize = () => {
    const r = host.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width));
    const h = Math.max(1, Math.round(r.height));
    const aspect = w / h;
    const sx = aspect * 2 * s.fillZoom;
    const sy = 2 * s.fillZoom;
    scale.x = sx;
    scale.y = sy;
    program.set({
      projectionMatrix: orthographic(-aspect, aspect, 1, -1, 0.01, 10),
      modelViewMatrix: modelView(2, sx, sy),
      uPlaneAspect: sx / sy,
    });
    setSize(gl, w, h, Math.min(2, Math.max(0.5, s.dpr)));
    wake();
  };

  const track = (e: PointerEvent, snap: boolean) => {
    const r = canvas.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return;
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
    const ny = -((e.clientY - r.top) / r.height) * 2 + 1;
    target.x = (nx * (r.width / r.height)) / scale.x;
    target.y = ny / scale.y;
    if (!tracking || snap) {
      follow.x = target.x;
      follow.y = target.y;
      velocity.x = velocity.y = 0;
      tracking = true;
    }
    wake();
  };
  const onEnter = (e: PointerEvent) => track(e, true);
  const onMove = (e: PointerEvent) => track(e, false);
  canvas.addEventListener('pointerenter', onEnter);
  canvas.addEventListener('pointermove', onMove, { passive: true });
  canvas.addEventListener('pointerdown', onEnter);
  const frame = (now: number) => {
    raf = 0;
    if (disposed || !inView || !pageVisible) return;
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;
    lerp(follow, target, 1 - Math.exp(-s.followSpeed * dt));
    delta.x = target.x - follow.x;
    delta.y = target.y - follow.y;
    const len = Math.sqrt(delta.x * delta.x + delta.y * delta.y);
    if (len > s.maxMotion && len > 0) {
      delta.x *= s.maxMotion / len;
      delta.y *= s.maxMotion / len;
    }
    lerp(velocity, delta, 1 - Math.exp(-s.returnSpeed * dt));
    if (velocity.x * velocity.x + velocity.y * velocity.y < 1e-7) velocity.x = velocity.y = 0;
    program.set({ uPointer: [follow.x, follow.y], uVelocity: [velocity.x, velocity.y] });
    clear(gl);
    bindTexture(gl, texture);
    drawState(gl, { depth: false, doubleSide: true });
    gl.bindVertexArray(mesh.vao);
    gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0);
    // keep going until the pull has died out and the follow point has reached the pointer
    const dx = follow.x - target.x;
    const dy = follow.y - target.y;
    if (velocity.x * velocity.x + velocity.y * velocity.y > 0 || dx * dx + dy * dy > 1e-10) raf = requestAnimationFrame(frame);
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  resize();
  const intersectionObserver = new IntersectionObserver((entries) => {
    const e = entries[entries.length - 1];
    if (!e) return;
    inView = e.isIntersecting;
    wake();
  });
  intersectionObserver.observe(host);
  const onVisibility = () => {
    pageVisible = document.visibilityState !== 'hidden';
    wake();
  };
  document.addEventListener('visibilitychange', onVisibility);
  wake();

  if (src) {
    loadImage(src).then((img) => {
      if (disposed) return;
      texture = imageTexture(gl, img);
      program.set({ uHasTexture: 1, uImageSize: [img.naturalWidth || img.width || 1, img.naturalHeight || img.height || 1] });
      wake();
    }, () => {});
  }

  return () => {
    disposed = true;
    cancelAnimationFrame(raf);
    resizeObserver.disconnect();
    intersectionObserver.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    canvas.removeEventListener('pointerenter', onEnter);
    canvas.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('pointerdown', onEnter);
    if (texture !== placeholder) gl.deleteTexture(texture);
    gl.deleteTexture(placeholder);
    mesh.dispose();
    program.dispose();
    loseContext(gl);
    canvas.remove();
  };
}
