/**
 * Elastic image: a finely subdivided plane that stretches towards the
 * pointer's movement, with a little colour split while it moves.
 * Used for the hero image of each case study.
 *
 * Host: <div data-gl="distortion" data-src="/images/…">
 */
import * as THREE from 'three';
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

export function mountDistortion(host: HTMLElement) {
  const src = host.dataset.src;
  const s = SETTINGS;
  let disposed = false;
  let raf = 0;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 10);
  camera.position.z = 2;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const canvas = renderer.domElement;
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.touchAction = 'none';
  host.appendChild(canvas);

  const placeholder = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1, THREE.RGBAFormat);
  placeholder.needsUpdate = true;
  placeholder.minFilter = THREE.NearestFilter;
  placeholder.magFilter = THREE.NearestFilter;
  placeholder.generateMipmaps = false;
  let texture: THREE.Texture | null = null;

  const uniforms = {
    uTexture: { value: placeholder as THREE.Texture },
    uHasTexture: { value: 0 },
    uImageSize: { value: new THREE.Vector2(1, 1) },
    uBackgroundColor: { value: new THREE.Color(s.background) },
    uPlaneAspect: { value: 1.6 },
    uPointer: { value: new THREE.Vector2(0, 0) },
    uVelocity: { value: new THREE.Vector2(0, 0) },
    uRadius: { value: s.effectRadius },
    uSoftness: { value: s.softness },
    uPullStrength: { value: s.pullStrength },
    uTextureWarp: { value: s.textureWarp },
    uChromatic: { value: s.chromatic },
  };
  const geometry = new THREE.PlaneGeometry(1, 1, 220, 140);
  const material = new THREE.ShaderMaterial({ uniforms, transparent: false, depthWrite: false, depthTest: false, side: THREE.DoubleSide, vertexShader: vertex, fragmentShader: fragment });
  const plane = new THREE.Mesh(geometry, material);
  plane.frustumCulled = false;
  scene.add(plane);
  renderer.setClearColor(s.background, 1);

  const target = new THREE.Vector2();
  const follow = new THREE.Vector2();
  const velocity = new THREE.Vector2();
  const delta = new THREE.Vector2();
  const ndc = new THREE.Vector2();
  const world = new THREE.Vector2();
  let tracking = false;
  let last = performance.now();

  const resize = () => {
    const r = host.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width));
    const h = Math.max(1, Math.round(r.height));
    const aspect = w / h;
    camera.left = -aspect;
    camera.right = aspect;
    camera.top = 1;
    camera.bottom = -1;
    camera.updateProjectionMatrix();
    const sx = aspect * 2 * s.fillZoom;
    const sy = 2 * s.fillZoom;
    plane.scale.set(sx, sy, 1);
    uniforms.uPlaneAspect.value = sx / sy;
    renderer.setPixelRatio(THREE.MathUtils.clamp(s.dpr, 0.5, 2));
    renderer.setSize(w, h, false);
  };

  const track = (e: PointerEvent, snap: boolean) => {
    const r = canvas.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return;
    ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    world.set(ndc.x * (r.width / r.height), ndc.y);
    target.set((world.x - plane.position.x) / plane.scale.x, (world.y - plane.position.y) / plane.scale.y);
    if (!tracking || snap) {
      follow.copy(target);
      velocity.set(0, 0);
      tracking = true;
    }
  };
  const onEnter = (e: PointerEvent) => track(e, true);
  const onMove = (e: PointerEvent) => track(e, false);
  canvas.addEventListener('pointerenter', onEnter);
  canvas.addEventListener('pointermove', onMove, { passive: true });
  canvas.addEventListener('pointerdown', onEnter);
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  resize();

  const frame = (now: number) => {
    if (disposed) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;
    follow.lerp(target, 1 - Math.exp(-s.followSpeed * dt));
    delta.copy(target).sub(follow);
    const len = delta.length();
    if (len > s.maxMotion && len > 0) delta.multiplyScalar(s.maxMotion / len);
    velocity.lerp(delta, 1 - Math.exp(-s.returnSpeed * dt));
    if (velocity.lengthSq() < 1e-7) velocity.set(0, 0);
    uniforms.uPointer.value.copy(follow);
    uniforms.uVelocity.value.copy(velocity);
    renderer.render(scene, camera);
  };
  raf = requestAnimationFrame(frame);

  if (src) {
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(src, (t) => {
      if (disposed) return t.dispose();
      t.colorSpace = THREE.SRGBColorSpace;
      t.minFilter = THREE.LinearFilter;
      t.magFilter = THREE.LinearFilter;
      t.wrapS = THREE.ClampToEdgeWrapping;
      t.wrapT = THREE.ClampToEdgeWrapping;
      t.generateMipmaps = true;
      t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      t.needsUpdate = true;
      const img = t.image as HTMLImageElement;
      texture = t;
      uniforms.uTexture.value = t;
      uniforms.uHasTexture.value = 1;
      uniforms.uImageSize.value.set(img.naturalWidth || img.width || 1, img.naturalHeight || img.height || 1);
    });
  }

  return () => {
    disposed = true;
    cancelAnimationFrame(raf);
    resizeObserver.disconnect();
    canvas.removeEventListener('pointerenter', onEnter);
    canvas.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('pointerdown', onEnter);
    texture?.dispose();
    placeholder.dispose();
    geometry.dispose();
    material.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  };
}
