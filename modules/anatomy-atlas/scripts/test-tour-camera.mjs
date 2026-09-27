import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { build } from './workspace-component-test-build.mjs';
const require = createRequire(import.meta.url);
const { Vector3, Box3, PerspectiveCamera } = require('three');
const compiled = await build({stdin:{contents:"export { FittedCamera } from './app/fitted-camera'; export { interpolateTourCamera } from './lib/tour-camera';",resolveDir:process.cwd(),loader:'ts'},bundle:true,platform:'node',format:'cjs',write:false});
const camera = new PerspectiveCamera(39, 1.5, .01, 150);
const controls = {target:new Vector3(),update(){camera.updateMatrixWorld();}};
const size = {width:900,height:600}, refs=[], memos=[], effectDeps=[];
let index=0, effectIndex=0, memoIndex=0, effects=[], frame, invalidations=0;
const invalidate=()=>invalidations++;
const mod={exports:{}};
const same=(a,b)=>a&&b&&a.length===b.length&&a.every((value,i)=>Object.is(value,b[i]));
runInNewContext(compiled.outputFiles[0].text,{module:mod,exports:mod.exports,require(name){
  if(name==='react')return {
    useRef(value){return refs[index++]??(refs[index-1]={current:value});},
    useCallback(fn,deps){const i=memoIndex++;if(!same(memos[i]?.deps,deps))memos[i]={fn,deps};return memos[i].fn;},
    useEffect(fn,deps){const i=effectIndex++;if(!same(effectDeps[i],deps)){effects.push(fn);effectDeps[i]=deps;}},
  };
  if(name==='@react-three/fiber')return {useThree:()=>({camera,size,invalidate}),useFrame:fn=>{frame=fn;}};
  if(name==='@react-three/drei')return {OrbitControls:'OrbitControls'};
  return require(name);
}});
const capture={current:null},restore={current:null};
const props={bounds:new Box3(new Vector3(-1,-2,-1),new Vector3(1,2,1)),direction:[0,0,1],viewKey:'anterior',zoom:1,reset:0,cameraCapture:capture,cameraRestore:restore};
function render(changes={}){Object.assign(props,changes);index=0;effectIndex=0;memoIndex=0;effects=[];const element=mod.exports.FittedCamera(props);element.props.ref.current=controls;for(const fn of effects)fn();return element;}
const near=(a,b)=>assert(Math.abs(a-b)<1e-7,`${a} != ${b}`);
const from={position:new Vector3(0,0,10),target:new Vector3(),up:new Vector3(0,1,0)};
const to={position:new Vector3(0,0,-10),target:new Vector3(),up:new Vector3(0,1,0)};
// Dorsal-to-plantar foot sweeps reverse both radial direction and screen-up.
// Independently interpolating these vectors can make them parallel mid-flight.
const top={position:new Vector3(0,10,0),target:new Vector3(),up:new Vector3(0,0,-1)};
const bottom={position:new Vector3(0,-10,0),target:new Vector3(),up:new Vector3(0,0,1)};
for(const [a,b] of [[top,bottom],[bottom,top]]) {
  let previousQuaternion;
  for(let i=0;i<=100;i++) {
    const pose=mod.exports.interpolateTourCamera(a,b,i/100);
    const radial=pose.position.clone().sub(pose.target).normalize();
    assert(radial.clone().cross(pose.up.clone().normalize()).length()>.999999,'Polar camera up must stay perpendicular to its viewing axis');
    near(pose.position.distanceTo(pose.target),10);
    const probe=new PerspectiveCamera();probe.position.copy(pose.position);probe.up.copy(pose.up);probe.lookAt(pose.target);probe.updateMatrixWorld();
    assert(probe.quaternion.toArray().every(Number.isFinite));
    if(previousQuaternion)assert(Math.abs(probe.quaternion.dot(previousQuaternion))>.99,'No polar orientation flip');
    previousQuaternion=probe.quaternion.clone();
  }
}
for(let i=0;i<=100;i++){
  const pose=mod.exports.interpolateTourCamera(from,to,i/100);
  near(pose.position.distanceTo(pose.target),10);
  assert(pose.position.toArray().every(Number.isFinite));
}
near(mod.exports.interpolateTourCamera(from,to,0).position.distanceTo(from.position),0);
near(mod.exports.interpolateTourCamera(from,to,1).position.distanceTo(to.position),0);
// Near either endpoint, displacement is cubic rather than linear/quadratic:
// gently starts/stops with zero velocity and zero acceleration.
const tiny=mod.exports.interpolateTourCamera(from,to,.001).position.distanceTo(from.position);
const tinyEnd=mod.exports.interpolateTourCamera(from,to,.999).position.distanceTo(to.position);
assert(tiny<0.000001 && tinyEnd<0.000001,'Soft endpoint acceleration, not an abrupt start/stop');
let priorAngle=0;
for(let i=1;i<=100;i++){
  const pose=mod.exports.interpolateTourCamera(from,to,i/100);
  const angle=from.position.angleTo(pose.position);
  assert(angle+1e-9>=priorAngle,'No reversal or overshoot during sweep');priorAngle=angle;
}
render();const saved=structuredClone(capture.current),start=camera.position.clone();
const element=render({viewKey:'posterior',direction:[0,0,-1],locked:true,transitionMs:1000});
assert.equal(element.props.enableRotate,false);assert.equal(element.props.enablePan,false);assert.equal(element.props.enableZoom,false);
near(camera.position.distanceTo(start),0);
for(let i=0;i<8;i++)frame(null,.05);
assert(camera.position.distanceTo(start)>1,'Camera actually moves');
const paused=camera.position.clone();render({transitionPaused:true});
for(let i=0;i<20;i++)frame(null,.05);
near(camera.position.distanceTo(paused),0);
render({transitionPaused:false});for(let i=0;i<25;i++)frame(null,.05);
assert(camera.position.z<0,'Reaches posterior without crossing model centre');
const count=invalidations;frame(null,.05);assert.equal(invalidations,count,'No endless demand frames after arrival');
restore.current=saved;render({locked:false,transitionMs:0,reset:1});
near(camera.position.distanceTo(start),0);
near(capture.current.scale,saved.scale);assert.equal(restore.current,null);
render({viewKey:'lateral',direction:[-1,0,0],transitionMs:0});
assert(camera.position.x<0);near(camera.position.z,0);
render({viewKey:'posterior-again',direction:[0,0,-1],transitionMs:1000});frame(null,.05);
render({transitionMs:0});near(camera.position.x,0);assert(camera.position.z<0,'Reduced motion during transition jumps to intended endpoint');
render({viewKey:'lateral-resize',direction:[-1,0,0],transitionMs:1000});frame(null,.05);
size.width=500;camera.aspect=500/600;render();
for(let i=0;i<25;i++)frame(null,.05);
near(camera.position.z,0);assert(camera.position.x<0,'Resize mid-transition still reaches selected view');
render({viewKey:'superior',direction:[0,1,0],up:[0,0,-1],transitionMs:0,locked:true});
const polarStart=camera.position.clone();
render({viewKey:'inferior',direction:[0,-1,0],up:[0,0,1],transitionMs:1000});
for(let i=0;i<10;i++)frame(null,.05);
assert(camera.position.distanceTo(polarStart)>1);
assert(camera.position.clone().sub(controls.target).normalize().cross(camera.up).length()>.999999);
const polarPaused=camera.position.clone(),polarUp=camera.up.clone();
render({transitionPaused:true});frame(null,.5);
near(camera.position.distanceTo(polarPaused),0);near(camera.up.distanceTo(polarUp),0);
render({transitionPaused:false});for(let i=0;i<20;i++)frame(null,.05);
assert(camera.position.y<controls.target.y);near(camera.up.distanceTo(new Vector3(0,0,1)),0);
console.log(JSON.stringify({passed:true,antipodalOrbitSamples:101,polarFrameSamples:202,actualCameraPauseResume:true,actualPolarPauseResume:true,exactRestore:true,reducedMotionImmediate:true}));
