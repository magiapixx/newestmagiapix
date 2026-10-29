/** Price cards: always open (no plus/minus toggle), so each card is switched to its open look on load. */
import { setVariant } from '../lib/motion';
import { lookSlots } from '../lib/rv';

// open look <-> closed look, per breakpoint
const PAIRS = [
  { open: 'v-3kxegu', closed: 'v-1en70zz' }, // desktop
  { open: 'v-y977ge', closed: 'v-1i8jsh1' }, // tablet
  { open: 'v-1ar4n6d', closed: 'v-1m69yn8' }, // phone
];

export function initPriceCards() {
  const table = Object.fromEntries(PAIRS.flatMap((p) => [[p.open, p], [p.closed, p]]));
  for (const card of document.querySelectorAll<HTMLElement>('.m-GJSAG')) {
    const looks = lookSlots(card, table);
    if (!looks.length) continue;
    // a card can start open on some breakpoints and closed on others: open it on all of them
    setVariant(card, looks, 'open');
  }
}
