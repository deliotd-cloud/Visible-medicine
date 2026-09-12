import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { armVascularSourceIds } from '../content/arm-vascular-studies.ts';
const hash = (b) => createHash('sha256').update(b).digest('hex');
const raw = await readFile('public/models/bodyparts3d/full-body/catalog.json');
assert.equal(
  hash(raw),
  '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7',
);
const catalog = JSON.parse(raw),
  extra = JSON.parse(
    await readFile('public/models/bodyparts3d/brachial-veins/catalog.json'),
  );
assert.equal(extra.sourceVersion, catalog.sourceVersion);
assert.equal(extra.license, catalog.license);
assert.deepEqual(extra.coordinateSystem, catalog.coordinateSystem);
const entries = [...catalog.structures, ...extra.structures].filter((s) =>
  armVascularSourceIds.includes(s.fmaId),
);
assert.equal(entries.length, 22);
assert.equal(new Set(entries.map((s) => s.fmaId)).size, 22);
assert(entries.every((s) => s.regions.includes('shoulder-arm')));
const bundles = [...catalog.bundles, ...extra.bundles].filter((b) =>
  entries.some((s) => s.bundle === b.id),
);
assert.equal(bundles.length, 5);
for (const b of bundles)
  assert.equal(hash(await readFile('public' + b.url.split('?')[0])), b.sha256);
const record = {
  sourceCommit: '73ca79cea92f435fe40212c602dad407b4b3acd6',
  sourceVersion: catalog.sourceVersion,
  license: catalog.license,
  coordinateSystem: catalog.coordinateSystem,
  entries,
  bundles,
};
const text = JSON.stringify(record, null, 2) + '\n',
  path = 'content/arm-vascular-study-pins.json';
if (process.argv.includes('--check'))
  assert.equal((await readFile(path, 'utf8')).replace(/\r\n/g, '\n'), text);
else await writeFile(path, text, { flag: 'wx' });
console.log(
  JSON.stringify({
    sourceSelections: entries.length,
    bundles: bundles.length,
    geometryChanged: false,
  }),
);
