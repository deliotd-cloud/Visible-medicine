// Original-face diagnostics, not mesh repair or a clinical continuity decision.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {Box3,Vector3} from 'three';
import {ExtendedTriangle} from 'three-mesh-bvh';
import {readGlb} from './glb-lossless-codec.mjs';
import {hraSource,hraAccessor,hraDigest} from './hra-pelvis-source.mjs';

function triangles(vertices,faces){
 return faces.map(face=>{const points=face.map(i=>new Vector3(...vertices[i]));return {triangle:new ExtendedTriangle(...points),box:new Box3().setFromPoints(points),keys:new Set(face.map(i=>vertices[i].join(',')))};});
}
function intersections(a,b,self=false){
 const faces=[];let boundsCandidates=0,excludedSharedVertexPairs=0;
 for(let i=0;i<a.length;i++)for(let j=self?i+1:0;j<b.length;j++){
  if(self&&[...a[i].keys].some(k=>b[j].keys.has(k))){excludedSharedVertexPairs++;continue;}
  if(!a[i].box.clone().expandByScalar(1e-9).intersectsBox(b[j].box))continue;
  boundsCandidates++;
  if(a[i].triangle.intersectsTriangle(b[j].triangle,null,true))faces.push([i,j]);
 }
 return {boundsCandidates,excludedSharedVertexPairs,intersectingFacePairs:faces,count:faces.length};
}
const a=triangles([[0,0,0],[2,0,0],[0,2,0]],[[0,1,2]]);
const crossing=triangles([[.5,.5,-1],[.5,.5,1],[.5,1,0]],[[0,1,2]]);
const remote=triangles([[5,0,0],[7,0,0],[5,2,0]],[[0,1,2]]);
const coplanar=triangles([[.25,.25,0],[.75,.25,0],[.25,.75,0]],[[0,1,2]]);
assert.equal(intersections(a,crossing).count,1);assert.equal(intersections(a,remote).count,0);
assert.equal(intersections(a,coplanar).count,1);assert.equal(intersections(a,a,true).count,0);
const selfCrossing=triangles([[0,0,0],[2,0,0],[0,2,0],[.5,.5,-1],[.5,.5,1],[.5,1,0]],[[0,1,2],[3,4,5]]);
assert.equal(intersections(selfCrossing,selfCrossing,true).count,1);
const adjacent=triangles([[0,0,0],[2,0,0],[0,2,0],[0,-2,0]],[[0,1,2],[0,1,3]]);
assert.equal(intersections(adjacent,adjacent,true).excludedSharedVertexPairs,1);
assert.equal(intersections(adjacent,adjacent,true).count,0);
const args=process.argv.slice(2);assert(args.every(v=>['--record','--check'].includes(v)||v.startsWith('--source=')));
assert.equal(args.filter(v=>v==='--record'||v==='--check').length,1);assert(args.filter(v=>v.startsWith('--source=')).length<=1);
const directory=args.find(v=>v.startsWith('--source='))?.slice(9)??'D:/VisibleMedicine-Atlas-Recovery/source-candidates/hra-united-female-v1.10';
const source=await readFile(directory+'/3d-vh-f-united.glb');assert.equal(source.length,hraSource.bytes);assert.equal(hraDigest(source),hraSource.sha256);
const auditBytes=await readFile('docs/hra-urinary-junction-source-audit.json'),audit=JSON.parse(auditBytes);
const auditHash=hraDigest(auditBytes.toString().replaceAll('\r\n','\n'));assert.equal(auditHash,'b251217d72ad5d3ffa2db9b873fcb7040d27a7acff2a9e7f844affd974ce2a62');
const {json:g,bin}=readGlb(source),shapes=new Map();
for(const id of [712,713,685,705,707,709]){
 const row=audit.rows.find(r=>r.nodeIndex===id),node=g.nodes[id];assert.equal(node.name,row.nodeName);
 for(const ancestor of row.ancestry){const n=g.nodes[ancestor.nodeIndex];assert(!n.matrix&&!n.translation&&!n.rotation&&!n.scale);}
 const p=g.meshes[node.mesh].primitives[0],positions=hraAccessor(g,bin,p.attributes.POSITION),indices=hraAccessor(g,bin,p.indices);
 assert.equal(hraDigest(JSON.stringify(positions)),row.positionAccessorSha256);assert.equal(hraDigest(JSON.stringify(indices)),row.indexAccessorSha256);
 assert.equal(row.topology.degenerateFaces,0);
 const flat=indices.flat();shapes.set(id,triangles(positions.map(v=>v.map(n=>n*1000)),Array.from({length:flat.length/3},(_,i)=>flat.slice(i*3,i*3+3))));
}
const pairs=[[712,685],[713,705],[712,707],[713,707],[712,709],[713,709],[712,713],[712,712],[713,713]].map(([a,b])=>({a,b,...intersections(shapes.get(a),shapes.get(b),a===b)}));
const report={schemaVersion:1,sourceSha256:hraSource.sha256,sourceAuditSha256:auditHash,
 method:'All original face pairs within padded Float64 bounds; ExtendedTriangle floating intersection predicate; source face order retained. Self tests exclude pairs sharing any exact-coordinate vertex.',
 syntheticChecks:{crossing:true,separated:true,coplanarOverlap:true,selfSingleTriangle:true,selfCrossing:true,selfSharedVertexExcluded:true},pairs,
 limitations:['Floating numerical predicate, not a formal exact-arithmetic intersection proof.','A hit may mean touch or crossing; not a distinct defect count or validated tissue relationship.','No volume containment or lumen continuity test; zero hits does not prove anatomical separation or normality.','Self tests exclude shared-vertex pairs and do not prove a complete self-intersection absence.','Only the listed source surfaces are tested, not the full original source inventory.'],
 sourceGeometryChanged:false,runtimeAdmission:false,clinicalApproval:false};
const text=JSON.stringify(report,null,2)+'\n',path='docs/hra-urinary-contact-audit.json';
if(args.includes('--record'))await writeFile(path,text,{flag:'wx'});else assert.equal(await readFile(path,'utf8'),text);
console.log(JSON.stringify({sourceAuditSha256:auditHash,pairs:pairs.map(({intersectingFacePairs,...r})=>r),runtimeAdmission:false}));
