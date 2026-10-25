/**
 * Light beams: slow, ray-marched bands of grey light used behind the footer.
 *
 * Host: <canvas data-gl="light-beams">
 */
import { attribute, clear, createContext, createProgram, loseContext, rgb, setSize } from './gl';
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
  const gl = createContext(canvas, { alpha: true, depth: false, antialias: false, premultipliedAlpha: false });
  if (!gl) return;
  const program = createProgram(gl, vertex, fragment);
  const uniforms = {
    iTime: 0,
    iResolution: [1, 1],
    uSpeed: s.speed,
    uSpread: s.spread,
    uThickness: s.thickness,
    uIntensityFactor: s.intensity,
    uCameraX: s.cameraX,
    uBgIntensity: s.backgroundIntensity,
    uColor1: rgb(s.primaryColor),
    uColor2: rgb(s.secondaryColor),
    uBgColor: rgb(s.backgroundColor),
  };
  program.set(uniforms);
  // one triangle that covers the whole viewport
  const vao = gl.createVertexArray()!;
  gl.bindVertexArray(vao);
  const buffer = attribute(gl, program.attrib('position'), new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3);
  gl.disable(gl.DEPTH_TEST);
  gl.depthMask(false);

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
    if (disposed) return;
    clear(gl);
    gl.useProgram(program.program);
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
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
      setSize(gl, w, h, s.dpr);
    }
    program.set({ iResolution: [w * s.dpr, h * s.dpr] });
    if (raf === 0) draw();
  };
  const shouldRun = () => inView && pageVisible && Math.abs(s.speed) > 1e-6;
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
    program.set({ iTime: time });
    draw();
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
    gl.deleteBuffer(buffer);
    gl.deleteVertexArray(vao);
    program.dispose();
    loseContext(gl);
  };
}
