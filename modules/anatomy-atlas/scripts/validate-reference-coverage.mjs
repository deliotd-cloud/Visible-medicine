import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  sourceBindingEvidence,
  sourceCoverageStatus,
} from './reference-coverage.mjs';
const reference = { file: 'FJ1000', geometrySha256: 'b'.repeat(64) };
const owner = {
  scope: 'root',
  tree: 'isa',
  file: 'FJ1000',
  sha256: 'a'.repeat(64),
};
assert.equal(
  sourceBindingEvidence(reference, owner, []),
  'same-tree-source-binding',
);
assert.equal(
  sourceBindingEvidence(reference, { ...owner, tree: 'partof' }, []),
  'cross-tree-filename-only',
);
const asset = {
  tree: 'partof',
  file: 'FJ1000',
  sha256: owner.sha256,
  geometrySha256: reference.geometrySha256,
};
assert.equal(
  sourceBindingEvidence(reference, { ...owner, tree: 'partof' }, [asset]),
  'cross-tree-geometry-match',
);
assert.equal(
  sourceBindingEvidence(reference, { ...owner, tree: 'partof' }, [
    { ...asset, geometrySha256: 'c'.repeat(64) },
  ]),
  'cross-tree-filename-only',
);
assert.throws(() =>
  sourceBindingEvidence(reference, { ...owner, tree: 'partof' }, [
    { ...asset, sha256: 'c'.repeat(64) },
  ]),
);
assert.equal(
  sourceCoverageStatus({ owners: [], hold: true }),
  'known-source-hold',
);
assert.equal(
  sourceCoverageStatus({ owners: [], excluded: true }),
  'excluded-by-display-correction',
);
assert.equal(
  sourceCoverageStatus({ owners: [], relatedHold: true }),
  'related-cross-tree-hold',
);
assert.equal(
  sourceCoverageStatus({ owners: [] }),
  'needs-source-and-anatomical-review',
);
assert.equal(
  sourceCoverageStatus({
    owners: [{ ...owner, evidence: 'cross-tree-filename-only' }],
  }),
  'cross-tree-equivalence-unverified',
);
assert.equal(
  sourceCoverageStatus({
    owners: [
      { ...owner, scope: 'nested', evidence: 'same-tree-source-binding' },
    ],
  }),
  'nested-source-covered',
);
const report = JSON.parse(
  await readFile('docs/reference-coverage-audit.json', 'utf8'),
);
const crossProof = JSON.parse(await readFile('docs/reference-cross-tree-audit.json', 'utf8'));
for (const file of ['FJ1662', 'FJ1663', 'FJ1692']) {
  const isa = crossProof.sources.find(s => s.tree === 'isa' && s.file === file);
  const partof = crossProof.sources.find(s => s.tree === 'partof' && s.file === file);
  assert.notEqual(isa.sha256, partof.sha256, 'File identity is not assumed');
  assert.equal(isa.geometrySha256, partof.geometrySha256);
  assert.equal(sourceBindingEvidence(isa, { ...partof, scope: 'root' }, crossProof.sources), 'cross-tree-geometry-match');
  assert.equal(sourceBindingEvidence(isa, { ...partof, scope: 'root' }, [{ ...partof, geometrySha256: '0'.repeat(64) }]), 'cross-tree-filename-only');
  assert.throws(() => sourceBindingEvidence(isa, { ...partof, sha256: '0'.repeat(64) }, crossProof.sources));
}
assert.equal(report.summary.rootBindingsNeedingEquivalenceReview, 0);
assert.equal(report.summary.referenceSourceFiles, 2234);
for(const file of ['FJ2190','FJ2194','FJ2200','FJ2184','FJ2187','FJ1735','FJ1736']) {
  const row=report.rootDifferences.find(r=>r.file===file);
  assert.equal(row.status,'known-source-hold');
  assert(row.holds.some(h=>h.evidence && /^[a-f0-9]{64}$/.test(h.evidenceSha256)));
}
assert.equal(report.summary.rootOnlyDifferences, report.rootDifferences.length);
assert.equal(
  report.rootDifferences.length,
  new Set(report.rootDifferences.map((r) => r.file)).size,
);
assert.equal(
  Object.values(report.summary.allSourceStatuses).reduce((a, b) => a + b, 0),
  2234,
);
assert.equal(
  Object.values(report.summary.rootDifferenceStatuses).reduce(
    (a, b) => a + b,
    0,
  ),
  report.rootDifferences.length,
);
assert(
  report.rootDifferences.every(
    (r) => r.admissionApproved === false && r.definitions.length > 0,
  ),
);
assert(
  report.rootDifferences.every((r) =>
    r.owners.every((o) => o.scope !== 'root'),
  ),
);
for (const row of report.rootDifferences.filter(
  (r) => r.status === 'nested-source-covered',
))
  assert(
    row.owners.some(
      (o) =>
        o.scope === 'nested' &&
        ['same-tree-source-binding', 'cross-tree-geometry-match'].includes(
          o.evidence,
        ),
    ),
  );
for (const row of report.rootDifferences.filter(
  (r) => r.status === 'known-source-hold',
))
  assert(row.holds.some((h) => h.tree === 'isa'));
assert.equal(
  report.rootDifferences.find((r) => r.file === 'FJ2629').status,
  'excluded-by-display-correction',
);
assert.equal(
  report.rootDifferences.find((r) => r.file === 'FJ1771').status,
  'nested-source-covered',
);
assert.equal(
  report.rootDifferences.find((r) => r.file === 'FJ3481').status,
  'nested-source-covered',
);
assert.equal(
  report.rootDifferences.find((r) => r.file === 'FJ3481').owners[0].evidence,
  'cross-tree-geometry-match',
);
console.log(
  'Reference coverage: tree/hash evidence, holds, exclusions, non-admission, complete partition and actual root/nested examples passed. No geometry or clinical approval inferred.',
);
