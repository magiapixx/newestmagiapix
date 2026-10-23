/**
 * Film grain: eight frames of random grey noise, cycled at a fixed frame rate.
 *
 * Host: <canvas data-gl="noise">
 */
const SETTINGS = { noiseSize: 1, fps: 24 };

export function mountNoise(canvas: HTMLCanvasElement) {
  const host = canvas.parentElement!;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return;
  const { noiseSize, fps } = SETTINGS;
  let frames: ImageData[] = [];
  let index = 0;
  let last = 0;
  let raf = 0;
  const interval = 1000 / fps;

  const build = () => {
    const r = host.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    const w = Math.max(1, Math.floor(r.width / noiseSize));
    const h = Math.max(1, Math.floor(r.height / noiseSize));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    frames = [];
    for (let f = 0; f < 8; f++) {
      const img = ctx.createImageData(w, h);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = Math.random() * 255;
        d[i] = d[i + 1] = d[i + 2] = v;
        d[i + 3] = 255;
      }
      frames.push(img);
    }
  };
  const resizeObserver = new ResizeObserver(build);
  resizeObserver.observe(host);

  const tick = (now: number) => {
    if (now - last > interval && frames.length > 0) {
      ctx.putImageData(frames[index], 0, 0);
      index = (index + 1) % frames.length;
      last = now;
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  return () => {
    resizeObserver.disconnect();
    cancelAnimationFrame(raf);
  };
}
