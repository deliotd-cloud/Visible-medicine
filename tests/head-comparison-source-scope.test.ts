import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {HEAD_LINK_REVISION,headAtlasConceptOptions} from '../lib/head-atlas-links.ts';
import {headInlineDestination,headInlineMatches,headInlineReverseConcept} from '../lib/head-inline-comparison.ts';
import {HEAD_SELECTION_PROTOCOL,parseHeadSelection} from '../lib/head-live-selection.ts';
import {HEAD_FOCUS_PROTOCOL,headFocusResult} from '../lib/head-guided-focus.ts';
import manifest from '../public/atlas-runtime/head-neck/manifest.json' with {type:'json'};

const destinations=(['CT','MRI'] as const).flatMap(modality=>headAtlasConceptOptions().flatMap(({conceptId})=>{
  const destination=headInlineDestination(conceptId,HEAD_LINK_REVISION,modality);
  return destination?[{modality,destination}]:[];
}));

function sourceGroup(item:typeof destinations[number]){
  const {modality,destination:d}=item;
  const t=d.target;
  return JSON.stringify([d.sourceRevision,d.headRevision,modality,t.kind,t.laterality,
    t.kind==='nested'?t.parentId:null,t.kind==='nested'?t.parentSource:null,t.kind==='nested'?t.study:null,t.source]);
}

test('all offered comparisons share a frame exactly within one source, side and anatomical study',()=>{
  assert(destinations.length>50,'cover the current cross-modality concept registry');
  for(let i=0;i<destinations.length;i++)for(let j=i+1;j<destinations.length;j++){
    const left=destinations[i],right=destinations[j];
    assert.equal(left.destination.scope===right.destination.scope,sourceGroup(left)===sourceGroup(right),
      `${left.modality}:${left.destination.conceptId} / ${right.modality}:${right.destination.conceptId}`);
  }
});

test('same-source studies retain a frame; root and nested cross-source destinations do not',()=>{
  const scope=(id:string,modality:'CT'|'MRI')=>{
    const destination=headInlineDestination(id,HEAD_LINK_REVISION,modality);assert(destination,id);return destination.scope;
  };
  assert.equal(scope('brainstem-pons','CT'),scope('brainstem-midbrain','CT'));
  assert.equal(scope('deep-left-thalamus','CT'),scope('deep-left-caudate','CT'));
  for(const pair of [
    ['orbit-left-globe','deep-left-thalamus','CT'],
    ['deep-left-thalamus','bone-left-parietal','CT'],
    ['cortex-left-frontal-lobe','limbic-left-hippocampus','MRI'],
  ] as const)assert.notEqual(scope(pair[0],pair[2]),scope(pair[1],pair[2]),pair.join(' / '));
  assert.notEqual(scope('brainstem-pons','CT'),scope('brainstem-pons','MRI'));
});

type Node={type:any;key?:string;props:Record<string,any>};
type Effect={kind:'layout'|'passive';create:()=>void|(()=>void);deps?:unknown[];cleanup?:()=>void};
const require=createRequire(import.meta.url);
function walk(value:unknown,predicate:(node:Node)=>boolean):Node|undefined{
  if(Array.isArray(value)){for(const child of value){const found=walk(child,predicate);if(found)return found;}return;}
  if(!value||typeof value!=='object'||!('props'in value))return;
  const node=value as Node;return predicate(node)?node:walk(node.props.children,predicate);
}
function text(value:unknown):string{return Array.isArray(value)?value.map(text).join(''):value&&typeof value==='object'&&'props'in value?text((value as Node).props.children):String(value??'');}

function inlineHarness(){
  const source=readFileSync(new URL('../components/HeadAtlasInlineComparison.tsx',import.meta.url),'utf8');
  const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const origin='https://atlas.example.test',timers=new Map<number,()=>void>(),listeners=new Set<(event:any)=>void>(),sent:any[]=[],navigation:string[]=[];
  const oldWindow=Object.getOwnPropertyDescriptor(globalThis,'window'),oldCrypto=Object.getOwnPropertyDescriptor(globalThis,'crypto');
  let timerId=0,uuid=0,cursor=0,dirty=false,key:string|null=null,slots:any[]=[],committed=new Map<number,Effect>(),pending=new Map<number,Effect>();
  let tree!:Node,frameElement:{contentWindow:{postMessage:(packet:unknown,target:string)=>void}};
  const mockWindow={location:{origin},setTimeout(callback:()=>void){timers.set(++timerId,callback);return timerId;},clearTimeout(id:number){timers.delete(id);},
    addEventListener(name:string,callback:(event:any)=>void){assert.equal(name,'message');listeners.add(callback);},
    removeEventListener(name:string,callback:(event:any)=>void){assert.equal(name,'message');listeners.delete(callback);}};
  Object.defineProperty(globalThis,'window',{configurable:true,value:mockWindow});
  Object.defineProperty(globalThis,'crypto',{configurable:true,value:{randomUUID:()=>`source-session-${++uuid}-abcd`}});
  const equal=(a?:unknown[],b?:unknown[])=>!!a&&!!b&&a.length===b.length&&a.every((value,index)=>Object.is(value,b[index]));
  const effect=(kind:Effect['kind'],create:Effect['create'],deps?:unknown[])=>{pending.set(cursor++,{kind,create,deps});};
  const hooks={useRef(initial:unknown){const index=cursor++;return slots[index]??(slots[index]={current:initial});},
    useState(initial:unknown){const index=cursor++;if(!(index in slots))slots[index]=initial;return [slots[index],(next:any)=>{
      const value=typeof next==='function'?next(slots[index]):next;if(!Object.is(value,slots[index])){slots[index]=value;dirty=true;}}];},
    useLayoutEffect:(create:Effect['create'],deps?:unknown[])=>effect('layout',create,deps),
    useEffect:(create:Effect['create'],deps?:unknown[])=>effect('passive',create,deps)};
  const imports:Record<string,unknown>={react:hooks,'react/jsx-runtime':require('react/jsx-runtime'),
    '../lib/head-live-selection.ts':{HEAD_SELECTION_PROTOCOL,parseHeadSelection},
    '../lib/head-guided-focus.ts':{HEAD_FOCUS_PROTOCOL,headFocusResult},
    '../lib/head-inline-comparison.ts':{headInlineDestination,headInlineMatches,headInlineReverseConcept}};
  const mod={exports:{} as {HeadAtlasInlineComparison:(props:any)=>Node}};
  new Function('require','module','exports',code)((name:string)=>{assert(Object.hasOwn(imports,name),name);return imports[name];},mod,mod.exports);
  let props={conceptId:'deep-left-thalamus',revision:HEAD_LINK_REVISION,modality:'CT',selectionReady:true,
    onSelectConcept:(value:string)=>navigation.push(value),onClose:()=>{}};
  function cleanup(){for(const effect of committed.values())effect.cleanup?.();committed.clear();}
  function phases(){for(const kind of ['layout','passive'] as const)for(const [index,next] of pending)if(next.kind===kind){
    const old=committed.get(index);if(old&&equal(old.deps,next.deps))continue;old?.cleanup?.();
    const done=next.create();committed.set(index,{...next,cleanup:typeof done==='function'?done:undefined});
  }}
  function render(next=props){props=next;let rounds=0;do{
    assert(++rounds<20);dirty=false;cursor=0;pending=new Map();
    const outer=mod.exports.HeadAtlasInlineComparison(props);
    if(key!==outer.key){cleanup();key=outer.key??null;slots=[];frameElement={contentWindow:{postMessage(packet,target){assert.equal(target,origin);sent.push(packet);}}};}
    tree=(outer.type as (props:any)=>Node)(outer.props);
    const frame=walk(tree,node=>node.type==='iframe');assert(frame);frame.props.ref.current=frameElement;phases();
  }while(dirty);return tree;}
  const frame=()=>{const result=walk(tree,node=>node.type==='iframe');assert(result);return result;};
  const button=(label:string)=>walk(tree,node=>node.type==='button'&&text(node.props.children).includes(label));
  const status=()=>text(walk(tree,node=>node.props.role==='status')?.props.children);
  function session(){return String(sent.filter(packet=>packet.type===HEAD_SELECTION_PROTOCOL+'-request').at(-1)?.session);}
  function selected(conceptId:string,sequence:number){const destination=headInlineDestination(conceptId,HEAD_LINK_REVISION,'CT');assert(destination);
    return {type:HEAD_SELECTION_PROTOCOL,version:1,revision:manifest.sourceCommit,session:session(),sequence,status:'selected',selection:destination.target};}
  function deliver(packet:unknown){for(const listener of [...listeners])listener({data:packet,source:frameElement.contentWindow,origin});render();}
  function close(){cleanup();if(oldWindow)Object.defineProperty(globalThis,'window',oldWindow);else delete (globalThis as any).window;
    if(oldCrypto)Object.defineProperty(globalThis,'crypto',oldCrypto);else delete (globalThis as any).crypto;}
  return {render,frame,button,status,selected,deliver,session,close,timers,listeners,sent,navigation,
    get renderProps(){return props;},get frameElement(){return frameElement;},get key(){return key;}};
}

test('the actual inline component retains a same-source frame and remounts a different-source authored URL',()=>{
  const h=inlineHarness();try{
    h.render();const thalamus=headInlineDestination('deep-left-thalamus',HEAD_LINK_REVISION,'CT')!;
    const caudate=headInlineDestination('deep-left-caudate',HEAD_LINK_REVISION,'CT')!;
    const globe=headInlineDestination('orbit-left-globe',HEAD_LINK_REVISION,'CT')!;
    assert.equal(h.frame().props.src,thalamus.src);
    const originalFrame=h.frameElement,originalKey=h.key;
    h.render({...h.renderProps,conceptId:'deep-left-caudate'} as any);
    assert.equal(h.key,originalKey);
    assert.equal(h.frameElement,originalFrame);
    assert.equal(h.frame().props.src,thalamus.src,'compatible focus retains its loaded source URL');
    assert.notEqual(caudate.src,thalamus.src);
    h.render({...h.renderProps,conceptId:'orbit-left-globe'} as any);
    assert.notEqual(h.key,originalKey);
    assert.notEqual(h.frameElement,originalFrame);
    assert.equal(h.frame().props.src,globe.src,'new source opens its authored URL');
  }finally{h.close();}
});

test('cross-source remount retires the prior session, timeout and reverse callback',()=>{
  const h=inlineHarness();try{
    h.render();const firstFrame=h.frame(),firstElement=h.frameElement;
    firstFrame.props.onLoad({currentTarget:firstElement});h.render();
    const firstSession=h.session();assert.match(firstSession,/source-session/);
    h.deliver(h.selected('deep-left-caudate',1));
    assert.match(h.status(),/differs from/);
    const reverse=h.button('Show Left caudate nucleus on CT');assert(reverse);
    const oldReverse=reverse.props.onClick,oldLoad=firstFrame.props.onLoad,oldError=firstFrame.props.onError;
    const oldFocus=h.button('Show Left thalamus in model');assert(oldFocus);
    oldFocus.props.onClick();h.render();
    const oldTimers=[...h.timers.values()];assert(oldTimers.length>0);
    const sentBefore=h.sent.length;
    h.render({...h.renderProps,conceptId:'orbit-left-globe'} as any);
    assert.equal(h.listeners.size,1,'old message listener was removed when the keyed frame unmounted');
    assert.equal(h.timers.size,1,'old timeout was cleared; the new frame has its own load timeout');
    oldReverse();oldLoad({currentTarget:firstElement});oldError({currentTarget:firstElement});
    for(const callback of oldTimers)callback();h.render();
    assert.deepEqual(h.navigation,[],'old reverse callback cannot change the new CT selection');
    assert.equal(h.sent.length,sentBefore,'retired iframe events and timers cannot issue a request');
    assert.match(h.status(),/Loading 3D model/);
    const current=h.frame();current.props.onLoad({currentTarget:h.frameElement});h.render();
    assert.notEqual(h.session(),firstSession,'new source starts a fresh model session');
    h.deliver({...h.selected('deep-left-caudate',2),session:firstSession});
    assert.match(h.status(),/waiting to confirm/,'old session cannot confirm or redirect the new source');
    assert.equal(h.button('Show Left caudate nucleus on CT'),undefined);
  }finally{h.close();}
});
