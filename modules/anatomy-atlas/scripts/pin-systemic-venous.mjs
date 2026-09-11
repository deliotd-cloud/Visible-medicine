import assert from 'node:assert/strict';
import { readFile, writeFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { systemicVenousGroups } from '../content/systemic-venous.ts';
const raw = await readFile('public/models/bodyparts3d/full-body/catalog.json');
assert.equal(
  createHash('sha256').update(raw).digest('hex'),
  '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7',
);
const catalog = JSON.parse(raw),
  groups = Object.values(systemicVenousGroups);
const ids = groups.flatMap((g) => g.fmaIds),
  regions = groups.map((g) => g.context);
assert.equal(ids.length, 51);
assert.equal(new Set(ids).size, 51);
// This historical pin set covers the immutable 1022-record ingestion catalogue.
// Medial brachial, deep leg, hepatic and cubital additions have separate audited admissions.
const entries = catalog.structures.filter(
  (s) =>
    ids.includes(s.fmaId) ||
    (s.system === 'skeleton' && s.regions.some((r) => regions.includes(r))),
);
assert.equal(entries.filter((s) => s.system === 'vessels').length, 36);
const result = {
  sourceCommit: '33682c3e1ba1924ae4c419cca498e526b2b98595',
  sourceVersion: catalog.sourceVersion,
  license: catalog.license,
  coordinateSystem: catalog.coordinateSystem,
  bundles: catalog.bundles.filter((b) =>
    entries.some((s) => s.bundle === b.id),
  ),
  entries,
};
const path = 'content/systemic-venous-pins.json',
  output = JSON.stringify(result, null, 2) + '\n';
if (process.argv.includes('--check'))
  assert.equal((await readFile(path, 'utf8')).replace(/\r\n/g, '\n'), output);
else {
  await assert.rejects(access(path), 'Never overwrite source admissions');
  await writeFile(path, output);
}
console.log(
  JSON.stringify({
    veins: 36,
    contextBones: entries.length - 36,
    check: process.argv.includes('--check'),
  }),
);
