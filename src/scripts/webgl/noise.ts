/**
 * Film grain: eight frames of random grey noise, cycled at a fixed frame rate.
 * The frames are kept as bitmaps (drawn without re-uploading the pixels each frame), and the loop only runs while
 * the grain is on screen and the tab is visible.
 *
 * Host: <canvas data-gl="noise">
 */
const SETTINGS = { noiseSize: 1, fps: 24 };

export function mountNoise(canvas: HTMLCanvasElement) {
  const host = canvas.parentElement!;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return;
  const { noiseSize, fps } = SETTINGS;
  let frames: (ImageBitmap | ImageData)[] = [];
  let index = 0;
  let last = 0;
  let raf = 0;
  let build = 0;
  let disposed = false;
  let inView = false;
  let pageVisible = document.visibilityState !== 'hidden';
  const interval = 1000 / fps;

  const release = () => {
    for (const f of frames) if ('close' in f) f.close();
    frames = [];
  };
  const rebuild = async () => {
    const id = ++build;
    const r = host.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    const w = Math.max(1, Math.floor(r.width / noiseSize));
    const h = Math.max(1, Math.floor(r.height / noiseSize));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    const next: (ImageBitmap | ImageData)[] = [];
    for (let f = 0; f < 8; f++) {
      const img = ctx.createImageData(w, h);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = Math.random() * 255;
        d[i] = d[i + 1] = d[i + 2] = v;
        d[i + 3] = 255;
      }
      next.push(img);
    }
    const bitmaps = typeof createImageBitmap === 'function' ? await Promise.all(next.map((img) => createImageBitmap(img))).catch(() => null) : null;
    if (disposed || id !== build) return bitmaps?.forEach((b) => b.close());
    release();
    frames = bitmaps ?? next;
    index = 0;
  };
  const draw = () => {
    const f = frames[index];
    if (!f) return;
    if (f instanceof ImageData) ctx.putImageData(f, 0, 0);
    else ctx.drawImage(f, 0, 0);
    index = (index + 1) % frames.length;
  };

  const tick = (now: number) => {
    raf = 0;
    if (disposed || !inView || !pageVisible) return;
    if (now - last > interval && frames.length > 0) {
      draw();
      last = now;
    }
    raf = requestAnimationFrame(tick);
  };
  const update = () => {
    if (inView && pageVisible) {
      if (!raf) raf = requestAnimationFrame(tick);
    } else if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };

  const resizeObserver = new ResizeObserver(() => void rebuild());
  resizeObserver.observe(host);
  const intersectionObserver = new IntersectionObserver((entries) => {
    const e = entries[entries.length - 1];
    if (!e) return;
    inView = e.isIntersecting;
    update();
  });
  intersectionObserver.observe(host);
  const onVisibility = () => {
    pageVisible = document.visibilityState !== 'hidden';
    update();
  };
  document.addEventListener('visibilitychange', onVisibility);

  return () => {
    disposed = true;
    resizeObserver.disconnect();
    intersectionObserver.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    cancelAnimationFrame(raf);
    release();
  };
}
