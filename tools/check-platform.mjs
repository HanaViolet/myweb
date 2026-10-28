import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const full = JSON.parse(await readFile('.generated/blog.json', 'utf8'));
const catalog = JSON.parse(await readFile('.generated/catalog.json', 'utf8'));
const search = JSON.parse(await readFile('.generated/search.json', 'utf8'));
assert.equal(new Set(catalog.records.map(r => r.uid)).size, full.records.length);
assert.equal(catalog.records[0].route, '/about/');
for (const record of catalog.records) {
  assert.equal(record.html, '', 'Body must not be bundled into the runtime catalog');
  assert.equal(record.searchText, '', 'Search text is a separate lazy chunk');
  assert.equal(record.uid, `content:${record.route}`);
  assert.equal(search[record.uid], full.records.find(r => r.uid === record.uid).searchText);
}
for (const page of catalog.pages) {
  assert(!('html' in page));
  const bytes = await readFile(`public${page.bodyUrl}`, 'utf8');
  const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 20);
  assert.equal(page.bodyUrl, `/content/${hash}.json`, 'Bodies are immutable, content-addressed assets');
  assert.equal(JSON.parse(bytes).html, full.pages.find(p => p.route === page.route).html);
}
console.log(`Platform contracts passed: ${catalog.records.length} stable identities, ${catalog.pages.length} lazy bodies, full-text parity.`);
