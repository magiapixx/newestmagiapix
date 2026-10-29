/**
 * FAQ items: tap to open or close. Opening reveals the answer (fading in),
 * swaps the plus for a minus and turns the question accent. Desktop rows
 * also play an accent sweep while hovered and closed.
 */
import { animate, setVariant, transitionState, type Transition } from '../lib/motion';
import { accentsIn, playAccent, resetAccent } from './accent';
import { hasActiveClass, lookSlots } from '../lib/rv';

// closed look -> opened look, per layout
const LOOKS: [closed: string, open: string][] = [
  ['v-13ofslm', 'v-cnqtiw'], // desktop, left
  ['v-bzy8p', 'v-1h19swh'], // desktop, right
  ['v-xd6ji4', 'v-m04njo'], // tablet
  ['v-8yuvk1', 'v-bbzrvg'], // tablet, right
  ['v-1e9xkcu', 'v-noea66'], // phone
];
const SPRING: Transition = { type: 'spring', duration: 0.4, bounce: 0 };

export function initFaqs() {
  for (const item of document.querySelectorAll<HTMLElement>('.m-y6iPh')) {
    // one look per breakpoint on an item merged across breakpoints (lib/rv)
    const looks = lookSlots(item, Object.fromEntries(LOOKS.map(([closed, open]) => [closed, { closed, open }])));
    if (!looks.length) continue;
    // the hover accent only exists in the desktop looks: hover while one of them applies
    const accent = item.querySelector('.m-kn5kpf-container');
    const hoverable = () => LOOKS.slice(0, 2).some(([closed, open]) => hasActiveClass(item, closed) || hasActiveClass(item, open));
    item.style.cursor = 'pointer';
    // every item starts open; a tap still closes it
    item.setAttribute('data-open', '');
    setVariant(item, looks, 'open');

    item.addEventListener('click', () => {
      const opening = !item.hasAttribute('data-open');
      transitionState(item, () => {
        item.toggleAttribute('data-open', opening);
        item.classList.remove('hover');
        setVariant(item, looks, opening ? 'open' : 'closed');
      }, SPRING);
      const answer = item.querySelector('[data-show="open"] .m-1kb9yme');
      if (opening && answer) animate(answer, [{ opacity: 0 }, { opacity: 1 }], SPRING);
    });

    if (!accent) continue;
    item.addEventListener('mouseenter', () => {
      if (!hoverable() || item.hasAttribute('data-open')) return;
      transitionState(item, () => item.classList.add('hover'), SPRING);
      accentsIn(item).forEach((a) => (resetAccent(a, 'load'), playAccent(a)));
    });
    item.addEventListener('mouseleave', () => {
      if (item.classList.contains('hover')) transitionState(item, () => item.classList.remove('hover'), SPRING);
    });
  }
}
