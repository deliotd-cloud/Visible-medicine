import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {headLearningLinks} from '../lib/head-atlas-learning.ts';
import {headGuidedDestination,HEAD_FOCUS_PROTOCOL} from '../lib/head-guided-focus.ts';
import {HEAD_SELECTION_PROTOCOL,parseHeadSelection} from '../lib/head-live-selection.ts';
import {createHeadTourPlaybackController} from '../lib/head-tour-playback.ts';

const require=createRequire(import.meta.url);
const revision='a'.repeat(40);
const href=(id:string)=>{const value=headLearningLinks({sequenceId:'brainstem',conceptId:id})?.atlasHref;assert(value);return value;};
const midbrain=href('brainstem-midbrain'),pons=href('brainstem-pons'),medulla=href('brainstem-medulla');
const raw=readFileSync(process.env.HEAD_MODEL_PLAYBACK_BASELINE_SOURCE??new URL('../components/HeadAtlasGuidedModel.tsx',import.meta.url),'utf8');
const code=ts.transpileModule(raw,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText.replaceAll('import.meta.url',JSON.stringify('file:///synthetic/head-guided-model-playback.test.ts'));
type Node={type:unknown;props:Record<string,any>};
type Effect={kind:'layout'|'passive';create:()=>void|(()=>void);deps?:unknown[];cleanup?:()=>void};
function walk(value:unknown,predicate:(node:Node)=>boolean):Node|undefined{
  if(Array.isArray(value)){for(const part of value){const found=walk(part,predicate);if(found)return found;}return;}
  if(!value||typeof value!=='object'||!('props'in value))return;
  const node=value as Node;return predicate(node)?node:walk(node.props.children,predicate);
}

function harness(initialHref=midbrain){
  const origin='https://atlas.example.test',sent:any[]=[],listeners=new Map<string,Set<(event:any)=>void>>();
  const timers=new Map<number,{callback:()=>void;delay:number}>();let timerId=0,uuid=0;
  let pathname='/atlas/head-neck-3d',search=initialHref.slice(pathname.length),hash='';
  const entries=[initialHref];let historyIndex=0,assignments=0,focuses=0;
  const setUrl=(next:string)=>{const url=new URL(next,origin);pathname=url.pathname;search=url.search;hash=url.hash;};
  const pop=()=>{for(const listener of [...(listeners.get('popstate')??[])])listener({});};
  const history={state:null,
    pushState(_state:unknown,_unused:string,next:string){entries.splice(historyIndex+1);entries.push(next);historyIndex=entries.length-1;setUrl(next);},
    replaceState(_state:unknown,_unused:string,next:string){entries[historyIndex]=next;setUrl(next);},
    back(){assert(historyIndex>0);setUrl(entries[--historyIndex]);pop();},
  };
  const oldWindow=Object.getOwnPropertyDescriptor(globalThis,'window'),oldHistory=Object.getOwnPropertyDescriptor(globalThis,'history'),oldCrypto=Object.getOwnPropertyDescriptor(globalThis,'crypto');
  Object.defineProperty(globalThis,'window',{configurable:true,value:{location:{origin,get pathname(){return pathname;},get search(){return search;},get hash(){return hash;},assign(){assignments++;}},history,
    setTimeout(callback:()=>void,delay:number){timers.set(++timerId,{callback,delay});return timerId;},clearTimeout(id:number){timers.delete(id);},
    addEventListener(name:string,listener:(event:any)=>void){if(!listeners.has(name))listeners.set(name,new Set());listeners.get(name)!.add(listener);},
    removeEventListener(name:string,listener:(event:any)=>void){listeners.get(name)?.delete(listener);}}});
  Object.defineProperty(globalThis,'history',{configurable:true,value:history});
  Object.defineProperty(globalThis,'crypto',{configurable:true,value:{randomUUID:()=>`model-playback-${++uuid}-abcd`}});
  const contentWindow={postMessage(packet:unknown,target:string){assert.equal(target,origin);sent.push(packet);}};
  const frameElement={contentWindow,parentElement:{querySelector:()=>({focus:()=>focuses++})}};
  const slots:unknown[]=[],effects=new Map<number,Effect>();let cursor=0,pending=new Map<number,Effect>(),dirty=false,disposed=false;
  let current={initialHref,sourceRevision:revision,coverage:'Synthetic coverage'},tree!:Node;
  const same=(a?:unknown[],b?:unknown[])=>!!a&&!!b&&a.length===b.length&&a.every((v,i)=>Object.is(v,b[i]));
  const effect=(kind:Effect['kind'])=>(create:Effect['create'],deps?:unknown[])=>{pending.set(cursor++,{kind,create,deps});};
  const hooks={useState(initial:unknown){const i=cursor++;if(!(i in slots))slots[i]=initial;return[slots[i],(next:unknown)=>{if(!Object.is(slots[i],next)){slots[i]=next;dirty=true;}}];},
    useRef(initial:unknown){const i=cursor++;if(!(i in slots))slots[i]={current:initial};return slots[i];},
    useLayoutEffect:effect('layout'),useEffect:effect('passive')};
  const navigation=function HeadAtlasLearningNavigation(){return null;};
  const toolbar=function HeadTourPlayback(){return null;};
  const imports:Record<string,unknown>={react:hooks,'react/jsx-runtime':require('react/jsx-runtime'),
    './HeadAtlasLearningNavigation':{HeadAtlasLearningNavigation:navigation},
    './HeadAtlasReferenceTeaching':{HeadAtlasReferenceTeaching:function HeadAtlasReferenceTeaching(){return null;}},
    './HeadTourPlayback':{HeadTourPlayback:toolbar},
    '../lib/head-guided-playback':require('../lib/head-guided-playback.ts'),
    '../lib/head-atlas-import':{HEAD_MANIFEST_SHA256:'b'.repeat(64)},
    '../lib/head-link-availability':{headLinksCurrent:()=>true},
    '../lib/head-live-selection':{HEAD_SELECTION_PROTOCOL,parseHeadSelection},
    '../lib/head-guided-focus':require('../lib/head-guided-focus.ts')};
  const mod={exports:{} as {HeadAtlasGuidedModel:(props:typeof current)=>Node}};
  new Function('require','module','exports',code)((id:string)=>{assert(Object.hasOwn(imports,id),id);return imports[id];},mod,mod.exports);
  function commit(){for(const kind of ['layout','passive'] as const)for(const [i,item] of pending){if(item.kind!==kind)continue;const old=effects.get(i);if(old&&same(old.deps,item.deps))continue;old?.cleanup?.();const cleanup=item.create();item.cleanup=typeof cleanup==='function'?cleanup:undefined;effects.set(i,item);}}
  function render(next=current,shouldCommit=true){cursor=0;pending=new Map();const result=mod.exports.HeadAtlasGuidedModel(next);
    const iframe=walk(result,node=>node.type==='iframe');assert(iframe);iframe.props.ref.current=frameElement;
    if(shouldCommit){current=next;tree=result;commit();let cycles=0;while(dirty){assert(++cycles<20,'render loop');dirty=false;cursor=0;pending=new Map();tree=mod.exports.HeadAtlasGuidedModel(current);commit();}}return result;}
  const nav=(value:Node=tree)=>{const found=walk(value,node=>node.type===navigation);assert(found);return found.props;};
  const toolbarProps=(value:Node=tree)=>{const found=walk(nav(value).status,node=>node.type===toolbar);assert(found);return found.props;};
  const iframe=(value:Node=tree)=>{const found=walk(value,node=>node.type==='iframe');assert(found);return found;};
  const session=()=>String(sent.filter(p=>p.type===HEAD_SELECTION_PROTOCOL+'-request').at(-1)?.session);
  const selected=(id:string,sequence:number,sessionId=session())=>({type:HEAD_SELECTION_PROTOCOL,version:1,revision:current.sourceRevision,session:sessionId,sequence,status:'selected',selection:headGuidedDestination(href(id))!.target});
  const blocked=(reason:'practice'|'guided'|'unavailable',sequence:number)=>({type:HEAD_SELECTION_PROTOCOL,version:1,revision:current.sourceRevision,session:session(),sequence,status:'blocked',reason});
  const ack=(command:number)=>({type:HEAD_FOCUS_PROTOCOL+'-result',version:1,revision:current.sourceRevision,session:session(),command,status:'accepted'});
  const deliver=(data:unknown)=>{for(const listener of [...(listeners.get('message')??[])])listener({data,source:contentWindow,origin});render();};
  const command=()=>sent.filter(p=>p.type===HEAD_FOCUS_PROTOCOL).at(-1);
  const mark=()=>({entries:entries.slice(),sent:sent.length,timers:[...timers.keys()],assignments});
  const unmount=()=>{if(disposed)return;for(const item of effects.values())item.cleanup?.();effects.clear();disposed=true;};
  const close=()=>{unmount();for(const [key,old] of [['window',oldWindow],['history',oldHistory],['crypto',oldCrypto]] as const){if(old)Object.defineProperty(globalThis,key,old);else delete (globalThis as any)[key];}};
  return {render,nav,toolbarProps,iframe,selected,blocked,ack,deliver,command,session,mark,unmount,close,sent,timers,entries,history,
    get url(){return pathname+search+hash;},get focuses(){return focuses;}};
}

function playback(view:ReturnType<typeof harness>){
  const timers=new Map<number,()=>void>();let serial=0;
  const controller=createHeadTourPlaybackController({schedule(callback){timers.set(++serial,callback);return serial;},cancel(handle){timers.delete(handle as number);},canAdvance:()=>true,onState:()=>{}});
  const update=()=>controller.update(view.toolbarProps().context);
  const tick=()=>{assert.equal(timers.size,1);const [id,callback]=[...timers][0];timers.delete(id);callback();view.render();update();};
  update();return {controller,timers,update,tick};
}

test('automatic model steps wait for exact ACK and newer selection, retain iframe and do not focus heading',()=>{
  const view=harness();try{
    view.render();const original=view.iframe();
    view.deliver(view.selected('brainstem-midbrain',1));
    const run=playback(view);assert.equal(run.controller.play(),true);assert.equal(run.timers.size,1);
    run.tick();assert.equal(view.url,pons);assert.deepEqual(view.entries,[midbrain,pons]);
    assert.equal(view.iframe().props.src,original.props.src);assert.equal(view.iframe().props.ref,original.props.ref);
    assert.equal(view.focuses,0);assert.equal(view.toolbarProps().context.ready,false);
    const focus=view.command();assert(focus);assert.deepEqual(focus.target,headGuidedDestination(pons)!.target);
    assert.equal(run.timers.size,0);
    view.deliver(view.selected('brainstem-pons',2));run.update();assert.equal(view.toolbarProps().context.ready,false);
    view.deliver(view.ack(focus.command));run.update();assert.equal(view.toolbarProps().context.ready,false,'ACK alone does not confirm');
    view.deliver(view.selected('brainstem-pons',3));run.update();assert.equal(view.toolbarProps().context.ready,true);
    assert.equal(run.timers.size,1);
    run.tick();assert.equal(view.url,medulla);assert.equal(view.focuses,0);
    const next=view.command();assert(next);assert(next.command>focus.command);
    view.deliver(view.ack(next.command));run.update();assert.equal(view.toolbarProps().context.ready,false,'ACK cannot confirm the old snapshot');
    view.deliver(view.selected('brainstem-medulla',4));run.update();assert.equal(view.toolbarProps().context.ready,true);
    run.tick();assert.equal(run.controller.state().finished,true);assert.deepEqual(view.entries,[midbrain,pons,medulla]);
    assert.equal(view.iframe().props.src,original.props.src);assert.equal(view.focuses,0);
  }finally{view.close();}
});

test('blocked practice, guided mode and different selection pause before an old tick advances',()=>{
  for(const obstruction of ['practice','guided','different'] as const){
    const view=harness();try{
      view.render();view.deliver(view.selected('brainstem-midbrain',1));const run=playback(view);assert(run.controller.play());
      const stale=[...run.timers.values()][0];assert(stale);
      if(obstruction==='different')view.deliver(view.selected('brainstem-pons',2));
      else view.deliver(view.blocked(obstruction,2));
      run.update();stale();view.render();run.update();
      assert.deepEqual(view.entries,[midbrain],obstruction);
      assert.equal(run.timers.size,0,obstruction);
      assert.equal(run.controller.state().playing,false,obstruction);
    }finally{view.close();}
  }
});

test('source replacement and unmount retire old callbacks and timers',()=>{
  const view=harness();try{
    const first=view.render();const oldNavigate=view.nav(first).onNavigate;
    view.deliver(view.selected('brainstem-midbrain',1));const run=playback(view);assert(run.controller.play());
    const stale=[...run.timers.values()][0];assert(stale);
    view.render({initialHref:midbrain,sourceRevision:'c'.repeat(40),coverage:'Synthetic coverage'});run.update();
    const before=view.mark();oldNavigate(pons);stale();view.render();run.update();assert.deepEqual(view.mark(),before);
    const active=view.nav().onNavigate;view.unmount();const after=view.mark();active(pons);assert.deepEqual(view.mark(),after);
  }finally{view.close();}
});

test('timeout and iframe error pause playback and retire the queued reading callback',()=>{
  for(const failure of ['timeout','error'] as const){
    const view=harness();try{
      view.render();view.deliver(view.selected('brainstem-midbrain',1));const run=playback(view);assert(run.controller.play());
      const stale=[...run.timers.values()][0];assert(stale);
      if(failure==='error')view.iframe().props.onError();
      else {run.tick();const wait=[...view.timers.values()][0];assert(wait);wait.callback();}
      view.render();run.update();stale();view.render();run.update();
      assert.equal(view.toolbarProps().context.blocked,true,failure);
      assert.equal(run.controller.state().playing,false,failure);
      assert.deepEqual(view.entries,failure==='timeout'?[midbrain,pons]:[midbrain],failure);
    }finally{view.close();}
  }
});

test('history navigation pauses and its pending request cannot use an old timer',()=>{
  const view=harness();try{
    view.render();view.deliver(view.selected('brainstem-midbrain',1));
    assert.equal(view.nav().onNavigate(pons),true);view.render();
    const first=view.command();assert(first);view.deliver(view.ack(first.command));
    view.deliver(view.selected('brainstem-pons',2));
    const run=playback(view);assert(run.controller.play());const stale=[...run.timers.values()][0];assert(stale);
    view.history.back();view.render();run.update();stale();view.render();run.update();
    assert.equal(view.url,midbrain);assert.equal(run.controller.state().playing,false);
    assert.deepEqual(view.entries,[midbrain,pons]);
  }finally{view.close();}
});

test('abandoned render callbacks cannot navigate or reconnect a model session',()=>{
  const view=harness();try{
    const committed=view.render(),active=view.nav(committed).onNavigate;
    const speculative=view.render({initialHref:midbrain,sourceRevision:'c'.repeat(40),coverage:'Synthetic coverage'},false);
    const staleNavigate=view.nav(speculative).onNavigate,staleLoad=view.iframe(speculative).props.onLoad;
    const before=view.mark();staleNavigate(pons);staleLoad();assert.deepEqual(view.mark(),before);
    assert.equal(active(pons),true);view.render();assert.equal(view.url,pons);
  }finally{view.close();}
});
