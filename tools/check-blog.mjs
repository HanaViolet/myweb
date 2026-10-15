import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
import { load } from 'cheerio';
import { parse } from 'yaml';
import { createHash } from 'node:crypto';
const data = JSON.parse(await readFile('.generated/blog.json', 'utf8'));
const upstream = JSON.parse(await readFile('docs/rhine-upstream.json', 'utf8'));
for (const [file, expected] of Object.entries(upstream.protectedFiles)) {
  assert.equal(createHash('sha256').update(await readFile(file)).digest('hex'), expected, `Upstream visual core changed: ${file}`);
}
const sourcePosts = (await readdir('source/_posts')).filter(p => p.endsWith('.md'));
assert.equal(data.records.filter(r => r.kind === 'post').length, sourcePosts.length);
assert.equal(new Set(data.records.map(r => r.id)).size, data.records.length);
assert.equal(data.columns.length, 5);
for (const col of data.columns) assert(data.records.some(r => r.category === col), `Empty column: ${col}`);
for (const file of sourcePosts) {
  const raw = await readFile(`source/_posts/${file}`, 'utf8');
  const meta = parse(raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)[1]);
  const record = data.records.find(r => r.route === `/posts/${meta.abbrlink}/`);
  assert(record, `Missing old permalink: ${file}`);
  assert.equal(record.title, meta.title);
  const images = [...raw.matchAll(/!\[[^\]]*\]\(([^\s)]+)/g)];
  assert.equal(load(record.html)('img').length, images.length, `Lost images: ${file}`);
  const html = await readFile(`public${record.route}index.html`, 'utf8');
  assert(html.includes(record.title));
  assert(html.includes('application/ld+json'));
  for (const image of load(record.html)('img').toArray()) {
    const src = image.attribs.src;
    if (src.startsWith('/')) await access(`public${decodeURIComponent(src)}`);
  }
}
const sourceGallery = await readFile('source/gallery/index.md', 'utf8');
assert.equal(data.inventory.images, [...sourceGallery.matchAll(/!\[/g)].length);
assert.equal(data.inventory.resources, 10);
assert.equal(data.inventory.tracks, 6);
for (const page of data.pages) await access(`public${decodeURIComponent(page.route)}index.html`);
for (const r of data.records) {
  assert(!/<script\b|\son\w+=/i.test(r.html), `Unsafe HTML: ${r.route}`);
  await access(`public/archives/RHINE-LAB-${r.id}.txt`);
}
const about = await readFile('public/about/index.html', 'utf8');
assert(about.includes(data.statsUpdatedAt), 'NetEase deployment verification marker was lost');
const worker = await readFile('public/sw.js', 'utf8');
assert(!worker.includes('"music/'), 'Personal audio must not be precached');
assert(!worker.includes('__CACHE_VERSION__'));
assert((await readFile('public/atom.xml', 'utf8')).includes('<entry>'));
console.log(`Content integrity passed: ${sourcePosts.length} complete posts, ${data.inventory.images} gallery images, ${data.pages.length} routes, all downloads and source media present.`);
