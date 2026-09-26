import assert from 'node:assert/strict';
import test from 'node:test';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {bindCameraKeyboard,bindCameraPanKeyboard} from '../lib/camera-keyboard.ts';
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
  test(`${Camera.name}, up ${up.join(',')}: coarse/fine rotation preserves target, distance and zoom`,()=>{
    const camera=new Camera();camera.up.set(...up);camera.position.set(4,5,8);
    const controls=new OrbitControls(camera);controls.target.set(1,.5,-1);controls.update();controls.enableDamping=true;
    const surface=new Surface();let changed=0;
    const release=bindCameraKeyboard(surface,()=>controls,()=>changed++);
    const target=controls.target.clone(),radius=controls.getDistance(),zoom=camera.zoom;
    const azimuth=controls.getAzimuthalAngle(),polar=controls.getPolarAngle();
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
  const controls=new OrbitControls(camera),surface=new Surface();let changed=0;
  surface.setAttribute('tabindex','-1');surface.setAttribute('role','img');
  const release=bindCameraKeyboard(surface,()=>controls,()=>changed++);
  controls.minAzimuthAngle=-.1;controls.maxAzimuthAngle=.1;
  surface.key('ArrowRight');near(controls.getAzimuthalAngle(),.1);
  const atLimit=changed;assert.equal(surface.key('ArrowRight').defaultPrevented,true);
  assert.equal(changed,atLimit,'Clamped key does not report a rotation');
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

test('actual FittedCamera transitions spatial to tray to locked, captures pan and retains it across refits',async()=>{
  const compiled=await build({stdin:{contents:"export { FittedCamera } from './app/fitted-camera';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'cjs'});
  let camera=new PerspectiveCamera(38,1.5,.01,150),controls=new OrbitControls(camera);
  const surface=new Surface();
  const size={width:900,height:600},gl={domElement:surface},refs=[],mod={exports:{}};
  let index=0,effects=[],cleanups=[],invalidations=0;
  runInNewContext(compiled.outputFiles[0].text,{module:mod,exports:mod.exports,require(name){
    if(name==='react')return{useRef(value){return refs[index++]??(refs[index-1]={current:value});},useCallback:fn=>fn,useEffect:fn=>effects.push(fn)};
    if(name==='@react-three/fiber')return{useThree:()=>({camera,size,gl,invalidate(){invalidations++;}})};
    if(name==='@react-three/drei')return{OrbitControls:'OrbitControls'};
    return require(name);
  }});
  const announcements=[];
  const capture={current:null},props={bounds:new Box3(new Vector3(-1,-2,-.5),new Vector3(1,2,.5)),direction:[0,0,1],viewKey:'anterior',zoom:1,reset:0,cameraCapture:capture,
    onKeyboardRotate:(from,azimuth,polar)=>announcements.push({from:from.clone(),azimuth,polar})};
  const render=changes=>{
    for(const clean of cleanups)clean();cleanups=[];index=0;effects=[];Object.assign(props,changes);
    const element=mod.exports.FittedCamera(props);element.props.ref.current=controls;
    controls.enableRotate=element.props.enableRotate;
    controls.enablePan=element.props.enablePan;
    for(const effect of effects){const clean=effect();if(clean)cleanups.push(clean);}
  };
  render({});assert.equal(surface.handlers.size,1);
  const before=JSON.stringify(capture.current),initial=invalidations;
  surface.key('ArrowRight');assert.notEqual(JSON.stringify(capture.current),before);assert(invalidations>initial);
  assert.equal(announcements.length,1);
  near(announcements[0].from.distanceTo(camera.getWorldDirection(new Vector3()).negate()),0);
  const coarse=announcements[0].azimuth;
  surface.key('ArrowRight',{shiftKey:true});assert.equal(announcements.length,2);
  near(announcements[1].azimuth-coarse,Math.PI/90);
  controls.dispatchEvent({type:'change'});assert.equal(announcements.length,2,'Pointer orbit change does not announce');
  // Non-camera UI changes can recreate bounds/callback identities. The actual
  // fit effect must retain the live orbit instead of restoring its preset.
  const rotated=camera.position.clone(),target=controls.target.clone(),pose=structuredClone(capture.current);
  render({});near(camera.position.distanceTo(rotated),0);near(controls.target.distanceTo(target),0);
  render({bounds:props.bounds.clone()});near(camera.position.distanceTo(rotated),0);
  for(const field of ['direction','up','pan'])capture.current[field].forEach((v,i)=>near(v,pose[field][i]));
  near(capture.current.scale,pose.scale);assert.equal(surface.handlers.size,1);
  camera=new OrthographicCamera();controls=new OrbitControls(camera);
  render({locked:false,planar:true});assert.equal(surface.handlers.size,1);
  assert.equal(surface.getAttribute('data-keyboard-rotation'),null);
  assert.equal(surface.getAttribute('data-keyboard-pan'),'true');
  assert.match(surface.getAttribute('aria-label'),/Pan/);
  assert.doesNotMatch(surface.getAttribute('aria-description'),/rotate/i);
  const trayPosition=camera.position.clone(),trayTarget=controls.target.clone(),trayPose=structuredClone(capture.current),count=announcements.length,panInvalidations=invalidations;
  surface.key('ArrowRight');assert(invalidations>panInvalidations);
  assert.notDeepEqual(capture.current.pan,trayPose.pan);assert.equal(announcements.length,count);
  near(camera.position.clone().sub(trayPosition).distanceTo(controls.target.clone().sub(trayTarget)),0);
  const pannedPosition=camera.position.clone(),pannedTarget=controls.target.clone(),pannedPose=structuredClone(capture.current);
  render({bounds:props.bounds.clone()});near(camera.position.distanceTo(pannedPosition),0);near(controls.target.distanceTo(pannedTarget),0);
  capture.current.pan.forEach((v,i)=>near(v,pannedPose.pan[i]));near(capture.current.scale,pannedPose.scale);
  assert.equal(surface.handlers.size,1);assert.equal(announcements.length,count);
  surface.key('ArrowUp');assert.notDeepEqual(capture.current.pan,pannedPose.pan);
  const restore={current:structuredClone(pannedPose)};
  render({cameraRestore:restore});assert.equal(restore.current,null);
  capture.current.pan.forEach((v,i)=>near(v,pannedPose.pan[i]));near(capture.current.scale,pannedPose.scale);
  size.width=390;size.height=844;render({});
  capture.current.pan.forEach((v,i)=>near(v,pannedPose.pan[i]));
  assert.equal(surface.handlers.size,1);assert.equal(announcements.length,count);
  for(const mode of [{locked:true},{locked:true,planar:false}]){
    render(mode);assert.equal(surface.handlers.size,0);assert.equal(surface.getAttribute('tabindex'),null);
    assert.equal(surface.getAttribute('data-keyboard-pan'),null);
    const pose=JSON.stringify(capture.current);surface.key('ArrowRight');assert.equal(JSON.stringify(capture.current),pose);
  }
  render({locked:false,planar:false});assert.equal(surface.handlers.size,1);
  render({});assert.equal(surface.handlers.size,1); // no accumulated listeners after updates
  for(const clean of cleanups)clean();assert.equal(surface.handlers.size,0);
});

for(const [direction,up] of [[[0,0,1],[0,1,0]],[[1,0,0],[0,0,1]],[[0,0,-1],[0,1,0]],[[0,1,0],[0,0,1]]]){
  test(`tray pan follows camera right/up for projection ${direction.join(',')}, up ${up.join(',')}`,()=>{
    const camera=new OrthographicCamera(-10,10,6,-6,.01,150);camera.zoom=2;
    camera.up.set(...up);camera.position.set(...direction).multiplyScalar(20);
    const controls=new OrbitControls(camera);controls.target.set(1,2,3);controls.update();controls.enableRotate=false;controls.enableDamping=true;
    const surface=new Surface();let changed=0;
    const release=bindCameraPanKeyboard(surface,camera,()=>controls,()=>changed++);
    const position=camera.position.clone(),target=controls.target.clone(),quaternion=camera.quaternion.clone(),distance=controls.getDistance();
    camera.updateMatrixWorld();const right=new Vector3().setFromMatrixColumn(camera.matrixWorld,0),screenUp=new Vector3().setFromMatrixColumn(camera.matrixWorld,1);
    assert.equal(surface.key('ArrowRight').defaultPrevented,true);
    near(camera.position.clone().sub(position).distanceTo(right.clone().multiplyScalar(.5)),0);
    near(controls.target.clone().sub(target).distanceTo(right.clone().multiplyScalar(.5)),0);
    surface.key('ArrowLeft');near(camera.position.distanceTo(position),0);near(controls.target.distanceTo(target),0);
    surface.key('ArrowUp',{shiftKey:true});near(camera.position.clone().sub(position).distanceTo(screenUp.clone().multiplyScalar(.06)),0);
    surface.key('ArrowDown',{shiftKey:true});near(camera.position.distanceTo(position),0);
    camera.quaternion.toArray().forEach((v,i)=>near(v,quaternion.toArray()[i]));near(controls.getDistance(),distance);near(camera.zoom,2);
    assert.equal(controls.enableDamping,true);assert.equal(changed,4);
    camera.zoom=4;surface.key('ArrowRight');near(camera.position.distanceTo(position),.25);
    surface.key('ArrowLeft');camera.right=20;camera.left=-20;surface.key('ArrowRight');near(camera.position.distanceTo(position),.5);
    release();assert.equal(surface.handlers.size,0);assert.equal(surface.getAttribute('data-keyboard-pan'),null);assert.equal(surface.getAttribute('tabindex'),null);
  });
}

test('tray keyboard guards, invalid scale and attribute ownership',()=>{
  const camera=new OrthographicCamera(-10,10,6,-6);camera.position.set(0,0,20);
  const controls=new OrbitControls(camera),surface=new Surface();let changed=0;
  surface.setAttribute('tabindex','-1');surface.setAttribute('role','img');
  const release=bindCameraPanKeyboard(surface,camera,()=>controls,()=>changed++),position=camera.position.clone();
  for(const options of [{altKey:true},{ctrlKey:true},{metaKey:true},{isComposing:true},{target:{}},{defaultPrevented:true}])assert.equal(surface.key('ArrowLeft',options).stopped,false);
  for(const key of ['Tab','Escape','Enter','Home','+','-','a'])assert.equal(surface.key(key).defaultPrevented,false);
  surface.ownerDocument.activeElement={};assert.equal(surface.key('ArrowRight').defaultPrevented,false);surface.ownerDocument.activeElement=surface;
  controls.enablePan=false;assert.equal(surface.key('ArrowRight').defaultPrevented,false);controls.enablePan=true;
  controls.enabled=false;assert.equal(surface.key('ArrowRight').defaultPrevented,false);controls.enabled=true;
  for(const zoom of [0,-1,Infinity,NaN]){camera.zoom=zoom;assert.equal(surface.key('ArrowRight').defaultPrevented,false);}
  camera.zoom=1;camera.right=camera.left;assert.equal(surface.key('ArrowRight').defaultPrevented,false);
  near(camera.position.distanceTo(position),0);assert.equal(changed,0);
  surface.setAttribute('aria-label','Later owner label');release();release();
  assert.equal(surface.getAttribute('tabindex'),'-1');assert.equal(surface.getAttribute('role'),'img');assert.equal(surface.getAttribute('aria-label'),'Later owner label');
  const noControls=bindCameraPanKeyboard(surface,camera,()=>null,()=>changed++);assert.equal(surface.key('ArrowRight').defaultPrevented,false);noControls();
});

test('BodyScene keeps visual rotation silent and writes a keyboard-only polite orientation status',async()=>{
  const compiled=await build({stdin:{contents:"export { BodyScene } from './app/body-scene'; export { FittedCamera } from './app/fitted-camera';",resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,platform:'node',format:'cjs'});
  const React=require('react'),mod={exports:{}};
  runInNewContext(compiled.outputFiles[0].text,{module:mod,exports:mod.exports,require(name){
    if(name==='react')return{...React,useMemo:fn=>fn(),useLayoutEffect:fn=>fn(),useEffect:()=>{}};
    return require(name);
  }});
  const catalog=JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json'));
  const props={catalog,structures:[],selectedId:null,systems:{skeleton:true,muscles:true,organs:true,nerves:true,vessels:true,connective:true},
    isolated:false,hiddenIds:[],ghostRemoved:false,illustrated:true,landmarks:[],explode:0,layout:'spatial',anchorSkeleton:false,
    showOrigins:false,labels:true,view:'anterior',zoom:1,reset:0,focus:false,exam:false,
    inspection:{plane:'off',position:50,flipped:false,opacity:{},keepSelectedSolid:true},plate:false,
    onSelect(){},onLoaded(){},onFailure(){},onRendererHealth(){}};
  const nodes=n=>!n||typeof n!=='object'?[]:Array.isArray(n)?n.flatMap(nodes):[n,...nodes(n.props?.children)];
  const scene=mod.exports.BodyScene(props),tree=scene.props.children(()=>{}),all=nodes(tree);
  const heading=all.find(n=>n.props?.className==='anatomy-live-orientation');
  const status=all.find(n=>n.type==='output'&&n.props?.className==='sr-only');
  const fitted=all.find(n=>n.type===mod.exports.FittedCamera);
  assert.equal(heading.props['aria-live'],'off');
  assert.equal(status.props['aria-live'],'polite');assert.equal(status.props['aria-atomic'],'true');
  let announced='';status.props.ref.current={get textContent(){return announced;},set textContent(value){announced=value;}};
  fitted.props.onKeyboardRotate(new Vector3(0,0,1),Math.PI/18,Math.PI/2);
  assert.match(announced,/^View from: .+ Orbit angle: 10° around, 90° from above\.$/);
  fitted.props.onKeyboardRotate(new Vector3(0,0,1),Math.PI/15,Math.PI/2);
  assert.match(announced,/Orbit angle: 12° around/,'Fine rotation updates the live status');
  assert.equal(mod.exports.BodyScene({...props,exam:true}).props.children(()=>{}).props['data-orientation'],false);
});
