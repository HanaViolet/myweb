import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const source = await readFile('src/bookmarks.ts', 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { migrateBookmarks } = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'));
const records = [
  { id: 'X-001', uid: 'content:/about/' },
  { id: 'X-002', uid: 'content:/link/' },
  { id: 'X-035', uid: 'content:/posts/latest/' },
];
const legacy = { 'X-001': 'X-035', 'X-035': 'X-002' };
assert.deepEqual(migrateBookmarks(['X-001'], legacy, records, true), ['content:/posts/latest/']);
assert.deepEqual(migrateBookmarks(['X-001'], legacy, records, false), ['content:/about/']);
assert.deepEqual(migrateBookmarks(['X-023', 'X-037', 'missing'], legacy, records, true), []);
assert.deepEqual(migrateBookmarks(['X-001', 'X-001'], legacy, records, true), ['content:/posts/latest/']);
console.log('Bookmark migration regression checks passed.');
