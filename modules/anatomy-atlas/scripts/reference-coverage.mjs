import assert from 'node:assert/strict';

/** Coverage of supplied sources, never clinical completeness or admission permission. */
export function sourceBindingEvidence(reference, owner, assets) {
  assert(/^FJ\d+M?$/.test(reference.file));
  assert(['isa', 'partof'].includes(owner.tree));
  assert(/^[a-f0-9]{64}$/.test(owner.sha256));
  if (owner.file !== reference.file) return 'different-file';
  const retained = assets.find(
    (a) => a.tree === owner.tree && a.file === owner.file,
  );
  if (retained?.sha256 && retained.sha256 !== owner.sha256)
    throw new Error(
      'Runtime source fingerprint differs from pinned archive: ' +
        owner.tree +
        '/' +
        owner.file,
    );
  if (owner.tree === 'isa') return 'same-tree-source-binding';
  return reference.geometrySha256 &&
    retained?.sha256 === owner.sha256 &&
    retained.geometrySha256 === reference.geometrySha256
    ? 'cross-tree-geometry-match'
    : 'cross-tree-filename-only';
}

export function sourceCoverageStatus({ owners, hold, excluded, relatedHold }) {
  const covered = owners.filter((o) =>
    ['same-tree-source-binding', 'cross-tree-geometry-match'].includes(
      o.evidence,
    ),
  );
  if (covered.some((o) => o.scope === 'root')) return 'root-source-covered';
  if (covered.some((o) => o.scope === 'nested')) return 'nested-source-covered';
  if (covered.some((o) => o.scope === 'shoulder'))
    return 'shoulder-source-covered';
  if (excluded) return 'excluded-by-display-correction';
  if (hold) return 'known-source-hold';
  if (owners.length) return 'cross-tree-equivalence-unverified';
  if (relatedHold) return 'related-cross-tree-hold';
  return 'needs-source-and-anatomical-review';
}

export const coverageCounts = (rows, field) =>
  Object.fromEntries(
    [...new Set(rows.map((row) => row[field]))]
      .sort()
      .map((value) => [
        value,
        rows.filter((row) => row[field] === value).length,
      ]),
  );
