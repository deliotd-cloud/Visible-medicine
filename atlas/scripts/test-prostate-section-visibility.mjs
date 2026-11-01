import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import React from 'react';
import ts from 'typescript';
import * as THREE from 'three';
import {createProstateSectionGeometry, createProstateZoneGeometries} from '../lib/prostate-zone-geometry.ts';
import {prostateZones} from '../lib/prostate-zones.ts';

const root=fileURLToPath(new URL('..',import.meta.url));
const require=createRequire(import.meta.url);
const keys=prostateZones.map(zone=>zone.key);

function nodes(tree,predicate){
 const found=[];
 function walk(item){
  if(Array.isArray(item)){item.forEach(walk);return;}
  if(!React.isValidElement(item))return;
  if(predicate(item))found.push(item);
  walk(item.props.children);
 }
 walk(tree);return found;
}
const notice=tree=>nodes(tree,node=>node.props.className==='prostate-zones-section-notice')[0];
const button=(tree,label)=>nodes(tree,node=>node.type==='button'&&node.props.children===label)[0];
const slider=tree=>nodes(tree,node=>node.type==='input'&&node.props.type==='range'&&node.props.min==='-0.7')[0];
const zoneButton=(tree,key)=>nodes(tree,node=>node.type==='button'&&node.props['aria-label']?.startsWith(`${key} `))[0];
const explodeSlider=tree=>nodes(tree,node=>node.type==='input'&&node.props.type==='range'&&node.props.min==='0')[0];
function visibleText(item){
 if(Array.isArray(item))return item.map(visibleText).join('');
 if(React.isValidElement(item))return visibleText(item.props.children);
 return typeof item==='string'||typeof item==='number'?String(item):'';
}

function harness(){
 const states=[],refs=[],effects=[],published=[];
 let stateIndex=0,refIndex=0,effectIndex=0,pending=[],tree;
 const useState=initial=>{
  const index=stateIndex++;
  if(!(index in states))states[index]=typeof initial==='function'?initial():initial;
  return [states[index],next=>{states[index]=typeof next==='function'?next(states[index]):next;}];
 };
 const useRef=initial=>{
  const index=refIndex++;
  if(!(index in refs))refs[index]={current:initial};
  return refs[index];
 };
 const useEffect=(effect,deps)=>{
  const index=effectIndex++,previous=effects[index];
  if(!previous||!deps||deps.some((value,i)=>!Object.is(value,previous.deps[i])))
   pending.push({index,effect,deps});
 };
 const source=fs.readFileSync(path.join(root,'app/prostate-zones.tsx'),'utf8');
 const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const geometry={
  createProstateSectionGeometry,
  // Preserve real BufferGeometry behavior while keeping this focused test cheap.
  createProstateZoneGeometries:()=>createProstateZoneGeometries(12),
 };
 const mocks={
  react:{useState,useRef,useEffect},
  '@react-three/drei':{Html(){},Line(){},OrbitControls(){}},
  '@react-three/fiber':{useFrame(){},useThree(){}},
  three:THREE,
  './anatomy-canvas':{AnatomyCanvas(){}},
  '../lib/camera-keyboard':{bindCameraKeyboard(){}},
  '../lib/prostate-zone-geometry':geometry,
  '../lib/prostate-zones':{prostateZones,PROSTATE_ZONE_REVISION:'test-revision'},
  './prostate-education-link':{useProstateEducationLink:()=>({publish:id=>published.push(id)})},
  './imaging-link':{ImagingLink(){}},
  './prostate-mri-teaching':{ProstateMriTeaching(){}},
  './prostate-zones.css':{},
 };
 const module={exports:{}};
 new Function('require','module','exports',code)(name=>name in mocks?mocks[name]:require(name),module,module.exports);
 const render=()=>{
  stateIndex=refIndex=effectIndex=0;pending=[];
  tree=module.exports.ProstateZones({onClose(){},parent:{id:'test-parent'}});
  return tree;
 };
 const flush=()=>{
  const next=pending;pending=[];
  for(const {index,effect,deps} of next){
   effects[index]?.cleanup?.();
   effects[index]={deps,cleanup:effect()};
  }
  return render();
 };
 const dispose=()=>{for(const effect of effects)effect?.cleanup?.();};
 return {render,flush,dispose,published};
}

test('real cap geometry distinguishes an absent apical central zone from the mid-gland',()=>{
 const caps=Object.fromEntries([-.7,0].map(level=>[level,Object.fromEntries(keys.map(key=>[key,createProstateSectionGeometry(key,level)]))]));
 try{
  assert.equal(caps[-.7].central.getAttribute('position').count,0);
  assert.equal(caps[-.7].transition.getAttribute('position').count,0);
  for(const key of keys)assert(caps[0][key].getAttribute('position').count>0,key);
 }finally{for(const level of [-.7,0])for(const key of keys)caps[level][key].dispose();}
});

test('absent selected cap offers a mid-gland action that preserves other controls and does not publish',()=>{
 const ui=harness();
 try{
  let tree=ui.render();assert.equal(notice(tree),undefined);
  tree=ui.flush();tree=ui.flush();
  button(tree,'Axial section').props.onClick();tree=ui.render();
  zoneButton(tree,'CZ').props.onClick();tree=ui.render();
  button(tree,'Isolate selected').props.onClick();tree=ui.render();
  button(tree,'Hide labels').props.onClick();tree=ui.render();
  explodeSlider(tree).props.onChange({target:{value:'0.4'}});tree=ui.render();
  slider(tree).props.onChange({target:{value:'-0.7'}});tree=ui.render();
  assert.equal(notice(tree),undefined,'stale cap geometry is still loading');
  tree=ui.flush();
  assert(notice(tree));
  assert.match(visibleText(notice(tree)),/^Central zone is not visible at this illustrative section level\./);
  const before=ui.published.length;
  const focusCalls=[];
  slider(tree).props.ref.current={focus:options=>focusCalls.push(options)};
  button(notice(tree),'Show at mid-gland').props.onClick();tree=ui.render();
  assert.deepEqual(focusCalls,[{preventScroll:true}], 'recovery focuses the section slider before its button unmounts');
  assert.equal(ui.published.length,before,'section navigation must not publish MRI selection');
  assert.equal(slider(tree).props.value,0);
  assert.equal(zoneButton(tree,'CZ').props['aria-pressed'],true);
  assert(button(tree,'Show all zones'));
  assert(button(tree,'Show labels'));
  assert.equal(explodeSlider(tree).props.value,0.4);
  assert.equal(notice(tree),undefined,'stale apical cap must not produce a false notice');
  tree=ui.flush();assert.equal(notice(tree),undefined);
 }finally{ui.dispose();}
});

test('no section notice before caps load, in 3D, for a visible zone, or after graphics failure',()=>{
 const ui=harness();
 try{
  let tree=ui.render();
  button(tree,'Axial section').props.onClick();tree=ui.render();
  zoneButton(tree,'CZ').props.onClick();tree=ui.render();
  slider(tree).props.onChange({target:{value:'-0.7'}});tree=ui.render();
  assert.equal(notice(tree),undefined,'geometry preparation must not imply absence');
  tree=ui.flush();assert(notice(tree));
  zoneButton(tree,'PZ').props.onClick();tree=ui.render();
  assert.equal(notice(tree),undefined,'peripheral cap is visible at apex');
  zoneButton(tree,'CZ').props.onClick();tree=ui.render();assert(notice(tree));
  button(tree,'3D cutaway').props.onClick();tree=ui.render();
  assert.equal(notice(tree),undefined,'3D view must not show section notice');
  button(tree,'Axial section').props.onClick();tree=ui.render();assert(notice(tree));
  nodes(tree,node=>node.type?.name==='AnatomyCanvas')[0].props.onFailure();
  tree=ui.render();assert.equal(notice(tree),undefined,'graphics failure takes precedence');
 }finally{ui.dispose();}
});
