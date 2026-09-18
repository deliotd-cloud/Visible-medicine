import assert from 'node:assert/strict';
import test from 'node:test';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {bindCameraKeyboard} from '../lib/camera-keyboard.ts';
import {build} from './workspace-component-test-build.mjs';
import {reviewDisplayPaths} from './review-revision-evidence.mjs';
const require=createRequire(import.meta.url);
const {PerspectiveCamera,OrthographicCamera,Box3,Vector3}=require('three');
const {OrbitControls}=require('three-stdlib');

class Surface {
  attributes=new Map(); handlers=new Set(); ownerDocument={activeElement:this};
  getAttribute(key){return this.attributes.get(key)??null;}
  setAttribute(key,value){this.attributes.set(key,String(value));}
  removeAttribute(key){this.attributes.delete(key);}
  addEventListener(name,fn){assert.equal(name,'keydown');this.handlers.add(fn);}
  removeEventListener(name,fn){assert.equal(name,'keydown');this.handlers.delete(fn);}
  key(key,options={}){
    const event={key,target:this,defaultPrevented:false,stopped:false,isComposing:false,altKey:false,ctrlKey:false,metaKey:false,shiftKey:false,
      preventDefault(){this.defaultPrevented=true;},stopPropagation(){this.stopped=true;},...options};
    for(const fn of this.handlers)fn(event);
    return event;
  }
}
const near=(a,b)=>assert(Math.abs(a-b)<1e-8,`${a} != ${b}`);

test('keyboard behavior and focus treatment are bound to shoulder review revisions',()=>{
  for(const path of ['lib/camera-keyboard.ts','app/camera-keyboard.css']) assert(reviewDisplayPaths.includes(path));
});

for(const Camera of [PerspectiveCamera,OrthographicCamera])for(const up of [[0,1,0],[0,0,1]]){
  test(`${Camera.name}, up ${up}: coarse/fine rotation preserves target, distance and zoom`,()=>{
    const camera=new Camera();camera.up.set(...up);camera.position.set(4,5,8);
    const controls=new OrbitControls(camera);controls.target.set(1,.5,-1);controls.update();controls.enableDamping=true;
    const surface=new Surface();let changed=0;
    const release=bindCameraKeyboard(surface,()=>controls,()=>changed++);
    const target=controls.target.clone(),radius=controls.getDistance(),zoom=camera.zoom;
    let azimuth=controls.getAzimuthalAngle(),polar=controls.getPolarAngle();
    assert.equal(surface.getAttribute('tabindex'),'0');assert.match(surface.getAttribute('aria-description'),/Shift/);
    assert.equal(surface.key('ArrowRight').defaultPrevented,true);near(controls.getAzimuthalAngle(),azimuth+Math.PI/18);
    surface.key('ArrowLeft');near(controls.getAzimuthalAngle(),azimuth);
    surface.key('ArrowDown',{shiftKey:true});near(controls.getPolarAngle(),polar+Math.PI/90);
    surface.key('ArrowUp',{shiftKey:true});near(controls.getPolarAngle(),polar);
    near(controls.getDistance(),radius);near(camera.zoom,zoom);near(controls.target.distanceTo(target),0);
    assert.equal(controls.enableDamping,true);assert.equal(changed,4);
    for(let i=0;i<36;i++)surface.key('ArrowRight');near(controls.getAzimuthalAngle(),azimuth);
    for(let i=0;i<40;i++)surface.key('ArrowUp');near(controls.getPolarAngle(),1e-4);
    for(let i=0;i<40;i++)surface.key('ArrowDown');near(controls.getPolarAngle(),Math.PI-1e-4);
    assert(camera.position.toArray().every(Number.isFinite));
    release();assert.equal(surface.handlers.size,0);assert.equal(surface.getAttribute('tabindex'),null);
  });
}

test('focus, modifier, composition, editable-target and rotation-lock guards do not consume keys',()=>{
  const camera=new PerspectiveCamera();camera.position.set(0,0,5);
  const controls=new OrbitControls(camera),surface=new Surface();let changed=0;
  const release=bindCameraKeyboard(surface,()=>controls,()=>changed++);
  const position=camera.position.clone();
  for(const options of [{altKey:true},{ctrlKey:true},{metaKey:true},{isComposing:true},{target:{}},{defaultPrevented:true}]){
    const event=surface.key('ArrowLeft',options);assert.equal(event.stopped,false);
  }
  for(const key of ['Tab','Escape','Enter','Home','+','-','a'])assert.equal(surface.key(key).defaultPrevented,false);
  surface.ownerDocument.activeElement={};assert.equal(surface.key('ArrowRight').defaultPrevented,false);
  surface.ownerDocument.activeElement=surface;
  controls.enableRotate=false;assert.equal(surface.key('ArrowRight').defaultPrevented,false);
  controls.enableRotate=true;controls.enabled=false;assert.equal(surface.key('ArrowRight').defaultPrevented,false);
  near(camera.position.distanceTo(position),0);assert.equal(changed,0);release();
  const noControls=bindCameraKeyboard(surface,()=>null,()=>changed++);
  assert.equal(surface.key('ArrowRight').defaultPrevented,false);noControls();
});

test('angle limits, invalid inputs, damping and lifecycle restoration',()=>{
  const camera=new PerspectiveCamera();camera.position.set(0,0,5);
  const controls=new OrbitControls(camera),surface=new Surface();
  surface.setAttribute('tabindex','-1');surface.setAttribute('role','img');
  const release=bindCameraKeyboard(surface,()=>controls,()=>{});
  controls.minAzimuthAngle=-.1;controls.maxAzimuthAngle=.1;
  surface.key('ArrowRight');near(controls.getAzimuthalAngle(),.1);
  surface.key('ArrowLeft');surface.key('ArrowLeft');near(controls.getAzimuthalAngle(),-.1);
  controls.minPolarAngle=1;controls.maxPolarAngle=2;
  for(let i=0;i<20;i++)surface.key('ArrowUp');near(controls.getPolarAngle(),1);
  for(let i=0;i<20;i++)surface.key('ArrowDown');near(controls.getPolarAngle(),2);
  controls.minPolarAngle=NaN;assert.equal(surface.key('ArrowDown').defaultPrevented,false);
  controls.minAzimuthAngle=1;controls.maxAzimuthAngle=-1;assert.equal(surface.key('ArrowRight').defaultPrevented,false);
  surface.setAttribute('aria-label','Later owner label');release();release();
  assert.equal(surface.getAttribute('tabindex'),'-1');assert.equal(surface.getAttribute('role'),'img');
  assert.equal(surface.getAttribute('aria-label'),'Later owner label');assert.equal(surface.handlers.size,0);
  assert.equal(surface.getAttribute('data-keyboard-rotation'),null);
});

test('actual FittedCamera installs/cleans input, captures rotated saves and excludes locked/planar scenes',async()=>{
  const compiled=await build({stdin:{contents:"export { FittedCamera } from './app/fitted-camera';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'cjs'});
  const camera=new PerspectiveCamera(38,1.5,.01,150),surface=new Surface(),controls=new OrbitControls(camera);
  const size={width:900,height:600},gl={domElement:surface},refs=[],mod={exports:{}};
  let index=0,effects=[],cleanups=[],invalidations=0;
  runInNewContext(compiled.outputFiles[0].text,{module:mod,exports:mod.exports,require(name){
    if(name==='react')return{useRef(value){return refs[index++]??(refs[index-1]={current:value});},useCallback:fn=>fn,useEffect:fn=>effects.push(fn)};
    if(name==='@react-three/fiber')return{useThree:()=>({camera,size,gl,invalidate(){invalidations++;}})};
    if(name==='@react-three/drei')return{OrbitControls:'OrbitControls'};
    return require(name);
  }});
  const capture={current:null},props={bounds:new Box3(new Vector3(-1,-2,-.5),new Vector3(1,2,.5)),direction:[0,0,1],viewKey:'anterior',zoom:1,reset:0,cameraCapture:capture};
  const render=changes=>{
    for(const clean of cleanups)clean();cleanups=[];index=0;effects=[];Object.assign(props,changes);
    const element=mod.exports.FittedCamera(props);element.props.ref.current=controls;
    controls.enableRotate=element.props.enableRotate;
    for(const effect of effects){const clean=effect();if(clean)cleanups.push(clean);}
  };
  render({});assert.equal(surface.handlers.size,1);
  const before=JSON.stringify(capture.current),initial=invalidations;
  surface.key('ArrowRight');assert.notEqual(JSON.stringify(capture.current),before);assert(invalidations>initial);
  for(const mode of [{locked:true},{locked:false,planar:true}]){
    render(mode);assert.equal(surface.handlers.size,0);assert.equal(surface.getAttribute('tabindex'),null);
    const pose=JSON.stringify(capture.current);surface.key('ArrowRight');assert.equal(JSON.stringify(capture.current),pose);
  }
  render({locked:false,planar:false});assert.equal(surface.handlers.size,1);
  render({});assert.equal(surface.handlers.size,1); // no accumulated listeners after updates
  for(const clean of cleanups)clean();assert.equal(surface.handlers.size,0);
});
