import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createSourceHoldPolicy } from './source-hold-policy.mjs';
import { loadSourceHolds } from './load-source-holds.mjs';
import {
  loadCurrentSourceHolds,
  composeSourceHoldPolicy,
  preflightCurrentSourceHolds,
} from './current-source-holds.mjs';
const archive = await loadSourceHolds(),
  h = await loadCurrentSourceHolds();
assert.deepEqual(h.evidence, archive.evidence);
assert.equal(h.supplemental.length, 6);
assert.equal(
  h.supplemental.reduce((n, s) => n + s.files.length, 0),
  9,
);
let aliases = 0,
  subsets = 0;
for (const held of h.supplemental) {
  const definition = h.records.find(
    (r) => r.tree === held.tree && r.id === held.id,
  );
  assert.equal(
    archive.policy.inspect(definition).status,
    'no-known-source-hold',
  );
  for (const files of [definition.files, ...definition.files.map((f) => [f])]) {
    const candidate = { ...definition, files };
    const result = h.policy.inspect(candidate);
    assert.equal(result.status, 'blocked-known-source-hold');
    assert.equal(result.admissionApproved, false);
    assert.equal(result.geometryEquivalenceChecked, false);
    assert.throws(() => h.policy.assertNoKnownHolds([candidate]));
    subsets++;
  }
  for (const r of h.records.filter(
    (r) =>
      r.tree === held.tree &&
      r.id !== held.id &&
      r.files.some((f) => definition.files.includes(f)),
  )) {
    assert.equal(h.policy.inspect(r).status, 'blocked-known-source-hold');
    aliases++;
  }
}
// Tree identity matters: an equal filename in another archive is not geometry proof.
const records = [
  { tree: 'isa', id: 'FMA100', name: 'held test', files: ['FJ100'] },
  { tree: 'isa', id: 'FMA101', name: 'alias test', files: ['FJ100', 'FJ101'] },
  { tree: 'partof', id: 'FMA100', name: 'other tree', files: ['FJ100'] },
];
const holds = [
  {
    tree: 'isa',
    id: 'FMA100',
    name: 'held test',
    files: [{ file: 'FJ100', sha256: 'a'.repeat(64) }],
    reason: 'Test hold',
  },
];
const policy = composeSourceHoldPolicy(
  createSourceHoldPolicy(records, {}),
  records,
  holds,
);
holds[0].reason = '';
holds[0].files.length = 0;
assert.equal(policy.inspect(records[0]).status, 'blocked-known-source-hold');
assert.equal(policy.inspect(records[1]).status, 'blocked-known-source-hold');
const independent = policy.inspect(records[2]);
assert.equal(independent.status, 'no-known-source-hold');
assert.equal(independent.admissionApproved, false);
const returned = policy.inspect(records[0]);
returned.supplemental.length = 0;
returned.components.length = 0;
assert.equal(policy.inspect(records[0]).status, 'blocked-known-source-hold');
assert.throws(() => policy.inspect({ ...records[0], name: 'renamed' }));
assert.throws(() => policy.inspect({ ...records[0], files: ['FJ999'] }));
assert.throws(() => policy.assertNoKnownHolds([]));
for (const bundle of [
  'cubital-veins',
  'genicular-arteries',
  'inferior-thyroid-arteries',
  'deep-leg-veins',
  'brachial-veins',
  'deferent-ducts',
  'pelvic-veins',
]) {
  const catalog = JSON.parse(
    await readFile(`public/models/bodyparts3d/${bundle}/catalog.json`),
  );
  const candidates = catalog.structures.map((s) => ({
    tree: s.sourceTree,
    id: s.fmaId,
    name: s.sourceName,
    files: s.sources.map((p) => p.file),
  }));
  await preflightCurrentSourceHolds(candidates);
}
const held = h.records.find((r) => r.tree === 'isa' && r.id === 'FMA44885');
await assert.rejects(
  preflightCurrentSourceHolds([{ ...held, files: ['FJ2194'] }]),
);
const partial = h.records.find((r) => r.tree === 'isa' && r.id === 'FMA44336');
await assert.rejects(
  preflightCurrentSourceHolds([
    { ...partial, files: partial.files.slice(0, 1) },
  ]),
);
console.log(
  JSON.stringify({
    supplementalConcepts: 6,
    heldSourceFiles: 9,
    subsets,
    aliases,
    archiveUnchanged: true,
    treeScoped: true,
    exportGate: true,
    clinicalApproval: false,
  }),
);
