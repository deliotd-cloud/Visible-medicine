import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {headLearningLinks} from '../lib/head-atlas-learning.ts';
import {headGuidedDestination,HEAD_FOCUS_PROTOCOL} from '../lib/head-guided-focus.ts';
import {HEAD_SELECTION_PROTOCOL,parseHeadSelection} from '../lib/head-live-selection.ts';

const require=createRequire(import.meta.url);
const source=readFileSync(new URL('../components/HeadAtlasGuidedModel.tsx',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
type Node={type:unknown;props:Record<string,any>};
type Effect={deps:unknown[];cleanup?:()=>void};
const revision='f'.repeat(40);
const href=(conceptId:string)=>{
  const atlasHref=headLearningLinks({sequenceId:'brainstem',conceptId})?.atlasHref;
  assert(atlasHref);return atlasHref;
};
const pons=href('brainstem-pons'),medulla=href('brainstem-medulla'),midbrain=href('brainstem-midbrain');

test('guided model retains its iframe and unlocks only the current confirmed selection',()=>{
  const origin='https://atlas.example.test',sent:any[]=[],listeners=new Map<string,Set<(event:any)=>void>>();
  const timers=new Map<number,{callback:()=>void;delay:number}>();let timerId=0,uuid=0;
  let pathname='/atlas/head-neck-3d',search=pons.slice(pathname.length),hash='';
  const location={origin,get pathname(){return pathname;},get search(){return search;},get hash(){return hash;},assign:(next:string)=>assert.fail('unexpected full navigation: '+next)};
  const entries=[pons];let historyIndex=0;
  const setUrl=(next:string)=>{const url=new URL(next,origin);pathname=url.pathname;search=url.search;hash=url.hash;};
  const pop=()=>{for(const listener of [...(listeners.get('popstate')??[])])listener({});};
  const history={state:null,
    pushState(_state:unknown,_unused:string,next:string){entries.splice(historyIndex+1);entries.push(next);historyIndex=entries.length-1;setUrl(next);},
    replaceState(_state:unknown,_unused:string,next:string){entries[historyIndex]=next;setUrl(next);},
    back(){assert(historyIndex>0,'no Back entry');setUrl(entries[--historyIndex]);pop();},
    forward(){assert(historyIndex<entries.length-1,'no Forward entry');setUrl(entries[++historyIndex]);pop();},
  };
  const mockWindow={location,history,setTimeout(callback:()=>void,delay:number){timers.set(++timerId,{callback,delay});return timerId;},clearTimeout(id:number){timers.delete(id);},
    addEventListener(name:string,listener:(event:any)=>void){if(!listeners.has(name))listeners.set(name,new Set());listeners.get(name)!.add(listener);},
    removeEventListener(name:string,listener:(event:any)=>void){listeners.get(name)?.delete(listener);}};
  const oldWindow=(globalThis as any).window,oldHistory=(globalThis as any).history,oldCrypto=Object.getOwnPropertyDescriptor(globalThis,'crypto');
  Object.defineProperty(globalThis,'window',{configurable:true,value:mockWindow});
  Object.defineProperty(globalThis,'history',{configurable:true,value:history});
  Object.defineProperty(globalThis,'crypto',{configurable:true,value:{randomUUID:()=>`test-session-${++uuid}-abcd`}});
  const contentWindow={postMessage(packet:unknown,target:string){assert.equal(target,origin);sent.push(packet);}};
  const slots:unknown[]=[],effects=new Map<number,Effect>(),pending:Array<()=>void>=[];let cursor=0,dirty=true,disposed=false,tree!:Node,frame!:Node;
  const same=(a:unknown[]|undefined,b:unknown[])=>!!a&&a.length===b.length&&a.every((item,index)=>Object.is(item,b[index]));
  const hooks={
    useState(initial:unknown){const i=cursor++;if(!(i in slots))slots[i]=initial;return [slots[i],(next:unknown)=>{assert(!disposed);if(!Object.is(slots[i],next)){slots[i]=next;dirty=true;}}];},
    useRef(initial:unknown){const i=cursor++;if(!(i in slots))slots[i]={current:initial};return slots[i];},
    useLayoutEffect(create:()=>void|(()=>void)){const i=cursor++,old=effects.get(i);pending.push(()=>{old?.cleanup?.();const cleanup=create();effects.set(i,{deps:[],cleanup:typeof cleanup==='function'?cleanup:undefined});});},
    useEffect(create:()=>void|(()=>void),deps:unknown[]){const i=cursor++,old=effects.get(i);if(!same(old?.deps,deps))pending.push(()=>{old?.cleanup?.();const cleanup=create();effects.set(i,{deps,cleanup:typeof cleanup==='function'?cleanup:undefined});});},
  };
  const navigation=function HeadAtlasLearningNavigation(){return null;};
  const teaching=function HeadAtlasReferenceTeaching(){return null;};
  const imports:Record<string,unknown>={
    react:hooks,'react/jsx-runtime':require('react/jsx-runtime'),
    './HeadAtlasLearningNavigation':{HeadAtlasLearningNavigation:navigation},
    './HeadAtlasReferenceTeaching':{HeadAtlasReferenceTeaching:teaching},
    './HeadTourPlayback':{HeadTourPlayback:function HeadTourPlayback(){return null;}},
    '../lib/head-guided-playback':require('../lib/head-guided-playback.ts'),
    '../lib/head-atlas-import':{HEAD_MANIFEST_SHA256:revision},
    '../lib/head-link-availability':{headLinksCurrent:()=>true},
    '../lib/head-live-selection':{HEAD_SELECTION_PROTOCOL,parseHeadSelection},
    '../lib/head-guided-focus':require('../lib/head-guided-focus.ts'),
  };
  const mod={exports:{} as {HeadAtlasGuidedModel:(props:{initialHref:string;sourceRevision:string;coverage:unknown})=>Node}};
  new Function('require','module','exports',code)((id:string)=>{assert(Object.hasOwn(imports,id),id);return imports[id];},mod,mod.exports);
  function walk(value:unknown,predicate:(node:Node)=>boolean):Node|undefined{
    if(Array.isArray(value)){for(const item of value){const found=walk(item,predicate);if(found)return found;}return;}
    if(!value||typeof value!=='object'||!('props'in value))return;
    const node=value as Node;return predicate(node)?node:walk(node.props.children,predicate);
  }
  function flush(){let cycles=0;do{assert(++cycles<20,'render loop');dirty=false;cursor=0;pending.length=0;
    tree=mod.exports.HeadAtlasGuidedModel({initialHref:pons,sourceRevision:revision,coverage:'Synthetic coverage'});
    frame=walk(tree,node=>node.type==='iframe')!;assert(frame);frame.props.ref.current={contentWindow,parentElement:{querySelector:()=>null}};
    for(const effect of pending)effect();
  }while(dirty);return tree;}
  const nav=()=>{const value=walk(tree,node=>node.type===navigation);assert(value);return value.props;};
  const status=()=>walk(nav().status,node=>node.props.role==='status')?.props.children as string;
  const fallback=()=>walk(nav().status,node=>node.type==='a'&&node.props['data-head-reload']!==undefined);
  const session=()=>String(sent.filter(packet=>packet.type===HEAD_SELECTION_PROTOCOL+'-request').at(-1)?.session);
  const deliver=(data:unknown,source:unknown=contentWindow,from=origin)=>{for(const listener of [...(listeners.get('message')??[])])listener({data,source,origin:from});flush();};
  const selected=(conceptId:string,sequence:number,sessionId=session())=>({type:HEAD_SELECTION_PROTOCOL,version:1,revision,session:sessionId,sequence,status:'selected',selection:headGuidedDestination(href(conceptId))!.target});
  const result=(command:number,status:'accepted'|'refused',sessionId=session())=>({type:HEAD_FOCUS_PROTOCOL+'-result',version:1,revision,session:sessionId,command,status});
  const command=()=>sent.filter(packet=>packet.type===HEAD_FOCUS_PROTOCOL).at(-1);
  const fireLatest=()=>{const [id,timer]=[...timers.entries()].at(-1)!;timers.delete(id);timer.callback();flush();};
  try{
    flush();const originalSrc=frame.props.src,originalRef=frame.props.ref;
    assert.equal(timers.size,1);assert.equal(nav().comparisonReady,false);assert.equal(nav().recoveryLinks,false);
    const initialWait=[...timers.values()][0].callback;
    assert.equal(nav().onNavigate(medulla),true);flush();
    assert.equal(nav().position.conceptId,'brainstem-medulla');assert.equal(frame.props.src,originalSrc);
    assert.equal(session(),'test-session-2-abcd','navigation before a snapshot starts a fresh handshake');
    assert.equal(timers.size,1);assert.equal([...timers.values()][0].delay,15000);
    initialWait();flush();assert.equal(fallback(),undefined,'stale initial timeout cannot end the new handshake');assert.equal(nav().recoveryLinks,false);
    fireLatest();
    assert.equal(fallback()?.props.href,medulla,'unanswered new handshake offers a standard link');
    assert.equal(nav().comparisonReady,false);assert.equal(nav().recoveryLinks,true);assert.equal(timers.size,0);
    assert.equal(nav().onNavigate(pons),true);flush();
    assert.equal(nav().recoveryLinks,false);assert.equal(session(),'test-session-3-abcd');assert.equal([...timers.values()][0].delay,15000);
    deliver({type:HEAD_SELECTION_PROTOCOL+'-ready',version:1,revision});
    assert.equal(session(),'test-session-4-abcd');
    deliver(selected('brainstem-pons',1));assert.equal(nav().comparisonReady,true);assert.equal(nav().recoveryLinks,false);
    assert.equal(status(),'Model selection matches this step.');
    assert.equal(nav().onNavigate(medulla),true);flush();
    assert.equal(pathname+search,medulla);assert.equal(nav().position.conceptId,'brainstem-medulla');
    assert.equal(frame.props.src,originalSrc);assert.equal(frame.props.ref,originalRef);
    assert.equal(command()?.command,1);assert.deepEqual(command()?.target,headGuidedDestination(medulla)!.target);
    assert.equal(nav().comparisonReady,false);assert.equal(nav().recoveryLinks,false);
    deliver(result(1,'accepted'));assert.equal(nav().comparisonReady,false,'ACK alone cannot unlock CT/MRI');assert.equal(nav().recoveryLinks,false);
    deliver(selected('brainstem-pons',1));assert.equal(nav().comparisonReady,false,'replayed old snapshot cannot unlock');
    deliver(selected('brainstem-medulla',2),'wrong-window');assert.equal(nav().comparisonReady,false);
    deliver(selected('brainstem-medulla',2),contentWindow,'https://other.test');assert.equal(nav().comparisonReady,false);
    deliver(selected('brainstem-medulla',2,'old-session-123456'));assert.equal(nav().comparisonReady,false);
    deliver({...selected('brainstem-medulla',2),revision:'0'.repeat(40)});assert.equal(nav().comparisonReady,false);
    deliver(selected('brainstem-pons',2));assert.equal(nav().comparisonReady,false,'new wrong concept snapshot cannot unlock');assert.equal(nav().recoveryLinks,false);
    deliver(selected('brainstem-medulla',3));assert.equal(nav().comparisonReady,true);
    assert.equal(timers.size,0);assert.equal(frame.props.src,originalSrc);
    history.pushState(null,'',midbrain);pop();flush();
    assert.equal(nav().position.conceptId,'brainstem-midbrain');assert.equal(command()?.command,2);assert.equal(frame.props.src,originalSrc);
    deliver(result(2,'refused','wrong-session-123456'));assert.equal(nav().comparisonReady,false);
    deliver(result(1,'refused'));assert.equal(nav().comparisonReady,false,'old result cannot refuse current command');
    deliver(result(2,'refused'));assert.equal(nav().comparisonReady,false);assert.equal(nav().recoveryLinks,true);assert.equal(fallback()?.props.href,midbrain);
    const show=walk(nav().status,node=>node.type==='button')!;show.props.onClick();flush();assert.equal(command()?.command,3);assert.equal(nav().recoveryLinks,false);
    assert.equal(nav().onNavigate(pons),true);flush();assert.equal(command()?.command,4);assert.equal(nav().recoveryLinks,false);
    assert.equal(frame.props.src,originalSrc);
    const timeout=[...timers.values()].at(-1)!;assert.equal(timeout.delay,10000);timeout.callback();flush();
    assert.equal(nav().comparisonReady,false);assert.equal(nav().recoveryLinks,true);assert.equal(fallback()?.props.href,pons);
    deliver(result(4,'accepted'));assert.equal(nav().comparisonReady,false,'late ACK cannot unlock');
    deliver({type:HEAD_SELECTION_PROTOCOL,version:1,revision,session:session(),sequence:4,status:'blocked',reason:'practice'});
    assert.equal(nav().onNavigate(medulla),true);flush();assert.equal(nav().position.conceptId,'brainstem-pons','practice locks step');
    assert.equal(frame.props.src,originalSrc);assert.equal(nav().comparisonReady,false);assert.equal(nav().recoveryLinks,false);
    assert.equal(status(),'Finish model practice before changing linked steps.');
    assert.equal(fallback(),undefined,'practice does not offer focus controls');
    deliver(selected('brainstem-pons',5));assert.equal(nav().comparisonReady,true);assert.equal(nav().recoveryLinks,false);
    assert.equal(nav().onNavigate(medulla),true);flush();assert.equal(command()?.command,5);
    assert.equal(nav().onNavigate(pons),true);flush();assert.equal(command()?.command,6);
    assert.equal(frame.props.src,originalSrc);assert.equal(nav().comparisonReady,false,'cached Previous snapshot cannot bypass a command');
    deliver(result(5,'accepted'));assert.equal(nav().comparisonReady,false,'superseded ACK cannot unlock');
    deliver(selected('brainstem-pons',6));assert.equal(nav().comparisonReady,false,'matching snapshot before latest ACK cannot unlock');
    deliver(result(6,'accepted'));assert.equal(nav().comparisonReady,false,'latest ACK still needs a subsequent snapshot');
    deliver(selected('brainstem-pons',7));assert.equal(nav().comparisonReady,true);
    deliver({type:HEAD_SELECTION_PROTOCOL,version:1,revision,session:session(),sequence:8,status:'blocked',reason:'unavailable'});
    assert.equal(nav().onNavigate(medulla),true);flush();
    assert.equal(session(),'test-session-5-abcd','navigation after unavailable starts a fresh handshake');
    assert.equal([...timers.values()][0].delay,15000);assert.equal(frame.props.src,originalSrc);
    fireLatest();
    assert.equal(fallback()?.props.href,medulla,'unanswered recovery handshake offers a standard link');
    assert.equal(timers.size,0);assert.equal(nav().comparisonReady,false);
    assert.equal(nav().onNavigate(pons),true);flush();
    assert.equal([...timers.values()][0].delay,15000);
    const staleTimeout=[...timers.values()][0].callback;
    deliver(selected('brainstem-pons',1));assert.equal(nav().comparisonReady,true);
    assert.equal(nav().onNavigate(medulla),true);flush();
    const firstFocus=command()!.command;
    deliver(result(firstFocus,'accepted'));
    deliver(selected('brainstem-medulla',2));assert.equal(nav().comparisonReady,true);
    const beforeBlocked=entries.slice(),beforeBlockedCommand=command()!.command;
    deliver({type:HEAD_SELECTION_PROTOCOL,version:1,revision,session:session(),sequence:3,status:'blocked',reason:'practice'});
    assert.equal(nav().onNavigate(midbrain),true);flush();
    assert.equal(nav().position.conceptId,'brainstem-medulla','ordinary blocked click does not change the displayed step');
    assert.deepEqual(entries,beforeBlocked,'ordinary blocked click creates no history entry');
    history.back();flush();
    assert.equal(pathname+search,pons,'Back changes the actual URL');
    assert.equal(nav().position.conceptId,'brainstem-medulla','practice keeps the displayed model step');
    assert.deepEqual(entries,beforeBlocked,'blocked Back preserves exact entries rather than replacing one');
    assert.equal(command()!.command,beforeBlockedCommand,'blocked Back sends no focus command');
    history.forward();flush();
    assert.equal(pathname+search,medulla);assert.deepEqual(entries,beforeBlocked);
    assert.equal(command()!.command,beforeBlockedCommand,'Forward cancels the queued Back target while blocked');
    deliver(selected('brainstem-medulla',4));
    assert.equal(nav().comparisonReady,true);assert.equal(command()!.command,beforeBlockedCommand,'canceled Back target never focuses');
    deliver({type:HEAD_SELECTION_PROTOCOL,version:1,revision,session:session(),sequence:5,status:'blocked',reason:'guided'});
    assert.equal(nav().recoveryLinks,false);
    history.back();flush();assert.equal(pathname+search,pons);
    assert.equal(nav().position.conceptId,'brainstem-medulla','in-model guide also retains displayed step');
    assert.deepEqual(entries,beforeBlocked);assert.equal(command()!.command,beforeBlockedCommand);
    deliver(selected('brainstem-pons',6),'wrong-window');
    deliver(selected('brainstem-pons',6),contentWindow,'https://foreign.test');
    deliver(selected('brainstem-pons',6,'stale-session-123456'));
    deliver({...selected('brainstem-pons',6),revision:'0'.repeat(40)});
    deliver(selected('brainstem-pons',5));
    assert.equal(command()!.command,beforeBlockedCommand,'invalid and stale messages cannot resume queued history');
    deliver(selected('brainstem-pons',6));
    const backFocus=command()!.command;
    assert.equal(backFocus,beforeBlockedCommand+1,'latest pending actual URL focuses after guide unlocks');
    assert.deepEqual(command()!.target,headGuidedDestination(pons)!.target);
    assert.equal(nav().comparisonReady,false);
    deliver(result(backFocus,'accepted'));assert.equal(nav().comparisonReady,false,'history ACK alone cannot unlock');
    deliver(selected('brainstem-pons',7));assert.equal(nav().comparisonReady,true);
    assert.equal(nav().position.conceptId,'brainstem-pons');assert.deepEqual(entries,beforeBlocked);
    deliver({type:HEAD_SELECTION_PROTOCOL,version:1,revision,session:session(),sequence:8,status:'blocked',reason:'practice'});
    history.forward();flush();assert.equal(pathname+search,medulla);
    assert.equal(nav().position.conceptId,'brainstem-pons');assert.equal(command()!.command,backFocus);
    deliver(selected('brainstem-medulla',9));
    const forwardFocus=command()!.command;assert.equal(forwardFocus,backFocus+1);
    assert.deepEqual(command()!.target,headGuidedDestination(medulla)!.target);
    deliver(result(forwardFocus,'accepted'));assert.equal(nav().comparisonReady,false);
    deliver(selected('brainstem-medulla',10));assert.equal(nav().comparisonReady,true);
    assert.deepEqual(entries,beforeBlocked,'Back/Forward never rewrites the history stack');
    deliver({type:HEAD_SELECTION_PROTOCOL,version:1,revision,session:session(),sequence:11,status:'blocked',reason:'practice'});
    history.back();flush();assert.equal(pathname+search,pons);
    history.replaceState(null,'',medulla); // Simulate a separate router update without popstate.
    deliver(selected('brainstem-medulla',12));
    assert.equal(command()!.command,forwardFocus,'a pending href that no longer matches the actual URL cannot focus');
    assert.equal(nav().position.conceptId,'brainstem-medulla');assert.equal(nav().comparisonReady,true);
    assert.equal(nav().recoveryLinks,false);
    deliver(selected('brainstem-pons',13));
    assert.equal(nav().comparisonReady,false);assert.equal(nav().recoveryLinks,false,'different live selection is not a recovery failure');
    deliver(selected('brainstem-medulla',14));
    assert.equal(nav().comparisonReady,true);assert.equal(nav().recoveryLinks,false);
    for(const effect of effects.values())effect.cleanup?.();disposed=true;
    assert.equal(listeners.get('message')?.size,0);assert.equal(listeners.get('popstate')?.size,0);assert.equal(timers.size,0);
    staleTimeout?.();
  }finally{
    if(!disposed)for(const effect of effects.values())effect.cleanup?.();
    if(oldWindow===undefined)delete (globalThis as any).window;else Object.defineProperty(globalThis,'window',{configurable:true,value:oldWindow});
    if(oldHistory===undefined)delete (globalThis as any).history;else Object.defineProperty(globalThis,'history',{configurable:true,value:oldHistory});
    if(oldCrypto)Object.defineProperty(globalThis,'crypto',oldCrypto);else delete (globalThis as any).crypto;
  }
});
