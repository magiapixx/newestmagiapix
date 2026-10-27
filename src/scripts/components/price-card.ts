/** Price cards open and close their feature list on click. */
import { setVariant, type Transition } from '../lib/motion';
import { hoverClass } from '../lib/hover';
import { accentsIn, playAccent, resetAccent } from './accent';
import { hasActiveClass, lookSlots } from '../lib/rv';

// open look <-> closed look, per breakpoint
const PAIRS = [
  { open: 'v-3kxegu', closed: 'v-1en70zz' }, // desktop
  { open: 'v-y977ge', closed: 'v-1i8jsh1' }, // tablet
  { open: 'v-1ar4n6d', closed: 'v-1m69yn8' }, // phone
];
const SPRING: Transition = { type: 'spring', duration: 0.5, bounce: 0 };

export function initPriceCards() {
  const table = Object.fromEntries(PAIRS.flatMap((p) => [[p.open, p], [p.closed, p]]));
  for (const card of document.querySelectorAll<HTMLElement>('.m-GJSAG')) {
    const looks = lookSlots(card, table);
    if (!looks.length) continue;
    // a card can start open on some breakpoints and closed on others: go by the look the current one shows
    const isOpen = () => PAIRS.some((p) => hasActiveClass(card, p.open));
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => setVariant(card, looks, isOpen() ? 'closed' : 'open', SPRING));
    // hovering a closed card sweeps an accent bar across its header
    hoverClass(card, SPRING, { enter: () => accentsIn(card).forEach((a) => (resetAccent(a, 'load'), playAccent(a))) });
  }
}
