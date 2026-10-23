/**
 * Luma transition: cross-fades between two images, with brighter areas of
 * the image changing first, a slight zoom and fine horizontal glitches.
 * Loops forever while on screen.
 *
 * Host: <canvas data-gl="luma" data-images="/images/a.jpg,/images/b.jpg" data-pause="0.8">
 */
import * as THREE from 'three';
import { fragment, vertex } from './luma.glsl';

const SETTINGS = {
  transitionTime: 7,
  lumaTolerance: 2.1,
  feather: 0.66,
  zoomStrength: 0.18,
  chromaStrength: 0,
  glitchStrength: 0.02,
  glitchFrequency: 800,
  glitchNarrowness: 0.5,
  glowColor: 'rgb(0, 0, 0)',
  dpr: 1,
};

const sizeOf = (t: THREE.Texture) => {
  const img = t.image as HTMLImageElement;
  return { width: Math.max(1, img?.naturalWidth || img?.width || 1), height: Math.max(1, img?.naturalHeight || img?.height || 1) };
};

export function mountLuma(canvas: HTMLCanvasElement) {
  const urls = (canvas.dataset.images ?? '').split(',').filter(Boolean).slice(0, 3);
  if (urls.length < 2) return;
  const host = canvas.parentElement!;
  const pauseTime = Math.max(0, Number(canvas.dataset.pause ?? 0));
  const s = SETTINGS;

  let disposed = false;
  let raf = 0;
  let renderer: THREE.WebGLRenderer | null = null;
  let material: THREE.ShaderMaterial | null = null;
  let geometry: THREE.PlaneGeometry | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let intersectionObserver: IntersectionObserver | null = null;
  let textures: THREE.Texture[] = [];

  (async () => {
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    textures = await Promise.all(urls.map((u) => loader.loadAsync(u)));
    if (disposed) return textures.forEach((t) => t.dispose());
    for (const t of textures) {
      t.generateMipmaps = false;
      t.minFilter = THREE.LinearFilter;
      t.magFilter = THREE.LinearFilter;
      t.wrapS = THREE.ClampToEdgeWrapping;
      t.wrapT = THREE.ClampToEdgeWrapping;
      t.colorSpace = THREE.SRGBColorSpace;
      t.needsUpdate = true;
    }
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.max(0.25, Math.min(3, s.dpr)));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const a = sizeOf(textures[0]);
    const b = sizeOf(textures[1]);
    const uniforms = {
      uTex1: { value: textures[0] },
      uTex2: { value: textures[1] },
      uProgress: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uTex1Res: { value: new THREE.Vector2(a.width, a.height) },
      uTex2Res: { value: new THREE.Vector2(b.width, b.height) },
      uTime: { value: 0 },
      uLumaTolerance: { value: s.lumaTolerance },
      uZoomStrength: { value: s.zoomStrength },
      uChromaStrength: { value: s.chromaStrength },
      uGlowColor: { value: new THREE.Color(s.glowColor) },
      uFeather: { value: s.feather },
      uGlitchStrength: { value: s.glitchStrength },
      uGlitchFrequency: { value: s.glitchFrequency },
      uGlitchNarrowness: { value: s.glitchNarrowness },
    };
    material = new THREE.ShaderMaterial({ vertexShader: vertex, fragmentShader: fragment, uniforms, depthTest: false, depthWrite: false, toneMapped: false });
    geometry = new THREE.PlaneGeometry(2, 2);
    scene.add(new THREE.Mesh(geometry, material));

    const resize = () => {
      const r = host.getBoundingClientRect();
      const w = Math.max(1, Math.round(r.width));
      const h = Math.max(1, Math.round(r.height));
      renderer!.setSize(w, h, false);
      uniforms.uResolution.value.set(w, h);
    };
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    let current = 0;
    let cycleStart = performance.now();
    let clockStart = cycleStart;
    const r = host.getBoundingClientRect();
    let visible = r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth;
    let hiddenAt: number | null = visible ? null : performance.now();

    const swap = () => {
      const next = (current + 1) % textures.length;
      const from = sizeOf(textures[current]);
      const to = sizeOf(textures[next]);
      uniforms.uTex1.value = textures[current];
      uniforms.uTex2.value = textures[next];
      uniforms.uTex1Res.value.set(from.width, from.height);
      uniforms.uTex2Res.value.set(to.width, to.height);
    };

    const frame = (now: number) => {
      raf = 0;
      if (disposed || !visible) return;
      const elapsed = (now - cycleStart) / 1000;
      uniforms.uTime.value = (now - clockStart) / 1000;
      if (elapsed < pauseTime) uniforms.uProgress.value = 0;
      else {
        const p = (elapsed - pauseTime) / Math.max(0.001, s.transitionTime);
        uniforms.uProgress.value = Math.min(1, Math.max(0, p));
        if (p >= 1) {
          current = (current + 1) % textures.length;
          swap();
          uniforms.uProgress.value = 0;
          cycleStart = now;
        }
      }
      renderer!.render(scene, camera);
      raf = requestAnimationFrame(frame);
    };
    const resume = () => {
      if (visible) return;
      const now = performance.now();
      if (hiddenAt !== null) {
        cycleStart += now - hiddenAt;
        clockStart += now - hiddenAt;
      }
      hiddenAt = null;
      visible = true;
      if (raf === 0) raf = requestAnimationFrame(frame);
    };
    const suspend = () => {
      if (!visible) return;
      visible = false;
      hiddenAt = performance.now();
      cancelAnimationFrame(raf);
      raf = 0;
    };
    intersectionObserver = new IntersectionObserver((entries) => {
      const e = entries[0];
      if (e && e.isIntersecting && e.intersectionRatio > 0) resume();
      else suspend();
    });
    intersectionObserver.observe(host);
    if (visible) raf = requestAnimationFrame(frame);
  })().catch((e) => console.error('Luma transition:', e));

  return () => {
    disposed = true;
    cancelAnimationFrame(raf);
    resizeObserver?.disconnect();
    intersectionObserver?.disconnect();
    material?.dispose();
    geometry?.dispose();
    textures.forEach((t) => t.dispose());
    renderer?.dispose();
  };
}
