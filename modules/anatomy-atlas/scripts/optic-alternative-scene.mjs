import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
export const opticHash=bytes=>createHash('sha256').update(bytes).digest('hex');
export const opticGeometryHash=shape=>opticHash(JSON.stringify({vertices:shape.vertices,faces:shape.faces}));
export {opticReviewDraft} from './optic-alternative-review-draft.mjs';
export function opticAlternativeScene(report,meshes){
 assert.equal(report.purpose,'source-only-optic-alternative-review');
 assert.equal(report.admissions,0);assert.equal(report.clinicalValidation,false);assert.equal(report.sourceGeometryChanged,false);
 assert.equal(report.meshes.length,meshes.length);const seen=new Set();
 const geometry=meshes.map(({shape,...metadata})=>{
  assert(!seen.has(metadata.key),'Duplicate mesh');seen.add(metadata.key);
  const expected=report.meshes.find(m=>m.key===metadata.key);assert(expected,'Unbound mesh');
  assert.deepEqual(metadata,Object.fromEntries(Object.entries(expected).filter(([k])=>!['vertices','triangles','degenerateTriangles','bounds','geometrySha256'].includes(k))));
  assert.equal(shape.vertices.length,expected.vertices);assert.equal(shape.faces.length,expected.triangles);
  assert(shape.vertices.every(p=>p.length===3&&p.every(Number.isFinite)),'Invalid source point');
  assert(shape.faces.every(f=>f.length===3&&f.every(i=>Number.isInteger(i)&&i>=0&&i<shape.vertices.length)),'Invalid source face');
  assert.deepEqual({min:shape.min,max:shape.max},expected.bounds);assert.equal(opticGeometryHash(shape),expected.geometrySha256,'Geometry changed');
  return {...metadata,vertices:shape.vertices,faces:shape.faces};
 });
 const candidates=geometry.filter(m=>m.role==='candidate');assert.equal(candidates.length,4);
 assert.deepEqual(candidates.map(m=>m.sources[0].file).sort(),['FJ1313','FJ1364','FJ1772','FJ1819']);
 const exactPairs={right:{id:'FMA50875',files:['FJ1364','FJ1819']},left:{id:'FMA50878',files:['FJ1313','FJ1772']}};
 for(const pair of report.pairs){assert.equal(pair.files.length,2);for(const file of pair.files){
  const matches=candidates.filter(m=>m.side===pair.side&&m.id===pair.id&&m.sources.length===1&&m.sources[0].file===file);
  assert.equal(matches.length,1,'Wrong-side pair');assert.equal(matches[0].held,true);
 }assert.deepEqual({id:pair.id,files:pair.files},exactPairs[pair.side],'Wrong-side pair');}
 assert.deepEqual(report.pairs.map(p=>p.side).sort(),['left','right']);
 return {schemaVersion:1,purpose:report.purpose,reportSha256:opticHash(JSON.stringify(report,null,2)+'\n'),
  admissions:0,clinicalValidation:false,sourceGeometryChanged:false,evidence:report.evidence,
  coordinateSystem:report.coordinateSystem,license:report.license,credit:report.credit,
  limitations:report.limitations,pairs:report.pairs,meshes:geometry};
}
