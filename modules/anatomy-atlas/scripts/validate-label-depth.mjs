import assert from 'node:assert/strict';
import { Scene, Group, Mesh, BoxGeometry, MeshStandardMaterial, DoubleSide, Vector3, Plane, PerspectiveCamera, OrthographicCamera } from 'three';
import { createLabelDepthProbe, labelDepthSurface } from '../lib/label-depth.ts';
import { createBodyBatch } from '../lib/body-batching.ts';
const probe = createLabelDepthProbe(), scene = new Scene(), own = new Group();
scene.add(own);
const anchor = new Vector3(), geometry = new BoxGeometry(1,1,1);
// Batching accepts ungrouped, complete, indexed source surfaces.
geometry.clearGroups();
geometry.deleteAttribute('uv');
const tissue = () => {
  const mesh = new Mesh(geometry, new MeshStandardMaterial({side:DoubleSide}));
  mesh.userData = {...labelDepthSurface}; return mesh;
};
const cover = tissue(); cover.position.z=2; scene.add(cover);
let checks=0;
for (const camera of [new PerspectiveCamera(50,1,.1,100),new OrthographicCamera(-5,5,5,-5,.1,100)]) {
  camera.position.set(0,0,10);camera.lookAt(0,0,0);camera.updateMatrixWorld();
  const expect = (value,why) => {scene.updateMatrixWorld(true);assert.equal(probe(scene,camera,anchor,own),value,why);checks++;};
  expect('covered','opaque triangle before the anchor');
  cover.position.x=3;expect('uncovered','off-ray triangle');cover.position.x=0;
  cover.position.z=-2;expect('uncovered','tissue behind anchor');cover.position.z=2;
  cover.material.opacity=.9;expect('uncovered','faded tissue');cover.material.opacity=1;
  cover.material.transparent=true;expect('uncovered','transparent pass');cover.material.transparent=false;
  cover.material.visible=false;expect('uncovered','hidden material');cover.material.visible=true;
  cover.material.depthWrite=false;expect('uncovered','non-depth guide');cover.material.depthWrite=true;
  cover.userData={};expect('uncovered','untagged contour/guide');cover.userData={...labelDepthSurface};
  cover.material.clippingPlanes=[new Plane(new Vector3(1,0,0),-1)];expect('uncovered','shader-clipped triangles');cover.material.clippingPlanes=[];
  const hidden=new Group();scene.add(hidden);hidden.add(cover);hidden.visible=false;expect('uncovered','hidden ancestor');hidden.visible=true;
  hidden.position.x=3;expect('uncovered','exploded ancestor');hidden.position.x=0;scene.add(cover);scene.remove(hidden);
  own.add(cover);expect('uncovered','exclude own surface subtree');scene.add(cover);
  cover.layers.set(1);expect('uncovered','camera layers');cover.layers.set(0);
  camera.position.z=-10;camera.lookAt(0,0,0);camera.updateMatrixWorld();expect('uncovered','opposite view');
  camera.position.z=10;camera.lookAt(0,0,0);camera.updateMatrixWorld();
  const original=cover.raycast;cover.raycast=()=>{throw Error('fixture');};expect('unknown','failure is not coverage');cover.raycast=original;
  cover.visible=false;
  const sources=Array.from({length:8},(_,i)=>({id:String(i),geometry}));
  const batch=createBodyBatch(sources);assert(batch);scene.add(batch.mesh);
  const display=sources.map((s,i)=>({...s,color:'#ffffff',position:new Vector3(i*3,0,2),selected:false,faded:false,opacity:1,interactive:false}));
  batch.update(display,false);expect('covered','non-pickable opaque batch context');
  batch.update(display.map(s=>({...s,selected:true})),false);expect('uncovered','hidden selected batch instances');
  batch.update(display,true);expect('uncovered','cut batches disabled');
  batch.update(display.map(s=>({...s,opacity:.5})),false);expect('uncovered','transparent batch instances disabled');
  scene.remove(batch.mesh);batch.dispose();cover.visible=true;
}
console.log(JSON.stringify({passed:true,checks,scope:'Actual Three.js triangle intersections, two camera types; not GPU or clinical acceptance'}));
