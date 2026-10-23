/**
 * Page intro: four accent columns cover the page and collapse one after
 * another (left to right). Scrolling is locked until they are gone.
 */
import { animate } from '../lib/motion';
import { lenis } from './smooth-scroll';

const DELAY = 0.7;
const STAGGER = 0.12;
const DURATION = 1.2;

export function initIntro() {
  for (const overlay of document.querySelectorAll<HTMLElement>('[data-intro]')) {
    const columns = [...overlay.children] as HTMLElement[];
    const root = document.documentElement;
    const prev = [root.style.overflow, document.body.style.overflow];
    root.style.overflow = document.body.style.overflow = 'hidden';
    lenis?.stop();
    const done = Promise.all(
      columns.map(
        (col, i) =>
          animate(col, [{ transform: 'scaleY(1)' }, { transform: 'scaleY(0)' }], {
            type: 'tween',
            delay: DELAY + i * STAGGER,
            duration: DURATION,
            ease: [0.65, 0, 0.35, 1],
          }).finished,
      ),
    );
    done.finally(() => {
      overlay.remove();
      [root.style.overflow, document.body.style.overflow] = prev;
      lenis?.start();
    });
  }
}
