/**
 * Animation Accent: a solid accent-coloured bar that sweeps in from the left
 * and out to the right. Each state hands over to the next after a short pause.
 */
import { setVariant, type Transition } from '../lib/motion';

export const ACCENT = {
  load: 'v-1ejt96b',
  fill: 'v-12lahdt',
  empty: 'v-gi2rnu',
  loadDelay1: 'v-12el1mb',
  fillDelay1: 'v-17i5xzv',
  emptyDelay1: 'v-12pztjo',
  loadDelay2: 'v-1hn00ti',
  fillDelay2: 'v-f7dp9g',
  emptyDelay2: 'v-16epb1a',
  loadDelay3: 'v-zdic29',
  fillDelay3: 'v-853tnn',
  emptyDelay3: 'v-17pzaqk',
  loadAndFill: 'v-1jdsta',
  loadAndFillEnd: 'v-15pt59k',
} as const;
type State = keyof typeof ACCENT;

const NEXT: Partial<Record<State, [State, number]>> = {
  load: ['fill', 200],
  fill: ['empty', 200],
  loadDelay1: ['fillDelay1', 300],
  fillDelay1: ['emptyDelay1', 200],
  loadDelay2: ['fillDelay2', 400],
  fillDelay2: ['emptyDelay2', 200],
  loadDelay3: ['fillDelay3', 500],
  fillDelay3: ['emptyDelay3', 200],
  loadAndFill: ['loadAndFillEnd', 200],
};

const SPRING: Transition = { type: 'spring', duration: 0.5, bounce: 0 };
const END: Transition = { type: 'tween', duration: 0.5, ease: [0.35, 0.01, 0.29, 0.98] };

const timers = new WeakMap<HTMLElement, number>();

function stateOf(el: HTMLElement): State | undefined {
  return (Object.keys(ACCENT) as State[]).find((s) => el.classList.contains(ACCENT[s]));
}

/** Run an accent from its current state through to the end of its sequence. */
export function playAccent(el: HTMLElement) {
  clearTimeout(timers.get(el));
  const step = () => {
    const now = stateOf(el);
    const next = now && NEXT[now];
    if (!next) return;
    timers.set(
      el,
      window.setTimeout(() => {
        setVariant(el, ACCENT, next[0], next[0] === 'loadAndFillEnd' ? END : SPRING);
        step();
      }, next[1]),
    );
  };
  step();
}

/** Put an accent back to a starting state without animating. */
export function resetAccent(el: HTMLElement, state: State) {
  clearTimeout(timers.get(el));
  for (const a of el.getAnimations({ subtree: true })) a.cancel();
  setVariant(el, ACCENT, state);
}

export const accentsIn = (root: ParentNode) => [...root.querySelectorAll<HTMLElement>('.m-toAcB')];

/** Where an accent is in its sweep: still waiting at the left, coming in, or leaving to the right. */
export function accentPhase(el: HTMLElement): 'waiting' | 'in' | 'out' {
  const state = stateOf(el);
  if (state === 'loadAndFill' || state?.startsWith('fill')) return 'in';
  if (state === 'loadAndFillEnd' || state?.startsWith('empty')) return 'out';
  return 'waiting';
}
