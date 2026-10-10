import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { prepareShape } from './vessel-shape-math.mjs';
import { sha256 } from './source-geometry-screen.mjs';
import { compareOpticShapes, opticAlternativeReport, validateOpticPins, verifyOpticSourceBytes } from './optic-alternative-report.mjs';

const triangle = (z = 0) => prepareShape([[0, 0, z], [1, 0, z], [0, 1, z]], [[0, 1, 2]]);

test('identity and translated planes retain bidirectional exact sampling', () => {
  const same = compareOpticShapes(triangle(), triangle());
  assert.equal(same.exactSharedTriangles, 1);
  assert.equal(same.aToB.vertices.samples, 3);
  assert.equal(same.aToB.vertices.maxMm, 0);
  const shifted = compareOpticShapes(triangle(), triangle(2));
  assert.equal(shifted.exactSharedTriangles, 0);
  for (const direction of [shifted.aToB, shifted.bToA]) {
    assert.equal(direction.vertices.samples, 3);
    assert.equal(direction.vertices.minMm, 2);
    assert.equal(direction.vertices.maxMm, 2);
    assert.equal(direction.areaWeightedTriangleCentroids.samples, 1);
    assert.equal(direction.areaWeightedTriangleCentroids.maxMm, 2);
  }
});

test('duplicate vertices and degenerate faces remain in original source surface', () => {
  const duplicate = prepareShape(
    [[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 0]],
    [[0, 1, 2], [3, 3, 1]],
  );
  const result = compareOpticShapes(duplicate, triangle());
  assert.equal(result.aToB.vertices.samples, 3);
  assert.equal(result.aToB.areaWeightedTriangleCentroids.samples, 2);
  assert.equal(result.exactSharedTriangles, 1);
  assert.equal(result.triangleCounts[0], 2);
  assert.equal(result.aToB.vertices.maxMm, 0);
});

test('source hash and size gates reject corrupt cached bytes', () => {
  const bytes = Buffer.from('v 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 3\n');
  const source = { sha256: sha256(bytes), bytes: bytes.length };
  assert.equal(verifyOpticSourceBytes(source, bytes, 'fixture').faces.length, 1);
  assert.throws(() => verifyOpticSourceBytes(source, Buffer.from(bytes.toString().replace('1 0 0', '2 0 0')), 'fixture'), /Source hash changed/);
  assert.throws(() => verifyOpticSourceBytes({ ...source, bytes: bytes.length + 1 }, bytes, 'fixture'), /Source size changed/);
});

test('wrong side, foreign file, and lifted hold fail pin validation', async () => {
  const { loadSourceHolds } = await import('./load-source-holds.mjs');
  const context = await loadSourceHolds();
  const prep = JSON.parse(await readFile('content/source-geometry-screen.json'));
  const visual = JSON.parse(await readFile('docs/visual-pathway-source-audit.json'));
  validateOpticPins(context, prep, visual);
  const badSide = structuredClone(prep);
  badSide.files.find((f) => f.file === 'FJ1364').bounds.max[0] = 1;
  assert.throws(() => validateOpticPins(context, badSide, visual), /laterality/);
  const foreign = { ...context, inventory: structuredClone(context.inventory) };
  foreign.inventory.records.find((r) => r.id === 'FMA50875').files[0] = 'FJ9999';
  assert.throws(() => validateOpticPins(foreign, prep, visual), /source files changed/);
  const lifted = { ...context, inventory: structuredClone(context.inventory) };
  lifted.inventory.records.find((r) => r.id === 'FMA50878').status = 'admitted';
  assert.throws(() => validateOpticPins(lifted, prep, visual), /hold changed/);
  const wrongLeft=structuredClone(prep);wrongLeft.files.find(f=>f.file==='FJ1313').bounds.min[0]=-30;
  assert.throws(()=>validateOpticPins(context,wrongLeft,visual),/laterality/);
});

test('actual cached pair replay matches pinned report and hashes', async () => {
  const { report, meshes } = await opticAlternativeReport();
  const saved = JSON.parse(await readFile('docs/optic-nerve-alternatives.json'));
  assert.deepEqual(report, saved);
  assert.equal(report.reportRevision, sha256(JSON.stringify({ ...report, reportRevision: undefined })));
  assert.equal(report.pairs.length, 2);
  assert.equal(meshes.filter((m) => m.role === 'candidate').length, 4);
  assert(report.pairs.every((p) => p.held && !p.admissionApproved));
  assert.equal(report.admissionApproved, false);
  assert.equal(report.purpose,'source-only-optic-alternative-review');
  assert.equal(report.admissions,0);assert.equal(report.sourceGeometryChanged,false);
  for (const mesh of meshes) {
    const recorded = report.meshes.find((m) => m.key === mesh.key);
    assert.equal(recorded.geometrySha256,
      sha256(JSON.stringify({ vertices: mesh.shape.vertices, faces: mesh.shape.faces })));
  }
});
