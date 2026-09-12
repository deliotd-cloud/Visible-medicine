import assert from 'node:assert/strict';
import { readFile, writeFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { cerebralArterialConcepts } from '../content/cerebral-arterial.ts';

const raw = await readFile('public/models/bodyparts3d/full-body/catalog.json');
assert.equal(
  createHash('sha256').update(raw).digest('hex'),
  '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7',
);
const catalog = JSON.parse(raw);
const concepts = Object.values(cerebralArterialConcepts);
// Retain the original raw-catalogue pins. New source groups have separate audited bindings.
const ids = concepts
  .flatMap((c) => c.fmaIds)
  .filter((id) => catalog.structures.some((s) => s.fmaId === id));
const boneIds = [...new Set(concepts.flatMap((c) => c.contextFmaIds))];
assert.equal(ids.length, 14);
assert.equal(new Set(ids).size, 14);
assert.equal(boneIds.length, 11);
const entries = catalog.structures.filter(
  (s) => ids.includes(s.fmaId) || boneIds.includes(s.fmaId),
);
assert.equal(entries.length, 25);
for (const id of [...ids, ...boneIds]) {
  const matches = entries.filter((s) => s.fmaId === id);
  assert.equal(matches.length, 1);
  assert.equal(matches[0].system, ids.includes(id) ? 'vessels' : 'skeleton');
}
const pins = {
  sourceCommit: '421ae2d346e285163c3740b7161bc70cacbec10d',
  sourceVersion: catalog.sourceVersion,
  license: catalog.license,
  coordinateSystem: catalog.coordinateSystem,
  bundles: catalog.bundles.filter((b) =>
    entries.some((s) => s.bundle === b.id),
  ),
  entries,
};
const path = 'content/cerebral-arterial-pins.json';
const output = JSON.stringify(pins, null, 2) + '\n';
if (process.argv.includes('--check'))
  assert.equal((await readFile(path, 'utf8')).replace(/\r\n/g, '\n'), output);
else {
  await assert.rejects(access(path), 'Never implicitly overwrite admissions');
  await writeFile(path, output);
}
console.log(
  JSON.stringify({
    arteries: ids.length,
    contextBones: boneIds.length,
    check: process.argv.includes('--check'),
  }),
);
