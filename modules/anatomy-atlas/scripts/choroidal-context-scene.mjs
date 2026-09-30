import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
export const sceneGeometryHash=shape=>createHash('sha256').update(JSON.stringify({vertices:shape.vertices,faces:shape.faces})).digest('hex');

export function contextScene(report, meshes) {
  assert.equal(report.purpose, 'source-only-choroidal-context-review');
  assert.equal(report.admissions, 0);
  assert.equal(report.clinicalValidation, false);
  assert.equal(report.sourceGeometryChanged, false);
  assert.equal(report.duplicateScreen.unavailableSources, 0, 'Incomplete source cache');
  assert.equal(report.duplicateScreen.unsupportedSignatures, 0, 'Incomplete signature screen');
  const ids = new Set();
  const geometry = meshes.map(({shape, ...metadata}) => {
    assert(!ids.has(metadata.id), 'Duplicate scene identity'); ids.add(metadata.id);
    const expected = report.context.find(m => m.id === metadata.id);
    assert(expected, 'Unbound scene identity');
    assert.deepEqual(metadata, Object.fromEntries(Object.entries(expected).filter(([k]) => !['vertices','triangles','bounds','geometrySha256'].includes(k))), 'Scene metadata changed');
    assert.equal(shape.vertices.length, expected.vertices);
    assert.equal(shape.faces.length, expected.triangles);
    assert(Array.from(shape.vertices).every(p => Array.isArray(p) && p.length === 3 && Array.from(p).every(Number.isFinite)), 'Invalid scene point');
    assert(Array.from(shape.faces).every(f => Array.isArray(f) && f.length === 3 && Array.from(f).every(i => Number.isInteger(i) && i >= 0 && i < shape.vertices.length)), 'Invalid scene triangle');
    assert.deepEqual({min:shape.min,max:shape.max}, expected.bounds, 'Scene bounds changed');
    assert.equal(sceneGeometryHash(shape),expected.geometrySha256,'Scene geometry changed');
    return {...metadata, vertices:shape.vertices, faces:shape.faces};
  });
  assert.equal(ids.size, report.context.length, 'Missing scene structure');
  return {schemaVersion:1, purpose:report.purpose, admissions:0, clinicalValidation:false,
    sourceGeometryChanged:false, credit:report.credit, license:report.license,
    coordinateSystem:report.coordinateSystem, limitations:report.limitations,
    duplicateScreen:{verifiedSources:report.duplicateScreen.verifiedSources,
      matches:report.duplicateScreen.matches}, probes:report.envelopeProbes, meshes:geometry};
}
