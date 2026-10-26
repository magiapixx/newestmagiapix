/**
 * Showreel: the play button opens a full-section video popup (Vimeo);
 * the backdrop or CLOSE dismisses it. While the section scrolls past, "/Show"
 * travels down from above its top edge to below its bottom edge and "Reel"
 * travels the other way, both resting in place when the section fills the screen.
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
// share of the scroll at each end where the headings fade (the phone layout does not clip them at the edges)
const FADE = 0.15;

// tie the two headings to the section's scroll progress: 0 = section top at the screen bottom, 1 = section bottom at the screen top
function scrollHeadings(section: HTMLElement) {
  const show = section.querySelector<HTMLElement>('.m-1vk2obh-container');
  const reel = section.querySelector<HTMLElement>('.m-7a0jed-container');
  if (!show || !reel || reducedMotion()) return;
  // offsets that put a heading just past the top / bottom edge of the area that clips it
  const edges = (el: HTMLElement) => ({
    above: -(el.offsetTop + el.offsetHeight),
    below: ((el.offsetParent as HTMLElement | null)?.clientHeight ?? 0) - el.offsetTop,
  });
  let frame = 0;
  const update = () => {
    frame = 0;
    const r = section.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
    const opacity = String(Math.min(1, p / FADE, (1 - p) / FADE));
    for (const [el, down] of [[show, true], [reel, false]] as const) {
      const { above, below } = edges(el);
      const [from, to] = down ? [above, below] : [below, above];
      const y = p < 0.5 ? from * (1 - p * 2) : to * (p * 2 - 1);
      Object.assign(el.style, { translate: `0 ${y}px`, opacity });
    }
  };
  const queue = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  update();
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
    scrollHeadings(section);
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
