/**
 * Scroll reveals: elements marked with `data-reveal` start offset/faded (the
 * starting style is inline in the markup) and settle into place the first
 * time they scroll into view.
 */
import { animate, inView, type Transition } from '../lib/motion';

type RevealSpec = {
  from: { opacity?: number; x?: number; y?: number; scale?: number; rotate?: number };
  transition: Transition;
  threshold?: number;
};

export function initReveals() {
  for (const el of document.querySelectorAll<HTMLElement>('[data-reveal]')) {
    const spec: RevealSpec = JSON.parse(el.dataset.reveal!);
    inView(
      el,
      () => {
        const cs = getComputedStyle(el);
        animate(el, [{ opacity: cs.opacity, transform: cs.transform }, { opacity: '1', transform: 'none' }], spec.transition);
      },
      { amount: spec.threshold ?? 0 },
    );
  }
}
