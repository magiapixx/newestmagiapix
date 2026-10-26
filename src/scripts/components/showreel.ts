/**
 * Showreel: the play button opens a full-section video popup (Vimeo);
 * the backdrop or CLOSE dismisses it. On desktop (1200px and up) the two headings follow the scroll: while
 * the section scrolls into view "/Show" comes in from the top edge and "Reel"
 * from the bottom edge, reaching their places as the section's middle reaches
 * the middle of the screen. The section then pins in place for two screens of
 * scrolling: the first carries them on out of the section ("/Show" out the
 * bottom, "Reel" out the top), the second grows the video frame until it fills
 * the whole section (at least the full screen), its corners following the four
 * plus marks as they move out to the section's corners.
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

type Rect = { x: number; y: number; w: number; h: number };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// scroll the two headings in from just past the section's top / bottom edge,
// then pin the section, let the scroll push each one on through the opposite edge
// and then pull the video frame out to fill the screen
function enterHeadings(section: HTMLElement) {
  const show = section.querySelector<HTMLElement>('.m-1vk2obh-container');
  const reel = section.querySelector<HTMLElement>('.m-7a0jed-container');
  const column = section.querySelector<HTMLElement>('.m-dvd6tq');
  const frame = section.querySelector<HTMLElement>('.m-un4bs9');
  const media = section.querySelector<HTMLElement>('.m-4nog24-container');
  // the section's inner box: capped at 1920px wide and clipping, so it would cut the grown frame short on wider screens
  const inner = section.querySelector<HTMLElement>('.m-1r33my');
  // plus marks: top left, top right, bottom left, bottom right
  const marks = ['.m-ziolja', '.m-j3bx7i', '.m-slcdqb', '.m-1n0w50d'].map((q) => section.querySelector<HTMLElement>(q));
  if (!show || !reel || !column || !frame || !media || !inner || marks.some((m) => !m) || reducedMotion()) return;
  // offsets that put a heading just past the top / bottom edge of the area that clips it
  const above = (el: HTMLElement) => -(el.offsetTop + el.offsetHeight);
  const below = (el: HTMLElement) => ((el.offsetParent as HTMLElement | null)?.clientHeight ?? 0) - el.offsetTop;
  const offsets = () => [
    [show, above(show), below(show)],
    [reel, below(reel), above(reel)],
  ] as const;
  // pin: the wrapper grows by two screens and the section sticks with its middle on the screen's middle
  const track = section.parentElement;
  if (!track) return;
  let top = 0;
  let distance = 0;
  // the video frame's own place, and the whole section, both in the column's coordinates
  let from: Rect = { x: 0, y: 0, w: 0, h: 0 };
  let to: Rect = from;

  // undo the frame styles so it can be measured where the page puts it
  const resetFrame = () => {
    for (const p of ['height', 'overflow']) column.style.removeProperty(p);
    inner.style.removeProperty('overflow');
    for (const p of ['position', 'left', 'top', 'width', 'height']) frame.style.removeProperty(p);
    media.style.removeProperty('height');
    for (const m of marks) m!.style.removeProperty('translate');
  };
  const layout = () => {
    resetFrame();
    distance = window.innerHeight;
    top = (window.innerHeight - section.offsetHeight) / 2;
    // min-height: site.css forces this wrapper's height to auto
    track.style.minHeight = `${section.offsetHeight + distance * 2}px`;
    Object.assign(section.style, { position: 'sticky', top: `${top}px` });

    const s = section.getBoundingClientRect();
    const c = column.getBoundingClientRect();
    const f = frame.getBoundingClientRect();
    from = { x: f.left - c.left, y: f.top - c.top, w: f.width, h: f.height };
    // the frame grows to the section's own box rather than the screen: the section can be a little
    // taller than the screen, and a screen-sized frame would leave a strip of it showing once it lets go
    to = { x: s.left - c.left, y: s.top - c.top, w: s.width, h: s.height };
    // take the frame out of the flow (the column keeps its height) so it can grow past the column;
    // the section itself still clips at its edges
    Object.assign(column.style, { height: getComputedStyle(column).height, overflow: 'visible' });
    inner.style.overflow = 'visible';
    Object.assign(frame.style, { position: 'absolute' });
    media.style.height = '100%';
  };

  // undo everything layout() and update() set inline
  const reset = () => {
    resetFrame();
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
    // leaving: 0 when the section pins, 1 when the headings are gone
    const p = clamp((top - at) / distance);
    for (const [el, start, end] of offsets()) {
      const [y, opacity] = p > 0 ? [end * p, 1 - p] : [start * (1 - q), q];
      Object.assign(el.style, { translate: `0 ${y}px`, opacity: String(opacity) });
    }
    // growing: 0 when the headings are gone, 1 when the frame fills the screen and the section lets go
    const g = clamp((top - at - distance) / distance);
    const r = { x: lerp(from.x, to.x, g), y: lerp(from.y, to.y, g), w: lerp(from.w, to.w, g), h: lerp(from.h, to.h, g) };
    Object.assign(frame.style, { left: `${r.x}px`, top: `${r.y}px`, width: `${r.w}px`, height: `${r.h}px` });
    // each plus mark moves with its corner of the frame
    const dl = r.x - from.x;
    const dr = r.x + r.w - (from.x + from.w);
    const dt = r.y - from.y;
    const db = r.y + r.h - (from.y + from.h);
    [[dl, dt], [dr, dt], [dl, db], [dr, db]].forEach(([dx, dy], i) => (marks[i]!.style.translate = `${dx}px ${dy}px`));
  };
  const refresh = () => {
    if (!desktop.matches) return reset();
    layout();
    update();
  };
  refresh();
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', refresh);
  // the section can change width without a window resize (a scrollbar showing up): measure again
  let width = section.offsetWidth;
  new ResizeObserver(() => {
    if (section.offsetWidth === width) return;
    width = section.offsetWidth;
    refresh();
  }).observe(section);
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
