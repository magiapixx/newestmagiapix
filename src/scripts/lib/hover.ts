import { transitionState, type Transition } from './motion';

/**
 * Toggle a `hover` class (animated) while the pointer is over `el`. `when` limits it to the moments it
 * returns true (e.g. while an element merged across breakpoints shows its desktop look).
 */
export function hoverClass(el: HTMLElement, tr: Transition, hooks: { enter?: () => void; leave?: () => void; when?: () => boolean } = {}) {
  el.addEventListener('mouseenter', () => {
    if (hooks.when && !hooks.when()) return;
    transitionState(el, () => el.classList.add('hover'), tr);
    hooks.enter?.();
  });
  el.addEventListener('mouseleave', () => {
    if (hooks.when && !el.classList.contains('hover')) return;
    transitionState(el, () => el.classList.remove('hover'), tr);
    hooks.leave?.();
  });
}
