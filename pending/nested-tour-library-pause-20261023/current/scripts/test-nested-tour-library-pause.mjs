/* oxlint-disable react-hooks/rules-of-hooks -- controlled commit harness exercises production components */
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {dirname} from 'node:path';
import {test} from 'node:test';
import {runInNewContext} from 'node:vm';
import {build} from './workspace-component-test-build.mjs';

const baseline=process.argv.includes('--baseline');
const baselineChildren=process.argv.includes('--baseline-children');
const onlyKind=process.argv.find(arg=>arg.startsWith('--kind='))?.slice('--kind='.length);
const revision='7978478992f54ea68e0f53c3d195c459c7b80068';
const require=createRequire(import.meta.url),React=require('react');
const link=await import('vinext/shims/link');
const built=await build({stdin:{contents:`export {WholeBodyGuidedLearning} from './app/whole-body-guided-learning';
 export {EyeLayerView} from './app/eye-layers'; export {VentricularView} from './app/ventricles';
 export {bodyDisplayCatalog} from './lib/body-display-catalog';
 export {nestedGuidedStudyOptions} from './lib/nested-guided-learning';
 export {default as raw} from './public/models/bodyparts3d/full-body/catalog.json';`,
 resolveDir:process.cwd(),loader:'tsx'},bundle:true,platform:'node',format:'cjs',write:false,
 plugins:[{name:'controlled-boundaries',setup(api){
   if(baseline||baselineChildren)api.onLoad({filter:baseline?/[\\/]app[\\/](?:whole-body-guided-learning|eye-layers|ventricles)\.tsx$/:/[\\/]app[\\/](?:eye-layers|ventricles)\.tsx$/,namespace:'component-test'},args=>({
     contents:execFileSync('git',['show',`${revision}:app/${args.path.split(/[\\/]/).at(-1)}`],{encoding:'utf8'}),
     loader:'tsx',resolveDir:dirname(args.path)}));
   api.onLoad({filter:/body-scene\.tsx$/,namespace:'component-test'},()=>({contents:'export const BodyScene=()=>null;export const retryBodyAssets=()=>{};',loader:'tsx'}));
   api.onLoad({filter:/nested-teaching\.tsx$/,namespace:'component-test'},()=>({contents:'export const NestedTeaching=()=>null;',loader:'tsx'}));
   api.onLoad({filter:/nested-education-link\.ts$/,namespace:'component-test'},()=>({contents:'export const useNestedEducationLink=options=>globalThis.education.use(options);',loader:'ts'}));
   api.onLoad({filter:/lazy-body-teaching\.tsx$/,namespace:'component-test'},()=>({contents:'import {createContext} from "react";export const BodyTeachingVisibility=createContext(true);export const LazyBodyTeaching=()=>null;',loader:'tsx'}));
 }}]});

let active;
const changed=(before,after)=>!before||before.length!==after.length||before.some((item,i)=>!Object.is(item,after[i]));
const hooks=()=>({slots:[],cursor:0,layout:[],passive:[]});
const shim={...React,
 useId:()=>':nested:',useContext:()=>null,
 useState(initial){const h=active,i=h.cursor++;if(!(i in h.slots))h.slots[i]=typeof initial==='function'?initial():initial;
   return[h.slots[i],next=>h.slots[i]=typeof next==='function'?next(h.slots[i]):next];},
 useRef(initial){const h=active,i=h.cursor++;return h.slots[i]??= {current:initial};},
 useMemo(fn,deps){const h=active,i=h.cursor++;if(changed(h.slots[i]?.deps,deps))h.slots[i]={deps,value:fn()};return h.slots[i].value;},
 useCallback(fn,deps){return shim.useMemo(()=>fn,deps);},
 useReducer(reduce,arg,init){const[value,set]=shim.useState(()=>init?init(arg):arg);return[value,action=>set(old=>reduce(old,action))];},
 useLayoutEffect(fn,deps){const h=active,i=h.cursor++;if(changed(h.slots[i]?.deps,deps))h.layout.push(()=>{
   h.slots[i]?.cleanup?.();h.slots[i]={deps,cleanup:fn()};});},
 useEffect(fn,deps){const h=active,i=h.cursor++;if(changed(h.slots[i]?.deps,deps))h.passive.push(()=>{
   h.slots[i]?.cleanup?.();h.slots[i]={deps,cleanup:fn()};});},
};
const nodes=n=>!n||typeof n!=='object'?[]:Array.isArray(n)?n.flatMap(nodes):[n,...nodes(n.props?.children)];
const text=n=>typeof n==='string'||typeof n==='number'?String(n):!n?'':Array.isArray(n)?n.map(text).join(''):text(n.props?.children);
const render=(h,fn,commit=true)=>{active=h;h.cursor=0;h.layout=[];h.passive=[];const tree=fn();
 if(commit){h.layout.forEach(effect=>effect());if(commit!=='layout')h.passive.forEach(effect=>effect());}return tree;};
const timers=new Map(),events=new Map();let timerId=0;
const preference={matches:false,addEventListener:(name,fn)=>events.set(`motion:${name}`,fn),removeEventListener:name=>events.delete(`motion:${name}`)};
const document={hidden:false,addEventListener:(name,fn)=>events.set(name,fn),removeEventListener:name=>events.delete(name)};
const window={matchMedia:()=>preference,setTimeout(fn,delay){const id=++timerId;timers.set(id,{fn,delay});return id;},
 clearTimeout(id){timers.delete(id);},addEventListener:(name,fn)=>events.set(`window:${name}`,fn),removeEventListener:name=>events.delete(`window:${name}`)};
const dynamic=[];
const module={exports:{}};
runInNewContext(built.outputFiles[0].text,{module,exports:module.exports,window,document,structuredClone,crypto,
 education:{use:()=>({adapter:null,publish(){}})},require(id){
   if(id==='react')return shim;
   if(id==='next/dynamic'){return()=>{const component=function NestedDynamic(){};dynamic.push(component);return component;};}
   if(id==='next/link')return{__esModule:true,...link};
   return require(id);
 }});
const api=module.exports,catalog=api.bodyDisplayCatalog(api.raw);
const options=api.nestedGuidedStudyOptions(catalog);
const kinds=['eye','ventricles','cardiac'];
for(const kind of kinds)assert(options.some(option=>option.kind===kind),`${kind} admitted from real catalog`);

test('library signals reach each admitted nested tour and pause committed playback',()=>{
 let checks=0;
 for(const option of options){
   if(!kinds.includes(option.kind)||(onlyKind&&option.kind!==onlyKind))continue;
   timers.clear();events.clear();document.hidden=false;preference.matches=false;
   const parentHooks=hooks(),childHooks=hooks();let parentTree,tree;
   const parentRender=()=>parentTree=render(parentHooks,()=>api.WholeBodyGuidedLearning({catalog,onExit(){}}));
   parentRender();
   const select=nodes(parentTree).find(n=>n.type==='select'&&n.props?.['aria-label']==='Choose a tour');
   assert(select);select.props.onChange({target:{value:option.id}});parentRender();
   const dynamicNode=()=>nodes(parentTree).find(n=>dynamic.includes(n.type));
   assert(dynamicNode(),`real library renders ${option.id}`);
   assert.equal(dynamicNode().props.pauseRequest,0);
   const view=option.kind==='eye'?api.EyeLayerView:api.VentricularView;
   let props={...dynamicNode().props};
   const childRender=(commit=true)=>tree=render(childHooks,()=>view(props),commit);
   const scene=()=>nodes(tree).find(n=>n.props?.onRendererHealth)?.props;
   const button=label=>nodes(tree).find(n=>n.props?.onClick&&text(n).trim()===label)?.props;
   childRender();childRender();
   if(option.kind==='eye')scene().onLoaded();
   else for(const bundle of scene().catalog.bundles)scene().onLoaded(bundle.id);
   scene().onRendererHealth('ready');childRender();
   const play=button('Play full tour');assert(play,`${option.kind} play action`);play.onClick();childRender();
   assert.equal(timers.size,1,`${option.kind} timer active`);
   const stopText=()=>text(nodes(tree).find(n=>n.type==='section'&&n.props?.['aria-live']==='polite'))
     .replace('Pause full tour','').replace('Resume full tour','');
   const firstStop=stopText();
   [...timers.values()][0].fn();childRender();
   assert.notEqual(stopText(),firstStop,`${option.kind} reached a noninitial stop`);
   assert.equal(timers.size,1,`${option.kind} next timer active`);
   const before={selected:scene().selectedId,stop:stopText(),rate:nodes(tree).find(n=>n.type?.name==='TourSpeedControl')?.props.rate};
   const stale=[...timers.values()][0].fn;
   const picker=nodes(parentTree).find(n=>n.props?.className==='whole-body-tour-picker');
   picker.props.onFocusCapture();parentRender();props={...dynamicNode().props};
   assert.equal(props.pauseRequest,1,`${option.kind} focus signal wired`);
   childRender(false);assert.equal(timers.size,1,`${option.kind} render alone does not pause`);
   props={...props,pauseRequest:0};childRender();
   assert.equal(timers.size,1,`${option.kind} abandoned signal cannot poison playback`);
   props={...dynamicNode().props};childRender('layout');
   stale();childRender();childRender();
   assert.equal(timers.size,0,`${option.kind} committed attention clears timer`);
   assert.equal(button('Resume full tour')?.['aria-pressed'],false);
   assert.equal(scene().transitionPaused,true,`${option.kind} sweep paused`);
   assert.equal(scene().selectedId,before.selected,`${option.kind} stop preserved`);
   assert.equal(stopText(),before.stop,`${option.kind} caption preserved`);
   assert.equal(nodes(tree).find(n=>n.type?.name==='TourSpeedControl')?.props.rate,before.rate);
   stale();childRender();assert.equal(stopText(),before.stop,`${option.kind} old timer refused`);
   const discovery=nodes(parentTree).find(n=>n.props?.className==='whole-body-tour-discovery');
   discovery.props.onToggle({currentTarget:{open:false}});parentRender();childRender();
   assert.equal(timers.size,0,`${option.kind} closing discovery does not resume`);
   const search=nodes(parentTree).find(n=>n.type==='input'&&n.props?.type==='search');
   search.props.onChange({target:{value:'unlikely match'}});parentRender();childRender();
   assert.equal(timers.size,0,`${option.kind} filtering does not resume`);
   button('Resume full tour').onClick();childRender();assert.equal(timers.size,1,`${option.kind} explicit resume`);
   props={...props,pauseRequest:2};childRender(false);
   assert.equal(timers.size,1,`${option.kind} uncommitted next request leaves playback active`);
   props={...props,pauseRequest:1};childRender();
   assert.equal(timers.size,1,`${option.kind} abandoned next request cannot poison committed request`);
   for(const invalid of [undefined,NaN,Infinity,-1,0.5,Number.MAX_SAFE_INTEGER+1,'2',null,{},Symbol('invalid')]){
     props={...props,pauseRequest:invalid};childRender();assert.equal(timers.size,1,`${option.kind} invalid signal ignored`);
   }
   props={...props,pauseRequest:1};childRender();assert.equal(timers.size,1,`${option.kind} repeat ignored`);
   picker.props.onPointerDownCapture();parentRender();props={...dynamicNode().props};childRender();childRender();
   assert.equal(timers.size,0,`${option.kind} pointer signal pauses`);
   checks++;
 }
 assert(onlyKind?checks>=1:checks===4,`exercised ${checks} nested instances`);
 console.log(`Nested library pause: ${checks} admitted eye/ventricular/cardiac instances verified`);
});
