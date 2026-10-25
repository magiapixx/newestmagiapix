/**
 * Pixel Flip Grid: the image is drawn as a grid of square tiles; tiles near
 * the pointer (and along its short trail) flip over in 3D, then settle back.
 *
 * Host: <canvas data-gl="pixel-flip" data-src="/images/…">
 */
import { attribute, bindTexture, clear, createContext, createProgram, drawState, imageTexture, loadImage, modelView, perspective, plane, setSize, type Mesh } from './gl';
import { imageFragment, imageVertex, tileFragment, tileVertex } from './pixel-flip.glsl';

const SETTINGS = {
  radius: 260,
  flipSpeed: 12,
  returnSpeed: 1.5,
  trailLength: 6,
  trailDecay: 3.2,
  cellSize: 30,
  gap: 0,
  feather: 95,
  inversion: 0,
  shade: 0.03,
  perspective: 8,
  dpr: 2,
};

type TrailPoint = { x: number; y: number; life: number };
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const DEG2RAD = Math.PI / 180;

export function mountPixelFlip(canvas: HTMLCanvasElement) {
  const src = canvas.dataset.src;
  if (!src) return;
  const s = SETTINGS;
  const cell = Math.max(1, s.cellSize);
  const gap = Math.max(0, s.gap);

  let disposed = false;
  let raf = 0;
  let resizeRaf = 0;
  let running = false;
  let inView = true;
  let pageVisible = !document.hidden;
  let image: HTMLImageElement | null = null;
  let texture: WebGLTexture | null = null;
  let imageMesh: Mesh | null = null;
  let tiles: (Mesh & { instances: number }) | null = null;
  let flipBuffer: WebGLBuffer | null = null;
  let flip = new Float32Array();
  let centers = new Float32Array();
  let stamp = new Uint32Array();
  let frame = 0;
  let cols = 0;
  let rows = 0;
  let width = 1;
  let height = 1;
  let nextWidth = 1;
  let nextHeight = 1;
  let lastTime = 0;
  const active = new Set<number>();
  const candidates: number[] = [];
  const pointer = { x: 0, y: 0, lastX: Infinity, lastY: Infinity };
  const trail: TrailPoint[] = [];

  const gl = createContext(canvas, { alpha: true, depth: true, antialias: true, premultipliedAlpha: true });
  if (!gl) return;
  gl.clearColor(0, 0, 0, 0);
  const ratio = clamp(s.dpr, 0.5, 2);
  const imageProgram = createProgram(gl, imageVertex, imageFragment);
  const tileProgram = createProgram(gl, tileVertex, tileFragment, { instancing: true });

  // a perspective camera on the z axis, far enough back that one unit is one CSS pixel at z = 0
  const updateCamera = () => {
    const cameraZ = (height * 0.5) / Math.tan(s.perspective * 0.5 * DEG2RAD);
    const projectionMatrix = perspective(s.perspective, width / height, 0.1, 1e4);
    imageProgram.set({ projectionMatrix, modelViewMatrix: modelView(cameraZ) });
    tileProgram.set({ projectionMatrix, modelViewMatrix: modelView(cameraZ, 1, 1, 2) });
  };

  const buildImage = () => {
    if (!image) return;
    imageMesh?.dispose();
    imageMesh = plane(gl, imageProgram, width, height);
    imageProgram.set({ uTexture: 0, uResolution: [width, height], uImageSize: [image.width, image.height] });
  };

  const buildTiles = () => {
    if (!image) return;
    tiles?.dispose();
    active.clear();
    cols = Math.ceil(width / cell);
    rows = Math.ceil(height / cell);
    const count = cols * rows;
    const size = Math.max(1, cell - gap);
    flip = new Float32Array(count);
    centers = new Float32Array(count * 2);
    stamp = new Uint32Array(count);
    frame = 0;
    // one scale-and-move matrix per tile
    const matrices = new Float32Array(count * 16);
    let i = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * cell + cell * 0.5 - width * 0.5;
        const y = height * 0.5 - r * cell - cell * 0.5;
        matrices.set([size, 0, 0, 0, 0, size, 0, 0, 0, 0, 1, 0, x, y, 0, 1], i * 16);
        centers[i * 2] = x;
        centers[i * 2 + 1] = y;
        i++;
      }
    }
    const mesh = plane(gl, tileProgram, 1, 1, 1, 1);
    gl.bindVertexArray(mesh.vao);
    const instanceBuffer = attribute(gl, tileProgram.attrib('instanceMatrix'), matrices, 16, { divisor: 1 });
    const flips = attribute(gl, tileProgram.attrib('aFlip'), flip, 1, { divisor: 1, usage: gl.DYNAMIC_DRAW });
    gl.bindVertexArray(null);
    flipBuffer = flips;
    tiles = {
      ...mesh,
      instances: count,
      dispose: () => {
        gl.deleteBuffer(instanceBuffer);
        gl.deleteBuffer(flips);
        mesh.dispose();
      },
    };
    tileProgram.set({
      uTexture: 0,
      uResolution: [width, height],
      uImageSize: [image.width, image.height],
      uTileUvScale: [size / width, size / height],
      uInversion: s.inversion,
      uShade: s.shade,
    });
  };

  const uploadFlips = (lo: number, hi: number) => {
    if (!flipBuffer) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, flipBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, lo * 4, flip, lo, hi - lo + 1);
  };

  // the image first, then the tiles over it (depth-tested against each other)
  const render = () => {
    clear(gl);
    if (texture) bindTexture(gl, texture);
    if (imageMesh) {
      gl.useProgram(imageProgram.program);
      drawState(gl, { depth: false, doubleSide: false });
      gl.bindVertexArray(imageMesh.vao);
      gl.drawElements(gl.TRIANGLES, imageMesh.count, gl.UNSIGNED_SHORT, 0);
    }
    if (tiles) {
      gl.useProgram(tileProgram.program);
      drawState(gl, { depth: true, doubleSide: true });
      gl.bindVertexArray(tiles.vao);
      gl.drawElementsInstanced(gl.TRIANGLES, tiles.count, gl.UNSIGNED_SHORT, 0, tiles.instances);
    }
  };

  const start = () => {
    if (disposed || running || !inView || !pageVisible) return;
    running = true;
    lastTime = performance.now();
    raf = requestAnimationFrame(tick);
  };

  const applyResize = () => {
    resizeRaf = 0;
    if (disposed || (nextWidth === width && nextHeight === height)) return;
    width = nextWidth;
    height = nextHeight;
    setSize(gl, width, height, ratio);
    updateCamera();
    if (image) {
      buildImage();
      buildTiles();
    }
    start();
  };

  const onResize = () => {
    const r = canvas.getBoundingClientRect();
    nextWidth = Math.max(1, Math.round(r.width));
    nextHeight = Math.max(1, Math.round(r.height));
    if (resizeRaf === 0) resizeRaf = requestAnimationFrame(applyResize);
  };

  const pushTrail = (x: number, y: number) => {
    const minStep = Math.max(3, cell * 0.45);
    const dx = x - pointer.lastX;
    const dy = y - pointer.lastY;
    if (dx * dx + dy * dy < minStep * minStep) return false;
    trail.unshift({ x, y, life: 1 });
    const max = Math.max(1, Math.round(s.trailLength));
    if (trail.length > max) trail.length = max;
    pointer.lastX = x;
    pointer.lastY = y;
    return true;
  };

  const onMove = (e: PointerEvent) => {
    pointer.x = e.offsetX - width * 0.5;
    pointer.y = height * 0.5 - e.offsetY;
    if (pushTrail(pointer.x, pointer.y)) start();
  };

  const onLeave = () => {
    pointer.lastX = Infinity;
    pointer.lastY = Infinity;
  };

  const decayTrail = (dt: number) => {
    const max = Math.max(1, Math.round(s.trailLength));
    if (trail.length > max) trail.length = max;
    for (let i = trail.length - 1; i >= 0; i--) {
      trail[i].life -= dt * s.trailDecay;
      if (trail[i].life <= 0) trail.splice(i, 1);
    }
  };

  const mark = (i: number) => {
    if (stamp[i] !== frame) {
      stamp[i] = frame;
      candidates.push(i);
    }
  };

  const collect = (radius: number) => {
    candidates.length = 0;
    frame = (frame + 1) >>> 0;
    if (frame === 0) {
      stamp.fill(0);
      frame = 1;
    }
    const half = cell * 0.5;
    const hw = width * 0.5;
    const hh = height * 0.5;
    for (const t of trail) {
      const c0 = Math.max(0, Math.ceil((t.x - radius + hw - half) / cell));
      const c1 = Math.min(cols - 1, Math.floor((t.x + radius + hw - half) / cell));
      const r0 = Math.max(0, Math.ceil((hh - half - (t.y + radius)) / cell));
      const r1 = Math.min(rows - 1, Math.floor((hh - half - (t.y - radius)) / cell));
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) mark(r * cols + c);
    }
    active.forEach(mark);
  };

  const step = (dt: number) => {
    if (!tiles) return false;
    const radius = Math.max(1, s.radius);
    const r2 = radius * radius;
    const inner = radius * (1 - clamp(s.feather / 100, 0, 1));
    const band = radius - inner;
    const flipK = 1 - Math.exp(-s.flipSpeed * dt);
    const returnK = 1 - Math.exp(-s.returnSpeed * dt);
    collect(radius);
    let changed = false;
    let lo = Infinity;
    let hi = -1;
    for (const i of candidates) {
      const cx = centers[i * 2];
      const cy = centers[i * 2 + 1];
      let target = 0;
      for (const t of trail) {
        const dx = cx - t.x;
        const dy = cy - t.y;
        const d2 = dx * dx + dy * dy;
        if (d2 >= r2) continue;
        let w = 1;
        if (band > 0) {
          const k = clamp((Math.sqrt(d2) - inner) / band, 0, 1);
          w = 1 - k * k * (3 - 2 * k);
        }
        target = Math.max(target, w * t.life);
      }
      const prev = flip[i];
      let next = prev + (target - prev) * (target > prev ? flipK : returnK);
      if (target === 0 && next < 1e-4) next = 0;
      if (next > 0 || target > 0) active.add(i);
      else active.delete(i);
      if (Math.abs(next - prev) > 1e-6) {
        flip[i] = next;
        changed = true;
        lo = Math.min(lo, i);
        hi = Math.max(hi, i);
      }
    }
    if (changed && Number.isFinite(lo)) uploadFlips(lo, hi);
    return trail.length > 0 || active.size > 0;
  };

  const resetFlips = () => {
    trail.length = 0;
    active.clear();
    pointer.lastX = Infinity;
    pointer.lastY = Infinity;
    if (flip.length > 0) {
      flip.fill(0);
      uploadFlips(0, flip.length - 1);
    }
  };

  const stop = () => {
    if (raf !== 0) cancelAnimationFrame(raf);
    raf = 0;
    running = false;
  };

  const pause = () => {
    stop();
    resetFlips();
  };

  function tick(now: number) {
    if (disposed || !inView || !pageVisible) {
      running = false;
      return;
    }
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    decayTrail(dt);
    const more = step(dt);
    render();
    if (more) raf = requestAnimationFrame(tick);
    else {
      raf = 0;
      running = false;
    }
  }

  const onVisibility = () => {
    pageVisible = !document.hidden;
    if (pageVisible) start();
    else pause();
  };
  canvas.addEventListener('pointermove', onMove, { passive: true });
  canvas.addEventListener('pointerleave', onLeave, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);
  const resizeObserver = new ResizeObserver(onResize);
  resizeObserver.observe(canvas);
  const intersectionObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries[0]?.isIntersecting ?? true;
      if (visible === inView) return;
      inView = visible;
      if (inView) start();
      else pause();
    },
    { threshold: 0 },
  );
  intersectionObserver.observe(canvas);

  const rect = canvas.getBoundingClientRect();
  width = nextWidth = Math.max(1, Math.round(rect.width));
  height = nextHeight = Math.max(1, Math.round(rect.height));
  setSize(gl, width, height, ratio);
  updateCamera();

  loadImage(src).then(
    (img) => {
      if (disposed) return;
      image = img;
      texture = imageTexture(gl, img);
      buildImage();
      buildTiles();
      start();
    },
    () => console.warn('Pixel flip: image failed to load', src),
  );

  return () => {
    disposed = true;
    stop();
    cancelAnimationFrame(resizeRaf);
    resizeObserver.disconnect();
    intersectionObserver.disconnect();
    canvas.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('pointerleave', onLeave);
    document.removeEventListener('visibilitychange', onVisibility);
    imageMesh?.dispose();
    tiles?.dispose();
    if (texture) gl.deleteTexture(texture);
    imageProgram.dispose();
    tileProgram.dispose();
  };
}
