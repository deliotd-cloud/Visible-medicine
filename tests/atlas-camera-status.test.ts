import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {build} from 'esbuild';

const sha=(bytes: Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
const revision='5acfa46b7fcef876fc2f55f8ed122de46b29bb03';
test('camera status is imported from one source revision without changing models or access',()=>{
 const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 assert.equal(review.revision,revision);
 for(const path of ['app/body-scene.tsx','app/scene-orientation.tsx']){
  const file=review.files.find((f:{path:string})=>f.path===path);assert(file);
  assert.equal(sha(readFileSync('atlas-review/'+path)),file.importedSha256);
 }
 for(const name of ['head-neck','shoulder','female-pelvis','lower-limb']){
  const base='public/atlas-runtime/'+name+'/';
  const manifest=JSON.parse(readFileSync(base+'manifest.json','utf8'));
  assert.equal(manifest.sourceCommit,revision);assert.equal(manifest.patientDataIncluded,false);
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));
  const prior=JSON.parse(readFileSync('lib/atlas-model-inventory.json','utf8'));
  assert(prior.models.length>0);
  if(name==='head-neck')for(const path of ['app/body-scene.tsx','app/scene-orientation.tsx']){
   const input=inputs.find((f:{path:string})=>f.path===path);assert(input);
   assert.equal(input.sha256,review.files.find((f:{path:string})=>f.path===path).sourceSha256);
  }
 }
 assert.match(readFileSync('lib/atlas-delivery-policy.ts','utf8'),/audience: 'administrator-review'/);
});

test('actual imported observer replaces stale keyboard status and avoids duplicate writes',async()=>{
 const require=createRequire(import.meta.url),React=require('react');
 const {PerspectiveCamera,Vector3}=require('three');
 const compiled=await build({stdin:{contents:"export {SceneOrientation} from './atlas-review/app/scene-orientation';",resolveDir:process.cwd(),loader:'tsx'},bundle:true,platform:'node',format:'cjs',write:false,external:['react','@react-three/fiber','three']});
 let frame: (state:{camera:InstanceType<typeof PerspectiveCamera>})=>void;
 const module={exports:{} as {SceneOrientation:Function}};
 runInNewContext(compiled.outputFiles[0].text,{module,exports:module.exports,require:(id:string)=>id==='react'?{...React,useMemo:(fn:Function)=>fn(),useRef:(current:unknown)=>({current}),useLayoutEffect:(fn:Function)=>fn()}:id==='@react-three/fiber'?{useFrame:(fn:typeof frame)=>{frame=fn;},useThree:(select:Function)=>select({invalidate(){}})}:require(id)});
 let visual='',status='',writes=0;
 const output={current:{get textContent(){return visual;},set textContent(v:string){visual=v;}}};
 const statusOutput={current:{get textContent(){return status;},set textContent(v:string){status=v;writes++;}}};
 const keyboardCameraFrom={current:null as InstanceType<typeof Vector3>|null};
 const coordinates=JSON.parse(readFileSync('atlas-review/public/models/bodyparts3d/full-body/catalog.json','utf8')).coordinateSystem;
 module.exports.SceneOrientation({output,statusOutput,keyboardCameraFrom,coordinates,enabled:true});
 const camera=new PerspectiveCamera();camera.position.set(0,0,10);camera.lookAt(0,0,0);frame!({camera});
 keyboardCameraFrom.current=new Vector3(0,0,1);
 statusOutput.current.textContent='View from: front. Orbit angle: 10° around, 90° from above.';
 frame!({camera});assert.match(status,/Orbit angle/);
 camera.position.set(0,0,-10);camera.lookAt(0,0,0);frame!({camera});
 assert.equal(status,`View from: ${visual}.`);assert.doesNotMatch(status,/Orbit angle/);
 const settled=writes;frame!({camera});assert.equal(writes,settled);
});
