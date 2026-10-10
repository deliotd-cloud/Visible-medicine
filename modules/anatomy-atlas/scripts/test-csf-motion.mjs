import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {build} from 'esbuild';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const result=await build({stdin:{contents:`export * from './lib/csf-motion';export {ventricleCatalog} from './lib/ventricles';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,platform:'node',format:'esm',write:false});
const api=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
const data=JSON.parse(await readFile('content/csf-motion.v1.json','utf8'));
const info=api.csfMotionFor(api.ventricleCatalog.parent);assert(info);assert.equal(info.markerCount,160);
assert.equal(api.csfMotionFor({...api.ventricleCatalog.parent,name:'altered'}),null);
// A catalogue context is a real structure, but never one of the four CSF spaces.
async function mutatedApi(records){
  const mutated={...data,records};
  const result=await build({stdin:{contents:`export * from './lib/csf-motion';`,resolveDir:process.cwd(),loader:'ts'},
    bundle:true,platform:'node',format:'esm',write:false,plugins:[{name:'mutated-csf-records',setup(build){
      build.onLoad({filter:/[\\/]content[\\/]csf-motion\.v1\.json$/},()=>({contents:JSON.stringify(mutated),loader:'json'}));
    }}]});
  return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}
const context=api.ventricleCatalog.structures.find(s=>s.id===api.ventricleCatalog.contextIds[0]);assert(context);
const substituted=await mutatedApi([{...data.records[0],structure:context},...data.records.slice(1)]);
assert.equal(substituted.csfMotionFor(api.ventricleCatalog.parent),null);
assert.deepEqual(substituted.csfTracksFor(context,data.bundle.sha256),[]);
assert.deepEqual(substituted.csfTracksFor(data.records[1].structure,data.bundle.sha256),[]);
const reordered=await mutatedApi([data.records[1],data.records[0],...data.records.slice(2)]);
assert.equal(reordered.csfMotionFor(api.ventricleCatalog.parent),null);
assert.deepEqual(reordered.csfTracksFor(data.records[0].structure,data.bundle.sha256),[]);
const ordinary={requested:true,reducedMotion:false,pageHidden:false,ready:true,explode:0,cut:false,exam:false};
assert.equal(api.csfMotionAllowed(ordinary),true);
for(const delta of [{requested:false},{reducedMotion:true},{pageHidden:true},{ready:false},{explode:0.1},{cut:true},{exam:true}])
  assert.equal(api.csfMotionAllowed({...ordinary,...delta}),false);
const bytes=await readFile('public'+new URL(data.bundle.url,'https://local.invalid').pathname);
const {scene}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const ray=new THREE.Raycaster(),meshes=new Map();scene.traverse(m=>{if(m.isMesh)meshes.set(m.name,m);});
let checks=0;
for(const {structure,tracks} of data.records){
  assert.equal(tracks.length,40);assert.equal(api.csfTracksFor(structure,data.bundle.sha256).length,40);
  assert.deepEqual(api.csfTracksFor(structure,'foreign'),[]);assert.deepEqual(api.csfTracksFor({...structure,name:'foreign'},data.bundle.sha256),[]);
  const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
  const mesh=new THREE.Mesh(meshes.get(structure.nodeName).geometry,material);mesh.updateMatrixWorld(true);
  mesh.geometry.computeBoundingBox();const box=mesh.geometry.boundingBox;
  for(const t of tracks){
    assert(t.amplitude>0&&t.center.every(Number.isFinite)&&Number.isFinite(t.phase));
    for(const y of [t.center[1]-t.amplitude,t.center[1],t.center[1]+t.amplitude]){
      // Independent containment rays in all three axes, not merely a bounding box.
      for(const axis of [0,1,2]){
        const point=new THREE.Vector3(t.center[0],y,t.center[2]),origin=point.clone(),direction=new THREE.Vector3();
        origin.setComponent(axis,box.min.getComponent(axis)-1);direction.setComponent(axis,1);ray.set(origin,direction);
        const distance=point.getComponent(axis)-origin.getComponent(axis);
        const hits=ray.intersectObject(mesh,false).map(h=>h.distance).filter(h=>h<distance);
        const unique=hits.filter((h,i)=>!i||Math.abs(h-hits[i-1])>1e-7);
        assert.equal(unique.length%2,1,structure.name+' marker inside actual surface');checks++;
      }
    }
    for(let seconds=0;seconds<=8;seconds+=0.125){
      const y=api.csfMarkerY(t.center[1],t.amplitude,t.phase,seconds);
      assert(y>=t.center[1]-t.amplitude-1e-10&&y<=t.center[1]+t.amplitude+1e-10);
    }
    assert(Math.abs(api.csfMarkerY(t.center[1],t.amplitude,t.phase,0)-api.csfMarkerY(t.center[1],t.amplitude,t.phase,4))<1e-12);
  }
  material.dispose();
}
console.log(JSON.stringify({spaces:4,markers:160,independentContainmentRays:checks,reversible:true,policyGuards:7,clinicalValidation:false,fluidSimulation:false}));
