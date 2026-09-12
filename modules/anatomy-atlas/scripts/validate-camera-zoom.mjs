import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { readFile } from 'node:fs/promises';
import { build } from './workspace-component-test-build.mjs';
const require = createRequire(import.meta.url), three = require('three');
const compiled = await build({stdin:{contents:"export { FittedCamera } from './app/fitted-camera'; export { steppedCameraScale } from './lib/camera-zoom'; export * from './lib/study-camera';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'cjs'});
let checks=0;
const close=(a,b,label)=>{ checks++; assert(Math.abs(a-b)<1e-8,label+': '+a+' / '+b); };
const same=(a,b,label)=>{ checks++; assert.deepEqual(a,b,label); };
function harness(orthographic=false) {
  const camera=orthographic ? new three.OrthographicCamera() : new three.PerspectiveCamera(38,1.5,.01,150);
  const size={width:900,height:600}, controls={target:new three.Vector3(),update(){camera.updateMatrixWorld();}};
  let index=0,effects=[]; const refs=[],mod={exports:{}};
  runInNewContext(compiled.outputFiles[0].text,{module:mod,exports:mod.exports,require(name){
    if(name==='react')return {useRef(value){return refs[index++]??(refs[index-1]={current:value});},useCallback:fn=>fn,useEffect:fn=>effects.push(fn)};
    if(name==='@react-three/fiber')return {useThree:()=>({camera,size,invalidate(){}})};
    if(name==='@react-three/drei')return {OrbitControls:'OrbitControls'};
    return require(name);
  }});
  const bounds=new three.Box3(new three.Vector3(-1,-2,-.5),new three.Vector3(1,2,.5));
  const capture={current:null},restore={current:null};
  const props={bounds,direction:[0,0,1],viewKey:'anterior',zoom:1,reset:0,zoomStep:0,cameraCapture:capture,cameraRestore:restore};
  function render(changes={}) {
    Object.assign(props,changes); index=0;effects=[];
    const element=mod.exports.FittedCamera(props);
    element.props.ref.current=controls;
    for(const effect of effects)effect();
    return capture.current;
  }
  function gesture(factor) {
    if(orthographic) camera.zoom/=factor;
    else camera.position.sub(controls.target).multiplyScalar(factor).add(controls.target);
    camera.updateProjectionMatrix();camera.updateMatrixWorld();
  }
  return {api:mod.exports,camera,size,controls,props,render,gesture,capture,restore};
}
for(const orthographic of [false,true]) {
  const h=harness(orthographic),kind=orthographic?'orthographic':'perspective';
  close(h.render().scale,1,kind+' initial fit');
  close(h.render({zoomStep:1}).scale,.85,kind+' plus enlarges');
  close(h.render().scale,.85,kind+' rerender does not replay step');
  close(h.render({zoomStep:0}).scale,1,kind+' minus is inverse');
  h.gesture(.32);
  close(h.render({zoomStep:1}).scale,.32*.85,kind+' step composes with live gesture');
  close(h.render({zoomStep:0}).scale,.32,kind+' out after gesture');
  h.controls.target.add(new three.Vector3(.3,-.2,.1));
  h.camera.position.add(new three.Vector3(.3,-.2,.1));
  const before=h.render(),pan=[...before.pan];
  const after=h.render({zoomStep:2});
  close(after.scale,.32*.85*.85,kind+' batched steps');
  after.pan.forEach((v,i)=>close(v,pan[i],kind+' pan preserved'));
  h.size.width=390;h.size.height=600;
  if(!orthographic)h.camera.aspect=h.size.width/h.size.height;
  close(h.render().scale,after.scale,kind+' resize preserves live scale');
  close(h.render({reset:1}).scale,1,kind+' reset returns to fit');
  close(h.render().scale,1,kind+' reset does not replay accumulated steps');
  close(h.render({zoomStep:3}).scale,.85,kind+' fresh step after reset');
  const pose={direction:[0,0,1],up:[0,1,0],pan:[.2,.1,0],scale:.6};
  h.restore.current=pose;
  close(h.render({zoomStep:4}).scale,.6,kind+' explicit restoration wins');
  close(h.render().scale,.6,kind+' restore does not replay button');
  close(h.render({zoomStep:5}).scale,.51,kind+' next step uses restored scale');
  close(h.render({recenterKey:'selected'}).scale,1,kind+' explicit frame recentres');
  close(h.render({zoom:.9}).scale,.9,kind+' legacy absolute zoom retained');
  // Legacy saved camera format remains round-trip compatible.
  const restored=h.api.restoreStudyCamera(h.camera,h.props.bounds,1.5,pose);
  close(h.api.captureStudyCamera(h.camera,restored.target,h.props.bounds,1.5).scale,.6,kind+' saved-view compatibility');
}
const {steppedCameraScale:step}=harness().api;
for(const scale of [.001,.02,.05,.2,1,20,50,999]) {
  same(step(scale,1)<=scale,true,'plus never reverses direction');
  same(step(scale,-1)>=scale,true,'minus never reverses direction');
  same(Number.isFinite(step(scale,1000))&&Number.isFinite(step(scale,-1000)),true,'finite repeated steps');
}
close(step(.02,1),.02,'gesture past near limit stays put for inward step');
close(step(.02,-1),.02/.85,'opposite step returns smoothly');
close(step(50,-1),50,'far limit never zooms in unexpectedly');
close(step(50,1),42.5,'inward step remains available beyond far limit');
close(step(NaN,1),.85,'invalid scale fallback');
close(step(1,Infinity),1,'invalid step rejected');
for(const file of ['app/body-scene.tsx','app/anatomy-scene.tsx']) {
  const text=await readFile(file,'utf8');
  same(text.includes('zoomStep={props.zoomStep}'),true,file+' forwards button intent');
}
console.log(JSON.stringify({checks,actualFittedCameraEffect:true,realThreeCameras:['perspective','orthographic'],gestureAndButtonComposition:true,resetAndSavedViewCompatibility:true,browserOrClinicalAcceptance:false}));
