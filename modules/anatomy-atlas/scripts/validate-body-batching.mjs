import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { BoxGeometry, Color, Matrix4, Mesh, MeshStandardMaterial, DoubleSide, Raycaster, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { build } from './workspace-test-build.mjs';
import { createBodyBatch, bodyBatchSources, bodyBatchGeometryBytes, bodyBatchActive } from '../lib/body-batching.ts';
const compiled = await build({stdin:{contents:"export * from './lib/body-display-catalog';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const api = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const catalog = api.bodyDisplayCatalog(JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json')));
const digest = a => createHash('sha256').update(Buffer.from(a.buffer, a.byteOffset, a.byteLength)).digest('hex');
let geometries = 0, vertices = 0, indices = 0, batches = 0, sourceBytes = 0, batchedSurfaces = 0;
const scopes = ['whole-body','head-neck','shoulder-arm','forearm','hand','thorax','abdomen','pelvis','thigh','leg','foot','spine'];
const baseline = Object.fromEntries(scopes.map(r => [r, {surfaces:catalog.structures.filter(s => r === 'whole-body' || s.regions.includes(r)).length,batches:0,batchedSurfaces:0,geometryCopyBytes:0}]));
const inspect = geometry => ({p:digest(geometry.attributes.position.array),n:digest(geometry.attributes.normal.array),i:digest(geometry.index.array)});
for (const bundle of catalog.bundles) {
  const items = catalog.structures.filter(s => s.bundle === bundle.id && s.system !== 'muscles');
  if (items.length < 8) continue;
  const bytes = await readFile('public' + bundle.url.split('?')[0]);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),bundle.sha256);
  const {scene} = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  const sources = items.map(s=>({id:s.id,geometry:scene.getObjectByName(s.nodeName)?.geometry}));
  assert(sources.every(s=>s.geometry));
  const accepted = bodyBatchSources(sources), originals = new Map(accepted.map(s=>[s.id,inspect(s.geometry)]));
  const batch = createBodyBatch(sources);
  if (!accepted.length) {assert.equal(batch,null);continue;}
  assert(batch);
  assert.equal(batch.sourceCount,accepted.length);
  batches++; batchedSurfaces += accepted.length; sourceBytes += batch.ownedGeometryBytes;
  assert(batch.ownedGeometryBytes <= 16*1024*1024);
  for (const s of accepted) {
    const instance = batch.instances.get(s.id), range = batch.mesh.getGeometryRangeAt(batch.mesh.getGeometryIdAt(instance));
    const target = batch.mesh.geometry, p = s.geometry.attributes.position, n = s.geometry.attributes.normal;
    for(let i=0;i<p.count;i++) for(let axis=0;axis<3;axis++) {
      assert.equal(target.attributes.position.getComponent(range.vertexStart+i,axis),p.getComponent(i,axis));
      assert.equal(target.attributes.normal.getComponent(range.vertexStart+i,axis),n.getComponent(i,axis));
    }
    for(let i=0;i<s.geometry.index.count;i++) assert.equal(target.index.getX(range.indexStart+i)-range.vertexStart,s.geometry.index.getX(i));
    geometries++;vertices+=p.count;indices+=s.geometry.index.count;
  }
  const display = accepted.map((s,i)=>({id:s.id,color:i%2?'#e3bb78':'#bc4040',position:new Vector3(i/100,0.2,-0.1),selected:false,faded:false,opacity:1,interactive:true}));
  assert.equal(batch.update(display,false).size,accepted.length);
  for(const s of display) {
    const id=batch.instances.get(s.id);
    assert.equal(batch.identity(id),s.id);
    assert(batch.mesh.getVisibleAt(id));
    const actual=batch.mesh.getMatrixAt(id,new Matrix4()), expected=new Matrix4().makeTranslation(s.position);
    actual.elements.forEach((v,i)=>assert(Math.abs(v-expected.elements[i])<1e-6));
    const a=batch.mesh.getColorAt(id,new Color()), e=new Color(s.color);
    assert(a.toArray().every((v,i)=>Math.abs(v-e.toArray()[i])<1e-7));
  }
  for(const r of scopes) if(baseline[r].surfaces>=150) {
    const active=accepted.filter(s=>r==='whole-body'||catalog.structures.find(i=>i.id===s.id).regions.includes(r));
    if(active.length) {baseline[r].batches++;baseline[r].batchedSurfaces+=active.length;baseline[r].geometryCopyBytes+=batch.ownedGeometryBytes;}
  }
  assert.equal(batch.update(display,true).size,0,'Any cut restores individual clipped surfaces');
  for(const change of [{selected:true},{faded:true},{opacity:0.99},{opacity:0},{position:new Vector3(NaN,0,0)}]) {
    const altered=display.map(s=>({...s,...change}));
    assert.equal(batch.update(altered,false).size,0);
  }
  assert.equal(batch.update(display.map(s=>({...s,interactive:false})),false).size,display.length);
  assert.equal(batch.identity(0),null,'Nonselectable context is never a pointer target');
  assert.equal(batch.update(display.slice(1),false).size,display.length-1);
  assert.equal(batch.identity(batch.instances.get(display[0].id)),null,'Removed instance cannot be selected');
  assert.equal(batch.update(display,false).size,display.length,'Undo restores the same stable identities');
  let disposed=0;batch.mesh.geometry.addEventListener('dispose',()=>disposed++);
  batch.dispose();batch.dispose();assert.equal(disposed,1);
  assert.equal(batch.update(display,false).size,0);
  for(const s of accepted) assert.deepEqual(inspect(s.geometry),originals.get(s.id),'Cached originals are unchanged');
  scene.traverse(o=>{if(o instanceof Mesh){o.geometry.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material.dispose();}});
}
// Real Three raycasts: index-stable identities, displaced instances and context pass-through.
const cube=new BoxGeometry();cube.clearGroups();cube.deleteAttribute('uv');
const sources=Array.from({length:8},(_,i)=>({id:'box-'+i,geometry:cube}));
const batch=createBodyBatch(sources);assert(batch);
const display=sources.map((s,i)=>({id:s.id,color:'#bc4040',position:new Vector3(i*2,0,0),selected:false,faded:false,opacity:1,interactive:true}));
batch.update(display,false);batch.mesh.updateMatrixWorld(true);
const ray=new Raycaster(new Vector3(6,0,5),new Vector3(0,0,-1));
const hits=ray.intersectObject(batch.mesh,false);assert(hits.length);assert(hits.every(h=>h.batchId===3&&h.instanceId===3&&batch.identity(h.batchId)==='box-3'));
const regular=new Mesh(cube,new MeshStandardMaterial({side:DoubleSide}));regular.position.copy(display[3].position);regular.updateMatrixWorld(true);
const expectedHits=ray.intersectObject(regular,false);assert.deepEqual(hits.map(h=>[h.distance,h.point.toArray()]),expectedHits.map(h=>[h.distance,h.point.toArray()]));
display[3].interactive=false;batch.update(display,false);assert.equal(ray.intersectObject(batch.mesh,false).length,0);
display[3].interactive=true;display[3].position.set(40,0,0);batch.update(display,false);assert.equal(ray.intersectObject(batch.mesh,false).length,0);
ray.ray.origin.x=40;assert(ray.intersectObject(batch.mesh,false).length);
display[3].selected=true;batch.update(display,false);assert.equal(ray.intersectObject(batch.mesh,false).length,0);
batch.dispose();cube.dispose();regular.material.dispose();
assert.equal(bodyBatchGeometryBytes(new BoxGeometry()),null,'Groups and extra attributes use legacy path');
assert.equal(bodyBatchSources(sources.slice(0,7)).length,0);
assert.equal(bodyBatchSources([...sources,sources[0]]).length,0);
assert.equal(bodyBatchActive({...display[0],opacity:NaN},false),false);
for(const value of Object.values(baseline)) value.submissions=value.surfaces-value.batchedSurfaces+value.batches;
const report={passed:true,geometries,vertices,indices,retainedTriangles:indices/3,batches,batchedSurfaces,geometryCopyBytes:sourceBytes,baseline,measurement:'CPU geometry/submission model; not measured GPU draw calls, FPS or browser acceptance'};
if(process.argv.includes('--write-report')) await writeFile('docs/body-batching-baseline.json',JSON.stringify(report,null,2)+'\n');
if(process.argv.includes('--check-report')) assert.deepEqual(report,JSON.parse(await readFile('docs/body-batching-baseline.json')));
console.log(JSON.stringify(report,null,2));
