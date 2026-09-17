// Source-only screen; does not repair, fit, export or admit runtime anatomy.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {Matrix4} from 'three';
import {readGlb} from './glb-lossless-codec.mjs';
import {hraSource,hraAccessor,hraDigest} from './hra-pelvis-source.mjs';
import {prepareShape} from './vessel-shape-math.mjs';
import {sourceTopology} from './source-topology.mjs';
import {sourceTriangleSet,compareSourceSurfaces} from './source-surface-audit.mjs';

const args=process.argv.slice(2);
assert(args.every(a=>['--record','--check'].includes(a)||a.startsWith('--source=')));
assert.equal(args.filter(a=>a==='--record'||a==='--check').length,1);
assert(args.filter(a=>a.startsWith('--source=')).length<=1);
const directory=args.find(a=>a.startsWith('--source='))?.slice(9)??'D:/VisibleMedicine-Atlas-Recovery/source-candidates/hra-united-female-v1.10';
const bytes=await readFile(directory+'/3d-vh-f-united.glb');
assert.equal(bytes.length,hraSource.bytes);assert.equal(hraDigest(bytes),hraSource.sha256);
const metadata=await readFile(directory+'/metadata.json'),crosswalk=await readFile(directory+'/crosswalk.csv');
assert.equal(hraDigest(metadata),hraSource.metadataSha256);assert.equal(hraDigest(crosswalk),hraSource.crosswalkSha256);
const {json:g,bin}=readGlb(bytes),parents=new Map();
g.nodes.forEach((n,i)=>(n.children??[]).forEach(c=>{assert(!parents.has(c));parents.set(c,i);}));
const specifications=[
 [685,'VH_F_right_ureter','existing-renal'],[705,'VH_F_left_ureter','existing-renal'],
 [712,'VH_F_ureteral_orifice_R','candidate'],[713,'VH_F_ureteral_orifice_L','candidate'],
 [707,'VH_F_fundus_of_urinary_bladder_dome','existing-pelvic-context'],
 [708,'VH_F_urinary_bladder_neck_smooth_muscle','existing-pelvic-context'],
 [709,'VH_F_fundus_of_urinary_bladder_base','existing-pelvic-context'],
 [736,'VH_F_left_uterine_artery','existing-pelvic-context'],
 [737,'VH_F_right_uterine_artery','existing-pelvic-context'],
 [485,'VH_F_cervix','existing-pelvic-context'],
];
const previousRenal=JSON.parse(await readFile('docs/hra-renal-source-audit.json'));
const previousPelvic=JSON.parse(await readFile('docs/hra-pelvic-source-audit.json'));
assert.equal(previousRenal.sourceSha256,hraSource.sha256);assert.equal(previousPelvic.sourceSha256,hraSource.sha256);
const rows=[],shapes=new Map(),sets=new Map(),cw=crosswalk.toString().split(/\r?\n/);
for(const [i,name,role] of specifications){
 const n=g.nodes[i];assert.equal(n.name,name);assert(Number.isSafeInteger(n.mesh));
 const ancestry=[],seen=new Set();let ancestor=i;
 while(ancestor!==undefined){
  assert(!seen.has(ancestor));seen.add(ancestor);const node=g.nodes[ancestor];
  assert(!node.matrix&&!node.translation&&!node.rotation&&!node.scale,'Unexpected source transform; do not flatten or fit');
  ancestry.push({nodeIndex:ancestor,nodeName:node.name});ancestor=parents.get(ancestor);
 }
 const mesh=g.meshes[n.mesh];assert.equal(mesh.primitives.length,1);
 const p=mesh.primitives[0];assert.equal(p.mode??4,4);assert(!p.targets&&n.skin===undefined);
 const raw=hraAccessor(g,bin,p.attributes.POSITION),idx=hraAccessor(g,bin,p.indices).flat();
 assert(idx.length%3===0&&idx.every(v=>Number.isInteger(v)&&v>=0&&v<raw.length));
 const vertices=raw.map(v=>v.map(x=>x*1000)),faces=Array.from({length:idx.length/3},(_,j)=>idx.slice(j*3,j*3+3));
 const shape=prepareShape(vertices,faces);shapes.set(i,shape);sets.set(i,sourceTriangleSet(shape));
 const definitions=cw.filter(line=>line.startsWith(name+','));assert.equal(definitions.length,1);
 const [,ontologyId,label]=definitions[0].split(',');assert.equal(ontologyId,n.extras.ontologyid);assert.equal(label,n.extras.label);
 const attributes=Object.fromEntries(Object.entries(p.attributes).map(([key,a])=>[key,hraDigest(JSON.stringify(hraAccessor(g,bin,a)))]));
 const row={nodeIndex:i,nodeName:name,role,meshIndex:n.mesh,metadata:n.extras,ancestry,
  worldMatrix:new Matrix4().toArray(),crosswalk:{ontologyId,label,originalRow:definitions[0]},
  sourceVertices:raw.length,triangles:faces.length,worldBoundsMm:{min:shape.min,max:shape.max},
  positionAccessorSha256:attributes.POSITION,indexAccessorSha256:hraDigest(JSON.stringify(hraAccessor(g,bin,p.indices))),
  attributeAccessorSha256:attributes,topology:sourceTopology(shape)};
 if(role!=='candidate'){
  const old=(role==='existing-renal'?previousRenal:previousPelvic).rows.find(r=>r.nodeIndex===i);
  assert(old);assert.equal(old.nodeName,name);assert.equal(old.triangles,row.triangles);
  assert.equal(old.positionAccessorSha256,row.positionAccessorSha256);
  // The older pelvic audit did not record index/normal hashes. Pin them here
  // from the full, SHA-verified original; never invent a historical comparison.
  if(role==='existing-renal'){
   assert.equal(old.indexAccessorSha256,row.indexAccessorSha256);
   assert.deepEqual(old.attributeAccessorSha256,row.attributeAccessorSha256);
  }else assert.equal(old.indexAccessorSha256,undefined);
  assert.deepEqual(old.metadata,row.metadata);
  assert.deepEqual(old.worldMatrix,row.worldMatrix);
  assert.deepEqual(old.worldBoundsMm,row.worldBoundsMm);
  assert.deepEqual(old.topology,row.topology,'Existing source diagnostics must reproduce');
 }
 rows.push(row);
}
const shared=[];
for(let a=0;a<rows.length;a++)for(const b of rows.slice(a+1)){
 const first=rows[a],count=[...sets.get(first.nodeIndex)].filter(t=>sets.get(b.nodeIndex).has(t)).length;
 shared.push({a:first.nodeName,b:b.nodeName,exactSharedTriangles:count});
}
const comparisons=[];
for(const [a,b]of [[712,685],[713,705],[712,709],[713,709],[712,707],[713,707],[685,737],[705,736],[712,713]]){
 const {flagged,...measurements}=compareSourceSurfaces(shapes.get(a),shapes.get(b));
 // Generic whole-surface percentage flags are not meaningful for a tiny junction
 // against an entire long ureter. Retain measurements, never imply clearance.
 comparisons.push({a:g.nodes[a].name,b:g.nodes[b].name,...measurements,disposition:'requires-local-relationship-review'});
}
const namePattern='levator|puborect|pubococ|iliococ|coccygeus|ureter|pudend|obturator.intern|piriformis';
const nameRegex=new RegExp(namePattern,'i');
const nameScreen={pattern:namePattern,field:'node.name',scope:'all original GLB nodes, names only; not ontology synonyms or other datasets',nodesScreened:g.nodes.length,
 matches:g.nodes.flatMap((n,i)=>nameRegex.test(n.name??'')?[{nodeIndex:i,nodeName:n.name,meshIndex:n.mesh??null,metadata:n.extras??null}]:[])};
const report={schemaVersion:1,sourceUrl:hraSource.url,sourceSha256:hraDigest(bytes),sourceBytes:bytes.length,
 metadataUrl:hraSource.metadataUrl,metadataSha256:hraDigest(metadata),crosswalkUrl:hraSource.crosswalkUrl,crosswalkSha256:hraDigest(crosswalk),sourceLicense:hraSource.license,
 licenseUrl:hraSource.licenseUrl,credit:hraSource.credit,
 rows,shared,comparisons,nameScreen,
 limitations:['Coordinates are the unchanged official source in millimetres; not patient registration.',
  'Surface sampling is bounded at128 vertices in each direction; it is not an exhaustive intersection or continuity test.',
  'Orifice source surfaces are not proof of an open ureterovesical lumen, intramural segment or validated tissue plane.',
  'Ureters already occur in the separate kidney study; reusing them would not add unique anatomy.',
  'The recorded name screen is limited to its exact pattern and original GLB names; no substitute anatomy is admitted.',
  'Exact shared triangles were checked only among the ten selected surfaces, not the complete source or runtime inventory.',
  'No comparison result clears a junction for runtime admission; topology and sampled distances are not anatomical sign-off.'],
 admitted:false,clinicalApproval:false,sourceGeometryChanged:false};
const output=JSON.stringify(report,null,2)+'\n',path='docs/hra-urinary-junction-source-audit.json';
if(args.includes('--check'))assert.equal(await readFile(path,'utf8'),output);
else await writeFile(path,output,{flag:'wx'});
console.log(JSON.stringify({sourceSha256:report.sourceSha256,rows:rows.map(r=>({name:r.nodeName,role:r.role,triangles:r.triangles,bounds:r.worldBoundsMm,
 components:r.topology.components.length,duplicateFaces:r.topology.duplicateFaces,degenerateFaces:r.topology.degenerateFaces,
 nonManifoldEdges:r.topology.nonManifoldEdges,boundaryEdges:r.topology.boundaryEdges})),shared:shared.filter(p=>p.exactSharedTriangles),
 comparisons:comparisons.map(p=>({a:p.a,b:p.b,shared:p.exactTriangles,aMedian:p.aToB.medianMm,bMedian:p.bToA.medianMm,aNear:p.aToB.withinQuarterMm,bNear:p.bToA.withinQuarterMm})),admitted:false},null,2));
