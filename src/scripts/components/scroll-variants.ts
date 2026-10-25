/**
 * Components that switch to an "animated" look the first time they are at
 * least half visible, and start their accent sweeps.
 */
import { inView, transitionState, type Transition } from '../lib/motion';
import { hasClass, swapClass } from '../lib/rv';
import { accentsIn, playAccent } from './accent';

const ONCE_AT_HALF: [selector: string, from: string, to: string, transition?: Transition][] = [
  // Text - Back Animation (accent bars behind the intro text)
  ['.m-MBJT0', 'v-11onisr', 'v-1yw235x'],
  ['.m-MBJT0', 'v-t4a0yo', 'v-t8mr2c'],
  // Ava (avatar with an accent sweep)
  ['.m-iS0sC', 'v-z936f1', 'v-1i6ssta'],
  // Image Opening: the white cover over the image lifts away
  ['.m-1K3ma', 'v-1uo7se3', 'v-1kja13x', { type: 'spring', duration: 1, bounce: 0 }],
];

export function initScrollVariants() {
  // an element merged across breakpoints can carry several of these looks (one per breakpoint, lib/rv):
  // collect them so it swaps all of them and plays its accents once
  const swaps = new Map<HTMLElement, { pairs: [string, string][]; transition?: Transition }>();
  for (const [sel, from, to, transition] of ONCE_AT_HALF) {
    for (const el of document.querySelectorAll<HTMLElement>(sel)) {
      if (!hasClass(el, from)) continue;
      const entry = swaps.get(el) ?? { pairs: [], transition };
      entry.pairs.push([from, to]);
      swaps.set(el, entry);
    }
  }
  for (const [el, { pairs, transition }] of swaps) {
    inView(
      el.parentElement ?? el,
      () => {
        const swap = () => pairs.forEach(([from, to]) => swapClass(el, from, to));
        if (transition) transitionState(el, swap, transition);
        else swap();
        accentsIn(el).forEach(playAccent);
      },
      { amount: 0.5 },
    );
  }
}
