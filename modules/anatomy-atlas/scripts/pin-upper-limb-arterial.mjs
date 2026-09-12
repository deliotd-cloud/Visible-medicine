import assert from 'node:assert/strict';
import { readFile, writeFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { upperArterialConcepts } from '../content/upper-limb-arterial.ts';
const raw = await readFile('public/models/bodyparts3d/full-body/catalog.json');
assert.equal(
  createHash('sha256').update(raw).digest('hex'),
  '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7',
);
// Retain the original 52-artery admission exactly. Later neck and subscapular
// sources use separate source-bound bundles; do not repin the original anatomy.
const originalConcepts = Object.entries(upperArterialConcepts).filter(([key]) => !['inferiorThyroid', 'subscapular'].includes(key)).map(([,value]) => value);
const catalog = JSON.parse(raw),
  ids = originalConcepts.flatMap((c) => c.fmaIds),
  regions = [
    ...new Set(originalConcepts.map((c) => c.context)),
  ];
assert.equal(ids.length, 52);
assert.equal(new Set(ids).size, 52);
const entries = catalog.structures.filter(
  (s) =>
    ids.includes(s.fmaId) ||
    (s.system === 'skeleton' && s.regions.some((r) => regions.includes(r))),
);
assert.equal(entries.filter((s) => s.system === 'vessels').length, 52);
const pins = {
  sourceCommit: 'd723e7051319e17db4992bb941755ebc85a25c1d',
  sourceVersion: catalog.sourceVersion,
  license: catalog.license,
  coordinateSystem: catalog.coordinateSystem,
  bundles: catalog.bundles.filter((b) =>
    entries.some((s) => s.bundle === b.id),
  ),
  entries,
};
const path = 'content/upper-limb-arterial-pins.json',
  output = JSON.stringify(pins, null, 2) + '\n';
if (process.argv.includes('--check'))
  assert.equal((await readFile(path, 'utf8')).replace(/\r\n/g, '\n'), output);
else {
  await assert.rejects(
    access(path),
    'Never implicitly overwrite source admissions',
  );
  await writeFile(path, output);
}
console.log(
  JSON.stringify({
    arteries: 52,
    contextBones: entries.length - 52,
    check: process.argv.includes('--check'),
  }),
);
