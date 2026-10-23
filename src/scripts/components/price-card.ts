/** Price cards open and close their feature list on click. */
import { setVariant, type Transition } from '../lib/motion';
import { hoverClass } from '../lib/hover';
import { accentsIn, playAccent, resetAccent } from './accent';

// open look <-> closed look, per breakpoint copy
const PAIRS = [
  { open: 'v-3kxegu', closed: 'v-1en70zz' }, // desktop
  { open: 'v-y977ge', closed: 'v-1i8jsh1' }, // tablet
  { open: 'v-1ar4n6d', closed: 'v-1m69yn8' }, // phone
];
const SPRING: Transition = { type: 'spring', duration: 0.5, bounce: 0 };

export function initPriceCards() {
  for (const card of document.querySelectorAll<HTMLElement>('.m-GJSAG')) {
    const looks = PAIRS.find((p) => card.classList.contains(p.open) || card.classList.contains(p.closed));
    if (!looks) continue;
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => setVariant(card, looks, card.classList.contains(looks.open) ? 'closed' : 'open', SPRING));
    // hovering a closed card sweeps an accent bar across its header
    hoverClass(card, SPRING, { enter: () => accentsIn(card).forEach((a) => (resetAccent(a, 'load'), playAccent(a))) });
  }
}
