/**
 * Components that switch to an "animated" look the first time they are at
 * least half visible, and start their accent sweeps.
 */
import { inView, transitionState, type Transition } from '../lib/motion';
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
  for (const [sel, from, to, transition] of ONCE_AT_HALF) {
    for (const el of document.querySelectorAll<HTMLElement>(`${sel}.${from}`)) {
      inView(
        el.parentElement ?? el,
        () => {
          const swap = () => el.classList.replace(from, to);
          if (transition) transitionState(el, swap, transition);
          else swap();
          accentsIn(el).forEach(playAccent);
        },
        { amount: 0.5 },
      );
    }
  }
}
