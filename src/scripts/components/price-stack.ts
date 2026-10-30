/**
 * Price cards (components/PricesSection.astro). The big number of each card slides up out of its mask the first
 * time it comes into view. Where the cards are sticky (tall desktop screens) they stack: while a card is stuck at
 * the top, --cover on it goes from 0 to 1 as the next card slides over it, so it can recede.
 */
import { animate, inView } from '../lib/motion';
import { pageZoom } from '../lib/zoom';

export function initPriceStack() {
  const cards = [...document.querySelectorAll<HTMLElement>('[data-price-card]')];
  if (!cards.length) return;

  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    for (const num of document.querySelectorAll<HTMLElement>('[data-price-num]')) {
      num.style.transform = 'translateY(100%)';
      inView(
        num.parentElement ?? num,
        () => animate(num, [{ transform: 'translateY(100%)' }, { transform: 'none' }], { type: 'spring', duration: 1, bounce: 0 }),
        { amount: 0.5, margin: '0px 0px -15% 0px' },
      );
    }
  }

  // sticky offset of each card in screen px (rects are in screen px under page zoom), or null where they don't stick
  let tops: (number | null)[] = [];
  let queued = false;
  const update = () => {
    queued = false;
    // the last card has nothing to slide over it
    for (let i = 0; i < cards.length - 1; i++) {
      const top = tops[i];
      let cover = 0;
      if (top !== null) {
        const r = cards[i].getBoundingClientRect();
        const next = cards[i + 1].getBoundingClientRect().top;
        const span = Math.min(r.height, innerHeight - top);
        if (r.top <= top + 1 && span > 0) cover = Math.min(1, Math.max(0, 1 - (next - top) / span));
      }
      cards[i].style.setProperty('--cover', cover.toFixed(3));
    }
  };
  const measure = () => {
    const zoom = pageZoom();
    tops = cards.map((card) => {
      const cs = getComputedStyle(card);
      return cs.position === 'sticky' ? (parseFloat(cs.top) || 0) * zoom : null;
    });
    update();
  };
  addEventListener(
    'scroll',
    () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    },
    { passive: true },
  );
  addEventListener('resize', measure);
  measure();
}
