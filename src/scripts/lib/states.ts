/**
 * Tiny state machine for interactive components: each state is a class on the
 * component root, and pointer events move between states with an animation.
 */
import { setVariant, type Transition } from './motion';

type Edges<S extends string> = { enter?: S; leave?: S; tap?: S };
export type Machine<S extends string> = {
  classes: Record<S, string>;
  on: Partial<Record<S, Edges<S>>>;
  transition: Transition;
};

export function bindMachine<S extends string>(root: HTMLElement, m: Machine<S>) {
  const current = () => (Object.keys(m.classes) as S[]).find((s) => root.classList.contains(m.classes[s]));
  const go = (edge: keyof Edges<S>) => {
    const s = current();
    const next = s && m.on[s]?.[edge];
    if (next) setVariant(root, m.classes, next, m.transition);
  };
  root.addEventListener('mouseenter', () => go('enter'));
  root.addEventListener('mouseleave', () => go('leave'));
  root.addEventListener('click', () => go('tap'));
  return { go, current };
}

export function bindAll<S extends string>(selector: string, m: Machine<S>) {
  for (const el of document.querySelectorAll<HTMLElement>(selector)) bindMachine(el, m);
}
