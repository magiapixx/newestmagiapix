/**
 * Letter scramble: when a text block comes into view, its letters flicker
 * through random characters and resolve one by one, left to right.
 *
 * Each letter is drawn over an invisible copy of itself, so the random
 * characters never change the line breaks. Text that is already split this
 * way in the markup (an `aria-label` host with hidden + overlay spans per
 * letter) is animated in place; other text is split for the animation and
 * put back afterwards. Spaces and punctuation stay as they are.
 */
import { inView, reducedMotion } from '../lib/motion';

const TARGETS = [
  '.m-fyyctf, .m-2z319, .m-1mr26j2, .m-meosom', // contact details
  '.m-jx0wkh, .m-8qqfur', // about intro texts
  '.m-1o6rsix', // contact form intro
  '.m-faSoo .m-a6ig74, .m-faSoo div[aria-label]', // home about statement and blurb
  '.m-y6iPh .m-nh3uw0', // FAQ questions
].join(',');
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS = '0123456789';
const DURATION = 900; // ms for the whole block to resolve
const MAX_STAGGER = 28; // ms between letters on short texts
const SCRAMBLE = 260; // ms each letter keeps flickering before it resolves
const TICK = 45; // ms between random characters

const random = (c: string) => {
  const set = /\d/.test(c) ? DIGITS : LETTERS;
  return set[Math.floor(Math.random() * set.length)];
};
const scrambles = (c: string) => /[\p{L}\p{N}]/u.test(c);

type Cell = { el: HTMLElement; char: string };

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

function scramble(root: HTMLElement) {
  const ready = presplit(root);
  const { cells, restore } = ready.length ? { cells: ready, restore: () => {} } : split(root);
  if (!cells.length) return restore();
  const stagger = Math.min(MAX_STAGGER, (DURATION - SCRAMBLE) / cells.length);
  const start = performance.now();
  let lastTick = -Infinity;
  const frame = (now: number) => {
    const t = now - start;
    const tick = now - lastTick >= TICK;
    if (tick) lastTick = now;
    let done = true;
    cells.forEach((cell, i) => {
      const resolveAt = i * stagger + SCRAMBLE;
      if (t >= resolveAt) {
        if (cell.el.textContent !== cell.char) cell.el.textContent = cell.char;
      } else {
        done = false;
        if (tick && t >= i * stagger * 0.5) cell.el.textContent = random(cell.char);
      }
    });
    if (done) restore();
    else requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

export function initScramble() {
  if (reducedMotion()) return;
  for (const el of document.querySelectorAll<HTMLElement>(TARGETS)) {
    inView(el, () => scramble(el), { amount: 0.3 });
  }
}
