// Build step: drop the CSS rules that can never match anything on the built site.
// The source stylesheets keep every variant rule, because `npm run rv` copies them into rv-<bp>-<class> rules; after
// the merge most plain variant classes are no longer on any element, so their rules only weigh on the download.
// A selector is dropped when it needs a class that appears neither in the built HTML nor as a literal in the built
// scripts (scripts only add classes they name, optionally behind an rv-<bp>- prefix). Rules with no selector left go,
// and so do @media blocks left empty. Runs on every `astro build` (astro.config.mjs) and only touches dist.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RV = /^rv-(?:p|t|lg|xl|d|tp|dt)-(.+)$/;

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function splitTop(s, sep) {
  const parts = []; let depth = 0, cur = '', quote = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quote) { cur += c; if (c === '\\') { cur += s[++i] ?? ''; } else if (c === quote) quote = null; continue; }
    if (c === '"' || c === "'") quote = c;
    else if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth--;
    if (c === sep && depth === 0) { parts.push(cur); cur = ''; } else cur += c;
  }
  parts.push(cur);
  return parts;
}

// classes a selector needs: everything outside functional pseudo-classes (:not/:is/:where/:has/... may match without them)
function requiredClasses(sel) {
  let flat = '', depth = 0, quote = null;
  for (let i = 0; i < sel.length; i++) {
    const c = sel[i];
    if (quote) { if (c === '\\') i++; else if (c === quote) quote = null; continue; }
    if (c === '"' || c === "'") { quote = c; continue; }
    if (c === '[' || c === '(') { depth++; continue; }
    if (c === ']' || c === ')') { depth--; continue; }
    if (!depth) flat += c;
  }
  return [...flat.matchAll(/\.((?:\\.|[\w-])+)/g)].map((m) => m[1].replace(/\\(.)/g, '$1'));
}

export function prune(css, used) {
  const keep = (cls) => {
    if (used.has(cls)) return true;
    const m = RV.exec(cls);
    return !!m && used.has(m[1]) && used.rvLooks.has(m[1]);
  };
  let dropped = 0;
  function block(src) {
    let out = '', i = 0;
    const n = src.length;
    while (i < n) {
      const ws = /\s*/y; ws.lastIndex = i; ws.exec(src); out += src.slice(i, ws.lastIndex); i = ws.lastIndex;
      if (i >= n) break;
      if (src.startsWith('/*', i)) { const e = src.indexOf('*/', i) + 2; out += src.slice(i, e); i = e; continue; }
      let j = i, quote = null;
      for (; j < n; j++) {
        const c = src[j];
        if (quote) { if (c === '\\') { j++; continue; } if (c === quote) quote = null; continue; }
        if (c === '"' || c === "'") quote = c;
        else if (c === '{' || c === ';' || c === '}') break;
      }
      if (j >= n || src[j] !== '{') { out += src.slice(i, Math.min(j + 1, n)); i = j + 1; continue; }
      const head = src.slice(i, j);
      let k = j + 1, depth = 1; quote = null;
      for (; k < n && depth; k++) {
        const c = src[k];
        if (quote) { if (c === '\\') { k++; continue; } if (c === quote) quote = null; continue; }
        if (c === '"' || c === "'") quote = c;
        else if (c === '{') depth++; else if (c === '}') depth--;
      }
      const body = src.slice(j + 1, k - 1);
      const h = head.trim();
      if (/^@(media|supports|container|layer)\b/.test(h)) {
        const inner = block(body);
        if (inner.trim()) out += `${head}{${inner}}`;
      } else if (h.startsWith('@') || /^(from|to|\d+%)/.test(h)) {
        out += `${head}{${body}}`; // @font-face, @keyframes, ...
      } else {
        const sels = splitTop(head, ',');
        const live = sels.filter((s) => requiredClasses(s).every(keep));
        dropped += sels.length - live.length;
        if (live.length) out += `${live.length === sels.length ? head : live.map((s) => s.trim()).join(',')}{${body}}`;
      }
      i = k;
    }
    return out;
  }
  return { css: block(css), dropped };
}

export function usedClasses(dist) {
  const used = new Set();
  used.rvLooks = new Set();
  const files = walk(dist);
  for (const f of files.filter((f) => f.endsWith('.html'))) {
    const html = fs.readFileSync(f, 'utf8');
    for (const m of html.matchAll(/\bclass\s*=\s*("([^"]*)"|'([^']*)')/g)) {
      for (const c of (m[2] ?? m[3]).split(/\s+/)) if (c) used.add(c);
    }
    // inline scripts and attribute values can name classes too: keep every word-like token
    for (const m of html.matchAll(/[\w-]+/g)) used.add(m[0]);
  }
  for (const f of files.filter((f) => /\.(m?js)$/.test(f))) {
    for (const m of fs.readFileSync(f, 'utf8').matchAll(/[\w-]+/g)) used.add(m[0]);
  }
  // a look a script may put behind an rv-<bp>- prefix: any look that some element already carries that way,
  // plus the runtime-only ones listed for `npm run rv`
  for (const c of used) { const m = RV.exec(c); if (m) used.rvLooks.add(m[1]); }
  const runtime = path.join(path.dirname(fileURLToPath(import.meta.url)), 'rv-runtime.json');
  if (fs.existsSync(runtime)) for (const k of Object.keys(JSON.parse(fs.readFileSync(runtime, 'utf8')))) used.rvLooks.add(k);
  return used;
}

export function pruneDist(dist) {
  const used = usedClasses(dist);
  const report = [];
  for (const f of walk(dist).filter((f) => f.endsWith('.css'))) {
    const before = fs.readFileSync(f, 'utf8');
    const { css, dropped } = prune(before, used);
    fs.writeFileSync(f, css);
    report.push(`${path.relative(dist, f)}: ${(before.length / 1024).toFixed(0)} -> ${(css.length / 1024).toFixed(0)} KB, ${dropped} selectors dropped`);
  }
  return report;
}

export default function cssPrune() {
  return {
    name: 'css-prune',
    hooks: {
      'astro:build:done': ({ dir, logger }) => {
        for (const line of pruneDist(fileURLToPath(dir))) logger.info(line);
      },
    },
  };
}
