/**
 * Award rows (desktop): hovering re-flows the row, sweeps a black fill in
 * behind it, recolours the text and fades in an arrow.
 */
import { animate, transitionState, type Transition } from '../lib/motion';
import { accentsIn, playAccent, resetAccent } from './accent';

const REST = 'v-1ezkko';
const HOVER = 'v-11kuxnh';
const LAYOUT: Transition = { type: 'spring', duration: 0.4, bounce: 0.2 };
const ARROW: Transition = { type: 'spring', duration: 0.4, bounce: 0, delay: 0.3 };

export function initAwards() {
  for (const row of document.querySelectorAll<HTMLElement>(`.m-i7kYl.${REST}`)) {
    row.addEventListener('mouseenter', () => {
      transitionState(row, () => {
        row.classList.replace(REST, HOVER);
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
      transitionState(row, () => {
        row.classList.replace(HOVER, REST);
        row.classList.remove('hover');
      }, LAYOUT);
    });
  }
}
