// Responsive variant classes.
// Usage: node rv-css.mjs '<json [{ "token": "v-abc123", "bps": ["t","p"] }, ...]>' file.css [file.css...]
// For every rule whose selector uses `.token`, inserts right after that rule a copy wrapped in the breakpoint's
// media query, with `.token` renamed to `.rv-<bp>-<token>`. Copies sit next to the original so the cascade order
// (and specificity, a class for a class) is unchanged; an element carrying `rv-t-v-abc123` behaves like one with
// `v-abc123` but only between 810px and 1199.98px. Already generated copies are skipped, so it can be re-run.
import fs from 'node:fs';

export const BP = {
  p: '(max-width:809.98px)',
  t: '(min-width:810px) and (max-width:1199.98px)',
  lg: '(min-width:1200px) and (max-width:1599.98px)',
  xl: '(min-width:1600px)',
  d: '(min-width:1200px)',
  tp: '(max-width:1199.98px)',
  dt: '(min-width:810px)',
};

const [json, ...files] = process.argv.slice(2);
const wanted = JSON.parse(json.startsWith('@') ? fs.readFileSync(json.slice(1), 'utf8') : json);
const esc = (t) => t.replace(/[-]/g, '\\-');

function splitSelectors(sel) {
  const parts = []; let depth = 0, cur = '';
  for (const c of sel) {
    if (c === '(') depth++; else if (c === ')') depth--;
    if (c === ',' && depth === 0) { parts.push(cur); cur = ''; } else cur += c;
  }
  parts.push(cur);
  return parts.map((s) => s.trim()).filter(Boolean);
}

// walk the CSS text; for each style rule call fn(selector, body) and let it return text to insert after the rule
function transform(css, fn) {
  let out = '';
  let i = 0;
  const n = css.length;
  const copyUntil = (j) => { out += css.slice(i, j); i = j; };
  function block(end) {
    // parse rules until `end` index (exclusive)
    while (i < end) {
      // skip whitespace/comments
      const ws = /\s*/y; ws.lastIndex = i; ws.exec(css); copyUntil(ws.lastIndex);
      if (i >= end) break;
      if (css.startsWith(NEG_OPEN, i)) {
        // a rule rewritten for :not() on an earlier run: rebuild it from the original it saved
        const stop = css.indexOf('*/', i);
        const original = Buffer.from(css.slice(i + NEG_OPEN.length, stop), 'base64').toString('utf8');
        const endAt = css.indexOf(NEG_CLOSE, stop) + NEG_CLOSE.length;
        const brace = original.indexOf('{');
        const r = fn(original.slice(0, brace).trim(), original.slice(brace + 1, -1));
        out += r.replace !== undefined ? r.replace : original;
        out += r.extra;
        i = endAt;
        continue;
      }
      if (css.startsWith('/*', i)) { copyUntil(css.indexOf('*/', i) + 2); continue; }
      // find head end
      let j = i, quote = null;
      for (; j < end; j++) {
        const c = css[j];
        if (quote) { if (c === '\\') { j++; continue; } if (c === quote) quote = null; continue; }
        if (c === '"' || c === "'") quote = c;
        else if (c === '{' || c === ';' || c === '}') break;
      }
      if (j >= end || css[j] !== '{') { copyUntil(Math.min(j + 1, end)); continue; }
      const head = css.slice(i, j).trim();
      // find matching brace
      let k = j + 1, depth = 1; quote = null;
      for (; k < n && depth; k++) {
        const c = css[k];
        if (quote) { if (c === '\\') { k++; continue; } if (c === quote) quote = null; continue; }
        if (c === '"' || c === "'") quote = c;
        else if (c === '{') depth++; else if (c === '}') depth--;
      }
      const close = k - 1; // index of matching '}'
      if (head.startsWith('@media') || head.startsWith('@supports') || head.startsWith('@container') || head.startsWith('@layer')) {
        copyUntil(j + 1);
        block(close);
        copyUntil(close + 1);
        continue;
      }
      if (head.startsWith('@')) { copyUntil(close + 1); continue; }
      const body = css.slice(j + 1, close);
      const r = fn(head, body);
      if (r.replace !== undefined) { out += r.replace; i = close + 1; }
      else copyUntil(close + 1);
      out += r.extra;
    }
  }
  block(n);
  return out;
}

// Rules that test a variant class inside :not(...) can't be handled by a copy: the original rule still matches an
// element that only carries rv-<bp>-<class>. Those are rewritten in place, once per breakpoint, with the rv names
// of that breakpoint added to the :not() list. The original is kept (base64) in a marker so re-runs rebuild it.
const NEG_OPEN = '/*rv-neg:';
const NEG_CLOSE = '/*rv-neg-end*/';
const ATOMIC = ['p', 't', 'lg', 'xl'];
const COVER = { p: ['p', 'tp'], t: ['t', 'tp', 'dt'], lg: ['lg', 'd', 'dt'], xl: ['xl', 'd', 'dt'] };
const tokRe = (t) => new RegExp('\\.' + esc(t) + '(?![\\w-])', 'g');

// apply fn to the argument list of every :not(...) in a selector
function mapNots(sel, fn) {
  let out = '', i = 0;
  while (i < sel.length) {
    const at = sel.indexOf(':not(', i);
    if (at < 0) { out += sel.slice(i); break; }
    let k = at + 5, depth = 1;
    for (; k < sel.length && depth; k++) { if (sel[k] === '(') depth++; else if (sel[k] === ')') depth--; }
    out += sel.slice(i, at) + ':not(' + fn(splitSelectors(sel.slice(at + 5, k - 1))).join(', ') + ')';
    i = k;
  }
  return out;
}
const insideNot = (sel, token) => { let found = false; mapNots(sel, (args) => { if (args.some((a) => tokRe(token).test(a))) found = true; return args; }); return found; };
const outsideNot = (sel, token) => tokRe(token).test(mapNots(sel, () => []));

// drop everything a previous run generated, so each run rebuilds the output from the hand-written CSS alone
function strip(css) {
  let s = css.replace(/\/\*rv-neg:([A-Za-z0-9+/=]+)\*\/[\s\S]*?\/\*rv-neg-end\*\//g, (_, b64) => Buffer.from(b64, 'base64').toString('utf8'));
  for (const m of Object.values(BP)) {
    const re = new RegExp('@media ' + m.replace(/[()]/g, '\\$&') + '\\{[^{}]*\\.rv-(?:p|t|lg|xl|d|tp|dt)-[^{}]*\\{[^{}]*\\}\\}', 'g');
    s = s.replace(re, '');
  }
  return s;
}

let added = 0, rewritten = 0;
for (const file of files) {
  const before = fs.readFileSync(file, 'utf8');
  const css = strip(before);
  const existing = css;
  const next = transform(css, (head, body) => {
    let extra = '';
    let replace;
    const neg = wanted.filter(({ token }) => insideNot(head, token));
    if (neg.length) {
      const perBp = ATOMIC.map((b) => {
        const h = mapNots(head, (args) => args.flatMap((a) => {
          const more = [];
          for (const { token, bps } of neg) {
            if (!tokRe(token).test(a)) continue;
            for (const g of bps.filter((g) => COVER[b].includes(g))) more.push(a.replace(tokRe(token), `.rv-${g}-${token}`));
          }
          return [a, ...more];
        }));
        return `@media ${BP[b]}{${h}{${body}}}`;
      });
      replace = NEG_OPEN + Buffer.from(`${head}{${body}}`, 'utf8').toString('base64') + '*/' + perBp.join('') + NEG_CLOSE;
      rewritten++;
    }
    for (const { token, bps } of wanted) {
      if (!splitSelectors(head).some((s) => outsideNot(s, token))) continue;
      const sels = splitSelectors(head).filter((s) => outsideNot(s, token));
      for (const bp of bps) {
        if (!BP[bp]) throw new Error('unknown bp ' + bp);
        const cls = `rv-${bp}-${token}`;
        // rename only the positive occurrences; :not() arguments keep the plain name
        const copied = sels.map((s) => {
          const parts = [];
          const masked = mapNots(s, (args) => { parts.push(args); return [`\u0000${parts.length - 1}\u0000`]; });
          return masked.replace(tokRe(token), '.' + cls).replace(/\u0000(\d+)\u0000/g, (_, n) => parts[+n].join(', '));
        });
        const rule = `@media ${BP[bp]}{${copied.join(',')}{${body}}}`;
        if (existing.includes(rule)) continue;
        extra += rule;
        added++;
      }
    }
    return { replace, extra };
  });
  if (next !== before) fs.writeFileSync(file, next);
}
console.log(`added ${added} responsive copies, rewrote ${rewritten} :not() rules`);
