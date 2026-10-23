/**
 * Light beams: slow, ray-marched bands of grey light used behind the footer.
 *
 * Host: <canvas data-gl="light-beams">
 */
import * as THREE from 'three';
import { fragment, vertex } from './light-beams.glsl';

const SETTINGS = {
  dpr: 0.7,
  speed: 0.59,
  spread: 2.31,
  thickness: 0.43,
  intensity: 0.19,
  cameraX: -17.2,
  backgroundIntensity: 1.25,
  primaryColor: 'rgb(87, 87, 87)',
  secondaryColor: 'rgb(43, 43, 43)',
  backgroundColor: 'rgb(0, 0, 0)',
};

export function mountLightBeams(canvas: HTMLCanvasElement) {
  const host = canvas.parentElement!;
  const s = SETTINGS;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(s.dpr);
  const scene = new THREE.Scene();
  scene.matrixAutoUpdate = false;
  const camera = new THREE.Camera();
  const uniforms = {
    iTime: { value: 0 },
    iResolution: { value: new THREE.Vector2(1, 1) },
    uSpeed: { value: s.speed },
    uSpread: { value: s.spread },
    uThickness: { value: s.thickness },
    uIntensityFactor: { value: s.intensity },
    uCameraX: { value: s.cameraX },
    uBgIntensity: { value: s.backgroundIntensity },
    uColor1: { value: new THREE.Color(s.primaryColor) },
    uColor2: { value: new THREE.Color(s.secondaryColor) },
    uBgColor: { value: new THREE.Color(s.backgroundColor) },
  };
  // one triangle that covers the whole viewport
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
  const material = new THREE.ShaderMaterial({ vertexShader: vertex, fragmentShader: fragment, uniforms, depthTest: false, depthWrite: false, transparent: false });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.matrixAutoUpdate = false;
  mesh.updateMatrix();
  scene.add(mesh);

  let disposed = false;
  let raf = 0;
  let resizeRaf = 0;
  let time = 0;
  let last = 0;
  let inView = true;
  let pageVisible = document.visibilityState !== 'hidden';
  let width = 0;
  let height = 0;

  const draw = () => {
    if (!disposed) renderer.render(scene, camera);
  };
  const resize = () => {
    resizeRaf = 0;
    if (disposed) return;
    const r = host.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width));
    const h = Math.max(1, Math.round(r.height));
    if (w !== width || h !== height) {
      width = w;
      height = h;
      renderer.setSize(w, h, false);
    }
    const ratio = renderer.getPixelRatio();
    uniforms.iResolution.value.set(w * ratio, h * ratio);
    if (raf === 0) draw();
  };
  const shouldRun = () => inView && pageVisible && Math.abs(uniforms.uSpeed.value) > 1e-6;
  const stop = () => {
    if (raf !== 0) cancelAnimationFrame(raf);
    raf = 0;
    last = 0;
  };
  const frame = (now: number) => {
    if (disposed || !shouldRun()) {
      raf = 0;
      last = 0;
      return;
    }
    if (last !== 0) time += Math.min((now - last) * 0.001, 0.1);
    last = now;
    uniforms.iTime.value = time;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  };
  const update = () => {
    if (!shouldRun()) return stop();
    if (raf === 0) {
      draw();
      last = 0;
      raf = requestAnimationFrame(frame);
    }
  };

  resize();
  const resizeObserver = new ResizeObserver(() => {
    if (resizeRaf === 0 && !disposed) resizeRaf = requestAnimationFrame(resize);
  });
  resizeObserver.observe(host);
  const intersectionObserver = new IntersectionObserver(
    (entries) => {
      if (!entries[0]) return;
      inView = entries[0].isIntersecting;
      update();
    },
    { threshold: 0.01 },
  );
  intersectionObserver.observe(host);
  const onVisibility = () => {
    pageVisible = document.visibilityState !== 'hidden';
    update();
  };
  document.addEventListener('visibilitychange', onVisibility);
  draw();
  update();

  return () => {
    disposed = true;
    stop();
    cancelAnimationFrame(resizeRaf);
    resizeObserver.disconnect();
    intersectionObserver.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    geometry.dispose();
    material.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  };
}
