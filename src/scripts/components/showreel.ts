/**
 * Showreel: the play button opens a full-section video popup (Vimeo);
 * the backdrop or CLOSE dismisses it.
 */
import { setVariant, type Transition } from '../lib/motion';
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
