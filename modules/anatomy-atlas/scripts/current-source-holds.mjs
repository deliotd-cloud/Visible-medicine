import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { loadSourceHolds } from './load-source-holds.mjs';
import { collicularBrachiaSources } from './collicular-brachia-sources.mjs';
import { deepLegVeinSources } from './deep-leg-vein-sources.mjs';
import { pelvicVeinSources } from './pelvic-vein-sources.mjs';
import { limbicLandmarkSources } from './limbic-landmark-sources.mjs';
import { tibialRecurrentSources } from './tibial-recurrent-sources.mjs';

const hash = (b) => createHash('sha256').update(b).digest('hex');
const key = (tree, id) => `${tree}/${id}`;
const reports = [
  { path:'docs/tibial-recurrent-source-disposition.json', sha256:'a3cfc40af9ce85df44a60a272f50803bb20b459079d9c4a941d5d6124ade2042', rows:'groups', sources:tibialRecurrentSources },
  { path:'docs/limbic-landmark-source-audit.json', sha256:'2b29686d350ca29d88c67c7a44c3e143033deea35f15df0a66b90c758a82f69c', rows:'groups', sources:limbicLandmarkSources },
  { path:'docs/pelvic-vein-source-audit.json', sha256:'ffb300bcd1f2cd8c2a9684c133ed5d82a1043d7bda99a78f377854c9168ebf26', rows:'groups', sources:pelvicVeinSources },
  {
    path: 'docs/collicular-brachia-source-audit.json',
    sha256: '376863798d350db47711e802a9f5a0180b9d1c99f0972bbec769e6588e5c5b9a',
    rows: 'groups',
    sources: collicularBrachiaSources,
  },
  {
    path: 'docs/deep-leg-vein-source-audit.json',
    sha256: '2ed4267b0ceae5448673eaf0743ed79a995fc7f879dac26c81e24109c7b201ec',
    rows: 'held',
    sources: deepLegVeinSources,
  },
];

/** Tree-scoped supplement; archival evidence and historical policy stay immutable. */
export function composeSourceHoldPolicy(archivalPolicy, records, supplemental) {
  const holds = structuredClone(supplemental);
  const seen = new Set();
  for (const h of holds) {
    assert(!seen.has(key(h.tree, h.id)), 'Duplicate supplemental hold');
    seen.add(key(h.tree, h.id));
    const d = records.find((r) => r.tree === h.tree && r.id === h.id);
    assert(d, 'Missing held source definition');
    assert.equal(d.name, h.name);
    assert.deepEqual(
      d.files,
      h.files.map((s) => s.file),
      'Held concept membership changed',
    );
    assert(
      typeof h.reason === 'string' && h.reason.length > 0,
      'Missing hold reason',
    );
    assert(
      h.files.every((s) => /^[a-f0-9]{64}$/.test(s.sha256)),
      'Missing held source hash',
    );
  }
  const inspect = (candidate) => {
    const old = archivalPolicy.inspect(candidate); // Also rejects unknown names/IDs/files.
    const applicable = holds.filter(
      (h) =>
        h.tree === candidate.tree &&
        (h.id === candidate.id ||
          h.files.some((s) => candidate.files.includes(s.file))),
    );
    const direct = applicable.find((h) => h.id === candidate.id);
    const components = candidate.files.flatMap((file) => {
      const ids = new Set(
        old.components.filter((c) => c.file === file).flatMap((c) => c.heldBy),
      );
      for (const h of applicable)
        if (h.files.some((s) => s.file === file)) ids.add(h.id);
      return ids.size ? [{ file, heldBy: [...ids].sort() }] : [];
    });
    return {
      ...old,
      status:
        old.status === 'blocked-known-source-hold' || applicable.length
          ? 'blocked-known-source-hold'
          : 'no-known-source-hold',
      directReason: old.directReason ?? direct?.reason ?? null,
      components,
      supplemental: structuredClone(applicable),
      admissionApproved: false,
      geometryEquivalenceChecked: false,
    };
  };
  return Object.freeze({
    inspect,
    assertNoKnownHolds(candidates) {
      assert(
        Array.isArray(candidates) && candidates.length > 0,
        'Empty source proposal',
      );
      const identities = new Set();
      for (const c of candidates) {
        assert(!identities.has(key(c.tree, c.id)), 'Duplicate source proposal');
        identities.add(key(c.tree, c.id));
        const result = inspect(c);
        assert.equal(
          result.status,
          'no-known-source-hold',
          `Source hold blocks ${key(c.tree, c.id)}: ${result.directReason ?? result.components.map((r) => r.heldBy.join(',')).join('; ')}`,
        );
      }
    },
  });
}

export async function loadCurrentSourceHolds() {
  const archived = await loadSourceHolds(),
    supplemental = [],
    evidence = [];
  for (const report of reports) {
    const bytes = await readFile(report.path);
    assert.equal(
      hash(bytes),
      report.sha256,
      'Supplemental source evidence changed',
    );
    const audit = JSON.parse(bytes);
    assert.deepEqual(audit.evidence, archived.evidence);
    assert.deepEqual(
      report.sources
        .filter((s) => s.status === 'held')
        .map((s) => s.id)
        .sort(),
      audit[report.rows]
        .filter((s) => s.status === 'held')
        .map((s) => s.id)
        .sort(),
      'Supplemental holds were silently dropped',
    );
    for (const source of report.sources.filter((s) => s.status === 'held')) {
      const row = audit[report.rows].find((s) => s.id === source.id);
      assert(row && row.status === 'held', 'Missing held audit row');
      assert.equal(row.name, source.name);
      assert.equal(row.reason, source.reason);
      const files = source.files ?? [
        { file: source.file, sha256: source.sha256 },
      ];
      assert.deepEqual(
        row.files ?? [{ file: row.file, sha256: row.sha256 }],
        files,
      );
      supplemental.push({
        tree: 'isa',
        id: source.id,
        name: source.name,
        files,
        reason: source.reason,
        evidence: report.path,
        evidenceSha256: report.sha256,
      });
    }
    evidence.push({ path: report.path, sha256: report.sha256 });
  }
  return {
    ...archived,
    policy: composeSourceHoldPolicy(
      archived.policy,
      archived.records,
      supplemental,
    ),
    supplemental,
    supplementalEvidence: evidence,
  };
}

/** Export-time rejection only. Passing never grants geometry or clinical approval. */
export async function preflightCurrentSourceHolds(candidates) {
  const { policy, records } = await loadCurrentSourceHolds();
  policy.assertNoKnownHolds(candidates);
  for (const c of candidates)
    assert.deepEqual(
      c.files,
      records.find((r) => r.tree === c.tree && r.id === c.id).files,
      'Export proposal must retain the complete source definition',
    );
}
