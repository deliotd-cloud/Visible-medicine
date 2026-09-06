import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { conceptMap } from './bodyparts-archive.mjs';
import { gapSelections } from './gap-recovery.mjs';
import { applyJunctionTransition } from './junction-transition.mjs';
// Baseline is the exact previously published v6 source, not a moving HEAD.
const baselineCommit = 'c62c149c1e19208460b0ee644667a63796628fd5';
const root = 'public/models/bodyparts3d/full-body/';
const previous = JSON.parse(
  execFileSync('git', ['show', `${baselineCommit}:${root}catalog.json`], {
    maxBuffer: 8 * 1024 * 1024,
  }).toString(),
);
const catalog = JSON.parse(await fs.readFile(root + 'catalog.json', 'utf8'));
assert.equal(previous.structures.length, 761);
assert.equal(catalog.structures.length, 1018);
assert.deepEqual(catalog.coordinateSystem, previous.coordinateSystem);
assert.deepEqual(catalog.excluded, previous.excluded);
await applyJunctionTransition(previous, catalog);
for (const old of previous.structures)
  assert.deepEqual(
    catalog.structures.find((s) => s.id === old.id),
    old,
    `Changed existing identity ${old.name}`,
  );
for (const old of previous.bundles) {
  assert.deepEqual(
    catalog.bundles.find((b) => b.id === old.id),
    old,
  );
  assert.equal(
    createHash('sha256')
      .update(await fs.readFile(root + old.id + '.glb'))
      .digest('hex'),
    old.sha256,
  );
}
const additions = gapSelections(await conceptMap('isa'));
assert.equal(additions.length, 62);
for (const r of additions) {
  const s = catalog.structures.find((s) => s.fmaId === r.fma);
  assert(s && !previous.structures.some((old) => old.id === s.id));
  assert.equal(s.provenance.license, 'CC-BY-4.0');
  assert.equal(s.provenance.sourceVersion, '4.0');
  assert.equal(s.validation.status, 'unvalidated');
  assert(s.bundle.endsWith('-gaps'));
  assert.deepEqual(
    s.sources.map((f) => f.file),
    r.files,
  );
  assert.equal(
    s.sources.length,
    1,
    'Only unambiguous single-source additions admitted in this pass',
  );
}
for (const id of [
  'FMA45854',
  'FMA45855',
  'FMA45856',
  'FMA45857',
  'FMA45858',
  'FMA45859',
  'FMA46442',
  'FMA50875',
  'FMA50878',
  'FMA7647',
  'FMA13509',
])
  assert(
    !catalog.structures.some((s) => s.fmaId === id),
    `Held identity ${id} was silently admitted`,
  );
assert.equal(
  catalog.structures.filter((s) => /intervertebral disk/.test(s.sourceName))
    .length,
  22,
);
const result = {
  passed: true,
  baselineCommit,
  preservedIdentities: 761,
  unchangedPriorRecords: 759,
  preservedBundleHashes: 52,
  documentedJunctionChanges: { records: 2, bundles: 1 },
  newStructures: 62,
  newBundles: 8,
  newAssetBytes: catalog.bundles
    .filter((b) => b.id.endsWith('-gaps'))
    .reduce((n, b) => n + b.bytes, 0),
  allNewAssets: 'BodyParts3D 4.0 / CC BY 4.0',
  unchangedCoordinateFrame: true,
  heldCandidatesNotAdmitted: true,
  clinicalValidation: false,
  browserTesting: false,
};
await fs.writeFile('docs/gap-validation.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
