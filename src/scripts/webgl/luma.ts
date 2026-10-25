/**
 * Luma transition: cross-fades between two images, with brighter areas of
 * the image changing first, a slight zoom and fine horizontal glitches.
 * Loops forever while on screen.
 *
 * Host: <canvas data-gl="luma" data-images="/images/a.jpg,/images/b.jpg" data-pause="0.8">
 */
import { bindTexture, clear, createContext, createProgram, drawState, imageTexture, loadImage, plane, rgb, setSize, type GL, type Mesh, type Program } from './gl';
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

const sizeOf = (img: HTMLImageElement) => ({ width: Math.max(1, img?.naturalWidth || img?.width || 1), height: Math.max(1, img?.naturalHeight || img?.height || 1) });

export function mountLuma(canvas: HTMLCanvasElement) {
  const urls = (canvas.dataset.images ?? '').split(',').filter(Boolean).slice(0, 3);
  if (urls.length < 2) return;
  const host = canvas.parentElement!;
  const pauseTime = Math.max(0, Number(canvas.dataset.pause ?? 0));
  const s = SETTINGS;

  let disposed = false;
  let raf = 0;
  let gl: GL | null = null;
  let program: Program | null = null;
  let mesh: Mesh | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let intersectionObserver: IntersectionObserver | null = null;
  let images: HTMLImageElement[] = [];
  let textures: WebGLTexture[] = [];

  (async () => {
    images = await Promise.all(urls.map(loadImage));
    if (disposed) return;
    gl = createContext(canvas, { alpha: true, depth: true, antialias: false, premultipliedAlpha: true });
    if (!gl) return;
    const ratio = Math.max(0.25, Math.min(3, s.dpr));
    const a = sizeOf(images[0]);
    const b = sizeOf(images[1]);
    program = createProgram(gl, vertex, fragment);
    program.set({
      uProgress: 0,
      uResolution: [1, 1],
      uTex1Res: [a.width, a.height],
      uTex2Res: [b.width, b.height],
      uTime: 0,
      uLumaTolerance: s.lumaTolerance,
      uZoomStrength: s.zoomStrength,
      uChromaStrength: s.chromaStrength,
      uGlowColor: rgb(s.glowColor),
      uFeather: s.feather,
      uGlitchStrength: s.glitchStrength,
      uGlitchFrequency: s.glitchFrequency,
      uGlitchNarrowness: s.glitchNarrowness,
      uTex1: 0,
      uTex2: 1,
    });
    mesh = plane(gl, program, 2, 2);
    // unit 0 and 1 hold the "from" and "to" images of the running cross-fade
    textures = images.map((img, i) => imageTexture(gl!, img, Math.min(i, 1)));
    let slots = [0, 1];
    const render = () => {
      const g = gl!;
      clear(g);
      g.useProgram(program!.program);
      slots.forEach((t, unit) => bindTexture(g, textures[t], unit));
      drawState(g, { depth: false, doubleSide: false });
      g.bindVertexArray(mesh!.vao);
      g.drawElements(g.TRIANGLES, mesh!.count, g.UNSIGNED_SHORT, 0);
    };

    const resize = () => {
      const r = host.getBoundingClientRect();
      const w = Math.max(1, Math.round(r.width));
      const h = Math.max(1, Math.round(r.height));
      setSize(gl!, w, h, ratio);
      program!.set({ uResolution: [w, h] });
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
      const from = sizeOf(images[current]);
      const to = sizeOf(images[next]);
      slots = [current, next];
      program!.set({ uTex1Res: [from.width, from.height], uTex2Res: [to.width, to.height] });
    };

    const frame = (now: number) => {
      raf = 0;
      if (disposed || !visible) return;
      const elapsed = (now - cycleStart) / 1000;
      let progress = 0;
      if (elapsed >= pauseTime) {
        const p = (elapsed - pauseTime) / Math.max(0.001, s.transitionTime);
        progress = Math.min(1, Math.max(0, p));
        if (p >= 1) {
          current = (current + 1) % textures.length;
          swap();
          progress = 0;
          cycleStart = now;
        }
      }
      program!.set({ uTime: (now - clockStart) / 1000, uProgress: progress });
      render();
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
    if (gl) {
      textures.forEach((t) => gl!.deleteTexture(t));
      mesh?.dispose();
      program?.dispose();
    }
  };
}
