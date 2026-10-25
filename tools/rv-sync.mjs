// Scan the built HTML for rv-<bp>-<class> names and generate their CSS copies (rv-css.mjs).
// Usage: npm run rv (builds, then runs this from the project root)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

const here = path.dirname(fileURLToPath(import.meta.url));
const pairs = new Map();
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
  const p = path.join(d, e.name);
  if (e.isDirectory()) walk(p);
  else if (p.endsWith('.html')) {
    for (const m of fs.readFileSync(p, 'utf8').matchAll(/\brv-(p|t|lg|xl|d|tp|dt)-((?:v|type|m)-[A-Za-z0-9-]+)/g)) {
      if (!pairs.has(m[2])) pairs.set(m[2], new Set());
      pairs.get(m[2]).add(m[1]);
    }
  }
});
walk('dist');
// classes added by scripts at runtime (state swaps) are listed in rv-runtime.json next to this file
const extra = path.join(here, 'rv-runtime.json');
if (fs.existsSync(extra)) for (const [token, bps] of Object.entries(JSON.parse(fs.readFileSync(extra, 'utf8')))) {
  if (!pairs.has(token)) pairs.set(token, new Set());
  bps.forEach((b) => pairs.get(token).add(b));
}
const list = [...pairs].map(([token, bps]) => ({ token, bps: [...bps] }));
console.log(`${list.length} classes, ${list.reduce((a, x) => a + x.bps.length, 0)} class/breakpoint pairs`);
const listFile = path.join(os.tmpdir(), 'rv-list.json');
fs.writeFileSync(listFile, JSON.stringify(list));
const out = execFileSync('node', [path.join(here, 'rv-css.mjs'), '@' + listFile,'src/styles/site.css', 'src/styles/interactions.css', 'src/styles/component-states.css'], { encoding: 'utf8' });
console.log(out.trim());
