import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { genicularStudySourceIds } from '../content/genicular-study.ts';
const hash = (v) => createHash('sha256').update(v).digest('hex');
const raw = await readFile('public/models/bodyparts3d/full-body/catalog.json');
assert.equal(hash(raw), '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7');
const catalog = JSON.parse(raw);
const extra = JSON.parse(await readFile('public/models/bodyparts3d/genicular-arteries/catalog.json'));
assert.equal(extra.bundles[0].sha256, 'a62ea69e56014790059ecd85cf9281bebb93280220b5a5677954c85b01ef5e9a');
assert.deepEqual(extra.coordinateSystem, catalog.coordinateSystem);
const entries = [...catalog.structures, ...extra.structures].filter((s) => genicularStudySourceIds.includes(s.fmaId));
assert.equal(entries.length, 22);
assert.equal(new Set(entries.map((s) => s.fmaId)).size, 22);
const bundles = [...catalog.bundles, ...extra.bundles].filter((b) => entries.some((s) => s.bundle === b.id));
for (const b of bundles) assert.equal(hash(await readFile('public' + b.url.split('?')[0])), b.sha256);
const result = {
  sourceCommit: 'f5460a4548b7ba4761220c791ea6673b5c7ebb6f',
  sourceVersion: catalog.sourceVersion, license: catalog.license,
  coordinateSystem: catalog.coordinateSystem, entries, bundles,
};
const output = JSON.stringify(result, null, 2) + '\n', path = 'content/genicular-study-pins.json';
if (process.argv.includes('--check')) assert.equal((await readFile(path, 'utf8')).replace(/\r\n/g, '\n'), output);
else await writeFile(path, output, { flag: 'wx' });
console.log(JSON.stringify({ selections: entries.length, bundles: bundles.length, geometryChanged: false }));
