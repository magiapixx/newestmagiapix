/**
 * Letter scramble: letters flicker through random characters and resolve one
 * by one, left to right.
 *
 * Each letter is drawn over an invisible copy of itself, so the random
 * characters never change the line breaks. Text that is already split this
 * way in the markup (an `aria-label` host with hidden + overlay spans per
 * letter) is animated in place; other text is split for the animation and
 * put back afterwards. Spaces and punctuation stay as they are.
 *
 * Markup can opt in with `data-scramble`:
 * - `data-scramble`: scramble when the text comes into view.
 * - `data-scramble="sweep"`: follow the accent bars (accent.ts) of the component the text sits in. A letter starts
 *   flickering once the bar of its row has swept over it and resolves as that bar's left edge leaves it, so the
 *   bars read as decoding the text. Where the bars are not shown (e.g. hidden on phones) the text scrambles plainly
 *   when the bars would have started.
 */
import { inView, reducedMotion } from '../lib/motion';
import { accentPhase, accentsIn } from './accent';

const TARGETS = [
  '[data-scramble=""]',
  '.m-fyyctf, .m-2z319, .m-1mr26j2, .m-meosom', // contact details
  '.m-jx0wkh, .m-8qqfur', // about intro texts
  '.m-1o6rsix', // contact form intro
  '.m-faSoo div[aria-label]', // home about blurb
  '.m-y6iPh .m-nh3uw0', // FAQ questions
].join(',');
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS = '0123456789';
const DURATION = 900; // ms for the whole block to resolve
const MAX_STAGGER = 28; // ms between letters on short texts
const SCRAMBLE = 260; // ms each letter keeps flickering before it resolves
const TICK = 45; // ms between random characters
const SWEEP_TIMEOUT = 3000; // ms after which a sweep resolves whatever is left

const random = (c: string) => {
  const set = /\d/.test(c) ? DIGITS : LETTERS;
  return set[Math.floor(Math.random() * set.length)];
};
const scrambles = (c: string) => /[\p{L}\p{N}]/u.test(c);

type Cell = { el: HTMLElement; char: string };
/** A letter's state: as written, flickering, or resolved. */
type Phase = 0 | 1 | 2;
/** Given the letters, returns for each frame (ms since the start) the phase of each letter. */
type Plan = (cells: Cell[], root: HTMLElement) => (t: number) => (i: number) => Phase;

/** Wrap each letter in a fixed-width cell (an invisible copy plus an overlay); returns the cells and an undo. */
function split(root: HTMLElement): { cells: Cell[]; restore: () => void } {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) if ((walker.currentNode as Text).data.trim()) nodes.push(walker.currentNode as Text);
  const cells: Cell[] = [];
  const swaps: [Node, Text][] = [];
  for (const node of nodes) {
    const frag = document.createDocumentFragment();
    for (const part of node.data.split(/(\s+)/)) {
      if (!part) continue;
      if (/^\s+$/.test(part)) {
        frag.append(part);
        continue;
      }
      const word = document.createElement('span');
      word.style.whiteSpace = 'nowrap';
      for (const char of part) {
        if (!scrambles(char)) {
          word.append(char);
          continue;
        }
        const cell = document.createElement('span');
        cell.style.cssText = 'position:relative;display:inline-block';
        const hold = document.createElement('span');
        hold.style.visibility = 'hidden';
        hold.textContent = char;
        const shown = document.createElement('span');
        shown.style.cssText = 'position:absolute;left:0;top:0;width:100%;text-align:center;letter-spacing:0';
        shown.textContent = char;
        cell.append(hold, shown);
        word.append(cell);
        cells.push({ el: shown, char });
      }
      frag.append(word);
    }
    const holder = document.createElement('span');
    holder.append(frag);
    node.replaceWith(holder);
    swaps.push([holder, node]);
  }
  return { cells, restore: () => swaps.forEach(([holder, node]) => holder.replaceWith(node)) };
}

/** Letters the markup already split (hidden copy + absolutely positioned overlay). */
function presplit(root: HTMLElement): Cell[] {
  return [...root.querySelectorAll<HTMLElement>('span[aria-hidden="true"][style*="position:absolute"]')]
    .filter((el) => scrambles(el.textContent ?? ''))
    .map((el) => ({ el, char: el.textContent! }));
}

/** The whole block resolves left to right in DURATION. */
const stagger: Plan = (cells) => {
  const step = Math.min(MAX_STAGGER, (DURATION - SCRAMBLE) / cells.length);
  return (t) => (i) => (t >= i * step + SCRAMBLE ? 2 : t >= i * step * 0.5 ? 1 : 0);
};

/** Each letter follows the accent bar whose row it sits in. */
const sweep = (bars: HTMLElement[]): Plan => (cells, root) => {
  const origin = root.getBoundingClientRect();
  const rows = bars.map((b) => b.getBoundingClientRect()).map((r) => [r.top - origin.top, r.bottom - origin.top]);
  const letters = cells.map(({ el }) => {
    const r = (el.parentElement ?? el).getBoundingClientRect();
    const y = (r.top + r.bottom) / 2 - origin.top;
    // the row the letter's middle falls in, or the nearest one
    let bar = 0;
    let best = Infinity;
    rows.forEach(([top, bottom], k) => {
      const d = y < top ? top - y : y > bottom ? y - bottom : 0;
      if (d < best) [best, bar] = [d, k];
    });
    return { bar, x: (r.left + r.right) / 2 - origin.left };
  });
  return (t) => {
    if (t >= SWEEP_TIMEOUT) return () => 2;
    const now = root.getBoundingClientRect();
    const edges = bars.map((b) => {
      const fill = (b.firstElementChild as HTMLElement | null)?.getBoundingClientRect();
      return { phase: accentPhase(b), left: (fill?.left ?? 0) - now.left, right: (fill?.right ?? 0) - now.left, width: fill?.width ?? 0 };
    });
    return (i) => {
      const { bar, x } = letters[i];
      const e = edges[bar];
      if (e.phase === 'out' && (e.width <= 1 || e.left >= x)) return 2;
      return e.phase !== 'waiting' && e.right >= x ? 1 : 0;
    };
  };
};

function scramble(root: HTMLElement, plan: Plan = stagger) {
  const ready = presplit(root);
  const { cells, restore } = ready.length ? { cells: ready, restore: () => {} } : split(root);
  if (!cells.length) return restore();
  const phases = plan(cells, root);
  const start = performance.now();
  let lastTick = -Infinity;
  const frame = (now: number) => {
    const phaseOf = phases(now - start);
    const tick = now - lastTick >= TICK;
    if (tick) lastTick = now;
    let done = true;
    cells.forEach((cell, i) => {
      const phase = phaseOf(i);
      if (phase === 2) {
        if (cell.el.textContent !== cell.char) cell.el.textContent = cell.char;
        return;
      }
      done = false;
      if (phase === 1 && tick) cell.el.textContent = random(cell.char);
    });
    if (done) restore();
    else requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

/** Run `cb` once, as soon as one of the accent bars starts its sweep. */
function onSweepStart(bars: HTMLElement[], cb: () => void) {
  const started = () => bars.some((b) => accentPhase(b) !== 'waiting');
  if (started()) return cb();
  const mo = new MutationObserver(() => {
    if (!started()) return;
    mo.disconnect();
    cb();
  });
  for (const b of bars) mo.observe(b, { attributes: true, attributeFilter: ['class'] });
}

export function initScramble() {
  if (reducedMotion()) return;
  for (const el of document.querySelectorAll<HTMLElement>(TARGETS)) {
    inView(el, () => scramble(el), { amount: 0.3 });
  }
  for (const el of document.querySelectorAll<HTMLElement>('[data-scramble="sweep"]')) {
    // the bars of the nearest component around the text
    let scope = el.parentElement;
    while (scope && !accentsIn(scope).length) scope = scope.parentElement;
    const bars = scope ? accentsIn(scope) : [];
    if (!bars.length) {
      inView(el, () => scramble(el), { amount: 0.3 });
      continue;
    }
    onSweepStart(bars, () => scramble(el, bars.some((b) => b.getClientRects().length) ? sweep(bars) : stagger));
  }
}
