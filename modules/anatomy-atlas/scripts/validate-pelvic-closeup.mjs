import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {BufferGeometry,Float32BufferAttribute} from 'three';
import {build} from './workspace-test-build.mjs';
import {readGlb} from './glb-lossless-codec.mjs';
import {hraAccessor,hraDigest} from './hra-pelvis-source.mjs';
const compile=async(contents,resolveDir=process.cwd())=>{
 const out=await build({stdin:{contents,resolveDir,loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
 return import('data:text/javascript;base64,'+Buffer.from(out.outputFiles[0].text).toString('base64'));
};
const api=await compile("export * from './lib/hra-pelvis';export * from './lib/hra-pelvis-teaching';export * from './lib/close-up-labels';");
const old=await compile(execFileSync('git',['show','62f6d61065f0ce58575b005b1760f3278a1fc1d3:lib/hra-pelvis.ts'],{encoding:'utf8'}),process.cwd()+'/lib');
const def=api.hraPelvisDefinition,box=def.closeUp,prior=old.hraPelvisDefinition;
assert.equal(prior.closeUp,null);
assert.deepEqual({...def,closeUp:null},prior,'Only camera extent changes, not sources, geometry or recipes');
const native=def.surfaces.slice(0,41);
for(let axis=0;axis<3;axis++){
 const min=Math.min(...native.map(s=>s.bounds.min[axis])),max=Math.max(...native.map(s=>s.bounds.max[axis]));
 const margin=(max-min)*.05;
 assert.equal(box.min[axis],min-margin);assert.equal(box.max[axis],max+margin);
 assert(Number.isFinite(box.min[axis])&&box.max[axis]>box.min[axis]);
}
const inside=p=>p.every((v,i)=>v>=box.min[i]&&v<=box.max[i]);
for(const surface of native){assert(inside(surface.bounds.min));assert(inside(surface.bounds.max));}
const bytes=await readFile('public/models/hra-renal/kidneys.glb');
assert.equal(hraDigest(bytes),'bd5d2affb912f135c8c8da7e7892fbc906ebae017ed7042e900646c2b6332cfc');
const glb=readGlb(bytes),anchors=[];
for(const surface of def.surfaces.slice(41)){
 const node=glb.json.nodes.find(n=>n.name===surface.nodeName);assert(node);
 const mesh=glb.json.meshes[node.mesh];assert.equal(mesh.primitives.length,1);
 const positions=hraAccessor(glb.json,glb.bin,mesh.primitives[0].attributes.POSITION);
 const geometry=new BufferGeometry().setAttribute('position',new Float32BufferAttribute(positions.flat(),3));
 const anchor=api.closeUpLabelAnchor(geometry,surface.anchor,box);
 assert(anchor&&inside(anchor));assert(positions.some(p=>p.every((v,i)=>v===anchor[i])),'Leader must end on actual source vertex');
 assert.deepEqual(api.closeUpLabelAnchor(geometry,surface.anchor,null),surface.anchor);
 assert(surface.bounds.max[1]>box.max[1],'Full ureter extends beyond the regional camera, without being cut');
 anchors.push({id:surface.id,anchor});geometry.dispose();
 const bad=structuredClone(def);bad.closeUp.max[1]+=1;
 assert.equal(api.hraPelvicTeaching(bad,surface),null,'Changed camera contract must invalidate source-bound lesson context');
}
console.log(JSON.stringify({onlyCameraBoundsChanged:true,nativeSurfacesEnclosed:41,studiesPreserved:11,sourceVertexAnchors:anchors,sourceGeometryUnchanged:true,clinicalApproval:false}));
