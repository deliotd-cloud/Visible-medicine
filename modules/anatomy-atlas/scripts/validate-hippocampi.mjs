import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {Matrix4,Vector3} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OBJLoader} from 'three/addons/loaders/OBJLoader.js';
import {build} from './workspace-test-build.mjs';
import {loadCurrentSourceHolds} from './current-source-holds.mjs';
import {sourceObjShape} from './source-surface-audit.mjs';
import {sourceTopology} from './source-topology.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
const json=async p=>JSON.parse(await readFile(p));
const basePath='public/models/bodyparts3d/cerebral/catalog.json';
const base=await json(basePath),added=await json('public/models/bodyparts3d/hippocampi/catalog.json');
const oldRef='b5447ec5a14f32670ddc591918997b14b62974b7';
assert.equal(hash(await readFile(basePath)),added.baseCatalogSha256);
assert.deepEqual(await readFile(basePath),execFileSync('git',['show',oldRef+':'+basePath]));
for(const b of base.bundles)assert.equal(hash(await readFile('public'+new URL(b.url,'https://local.invalid').pathname)),b.sha256);
const compiled=await build({stdin:{contents:"export * from './lib/hippocampi'; export * from './lib/cerebral'; export * from './lib/nested-anatomy'; export * from './lib/nested-teaching'; export * from './lib/nested-review-material'; export * from './integration/head-neck/delivery';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const view=api.cerebralCatalog,layers=api.cerebralFor(base.parent);
assert.equal(layers.length,16);assert.equal(view.structures.length,18);
assert.deepEqual(view.structures.slice(0,base.structures.length),base.structures);
assert.deepEqual(view.bundles.slice(0,base.bundles.length),base.bundles);
assert.deepEqual(view.contextIds,base.contextIds);
assert.equal(new Set(view.structures.map(s=>s.id)).size,18);
const presets=api.cerebralPresets(layers);
assert.deepEqual(presets.hippocampi,added.selectableIds);
assert.equal(presets['medial-temporal'].length,4);
for(const field of ['parent','coordinateSystem','structures','bundles','selectableIds','license','sourceVersion']){
  const stale=structuredClone(base);stale[field]=field==='license'?'other':field==='sourceVersion'?'5.0':Array.isArray(stale[field])?[]:{};
  assert.equal(api.withHippocampi(stale),stale,'Fail closed for stale '+field);
}
const {catalog,records,policy}=await loadCurrentSourceHolds();
const bundle=added.bundles[0],bytes=await readFile('public'+new URL(bundle.url,'https://local.invalid').pathname);
assert.equal(hash(bytes),bundle.sha256);assert.equal(bytes.length,bundle.bytes);
const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.length),'');
const meshes=[];gltf.scene.traverse(m=>{if(m.isMesh)meshes.push(m);});assert.equal(meshes.length,2);
const matrix=new Matrix4().fromArray(base.coordinateSystem.sourceToSceneColumnMajor);
// Oriented cyclic triangle keys retain winding and multiplicity at scene 1e-5.
const bag=(g,result=new Map())=>{
  const p=g.getAttribute('position'),ix=g.index,count=ix?ix.count:p.count;
  for(let i=0;i<count;i+=3){
    const vertices=[0,1,2].map(j=>{const n=ix?ix.getX(i+j):i+j;return [p.getX(n),p.getY(n),p.getZ(n)].map(v=>Math.round(v*1e5)).join(',');});
    const key=[0,1,2].map(j=>[...vertices.slice(j),...vertices.slice(0,j)].join('|')).sort()[0];
    result.set(key,(result.get(key)||0)+1);
  }return result;
};
const oldBundle=base.bundles.find(b=>b.id==='cerebral');
const oldBytes=await readFile('public'+new URL(oldBundle.url,'https://local.invalid').pathname);
const oldGLTF=await new GLTFLoader().parseAsync(oldBytes.buffer.slice(oldBytes.byteOffset,oldBytes.byteOffset+oldBytes.length),'');
const oldTriangles=new Map();oldGLTF.scene.traverse(m=>{if(m.isMesh)bag(m.geometry,oldTriangles);});
let triangles=0;
for(const s of added.structures){
  const def=records.find(r=>r.tree===s.sourceTree&&r.id===s.fmaId);policy.assertNoKnownHolds([def]);
  assert.equal(def.name,s.sourceName);assert.deepEqual(def.files,s.sources.map(f=>f.file));
  assert.deepEqual(s.sources,s.sources.map(f=>base.parent.sources.find(p=>p.file===f.file)));
  assert.deepEqual(s.validation,{status:'unvalidated',anatomicalReview:false});
  const raw=await readFile('../work/bodyparts3d/partof/'+s.sources[0].file+'.obj');
  assert.equal(hash(raw),s.sources[0].sha256);
  const topology=sourceTopology(sourceObjShape(raw));
  assert.deepEqual(topology,added.sourceReports.find(r=>r.file===s.sources[0].file).topology);
  assert(topology.closedOrientedManifold);assert.equal(topology.components.length,1);triangles+=topology.triangles;
  const original=new Map();new OBJLoader().parse(raw.toString()).traverse(m=>{if(m.isMesh)bag(m.geometry.clone().applyMatrix4(matrix),original);});
  const mesh=meshes.find(m=>m.name===s.nodeName),actual=bag(mesh.geometry);
  assert.deepEqual(actual,original,'All source triangles and winding retained');
  assert.equal([...actual.keys()].filter(k=>oldTriangles.has(k)).length,0,'No duplicate faces against existing selectable cortex');
  assert.equal(mesh.userData.structureId,s.id);assert.equal(mesh.userData.studyParentId,base.parent.id);
  mesh.geometry.computeBoundingBox();const box=mesh.geometry.boundingBox;
  assert.deepEqual(box.min.toArray(),s.bounds.min);assert.deepEqual(box.max.toArray(),s.bounds.max);
  assert.deepEqual(box.getCenter(new Vector3()).toArray(),s.center);
  assert(s.laterality==='left'?box.min.x>0:box.max.x<0);
  const p=mesh.geometry.getAttribute('position'),n=mesh.geometry.getAttribute('normal');let anchorFound=false;
  for(let i=0;i<p.count;i++){
    const vertex=[p.getX(i),p.getY(i),p.getZ(i)];
    assert([...vertex,n.getX(i),n.getY(i),n.getZ(i)].every(Number.isFinite));
    anchorFound ||= vertex.every((v,j)=>v===s.anchor[j]);
  }assert(anchorFound);
  assert.equal(api.nestedTeachingFor(base.parent,'cerebral',s)?.id,'cerebral-hippocampus','Use explicitly pinned hippocampal teaching, not root lessons');
  const target=api.nestedStudyTargets(catalog).find(t=>t.structureId===s.id);assert(target);
  assert.equal(target.sourceHash,bundle.sha256);
  const group=api.nestedReviewRows.find(g=>g.study==='cerebral');
  const packet=await api.nestedReviewMaterial(group.key,s.id);assert(packet);
  for(const topic of packet.teaching.topics)assert.equal(topic.readiness,['xray','ultrasound'].includes(topic.tab)?'pending':'draft');
  assert.equal(packet.context.blockers.teaching.length,0);assert(packet.context.blockers.imaging.length);
  assert.deepEqual(packet.source.structure,s);
}
assert.equal(triangles,2000);
const delivery=api.regionalWebsiteDelivery(catalog);
// The existing delivery function validates each nested child's unique bundle.
assert(JSON.stringify(delivery).includes(bundle.sha256));
const before=JSON.parse(execFileSync('git',['show',oldRef+':content/nested-review-bindings.json']));
const after=await json('content/nested-review-bindings.json');let preserved=0;
for(const g of before.groups)for(const selection of g.selections){
  assert.deepEqual(after.groups.find(n=>n.key===g.key).selections.find(s=>s.id===selection.id),selection);preserved++;
}
assert.equal(preserved,106);
console.log(JSON.stringify({passed:true,hippocampi:2,triangles,originalNestedSourceTokensPreserved:preserved,sourceAlignment:true,duplicateCorticalFaces:0,clinicalApproval:false}));
