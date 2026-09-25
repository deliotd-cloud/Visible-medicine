import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { loadCurrentSourceHolds } from './current-source-holds.mjs';
import { selectPelvicFloorDefinitions } from './pelvic-floor-review.mjs';
import { sha256 } from './source-geometry-screen.mjs';
import {
  buildPelvicFloorContext,
  inspectPelvicFloorContextComponent,
  pelvicFloorContextDefinitions,
  pinnedPelvicFloorMeasurementsSha256,
  selectPelvicFloorContext,
} from './pelvic-floor-context.mjs';

const context = await loadCurrentSourceHolds();
const cacheRoot = resolve('../work/bodyparts3d');
const definitions = selectPelvicFloorContext(context);

await test('context selection fails closed on catalogue identity, source and inventory changes', () => {
  assert.equal(definitions.length, 5);
  assert.throws(() => selectPelvicFloorContext({ ...context, policy: { inspect: () => ({status:'blocked-known-source-hold'}) } }), /Context source is currently held/);
  const changeStructure = (edit) => ({ ...context, catalog: { ...context.catalog,
    structures: context.catalog.structures.map((s) => s.fmaId === 'FMA16586' ? edit(s) : s) } });
  assert.throws(() => selectPelvicFloorContext(changeStructure((s) => ({ ...s, fmaId: 'FMA00000' }))), /Missing or duplicate catalogue context/);
  assert.throws(() => selectPelvicFloorContext(changeStructure((s) => ({ ...s, name: 'Hip' }))), /Catalogue context name changed/);
  assert.throws(() => selectPelvicFloorContext(changeStructure((s) => ({ ...s, sourceTree: 'partof' }))), /Catalogue source tree changed/);
  assert.throws(() => selectPelvicFloorContext(changeStructure((s) => ({ ...s, sources: [{ ...s.sources[0], file: 'FJ0000' }] }))), /Catalogue source file\/hash changed/);
  assert.throws(() => selectPelvicFloorContext(changeStructure((s) => ({ ...s, sources: [{ ...s.sources[0], sha256: '0'.repeat(64) }] }))), /Catalogue source file\/hash changed/);
  assert.throws(() => selectPelvicFloorContext({ ...context, evidence: { ...context.evidence, catalogSha256: '0'.repeat(64) } }), /Pinned catalogue digest changed/);
  const changedStatus = { ...context, inventory: { ...context.inventory,
    records: context.inventory.records.map((r) => r.tree === 'isa' && r.id === 'FMA16586' ? { ...r, status: 'held-source-review' } : r) } };
  assert.throws(() => selectPelvicFloorContext(changedStatus), /Inventory context status changed/);
  const changedAsset = { ...context, inventory: { ...context.inventory,
    assets: context.inventory.assets.map((a) => a.tree === 'isa' && a.file === 'FJ3152' ? { ...a, sha256: '0'.repeat(64) } : a) } };
  assert.throws(() => selectPelvicFloorContext(changedAsset), /Original OBJ inventory hash changed/);
  const changedHold = { ...context, inventory: { ...context.inventory,
    records: context.inventory.records.map((r) => r.tree === 'isa' && r.id === 'FMA45854' ? { ...r, status: 'admitted' } : r) } };
  assert.throws(() => selectPelvicFloorDefinitions(changedHold), /Source hold status changed/);
});

await test('cached original bytes retain exact hashes and indexed geometry fingerprint', async () => {
  const definition = definitions[0];
  const bytes = await readFile(resolve(cacheRoot, 'isa', `${definition.file}.obj`));
  const inspected = inspectPelvicFloorContextComponent(definition, bytes, context.inventory);
  assert.equal(inspected.entry.sha256, definition.sha256);
  assert.equal(inspected.entry.geometrySha256, definition.asset.geometrySha256);
  assert.deepEqual({ min: inspected.shape.min, max: inspected.shape.max }, inspected.entry.bounds);
  const corrupted = Buffer.from(bytes);
  corrupted[corrupted.length - 2] ^= 1;
  assert.throws(() => inspectPelvicFloorContextComponent(definition, corrupted, context.inventory));
  assert.throws(() => inspectPelvicFloorContextComponent({ ...definition, sha256: '0'.repeat(64) }, bytes, context.inventory), /Original OBJ hash changed/);
});

await test('full offline reconstruction preserves held revision and five untransformed context sources', async () => {
  const { report, candidateShapes, contextShapes } = await buildPelvicFloorContext({ cacheRoot });
  assert.equal(sha256(await readFile('docs/reviews/pelvic-floor/measurements.json')), pinnedPelvicFloorMeasurementsSha256);
  assert.deepEqual(report.summary, { definitions: 7, components: 13, comparisons: 9, admissions: 0 });
  assert.equal(candidateShapes.length, 13);
  assert.deepEqual(report.context.map((c) => c.id), pelvicFloorContextDefinitions.map((d) => d.id));
  assert.deepEqual(contextShapes.map((s) => s.file), pelvicFloorContextDefinitions.map((d) => d.file));
  assert.deepEqual(report.context.map((c) => c.category), ['bone', 'bone', 'bone', 'muscle', 'muscle']);
  assert(report.context.every((c) => c.role === 'existing-atlas-context' && c.clinicalApprovalForPelvicFloor === false));
  assert.equal(report.contextClinicalApproval, false);
  assert(report.contextLimitations.some((s) => s.includes('No separately identified coccyx bone')));
  assert.deepEqual(report.contextHoldEvidence,context.supplementalEvidence);
  for (const shape of contextShapes) {
    const bytes = await readFile(resolve(cacheRoot, 'isa', `${shape.file}.obj`));
    const original = inspectPelvicFloorContextComponent(definitions.find((d) => d.file === shape.file), bytes, context.inventory);
    assert.deepEqual(shape.vertices, original.shape.vertices);
    assert.deepEqual(shape.faces, original.shape.faces);
    assert.deepEqual({ min: shape.min, max: shape.max }, report.context.find((c) => c.file === shape.file).bounds);
  }
});
