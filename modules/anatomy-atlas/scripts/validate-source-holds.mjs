import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  createSourceHoldPolicy,
  preflightSourceHolds,
} from './source-hold-policy.mjs';
import { loadSourceHolds } from './load-source-holds.mjs';
import { auditSourceHolds } from './audit-source-holds.mjs';

let checks = 0,
  rejections = 0;
const equal = (a, b, message) => {
  checks++;
  assert.deepEqual(a, b, message);
};
const rejects = (fn) => {
  checks++;
  rejections++;
  assert.throws(fn);
};
const { policy, records, catalog } = await loadSourceHolds();
const report = await auditSourceHolds();
equal(
  report,
  JSON.parse(await readFile('docs/source-hold-audit.json')),
  'Reproducible report',
);
equal(report.summary.unusedAvailableWithComponentHolds, 19);
equal(report.summary.directlyHeldDefinitions, 38);
equal(report.summary.currentDisplayedDefinitionsWithoutKnownSameTreeHold, 1022);
const byId = (id, tree = 'isa') =>
  records.find((r) => r.id === id && r.tree === tree);
for (const record of records.filter((r) => r.files.length)) {
  const result = policy.inspect(record);
  equal(result.admissionApproved, false);
  equal(result.geometryEquivalenceChecked, false);
  if (
    report.affected.some((r) => r.tree === record.tree && r.id === record.id)
  ) {
    equal(result.status, 'blocked-known-source-hold');
    rejects(() => policy.assertNoKnownHolds([record]));
    // Subsets of a held identity never escape its direct hold. Every held
    // component of an unheld parent also remains blocked when selected alone.
    for (const component of result.components) {
      rejects(() =>
        policy.assertNoKnownHolds([{ ...record, files: [component.file] }]),
      );
    }
  }
}
for (const id of [
  'FMA37378',
  'FMA50863',
  'FMA46622',
  'FMA4731',
  'FMA9657',
  'FMA9721',
  'FMA19089',
])
  equal(
    policy.inspect(byId(id)).status,
    'blocked-known-source-hold',
    `Parent ${id} cannot bypass child holds`,
  );
for (const id of [
  'FMA37388',
  'FMA37389',
  'FMA50875',
  'FMA50878',
  'FMA85102',
  'FMA85103',
]) {
  const record = byId(id);
  rejects(() => policy.assertNoKnownHolds([record]));
  rejects(() => policy.inspect({ ...record, name: 'Relabelled anatomy' }));
  rejects(() => policy.inspect({ ...record, id: 'FMA999999999' }));
}
const canal = byId('FMA78497');
equal(
  policy.inspect(canal).status,
  'no-known-source-hold',
  'Anatomical canal retained without claiming a cord',
);
equal(
  policy.inspect(byId('FMA7647', 'partof')).status,
  'blocked-known-source-hold',
);
for (const change of [
  { tree: 'other' },
  { id: 'bad' },
  { files: [] },
  { files: ['../FJ1'] },
  { files: [canal.files[0], canal.files[0]] },
  { files: ['FJ3211'] },
  { name: 'spinal cord' },
])
  rejects(() => policy.inspect({ ...canal, ...change }));
rejects(() => policy.assertNoKnownHolds([canal, canal]));
rejects(() => createSourceHoldPolicy([...records, records[0]]));
rejects(() => createSourceHoldPolicy([{ ...canal, files: ['../escape'] }]));
// Do not equate cross-tree filenames, including null/unknown fingerprint cases.
const fixture = [
  { tree: 'isa', id: 'FMA1', name: 'held', files: ['FJ1'] },
  { tree: 'isa', id: 'FMA2', name: 'parent', files: ['FJ1', 'FJ2'] },
  { tree: 'partof', id: 'FMA3', name: 'different archive', files: ['FJ1'] },
];
const holds = { FMA1: 'Needs adjudication' };
const fixturePolicy = createSourceHoldPolicy(fixture, holds);
fixture[0].files[0] = 'FJ99';
holds.FMA1 = null;
equal(fixturePolicy.inspect(fixture[1]).status, 'blocked-known-source-hold');
equal(fixturePolicy.inspect(fixture[2]).status, 'no-known-source-hold');
equal(fixturePolicy.inspect(fixture[2]).geometryEquivalenceChecked, false);
const selections = [
  ...catalog.structures.map((s) => ({
    fma: s.fmaId,
    name: s.sourceName,
    tree: s.sourceTree,
    files: s.sources.map((f) => f.file),
  })),
  ...catalog.excluded.map((s) => ({
    fma: s.fmaId,
    name: s.name,
    tree: s.sourceTree,
    files: s.sources.map((f) => f.file),
  })),
];
equal(
  [...preflightSourceHolds(policy, selections, catalog.excluded)].sort(),
  catalog.excluded.map((r) => r.fmaId).sort(),
);
for (const mutation of [
  selections.filter((s) => s.fma !== 'FMA37388'),
  [...selections, selections.find((s) => s.fma === 'FMA37388')],
  selections.map((s) =>
    s.fma === 'FMA37388' ? { ...s, files: ['FJ1469'] } : s,
  ),
  selections.map((s) => (s.fma === 'FMA37388' ? { ...s, tree: 'partof' } : s)),
  [
    ...selections,
    {
      fma: 'FMA37378',
      name: byId('FMA37378').name,
      tree: 'isa',
      files: byId('FMA37378').files,
    },
  ],
])
  rejects(() => preflightSourceHolds(policy, mutation, catalog.excluded));
rejects(() => preflightSourceHolds(policy, selections, []));
// Execute the actual importer selection path, before network or geometry writes.
const importer = JSON.parse(
  execFileSync(
    process.execPath,
    ['scripts/ingest-full-body.mjs', '--preflight-only'],
    { encoding: 'utf8' },
  ),
);
equal(importer, {
  sourceHoldPreflight: 'passed',
  selected: 1026,
  excluded: 4,
  renderable: 1022,
  selectionBindingsSha256: createHash('sha256')
    .update(
      JSON.stringify(
        selections
          .map((r) => [r.tree, r.fma, r.name, r.files])
          .sort((a, b) =>
            `${a[0]}/${a[1]}`.localeCompare(`${b[0]}/${b[1]}`, 'en'),
          ),
      ),
    )
    .digest('hex'),
  geometryGenerated: false,
  clinicalValidation: false,
});
const result = {
  passed: true,
  checks,
  rejections,
  ...report.summary,
  actualImporterPreflight: true,
  selectionBindingsSha256: importer.selectionBindingsSha256,
  geometryGenerated: false,
  crossArchiveEquivalenceChecked: false,
  clinicalValidation: false,
  browserInteractionTesting: false,
};
await writeFile(
  'docs/source-hold-validation.json',
  JSON.stringify(result, null, 2) + '\n',
);
console.log(JSON.stringify(result, null, 2));
