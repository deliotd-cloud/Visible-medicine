// Offline source screen only. Never publishes, modifies or admits a mesh.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {Matrix4,Quaternion,Vector3} from 'three';
import {readGlb} from './glb-lossless-codec.mjs';
import {hraSource,hraAccessor,hraDigest} from './hra-pelvis-source.mjs';
import {prepareShape} from './vessel-shape-math.mjs';
import {sourceTopology} from './source-topology.mjs';
import {sourceTriangleSet} from './source-surface-audit.mjs';
const directory=process.argv.find(a=>a.startsWith('--source='))?.slice(9)??'D:/VisibleMedicine-Atlas-Recovery/source-candidates/hra-united-female-v1.10';
const bytes=await readFile(directory+'/3d-vh-f-united.glb');
assert.equal(bytes.length,hraSource.bytes);assert.equal(hraDigest(bytes),hraSource.sha256);
const metadata=await readFile(directory+'/metadata.json'),crosswalk=await readFile(directory+'/crosswalk.csv');
assert.equal(hraDigest(metadata),hraSource.metadataSha256);assert.equal(hraDigest(crosswalk),hraSource.crosswalkSha256);
const {json:g,bin}=readGlb(bytes),parents=new Map();
g.nodes.forEach((n,i)=>(n.children??[]).forEach(c=>{assert(!parents.has(c));parents.set(c,i);}));
const expected=['Yao_afferent_lymphatic_vessel','Yao_capsule_of_lymph_node','Yao_follicles','Yao_efferent_lymph_node','Yao_medulla_of_lymph_node','Yao_paracortex','Yao_blood_vasculature'];
const roots=g.nodes.map((n,i)=>({n,i})).filter(({n})=>n.name==='Yao_lymph_node');assert.equal(roots.length,1);
const root=roots[0],descendants=[];
function descend(i,seen=new Set()) {assert(!seen.has(i),'Cyclic hierarchy');seen.add(i);const n=g.nodes[i];if(n.mesh!==undefined)descendants.push(i);for(const c of n.children??[])descend(c,seen);}
descend(root.i);assert.deepEqual(descendants.map(i=>g.nodes[i].name).sort(),[...expected].sort());
function matrix(i,seen=new Set()) {assert(!seen.has(i));seen.add(i);const n=g.nodes[i],m=n.matrix?new Matrix4().fromArray(n.matrix):new Matrix4().compose(new Vector3(...(n.translation??[0,0,0])),new Quaternion(...(n.rotation??[0,0,0,1])),new Vector3(...(n.scale??[1,1,1])));return parents.has(i)?matrix(parents.get(i),seen).multiply(m):m;}
const rows=[],triangleSets=new Map(),cw=crosswalk.toString().split(/\r?\n/);
for(const i of descendants){
 const n=g.nodes[i],mesh=g.meshes[n.mesh];assert.equal(mesh.primitives.length,1);
 const p=mesh.primitives[0];assert.equal(p.mode??4,4);assert(!p.targets&&n.skin===undefined,'No unsupported deformation');
 const m=matrix(i);assert(m.elements.every(Number.isFinite)&&m.determinant()>0);
 const raw=hraAccessor(g,bin,p.attributes.POSITION),indices=hraAccessor(g,bin,p.indices).flat();
 assert(indices.length%3===0&&indices.every(v=>Number.isInteger(v)&&v>=0&&v<raw.length));
 const vertices=raw.map(v=>new Vector3(...v).applyMatrix4(m).multiplyScalar(1000).toArray());
 const faces=Array.from({length:indices.length/3},(_,j)=>indices.slice(j*3,j*3+3)),shape=prepareShape(vertices,faces);
 const definitions=cw.filter(line=>line.startsWith(n.name+','));assert.equal(definitions.length,1);
 const [,ontologyId,label]=definitions[0].split(',');
 triangleSets.set(i,sourceTriangleSet(shape));
 rows.push({nodeIndex:i,nodeName:n.name,meshIndex:n.mesh,metadata:n.extras??null,crosswalk:{ontologyId,label,originalRow:definitions[0]},worldMatrix:m.toArray(),triangles:faces.length,sourceVertices:raw.length,
  worldBoundsMm:{min:shape.min,max:shape.max},indexAccessorSha256:hraDigest(JSON.stringify(hraAccessor(g,bin,p.indices))),
  attributeAccessorSha256:Object.fromEntries(Object.entries(p.attributes).map(([k,index])=>[k,hraDigest(JSON.stringify(hraAccessor(g,bin,index)))])),
  originalMaterial:g.materials?.[p.material]??null,topology:sourceTopology(shape)});
}
const shared=[];for(let a=0;a<rows.length;a++)for(const b of rows.slice(a+1)){
 const first=rows[a],set=triangleSets.get(b.nodeIndex),count=[...triangleSets.get(first.nodeIndex)].filter(t=>set.has(t)).length;
 shared.push({a:first.nodeName,b:b.nodeName,exactSharedTriangles:count});
}
const report={sourceUrl:hraSource.url,sourceSha256:hraDigest(bytes),sourceBytes:bytes.length,metadataSha256:hraDigest(metadata),crosswalkSha256:hraDigest(crosswalk),
 sourceGroup:{nodeIndex:root.i,nodeName:root.n.name,metadata:root.n.extras??null},rows,shared,
 identityCautions:['The assembly title and mesenteric placement do not establish a female-donor or patient-derived lymph node.','Yao_blood_vasculature has a blood-named node but a Lymph vasculature crosswalk label; preserve both without silently choosing one.','Yao_efferent_lymph_node maps to an efferent vessel; preserve source node name separately from teaching terminology.'],
 admitted:false,clinicalApproval:false,patientRegistration:false,sourceGeometryChanged:false};
const text=JSON.stringify(report,null,2)+'\n',path='docs/hra-lymph-node-source-audit.json';
if(process.argv.includes('--check'))assert.equal(await readFile(path,'utf8'),text,'Source screen must reproduce exactly');
else {assert(process.argv.includes('--record'),'Choose --check or --record');await writeFile(path,text,{flag:'wx'});}
console.log(JSON.stringify({sourceSha256:report.sourceSha256,rows:rows.map(r=>({name:r.nodeName,triangles:r.triangles,bounds:r.worldBoundsMm,topology:r.topology})),shared,admitted:false},null,2));
