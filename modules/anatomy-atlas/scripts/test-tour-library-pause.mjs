/* oxlint-disable react-hooks/rules-of-hooks -- controlled hooks exercise both production components */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import {execFileSync} from 'node:child_process';
import {dirname} from 'node:path';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';
import { build } from './workspace-component-test-build.mjs';

const require = createRequire(import.meta.url), React = require('react');
const baseline=process.argv.includes('--baseline');
const baselineRevision='d9edc899c563eca055bf75ae4e5be8147f10ceb9';
const raw = JSON.parse(await readFile(new URL('../public/models/bodyparts3d/full-body/catalog.json', import.meta.url), 'utf8'));
const built = await build({ stdin: {
  contents: "export {WholeBodyGuidedLearning} from './app/whole-body-guided-learning'; export {RegionalGuidedLearning} from './app/regional-guided-learning'; export {bodyDisplayCatalog} from './lib/body-display-catalog';",
  loader: 'tsx', resolveDir: process.cwd(),
}, bundle: true, write: false, format: 'cjs', platform: 'node', loader: {'.css':'empty'}, plugins: [{name:'gpu-and-teaching-boundaries',setup(api){
  if(baseline)api.onLoad({filter:/[\\/]app[\\/](?:whole-body-guided-learning|regional-guided-learning)\.tsx$/},args=>({
    loader:'tsx',resolveDir:dirname(args.path),contents:execFileSync('git',['show',`${baselineRevision}:app/${args.path.split(/[\\/]/).at(-1)}`],{encoding:'utf8'}),
  }));
  api.onLoad({filter:/[\\/]app[\\/]body-scene\.tsx$/},()=>({loader:'tsx',contents:'export function BodyScene(){return null;} export function retryBodyAssets(){}'}));
  api.onLoad({filter:/[\\/]app[\\/]lazy-body-teaching\.tsx$/},()=>({loader:'tsx',contents:'import {createContext} from "react"; export const BodyTeachingVisibility=createContext(true); export function LazyBodyTeaching(){return null;}'}));
}}]});

const nodes = tree => !tree || typeof tree !== 'object' ? [] : Array.isArray(tree) ? tree.flatMap(nodes) : [tree,...nodes(tree.props?.children)];
const text = tree => tree == null ? '' : typeof tree === 'string' || typeof tree === 'number' ? String(tree) : Array.isArray(tree) ? tree.map(text).join('') : text(tree.props?.children);
const plain = value => JSON.parse(JSON.stringify(value));

function harness() {
  let active, dirty = false, mounted = true, lateUpdates = 0, parentTree, childTree, currentKey, timerId = 0, suspends = 0;
  const timers = new Map(), listeners = new Map();
  const parent = {slots:[],cursor:0,pending:[]}, child = {slots:[],cursor:0,pending:[]};
  const changed = (before,after) => !before || before.length !== after.length || before.some((item,i)=>!Object.is(item,after[i]));
  const shim = {...React,
    useId(){return ':library:';},
    useState(initial){const owner=active,i=owner.cursor++;if(!(i in owner.slots))owner.slots[i]=typeof initial==='function'?initial():initial;
      return [owner.slots[i],next=>{if(!mounted){lateUpdates++;return;}const value=typeof next==='function'?next(owner.slots[i]):next;if(!Object.is(value,owner.slots[i])){owner.slots[i]=value;dirty=true;}}];},
    useRef(initial){return active.slots[active.cursor++]??={current:initial};},
    useMemo(fn,deps){const owner=active,i=owner.cursor++;if(changed(owner.slots[i]?.deps,deps))owner.slots[i]={deps,value:fn()};return owner.slots[i].value;},
    useCallback(fn,deps){return shim.useMemo(()=>fn,deps);},
    useEffect(fn,deps){const owner=active,i=owner.cursor++;if(changed(owner.slots[i]?.deps,deps))owner.pending.push(()=>{owner.slots[i]?.cleanup?.();owner.slots[i]={deps,cleanup:fn()};});},
    useLayoutEffect(fn,deps){return shim.useEffect(fn,deps);},
  };
  const preference={matches:false,addEventListener(){},removeEventListener(){}};
  const doc={hidden:false,activeElement:null,body:{},addEventListener(event,fn){listeners.set(event,fn);},removeEventListener(event){listeners.delete(event);}};
  const win={matchMedia:()=>preference,setTimeout(fn,delay){const id=++timerId;timers.set(id,{fn,delay});return id;},clearTimeout(id){timers.delete(id);},addEventListener(event,fn){listeners.set(event,fn);},removeEventListener(event){listeners.delete(event);}};
  const module={exports:{}};
  runInNewContext(built.outputFiles[0].text,{module,exports:module.exports,window:win,document:doc,structuredClone,crypto,
    require(id){if(id==='react')return shim;if(id==='next/dynamic')return ()=> 'BodyScene';return require(id);}});
  const api=module.exports,catalog=api.bodyDisplayCatalog(raw),props={catalog,region:'whole-body',onExit(){},assetBase:'/atlas-runtime/head-neck',pausedImaging:{suspend(){suspends++;},setStop(){}}};
  function component(owner,fn){active=owner;owner.cursor=0;owner.pending=[];const result=fn();for(const effect of owner.pending)effect();return result;}
  function render(){let passes=0;do{dirty=false;parentTree=component(parent,()=>api.WholeBodyGuidedLearning(props));
    const selected=nodes(parentTree).find(n=>n.type===api.RegionalGuidedLearning);assert(selected,'selected regional tour');
    if(currentKey!==selected.key){for(const slot of child.slots)slot?.cleanup?.();child.slots=[];currentKey=selected.key;}
    childTree=component(child,()=>api.RegionalGuidedLearning(selected.props));
    assert(++passes<20,'stable render');
  }while(dirty);return {parentTree,childTree};}
  const findParent=(type,predicate=()=>true)=>{const found=nodes(parentTree).filter(n=>n.type===type&&predicate(n));assert.equal(found.length,1);return found[0];};
  const findChild=predicate=>{const found=nodes(childTree).filter(predicate);assert.equal(found.length,1);return found[0];};
  const scene=()=>findChild(n=>n.type==='BodyScene').props;
  const button=label=>findChild(n=>n.props?.onClick&&text(n)===label).props;
  const click=label=>{const control=button(label);assert(!control.disabled,label+' enabled');control.onClick();render();};
  const ready=()=>{const s=scene();for(const id of new Set(s.structures.map(item=>item.bundle)))s.onLoaded(id);s.onRendererHealth('ready');render();};
  const picker=()=>findParent('div',n=>n.props.className==='whole-body-tour-picker');
  const search=()=>findParent('input',n=>n.props.type==='search');
  const filter=()=>findParent('select',n=>String(n.props.id).endsWith('-region'));
  const tourSelect=()=>findParent('select',n=>String(n.props.id).endsWith('-tour'));
  const discovery=()=>findParent('details',n=>n.props.className==='whole-body-tour-discovery');
  const selected=()=>nodes(parentTree).find(n=>n.type===api.RegionalGuidedLearning);
  render();
  return {render,ready,click,scene,button,picker,search,filter,tourSelect,discovery,selected,timers,
    currentKey:()=>currentKey,lateUpdates:()=>lateUpdates,suspends:()=>suspends,
    unmount(){for(const slot of child.slots)slot?.cleanup?.();for(const slot of parent.slots)slot?.cleanup?.();mounted=false;},
    snapshot(){return {key:currentKey,reset:scene().reset,selectedId:scene().selectedId,frame:plain(scene().presetBounds),structures:scene().structures.map(s=>s.id)};},
  };
}

test('library attention pauses active child without resetting its stop, source or camera',()=>{
  const h=harness();h.ready();h.click('Start guided tour');h.click('Next');h.click('Play');
  assert.equal(h.timers.size,1);const first= h.snapshot();const stale=[...h.timers.values()][0].fn;
  assert.equal(first.reset,1,'Exercise preservation of a noninitial stop');
  const beforeBrowsing=h.suspends();
  h.search().props.onChange({target:{value:'thorax'}});h.filter().props.onChange({target:{value:'thorax'}});h.render();
  assert.deepEqual(h.snapshot(),first,'programmatic filtering preserves player');
  assert.equal(h.timers.size,1,'filter state alone does not pause playback');
  assert.equal(h.suspends(),beforeBrowsing,'Programmatic filters alone do not alter imaging consent');
  assert.equal(typeof h.picker().props.onFocusCapture,'function','Library attention needs a playback pause boundary');
  h.picker().props.onFocusCapture();h.render();
  assert(h.suspends()>beforeBrowsing,'Active interaction revokes the previous imaging stop');
  assert.deepEqual(h.snapshot(),first);assert.equal(h.timers.size,0);assert.equal(h.button('Play')['aria-pressed'],false);
  assert.equal(h.scene().transitionPaused,true);stale();h.render();assert.deepEqual(h.snapshot(),first,'stale timeout cannot advance');
  h.click('Play');assert.equal(h.timers.size,1);
  h.picker().props.onPointerDownCapture();h.render();assert.equal(h.timers.size,0);assert.deepEqual(h.snapshot(),first);
  h.click('Play');assert.equal(h.timers.size,1);
  h.discovery().props.onToggle({currentTarget:{open:true}});h.render();assert.equal(h.timers.size,0);assert.deepEqual(h.snapshot(),first);
  h.discovery().props.onToggle({currentTarget:{open:false}});h.render();assert.equal(h.timers.size,0,'Closing discovery does not resume');
  h.search().props.onChange({target:{value:'thorax'}});h.filter().props.onChange({target:{value:'thorax'}});h.render();
  assert.deepEqual(h.snapshot(),first,'filtering alone preserves player');assert.equal(h.timers.size,0);
  h.click('Play');assert.equal(h.timers.size,1,'explicit Play resumes after browsing');
  const other=nodes(h.tourSelect()).find(n=>n.type==='option'&&n.props.value&&n.props.value!==h.tourSelect().props.value&&!n.props.disabled);
  assert(other);h.tourSelect().props.onChange({target:{value:other.props.value}});h.render();
  assert.notEqual(h.currentKey(),first.key);assert.equal(h.timers.size,0);assert(h.button('Start guided tour').disabled,'new source waits for load');
  h.ready();h.click('Start guided tour');h.click('Play');
  const afterUnmount=[...h.timers.values()][0].fn;
  h.unmount();assert.equal(h.timers.size,0);afterUnmount();stale();assert.equal(h.lateUpdates(),0);
});
