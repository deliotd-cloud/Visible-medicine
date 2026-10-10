import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import {auditObject, buildAudit, NAMES} from './audit-open3dmodel-plexus-context.mjs';

const row = {name: 'Humerus.r', startLine: 10, vertices: 4, faces: 2,
  faceSizes: {'3': 2}, min: [0, 0, 0], max: [1, 1, 1], crossObjectReferences: 0};
const object = {name: 'Humerus.r', startLine: 10,
  vertices: [[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]],
  faces: [[0, 1, 2], [0, 3, 1]]};

test('original frame audit pins full source, labels and bounded report', async () => {
  const saved = JSON.parse(await readFile('docs/open3dmodel-plexus-context-audit.json', 'utf8'));
  assert.deepEqual(await buildAudit(), saved);
  assert.deepEqual(saved.objects.map(item => item.sourceName), NAMES);
  assert(saved.objects.every(item => item.sourceNamedRight && item.failedFaces.length === 0));
  assert(saved.objects.every(item => item.derivedGeometrySha256 && item.polygonMapSha256));
  assert(saved.objects.every(item => item.topology.closedOrientedManifold));
  assert.equal(saved.admitted, false);
  assert.equal(saved.registered, false);
  assert.equal(saved.clinicalApproved, false);
  assert(!('vertices' in saved.objects[0]) && !('indices' in saved.objects[0]));
});

test('identity, coordinates, polygon shape and face identity are refused', () => {
  assert.throws(() => auditObject({...object, name: 'Humerus.r.'}, row), /Unexpected object/);
  assert.throws(() => auditObject(object, {...row, name: 'Scapula.r.'}), /Original label mismatch/);
  assert.throws(() => auditObject({...object, vertices: object.vertices.map((v, i) => i === 1 ? [2, 0, 0] : v)}, row), /Coordinates\/bounds mismatch/);
  assert.throws(() => auditObject({...object, faces: [[0, 1, 2], [0, 3, 1, 2]]}, row), /Polygon counts mismatch/);
  assert.throws(() => auditObject({...object, faces: [object.faces[0]]}, row), /Face count mismatch/);
});

test('one invalid polygon holds the entire labelled object', () => {
  const invalid = {...object, faces: [object.faces[0], [0, 0, 3]]};
  const result = auditObject(invalid, row);
  assert.equal(result.disposition, 'held-entire-source-object');
  assert.equal(result.failedFaces.length, 1);
  assert.equal(result.failedFaces[0].sourceFace, 1);
  assert.equal(result.triangles, null);
  assert.equal(result.derivedGeometrySha256, null);
  assert.equal(result.topology, null);
});
