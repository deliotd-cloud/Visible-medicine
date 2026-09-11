import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { limbVascularSourceIds } from '../content/limb-vascular-studies.ts';
const hash = (b) => createHash('sha256').update(b).digest('hex');
const raw = await readFile('public/models/bodyparts3d/full-body/catalog.json');
assert.equal(
  hash(raw),
  '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7',
);
const catalog = JSON.parse(raw),
  extra = JSON.parse(
    await readFile('public/models/bodyparts3d/deep-leg-veins/catalog.json'),
  );
const entries = [...catalog.structures, ...extra.structures].filter((s) =>
  limbVascularSourceIds.includes(s.fmaId),
);
assert.equal(entries.length, 42);
assert.equal(new Set(entries.map((s) => s.fmaId)).size, 42);
assert.equal(extra.sourceVersion, catalog.sourceVersion);
assert.deepEqual(extra.coordinateSystem, catalog.coordinateSystem);
const bundles = [...catalog.bundles, ...extra.bundles].filter((b) =>
  entries.some((s) => s.bundle === b.id),
);
for (const b of bundles)
  assert.equal(hash(await readFile('public' + b.url.split('?')[0])), b.sha256);
const result = {
  sourceCommit: 'fa4959b0c641e77086f2bc0228bb2f4231683bf7',
  sourceVersion: catalog.sourceVersion,
  license: catalog.license,
  coordinateSystem: catalog.coordinateSystem,
  entries,
  bundles,
};
const text = JSON.stringify(result, null, 2) + '\n',
  path = 'content/limb-vascular-study-pins.json';
if (process.argv.includes('--check'))
  assert.equal((await readFile(path, 'utf8')).replace(/\r\n/g, '\n'), text);
else await writeFile(path, text, { flag: 'wx' });
console.log(
  JSON.stringify({
    selections: entries.length,
    bundles: bundles.length,
    geometryChanged: false,
    check: process.argv.includes('--check'),
  }),
);
