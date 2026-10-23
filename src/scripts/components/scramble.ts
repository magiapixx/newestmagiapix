/**
 * Letter scramble: when a text block is half in view, its letters flicker
 * through random characters for a moment before settling.
 */
import { inView } from '../lib/motion';

const TARGETS = [
  '.m-fyyctf, .m-2z319, .m-1mr26j2, .m-meosom', // contact details
  '.m-jx0wkh, .m-8qqfur', // about intro texts
  '.m-y6iPh .m-nh3uw0', // FAQ questions
].join(',');
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const STEPS = 17;
const EVERY = 40; // ms

const randomize = (s: string) =>
  s
    .split('')
    .map((c) => (c.trim() === '' ? c : LETTERS[Math.floor(Math.random() * LETTERS.length)]))
    .join('');

function scramble(el: HTMLElement) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  const original = nodes.map((n) => n.data);
  // hold the box steady while the letters change width
  const { width, height } = el.getBoundingClientRect();
  const lock = { minWidth: `${width}px`, maxWidth: `${width}px`, minHeight: `${height}px`, maxHeight: `${height}px`, overflow: 'hidden' };
  const saved = Object.fromEntries(Object.keys(lock).map((k) => [k, el.style[k as keyof typeof lock]]));
  Object.assign(el.style, lock);
  let step = 0;
  const timer = setInterval(() => {
    nodes.forEach((n, i) => (n.data = randomize(original[i])));
    if (++step >= STEPS) {
      clearInterval(timer);
      nodes.forEach((n, i) => (n.data = original[i]));
      Object.assign(el.style, saved);
    }
  }, EVERY);
}

export function initScramble() {
  for (const el of document.querySelectorAll<HTMLElement>(TARGETS)) {
    inView(el, () => scramble(el), { amount: 0.5 });
  }
}
