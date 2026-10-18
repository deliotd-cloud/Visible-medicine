import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import manifest from '../public/atlas-runtime/head-neck/manifest.json' with {type:'json'};
import {HEAD_LINK_REVISION,headConceptById} from '../lib/head-atlas-links.ts';
import {headInlineDestination,headInlineMatches,headInlineReverseConcept} from '../lib/head-inline-comparison.ts';
import {HEAD_SELECTION_PROTOCOL,parseHeadSelection} from '../lib/head-live-selection.ts';
import {HEAD_FOCUS_PROTOCOL,headFocusResult} from '../lib/head-guided-focus.ts';

const require=createRequire(import.meta.url),origin='https://atlas.example.test';
const source=readFileSync(process.env.HEAD_INLINE_BASELINE_SOURCE??new URL('../components/HeadAtlasInlineComparison.tsx',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const pons=headInlineDestination('brainstem-pons',HEAD_LINK_REVISION,'CT')!;
const midbrain=headInlineDestination('brainstem-midbrain',HEAD_LINK_REVISION,'CT')!;
assert.equal(pons.scope,midbrain.scope);
type Effect={kind:'layout'|'passive';create:()=>void|(()=>void);deps?:unknown[];cleanup?:()=>void};
type Node={type:any;props:Record<string,any>};
type Props={conceptId:string;revision:string;modality:'CT';selectionReady:boolean;onSelectConcept:(conceptId:string)=>void;onClose:()=>void};
function walk(value:unknown,predicate:(node:Node)=>boolean):Node|undefined{
  if(Array.isArray(value)){for(const child of value){const found=walk(child,predicate);if(found)return found;}return;}
  if(!value||typeof value!=='object'||!('props' in value))return;
  const node=value as Node;return predicate(node)?node:walk(node.props.children,predicate);
}
function harness(){
  const sent:any[]=[],navigation:string[]=[],listeners=new Set<(event:any)=>void>(),timers=new Map<number,()=>void>();let closes=0;
  let timerId=0,uuid=0,cursor=0,dirty=false,disposed=false,tree!:Node,committedProps!:Props;
  let pending=new Map<number,Effect>();const committed=new Map<number,Effect>(),slots:any[]=[];
  const oldWindow=Object.getOwnPropertyDescriptor(globalThis,'window'),oldCrypto=Object.getOwnPropertyDescriptor(globalThis,'crypto');
  const frameWindow={postMessage(packet:unknown,target:string){assert.equal(target,origin);sent.push(packet);}};
  const frameElement={contentWindow:frameWindow};
  const mockWindow={location:{origin},setTimeout(callback:()=>void){timers.set(++timerId,callback);return timerId;},
    clearTimeout(id:number){timers.delete(id);},addEventListener(name:string,fn:(event:any)=>void){assert.equal(name,'message');listeners.add(fn);},
    removeEventListener(name:string,fn:(event:any)=>void){assert.equal(name,'message');listeners.delete(fn);}};
  Object.defineProperty(globalThis,'window',{configurable:true,value:mockWindow});
  Object.defineProperty(globalThis,'crypto',{configurable:true,value:{randomUUID:()=>`inline-session-${++uuid}-abcd`}});
  const same=(a?:unknown[],b?:unknown[])=>!!a&&!!b&&a.length===b.length&&a.every((value,index)=>Object.is(value,b[index]));
  const effect=(kind:Effect['kind'],create:Effect['create'],deps?:unknown[])=>{pending.set(cursor++,{kind,create,deps});};
  const hooks={useRef(initial:unknown){const index=cursor++;return slots[index]??(slots[index]={current:initial});},
    useState(initial:unknown){const index=cursor++;if(!(index in slots))slots[index]=initial;
      return [slots[index],(next:any)=>{const value=typeof next==='function'?next(slots[index]):next;
        if(!Object.is(value,slots[index])){slots[index]=value;dirty=true;}}];},
    useLayoutEffect:(create:Effect['create'],deps?:unknown[])=>effect('layout',create,deps),
    useEffect:(create:Effect['create'],deps?:unknown[])=>effect('passive',create,deps)};
  const imports:Record<string,unknown>={react:hooks,'react/jsx-runtime':require('react/jsx-runtime'),
    '../lib/head-live-selection.ts':{HEAD_SELECTION_PROTOCOL,parseHeadSelection},
    '../lib/head-inline-comparison.ts':{headInlineDestination,headInlineMatches,headInlineReverseConcept},
    '../lib/head-guided-focus.ts':{HEAD_FOCUS_PROTOCOL,headFocusResult}};
  const mod={exports:{} as {HeadAtlasInlineComparison:(props:Props)=>Node}};
  new Function('require','module','exports',code)((id:string)=>{assert(Object.hasOwn(imports,id),id);return imports[id];},mod,mod.exports);
  const props=(conceptId='brainstem-pons',selectionReady=true):Props=>({conceptId,revision:HEAD_LINK_REVISION,modality:'CT',selectionReady,
    onSelectConcept:value=>navigation.push(value),onClose:()=>{closes++;}});
  function render(next=committedProps??props(),commit=true){
    assert(!disposed);cursor=0;pending=new Map();
    const outer=mod.exports.HeadAtlasInlineComparison(next);
    const result=typeof outer.type==='function'?outer.type(outer.props):outer;
    const iframe=walk(result,node=>node.type==='iframe');assert(iframe);iframe.props.ref.current=frameElement;
    if(commit){tree=result;committedProps=next;phase('layout');phase('passive');settle();}
    return result;
  }
  function phase(kind:Effect['kind']){
    for(const [index,next] of pending)if(next.kind===kind){const old=committed.get(index);
      if(old&&same(old.deps,next.deps))continue;
      old?.cleanup?.();const cleanup=next.create();committed.set(index,{...next,cleanup:typeof cleanup==='function'?cleanup:undefined});
    }
  }
  function settle(){let rounds=0;while(dirty){assert(++rounds<20,'effect update loop');dirty=false;render(committedProps);}}
  function commit(result:Node,next:Props,passive=true){
    assert(!disposed);tree=result;committedProps=next;phase('layout');if(passive)phase('passive');if(passive)settle();
  }
  function flushPassive(){phase('passive');settle();}
  const frame=(value:Node=tree)=>{const found=walk(value,node=>node.type==='iframe');assert(found);return found;};
  const textOf=(value:any):string=>Array.isArray(value)?value.map(textOf).join(''):value&&typeof value==='object'&&'props' in value?textOf(value.props.children):String(value??'');
  const button=(label:string,value:Node=tree)=>{const found=walk(value,node=>node.type==='button'&&textOf(node.props.children).includes(label));assert(found,`missing ${label}`);return found;};
  const status=()=>String(walk(tree,node=>node.props.role==='status')?.props.children);
  const session=()=>String(sent.filter(value=>value.type===HEAD_SELECTION_PROTOCOL+'-request').at(-1)?.session);
  const packet=(conceptId:string,sequence:number,sessionId=session())=>{
    const query=new URL(headConceptById(conceptId)!.atlasHref,'https://atlas.invalid').searchParams;
    const nested=query.get('study')==='2',id=query.get(nested?'part':'structure')!;
    return {type:HEAD_SELECTION_PROTOCOL,version:1,revision:manifest.sourceCommit,session:sessionId,sequence,status:'selected',
      selection:{kind:nested?'nested':'root',id,source:query.get(nested?'partSource':'source'),laterality:id.split(':')[4],
        ...(nested?{parentId:query.get('structure'),parentSource:query.get('source'),study:query.get('detail')}:{})}};
  };
  function deliver(data:unknown,source:unknown=frameWindow,from=origin){for(const fn of [...listeners])fn({data,source,origin:from});settle();}
  const mark=()=>({sent:sent.length,navigation:[...navigation],closes,timers:[...timers.keys()],session:session(),status:status()});
  function unchanged(before:ReturnType<typeof mark>){assert.deepEqual(mark(),before);}
  function load(){const current=frame();current.props.onLoad({currentTarget:frameElement});settle();}
  function fireTimeout(){const callback=[...timers.values()][0];assert(callback);callback();settle();}
  function unmount(){if(disposed)return;for(const effect of committed.values())effect.cleanup?.();committed.clear();disposed=true;}
  function close(){unmount();if(oldWindow)Object.defineProperty(globalThis,'window',oldWindow);else delete (globalThis as any).window;
    if(oldCrypto)Object.defineProperty(globalThis,'crypto',oldCrypto);else delete (globalThis as any).crypto;}
  return {props,render,commit,flushPassive,settle,frame,button,status,session,packet,deliver,mark,unchanged,load,fireTimeout,unmount,close,
    sent,navigation,timers,listeners,frameElement,frameWindow,get tree(){return tree;}};
}

test('abandoned compatible destination cannot retire committed reverse or focus controls',()=>{
  const view=harness();try{
    view.render(view.props());view.load();const first=view.session();
    view.deliver(view.packet('brainstem-midbrain',1));assert.match(view.status(),/differs from Pons/);
    const reverse=view.button('Show Midbrain on CT').props.onClick,focus=view.button('Show Pons in model').props.onClick;
    const visibleSrc=view.frame().props.src,visibleRef=view.frame().props.ref;
    const abandoned=view.render(view.props('brainstem-midbrain'),false);
    assert.equal(view.frame().props.src,visibleSrc);
    assert.equal(view.frame().props.ref,visibleRef);
    reverse();assert.deepEqual(view.navigation,['brainstem-midbrain']);
    view.render(view.props('brainstem-midbrain',false),false);
    reverse();assert.deepEqual(view.navigation,['brainstem-midbrain','brainstem-midbrain'],'abandoned readiness cannot retire visible reverse');
    const sentBefore=view.sent.length;focus();assert.equal(view.sent.length,sentBefore+1);
    assert.equal(view.sent.at(-1).target.id,pons.target.id,'visible A focus retains exact target');
    assert.equal(view.sent.at(-1).session,first);
    const before=view.mark();view.frame(abandoned).props.onLoad({currentTarget:view.frameElement});view.unchanged(before);
  }finally{view.close();}
});

test('abandoned destination and readiness do not retire visible retry',()=>{
  const view=harness();try{
    view.render(view.props());view.fireTimeout();assert.match(view.status(),/unavailable/);
    const retry=view.button('Retry model comparison').props.onClick;
    view.render(view.props('brainstem-midbrain',false),false);
    const before=view.mark();retry();view.settle();assert.notDeepEqual(view.mark(),before,'committed A retry remains actionable');
    assert.match(view.status(),/Loading/);
    assert.equal(view.frame().props.src,pons.src,'retry keeps A authored URL until B commits');
  }finally{view.close();}
});

test('layout commit retires old controls before passive effects; B needs ACK and fresh matching snapshot',()=>{
  const view=harness();try{
    view.render(view.props());view.load();view.deliver(view.packet('brainstem-midbrain',1));
    const oldReverse=view.button('Show Midbrain on CT').props.onClick,oldFocus=view.button('Show Pons in model').props.onClick;
    const src=view.frame().props.src,ref=view.frame().props.ref;
    const next=view.props('brainstem-midbrain'),speculative=view.render(next,false);
    view.commit(speculative,next,false);const before=view.mark();oldReverse();oldFocus();view.unchanged(before);
    assert.equal(view.frame().props.src,src);assert.equal(view.frame().props.ref,ref);
    view.flushPassive();view.deliver(view.packet('brainstem-midbrain',2));
    const command=view.sent.filter(value=>value.type===HEAD_FOCUS_PROTOCOL).at(-1);assert(command);
    assert.equal(command.target.id,midbrain.target.id,'new commit focuses B');
    const ack={type:HEAD_FOCUS_PROTOCOL+'-result',version:1,revision:manifest.sourceCommit,session:view.session(),command:command.command,status:'accepted'};
    view.deliver(ack);assert.doesNotMatch(view.status(),/Midbrain is selected/,'ACK alone is insufficient');
    view.deliver(view.packet('brainstem-midbrain',3,'old-session-12345'));assert.doesNotMatch(view.status(),/Midbrain is selected/);
    view.deliver(view.packet('brainstem-midbrain',3),{},origin);assert.doesNotMatch(view.status(),/Midbrain is selected/);
    view.deliver(view.packet('brainstem-midbrain',3),view.frameWindow,'https://foreign.invalid');assert.doesNotMatch(view.status(),/Midbrain is selected/);
    view.deliver(view.packet('brainstem-midbrain',2));assert.doesNotMatch(view.status(),/Midbrain is selected/,'duplicate sequence cannot confirm');
    view.deliver(view.packet('brainstem-midbrain',3));assert.match(view.status(),/Midbrain is selected/);
  }finally{view.close();}
});

test('abandoned readiness cannot route messages to B; practice and guided blocks remain in force',()=>{
  const view=harness();try{
    view.render(view.props());view.load();const session=view.session();
    view.render(view.props('brainstem-midbrain',false),false);
    view.deliver(view.packet('brainstem-midbrain',1));assert.match(view.status(),/differs from Pons/);
    const reverse=view.button('Show Midbrain on CT').props.onClick;
    view.deliver({type:HEAD_SELECTION_PROTOCOL,version:1,revision:manifest.sourceCommit,session,sequence:2,status:'blocked',reason:'practice'});
    assert.match(view.status(),/practice is active/);let before=view.mark();reverse();view.unchanged(before);
    view.deliver({type:HEAD_SELECTION_PROTOCOL,version:1,revision:manifest.sourceCommit,session,sequence:3,status:'blocked',reason:'guided'});
    assert.match(view.status(),/guide is active/);before=view.mark();reverse();view.unchanged(before);
  }finally{view.close();}
});

test('unmount retires retained callbacks, frame events, messages and timeout',()=>{
  const view=harness();try{
    view.render(view.props());view.load();view.deliver(view.packet('brainstem-midbrain',1));
    const reverse=view.button('Show Midbrain on CT').props.onClick,focus=view.button('Show Pons in model').props.onClick;
    const close=view.button('Close comparison').props.onClick;
    const load=view.frame().props.onLoad,error=view.frame().props.onError;
    const oldTimers=[...view.timers.values()];view.unmount();const before=view.mark();
    reverse();focus();close();load({currentTarget:view.frameElement});error({currentTarget:view.frameElement});
    for(const callback of oldTimers)callback();view.unchanged(before);
    assert.equal(view.listeners.size,0);assert.equal(view.timers.size,0);
  }finally{view.close();}
});
