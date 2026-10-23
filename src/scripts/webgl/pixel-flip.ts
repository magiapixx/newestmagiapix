/**
 * Pixel Flip Grid: the image is drawn as a grid of square tiles; tiles near
 * the pointer (and along its short trail) flip over in 3D, then settle back.
 *
 * Host: <canvas data-gl="pixel-flip" data-src="/images/…">
 */
import * as THREE from 'three';
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
  let texture: THREE.Texture | null = null;
  let imageMesh: THREE.Mesh | null = null;
  let tiles: THREE.InstancedMesh | null = null;
  let flipAttr: THREE.InstancedBufferAttribute | null = null;
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

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(s.perspective, 1, 0.1, 1e4);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0, 0);
  renderer.setPixelRatio(THREE.MathUtils.clamp(s.dpr, 0.5, 2));

  const updateCamera = () => {
    camera.aspect = width / height;
    camera.fov = s.perspective;
    camera.position.set(0, 0, (height * 0.5) / Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)));
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  };

  const disposeMesh = (mesh: THREE.Mesh | null) => {
    if (!mesh) return;
    scene.remove(mesh);
    mesh.geometry.dispose();
    (mesh.material as THREE.Material).dispose();
  };

  const buildImage = () => {
    if (!texture) return;
    disposeMesh(imageMesh);
    const img = texture.image as HTMLImageElement;
    imageMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.ShaderMaterial({
        uniforms: {
          uTexture: { value: texture },
          uResolution: { value: new THREE.Vector2(width, height) },
          uImageSize: { value: new THREE.Vector2(img.width, img.height) },
        },
        vertexShader: imageVertex,
        fragmentShader: imageFragment,
        depthWrite: false,
        depthTest: false,
      }),
    );
    imageMesh.renderOrder = 0;
    scene.add(imageMesh);
  };

  const buildTiles = () => {
    if (!texture) return;
    disposeMesh(tiles);
    active.clear();
    cols = Math.ceil(width / cell);
    rows = Math.ceil(height / cell);
    const count = cols * rows;
    const size = Math.max(1, cell - gap);
    flip = new Float32Array(count);
    centers = new Float32Array(count * 2);
    stamp = new Uint32Array(count);
    frame = 0;
    const geometry = new THREE.PlaneGeometry(1, 1, 1, 1);
    flipAttr = new THREE.InstancedBufferAttribute(flip, 1);
    flipAttr.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('aFlip', flipAttr);
    const img = texture.image as HTMLImageElement;
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: texture },
        uResolution: { value: new THREE.Vector2(width, height) },
        uImageSize: { value: new THREE.Vector2(img.width, img.height) },
        uTileUvScale: { value: new THREE.Vector2(size / width, size / height) },
        uInversion: { value: s.inversion },
        uShade: { value: s.shade },
      },
      vertexShader: tileVertex,
      fragmentShader: tileFragment,
      side: THREE.DoubleSide,
      depthWrite: true,
      depthTest: true,
    });
    tiles = new THREE.InstancedMesh(geometry, material, count);
    tiles.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    tiles.frustumCulled = false;
    tiles.position.z = 2;
    tiles.renderOrder = 1;
    const m = new THREE.Matrix4();
    const p = new THREE.Vector3();
    const q = new THREE.Quaternion();
    const sc = new THREE.Vector3(size, size, 1);
    let i = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * cell + cell * 0.5 - width * 0.5;
        const y = height * 0.5 - r * cell - cell * 0.5;
        p.set(x, y, 0);
        m.compose(p, q, sc);
        tiles.setMatrixAt(i, m);
        centers[i * 2] = x;
        centers[i * 2 + 1] = y;
        i++;
      }
    }
    tiles.instanceMatrix.needsUpdate = true;
    scene.add(tiles);
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
    renderer.setSize(width, height, false);
    updateCamera();
    if (texture) {
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
    if (!tiles || !flipAttr) return false;
    const radius = Math.max(1, s.radius);
    const r2 = radius * radius;
    const inner = radius * (1 - THREE.MathUtils.clamp(s.feather / 100, 0, 1));
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
          const k = THREE.MathUtils.clamp((Math.sqrt(d2) - inner) / band, 0, 1);
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
    if (changed) {
      flipAttr.clearUpdateRanges();
      if (Number.isFinite(lo)) flipAttr.addUpdateRange(lo, hi - lo + 1);
      flipAttr.needsUpdate = true;
    }
    return trail.length > 0 || active.size > 0;
  };

  const resetFlips = () => {
    trail.length = 0;
    active.clear();
    pointer.lastX = Infinity;
    pointer.lastY = Infinity;
    if (flip.length > 0 && flipAttr) {
      flip.fill(0);
      flipAttr.clearUpdateRanges();
      flipAttr.addUpdateRange(0, flip.length);
      flipAttr.needsUpdate = true;
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
    renderer.render(scene, camera);
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
  renderer.setSize(width, height, false);
  updateCamera();

  const loader = new THREE.TextureLoader();
  loader.setCrossOrigin('anonymous');
  loader.load(
    src,
    (t) => {
      if (disposed) return t.dispose();
      texture = t;
      t.colorSpace = THREE.SRGBColorSpace;
      t.minFilter = THREE.LinearFilter;
      t.magFilter = THREE.LinearFilter;
      t.generateMipmaps = false;
      buildImage();
      buildTiles();
      start();
    },
    undefined,
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
    disposeMesh(imageMesh);
    disposeMesh(tiles);
    texture?.dispose();
    scene.clear();
    renderer.dispose();
  };
}
