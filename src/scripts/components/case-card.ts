/** Case cards (desktop): an accent bar sweeps under the title on hover. */
import { hoverClass } from '../lib/hover';
import { accentsIn, playAccent, resetAccent } from './accent';

export function initCaseCards() {
  for (const card of document.querySelectorAll<HTMLElement>('.m-6eFUg.v-12q4b40')) {
    hoverClass(card, { type: 'spring', duration: 0.4, bounce: 0.2 }, {
      enter: () => accentsIn(card).forEach((a) => (resetAccent(a, 'load'), playAccent(a))),
    });
  }
}
