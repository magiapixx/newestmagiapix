/**
 * Count-up numbers: a figure such as `$50M`, `20K` or `100+` counts from 0 to
 * its value when it comes into view, keeping its prefix and suffix.
 *
 * Markup opts in with `data-count` on the element holding the figure. The
 * written text stays in the markup, so the figure reads right without script
 * and with reduced motion.
 */
import { inView, reducedMotion } from '../lib/motion';

const DURATION = 1600; // ms from 0 to the value
const ease = (t: number) => 1 - Math.pow(1 - t, 4); // fast start, slow settle

export function initCountUps() {
  if (reducedMotion()) return;
  for (const el of document.querySelectorAll<HTMLElement>('[data-count]')) {
    const text = el.textContent ?? '';
    const m = text.match(/^(\D*)(\d+(?:\.\d+)?)(.*)$/s);
    if (!m) continue;
    const [, prefix, num, suffix] = m;
    const target = Number(num);
    const decimals = num.split('.')[1]?.length ?? 0;
    const show = (v: number) => (el.textContent = prefix + v.toFixed(decimals) + suffix);
    show(0);
    inView(
      el,
      () => {
        const start = performance.now();
        const step = (now: number) => {
          const t = Math.min(1, (now - start) / DURATION);
          show(target * ease(t));
          if (t < 1) requestAnimationFrame(step);
          else el.textContent = text;
        };
        requestAnimationFrame(step);
      },
      { amount: 0.5 },
    );
  }
}
