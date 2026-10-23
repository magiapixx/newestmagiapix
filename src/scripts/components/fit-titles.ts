/**
 * Page header titles (vertical CASES / CONTACT / ABOUT AGENCY): their type has
 * a fixed size per breakpoint, so on short or narrow viewports the text runs
 * off the top. Scale the title down from its bottom-left anchor until it fits
 * below the navigation and within 60% of the header's width.
 *
 * Host: the absolutely positioned title container, marked with `data-fit-title`.
 */
const TOP_GAP = 80; // keep clear of the navigation bar
const MAX_WIDTH = 0.6; // share of the header width the title may take

export function initFitTitles() {
  const hosts = [...document.querySelectorAll<HTMLElement>('[data-fit-title]')];
  if (!hosts.length) return;

  const fit = () => {
    for (const host of hosts) {
      if (!host.getClientRects().length) continue;
      const header = host.closest('header');
      const lines = [...host.querySelectorAll<HTMLElement>('h1, h2')];
      if (!header || !lines.length) continue;
      host.style.transform = '';
      const rects = lines.map((l) => l.getBoundingClientRect());
      const top = Math.min(...rects.map((r) => r.top));
      const left = Math.min(...rects.map((r) => r.left));
      const right = Math.max(...rects.map((r) => r.right));
      const bottom = host.getBoundingClientRect().bottom;
      const box = header.getBoundingClientRect();
      const scale = Math.min(1, (bottom - box.top - TOP_GAP) / (bottom - top), (box.width * MAX_WIDTH) / (right - left));
      if (scale < 1) {
        host.style.transformOrigin = 'left bottom';
        host.style.transform = `scale(${scale})`;
      }
    }
  };

  let pending = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(pending);
    pending = requestAnimationFrame(fit);
  });
  document.fonts.ready.then(fit);
  fit();
}
