import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {headLearningLinks} from '../lib/head-atlas-learning.ts';
import {headGuidedDestination,HEAD_FOCUS_PROTOCOL} from '../lib/head-guided-focus.ts';
import {HEAD_SELECTION_PROTOCOL,parseHeadSelection} from '../lib/head-live-selection.ts';

const require=createRequire(import.meta.url);
const source=readFileSync(process.env.HEAD_GUIDED_MODEL_BASELINE_SOURCE??new URL('../components/HeadAtlasGuidedModel.tsx',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
type Node={type:unknown;props:Record<string,any>};
type Props={initialHref:string;sourceRevision:string;coverage:unknown};
type Effect={kind:'layout'|'passive';create:()=>void|(()=>void);deps?:unknown[];cleanup?:()=>void};
const revisionA='a'.repeat(40),revisionB='b'.repeat(40);
const href=(conceptId:string)=>{const value=headLearningLinks({sequenceId:'brainstem',conceptId})?.atlasHref;assert(value);return value;};
const pons=href('brainstem-pons'),medulla=href('brainstem-medulla'),midbrain=href('brainstem-midbrain');
const props=(initialHref=pons,sourceRevision=revisionA):Props=>({initialHref,sourceRevision,coverage:'Synthetic coverage'});

function walk(value:unknown,predicate:(node:Node)=>boolean):Node|undefined{
  if(Array.isArray(value)){for(const item of value){const found=walk(item,predicate);if(found)return found;}return;}
  if(!value||typeof value!=='object'||!('props' in value))return;
  const node=value as Node;return predicate(node)?node:walk(node.props.children,predicate);
}

function harness(){
  const origin='https://atlas.example.test',sent:any[]=[],listeners=new Map<string,Set<(event:any)=>void>>();
  const timers=new Map<number,{callback:()=>void;delay:number}>();let timerId=0,uuid=0,writes=0;
  let pathname='/atlas/head-neck-3d',search=pons.slice(pathname.length),hash='';
  const entries=[pons];let historyIndex=0,assignments=0;
  const setUrl=(next:string)=>{const url=new URL(next,origin);pathname=url.pathname;search=url.search;hash=url.hash;};
  const pop=()=>{for(const listener of [...(listeners.get('popstate')??[])])listener({});};
  const location={origin,get pathname(){return pathname;},get search(){return search;},get hash(){return hash;},assign(){assignments++;}};
  const history={state:null,
    pushState(_state:unknown,_unused:string,next:string){entries.splice(historyIndex+1);entries.push(next);historyIndex=entries.length-1;setUrl(next);},
    replaceState(_state:unknown,_unused:string,next:string){entries[historyIndex]=next;setUrl(next);},
    back(){assert(historyIndex>0);setUrl(entries[--historyIndex]);pop();},
    forward(){assert(historyIndex<entries.length-1);setUrl(entries[++historyIndex]);pop();},
  };
  const mockWindow={location,history,setTimeout(callback:()=>void,delay:number){timers.set(++timerId,{callback,delay});return timerId;},clearTimeout(id:number){timers.delete(id);},
    addEventListener(name:string,listener:(event:any)=>void){if(!listeners.has(name))listeners.set(name,new Set());listeners.get(name)!.add(listener);},
    removeEventListener(name:string,listener:(event:any)=>void){listeners.get(name)?.delete(listener);}};
  const oldWindow=Object.getOwnPropertyDescriptor(globalThis,'window'),oldHistory=Object.getOwnPropertyDescriptor(globalThis,'history'),oldCrypto=Object.getOwnPropertyDescriptor(globalThis,'crypto');
  Object.defineProperty(globalThis,'window',{configurable:true,value:mockWindow});
  Object.defineProperty(globalThis,'history',{configurable:true,value:history});
  Object.defineProperty(globalThis,'crypto',{configurable:true,value:{randomUUID:()=>`commit-session-${++uuid}-abcd`}});
  const contentWindow={postMessage(packet:unknown,target:string){assert.equal(target,origin);sent.push(packet);}};
  const frameElement={contentWindow,parentElement:{querySelector:()=>null}};
  const slots:unknown[]=[],committed=new Map<number,Effect>();let cursor=0,pending=new Map<number,Effect>(),dirty=false,disposed=false;
  let currentProps=props(),tree!:Node;
  const same=(a:unknown[]|undefined,b:unknown[]|undefined)=>!!a&&!!b&&a.length===b.length&&a.every((item,index)=>Object.is(item,b[index]));
  function effect(kind:Effect['kind'],create:Effect['create'],deps?:unknown[]){pending.set(cursor++,{kind,create,deps});}
  const hooks={
    useState(initial:unknown){const index=cursor++;if(!(index in slots))slots[index]=initial;
      return [slots[index],(next:unknown)=>{writes++;if(!Object.is(slots[index],next)){slots[index]=next;dirty=true;}}];},
    useRef(initial:unknown){const index=cursor++;if(!(index in slots))slots[index]={current:initial};return slots[index];},
    useLayoutEffect:(create:Effect['create'],deps?:unknown[])=>effect('layout',create,deps),
    useEffect:(create:Effect['create'],deps?:unknown[])=>effect('passive',create,deps),
  };
  const navigation=function HeadAtlasLearningNavigation(){return null;};
  const teaching=function HeadAtlasReferenceTeaching(){return null;};
  const imports:Record<string,unknown>={react:hooks,'react/jsx-runtime':require('react/jsx-runtime'),
    './HeadAtlasLearningNavigation':{HeadAtlasLearningNavigation:navigation},
    './HeadAtlasReferenceTeaching':{HeadAtlasReferenceTeaching:teaching},
    './HeadTourPlayback':{HeadTourPlayback:function HeadTourPlayback(){return null;}},
    '../lib/head-guided-playback':require('../lib/head-guided-playback.ts'),
    '../lib/head-atlas-import':{HEAD_MANIFEST_SHA256:revisionA},
    '../lib/head-link-availability':{headLinksCurrent:()=>true},
    '../lib/head-live-selection':{HEAD_SELECTION_PROTOCOL,parseHeadSelection},
    '../lib/head-guided-focus':require('../lib/head-guided-focus.ts')};
  const mod={exports:{} as {HeadAtlasGuidedModel:(props:Props)=>Node}};
  new Function('require','module','exports',code)((id:string)=>{assert(Object.hasOwn(imports,id),id);return imports[id];},mod,mod.exports);
  function setup(item:Effect){const cleanup=item.create();item.cleanup=typeof cleanup==='function'?cleanup:undefined;}
  function cleanup(item:Effect){item.cleanup?.();item.cleanup=undefined;}
  function commit(){
    for(const kind of ['layout','passive'] as const){
      const changed=[...pending].filter(([index,item])=>item.kind===kind&&(!committed.has(index)||!same(committed.get(index)?.deps,item.deps)));
      for(const [index] of changed){const previous=committed.get(index);if(previous)cleanup(previous);}
      for(const [index,item] of changed){committed.set(index,item);setup(item);}
    }
  }
  function render(next=currentProps,shouldCommit=true){if(shouldCommit)currentProps=next;cursor=0;pending=new Map();const result=mod.exports.HeadAtlasGuidedModel(next);
    const iframe=walk(result,node=>node.type==='iframe');assert(iframe);iframe.props.ref.current=frameElement;
    if(shouldCommit){tree=result;commit();let cycles=0;while(dirty){assert(++cycles<20,'render loop');dirty=false;cursor=0;pending=new Map();tree=mod.exports.HeadAtlasGuidedModel(currentProps);commit();}}
    return result;}
  const nav=(value:Node=tree)=>{const node=walk(value,node=>node.type===navigation);assert(node);return node.props;};
  const iframe=(value:Node=tree)=>{const node=walk(value,node=>node.type==='iframe');assert(node);return node;};
  const retry=(value:Node=tree)=>walk(nav(value).status,node=>node.type==='button')?.props.onClick as (()=>void)|undefined;
  const session=()=>String(sent.filter(packet=>packet.type===HEAD_SELECTION_PROTOCOL+'-request').at(-1)?.session);
  const selected=(conceptId:string,sequence:number,sourceRevision=revisionA,sessionId=session())=>({type:HEAD_SELECTION_PROTOCOL,version:1,revision:sourceRevision,session:sessionId,sequence,status:'selected',selection:headGuidedDestination(href(conceptId))!.target});
  const ack=(command:number,sourceRevision=revisionA,sessionId=session())=>({type:HEAD_FOCUS_PROTOCOL+'-result',version:1,revision:sourceRevision,session:sessionId,command,status:'accepted'});
  const deliver=(data:unknown,source:unknown=contentWindow,from=origin)=>{for(const listener of [...(listeners.get('message')??[])])listener({data,source,origin:from});render();};
  const command=()=>sent.filter(packet=>packet.type===HEAD_FOCUS_PROTOCOL).at(-1);
  const mark=()=>({entries:entries.slice(),url:pathname+search+hash,writes,sent:sent.length,timers:[...timers.keys()],assignments});
  function unchanged(before:ReturnType<typeof mark>){assert.deepEqual(mark(),before,'retired or speculative callback must not mutate history, state, session, timers or commands');}
  // Replay cleanup/setup for the current commit, not a separate replacement
  // render. A later actual render must retire this commit's handlers normally.
  function replay(){for(const kind of ['layout','passive'] as const){const items=[...committed.values()].filter(item=>item.kind===kind);items.forEach(cleanup);items.forEach(setup);}if(dirty)render();}
  function unmount(){if(disposed)return;for(const kind of ['layout','passive'] as const)for(const item of committed.values())if(item.kind===kind)cleanup(item);committed.clear();disposed=true;}
  function close(){unmount();if(oldWindow)Object.defineProperty(globalThis,'window',oldWindow);else delete (globalThis as any).window;
    if(oldHistory)Object.defineProperty(globalThis,'history',oldHistory);else delete (globalThis as any).history;
    if(oldCrypto)Object.defineProperty(globalThis,'crypto',oldCrypto);else delete (globalThis as any).crypto;}
  return {render,nav,iframe,retry,selected,ack,deliver,command,session,mark,unchanged,replay,unmount,close,sent,timers,entries,history,listeners,contentWindow,get url(){return pathname+search+hash;},get writes(){return writes;},get assignments(){return assignments;}};
}

test('speculative navigation is inert and visible committed navigation survives it',()=>{
  const view=harness();try{
    const visible=view.render(),visibleNavigate=view.nav(visible).onNavigate,originalFrame=view.iframe(visible);
    const speculative=view.render(props(pons,revisionB),false),speculativeNavigate=view.nav(speculative).onNavigate;
    const before=view.mark();speculativeNavigate(midbrain);view.unchanged(before);
    assert.equal(visibleNavigate(medulla),true);view.render();
    assert.equal(view.url,medulla);assert.equal(view.iframe().props.src,originalFrame.props.src);
    assert.equal(view.iframe().props.ref,originalFrame.props.ref,'native iframe element remains mounted');
  }finally{view.close();}
});

test('replaced and unmounted navigation and retry callbacks are inert',()=>{
  const view=harness();try{
    const first=view.render(),retainedNavigate=view.nav(first).onNavigate;
    const timeout=[...view.timers.values()].at(-1);assert(timeout);timeout.callback();view.render();
    const retainedRetry=view.retry();assert(retainedRetry,'unanswered handshake exposes a retry');
    view.render(props(pons,revisionB));
    let before=view.mark();retainedNavigate(medulla);retainedRetry();view.unchanged(before);
    const fresh=view.nav().onNavigate;assert.equal(fresh(medulla),true);view.render();assert.equal(view.url,medulla);
    const lastNavigate=view.nav().onNavigate;view.unmount();before=view.mark();
    retainedNavigate(pons);retainedRetry();lastNavigate(pons);view.unchanged(before);
    assert.equal(view.listeners.get('message')?.size,0);assert.equal(view.listeners.get('popstate')?.size,0);assert.equal(view.timers.size,0);
  }finally{view.close();}
});

test('retained and speculative iframe load and error callbacks cannot replace a committed session',()=>{
  const view=harness();try{
    const first=view.render(),load=view.iframe(first).props.onLoad,error=view.iframe(first).props.onError;
    const speculative=view.render(props(pons,revisionB),false),specLoad=view.iframe(speculative).props.onLoad,specError=view.iframe(speculative).props.onError;
    let before=view.mark();specLoad();specError();view.unchanged(before);
    view.render(props(pons,revisionB));before=view.mark();load();error();view.unchanged(before);
    const activeLoad=view.iframe().props.onLoad;activeLoad();view.render();
    assert.notDeepEqual(view.mark(),before,'committed iframe load reconnects');
    view.unmount();before=view.mark();activeLoad();view.iframe().props.onError();view.unchanged(before);
  }finally{view.close();}
});

test('abandoned revision cannot take over listener routing; current ACK and newer matching snapshot are both required',()=>{
  const view=harness();try{
    const visible=view.render(),originalFrame=view.iframe(visible);
    view.render(props(pons,revisionB),false);
    view.deliver(view.selected('brainstem-medulla',1));
    const command=view.command();assert(command);
    assert.equal(command.revision,revisionA,'listener uses committed source revision after abandoned render');
    assert.equal(view.nav().comparisonReady,false);
    view.deliver(view.ack(command.command));assert.equal(view.nav().comparisonReady,false,'ACK alone does not unlock');
    view.deliver(view.selected('brainstem-pons',2,revisionA,'old-session-123456'));
    assert.equal(view.nav().comparisonReady,false,'stale session cannot unlock');
    view.deliver(view.selected('brainstem-pons',2),view.contentWindow,'https://other.test');
    assert.equal(view.nav().comparisonReady,false,'other origin cannot unlock');
    view.deliver(view.selected('brainstem-pons',2));assert.equal(view.nav().comparisonReady,true);
    assert.equal(view.iframe().props.ref,originalFrame.props.ref);
  }finally{view.close();}
});

test('StrictMode effect replay preserves committed native history navigation and retires it on cleanup',()=>{
  const view=harness();try{
    const first=view.render(),oldNavigate=view.nav(first).onNavigate;
    view.replay();assert.equal(oldNavigate(medulla),true);view.render();
    assert.equal(view.url,medulla);assert.deepEqual(view.entries,[pons,medulla]);
    view.history.back();view.render();assert.equal(view.url,pons);assert.equal(view.nav().position.conceptId,'brainstem-pons');
    const currentNavigate=view.nav().onNavigate;view.unmount();const before=view.mark();
    oldNavigate(midbrain);currentNavigate(midbrain);view.unchanged(before);
    assert.equal(view.assignments,0);
  }finally{view.close();}
});
