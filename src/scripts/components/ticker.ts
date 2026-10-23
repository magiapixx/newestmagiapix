/**
 * Clients ticker: the logo row scrolls left at a steady speed and loops
 * seamlessly. It can also be dragged sideways.
 */
const SPEED = 70; // px per second
const GAP: Record<string, number> = { 'v-18ui4wc': 20 }; // phone uses a tighter gap

export function initTickers() {
  for (const section of document.querySelectorAll<HTMLElement>('section.m-UkImT')) {
    const list = section.querySelector<HTMLUListElement>(':scope > ul');
    if (!list) continue;
    const gap = Object.entries(GAP).find(([v]) => section.classList.contains(v))?.[1] ?? 30;
    const items = [...list.children] as HTMLElement[];
    let loopLength = 0;
    let offset = 0;
    let visible = false;
    let dragging = false;
    let raf = 0;
    let last = 0;

    const measure = () => {
      if (!section.getClientRects().length) return;
      list.querySelectorAll('.clone-item').forEach((c) => c.remove());
      const first = items[0].getBoundingClientRect();
      const lastItem = items[items.length - 1].getBoundingClientRect();
      const total = lastItem.right - first.left;
      loopLength = total + gap;
      // enough copies to keep the row full while one copy scrolls out
      const copies = Math.max(1, Math.ceil(section.clientWidth / loopLength));
      for (let c = 0; c < copies; c++) {
        for (const item of items) {
          const clone = item.cloneNode(true) as HTMLElement;
          clone.className = 'clone-item';
          clone.setAttribute('aria-hidden', 'true');
          clone.removeAttribute('aria-posinset');
          clone.removeAttribute('aria-setsize');
          list.appendChild(clone);
        }
      }
      list.style.opacity = '1';
      render();
    };
    const render = () => {
      if (loopLength > 0) offset = (((offset % loopLength) - loopLength) % loopLength);
      list.style.transform = `translateX(${offset}px)`;
    };
    const tick = (now: number) => {
      raf = 0;
      if (!visible) return;
      const dt = last ? (now - last) / 1000 : 0;
      last = now;
      if (!dragging) offset -= SPEED * dt;
      render();
      raf = requestAnimationFrame(tick);
    };

    new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        if (visible && !loopLength) measure();
        if (visible && !raf) {
          last = 0;
          raf = requestAnimationFrame(tick);
        }
      },
      { rootMargin: '100px' },
    ).observe(section);
    new ResizeObserver(() => loopLength && measure()).observe(section);

    // drag to scrub
    let startX = 0;
    let startOffset = 0;
    section.addEventListener('pointerdown', (e) => {
      dragging = true;
      startX = e.clientX;
      startOffset = offset;
      section.setPointerCapture(e.pointerId);
    });
    section.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      offset = startOffset + (e.clientX - startX);
      render();
    });
    const end = () => (dragging = false);
    section.addEventListener('pointerup', end);
    section.addEventListener('pointercancel', end);
  }
}
