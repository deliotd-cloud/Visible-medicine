import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {build} from './workspace-test-build.mjs';
const result=await build({stdin:{contents:"export * from 'three'; export * from './lib/tissue-picking'; export * from './lib/inspection-geometry';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const a=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
const {Mesh,MeshBasicMaterial,Raycaster,Vector3,DoubleSide,FrontSide,BackSide,BoxGeometry,Plane}=a;
const queue=[]; const cache=a.createTissuePickingCache(fn=>{const task={fn,active:true};queue.push(task);return()=>task.active=false;});
const flush=()=>{for(const t of queue.splice(0))if(t.active)t.fn();};
const digest=g=>createHash('sha256').update(Buffer.from(g.index.array.buffer,g.index.array.byteOffset,g.index.array.byteLength)).update(Buffer.from(g.attributes.position.array.buffer,g.attributes.position.array.byteOffset,g.attributes.position.array.byteLength)).update(Buffer.from(g.attributes.normal.array.buffer,g.attributes.normal.array.byteOffset,g.attributes.normal.array.byteLength)).digest('hex');
let comparisons=0,nativeMs=0,acceleratedMs=0;
function compare(mesh,ray){
 const expected=[],actual=[];
 let t=performance.now();Mesh.prototype.raycast.call(mesh,ray,expected);nativeMs+=performance.now()-t;
 t=performance.now();cache.raycast(mesh,ray,actual);acceleratedMs+=performance.now()-t;
 const sort=xs=>xs.sort((x,y)=>x.distance-y.distance||x.faceIndex-y.faceIndex);sort(expected);sort(actual);
 assert.equal(actual.length,expected.length);
 for(let i=0;i<actual.length;i++){
  assert.equal(actual[i].object,mesh);assert.equal(actual[i].faceIndex,expected[i].faceIndex);
  assert(Math.abs(actual[i].distance-expected[i].distance)<1e-6);
  assert(actual[i].point.distanceTo(expected[i].point)<1e-6);
  assert.deepEqual(actual[i].face,expected[i].face);
  if(expected[i].normal)assert(actual[i].normal.distanceTo(expected[i].normal)<1e-6);
 }
 comparisons++;
}
const cube=new BoxGeometry(1,1,1,20,20,20);cube.clearGroups();cube.deleteAttribute('uv');
const original=digest(cube),release=cache.retain(cube),release2=cache.retain(cube);
assert.equal(cache.stats().prepared,0);flush();assert.equal(cache.stats().prepared,1);
const mesh=new Mesh(cube,new MeshBasicMaterial({side:DoubleSide}));
mesh.position.set(1,2,-3);mesh.scale.set(-2,0.7,1.4);mesh.rotation.set(.2,.5,.3);mesh.updateMatrixWorld(true);
const target=new Vector3(0,0,0).applyMatrix4(mesh.matrixWorld);
for(const side of [DoubleSide,FrontSide,BackSide])for(const axis of [0,1,2])for(const sign of [-1,1]){
 mesh.material.side=side;const origin=target.clone().setComponent(axis,target.getComponent(axis)+sign*5);
 const ray=new Raycaster(origin,target.clone().sub(origin).normalize(),0,10);ray.firstHitOnly=true;compare(mesh,ray);
 ray.near=4.8;ray.far=5.4;compare(mesh,ray);
}
release();assert.equal(cache.stats().prepared,1);release2();release2();assert.equal(cache.stats().ownedBytes,0);
const cancel=cache.retain(cube);cancel();flush();assert.equal(cache.stats().entries,0);
const dispose=cache.retain(cube);flush();cube.dispose();assert.equal(cache.stats().ownedBytes,0);dispose();
const mutation=cache.retain(cube);flush();cube.index.needsUpdate=true;compare(mesh,new Raycaster(new Vector3(1,2,3),new Vector3(0,0,-1)));mutation();
assert.equal(digest(cube),original,'Source attributes and original index order unchanged');
const tiny=a.createTissuePickingCache(fn=>{fn();return()=>{};},1);const deny=tiny.retain(cube);assert.equal(tiny.stats().prepared,0);deny();
const unsupported=new BoxGeometry();const skip=cache.retain(unsupported);flush();assert.equal(cache.stats().entries,0);skip();
// A late dense muscle must displace a smaller prepared tree within the same cap.
const sync=fn=>{fn();return()=>{};};
const sizing=a.createTissuePickingCache(sync);const sized=sizing.retain(cube);const largeBytes=sizing.stats().ownedBytes;sized();
const small=new BoxGeometry(1,1,1,10,10,10);small.clearGroups();small.deleteAttribute('uv');
const bounded=a.createTissuePickingCache(sync,largeBytes);
const smallRelease=bounded.retain(small);assert.equal(bounded.stats().prepared,1);
const largeRelease=bounded.retain(cube);assert.equal(bounded.stats().prepared,1);assert.equal(bounded.stats().ownedBytes,largeBytes);
const smallMesh=new Mesh(small,new MeshBasicMaterial({side:DoubleSide}));smallMesh.updateMatrixWorld();
const fallback=[],reference=[],budgetRay=new Raycaster(new Vector3(.123,.234,3),new Vector3(0,0,-1));
bounded.raycast(smallMesh,budgetRay,fallback);Mesh.prototype.raycast.call(smallMesh,budgetRay,reference);
assert.deepEqual(fallback,reference,'Evicted metadata retains exact native picking');
largeRelease();smallRelease();assert.equal(bounded.stats().ownedBytes,0);small.dispose();smallMesh.material.dispose();

// Existing shader clipping must still see the deeper hit when firstHitOnly is set.
const unretain=a.tissuePicking.retain(cube);await new Promise(r=>setTimeout(r,30));
assert.equal(a.tissuePicking.stats().prepared,1);
const clipped=new Mesh(cube,new MeshBasicMaterial({side:DoubleSide}));clipped.material.clippingPlanes=[new Plane(new Vector3(0,0,-1),0)];clipped.updateMatrixWorld();
const ray=new Raycaster(new Vector3(.123,.234,3),new Vector3(0,0,-1));ray.firstHitOnly=true;
const kept=[];a.clippedMeshRaycast.call(clipped,ray,kept);assert(kept.length>0&&kept.every(h=>h.point.z<=0));
clipped.material.opacity=.1;const transparent=[];a.clippedMeshRaycast.call(clipped,ray,transparent);assert.equal(transparent.length,0);unretain();

const catalog=JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json'));
let sourceMeshes=0,preparedMeshes=0,peakBytes=0,buildMs=0;
for(const bundle of catalog.bundles){
 const structures=catalog.structures.filter(s=>s.bundle===bundle.id&&s.system==='muscles');if(!structures.length)continue;
 const bytes=await readFile('public'+bundle.url.split('?')[0]);assert.equal(createHash('sha256').update(bytes).digest('hex'),bundle.sha256);
 const {scene}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 const releases=[];
 for(const structure of structures){
  const geometry=scene.getObjectByName(structure.nodeName)?.geometry;assert(geometry);
  const before=digest(geometry);releases.push(cache.retain(geometry));
  const t=performance.now();flush();buildMs+=performance.now()-t;
  geometry.computeBoundingBox();const center=geometry.boundingBox.getCenter(new Vector3());
  const radius=geometry.boundingBox.getSize(new Vector3()).length()+1;
  const actual=new Mesh(geometry,new MeshBasicMaterial({side:DoubleSide}));actual.position.set(.4,-.3,.2);actual.scale.set(1.1,.9,1.2);actual.updateMatrixWorld(true);
  center.applyMatrix4(actual.matrixWorld);
  for(const axis of [0,1,2])for(const sign of [-1,1]){
   const origin=center.clone().setComponent(axis,center.getComponent(axis)+sign*radius);
   compare(actual,new Raycaster(origin,center.clone().sub(origin).normalize()));
  }
  assert.equal(digest(geometry),before);actual.material.dispose();sourceMeshes++;
 }
 preparedMeshes+=cache.stats().prepared;peakBytes=Math.max(peakBytes,cache.stats().ownedBytes);
 for(const release of releases)release();assert.equal(cache.stats().ownedBytes,0);
 scene.traverse(o=>{if(o.isMesh){o.geometry.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material.dispose();}});
}
assert(sourceMeshes>300&&preparedMeshes>0);
const report={passed:true,comparisons,sourceMeshes,preparedMeshes,peakBundleAccelerationBytes:peakBytes,buildMs,nativeMs,acceleratedMs,sourceArraysUnchanged:true,scope:'CPU native-hit equivalence, not GPU/FPS/physical-device acceptance; timing includes synthetic fixture and source rays, not a randomized benchmark'};
await writeFile('.local/tissue-picking-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
