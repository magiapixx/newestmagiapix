/**
 * Small animation toolkit used by the site's interactions.
 *
 * Transitions are described the same way across the codebase:
 *   { type: 'spring', duration, bounce, delay }  (seconds)
 *   { type: 'tween', duration, ease: [x1, y1, x2, y2], delay }
 * Springs are converted to a CSS `linear()` easing so they can run on the
 * Web Animations API without a JS animation loop.
 */
import type { Slot } from './rv';

export type Spring = { type?: 'spring'; duration?: number; bounce?: number; delay?: number };
export type Tween = { type: 'tween'; duration?: number; ease?: [number, number, number, number]; delay?: number };
export type Transition = Spring | Tween;

const SAFE_MIN = 0.001;
const springCache = new Map<string, { easing: string; duration: number }>();

/** Solve the spring constants that settle (to within 0.1%) in `duration` seconds. */
function findSpring(duration: number, bounce: number) {
  const ratio = Math.min(Math.max(1 - bounce, 0.05), 1);
  const angular = (w: number) => w * Math.sqrt(1 - ratio * ratio);
  let envelope: (w: number) => number;
  let derivative: (w: number) => number;
  if (ratio < 1) {
    envelope = (w) => {
      const decay = w * ratio;
      return SAFE_MIN - (decay / angular(w)) * Math.exp(-decay * duration);
    };
    derivative = (w) => {
      const decay = w * ratio;
      const delta = decay * duration;
      const e = ratio * ratio * w * w * duration;
      const g = angular(w * w);
      const factor = -envelope(w) + SAFE_MIN > 0 ? -1 : 1;
      return (factor * (-e * Math.exp(-delta))) / g;
    };
  } else {
    envelope = (w) => -SAFE_MIN + Math.exp(-w * duration) * (w * duration + 1);
    derivative = (w) => Math.exp(-w * duration) * (-w * duration * duration);
  }
  let w = 5 / duration;
  for (let i = 0; i < 12; i++) w = w - envelope(w) / derivative(w);
  return { omega: w, ratio };
}

/** Position (0 → 1) of a spring released from rest, at time t (seconds). */
function springAt(t: number, omega: number, ratio: number) {
  if (ratio < 1) {
    const wd = omega * Math.sqrt(1 - ratio * ratio);
    const env = Math.exp(-ratio * omega * t);
    return 1 - env * (((ratio * omega) / wd) * Math.sin(wd * t) + Math.cos(wd * t));
  }
  return 1 - Math.exp(-omega * t) * (1 + omega * t);
}

export function springTiming(duration = 0.3, bounce = 0.25) {
  const key = `${duration}:${bounce}`;
  const hit = springCache.get(key);
  if (hit) return hit;
  const { omega, ratio } = findSpring(Math.min(Math.max(duration, 0.01), 10), bounce);
  // run until the spring has settled
  let end = duration;
  while (end < duration * 4) {
    let settled = true;
    for (let t = end; t < end + 0.1; t += 0.01) if (Math.abs(1 - springAt(t, omega, ratio)) > 0.002) settled = false;
    if (settled) break;
    end += 0.05;
  }
  const steps = 48;
  const points: string[] = [];
  for (let i = 0; i <= steps; i++) points.push(springAt((end * i) / steps, omega, ratio).toFixed(4));
  points[steps] = '1';
  const res = { easing: `linear(${points.join(', ')})`, duration: end * 1000 };
  springCache.set(key, res);
  return res;
}

export function timing(tr: Transition = {}): { duration: number; easing: string; delay: number } {
  const delay = (tr.delay ?? 0) * 1000;
  if (tr.type === 'tween') {
    const [a, b, c, d] = tr.ease ?? [0.44, 0, 0.56, 1];
    return { duration: (tr.duration ?? 0.3) * 1000, easing: `cubic-bezier(${a}, ${b}, ${c}, ${d})`, delay };
  }
  const s = springTiming(tr.duration ?? 0.3, tr.bounce ?? 0.25);
  return { ...s, delay };
}

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Animate an element and keep the final frame as inline style. */
export function animate(el: Element, frames: Keyframe[], tr: Transition = {}) {
  const t = timing(tr);
  const anim = el.animate(frames, { ...t, fill: 'both' });
  anim.finished
    .then(() => {
      if (!el.isConnected) return;
      try {
        anim.commitStyles();
      } catch {
        /* element not rendered */
      }
      anim.cancel();
    })
    .catch(() => {});
  return anim;
}

/** Fire `cb` when `el` scrolls into view. `amount` mirrors IntersectionObserver threshold. */
export function inView(el: Element, cb: (visible: boolean) => void, { amount = 0, once = true, margin = '0px' } = {}) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const visible = e.isIntersecting && e.intersectionRatio >= Math.min(amount, 0.99);
        if (visible || !once) cb(visible);
        if (visible && once) io.disconnect();
      }
    },
    { threshold: amount > 0 ? [amount] : [0], rootMargin: margin },
  );
  io.observe(el);
  return () => io.disconnect();
}

const LAYOUT_PROPS = ['opacity', 'transform', 'backgroundColor', 'color', 'borderTopColor', 'borderRadius', 'filter', 'fill', 'stroke'] as const;

type Snapshot = { el: HTMLElement; w: number; h: number; x: number; y: number; abs: boolean; clips: boolean; style: Record<string, string>; shown: boolean };

function snapshot(el: HTMLElement): Snapshot {
  const cs = getComputedStyle(el);
  const style: Record<string, string> = {};
  for (const p of LAYOUT_PROPS) style[p] = cs[p as any];
  return {
    el,
    w: el.offsetWidth,
    h: el.offsetHeight,
    x: el.offsetLeft,
    y: el.offsetTop,
    abs: cs.position === 'absolute' || cs.position === 'fixed',
    clips: cs.overflow !== 'visible',
    style,
    shown: cs.display !== 'none',
  };
}

/**
 * Change an element's state (usually a variant class) and animate everything
 * that moved, resized or changed colour/opacity inside it.
 */
export function transitionState(root: HTMLElement, mutate: () => void, tr: Transition = {}) {
  const els = [root, ...root.querySelectorAll<HTMLElement>('*')].filter((e) => e instanceof HTMLElement);
  // only restart this root's own transition: one started by a nested component (e.g. an image
  // reveal inside a service row that gets hovered) keeps playing instead of jumping to its end
  for (const el of els) for (const a of el.getAnimations()) if ((a as any).__state === root) a.cancel();
  const before = els.map(snapshot);
  mutate();
  if (reducedMotion()) return;
  const t = timing(tr);
  els.forEach((el, i) => {
    const a = before[i];
    if (!el.isConnected) return;
    const b = snapshot(el);
    if (!a.shown || !b.shown) return;
    const from: Keyframe = {};
    const to: Keyframe = {};
    // a clipping box that grows in the flow would hide its new content while it
    // animates, so those just take their new size (their neighbours still slide)
    const resize = b.abs || !b.clips;
    if (resize && a.w !== b.w) ((from.width = a.w + 'px'), (to.width = b.w + 'px'));
    if (resize && a.h !== b.h) ((from.height = a.h + 'px'), (to.height = b.h + 'px'));
    if (b.abs && (a.x !== b.x || a.y !== b.y)) {
      Object.assign(from, { left: a.x + 'px', top: a.y + 'px', right: 'auto', bottom: 'auto' });
      Object.assign(to, { left: b.x + 'px', top: b.y + 'px', right: 'auto', bottom: 'auto' });
    } else if (!b.abs && (a.x !== b.x || a.y !== b.y)) {
      // in-flow element pushed around by its siblings: slide it from where it was
      from.translate = `${a.x - b.x}px ${a.y - b.y}px`;
      to.translate = '0px 0px';
    }
    for (const p of LAYOUT_PROPS) if (a.style[p] !== b.style[p]) ((from[p] = a.style[p]), (to[p] = b.style[p]));
    if (!Object.keys(to).length) return;
    const anim = el.animate([from, to], { ...t, fill: 'none' });
    (anim as any).__state = root;
  });
}

/** Swap one variant class for another on a component root. */
/**
 * Switch an element to the look `name`. `variants` is one state name -> class map, or one per breakpoint
 * slot (lib/rv `lookSlots`) for an element that carries a look per breakpoint.
 */
export function setVariant(root: HTMLElement, variants: Record<string, string> | Slot[], name: string, tr?: Transition) {
  const slots: Slot[] = Array.isArray(variants) ? variants : [{ prefix: '', looks: variants }];
  const todo = slots.filter((s) => s.looks[name] && !root.classList.contains(s.prefix + s.looks[name]));
  if (!todo.length) return;
  const apply = () => {
    for (const { prefix, looks } of todo) {
      for (const c of Object.values(looks)) root.classList.remove(prefix + c);
      root.classList.add(prefix + looks[name]);
    }
    root.dataset.variant = name;
  };
  if (tr) transitionState(root, apply, tr);
  else apply();
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
