import fs from 'node:fs';
import path from 'node:path';

const sourceRoot = path.resolve(process.argv[2] ?? '../mondragon-site');
const projectRoot = path.resolve(process.argv[3] ?? '.');
const contentRoot = path.join(projectRoot, 'src', 'fragments', 'pages');
const pagesRoot = path.join(projectRoot, 'src', 'pages');

fs.rmSync(contentRoot, { recursive: true, force: true });
fs.mkdirSync(contentRoot, { recursive: true });

function findPages(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'assets' || entry.name === '.git') continue;
      findPages(full, out);
    } else if (entry.name === 'index.html') {
      out.push(full);
    }
  }
  return out;
}

function getRoute(relativeFile) {
  const dir = path.dirname(relativeFile);
  return dir === '.' ? '/' : `/${dir.split(path.sep).join('/')}/`;
}

function getSlug(route) {
  if (route === '/') return 'home';
  return route.replace(/^\/|\/$/g, '').replace(/\//g, '-');
}

function readSection(html, openTag, closeTag) {
  const openIndex = html.indexOf(openTag);
  if (openIndex === -1) throw new Error(`Missing ${openTag}`);
  const start = openIndex + openTag.length;
  const end = html.indexOf(closeTag, start);
  if (end === -1) throw new Error(`Missing ${closeTag}`);
  return html.slice(start, end);
}

const pages = findPages(sourceRoot);
const manifest = [];

for (const sourceFile of pages) {
  const relative = path.relative(sourceRoot, sourceFile);
  const route = getRoute(relative);
  const slug = getSlug(route);
  const html = fs.readFileSync(sourceFile, 'utf8');

  const head = readSection(html, '<head>', '</head>');
  const bodyOpen = html.indexOf('<body');
  const bodyStart = html.indexOf('>', bodyOpen) + 1;
  const bodyEnd = html.lastIndexOf('</body>');
  const body = html.slice(bodyStart, bodyEnd);

  if (!head || !body) throw new Error(`Empty head/body for ${relative}`);

  const dir = path.join(contentRoot, slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'head.frag'), head, 'utf8');
  fs.writeFileSync(path.join(dir, 'body.frag'), body, 'utf8');

  const pageDir = route === '/' ? pagesRoot : path.join(pagesRoot, ...route.split('/').filter(Boolean));
  fs.mkdirSync(pageDir, { recursive: true });
  const pageFile = path.join(pageDir, 'index.astro');
  const depth = route === '/' ? 1 : route.split('/').filter(Boolean).length + 1;
  const up = '../'.repeat(depth);
  const pageSource = `---
import BaseLayout from '${up}layouts/BaseLayout.astro';
import head from '${up}fragments/pages/${slug}/head.frag?raw';
import body from '${up}fragments/pages/${slug}/body.frag?raw';
---

<BaseLayout {head} {body} />
`;
  fs.writeFileSync(pageFile, pageSource, 'utf8');

  manifest.push({ route, slug, source: relative.split(path.sep).join('/'), headBytes: Buffer.byteLength(head), bodyBytes: Buffer.byteLength(body) });
}

fs.writeFileSync(
  path.join(projectRoot, 'src', 'fragments', 'pages.json'),
  JSON.stringify(manifest, null, 2) + '\n',
  'utf8'
);

console.log(`Extracted ${manifest.length} pages from ${sourceRoot}`);
for (const item of manifest) {
  console.log(`  ${item.route.padEnd(24)} ${item.slug.padEnd(18)} head=${(item.headBytes / 1024).toFixed(0)}KB body=${(item.bodyBytes / 1024).toFixed(0)}KB`);
}
