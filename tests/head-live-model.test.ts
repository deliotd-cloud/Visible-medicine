import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {atlasRuntimeExpansionModule} from './atlas-runtime-expansion-loader.mjs';
import {liveLearningConsumerModule} from './live-learning-consumer-loader-transition.mjs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {HEAD_SELECTION_PROTOCOL as protocol,parseHeadSelection} from '../lib/head-live-selection.ts';
import {headConceptById} from '../lib/head-atlas-links.ts';
import {headFacialHookModule} from './head-facial-hook-loader.ts';

const require=createRequire(import.meta.url);
const source=readFileSync(new URL('../components/HeadAtlasLinkedModel.tsx',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
type Node={type:unknown;props:Record<string,any>};
type Effect={deps:unknown[]|undefined;cleanup?:()=>void};

test('live model accepts only current frame, origin, revision, session and increasing sequence; clears unavailable contexts',()=>{
  const revision='f'.repeat(40),origin='https://atlas.example.test',messages:unknown[]=[],listeners=new Set<(event:any)=>void>();
  const timers=new Map<number,()=>void>(),callbacks:Array<()=>void>=[];let timerId=0;
  const window={location:{origin},setTimeout(callback:()=>void,delay:number){assert.equal(delay,15000);callbacks.push(callback);timers.set(++timerId,callback);return timerId;},clearTimeout(id:number){timers.delete(id);},addEventListener(name:string,listener:(event:any)=>void){assert.equal(name,'message');listeners.add(listener);},removeEventListener(name:string,listener:(event:any)=>void){assert.equal(name,'message');listeners.delete(listener);}};
  const priorWindow=(globalThis as any).window,priorCrypto=Object.getOwnPropertyDescriptor(globalThis,'crypto');
  Object.defineProperty(globalThis,'window',{configurable:true,value:window});
  let uuid=0;Object.defineProperty(globalThis,'crypto',{configurable:true,value:{randomUUID:()=>`session-${++uuid}`}});
  const contentWindow={postMessage:(packet:unknown,target:string)=>{assert.equal(target,origin);messages.push(packet);}};
  const slots:unknown[]=[],effects=new Map<number,Effect>(),layouts=new Map<number,Effect>();let cursor=0,tree:Node,frame!:Node,dirty=true,disposed=false;
  const same=(a:unknown[]|undefined,b:unknown[]|undefined)=>!!a&&!!b&&a.length===b.length&&a.every((item,index)=>Object.is(item,b[index]));
  const hooks={
    useState(initial:unknown){const index=cursor++;if(!(index in slots))slots[index]=initial;return [slots[index],(next:unknown)=>{assert(!disposed);if(!Object.is(slots[index],next)){slots[index]=next;dirty=true;}}];},
    useRef(initial:unknown){const index=cursor++;if(!(index in slots))slots[index]={current:initial};return slots[index];},
    useEffect(create:()=>void|(()=>void),deps:unknown[]){const index=cursor++,old=effects.get(index);if(!same(old?.deps,deps))pending.push(()=>{old?.cleanup?.();const cleanup=create();effects.set(index,{deps,cleanup:typeof cleanup==='function'?cleanup:undefined});});},
    useLayoutEffect(create:()=>void|(()=>void),deps?:unknown[]){const index=cursor++,old=layouts.get(index);if(!same(old?.deps,deps))pendingLayouts.push(()=>{old?.cleanup?.();const cleanup=create();layouts.set(index,{deps,cleanup:typeof cleanup==='function'?cleanup:undefined});});},
  };
  let linksCurrent=true;
  const comparison=function HeadAtlasComparisonNavigation(){return null;};
  const teaching=function HeadAtlasReferenceTeaching(){return null;};
  const imports:Record<string,unknown>={'react':hooks,'../lib/head-live-selection':{HEAD_SELECTION_PROTOCOL:protocol,parseHeadSelection},'../lib/head-atlas-import':{HEAD_MANIFEST_SHA256:revision},'../lib/head-link-availability.ts':{headLinksCurrent:()=>linksCurrent},'../lib/head-learning-resource-availability.ts':{headReferenceLearningAvailable:()=>true},'./HeadAtlasComparisonNavigation':{HeadAtlasComparisonNavigation:comparison},'./atlas-runtime-expansion':atlasRuntimeExpansionModule,'./HeadAtlasReferenceTeaching':{HeadAtlasReferenceTeaching:teaching},'./AtlasBodyLearning':liveLearningConsumerModule,'react/jsx-runtime':require('react/jsx-runtime')};
  const mod={exports:{} as {HeadAtlasLinkedModel:(props:{src:string;sourceRevision:string;coverage:unknown;title?:string})=>Node}};
  const facialHook=headFacialHookModule(hooks);
  new Function('require','module','exports',code)((id:string)=>{if(id==='./useVerifiedFacialTeaching')return facialHook;assert(Object.hasOwn(imports,id),id);return imports[id];},mod,mod.exports);
  let src='/atlas-runtime/head-neck/index.html?region=head-neck';const pending:Array<()=>void>=[],pendingLayouts:Array<()=>void>=[];
  function walk(value:unknown,predicate:(node:Node)=>boolean):Node|undefined{
    if(Array.isArray(value)){for(const part of value){const found=walk(part,predicate);if(found)return found;}return;}
    if(!value||typeof value!=='object'||!('props'in value))return;
    const node=value as Node;return predicate(node)?node:walk(node.props.children,predicate);
  }
  function flush(){let count=0;do{assert(++count<20);dirty=false;cursor=0;pending.length=0;pendingLayouts.length=0;tree=mod.exports.HeadAtlasLinkedModel({src,sourceRevision:revision,coverage:'Synthetic coverage',title:'Whole body 3D anatomy'});frame=walk(tree,node=>node.type==='iframe')!;assert(frame);assert.equal(frame.props.title,'Whole body 3D anatomy');frame.props.ref.current={contentWindow};for(const effect of pendingLayouts)effect();for(const effect of pending)effect();}while(dirty);return tree;}
  const nav=()=>{const node=walk(tree,node=>node.type===comparison);assert(node);return node.props;};
  const notes=()=>walk(tree,node=>node.type==='details')!;
  const teachingNode=()=>walk(nav().teaching,node=>node.type===teaching);
  const deliver=(data:unknown,source:unknown=contentWindow,from=origin)=>{for(const listener of [...listeners])listener({data,source,origin:from});flush();};
  const ready={type:protocol+'-ready',version:1,revision};
  const selected=(session:string,sequence:number,selection:unknown)=>({type:protocol,version:1,revision,session,sequence,status:'selected',selection});
  const pons=headConceptById('brainstem-pons')!;const q=new URL(pons.atlasHref,'https://atlas.invalid').searchParams;
  const selection={kind:'nested',id:q.get('part'),source:q.get('partSource'),laterality:q.get('part')!.split(':')[4],parentId:q.get('structure'),parentSource:q.get('source'),study:q.get('detail')};
  const session=()=>String((messages.at(-1) as {session:string}).session);
  try{
    flush();assert.equal(listeners.size,1);assert.equal(nav().liveState,'connecting');assert.equal(nav().conceptId,null);
    assert.deepEqual(messages.at(-1),{type:protocol+'-request',version:1,session:'session-1'});
    deliver(ready,{},origin);assert.equal(messages.length,1,'wrong frame cannot claim readiness');
    deliver(ready,contentWindow,'https://other.test');assert.equal(messages.length,1,'wrong origin cannot claim readiness');
    deliver({...ready,revision:'a'.repeat(40)});assert.equal(messages.length,1,'stale revision cannot reconnect');
    deliver({...ready,answer:'private'});assert.equal(messages.length,1,'widened ready packet cannot reconnect');
    deliver(ready);assert.equal(session(),'session-2');
    deliver(selected('session-2',1,selection));assert.equal(nav().conceptId,pons.conceptId);assert.equal(nav().liveState,'ready');assert.equal(teachingNode()?.props.conceptId,pons.conceptId);
    assert.equal(teachingNode()?.props.live,true);
    const originalFrameWindow=frame.props.ref.current.contentWindow;
    linksCurrent=false;flush();assert.equal(nav().conceptId,null,'stale imaging revision hides live focus');
    assert.equal(teachingNode(),undefined,'stale imaging revision hides source-bound teaching');
    assert.equal(frame.props.ref.current.contentWindow,originalFrameWindow,'revision guard leaves the model window connected');
    assert.equal(frame.props.src,src);assert.equal(session(),'session-2','revision guard does not reconnect the model');
    linksCurrent=true;flush();assert.equal(nav().conceptId,pons.conceptId,'current revision restores live focus');
    assert.equal(teachingNode()?.props.conceptId,pons.conceptId);
    frame.props.onLoad();flush();assert.equal(session(),'session-3');assert.equal(nav().conceptId,null,'load resets a selection established before iframe load');
    deliver(selected('session-2',2,selection));assert.equal(nav().conceptId,null,'old session cannot restore focus');
    deliver(selected('session-3',1,selection),{},origin);assert.equal(nav().conceptId,null,'forged frame cannot select');
    deliver(selected('session-3',1,selection),contentWindow,'https://other.test');assert.equal(nav().conceptId,null,'cross-origin packet cannot select');
    deliver(selected('session-3',1,selection));assert.equal(nav().conceptId,pons.conceptId);
    deliver(selected('session-3',1,{...selection,id:'vm:anatomy:body:head-neck:left:muscle:unknown'}));assert.equal(nav().conceptId,pons.conceptId,'replayed sequence ignored');
    deliver(selected('session-3',2,{kind:'root',id:'vm:anatomy:body:spine:midline:bone:atlas',source:selection.source,laterality:'midline'}));assert.equal(nav().conceptId,null,'unmapped neighbouring-region selection clears links and teaching');assert.equal(teachingNode(),undefined);
    deliver({...selected('session-3',3,selection),status:'blocked',reason:'practice',selection:undefined});assert.equal(nav().liveState,'ready','widened practice packet rejected');
    deliver({type:protocol,version:1,revision,session:'session-3',sequence:3,status:'blocked',reason:'practice'});assert.equal(nav().liveState,'practice');assert.equal(nav().conceptId,null);
    nav().onRetry();flush();assert.equal(session(),'session-3','stale retry action cannot restart practice');
    deliver(selected('session-3',4,selection));assert.equal(nav().liveState,'ready');assert.equal(nav().conceptId,pons.conceptId);
    deliver({type:protocol,version:1,revision,session:'session-3',sequence:5,status:'blocked',reason:'guided'});assert.equal(nav().liveState,'guided');assert.equal(nav().conceptId,null);
    deliver({type:protocol,version:1,revision,session:'session-3',sequence:6,status:'empty'});assert.equal(nav().liveState,'ready');assert.equal(nav().conceptId,null);
    frame.props.onError();flush();assert.equal(nav().liveState,'unavailable');assert.equal(nav().conceptId,null);
    src+='&study=2';flush();assert.equal(nav().liveState,'connecting');assert.equal(session(),'session-4');assert.equal(listeners.size,1,'source change replaces listener');
    assert.equal(timers.size,1,'new handshake has one bounded wait');
    const timeout=callbacks.at(-1)!;timeout();flush();
    assert.equal(nav().liveState,'unavailable','silent frame becomes recoverable');
    assert.equal(nav().conceptId,null);assert.equal(timers.size,0);
    deliver(selected('session-4',1,selection));assert.equal(nav().liveState,'unavailable','late timed-out packet cannot resurrect comparison');
    const retry=nav().onRetry;assert.equal(typeof retry,'function');retry();retry();flush();
    assert.equal(session(),'session-5');assert.equal(uuid,5,'double click starts only one request');
    assert.equal(frame.props.src,src,'retry preserves loaded model and camera');
    timeout();flush();assert.equal(nav().liveState,'connecting','queued old timeout cannot cancel retry');
    const recoveredTimeout=callbacks.at(-1)!;
    deliver(selected('session-5',1,selection));assert.equal(nav().conceptId,pons.conceptId);assert.equal(timers.size,0);
    recoveredTimeout();flush();assert.equal(nav().liveState,'ready','queued timeout cannot revoke accepted current selection');
    frame.props.onError();flush();deliver(selected('session-5',2,selection));
    assert.equal(nav().liveState,'unavailable','frame failure revokes the old session');
    nav().onRetry();flush();assert.equal(session(),'session-6');
    callbacks.at(-1)!();flush();assert.equal(nav().liveState,'unavailable','repeated failure stays recoverable');
    deliver(ready);assert.equal(session(),'session-7','current exact ready packet may recover a late-loading model');
    deliver({type:protocol,version:1,revision,session:'session-7',sequence:1,status:'blocked',reason:'unavailable'});
    assert.equal(nav().liveState,'unavailable');assert.equal(timers.size,0,'reported unavailable state cancels the wait');
    deliver(selected('session-7',2,selection));assert.equal(nav().conceptId,null);
    nav().onRetry();flush();assert.equal(session(),'session-8','reported failure has the same safe recovery');
    const afterUnmount=callbacks.at(-1)!;
    // Additional advisory resource causes revoke the same live-selection authority.
    for(const reason of ['sign-in','access-denied'] as const){
      frame.props.onLoad();flush();const retired=session();
      deliver({type:protocol,version:1,revision,session:retired,sequence:1,status:'blocked',reason});
      assert.equal(nav().liveState,reason);assert.equal(nav().conceptId,null);assert.equal(teachingNode(),undefined);
      deliver(selected(retired,2,selection));assert.equal(nav().liveState,reason,'old session cannot clear an access refusal');
      nav().onRetry();flush();const fresh=session();assert.notEqual(fresh,retired);
      deliver(selected(retired,3,selection));assert.equal(nav().liveState,'connecting');
      deliver(selected(fresh,1,selection));assert.equal(nav().conceptId,pons.conceptId);assert.equal(nav().liveState,'ready');
    }
    for(const effect of layouts.values())effect.cleanup?.();for(const effect of effects.values())effect.cleanup?.();disposed=true;assert.equal(listeners.size,0);
    assert.equal(timers.size,0,'unmount clears the handshake timer');afterUnmount();
    for(const listener of [...listeners])listener({data:selected('session-4',1,selection),source:contentWindow,origin});
  }finally{
    if(!disposed){for(const effect of layouts.values())effect.cleanup?.();for(const effect of effects.values())effect.cleanup?.();}
    if(priorWindow===undefined)delete (globalThis as any).window;else Object.defineProperty(globalThis,'window',{configurable:true,value:priorWindow});
    if(priorCrypto)Object.defineProperty(globalThis,'crypto',priorCrypto);else delete (globalThis as any).crypto;
  }
});
