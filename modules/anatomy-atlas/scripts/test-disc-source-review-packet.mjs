import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {discReviewPacket} from './disc-source-review-packet.mjs';

const hash = value => createHash('sha256').update(value).digest('hex');
const identities = [
  ['isa','FJ3211','FMA10446','intervertebral disk','candidate'],
  ['partof','FJ3211','FMA25511','intervertebral symphysis','candidate'],
  ['isa','FJ3155','FMA10059','eleventh thoracic vertebra','context'],
  ['isa','FJ3156','FMA10081','twelfth thoracic vertebra','context'],
  ['isa','FJ3157','FMA13072','first lumbar vertebra','context'],
  ['isa','FJ3159','FMA13073','second lumbar vertebra','context'],
  ['isa','FJ3210','FMA13508','intervertebral disk of eleventh thoracic vertebra','context'],
  ['isa','FJ3212','FMA16033','intervertebral disk of first lumbar vertebra','context'],
];

function fixture() {
  const report = {schemaVersion:1,purpose:'source-only-unresolved-disc-review',admissions:0,
    clinicalValidation:false,sourceGeometryChanged:false,levelAssigned:false,crossTree:{orderedGeometryIdentical:true,bytesIdentical:false},
    evidence:'synthetic-only',coordinateSystem:'synthetic',license:'synthetic',credit:'synthetic',
    limitations:['Synthetic geometry does not establish anatomical validity.'],meshes:[]};
  const meshes = [];
  for (let n=0;n<identities.length;n++) {
    const [tree,file,id,name,role] = identities[n];
    const vertices = [[n,0,0],[n+1,0,0],[n,1,0]];
    const faces = [[0,1,2]];
    const min = [n,0,0], max = [n+1,1,0];
    const metadata = {key:`${tree}/${file}`,role,tree,file,id,name,held:role==='candidate',
      sources:[{tree,file,sha256:hash(`${tree}/${file}`),bytes:10+n}]};
    report.meshes.push({...metadata,vertices:3,triangles:1,bounds:{min,max},
      geometrySha256:hash(JSON.stringify({vertices,faces}))});
    meshes.push({...structuredClone(metadata),shape:{vertices,faces,min:[...min],max:[...max]}});
  }
  return {report,meshes};
}

function rejects(change, pattern) {
  const {report,meshes} = fixture();
  change(report,meshes);
  assert.throws(() => discReviewPacket(report,meshes), pattern);
}

test('emits source-only packet bound to the exact pretty-LF report', () => {
  const {report,meshes} = fixture();
  const packet = discReviewPacket(report,meshes);
  assert.equal(packet.reportSha256,hash(JSON.stringify(report,null,2)+'\n'));
  assert.equal(packet.meshes.length,8);
  assert.deepEqual(packet.meshes[0].vertices,meshes[0].shape.vertices);
  assert.deepEqual(packet.meshes[0].faces,meshes[0].shape.faces);
  assert.equal(packet.admissions,0);
  assert.equal(packet.clinicalValidation,false);
  assert.equal(packet.sourceGeometryChanged,false);
  assert.equal(packet.levelAssigned,false);
});

test('rejects altered geometry, forged bounds, and malformed source geometry', () => {
  rejects((r,m) => {m[0].shape.vertices[0][0]=99;}, /bounds|Geometry changed/);
  rejects((r,m) => {r.meshes[0].bounds.max[0]=99;m[0].shape.max[0]=99;}, /bounds/);
  rejects((r,m) => {m[0].shape.vertices[0][0]=Infinity;}, /Invalid source point/);
  rejects((r,m) => {m[0].shape.faces[0][2]=3;}, /Invalid source face/);
});

test('rejects metadata, source, count, identity, and tree changes', () => {
  rejects((r,m) => {m[0].name='renamed';}, /metadata changed/);
  rejects((r,m) => {m[0].sources[0].sha256=hash('other');}, /metadata changed/);
  rejects((r,_m) => {r.meshes[0].sources[0].sha256=hash('other');}, /metadata changed/);
  rejects((r,m) => {m[0].sources[0].tree='partof';}, /metadata changed/);
  rejects((r,_m) => {r.meshes[0].sources[0].tree='partof';}, /Swapped source tree/);
  rejects((r,m) => {m.push(structuredClone(m[0]));}, /mesh count/);
  rejects((r,m) => {m[1]=structuredClone(m[0]);}, /Duplicate geometry mesh/);
  rejects((r,m) => {m.pop();}, /mesh count/);
  rejects((r,_m) => {r.meshes[0].key='isa/FJ9999';}, /Unknown mesh identity/);
});

test('rejects relabelled or assigned-level candidates', () => {
  rejects((r,_m) => {r.meshes[0].name='T12/L1 disc';}, /Wrong name/);
  rejects((r,_m) => {r.levelAssigned=true;}, /true !== false/);
  rejects((r,_m) => {r.meshes[0].level='T12/L1';}, /Invalid report mesh fields/);
  rejects((r,_m) => {r.meshes[0].held=false;}, /Candidate hold missing/);
  rejects((r,m) => {r.meshes[2].name='incorrect level';m[2].name='incorrect level';}, /Wrong name/);
  rejects((r,m) => {r.meshes[0].triangles=0;m[0].shape.faces=[];}, /Invalid triangle count/);
});
