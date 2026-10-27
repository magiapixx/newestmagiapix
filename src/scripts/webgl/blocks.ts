/*! @license MIT
 * Adapted from "codrops-batchedmesh" (https://github.com/ULuIQ12/codrops-batchedmesh), Copyright (c) Christophe
 * Choffel, as is public/webgl/blocks.glb. The minifier drops this comment, so the notice also ships as
 * public/webgl/LICENSE.txt.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of
 * the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
 * WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/**
 * Blocks: a field of chunky blocks (some topped with a "+", a peg, a hole... or a button) whose heights roll in slow
 * waves. Blocks near the pointer rise, and a ripple runs out from the middle when the field first appears. Black
 * blocks, with many of the "+" and button tops and the odd other one in mint, seen by a fixed camera, with ambient
 * occlusion, depth of field and a vignette. The button tops follow the shapes on uiverse.io/buttons: pills, stepped
 * "pushable" buttons, outline pills, rounded-square icon buttons and round buttons in a bezel.
 *
 * Adapted from Christophe Choffel's "BatchedMesh and WebGPURenderer" Codrops demo
 * (https://github.com/ULuIQ12/codrops-batchedmesh, MIT), including its block model (public/webgl/blocks.glb). It needs
 * three.js, so index.ts only loads it on pages that use it. three's WebGPURenderer falls back to WebGL 2 where WebGPU is
 * missing.
 *
 * Host: <canvas data-gl="blocks">
 */
import {
  ACESFilmicToneMapping,
  BatchedMesh,
  Color,
  ExtrudeGeometry,
  MathUtils,
  Matrix4,
  Mesh,
  MeshPhysicalNodeMaterial,
  MeshStandardNodeMaterial,
  PMREMGenerator,
  Path,
  PerspectiveCamera,
  Plane,
  PlaneGeometry,
  Raycaster,
  RenderPipeline,
  Scene,
  Shape,
  Vector2,
  Vector3,
  WebGPURenderer,
  type BufferGeometry,
} from 'three/webgpu';
import { clamp, mrt, normalView, output, pass, screenUV, uniform, vec4 } from 'three/tsl';
import { dof } from 'three/examples/jsm/tsl/display/DepthOfFieldNode.js';
import { fxaa } from 'three/examples/jsm/tsl/display/FXAANode.js';
import { ao } from 'three/examples/jsm/tsl/display/GTAONode.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';
import { mergeGeometries, mergeVertices, toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const SETTINGS = {
  model: '/webgl/blocks.glb',
  /** field size in grid cells: smaller on small or low-power devices, which also skip occlusion and depth of field */
  grid: 148,
  gridSmall: 96,
  /** share of square blocks topped with a "+" (like the site's plus marks), and of those in the accent colour */
  crossShare: 0.35,
  crossAccent: 0.55,
  /** share of long blocks topped with a pill, pushable or outline button, of square blocks topped with a rounded-square
   * or round one, and of buttons in the accent colour */
  longButtonShare: 0.55,
  squareButtonShare: 0.2,
  buttonAccent: 0.33,
  /** share of the other block tops in the accent colour */
  accentShare: 0.02,
  base: 0x000000,
  tops: [0x101010, 0x181818, 0x202020, 0x282828],
  accent: 0x00ffa1,
  ground: 0x050505,
  /** wave height, and how far (in grid cells) and how high blocks rise around the pointer */
  waves: 8,
  reach: 10,
  lift: 5,
  /** seconds before the opening ripple, and how long it runs */
  rippleDelay: 0.4,
  rippleDuration: 5,
  exposure: 0.9,
  /** depth of field: how far from the focus blocks go fully soft (world units), and the bokeh size */
  focalLength: 60,
  bokeh: 1.5,
};

/** the model's tops, then its bases; each top sits on the base this maps it to */
const TOPS = ['Square_Top', 'Quart_Top', 'Hole_Top', 'Peg_Top', 'Divot_Top', 'Cross_Top'];
const CROSS = TOPS.indexOf('Cross_Top');
const BASES = ['Square_Base', 'Quart_Base', 'Hole_Base'];
const BASE_OF_TOP = [6, 7, 8, 6, 6, 6];

/** button tops for long blocks (a pill twice as often as the others) and for square ones */
type ButtonKind = 'pill' | 'pushable' | 'outline' | 'key' | 'round';
const LONG_BUTTONS: ButtonKind[] = ['pill', 'pill', 'pushable', 'outline'];
const SQUARE_BUTTONS: ButtonKind[] = ['key', 'round'];
/** button proportions, in grid cells: gap to the block's edge, rounded edge, height of the body, corner radius of the
 * pushable and rounded-square buttons (as a share of their short side), and the outline's border */
const BUTTON = { inset: 0.12, bevel: 0.04, depth: 0.1, corner: 0.22, border: 0.09 };

type Block = {
  /** footprint centre and size, in grid cells */
  x: number;
  z: number;
  sx: number;
  sz: number;
  /** where its wave noise is sampled */
  nx: number;
  ny: number;
  rotation: number;
  /** one of the model's tops (TOPS index), or a button */
  top: number | ButtonKind;
  height: number;
};

const pick = <T>(list: T[]) => list[Math.floor(Math.random() * list.length)];

/** A w x d (x by z) outline with its corners rounded by r, centred on the origin; r of half the short side is a pill. */
function roundedRect<T extends Path>(path: T, w: number, d: number, r: number) {
  const x = w / 2;
  const z = d / 2;
  r = Math.min(r, x, z);
  path.absarc(x - r, -z + r, r, -Math.PI / 2, 0);
  path.absarc(x - r, z - r, r, 0, Math.PI / 2);
  path.absarc(-x + r, z - r, r, Math.PI / 2, Math.PI);
  path.absarc(-x + r, -z + r, r, Math.PI, Math.PI * 1.5);
  return path;
}

/** A circle, drawn as four quarter arcs like the rounded corners so it gets as many points as they do. */
const circle = <T extends Path>(path: T, r: number) => roundedRect(path, 2 * r, 2 * r, r);

/**
 * Extrude a flat outline upwards into a slab `depth` tall with a rounded edge of `bevel`, standing on y = `y`. Kept
 * light, as a thousand of these can be on screen: each quarter arc gets 6 segments (three draws an arc with twice the
 * curve segments) and the edge 3, about the detail of the model's own tops.
 */
function slab(shape: Shape, depth: number, bevel: number, y = 0) {
  const g = new ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 3 });
  // the extrusion runs along +z: turn it to +y (the outline's y becomes -z), with the lower bevel on the block
  g.rotateX(-Math.PI / 2);
  g.translate(0, y + bevel, 0);
  return g;
}

/**
 * A button top for a w x d block, at its true size so its rounded corners stay round on long blocks. Its rounded edges
 * are shaded smooth, and it is indexed with the model's attributes (position, normal, uv) so it batches with them.
 */
function buttonGeometry(kind: ButtonKind, w: number, d: number) {
  const { inset, bevel, depth, corner, border } = BUTTON;
  // the outline grows by the bevel, so draw it that much inside the gap
  const bw = w - 2 * (inset + bevel);
  const bd = d - 2 * (inset + bevel);
  const short = Math.min(bw, bd);
  let parts: ExtrudeGeometry[];
  switch (kind) {
    case 'pill':
      parts = [slab(roundedRect(new Shape(), bw, bd, short / 2), depth, bevel)];
      break;
    case 'pushable': {
      // a face stepped up on a slightly wider skirt, like the solid edge under a "pushable" button
      const skirt = 0.05;
      const step = 0.07;
      parts = [
        slab(roundedRect(new Shape(), bw, bd, short * corner), skirt, bevel / 2),
        slab(roundedRect(new Shape(), bw - 2 * step, bd - 2 * step, (short - 2 * step) * corner), depth, bevel, skirt + bevel),
      ];
      break;
    }
    case 'outline': {
      const ring = roundedRect(new Shape(), bw, bd, short / 2);
      ring.holes.push(roundedRect(new Path(), bw - 2 * border, bd - 2 * border, short / 2 - border));
      parts = [slab(ring, depth / 2, bevel / 2)];
      break;
    }
    case 'key':
      parts = [slab(roundedRect(new Shape(), bw, bd, short * corner), depth * 1.2, bevel)];
      break;
    case 'round': {
      // a domed cap inside a low bezel ring
      const r = short / 2;
      const bezel = circle(new Shape(), r);
      bezel.holes.push(circle(new Path(), r * 0.84));
      parts = [slab(bezel, depth / 2, bevel / 2), slab(circle(new Shape(), r * 0.72), depth * 1.4, bevel)];
      break;
    }
  }
  const merged = parts.length > 1 ? mergeGeometries(parts) : parts[0];
  // smooth across the 30° steps of the rounded edge and the 15° steps around the corners, sharp elsewhere
  const smooth = mergeVertices(toCreasedNormals(merged, Math.PI / 5));
  smooth.clearGroups();
  parts.forEach((p) => p.dispose());
  return smooth;
}

// Inigo Quilez's remapping functions (https://iquilezles.org/articles/functions/)
const gain = (x: number, k: number) => {
  const a = 0.5 * Math.pow(2 * (x < 0.5 ? x : 1 - x), k);
  return x < 0.5 ? a : 1 - a;
};
const cubicPulse = (c: number, w: number, x: number) => {
  let d = Math.abs(x - c);
  if (d > w) return 0;
  d /= w;
  return 1 - d * d * (3 - 2 * d);
};

/** Fill a size x size grid with blocks of random sizes and kinds, row by row (as the original demo does). */
function layOut(size: number) {
  const blocks: Block[] = [];
  const taken: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const max = new Vector2();
  max.x = max.y = MathUtils.randInt(1, 5);
  for (let py = 0; py < size; py++) {
    let px = 0;
    while (px < size) {
      let room = 0;
      for (let i = px; i < Math.min(size, px + max.x) && !taken[i][py]; i++) room++;
      if (room === 0) {
        px++;
        continue;
      }
      const square = Math.random() < 0.5;
      const sx = MathUtils.randInt(1, room);
      const sz = square ? sx : MathUtils.randInt(1, max.y);
      for (let i = px; i < Math.min(size, px + sx); i++) for (let j = py; j < Math.min(size, py + sz); j++) taken[i][j] = true;
      // only square blocks take the model's shaped tops; long ones get a plain top or a button
      const s = SETTINGS;
      const roll = Math.random();
      let top: Block['top'] = 0;
      if (!square) top = roll < s.longButtonShare ? pick(LONG_BUTTONS) : 0;
      else if (roll < s.crossShare) top = CROSS;
      else if (roll < s.crossShare + s.squareButtonShare) top = pick(SQUARE_BUTTONS);
      else top = MathUtils.randInt(0, CROSS - 1);
      blocks.push({
        x: px + sx / 2,
        z: py + sz / 2,
        sx,
        sz,
        nx: px * 0.1,
        ny: py,
        // a square block can face any way, a long one only two
        rotation: square ? (MathUtils.randInt(0, 4) * Math.PI) / 2 : MathUtils.randInt(0, 2) * Math.PI,
        top,
        height: 1,
      });
      px += sx;
    }
    // the size limits sometimes change after a row, which gives the field some structure
    if (Math.random() > 0.8) {
      max.x = Math.random() > 0.5 ? 2 : 5;
      max.y = Math.random() > 0.5 ? 2 : 5;
    }
  }
  return blocks;
}

/** Wait until `host` has a size: a canvas set up at zero size never recovers its render targets. */
function sized(host: HTMLElement) {
  return new Promise<void>((resolve) => {
    const observer = new ResizeObserver(() => {
      if (host.clientWidth > 1 && host.clientHeight > 1) {
        observer.disconnect();
        resolve();
      }
    });
    observer.observe(host);
  });
}

async function start(canvas: HTMLCanvasElement, host: HTMLElement, cancelled: () => boolean) {
  const s = SETTINGS;
  await sized(host);
  if (cancelled()) return;
  const small = Math.min(host.clientWidth, host.clientHeight) < 600 || (navigator.hardwareConcurrency ?? 8) <= 4;
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = new WebGPURenderer({ canvas, antialias: false });
  renderer.setPixelRatio(1);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = s.exposure;
  await renderer.init();
  if (cancelled()) return void renderer.dispose();

  // the camera stays where the original demo first puts it
  const camera = new PerspectiveCamera(20, 1, 0.1, 500);
  const angle = (-Math.PI * 2) / 3;
  const distance = 100;
  const fit = new Vector3(Math.cos(angle), 0, Math.sin(distance)).multiplyScalar(10);
  camera.position.set(Math.cos(angle) * distance, 55, Math.sin(angle) * distance).add(fit);
  camera.lookAt(fit);

  // post-processing: colour, normals and depth -> ambient occlusion -> depth of field -> vignette -> FXAA
  const post = new RenderPipeline(renderer);
  const scene = new Scene();
  const scenePass = pass(scene, camera);
  const color = scenePass.getTextureNode('output');
  const vignette = clamp(screenUV.sub(0.5).length().mul(1.2), 0.0, 1.0).oneMinus().pow(0.5);
  // focus on the point the camera looks at, as the demo's auto-focus settles on
  const ground = new Plane(new Vector3(0, 1, 0), camera.position.y * 0.1);
  const look = new Vector3();
  camera.getWorldDirection(look);
  const focusPoint = new Vector3();
  new Raycaster(camera.position, look).ray.intersectPlane(ground, focusPoint);
  const focusDistance = focusPoint.distanceTo(camera.position);
  if (small) {
    post.outputNode = fxaa(color.mul(vignette));
  } else {
    scenePass.setMRT(mrt({ output, normal: normalView }));
    const occlusion = ao(scenePass.getTextureNode('depth'), scenePass.getTextureNode('normal'), camera);
    occlusion.distanceExponent.value = 1;
    occlusion.distanceFallOff.value = 0.1;
    occlusion.radius.value = 1.0;
    occlusion.scale.value = 1.5;
    occlusion.thickness.value = 1;
    const shaded = vec4(color.rgb.mul(occlusion.getTextureNode().r), color.a);
    const blurred = dof(shaded, scenePass.getViewZNode(), uniform(focusDistance * 0.85), uniform(s.focalLength), uniform(s.bokeh));
    post.outputNode = fxaa(blurred.mul(vignette));
  }

  const gltf = await new GLTFLoader().loadAsync(s.model);
  if (cancelled()) return void renderer.dispose();

  // a neutral studio light for the reflections (the demo's blue sky tinted the black blocks); the background stays black
  const pmrem = new PMREMGenerator(renderer);
  const sky = (await pmrem.fromSceneAsync(new RoomEnvironment(), 0.04)).texture;
  pmrem.dispose();
  scene.environment = sky;
  scene.background = new Color(s.base);

  const size = small ? s.gridSmall : s.grid;
  const floor = new Mesh(new PlaneGeometry(size, size), new MeshStandardNodeMaterial({ color: s.ground }));
  floor.rotateX(-Math.PI / 2);
  scene.add(floor);

  // every block is two instances of one BatchedMesh: a base stretched to its height, and a top laid on it
  const model = [...TOPS, ...BASES].map((name) => (gltf.scene.getObjectByName(name) as Mesh).geometry as BufferGeometry);
  const blocks = layOut(size);
  // the geometries the field uses, each stored once in the batch: the model's, and a button per kind and block size
  const used: BufferGeometry[] = [];
  const slot = new Map<BufferGeometry | string, number>();
  const use = (key: BufferGeometry | string, make: () => BufferGeometry) => {
    let i = slot.get(key);
    if (i === undefined) slot.set(key, (i = used.push(make()) - 1));
    return i;
  };
  const parts = blocks.map((b) => {
    const top = b.top;
    if (typeof top === 'number') return [use(model[BASE_OF_TOP[top]], () => model[BASE_OF_TOP[top]]), use(model[top], () => model[top])];
    return [use(model[BASE_OF_TOP[0]], () => model[BASE_OF_TOP[0]]), use(`${top} ${b.sx}x${b.sz}`, () => buttonGeometry(top, b.sx, b.sz))];
  });
  const vertices = used.reduce((n, g) => n + g.attributes.position.count, 0);
  const indices = used.reduce((n, g) => n + g.index!.count, 0);
  const material = new MeshPhysicalNodeMaterial({ roughness: 0.1, metalness: 0 });
  material.envMapIntensity = 0.25;
  const mesh = new BatchedMesh(blocks.length * 2, vertices, indices, material);
  mesh.sortObjects = false;
  mesh.position.set(-size / 2, 0, -size / 2);
  scene.add(mesh);
  const ids = used.map((g) => mesh.addGeometry(g));
  const base = new Color(s.base);
  const tops = s.tops.map((c) => new Color(c));
  const accent = new Color(s.accent);
  blocks.forEach((b, i) => {
    mesh.addInstance(ids[parts[i][0]]);
    mesh.addInstance(ids[parts[i][1]]);
    mesh.setColorAt(i * 2, base);
    const share = b.top === CROSS ? s.crossAccent : typeof b.top === 'string' ? s.buttonAccent : s.accentShare;
    mesh.setColorAt(i * 2 + 1, Math.random() < share ? accent : tops[MathUtils.randInt(0, tops.length - 1)]);
  });

  // the opening ripple runs out from where the demo centred it
  const rippleCentre = new Vector3();
  new Raycaster(camera.position.clone().setY(camera.position.y - 10), look).ray.intersectPlane(ground, rippleCentre);

  // the pointer, projected onto the ground
  const raycaster = new Raycaster();
  const ndc = new Vector2();
  const pointer = new Vector3(1e5, 0, 1e5);
  const groundPlane = new Plane(new Vector3(0, 1, 0), 0);
  let clientX = -1e4;
  let clientY = -1e4;
  const onMove = (e: PointerEvent) => {
    clientX = e.clientX;
    clientY = e.clientY;
  };
  const placePointer = () => {
    const r = host.getBoundingClientRect();
    const x = (clientX - r.left) / r.width;
    const y = (clientY - r.top) / r.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return void pointer.set(1e5, 0, 1e5);
    raycaster.setFromCamera(ndc.set(x * 2 - 1, -y * 2 + 1), camera);
    if (!raycaster.ray.intersectPlane(groundPlane, pointer)) pointer.set(1e5, 0, 1e5);
  };

  const noise = new SimplexNoise();
  // two octaves of simplex noise scaled to 0..1, like the demo's fast-simplex-noise settings
  const waveAt = (x: number, y: number) => {
    let sum = 0;
    let amplitude = 1;
    let frequency = 0.05;
    for (let o = 0; o < 2; o++) {
      sum += noise.noise(x * frequency, y * frequency) * amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }
    return (sum / 1.5 + 1) / 2;
  };

  const matrix = new Matrix4();
  const place = (index: number, b: Block, y: number, sx: number, sy: number, sz: number) => {
    // translate * rotateY * scale, written out
    const c = Math.cos(b.rotation);
    const sn = Math.sin(b.rotation);
    matrix.set(c * sx, 0, sn * sz, b.x, 0, sy, 0, y, -sn * sx, 0, c * sz, b.z, 0, 0, 0, 1);
    mesh.setMatrixAt(index, matrix);
  };

  let elapsed = 0;
  const update = (dt: number) => {
    if (!still) elapsed += dt;
    placePointer();
    const t = MathUtils.clamp((elapsed - s.rippleDelay) / s.rippleDuration, 0, 1);
    const echoT = MathUtils.clamp((elapsed - s.rippleDelay - 0.3) / s.rippleDuration, 0, 1);
    const rising = 1 - Math.pow(0.9, dt * 60);
    const falling = 1 - Math.pow(0.7, dt * 60);
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      const dx = b.x + mesh.position.x - pointer.x;
      const dz = b.z + mesh.position.z - pointer.z;
      const near = MathUtils.clamp(1 - Math.sqrt(dx * dx + dz * dz) / s.reach, 0, 1);
      let target = waveAt(b.nx, b.ny + elapsed * 5) * s.waves + 1 + near * s.lift;
      if (t < 1 && !still) {
        const fromCentre = MathUtils.clamp(Math.hypot(b.x - rippleCentre.x - size / 2, b.z - rippleCentre.z - size / 2) / size / 2, 0, 1);
        target += cubicPulse(Math.pow(gain(t, 1.1), 0.9), 0.05, fromCentre) * 10 + cubicPulse(gain(echoT, 1.3), 0.025, fromCentre) * 5;
      }
      // blocks rise slower than they drop
      b.height += (target - b.height) * (target >= b.height ? rising : falling);
      place(i * 2, b, 0, b.sx, b.height, b.sz);
      // the model's tops are unit squares stretched to the block; buttons are already drawn at its size
      if (typeof b.top === 'number') place(i * 2 + 1, b, b.height, b.sx, 1, b.sz);
      else place(i * 2 + 1, b, b.height, 1, 1, 1);
    }
  };

  const resize = () => {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (w < 2 || h < 2) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };

  // run only while the hero is on screen and the tab is visible
  let inView = true;
  let pageVisible = document.visibilityState !== 'hidden';
  let running = false;
  let last = 0;
  const frame = (now: number) => {
    const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
    last = now;
    update(dt);
    post.render();
  };
  const sync = () => {
    const run = inView && pageVisible;
    if (run === running) return;
    running = run;
    last = 0;
    renderer.setAnimationLoop(run ? frame : null);
  };
  const onVisibility = () => {
    pageVisible = document.visibilityState !== 'hidden';
    sync();
  };

  resize();
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  const intersectionObserver = new IntersectionObserver((entries) => {
    if (!entries[0]) return;
    inView = entries[0].isIntersecting;
    sync();
  });
  intersectionObserver.observe(host);
  window.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);
  update(0);
  sync();

  return () => {
    renderer.setAnimationLoop(null);
    resizeObserver.disconnect();
    intersectionObserver.disconnect();
    window.removeEventListener('pointermove', onMove);
    document.removeEventListener('visibilitychange', onVisibility);
    mesh.dispose();
    material.dispose();
    floor.geometry.dispose();
    floor.material.dispose();
    sky.dispose();
    renderer.dispose();
  };
}

export function mountBlocks(canvas: HTMLCanvasElement) {
  const host = canvas.parentElement!;
  let disposed = false;
  let stop: (() => void) | undefined;
  start(canvas, host, () => disposed)
    .then((dispose) => {
      if (disposed) dispose?.();
      else stop = dispose;
    })
    .catch((error) => console.warn('blocks effect could not start:', error));
  return () => {
    disposed = true;
    stop?.();
  };
}
