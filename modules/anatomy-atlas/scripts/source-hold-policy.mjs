import assert from 'node:assert/strict';
import { inventoryHolds } from './anatomy-inventory.mjs';

const key = (tree, value) => `${tree}/${value}`;
const filePattern = /^FJ\d+M?$/;
const trees = ['isa', 'partof'];

// This is a known-source-hold screen, NOT permission to admit a mesh.
// A file ID is scoped to its source tree: equal filenames across archives are
// not proof of equal geometry. Unknown/reordered/near-overlap aliases still need
// a separate byte/geometry audit and anatomical adjudication.
export function createSourceHoldPolicy(records, holds = inventoryHolds) {
  assert(
    Array.isArray(records) && records.length > 0,
    'Missing source definitions',
  );
  const definitions = new Map();
  const heldComponents = new Map();
  const directHolds = new Map();
  for (const record of records) {
    assert(trees.includes(record.tree), 'Unknown source tree');
    assert(/^FMA\d+$/.test(record.id), 'Invalid source concept');
    assert(
      typeof record.name === 'string' && record.name.length > 0,
      'Missing source name',
    );
    assert(
      Array.isArray(record.files) &&
        record.files.every((f) => filePattern.test(f)),
      'Invalid source files',
    );
    assert.equal(
      new Set(record.files).size,
      record.files.length,
      'Duplicate source files',
    );
    const definitionKey = key(record.tree, record.id);
    assert(!definitions.has(definitionKey), 'Duplicate source definition');
    // Copy the evidence so callers cannot relax the policy by mutating inputs.
    definitions.set(definitionKey, { ...record, files: [...record.files] });
    const reason = Object.hasOwn(holds, record.id)
      ? holds[record.id]
      : record.tree === 'partof' &&
          record.files.length === 1 &&
          record.files[0] === 'FJ3211'
        ? 'Unresolved disc-level assignment; the generic source file cannot establish a named level.'
        : null;
    if (!reason) continue;
    assert(typeof reason === 'string', 'Invalid source hold reason');
    directHolds.set(definitionKey, reason);
    for (const file of record.files) {
      const componentKey = key(record.tree, file);
      if (!heldComponents.has(componentKey))
        heldComponents.set(componentKey, new Map());
      heldComponents.get(componentKey).set(record.id, reason);
    }
  }
  function inspect(candidate) {
    const definition = definitions.get(key(candidate.tree, candidate.id));
    assert(
      definition,
      'Unknown source definition; refresh and review the pinned inventory first',
    );
    assert.equal(
      candidate.name,
      definition.name,
      'Source name does not match the pinned definition',
    );
    assert(
      Array.isArray(candidate.files) && candidate.files.length > 0,
      'Empty candidate',
    );
    assert.equal(
      new Set(candidate.files).size,
      candidate.files.length,
      'Duplicate candidate files',
    );
    assert(
      candidate.files.every((f) => definition.files.includes(f)),
      'Candidate file is not part of its source definition',
    );
    const directReason =
      directHolds.get(key(candidate.tree, candidate.id)) ?? null;
    const components = candidate.files.flatMap((file) => {
      const reasons = heldComponents.get(key(candidate.tree, file));
      return reasons ? [{ file, heldBy: [...reasons.keys()].sort() }] : [];
    });
    return {
      status:
        directReason || components.length
          ? 'blocked-known-source-hold'
          : 'no-known-source-hold',
      directReason,
      components,
      // Deliberately never inferred from availability or the absence of a hold.
      admissionApproved: false,
      geometryEquivalenceChecked: false,
    };
  }
  function assertNoKnownHolds(candidates) {
    assert(Array.isArray(candidates), 'Expected source selections');
    const seen = new Set();
    for (const candidate of candidates) {
      const id = key(candidate.tree, candidate.id);
      assert(!seen.has(id), 'Duplicate candidate identity');
      seen.add(id);
      const result = inspect(candidate);
      assert.equal(
        result.status,
        'no-known-source-hold',
        `Source hold blocks ${id}: ${result.directReason ?? result.components.map((c) => `${c.file} (${c.heldBy.join(', ')})`).join('; ')}`,
      );
    }
  }
  return Object.freeze({ inspect, assertNoKnownHolds });
}

// The four existing excluded source records remain evidence, not rendered
// selections. An altered exclusion or a new hold stops the import, rather than
// silently dropping part of a proposed structure or generating partial output.
export function preflightSourceHolds(policy, selections, excluded) {
  const expected = ['FMA37388', 'FMA37389', 'FMA46633', 'FMA46634'];
  assert.deepEqual(
    excluded.map((r) => r.fmaId).sort(),
    expected,
    'Legacy exclusion set changed',
  );
  const excludedIds = new Set();
  const renderable = [];
  for (const record of selections) {
    const exclusion = excluded.find((r) => r.fmaId === record.fma);
    const candidate = {
      tree: record.tree,
      id: record.fma,
      name: record.name,
      files: record.files,
    };
    if (!exclusion) {
      renderable.push(candidate);
      continue;
    }
    assert(!excludedIds.has(record.fma), 'Duplicate excluded identity');
    assert.equal(
      record.tree,
      exclusion.sourceTree,
      'Excluded source tree changed',
    );
    assert.equal(record.name, exclusion.name, 'Excluded source name changed');
    assert.deepEqual(
      record.files,
      exclusion.sources.map((s) => s.file),
      'Excluded source files changed',
    );
    assert.equal(
      policy.inspect(candidate).status,
      'blocked-known-source-hold',
      'Exclusion lost its source hold',
    );
    excludedIds.add(record.fma);
  }
  assert.deepEqual(
    [...excludedIds].sort(),
    expected,
    'Missing legacy exclusion',
  );
  policy.assertNoKnownHolds(renderable);
  return excludedIds;
}
