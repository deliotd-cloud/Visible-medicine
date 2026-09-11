import assert from 'node:assert/strict';
import { readFile, writeFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { abdominalArterialConcepts } from '../content/abdominal-arterial.ts';
const raw = await readFile('public/models/bodyparts3d/full-body/catalog.json');
assert.equal(
  createHash('sha256').update(raw).digest('hex'),
  '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7',
);
const catalog = JSON.parse(raw);
const ids = Object.values(abdominalArterialConcepts).flatMap((c) => c.fmaIds);
assert.equal(ids.length, 28);
assert.equal(new Set(ids).size, 28);
const entries = catalog.structures.filter(
  (s) =>
    ids.includes(s.fmaId) ||
    (s.system === 'skeleton' && s.regions.includes('abdomen')),
);
assert.equal(entries.length, 33);
assert.equal(entries.filter((s) => s.system === 'vessels').length, 28);
const pins = {
  sourceCommit: '7238d3e5a85a2c549cd7457aaa3fc0c6540ad88b',
  sourceVersion: catalog.sourceVersion,
  license: catalog.license,
  coordinateSystem: catalog.coordinateSystem,
  bundles: catalog.bundles.filter((b) =>
    entries.some((s) => s.bundle === b.id),
  ),
  entries,
};
const path = 'content/abdominal-arterial-pins.json';
const output = JSON.stringify(pins, null, 2) + '\n';
if (process.argv.includes('--check'))
  assert.equal((await readFile(path, 'utf8')).replace(/\r\n/g, '\n'), output);
else {
  await assert.rejects(access(path), 'Never implicitly overwrite admissions');
  await writeFile(path, output);
}
console.log(
  JSON.stringify({
    arteries: 28,
    contextBones: 5,
    check: process.argv.includes('--check'),
  }),
);
