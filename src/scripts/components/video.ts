/** Muted background videos play only while they are on screen. */
export function initVideos() {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const v = e.target as HTMLVideoElement;
      if (e.isIntersecting) v.play().catch(() => {});
      else v.pause();
    }
  });
  document.querySelectorAll('video[data-autoplay]').forEach((v) => io.observe(v));
}
