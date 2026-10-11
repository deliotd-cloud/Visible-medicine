import assert from 'node:assert/strict';
import { test } from 'node:test';
import { directOwners, heldComponents, proposal, screenCandidates, validateProposal } from './audit-intercostal-arteries.mjs';
import { loadCurrentSourceHolds } from './current-source-holds.mjs';

function fixture() {
  const records = proposal.map((p) => ({ tree: 'isa', id: p.id,
    name: `${p.side} ${p.level} posterior intercostal artery`, representation: p.representation,
    files: [p.file] }));
  const inventory = { records: records.map((r) => ({ ...structuredClone(r), status: 'unused-available',
    displayedId: null, heldReason: null, representedBy: [], unavailable: [], sharedDefinitionWith: [] })),
    assets: proposal.map((p) => ({ tree: 'isa', file: p.file,
    available: true, bytes: p.bytes, crc32: p.crc32, sha256: null,
    geometrySha256: null, representedBy: [] })) };
  const policy = { assertNoKnownHolds(definitions) {
    assert.equal(definitions.length, 4);
    assert(definitions.every((d) => d.tree === 'isa'));
  } };
  return { records, inventory, policy };
}

test('complete source proposal and official metadata pins remain immutable', () => {
  const { records, inventory, policy } = fixture();
  const before = structuredClone({ records, inventory });
  assert.deepEqual(validateProposal(records, inventory, policy), records);
  assert.deepEqual({ records, inventory }, before);
  assert(Object.isFrozen(proposal));
  assert(proposal.every(Object.isFrozen));
});

test('real current loader separates raw definitions from derived source status', async () => {
  const loaded = await loadCurrentSourceHolds();
  const selected = validateProposal(loaded.records, loaded.inventory, loaded.policy);
  assert.equal(selected.length, 4);
  assert(selected.every((row) => row.status === undefined));
  assert(selected.every((row) => loaded.inventory.records.find((derived) =>
    derived.tree === row.tree && derived.id === row.id)?.status === 'unused-available'));
});

test('changed membership, name, representation, status, size and CRC fail closed', () => {
  for (const change of [
    (f) => { f.records[0].files = ['FJ1939', 'FJ1950']; },
    (f) => { f.records[0].name = 'right posterior intercostal artery'; },
    (f) => { f.records[0].representation = 'BP0000'; },
    (f) => { f.inventory.records[0].status = 'held'; },
    (f) => { f.inventory.records[0].files = ['FJ0000']; },
    (f) => { f.inventory.records[0].representation = 'BP0000'; },
    (f) => { f.inventory.records[0].heldReason = 'current hold'; },
    (f) => { f.inventory.records[0].representedBy = ['already-owned']; },
    (f) => { f.inventory.records.push(structuredClone(f.inventory.records[0])); },
    (f) => { f.records.push(structuredClone(f.records[0])); },
    (f) => { f.inventory.assets[0].bytes++; },
    (f) => { f.inventory.assets[0].crc32++; },
    (f) => { f.inventory.assets[0].sha256 = 'a'.repeat(64); },
    (f) => { f.inventory.assets[0].representedBy = ['already-owned']; },
  ]) {
    const f = fixture();
    change(f);
    assert.throws(() => validateProposal(f.records, f.inventory, f.policy));
  }
  const f = fixture();
  f.policy.assertNoKnownHolds = () => { throw Error('current hold'); };
  assert.throws(() => validateProposal(f.records, f.inventory, f.policy), /current hold/);
});

test('direct ownership includes root and reachable nested sources without parent inference', () => {
  const make = (id, tree, files) => ({ id, fmaId: id, sourceTree: tree,
    sources: files.map((file) => ({ file })) });
  const root = { structures: [make('root-owner', 'isa', ['FJ1939']),
    make('same-file-other-tree', 'partof', ['FJ1939']), make('other-root', 'isa', ['FJ1950'])] };
  const nested = [{ structure: make('nested-owner', 'isa', ['FJ1939']),
    parentId: 'other-root', study: 'thorax' }];
  assert.deepEqual(directOwners(root, nested, 'isa', 'FJ1939').map((o) => o.id),
    ['root-owner', 'nested-owner']);
});

test('held components from both trees enter candidate screen independently', () => {
  const records = [
    { tree: 'isa', id: 'held-isa', files: ['FJ8000'] },
    { tree: 'partof', id: 'held-partof', files: ['FJ8000'] },
  ];
  const policy = { inspect(d) { return { components: [{ file: 'FJ8000', heldBy: [d.id] }] }; } };
  const held = heldComponents(records, policy);
  assert.deepEqual(held.map((h) => `${h.tree}/${h.file}`), ['isa/FJ8000', 'partof/FJ8000']);
  const sourceBounds = { min: [-10, 0, 0], max: [-5, 2, 2], extent: [5, 2, 2] };
  const targets = held.map((h) => ({ ...h, id: `${h.tree}/${h.file}`,
    fmaId: null, system: 'vessels', sourceBounds }));
  const screen = screenCandidates([{ id: 'FMA66242', sourceBounds }], targets);
  assert.equal(screen.length, 2);
  assert(screen.every((row) => row.candidates[0].id === 'FMA66242'));
});
