/**
 * Showreel: the play button opens a full-section video popup (Vimeo);
 * the backdrop or CLOSE dismisses it. On desktop (1200px and up) the two headings follow the scroll: while
 * the section scrolls into view "/Show" comes in from the top edge and "Reel"
 * from the bottom edge, reaching their places as the section's middle reaches
 * the middle of the screen. The section then pins in place for one screen of
 * scrolling, and that scroll carries them on out of the section ("/Show" out
 * the bottom, "Reel" out the top).
 */
import { reducedMotion, setVariant, type Transition } from '../lib/motion';
import { hoverClass } from '../lib/hover';
import { lookSlots } from '../lib/rv';

// closed look -> playing look, per breakpoint
const PLAYED: Record<string, string> = {
  'v-1hcz3so': 'v-1pk481p', // desktop
  'v-1k1kicf': 'v-1cpdap7', // wide
  'v-zootfu': 'v-1g8ot2g', // tablet
  'v-3lc1ch': 'v-13fq11g', // phone
};
const SPRING: Transition = { type: 'spring', duration: 0.5, bounce: 0 };
const HOVER: Transition = { type: 'spring', duration: 0.4, bounce: 0.2 };
// the heading motion runs on desktop only; tablet and phone keep the section as designed
const desktop = matchMedia('(min-width: 1200px)');

// scroll the two headings in from just past the section's top / bottom edge,
// then pin the section and let the scroll push each one on through the opposite edge
function enterHeadings(section: HTMLElement) {
  const show = section.querySelector<HTMLElement>('.m-1vk2obh-container');
  const reel = section.querySelector<HTMLElement>('.m-7a0jed-container');
  if (!show || !reel || reducedMotion()) return;
  // offsets that put a heading just past the top / bottom edge of the area that clips it
  const above = (el: HTMLElement) => -(el.offsetTop + el.offsetHeight);
  const below = (el: HTMLElement) => ((el.offsetParent as HTMLElement | null)?.clientHeight ?? 0) - el.offsetTop;
  const offsets = () => [
    [show, above(show), below(show)],
    [reel, below(reel), above(reel)],
  ] as const;
  // pin: the wrapper grows by one screen and the section sticks with its middle on the screen's middle
  const track = section.parentElement;
  if (!track) return;
  let top = 0;
  let distance = 0;
  const layout = () => {
    distance = window.innerHeight;
    top = (window.innerHeight - section.offsetHeight) / 2;
    // min-height: site.css forces this wrapper's height to auto
    track.style.minHeight = `${section.offsetHeight + distance}px`;
    Object.assign(section.style, { position: 'sticky', top: `${top}px` });
  };

  // undo everything layout() and update() set inline
  const reset = () => {
    track.style.removeProperty('min-height');
    for (const p of ['position', 'top']) section.style.removeProperty(p);
    for (const el of [show, reel]) for (const p of ['translate', 'opacity']) el.style.removeProperty(p);
  };

  const clamp = (n: number) => Math.min(1, Math.max(0, n));
  const update = () => {
    if (!desktop.matches) return;
    const at = track.getBoundingClientRect().top;
    // entering: 0 when the section's top reaches the screen's bottom, 1 when it pins
    const q = clamp((window.innerHeight - at) / (window.innerHeight - top));
    // leaving: 0 when the section pins, 1 when it lets go
    const p = clamp((top - at) / distance);
    for (const [el, from, to] of offsets()) {
      const [y, opacity] = p > 0 ? [to * p, 1 - p] : [from * (1 - q), q];
      Object.assign(el.style, { translate: `0 ${y}px`, opacity: String(opacity) });
    }
  };
  const refresh = () => {
    if (!desktop.matches) return reset();
    layout();
    update();
  };
  refresh();
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', refresh);
}

function vimeo(host: HTMLElement) {
  let frame = host.querySelector('iframe');
  if (!frame) {
    frame = document.createElement('iframe');
    frame.src = `https://player.vimeo.com/video/${host.dataset.vimeo}?autopause=0&controls=1`;
    frame.allow = 'autoplay; fullscreen; picture-in-picture';
    frame.title = 'Showreel';
    host.append(frame);
  }
  return frame;
}

export function initShowreel() {
  for (const section of document.querySelectorAll<HTMLElement>('.m-VTBBD')) {
    enterHeadings(section);
    const looks = lookSlots(section, Object.fromEntries(Object.entries(PLAYED).map(([closed, played]) => [closed, { closed, played }])));
    if (!looks.length) continue;
    const host = section.querySelector<HTMLElement>('[data-vimeo]');
    const play = () => {
      if (host) vimeo(host);
      setVariant(section, looks, 'played', SPRING);
    };
    const close = () => {
      host?.querySelector('iframe')?.contentWindow?.postMessage('{"method":"pause"}', '*');
      setVariant(section, looks, 'closed', SPRING);
    };
    section.querySelector('.m-US2Pu')?.addEventListener('click', play);
    section.querySelector('.m-1rmno7x')?.addEventListener('click', close);
    section.querySelector('.m-1uq1i3t')?.addEventListener('click', close);
  }
  for (const btn of document.querySelectorAll<HTMLElement>('.m-US2Pu')) {
    hoverClass(btn, HOVER);
  }
}
