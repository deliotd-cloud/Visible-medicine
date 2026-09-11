import assert from 'node:assert/strict';
import { readFile, writeFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { arterialConcepts } from '../content/lower-limb-arterial.ts';
const raw = await readFile('public/models/bodyparts3d/full-body/catalog.json');
assert.equal(
  createHash('sha256').update(raw).digest('hex'),
  '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7',
);
const catalog = JSON.parse(raw),
  ids = Object.values(arterialConcepts).flatMap((c) => c.fmaIds),
  regions = [...new Set(Object.values(arterialConcepts).map((c) => c.context))];
assert.equal(ids.length, 29);
assert.equal(new Set(ids).size, 29);
const entries = catalog.structures.filter(
  (s) =>
    ids.includes(s.fmaId) ||
    (s.system === 'skeleton' && s.regions.some((r) => regions.includes(r))),
);
assert.equal(entries.filter((s) => s.system === 'vessels').length, 29);
const pins = {
  sourceCommit: 'd0b61f72358a8e0718c09b26e9efa69916cd1012',
  sourceVersion: catalog.sourceVersion,
  license: catalog.license,
  coordinateSystem: catalog.coordinateSystem,
  bundles: catalog.bundles.filter((b) =>
    entries.some((s) => s.bundle === b.id),
  ),
  entries,
};
const path = 'content/lower-limb-arterial-pins.json',
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
    arteries: 29,
    contextBones: entries.length - 29,
    check: process.argv.includes('--check'),
  }),
);
