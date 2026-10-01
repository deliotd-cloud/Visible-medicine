// Actual eye component/reducer callbacks; the shared hook lifecycle has its own suite.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {build} from './workspace-component-test-build.mjs';

const require=createRequire(import.meta.url), React=require('react');
const actualLink=await import('vinext/shims/link');
const built=await build({stdin:{contents:`export {default as EyeLayers,EyeLayerView} from './app/eye-layers'; export {bodyDisplayCatalog} from './lib/body-display-catalog'; export {eyeLayersFor,eyeNotes} from './lib/eye-layers'; export {default as raw} from './public/models/bodyparts3d/full-body/catalog.json';`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,platform:'node',format:'cjs',write:false,plugins:[{name:'education-component-boundaries',setup(b){
  b.onLoad({filter:/body-scene\.tsx$/},()=>({contents:'export const BodyScene=()=>null; export const retryBodyAssets=()=>{};',loader:'tsx'}));
  b.onLoad({filter:/nested-teaching\.tsx$/},()=>({contents:'export const NestedTeaching=()=>null;',loader:'tsx'}));
  b.onLoad({filter:/nested-education-link\.ts$/},()=>({contents:'export const useNestedEducationLink=options=>globalThis.education.use(options);',loader:'ts'}));
}}]});
let slots=[],cursor=0,checks=0;
const state=value=>{const i=cursor++;if(!(i in slots))slots[i]=typeof value==='function'?value():value;return [slots[i],next=>slots[i]=typeof next==='function'?next(slots[i]):next];};
const shim={...React,useState:state,useRef:value=>state(()=>({current:value}))[0],useEffect:()=>{},useLayoutEffect:()=>{},useReducer:(reduce,arg,init)=>{const [value,set]=state(()=>init?init(arg):arg);return [value,action=>set(previous=>reduce(previous,action))];},useMemo:fn=>fn(),useCallback:fn=>fn};
const education={options:null,adapter:null,published:[],use(options){this.options=options;return {adapter:this.adapter,publish:id=>this.published.push(id)};}};
const scope={exports:{}};
runInNewContext(built.outputFiles[0].text,{module:scope,exports:scope.exports,require:id=>id==='react'?shim:id==='next/link'?{__esModule:true,...actualLink}:require(id),education,structuredClone});
const api=scope.exports, nodes=n=>!n||typeof n!=='object'?[]:Array.isArray(n)?n.flatMap(nodes):[n,...nodes(n.props?.children)];
const text=n=>typeof n==='string'||typeof n==='number'?String(n):!n?'':Array.isArray(n)?n.map(text).join(''):text(n.props?.children);
const check=(v,message)=>{checks++;assert(v,message);};
const same=(a,b,message)=>{checks++;assert.deepEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)),message);};
const catalog=api.bodyDisplayCatalog(api.raw);
const parents=catalog.structures.filter(s=>api.eyeLayersFor(s).length);
check(parents.length>=2,'Both current eye parents available');
for(const parent of parents){
  slots=[];education.adapter=null;education.published=[];
  let tree;
  const render=(extra={})=>{cursor=0;tree=api.EyeLayerView({parent,educationCatalog:catalog,...extra});};
  const scene=()=>nodes(tree).find(n=>n.props?.onRendererHealth)?.props;
  const button=label=>nodes(tree).find(n=>n.props?.onClick&&text(n).trim()===label)?.props;
  const link=()=>nodes(tree).find(n=>n.props?.link);
  render();check(education.options.disabled,'Loading pauses link');same(education.options.allowedIds,[]);check(!link(),'No empty disclosure');
  same(education.options.catalog,catalog);same(education.options.parent,parent);same(education.options.study,'eye');same(education.options.layers,scene().structures);
  scene().onLoaded();scene().onRendererHealth('ready');render();check(!education.options.disabled);
  same(education.options.allowedIds,scene().structures.filter(s=>!scene().hiddenIds.includes(s.id)).map(s=>s.id));
  education.adapter={id:'synthetic'};render();check(link(),'Connected adapter exposes compact disclosure');
  const target=scene().structures.find(s=>education.options.allowedIds.includes(s.id)&&s.id!==scene().selectedId);
  check(target,'Visible selection target exists');
  education.options.onSelect(target.id);render();same(scene().selectedId,target.id);same(education.published,[],'Incoming does not publish');
  button(api.eyeNotes[target.kind].label).onClick();render();same(education.published,[target.id],'User button publishes');
  scene().onSelect(target.id);render();same(education.published,[target.id,target.id],'Scene selection publishes');
  const toggle=nodes(tree).find(n=>n.props?.['aria-label']==='Show '+target.name.toLowerCase()).props;
  toggle.onCheckedChange(false);render();check(!education.options.allowedIds.includes(target.id),'Hidden child denied');
  button('Undo layers').onClick();render();check(education.options.allowedIds.includes(target.id),'Undo restores visibility');
  button('Fade others').onClick();render();check(education.options.disabled,'Isolation pauses');button('Fade others').onClick();render();check(!education.options.disabled);
  const cut=nodes(tree).find(n=>n.props?.onChange&&n.props?.value?.plane==='off').props;
  cut.onChange({...cut.value,plane:'sagittal'});render();check(education.options.disabled,'Cutaway pauses');button('Restore whole view').onClick();render();check(!education.options.disabled);
  for(const health of ['starting','lost','restoring','failed']){scene().onRendererHealth(health);render();check(education.options.disabled,health+' pauses');}
  scene().onRendererHealth('ready');scene().onFailure();render();check(education.options.disabled,'Asset failure pauses');same(education.options.allowedIds,[]);
  button('Retry').onClick();render();check(education.options.disabled,'Retry waits for load');scene().onLoaded();render();check(!education.options.disabled);
  render({initialSelectedId:'foreign-child'});check(education.options.disabled,'Unresolved incoming target fails closed');
  const wrapper=api.EyeLayers({parent,educationCatalog:catalog,onClose:()=>{}});
  same(nodes(wrapper).find(n=>n.type===api.EyeLayerView).props.educationCatalog,catalog,'Wrapper forwards trusted catalog');
  slots=[];render({initialSelectedId:target.id});scene().onLoaded();scene().onRendererHealth('ready');render({initialSelectedId:target.id});
  same(scene().selectedId,target.id,'Initial selection preserved');check(education.options.disabled,'Initial isolated teaching view pauses');
  slots=[];render({educationCatalog:undefined});check(education.options.catalog===undefined,'Standalone has no supplied Education catalog');
  slots=[];render({parent:{...parent,sources:[]}});check(education.options.disabled,'Stale parent pauses');same(education.options.allowedIds,[]);check(text(tree).includes('source binding has changed'));
}
console.log(`Eye Education component: ${checks} checks passed (controlled hook boundary; no browser/clinical acceptance).`);
