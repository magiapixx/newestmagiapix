/**
 * Underlined links: on hover the hand-drawn underline is redrawn from left
 * to right. Inside the contact form's submit button the whole button is the
 * hover target, and the label also turns accent.
 */
import { animate, transitionState, type Transition } from '../lib/motion';

const DRAW: Transition = { type: 'tween', duration: 0.55, ease: [0.5, -0.02, 0.72, 0.51] };
const BUTTON: Transition = { type: 'spring', duration: 0.4, bounce: 0.2 };
const ACCENT = 'var(--color-accent, rgb(157, 140, 255))';

export function initLineLinks() {
  for (const link of document.querySelectorAll<HTMLElement>('.m-4oV3m, .m-bGO9v')) {
    const paths = [...link.querySelectorAll<SVGPathElement>('[data-line-draw] path')];
    if (!paths.length) continue;
    const button = link.closest<HTMLElement>('.m-sdRQw');
    const label = button ? link.querySelector<HTMLElement>('.m-cf4z8f') : null;
    const rest = label?.style.getPropertyValue('--prop-GffgxLMr6');
    const host = button ?? link;
    host.addEventListener('mouseenter', () => {
      if (button?.dataset.state && button.dataset.state !== 'default') return;
      const show = () => {
        link.classList.add('hover');
        label?.style.setProperty('--prop-GffgxLMr6', ACCENT);
      };
      if (label) transitionState(link, show, BUTTON);
      else show();
      for (const path of paths) {
        const length = path.getTotalLength();
        path.style.strokeDasharray = `${length} ${length}`;
        animate(path, [{ strokeDashoffset: `${length}px` }, { strokeDashoffset: '0px' }], DRAW);
      }
    });
    host.addEventListener('mouseleave', () => {
      if (button?.dataset.state && button.dataset.state !== 'default') return;
      const hide = () => {
        link.classList.remove('hover');
        if (label && rest) label.style.setProperty('--prop-GffgxLMr6', rest);
      };
      if (label) transitionState(link, hide, BUTTON);
      else hide();
    });
  }
}
