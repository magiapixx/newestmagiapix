/**
 * Components whose hover state plays an accent sweep: case cards (under the
 * title) and the previous/next case links (along the bottom edge).
 */
import { hoverClass } from '../lib/hover';
import { accentsIn, playAccent, resetAccent } from './accent';

const HOVER_ACCENTS = ['.m-6eFUg.v-12q4b40', '.m-Rmgej.v-1lbfoh3', '.m-Rmgej.v-t5hhwz'];

export function initHoverAccents() {
  for (const el of document.querySelectorAll<HTMLElement>(HOVER_ACCENTS.join(','))) {
    hoverClass(el, { type: 'spring', duration: 0.4, bounce: 0.2 }, {
      enter: () => accentsIn(el).forEach((a) => (resetAccent(a, 'load'), playAccent(a))),
    });
  }
}
