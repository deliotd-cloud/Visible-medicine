import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {Vector3} from 'three';
import {cache} from './bodyparts-archive.mjs';
import {loadSourceHolds} from './load-source-holds.mjs';
import {sourceObjShape,sourceTriangleSet} from './source-surface-audit.mjs';
import {spatialDistanceIndex,uniqueSourceVertices,distanceSummary} from './source-spatial-math.mjs';

export const discHash=bytes=>createHash('sha256').update(bytes).digest('hex');
export const discSourcePins=[
 {tree:'isa',file:'FJ3211',id:'FMA10446',name:'intervertebral disk',bytes:358663,sha256:'2b1d69b821267f6446dab98a17ded12898ae2c68890575b435556f1aaf6cc78f'},
 {tree:'partof',file:'FJ3211',id:'FMA25511',name:'intervertebral symphysis',bytes:358666,sha256:'312819388c2857a2908b6529b463f43406f090748a464d3aa4bd00f0f3920ccd'},
];
const contextPins=[['FMA10059','FJ3155'],['FMA10081','FJ3156'],['FMA13072','FJ3157'],['FMA13073','FJ3159'],['FMA13508','FJ3210'],['FMA16033','FJ3212']];
function crc32(bytes){let crc=0xffffffff;for(const b of bytes){crc^=b;for(let k=0;k<8;k++)crc=(crc>>>1)^(-(crc&1)&0xedb88320);}return(crc^0xffffffff)>>>0;}
export function verifiedDiscShape(bytes,pin,asset){
 assert.equal(bytes.length,pin.bytes,'Source size changed');assert.equal(discHash(bytes),pin.sha256,'Source hash changed');
 assert.equal(asset.tree,pin.tree);assert.equal(asset.file,pin.file);assert.equal(asset.available,true);
 assert.equal(bytes.length,asset.bytes,'Archive size changed');assert.equal(crc32(bytes),asset.crc32,'Archive CRC changed');
 return sourceObjShape(bytes);
}
export async function discSourceReviewReport(){
 const context=await loadSourceHolds(),prepBytes=await readFile('content/source-geometry-screen.json');
 const preparationSha256=discHash(prepBytes);assert.equal(preparationSha256,'80a31dc88bc8e85561e5f3702b7697485ea547a4a85c7b3264ceb24291c66cd7');
 const prep=JSON.parse(prepBytes);assert.deepEqual(prep.evidence,context.evidence);
 assert.equal(prep.license,'CC-BY-4.0');
 const held=context.records.find(r=>r.tree==='partof'&&r.id==='FMA25511');
 assert.equal(held.name,'intervertebral symphysis');assert.deepEqual(held.files,['FJ3211']);assert.equal(context.policy.inspect(held).status,'blocked-known-source-hold');
 assert(!context.catalog.structures.some(s=>s.sources.some(p=>p.file==='FJ3211')),'Unresolved source unexpectedly admitted');
 const entries=[];
 for(const pin of discSourcePins){
  const record=context.records.find(r=>r.tree===pin.tree&&r.id===pin.id);assert.equal(record.name,pin.name);assert(record.files.includes(pin.file));
  if(pin.tree==='isa')assert.equal(record.files.length,23,'Generic aggregate membership changed');
  else{const p=prep.files.find(f=>f.tree===pin.tree&&f.file===pin.file);assert.equal(p.sha256,pin.sha256);assert.equal(p.bytes,pin.bytes);assert.equal(p.admitted,false);}
  entries.push({key:pin.tree+'/'+pin.file,role:'candidate',tree:pin.tree,file:pin.file,id:pin.id,name:pin.name,held:true,sources:[{tree:pin.tree,file:pin.file,sha256:pin.sha256,bytes:pin.bytes}]});
 }
 for(const [id,file]of contextPins){
  const owner=context.catalog.structures.find(s=>s.fmaId===id);assert(owner);assert.equal(owner.sourceTree,'isa');assert.equal(owner.sources.length,1);assert.equal(owner.sources[0].file,file);
  const asset=context.inventory.assets.find(a=>a.tree==='isa'&&a.file===file);assert(asset);
  entries.push({key:'isa/'+file,role:'context',tree:'isa',file,id,name:owner.sourceName,held:false,sources:[{tree:'isa',file,sha256:owner.sources[0].sha256,bytes:asset.bytes}]});
 }
 const meshes=[];
 for(const entry of entries){const source=entry.sources[0],asset=context.inventory.assets.find(a=>a.tree===entry.tree&&a.file===entry.file);
  const bytes=await readFile(resolve(cache,entry.tree,entry.file+'.obj'));const shape=verifiedDiscShape(bytes,source,asset);meshes.push({...entry,shape});}
 const metadata=meshes.map(({shape,...entry})=>({...entry,vertices:shape.vertices.length,triangles:shape.faces.length,bounds:{min:shape.min,max:shape.max},geometrySha256:discHash(JSON.stringify({vertices:shape.vertices,faces:shape.faces}))}));
 const candidates=meshes.filter(m=>m.role==='candidate'),a=candidates[0].shape,b=candidates[1].shape;
 const trianglesA=sourceTriangleSet(a),trianglesB=sourceTriangleSet(b);
 const sample=(shape,target)=>{const nearest=spatialDistanceIndex(target);return {vertices:distanceSummary(uniqueSourceVertices(shape),nearest),areaWeightedTriangleCentroids:distanceSummary(shape.triangles.map(t=>t.triangle.getMidpoint(new Vector3()).toArray()),nearest,shape.triangles.map(t=>t.triangle.getArea()))};};
 const contextDistances=meshes.filter(m=>m.role==='context').map(m=>({key:m.key,id:m.id,name:m.name,diagnosticOnly:true,fromCandidates:candidates.map(c=>({key:c.key,...sample(c.shape,m.shape)}))}));
 const algorithmSha256={};for(const name of ['disc-source-review-report.mjs','source-surface-audit.mjs','source-spatial-math.mjs','source-topology.mjs'])algorithmSha256[name]=discHash((await readFile(new URL('./'+name,import.meta.url),'utf8')).replaceAll('\r\n','\n'));
 const report={schemaVersion:1,purpose:'source-only-unresolved-disc-review',sourceVersion:'4.0',evidence:context.evidence,preparationSha256,algorithmSha256,
  coordinateSystem:context.catalog.coordinateSystem,license:prep.license,credit:prep.credit,licenseUrl:prep.licenseUrl,sourceArchives:prep.archives,meshes:metadata,
  sourceDefinitions:discSourcePins.map(p=>({tree:p.tree,id:p.id,name:p.name,representedFile:p.file,role:p.tree==='isa'?'One member of a 23-file generic aggregate, not the whole named organ':'Single generic source definition; named vertebral level unresolved'})),
  crossTree:{bytesIdentical:false,orderedGeometryIdentical:JSON.stringify({vertices:a.vertices,faces:a.faces})===JSON.stringify({vertices:b.vertices,faces:b.faces}),exactSharedTriangles:[...trianglesA].filter(t=>trianglesB.has(t)).length,isaToPartof:sample(a,b),partofToIsa:sample(b,a)},contextDistances,
  admissions:0,clinicalValidation:false,sourceGeometryChanged:false,levelAssigned:false,admissionApproved:false,patientRegistration:false,
  limitations:[
   'FJ3211 remains excluded from the learner atlas. No radiological level is assigned, and the PART-OF hold remains in force.',
   'The IS-A FMA10446 label describes a 23-file aggregate. Its one FJ3211 component is not a complete intervertebral disk collection or a named-level identity.',
   'Source trees have separate bytes and metadata. File-name equality does not establish geometry or anatomical equivalence.',
   'Original millimetre coordinates and triangles are preserved. Existing T11, T12, L1, L2 and two neighbouring source-labelled discs provide unvalidated context, not level certification.',
   'Unsigned distances sample all unique candidate vertices and area-weighted triangle centroids. They are not endplate contact, intersection, tissue continuity, shape validity or automatic level assignment.',
   'No endplate subdivisions, annulus, nucleus, ligament, nerve, scan or patient registration is created. Revision-bound radiologist adjudication is required before admission.'
  ]};
 report.reportRevision=discHash(JSON.stringify(report));return {report,meshes};
}
