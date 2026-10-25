/**
 * Components whose hover state plays an accent sweep: case cards (under the
 * title) and the previous/next case links (along the bottom edge).
 */
import { hoverClass } from '../lib/hover';
import { hasActiveClass, hasClass } from '../lib/rv';
import { accentsIn, playAccent, resetAccent } from './accent';

// component, and the (desktop) look that has the accent; a component merged across breakpoints carries that
// look as rv-<bp>-<look> and only hovers while it applies
const HOVER_ACCENTS: [selector: string, look: string][] = [['.m-6eFUg', 'v-12q4b40'], ['.m-Rmgej', 'v-1lbfoh3'], ['.m-Rmgej', 'v-t5hhwz']];

export function initHoverAccents() {
  for (const [selector, look] of HOVER_ACCENTS) {
    for (const el of document.querySelectorAll<HTMLElement>(selector)) {
      if (!hasClass(el, look)) continue;
      hoverClass(el, { type: 'spring', duration: 0.4, bounce: 0.2 }, {
        when: () => hasActiveClass(el, look),
        enter: () => accentsIn(el).forEach((a) => (resetAccent(a, 'load'), playAccent(a))),
      });
    }
  }
}
