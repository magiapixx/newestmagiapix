/**
 * FAQ items: always open. Each item is switched to its opened look (answer shown, question in the accent)
 * once on load; there is no plus/minus toggle and a tap does not close it.
 */
import { setVariant } from '../lib/motion';
import { lookSlots } from '../lib/rv';

// closed look -> opened look, per layout
const LOOKS: [closed: string, open: string][] = [
  ['v-13ofslm', 'v-cnqtiw'], // desktop, left
  ['v-bzy8p', 'v-1h19swh'], // desktop, right
  ['v-xd6ji4', 'v-m04njo'], // tablet
  ['v-8yuvk1', 'v-bbzrvg'], // tablet, right
  ['v-1e9xkcu', 'v-noea66'], // phone
];

export function initFaqs() {
  for (const item of document.querySelectorAll<HTMLElement>('.m-y6iPh')) {
    // one look per breakpoint on an item merged across breakpoints (lib/rv)
    const looks = lookSlots(item, Object.fromEntries(LOOKS.map(([closed, open]) => [closed, { closed, open }])));
    if (!looks.length) continue;
    item.setAttribute('data-open', '');
    setVariant(item, looks, 'open');
  }
}
