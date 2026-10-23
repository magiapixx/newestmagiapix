/**
 * Smooth wheel scrolling (Lenis) on pages that opt in with
 * `data-smooth-scroll`. Touch devices keep native scrolling.
 */
import Lenis from 'lenis';

export let lenis: Lenis | undefined;

export function initSmoothScroll() {
  const host = document.querySelector<HTMLElement>('[data-smooth-scroll]');
  if (!host) return;
  const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (touch) return;
  const intensity = Number(host.dataset.smoothScroll) || 10;
  lenis = new Lenis({
    duration: intensity / 10,
    smoothWheel: true,
    touchMultiplier: 2,
    wheelMultiplier: 1.5,
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
  });
  document.documentElement.classList.add('lenis', 'lenis-smooth');
  const raf = (t: number) => {
    lenis!.raf(t);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);
}
