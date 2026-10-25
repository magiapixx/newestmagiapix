/**
 * Tiny state machine for interactive components: each state is a class on the
 * component root, and pointer events move between states with an animation.
 *
 * A root merged across breakpoints carries its state once per breakpoint as `rv-<bp>-<class>` (lib/rv);
 * each of those slots runs the machine on its own, so one event moves every breakpoint along its own edges.
 */
import { transitionState, type Transition } from './motion';

type Edges<S extends string> = { enter?: S; leave?: S; tap?: S };
export type Machine<S extends string> = {
  classes: Record<S, string>;
  on: Partial<Record<S, Edges<S>>>;
  transition: Transition;
};

const PREFIX = /^(rv-(?:p|t|lg|xl|d|tp|dt)-)?(.+)$/;

export function bindMachine<S extends string>(root: HTMLElement, m: Machine<S>) {
  const states = Object.keys(m.classes) as S[];
  const byClass = new Map(states.map((s) => [m.classes[s], s]));
  // prefixes of the slots this root carries ('' for a plain, single-look root)
  const prefixes = [...root.classList].flatMap((c) => {
    const [, prefix = '', cls] = c.match(PREFIX)!;
    return byClass.has(cls) ? [prefix] : [];
  });
  const stateOf = (prefix: string) => states.find((s) => root.classList.contains(prefix + m.classes[s]));
  const current = () => stateOf(prefixes[0] ?? '');
  const go = (edge: keyof Edges<S>) => {
    const moves = prefixes.flatMap((prefix) => {
      const s = stateOf(prefix);
      const next = s && m.on[s]?.[edge];
      return next && next !== s ? [{ prefix, from: s, to: next }] : [];
    });
    if (!moves.length) return;
    transitionState(root, () => {
      for (const { prefix, from, to } of moves) root.classList.replace(prefix + m.classes[from], prefix + m.classes[to]);
      root.dataset.variant = moves[0].to;
    }, m.transition);
  };
  root.addEventListener('mouseenter', () => go('enter'));
  root.addEventListener('mouseleave', () => go('leave'));
  root.addEventListener('click', () => go('tap'));
  return { go, current };
}

export function bindAll<S extends string>(selector: string, m: Machine<S>) {
  for (const el of document.querySelectorAll<HTMLElement>(selector)) bindMachine(el, m);
}
