/**
 * Links with a thin underline that sweeps through on hover: it grows from the
 * left to full width, then 200 ms later shrinks away to the right. Used for
 * the big side-menu links and the social links.
 */
import { setVariant, type Transition } from '../lib/motion';

type Looks = { rest: string; hover: string; through: string };

const LINKS: [selector: string, looks: Looks[]][] = [
  ['.m-Mw6EY', [
    { rest: 'v-12dxaoo', hover: 'v-x3uu', through: 'v-s7bqc8' },
    { rest: 'v-18r79j7', hover: 'v-1d47jzq', through: 'v-93c233' }, // "smaller" size
  ]],
  ['.m-MQsLv', [{ rest: 'v-1in1jcz', hover: 'v-op6d11', through: 'v-vjiqpq' }]],
];
const SPRING: Transition = { type: 'spring', duration: 0.3, bounce: 0 };

export function initUnderlineSweeps() {
  for (const [selector, looksList] of LINKS) {
    for (const link of document.querySelectorAll<HTMLElement>(selector)) {
      const looks = looksList.find((l) => Object.values(l).some((c) => link.classList.contains(c)));
      if (!looks) continue;
      let timer = 0;
      link.addEventListener('mouseenter', () => {
        if (!link.classList.contains(looks.rest)) return;
        setVariant(link, looks, 'hover', SPRING);
        timer = window.setTimeout(() => setVariant(link, looks, 'through', SPRING), 200);
      });
      link.addEventListener('mouseleave', () => {
        clearTimeout(timer);
        setVariant(link, looks, 'rest', SPRING);
      });
    }
  }
}
