import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { loadSourceHolds } from './load-source-holds.mjs';
import { sourceKey } from './source-geometry-screen.mjs';
import {
  buildPelvicFloorReview,
  inspectPelvicFloorComponent,
  parsePinnedGeometryScreen,
  pelvicFloorFiles,
  selectPelvicFloorDefinitions,
  measureSourceXSurface,
  disposition,
} from './pelvic-floor-review.mjs';

const context = await loadSourceHolds();
const screenBytes = await readFile('content/source-geometry-screen.json');
const screen = parsePinnedGeometryScreen(screenBytes, context);
const cacheRoot = resolve('../work/bodyparts3d');

await test('X surface categories are disjoint, exhaustive and count only referenced vertices', () => {
  const vertices = [
    [-1, 0, 0], [-1, 1, 0], [-1, 0, 1],
    [1, 0, 0], [1, 1, 0], [1, 0, 1],
    [0, 0, 0], [0, 1, 0], [0, 0, 1],
    [5, 5, 5], // unreferenced positive-X vertex
  ];
  const faces = [
    [0, 1, 2], // strictly negative
    [3, 4, 5], // strictly positive
    [0, 3, 7], // spans X=0
    [6, 7, 8], // on the X=0 plane
    [0, 7, 8], // negative with plane contact
    [3, 7, 8], // positive with plane contact
  ];
  const result = measureSourceXSurface({ vertices, faces });
  assert.equal(result.referencedVertices, 9);
  assert.equal(result.unreferencedVertices, 1);
  assert.deepEqual(result.referencedXDistribution, { negative: 3, zero: 3, positive: 3 });
  assert.deepEqual(Object.fromEntries(Object.entries(result.triangles).map(([key, row]) => [key, row.count])),
    { entirelyNegative: 2, entirelyPositive: 2, crossingPlane: 1, onPlane: 1 });
  assert(Math.abs(result.triangles.entirelyNegative.surfaceAreaMm2 - (0.5 + Math.sqrt(3) / 2)) < 1e-12);
  assert(Math.abs(result.triangles.entirelyPositive.surfaceAreaMm2 - (0.5 + Math.sqrt(3) / 2)) < 1e-12);
  assert.equal(result.triangles.crossingPlane.surfaceAreaMm2, 1);
  assert.equal(result.triangles.onPlane.surfaceAreaMm2, 0.5);
  assert.equal(Object.values(result.triangles).reduce((n, row) => n + row.count, 0), faces.length);
  assert.throws(() => measureSourceXSurface({ vertices, faces: [[0, 1, 99]] }), /Invalid source vertex index/);
});

await test('pinned screen and exact source definition/hold changes fail closed', () => {
  const changedScreen = Buffer.from(screenBytes);
  changedScreen[changedScreen.length - 2] ^= 1;
  assert.throws(() => parsePinnedGeometryScreen(changedScreen, context), /Pinned geometry screen changed/);
  const definitions = selectPelvicFloorDefinitions(context);
  assert.equal(definitions.length, 7);
  assert.deepEqual(definitions.map((d) => d.id), Object.keys(pelvicFloorFiles));
  const changedMember = {
    ...context,
    records: context.records.map((r) => r.id === 'FMA45855' && r.tree === 'isa'
      ? { ...r, files: ['FJ1457M'] } : r),
  };
  assert.throws(() => selectPelvicFloorDefinitions(changedMember), /Changed component membership/);
  const changedHold = {
    ...context,
    inventory: {
      ...context.inventory,
      records: context.inventory.records.map((r) => r.id === 'FMA45855' && r.tree === 'isa'
        ? { ...r, status: 'unused-available' } : r),
    },
  };
  assert.throws(() => selectPelvicFloorDefinitions(changedHold), /Source hold status changed/);
});

await test('cached member bytes are bound to inventory and screened surface', async () => {
  const screenFile = screen.files.find((f) => f.tree === 'isa' && f.file === 'FJ2550');
  assert(screenFile);
  const inventoryMember = context.inventory.assets.find((a) => sourceKey(a) === sourceKey(screenFile));
  const target = { tree: screenFile.tree, file: screenFile.file, bytes: inventoryMember.bytes, crc32: inventoryMember.crc32 };
  const bytes = await readFile(resolve(cacheRoot, target.tree, `${target.file}.obj`));
  const checked = inspectPelvicFloorComponent(target, bytes, context.inventory, screenFile);
  assert.deepEqual(checked.file.bounds, screenFile.bounds);
  assert.deepEqual(checked.file.sourceXDistribution, screenFile.sourceXDistribution);
  const corrupt = Buffer.from(bytes);
  corrupt[corrupt.length - 2] ^= 1;
  assert.throws(() => inspectPelvicFloorComponent(target, corrupt, context.inventory, screenFile));
  assert.throws(() => inspectPelvicFloorComponent(target, bytes, context.inventory, { ...screenFile, sha256: '0'.repeat(64) }), /Geometry screen sha256 changed/);
  assert.throws(() => inspectPelvicFloorComponent(target, bytes, context.inventory, null), /Missing geometry screen member/);
});

await test('full offline review preserves components, source measurements and hold disposition', async () => {
  const { report, shapes } = await buildPelvicFloorReview({ cacheRoot });
  assert.deepEqual(report.summary, { definitions: 7, components: 13, comparisons: 9, admissions: 0 });
  assert.equal(shapes.length, 13);
  assert.deepEqual(report.groups.map((g) => [g.tree, g.id, g.files]),
    Object.entries(pelvicFloorFiles).map(([id, files]) => ['isa', id, files]));
  assert(report.groups.every((g) => g.disposition === disposition && !g.clinicalApproval));
  assert(report.files.every((f) => f.disposition === disposition && !f.clinicalApproval));
  assert(report.files.every((f) => f.sourceXSurface.referencedVertices + f.sourceXSurface.unreferencedVertices === f.vertices));
  assert(report.files.every((f) => Object.values(f.sourceXSurface.triangles).reduce((n, row) => n + row.count, 0) === f.triangles));
  assert(report.comparisons.every((c) => c.aToB.samples > 0 && c.bToA.samples > 0 && c.anatomicalEquivalence === 'not-determined'));
  assert.equal(report.clinicalApproval, false);
  assert.equal(report.admissionsChanged, false);
  assert.doesNotThrow(() => JSON.stringify(report));
  for (const shape of shapes) {
    const file = report.files.find((f) => sourceKey(f) === sourceKey(shape));
    assert(file);
    assert.deepEqual({ min: shape.min, max: shape.max }, file.bounds);
    assert.equal(shape.vertices.length, file.vertices);
    assert.equal(shape.faces.length, file.triangles);
  }
});
