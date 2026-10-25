/**
 * Award rows (desktop): hovering re-flows the row, sweeps a black fill in
 * behind it, recolours the text and fades in an arrow.
 */
import { animate, transitionState, type Transition } from '../lib/motion';
import { accentsIn, playAccent, resetAccent } from './accent';
import { hasActiveClass, hasClass, swapClass } from '../lib/rv';

const REST = 'v-1ezkko';
const HOVER = 'v-11kuxnh';
const LAYOUT: Transition = { type: 'spring', duration: 0.4, bounce: 0.2 };
const ARROW: Transition = { type: 'spring', duration: 0.4, bounce: 0, delay: 0.3 };

export function initAwards() {
  // a row merged across breakpoints carries the desktop look as rv-d-...: it only reacts while that look applies
  for (const row of [...document.querySelectorAll<HTMLElement>('.m-i7kYl')].filter((r) => hasClass(r, REST))) {
    row.addEventListener('mouseenter', () => {
      if (!hasActiveClass(row, REST)) return;
      transitionState(row, () => {
        swapClass(row, REST, HOVER);
        row.classList.add('hover');
      }, LAYOUT);
      accentsIn(row).forEach((a) => {
        resetAccent(a, 'loadAndFill');
        playAccent(a);
      });
      const arrow = row.querySelector('.m-EB3pI');
      if (arrow) animate(arrow, [{ opacity: 0 }, { opacity: 1 }], ARROW);
    });
    row.addEventListener('mouseleave', () => {
      if (!hasClass(row, HOVER)) return;
      transitionState(row, () => {
        swapClass(row, HOVER, REST);
        row.classList.remove('hover');
      }, LAYOUT);
    });
  }
}
