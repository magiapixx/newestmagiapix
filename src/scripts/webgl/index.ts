/**
 * Starts the WebGL/canvas effects. An effect only runs while its host is
 * actually rendered (some hosts only exist at some breakpoints); this also
 * keeps the page well under the browser's limit on WebGL contexts.
 */
import { mountDistortion } from './distortion';
import { mountLuma } from './luma';
import { mountNoise } from './noise';
import { mountPixelFlip } from './pixel-flip';

type Mount = (el: any) => (() => void) | undefined;

const MOUNTS: Record<string, Mount> = {
  'pixel-flip': mountPixelFlip,
  luma: mountLuma,
  noise: mountNoise,
  distortion: mountDistortion,
};

export function initWebgl() {
  const hosts = [...document.querySelectorAll<HTMLElement>('[data-gl]')];
  if (!hosts.length) return;
  const running = new Map<HTMLElement, () => void>();

  const sync = () => {
    hosts.forEach((el, i) => {
      const shown = el.getClientRects().length > 0;
      const stop = running.get(el);
      if (shown && !stop) {
        const dispose = MOUNTS[el.dataset.gl!]?.(el);
        running.set(el, dispose ?? (() => {}));
      } else if (!shown && stop) {
        stop();
        running.delete(el);
        // a canvas keeps its (now released) context, so swap in a fresh one
        if (el instanceof HTMLCanvasElement) {
          const fresh = el.cloneNode() as HTMLCanvasElement;
          el.replaceWith(fresh);
          hosts[i] = fresh;
        }
      }
    });
  };

  let pending = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(pending);
    pending = requestAnimationFrame(sync);
  });
  sync();
}
