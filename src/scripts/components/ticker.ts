/**
 * Tickers (clients logos, team cards): the row (or column, on phones) scrolls
 * at a steady speed and loops seamlessly. It can also be dragged.
 *
 * Host: <… data-ticker="<px per second>"> with the items in a direct child <ul>.
 */
export function initTickers() {
  for (const host of document.querySelectorAll<HTMLElement>('[data-ticker]')) {
    const list = host.querySelector<HTMLUListElement>(':scope > ul');
    if (!list) continue;
    const speed = Number(host.dataset.ticker) || 70;
    const items = [...list.children] as HTMLElement[];
    let vertical = false;
    let loopLength = 0;
    let offset = 0;
    let visible = false;
    let dragging = false;
    let raf = 0;
    let last = 0;

    const measure = () => {
      if (!host.getClientRects().length) return;
      list.querySelectorAll('.clone-item').forEach((c) => c.remove());
      const style = getComputedStyle(list);
      vertical = style.flexDirection.startsWith('column');
      const gap = parseFloat(vertical ? style.rowGap : style.columnGap) || 0;
      const first = items[0].getBoundingClientRect();
      const lastItem = items[items.length - 1].getBoundingClientRect();
      loopLength = (vertical ? lastItem.bottom - first.top : lastItem.right - first.left) + gap;
      // enough copies to keep the row full while one copy scrolls out
      const size = vertical ? host.clientHeight : host.clientWidth;
      const copies = Math.max(1, Math.ceil(size / loopLength));
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
      if (loopLength > 0) offset = ((offset % loopLength) - loopLength) % loopLength;
      list.style.transform = vertical ? `translateY(${offset}px)` : `translateX(${offset}px)`;
    };
    const tick = (now: number) => {
      raf = 0;
      if (!visible) return;
      const dt = last ? (now - last) / 1000 : 0;
      last = now;
      if (!dragging) offset -= speed * dt;
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
    ).observe(host);
    new ResizeObserver(() => loopLength && measure()).observe(host);

    // drag to scrub
    let start = 0;
    let startOffset = 0;
    const pos = (e: PointerEvent) => (vertical ? e.clientY : e.clientX);
    host.addEventListener('pointerdown', (e) => {
      dragging = true;
      start = pos(e);
      startOffset = offset;
      host.setPointerCapture(e.pointerId);
    });
    host.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      offset = startOffset + (pos(e) - start);
      render();
    });
    const end = () => (dragging = false);
    host.addEventListener('pointerup', end);
    host.addEventListener('pointercancel', end);
  }
}
