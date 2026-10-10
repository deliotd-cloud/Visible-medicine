import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const hash = value => createHash('sha256').update(value).digest('hex');
const purpose = 'source-only-unresolved-disc-review';
const identities = new Map([
  ['isa/FJ3211', {role:'candidate',tree:'isa',file:'FJ3211',id:'FMA10446',name:'intervertebral disk'}],
  ['partof/FJ3211', {role:'candidate',tree:'partof',file:'FJ3211',id:'FMA25511',name:'intervertebral symphysis'}],
  ['isa/FJ3155', {role:'context',tree:'isa',file:'FJ3155',id:'FMA10059',name:'eleventh thoracic vertebra'}],
  ['isa/FJ3156', {role:'context',tree:'isa',file:'FJ3156',id:'FMA10081',name:'twelfth thoracic vertebra'}],
  ['isa/FJ3157', {role:'context',tree:'isa',file:'FJ3157',id:'FMA13072',name:'first lumbar vertebra'}],
  ['isa/FJ3159', {role:'context',tree:'isa',file:'FJ3159',id:'FMA13073',name:'second lumbar vertebra'}],
  ['isa/FJ3210', {role:'context',tree:'isa',file:'FJ3210',id:'FMA13508',name:'intervertebral disk of eleventh thoracic vertebra'}],
  ['isa/FJ3212', {role:'context',tree:'isa',file:'FJ3212',id:'FMA16033',name:'intervertebral disk of first lumbar vertebra'}],
]);
const reportMeshKeys = ['bounds','file','geometrySha256','held','id','key','name','role','sources','tree','triangles','vertices'];
const metadataKeys = reportMeshKeys.filter(key => !['bounds','geometrySha256','triangles','vertices'].includes(key));
const digest = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const compareStrings = (a,b) => a < b ? -1 : a > b ? 1 : 0;

function validateIdentity(mesh) {
  const expected = identities.get(mesh.key);
  assert(expected, 'Unknown mesh identity');
  for (const [field, value] of Object.entries(expected)) assert.equal(mesh[field], value, `Wrong ${field}: ${mesh.key}`);
  if (expected.role === 'candidate') assert.equal(mesh.held, true, `Candidate hold missing: ${mesh.key}`);
  else assert.equal(mesh.held, false, `Context hold changed: ${mesh.key}`);
  assert.equal(typeof mesh.name, 'string');
  assert(mesh.name.length > 0, 'Empty source name');
  assert(Array.isArray(mesh.sources) && mesh.sources.length === 1, 'Expected one source');
  const source = mesh.sources[0];
  assert.deepEqual(Object.keys(source).sort(compareStrings), ['bytes','file','sha256','tree']);
  assert.equal(source.tree, expected.tree, 'Swapped source tree');
  assert.equal(source.file, expected.file, 'Swapped source file');
  assert(digest(source.sha256), 'Invalid source digest');
  assert(Number.isSafeInteger(source.bytes) && source.bytes > 0, 'Invalid source byte count');
}

function validateShape(shape, expected) {
  assert(shape && Array.isArray(shape.vertices) && Array.isArray(shape.faces), 'Missing geometry');
  assert(shape.vertices.length > 0, 'Empty source geometry');
  assert.equal(shape.vertices.length, expected.vertices, 'Vertex count changed');
  assert.equal(shape.faces.length, expected.triangles, 'Triangle count changed');
  assert(shape.vertices.every(point => Array.isArray(point) && point.length === 3 && point.every(Number.isFinite)), 'Invalid source point');
  assert(shape.faces.every(face => Array.isArray(face) && face.length === 3 && face.every(index => Number.isInteger(index) && index >= 0 && index < shape.vertices.length)), 'Invalid source face');
  const bounds = {min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]};
  for (const point of shape.vertices) for (let axis=0;axis<3;axis++) {
    bounds.min[axis] = Math.min(bounds.min[axis], point[axis]);
    bounds.max[axis] = Math.max(bounds.max[axis], point[axis]);
  }
  assert.deepEqual(expected.bounds, bounds, 'Claimed bounds differ from vertices');
  assert.deepEqual({min:shape.min,max:shape.max}, bounds, 'Shape bounds differ from vertices');
  assert.equal(expected.geometrySha256, hash(JSON.stringify({vertices:shape.vertices,faces:shape.faces})), 'Geometry changed');
}

export function discReviewPacket(report, meshes) {
  assert(report && typeof report === 'object', 'Missing report');
  assert.equal(report.schemaVersion, 1);
  assert.equal(report.purpose, purpose);
  assert.equal(report.admissions, 0);
  assert.equal(report.clinicalValidation, false);
  assert.equal(report.sourceGeometryChanged, false);
  assert.equal(report.levelAssigned, false);
  assert.equal(typeof report.crossTree?.orderedGeometryIdentical,'boolean');
  assert.equal(report.crossTree.bytesIdentical,false);
  assert(Array.isArray(report.meshes) && Array.isArray(meshes), 'Missing meshes');
  assert.equal(report.meshes.length, identities.size, 'Unexpected report mesh count');
  assert.equal(meshes.length, identities.size, 'Unexpected geometry mesh count');
  const reportByKey = new Map();
  for (const entry of report.meshes) {
    assert.deepEqual(Object.keys(entry).sort(compareStrings), reportMeshKeys, 'Invalid report mesh fields');
    assert(!reportByKey.has(entry.key), 'Duplicate report mesh');
    validateIdentity(entry);
    assert(Number.isSafeInteger(entry.vertices) && entry.vertices > 0, 'Invalid vertex count');
    assert(Number.isSafeInteger(entry.triangles) && entry.triangles > 0, 'Invalid triangle count');
    assert(digest(entry.geometrySha256), 'Invalid geometry digest');
    reportByKey.set(entry.key, entry);
  }
  assert.deepEqual([...reportByKey.keys()].sort(compareStrings), [...identities.keys()].sort(compareStrings), 'Missing source identity');
  const seen = new Set();
  const geometry = meshes.map(({shape,...metadata}) => {
    assert.deepEqual(Object.keys(metadata).sort(compareStrings), metadataKeys, 'Invalid geometry metadata fields');
    assert(!seen.has(metadata.key), 'Duplicate geometry mesh');
    seen.add(metadata.key);
    const expected = reportByKey.get(metadata.key);
    assert(expected, 'Unbound geometry mesh');
    assert.deepEqual(metadata, Object.fromEntries(metadataKeys.map(key => [key, expected[key]])), 'Geometry metadata changed');
    validateShape(shape, expected);
    return {...metadata,vertices:shape.vertices,faces:shape.faces};
  });
  assert.deepEqual([...seen].sort(compareStrings), [...identities.keys()].sort(compareStrings), 'Missing geometry mesh');
  return {schemaVersion:1,purpose,reportSha256:hash(JSON.stringify(report,null,2)+'\n'),
    admissions:0,clinicalValidation:false,sourceGeometryChanged:false,levelAssigned:false,
    evidence:report.evidence,coordinateSystem:report.coordinateSystem,license:report.license,
    credit:report.credit,limitations:report.limitations,crossTree:report.crossTree,meshes:geometry};
}
