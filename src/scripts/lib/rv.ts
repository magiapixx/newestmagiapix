/**
 * Runtime side of responsive variants (src/lib/rv.ts). A merged element carries its look once per breakpoint
 * as `rv-<bp>-<class>`; a state change has to swap every one of those, each to the state class of its own
 * breakpoint. Unprefixed classes keep working as before.
 */
const PREFIX = /^(rv-(?:p|t|lg|xl|d|tp|dt)-)?(.+)$/;

/** One look on an element: the class prefix it sits behind and its state name -> class map. */
export type Slot = { prefix: string; looks: Record<string, string> };

/**
 * The looks an element carries. `table` maps a base class (as written in the markup) to that look's states;
 * every class on the element that is a base class, plain or behind an rv prefix, becomes a slot.
 */
export function lookSlots(el: Element, table: Record<string, Record<string, string>>): Slot[] {
  return [...el.classList].flatMap((c) => {
    const [, prefix = '', cls] = c.match(PREFIX)!;
    return table[cls] ? [{ prefix, looks: table[cls] }] : [];
  });
}

/** Does the element carry `cls`, plain or behind any rv prefix? */
export function hasClass(el: Element, cls: string): boolean {
  return [...el.classList].some((c) => c.match(PREFIX)![2] === cls);
}

/** Replace `from` with `to`, plain and behind every rv prefix it appears with. */
export function swapClass(el: Element, from: string, to: string) {
  for (const c of [...el.classList]) {
    const [, prefix = '', cls] = c.match(PREFIX)!;
    if (cls === from) el.classList.replace(c, prefix + to);
  }
}

const MEDIA: Record<string, string> = {
  'rv-p-': '(max-width: 809.98px)',
  'rv-t-': '(min-width: 810px) and (max-width: 1199.98px)',
  'rv-lg-': '(min-width: 1200px) and (max-width: 1599.98px)',
  'rv-xl-': '(min-width: 1600px)',
  'rv-d-': '(min-width: 1200px)',
  'rv-tp-': '(max-width: 1199.98px)',
  'rv-dt-': '(min-width: 810px)',
};

/** Does `cls` apply to the element right now: plain, or behind an rv prefix whose breakpoint is the current one? */
export function hasActiveClass(el: Element, cls: string): boolean {
  return [...el.classList].some((c) => {
    const [, prefix = '', name] = c.match(PREFIX)!;
    return name === cls && (!prefix || matchMedia(MEDIA[prefix]).matches);
  });
}

/** Selector matching elements that carry `cls` plain or behind an rv prefix. */
export function anyOf(cls: string): string {
  return `.${cls}, [class*="-${cls}"]`;
}
