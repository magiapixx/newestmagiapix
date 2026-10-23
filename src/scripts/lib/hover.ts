import { transitionState, type Transition } from './motion';

/** Toggle a `hover` class (animated) while the pointer is over `el`. */
export function hoverClass(el: HTMLElement, tr: Transition, hooks: { enter?: () => void; leave?: () => void } = {}) {
  el.addEventListener('mouseenter', () => {
    transitionState(el, () => el.classList.add('hover'), tr);
    hooks.enter?.();
  });
  el.addEventListener('mouseleave', () => {
    transitionState(el, () => el.classList.remove('hover'), tr);
    hooks.leave?.();
  });
}
