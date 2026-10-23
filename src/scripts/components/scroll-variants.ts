/**
 * Components that switch to an "animated" look the first time they are at
 * least half visible, and start their accent sweeps.
 */
import { inView } from '../lib/motion';
import { accentsIn, playAccent } from './accent';

const ONCE_AT_HALF: [selector: string, from: string, to: string][] = [
  // Text - Back Animation (accent bars behind the intro text)
  ['.m-MBJT0', 'v-11onisr', 'v-1yw235x'],
  ['.m-MBJT0', 'v-t4a0yo', 'v-t8mr2c'],
  // Ava (avatar with an accent sweep)
  ['.m-iS0sC', 'v-z936f1', 'v-1i6ssta'],
];

export function initScrollVariants() {
  for (const [sel, from, to] of ONCE_AT_HALF) {
    for (const el of document.querySelectorAll<HTMLElement>(`${sel}.${from}`)) {
      inView(
        el.parentElement ?? el,
        () => {
          el.classList.replace(from, to);
          accentsIn(el).forEach(playAccent);
        },
        { amount: 0.5 },
      );
    }
  }
}
