/**
 * FAQ items: tap to open or close. Opening reveals the answer (fading in),
 * swaps the plus for a minus and turns the question accent. Desktop rows
 * also play an accent sweep while hovered and closed.
 */
import { animate, setVariant, transitionState, type Transition } from '../lib/motion';
import { accentsIn, playAccent, resetAccent } from './accent';

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
    const pair = LOOKS.find(([closed]) => item.classList.contains(closed));
    if (!pair) continue;
    const looks = { closed: pair[0], open: pair[1] };
    const hoverable = item.querySelector('.m-kn5kpf-container') !== null;
    item.style.cursor = 'pointer';

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

    if (!hoverable) continue;
    item.addEventListener('mouseenter', () => {
      if (item.hasAttribute('data-open')) return;
      transitionState(item, () => item.classList.add('hover'), SPRING);
      accentsIn(item).forEach((a) => (resetAccent(a, 'load'), playAccent(a)));
    });
    item.addEventListener('mouseleave', () => {
      if (item.classList.contains('hover')) transitionState(item, () => item.classList.remove('hover'), SPRING);
    });
  }
}
