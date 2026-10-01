import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {build} from './workspace-component-test-build.mjs';
const require=createRequire(import.meta.url),React=require('react'),actualLink=await import('vinext/shims/link');
const built=await build({stdin:{contents:`export {EyeLayerView} from './app/eye-layers';
 export {bodyDisplayCatalog} from './lib/body-display-catalog';export {eyeLayersFor} from './lib/eye-layers';
 export {eyeLayerGuide} from './lib/eye-layer-guide';export {default as raw} from './public/models/bodyparts3d/full-body/catalog.json';`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,platform:'node',format:'cjs',write:false,
 plugins:[{name:'controlled-eye-boundaries',setup(b){
  b.onLoad({filter:/body-scene\.tsx$/},()=>({contents:'export const BodyScene=()=>null;export const retryBodyAssets=()=>{};',loader:'tsx'}));
  b.onLoad({filter:/nested-teaching\.tsx$/},()=>({contents:'export const NestedTeaching=()=>null;',loader:'tsx'}));
  b.onLoad({filter:/nested-education-link\.ts$/},()=>({contents:'export const useNestedEducationLink=options=>globalThis.education.use(options);',loader:'ts'}));
 }}]});
let slots=[],cursor=0,after=[],checks=0;
const state=value=>{const i=cursor++;if(!(i in slots))slots[i]=typeof value==='function'?value():value;
 return [slots[i],next=>slots[i]=typeof next==='function'?next(slots[i]):next];};
const sameDeps=(a,b)=>a&&b&&a.length===b.length&&a.every((value,i)=>Object.is(value,b[i]));
const memo=(fn,deps)=>{const i=cursor++;if(!sameDeps(slots[i]?.deps,deps))slots[i]={deps,value:fn()};return slots[i].value;};
const effect=(fn,deps)=>{const i=cursor++;if(!sameDeps(slots[i]?.deps,deps)){slots[i]?.cleanup?.();slots[i]={deps};after.push(()=>slots[i].cleanup=fn());}};
const shim={...React,useState:state,useMemo:memo,useCallback:(fn,deps)=>memo(()=>fn,deps),useRef:value=>state(()=>({current:value}))[0],
 useEffect:effect,useLayoutEffect:effect,useReducer:(reduce,arg,init)=>{const[value,set]=state(()=>init?init(arg):arg);return[value,action=>set(old=>reduce(old,action))];}};
const education={options:null,published:[],use(options){this.options=options;return{adapter:null,publish:id=>this.published.push(id)};}};
const events=new Map(),preference={matches:true,addEventListener:(name,fn)=>events.set('motion:'+name,fn),removeEventListener:name=>events.delete('motion:'+name)};
const document={hidden:false,addEventListener:(name,fn)=>events.set(name,fn),removeEventListener:name=>events.delete(name)};
const scope={exports:{}};
runInNewContext(built.outputFiles[0].text,{module:scope,exports:scope.exports,
 require:id=>id==='react'?shim:id==='next/link'?{__esModule:true,...actualLink}:require(id),
 education,structuredClone,window:{matchMedia:()=>preference},document});
const api=scope.exports,nodes=n=>!n||typeof n!=='object'?[]:Array.isArray(n)?n.flatMap(nodes):[n,...nodes(n.props?.children)];
const text=n=>typeof n==='string'||typeof n==='number'?String(n):!n?'':Array.isArray(n)?n.map(text).join(''):text(n.props?.children);
const check=(value,message)=>{checks++;assert(value,message);};
const same=(a,b,message)=>{checks++;assert.deepEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)),message);};
const catalog=api.bodyDisplayCatalog(api.raw),parents=catalog.structures.filter(s=>api.eyeLayersFor(s).length);
for(const parent of parents){
 slots=[];events.clear();preference.matches=true;document.hidden=false;education.published=[];let tree;
 const render=(extra={})=>{cursor=0;after=[];tree=api.EyeLayerView({parent,educationCatalog:catalog,...extra});after.forEach(fn=>fn());};
 const scene=()=>nodes(tree).find(n=>n.props?.onRendererHealth)?.props;
 const button=label=>nodes(tree).find(n=>n.props?.onClick&&text(n).trim()===label)?.props;
 render();render();check(button('Start eye walkthrough').disabled,'Loading denies start');
 button('Start eye walkthrough').onClick();render();check(!button('End walkthrough'),'Callback also denies loading start');
 scene().onLoaded();scene().onRendererHealth('ready');render();check(!button('Start eye walkthrough').disabled,'Loaded ready guide admitted');
 // Save a non-default manual state and a real-shaped camera snapshot.
 const preset=nodes(tree).find(n=>n.props?.onValueChange&&n.props.value==='anterior'&&nodes(n).some(child=>child.props?.id==='eye-layer-preset'));
 preset.props.onValueChange('lens');render();
 const slider=nodes(tree).find(n=>n.props?.['aria-label']==='Eye component separation');slider.props.onValueChange([37]);render();
 const before={selectedId:scene().selectedId,hidden:scene().hiddenIds,explode:scene().explode,layout:scene().layout,view:scene().view,inspection:scene().inspection};
 const camera={direction:[0.2672612419,0.5345224838,0.8017837257],up:[0,1,0],pan:[0.1,0.2,0],scale:1.25};
 scene().cameraCapture.current=camera;
 button('Start eye walkthrough').onClick();render();
 const guide=api.eyeLayerGuide(parent);
 for(const [index,step]of guide.steps.entries()){
  same(scene().selectedId,step.selectedId,'Exact selected child');same(scene().view,step.view,'Requested camera direction');
  same(scene().hiddenIds,scene().structures.filter(s=>!step.ids.includes(s.id)).map(s=>s.id),'Only preset source children shown');
  same(scene().explode,0,'No tissue translation');same(scene().layout,'spatial','Assembled source positions');
  check(scene().tourLocked,'Tour camera protected');check(scene().isolated,'Context surfaces faded');
  same(scene().transitionMs,0,'Reduced motion honoured');check(education.options.disabled,'Imaging sync paused for guidance');
  check(nodes(tree).some(n=>n.type==='fieldset'&&n.props.disabled),'Manual controls disabled');
  check(text(tree).includes(step.caption),'Full caption rendered');
  same(button('Previous step').disabled,index===0,'First boundary');same(button('Next step').disabled,index===guide.steps.length-1,'Last boundary');
  const selected=scene().selectedId;scene().onSelect(scene().structures.find(s=>s.id!==selected).id);render();same(scene().selectedId,selected,'Scene selections cannot override guidance');
  same(education.published,[],'Guide changes never publish scan selections');
  if(index===0){
   preference.matches=false;events.get('motion:change')();render();same(scene().transitionMs,1800,'Smooth sweep enabled on preference change');
   document.hidden=true;events.get('visibilitychange')();render();check(scene().transitionPaused,'Hidden page pauses');
   button('Next step').onClick();render();same(scene().selectedId,selected,'Hidden callback denied');
   document.hidden=false;events.get('visibilitychange')();scene().onRendererHealth('lost');render();check(scene().transitionPaused,'Renderer loss pauses');
   button('Next step').onClick();render();same(scene().selectedId,selected,'Lost renderer callback denied');
   scene().onRendererHealth('ready');render();check(!scene().transitionPaused,'Recovered renderer resumes');
   preference.matches=true;events.get('motion:change')();render();
  }
  if(index<guide.steps.length-1){button('Next step').onClick();render();}
 }
 button('Next step').onClick();render();same(scene().selectedId,guide.steps.at(-1).selectedId,'Out-of-range callback denied');
 button('End walkthrough').onClick();render();
 same({selectedId:scene().selectedId,hidden:scene().hiddenIds,explode:scene().explode,layout:scene().layout,view:scene().view,inspection:scene().inspection},before,'Manual state restored unchanged');
 same(scene().cameraRestore.current,camera,'Exact prior camera supplied for restoration');check(!scene().tourLocked,'Camera unlocked');
 same(scene().transitionMs,0,'Ordinary camera unchanged');check(!button('End walkthrough'),'Guide ended');
 const launch=button('Start eye walkthrough');let focused=false;launch.ref.current={focus(){focused=true;}};
 button('Start eye walkthrough').onClick();render();button('End walkthrough').onClick();render();check(focused,'Focus returns to launcher');
 // Parent or incoming selection mismatch must not start a guide.
 slots=[];render({initialSelectedId:'foreign-child'});scene().onLoaded();scene().onRendererHealth('ready');render({initialSelectedId:'foreign-child'});
 check(button('Start eye walkthrough').disabled,'Foreign incoming selection fails closed');button('Start eye walkthrough').onClick();render({initialSelectedId:'foreign-child'});check(!button('End walkthrough'));
 slots=[];render({parent:{...parent,name:'altered parent'}});check(!button('Start eye walkthrough'),'Full binding mismatch denies guide');
 slots=[];render({initialGuidedLearningExpanded:true});
 check(nodes(tree).find(n=>n.type==='details'&&n.props.className==='eye-layer-guided-learning').props.open,'Library expands the existing walkthrough disclosure');
 check(!button('End walkthrough')&&button('Start eye walkthrough').disabled,'Expanded disclosure does not autoplay or bypass readiness');
 slots=[];render();
 check(!nodes(tree).find(n=>n.type==='details'&&n.props.className==='eye-layer-guided-learning').props.open,'Ordinary eye study retains compact default');
}
console.log(JSON.stringify({componentChecks:checks,parents:parents.length,smoothCameraShared:true,manualStatePreserved:true,browserAcceptance:false,clinicalApproval:false}));
