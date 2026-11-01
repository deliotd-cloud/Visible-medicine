import fs from 'node:fs';import assert from 'node:assert/strict';import test from 'node:test';
import {createRequire} from 'node:module';import {runInNewContext} from 'node:vm';import {pathToFileURL,fileURLToPath} from 'node:url';import path from 'node:path';
const own=fileURLToPath(new URL('..',import.meta.url));
const native=process.env.VM_PROSTATE_ORIENTATION_DEPENDENCIES??own;
const require=createRequire(pathToFileURL(native+'/package.json'));
const {build}=require('esbuild'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const {Quaternion,Matrix4,Vector3}=require('three');
const compiled=await build({entryPoints:[path.join(own,'app/prostate-orientation.tsx')],bundle:true,write:false,format:'cjs',platform:'node',packages:'external',jsx:'automatic',metafile:true});
assert.deepEqual(Object.keys(compiled.metafile.inputs).map(p=>path.resolve(p).replaceAll('\\','/')).sort(),['app/prostate-orientation.tsx','lib/prostate-orientation.ts'].map(p=>path.join(own,p).replaceAll('\\','/')).sort());
function harness(){
 let ref,initialised=false,state,effect,cleanup,dependency;
 const frames=[];
 const hooks={...React,useRef(initial){return ref??=( {current:initial} );},useState(initial){if(!initialised){state=typeof initial==='function'?initial():initial;initialised=true;}return[state,value=>{state=value;}];},useEffect(setup,deps){if(dependency!==deps[0]){effect=setup;dependency=deps[0];}}};
 const module={exports:{}};
 runInNewContext(compiled.outputFiles[0].text,{module,exports:module.exports,require:name=>name==='react'?hooks:name==='@react-three/fiber'?{useFrame:callback=>frames.push(callback)}:require(name)});
 return {api:module.exports,frame(q){assert.equal(frames.length,1);frames[0]({camera:{quaternion:q}});},flush(){if(effect){cleanup=effect();effect=null;}},cleanup(){cleanup?.();},state:()=>state};
}
const identity={x:0,y:0,z:0,w:1};
const channel=()=>({current:{markers:null,publish:null}});
const eye=(p,up=[0,1,0])=>new Quaternion().setFromRotationMatrix(new Matrix4().lookAt(new Vector3(...p),new Vector3(),new Vector3(...up)));

test('first camera frame is retained until the DOM compass subscribes',()=>{
 const h=harness(),c=channel();h.api.ProstateOrientationReporter({channel:c});h.frame(identity);assert(c.current.markers.length>=4);
 const view=h.api.ProstateOrientationCompass({channel:c});h.flush();assert.equal(h.state(),c.current.markers);
 const html=renderToStaticMarkup(view);assert.match(html,/Schematic anatomical directions/);assert.match(html,/Right points left/);assert.match(html,/Left points right/);assert.doesNotMatch(html,/aria-live|tabindex/i);
});
test('camera frames publish changing directions without waking the parent study',()=>{
 const h=harness(),c=channel();h.api.ProstateOrientationReporter({channel:c});h.api.ProstateOrientationCompass({channel:c});h.flush();
 let updates=0;const receive=c.current.publish;c.current.publish=value=>{updates++;receive(value);};
 h.frame(identity);h.frame(identity);assert.equal(updates,1);
 h.frame(eye([0,.1,-3.4]));assert.equal(updates,2);assert(h.state().find(x=>x.label==='R').x>42);assert(h.state().find(x=>x.label==='L').x<42);
});
test('preset sweep frames and rolled cameras keep the live marker state finite',()=>{
 const h=harness(),c=channel();h.api.ProstateOrientationReporter({channel:c});h.api.ProstateOrientationCompass({channel:c});h.flush();
 const start=eye([1.5,2.3,2.1]),end=eye([0,-3.2,.01],[0,0,1]);
 for(let step=0;step<=60;step++){h.frame(start.clone().slerp(end,step/60));assert(h.state().length>=3);assert(h.state().every(m=>[m.x,m.y,m.depth].every(Number.isFinite)));}
 const markers=h.state();assert(markers.find(m=>m.label==='A').y<42);assert(markers.find(m=>m.label==='P').y>42);
});
test('invalid orientation removes the compass rather than leaving stale directions',()=>{
 const h=harness(),c=channel();h.api.ProstateOrientationReporter({channel:c});h.frame(identity);h.api.ProstateOrientationCompass({channel:c});h.flush();h.frame({x:NaN,y:0,z:0,w:1});
 assert.equal(h.state(),null);assert.equal(c.current.markers,null);assert.equal(h.api.ProstateOrientationCompass({channel:c}),null);
});
test('settled axial markers can hide the compact compass without losing updates',()=>{
 const h=harness(),c=channel();h.api.ProstateOrientationReporter({channel:c});h.frame(identity);assert.equal(h.api.ProstateOrientationCompass({channel:c,hidden:true}),null);h.flush();
 h.frame(eye([.7,-2.6,1.2],[.8,0,.6]));const visible=h.api.ProstateOrientationCompass({channel:c,hidden:false});assert(visible);assert.equal(visible.props.role,'img');assert.match(renderToStaticMarkup(visible),/focusable="false"/);
});
test('unmount clears only its own subscription',()=>{
 const h=harness(),c=channel();h.api.ProstateOrientationCompass({channel:c});h.flush();assert.equal(typeof c.current.publish,'function');h.cleanup();assert.equal(c.current.publish,null);
 const newer=()=>{};c.current.publish=newer;h.cleanup();assert.equal(c.current.publish,newer);
});
test('source revision inputs include both new orientation files',async()=>{
 const {prostatePinInputs}=await import('./pin-prostate-zones.mjs');
 assert(prostatePinInputs.includes('app/prostate-orientation.tsx'));assert(prostatePinInputs.includes('lib/prostate-orientation.ts'));
 const css=fs.readFileSync(path.join(own,'app/prostate-zones.css'),'utf8');assert.match(css,/\.prostate-zones-compass\s*\{[^}]*pointer-events:\s*none/);
 const study=fs.readFileSync(path.join(own,'app/prostate-zones.tsx'),'utf8');assert(study.includes('hidden={view === \'axial\' && presetValid}'));
});
