/**
 * Responsive variants: one element that looks like a different design variant per breakpoint.
 *
 * Breakpoints (same ranges as styles/breakpoints.css): p < 810 ≤ t < 1200 ≤ lg < 1600 ≤ xl.
 * `rv({ lg: 'v-a', xl: 'v-a', t: 'v-b', p: 'v-c' })` returns `rv-d-v-a rv-t-v-b rv-p-v-c`; each `rv-<bp>-<class>`
 * gets a media-scoped copy of every CSS rule that uses `.<class>`, so the element behaves like it has that
 * class only inside that breakpoint. The copies are generated into the stylesheets by `npm run rv`
 * (tools/rv-sync.mjs) from the classes found in the built pages; re-run it after changing any rv() map.
 * Classes that scripts only add at runtime (state looks) are listed in tools/rv-runtime.json.
 */
export type Bp = 'p' | 't' | 'lg' | 'xl';
export type PerBp<T> = Record<Bp, T>;
export const BPS: Bp[] = ['p', 't', 'lg', 'xl'];

// widest groups first, so equal neighbours collapse into one class
const GROUPS: [string, Bp[]][] = [
  ['all', ['p', 't', 'lg', 'xl']],
  ['dt', ['t', 'lg', 'xl']],
  ['tp', ['p', 't']],
  ['d', ['lg', 'xl']],
  ['p', ['p']],
  ['t', ['t']],
  ['lg', ['lg']],
  ['xl', ['xl']],
];

/** Split a per-breakpoint map into [group, value] pairs covering every breakpoint once. */
export function groups<T>(map: PerBp<T>): [string, T][] {
  const left = new Set<Bp>(BPS);
  const out: [string, T][] = [];
  for (const [name, bps] of GROUPS) {
    if (!bps.every((b) => left.has(b))) continue;
    const v = map[bps[0]];
    if (bps.every((b) => map[b] === v)) {
      out.push([name, v]);
      bps.forEach((b) => left.delete(b));
    }
  }
  return out;
}

/** Classes for a per-breakpoint class name (space-separated lists allowed; empty string = none). */
export function rv(map: PerBp<string | undefined>): string {
  return groups(map)
    .flatMap(([g, v]) => (v ?? '').split(/\s+/).filter(Boolean).map((c) => (g === 'all' ? c : `rv-${g}-${c}`)))
    .join(' ');
}

/** Hide classes (styles/breakpoints.css) for the breakpoints where `show` is false. */
export function hideWhere(show: PerBp<boolean>): string {
  const names: Record<Bp, string> = { p: 'hide-phone', t: 'hide-tablet', lg: 'hide-lg', xl: 'hide-xl' };
  return BPS.filter((b) => !show[b]).map((b) => names[b]).join(' ');
}
