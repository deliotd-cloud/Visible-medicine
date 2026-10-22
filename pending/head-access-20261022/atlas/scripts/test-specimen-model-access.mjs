import assert from 'node:assert/strict';
import test from 'node:test';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {build} from './workspace-component-test-build.mjs';

const require=createRequire(import.meta.url),React=require('react');
const actualLink=await import('vinext/shims/link');
const built=await build({stdin:{contents:`
 export {EyeLayerView} from './app/eye-layers';
 export {FemoralComponentView} from './app/femoral-components';
 export {KneeSpecimenView} from './app/um-knee-study';
 export {SpecimenIdentification} from './app/um-limb-learning';
 export {bodyDisplayCatalog} from './lib/body-display-catalog';
 export {eyeLayersFor} from './lib/eye-layers';
 export {femoralComponentsFor} from './lib/femoral-components';
 export {cranialArteryComponentsFor} from './lib/cranial-artery-components';
 export {kneeDefinition,limbDefinitions} from './lib/um-limb-studies';
 export {createIdentification} from './lib/um-limb-teaching';
 export {default as raw} from './public/models/bodyparts3d/full-body/catalog.json';
`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,platform:'node',format:'cjs',write:false,
 plugins:[{name:'controlled-scene-and-transport',setup(b){
  b.onLoad({filter:/body-scene\.tsx$/},()=>({contents:'export function BodyScene(){return null;} export const retryBodyAssets=(urls,base)=>globalThis.cleared.push({urls,base});',loader:'tsx'}));
  b.onLoad({filter:/nested-education-link\.ts$/},()=>({contents:'export const useNestedEducationLink=options=>{globalThis.education.options=options;return {adapter:null,publish:()=>{}};};',loader:'ts'}));
  b.onLoad({filter:/[\\/]app[\\/]head-selection-channel\.tsx$/},()=>({contents:'export const useHeadNestedSelection=()=>{};',loader:'ts'}));
 }}]});
const plain=x=>JSON.parse(JSON.stringify(x));
const nodes=n=>!n||typeof n!=='object'?[]:Array.isArray(n)?n.flatMap(nodes):[n,...nodes(n.props?.children)];
const text=n=>typeof n==='string'||typeof n==='number'?String(n):!n?'':Array.isArray(n)?n.map(text).join(''):text(n.props?.children);
function harness(component,makeProps){
 let cursor=0,tree;const slots=[],cleared=[],education={};let layoutEffects=[];
 const state=value=>{const i=cursor++;if(!(i in slots))slots[i]=typeof value==='function'?value():value;return[slots[i],next=>slots[i]=typeof next==='function'?next(slots[i]):next];};
 const sameDeps=(before,after)=>Array.isArray(before)&&Array.isArray(after)&&before.length===after.length&&before.every((value,index)=>Object.is(value,after[index]));
 const memo=(create,deps)=>{const i=cursor++,old=slots[i];if(!old||!sameDeps(old.deps,deps))slots[i]={value:create(),deps:deps?.slice()};return slots[i].value;};
 const layout=(create,deps)=>{const i=cursor++,old=slots[i];if(!old||!sameDeps(old.deps,deps))layoutEffects.push(()=>{old?.cleanup?.();const cleanup=create();slots[i]={deps:deps?.slice(),cleanup:typeof cleanup==='function'?cleanup:undefined};});};
 const shim={...React,useContext:()=>null,useState:state,useRef:value=>state(()=>({current:value}))[0],useEffect:()=>{},useLayoutEffect:layout,useMemo:memo,useCallback:fn=>fn,
  useReducer:(reduce,arg,init)=>{const[v,set]=state(()=>init?init(arg):arg);return[v,action=>set(old=>reduce(old,action))];}};
 const module={exports:{}};
 runInNewContext(built.outputFiles[0].text,{module,exports:module.exports,structuredClone,cleared,education,
  require:id=>id==='react'?shim:id==='next/link'?{__esModule:true,...actualLink}:require(id)});
 const api=module.exports,props=makeProps(api);
 const render=()=>{cursor=0;layoutEffects=[];tree=api[component](props);for(const effect of layoutEffects)effect();return tree;};
 const scene=()=>{const found=nodes(tree).filter(n=>n.type?.name==='BodyScene');assert.equal(found.length,1);return found[0].props;};
 const button=label=>{const found=nodes(tree).filter(n=>n.props?.onClick&&text(n).trim()===label);assert.equal(found.length,1,label);return found[0].props;};
 const ready=()=>{scene().onRendererHealth('ready');for(const b of scene().catalog.bundles)scene().onLoaded(b.id);render();};
 const snapshot=()=>{const s=scene();return plain({selectedId:s.selectedId,hiddenIds:s.hiddenIds,view:s.view,explode:s.explode,layout:s.layout,zoom:s.zoom,reset:s.reset,isolated:s.isolated});};
 render();return{api,props,render,scene,button,ready,snapshot,cleared,education,tree:()=>tree,text:()=>text(tree)};
}
const accessCopy={'sign-in':'Some model files require sign-in.','access-denied':'The website refused access to some model files.'};

for(const [component,kind,select]of [
 ['EyeLayerView','eye','eyeLayersFor'],
 ['FemoralComponentView','femoral-components','femoralComponentsFor'],
 ['FemoralComponentView','cranial-artery-components','cranialArteryComponentsFor'],
])test(`${kind}: actual access feedback retains view and keeps Education paused until reload`,()=>{
 for(const reason of ['sign-in','access-denied','unavailable',undefined]){
  const h=harness(component,api=>{const catalog=api.bodyDisplayCatalog(api.raw),parent=catalog.structures.find(s=>api[select](s).length);assert(parent);return{parent,educationCatalog:catalog,study:kind,assetBase:'/atlas-runtime/head-neck'};});
  h.ready();const before=h.snapshot();const bundle=h.scene().catalog.bundles[0];
  h.scene().onFailure(bundle.id,reason);h.render();
  assert(h.education.options.disabled);assert.equal(h.education.options.allowedIds.length,0);
  const label=accessCopy[reason]?'Check access again':'Retry';
  if(accessCopy[reason])assert(h.text().includes(accessCopy[reason]));else assert(!h.text().includes('Sign in to'));
  assert(nodes(h.tree()).some(n=>n.props?.role==='alert'));
  assert.deepEqual(h.snapshot(),before);
  h.button(label).onClick();h.render();assert(h.education.options.disabled);
  assert.equal(h.cleared.length,1);assert.equal(h.cleared[0].base,'/atlas-runtime/head-neck');
  assert.deepEqual(plain(h.cleared[0].urls),plain(h.scene().catalog.bundles.map(b=>b.url)));
  assert.deepEqual(h.snapshot(),before);assert(!h.text().includes('Some model files require sign-in.'));
  // Asset retry does not restart the canvas or repeat its already-ready event.
  h.scene().onLoaded(bundle.id);h.render();assert(!h.education.options.disabled);
  h.scene().onFailure(bundle.id);h.render();h.button('Retry');assert(!h.text().includes('Check access again'));
 }
});

test('actual specimen dissection retains controls, gates practice, and clears access reasons on retry',()=>{
 for(const reason of ['sign-in','access-denied','unavailable']){
  const h=harness('KneeSpecimenView',api=>({specimen:api.kneeDefinition,assetBase:'/atlas-runtime/head-neck'}));
  h.ready();assert(!h.button('Practise identification').disabled);const before=h.snapshot();
  h.scene().onFailure(h.scene().catalog.bundles[0].id,reason);h.render();
  assert(h.button('Practise identification').disabled);assert.deepEqual(h.snapshot(),before);
  if(accessCopy[reason])assert(h.text().includes(accessCopy[reason]));
  h.button(accessCopy[reason]?'Check access again':'Retry').onClick();h.render();
  assert(h.button('Practise identification').disabled);assert.deepEqual(h.snapshot(),before);
  assert.equal(h.cleared.length,1);h.ready();assert(!h.button('Practise identification').disabled);
  h.scene().onFailure(h.scene().catalog.bundles[0].id);h.render();h.button('Retry');
 }
});

function practice(api){const definition=api.kneeDefinition,visibleIds=definition.surfaces.map(s=>s.id),initial=api.createIdentification(definition,visibleIds,()=>0.4);assert(initial);return{definition,visibleIds,initial,initialView:'anterior',onClose:()=>{}};}
test('actual identification feedback pauses answers, preserves the question, and recovers only after load',()=>{
 for(const reason of ['sign-in','access-denied','unavailable']){
  const h=harness('SpecimenIdentification',practice);h.ready();
  const before=h.snapshot(),id=h.scene().catalog.bundles[0].id;
  const answerId=h.props.initial.questions[0].targetId,name=h.props.definition.surfaces.find(s=>s.id===answerId).name;
  const oldAnswer=h.button(name);assert(!oldAnswer.disabled);
  h.scene().onFailure(id,reason);oldAnswer.onClick();h.render(); // No render needed to revoke stale answer callback.
  assert(!h.text().includes('Correct:'));assert(h.button(name).disabled);
  if(accessCopy[reason])assert(h.text().includes(accessCopy[reason]));
  assert(h.text().includes('Return to dissection to retry.'));assert.deepEqual(h.snapshot(),before);
  h.scene().onLoaded(id);h.render();assert(!h.button(name).disabled);assert(!h.text().includes('Some model files require sign-in.'));
  h.button(name).onClick();h.render();assert(h.text().includes('Correct:'));
 }
});

test('out-of-scope failed bundles do not produce access notices or prevent required-model readiness',()=>{
 for(const [component,props]of [['KneeSpecimenView',api=>({specimen:api.kneeDefinition})],['SpecimenIdentification',practice]]){
  const h=harness(component,props);h.ready();h.scene().onFailure('not-required','sign-in');h.render();
  assert(!h.text().includes('Some model files require sign-in.'));
  assert(!h.text().includes('Some specimen tissues could not load.'));
  if(component==='KneeSpecimenView')assert(!h.button('Practise identification').disabled);
  else assert(!h.button('Reveal answer').disabled);
 }
});
