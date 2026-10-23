/**
 * Navigation link: an accent fill wipes in from the left on hover and wipes
 * out to the right when the pointer leaves.
 */
import { setVariant, type Transition } from '../lib/motion';

const V = { normal: 'v-13g9tl4', hover: 'v-162z59a', out: 'v-1wpsmu7' };
const SPRING: Transition = { type: 'spring', duration: 0.3, bounce: 0 };

export function initNavLinks() {
  for (const link of document.querySelectorAll<HTMLElement>('.m-GMBhV')) {
    let reset = 0;
    link.addEventListener('mouseenter', () => {
      clearTimeout(reset);
      if (link.classList.contains(V.out)) setVariant(link, V, 'normal');
      setVariant(link, V, 'hover', SPRING);
    });
    link.addEventListener('mouseleave', () => {
      setVariant(link, V, 'out', SPRING);
      // once the fill has left, quietly park it back on the left
      reset = window.setTimeout(() => setVariant(link, V, 'normal'), 700);
    });
  }
}
