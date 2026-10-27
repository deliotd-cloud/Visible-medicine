import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {createNativeVolumeGeometry} from '../lib/head-atlas-geometry.mjs';
import type {HeadEntry,LoadedEntry,LoadedStudy,LocalHeadPackage} from '../lib/head-atlas-import.ts';

const require=createRequire(import.meta.url);
const code=ts.transpileModule(readFileSync(new URL('../components/HeadAtlasPractice.tsx',import.meta.url),'utf8'),
  {compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
type Hook=ReturnType<typeof import('../components/HeadAtlasPractice').useHeadAtlasPractice>;
type Effect={kind:'layout'|'passive';deps:unknown[];create:()=>void|(()=>void);cleanup?:()=>void};
const affine=[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];
function fixture(prefix='current'){
  const entry=(name:string):HeadEntry=>({id:`${prefix}:${name}`,label:name,family:'synthetic',representation:'partial-mask',
    color:[1,0,0],opacity:{fill:.25,outline:.9},mask:{file:`${name}.bin`,sha256:name.padEnd(64,'a'),dtype:'uint8',
      shape_kji:[2,2,2],offset_kji:[0,0,0],native_shape_kji:[2,2,2],ijk_to_ras:affine}});
  const a=entry('a'),b=entry('b'),c=entry('c');
  const definition={image:{file:'synthetic.bin',sha256:'f'.repeat(64),dtype:'int16',shape_kji:[2,2,2],ijk_to_ras:affine},entries:[a,b,c]};
  const study={definition,data:new Int16Array(8),geometry:createNativeVolumeGeometry(definition.image),range:[0,1]} as LoadedStudy;
  const loaded=(item:HeadEntry)=>({entry:item,mask:new Uint8Array([1,0,0,0,0,0,0,0]),focus:[0,0,0]}) as LoadedEntry;
  return {a,b,c,study,loaded};
}

function harness(initialStudy:LoadedStudy){
  const slots:any[]=[],effects=new Map<number,Effect>();
  const requests:Array<{entry:HeadEntry;signal:AbortSignal;resolve:(value:LoadedEntry)=>void;reject:(error:Error)=>void}>=[];
  let cursor=0,dirty=false,writes=0,pending=new Map<number,Effect>(),pkg={} as LocalHeadPackage,study:LoadedStudy|null=initialStudy,current!:Hook;
  const same=(a:unknown[]|undefined,b:unknown[])=>!!a&&a.length===b.length&&a.every((value,index)=>Object.is(value,b[index]));
  const hooks={
    useState(initial:unknown){const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?(initial as ()=>unknown)():initial;
      return [slots[i],(value:any)=>{const next=typeof value==='function'?value(slots[i]):value;if(!Object.is(next,slots[i])){slots[i]=next;dirty=true;writes++;}}];},
    useRef(initial:unknown){const i=cursor++;return slots[i]??(slots[i]={current:initial});},
    useMemo(create:()=>unknown,deps:unknown[]){const i=cursor++,old=slots[i] as {deps:unknown[];value:unknown}|undefined;
      if(!same(old?.deps,deps))slots[i]={deps,value:create()};return slots[i].value;},
    useEffect(create:Effect['create'],deps:unknown[]){pending.set(cursor++,{kind:'passive',deps,create});},
    useLayoutEffect(create:Effect['create'],deps:unknown[]){pending.set(cursor++,{kind:'layout',deps,create});},
  };
  const mod={exports:{} as Pick<typeof import('../components/HeadAtlasPractice'),'useHeadAtlasPractice'>};
  new Function('require','module','exports',code)((name:string)=>name==='react'?hooks:
    name==='./HeadAtlasPracticeReview'?{HeadAtlasPracticeReview:()=>null,HeadAtlasPracticeFeedback:()=>null}:
    name==='./HeadPracticeSummaryDownload'?{HeadPracticeSummaryDownload:()=>null}:
    name==='../lib/head-atlas-import'?{loadHeadEntry:(_pkg:LocalHeadPackage,_study:LoadedStudy,entry:HeadEntry,signal:AbortSignal)=>new Promise<LoadedEntry>((resolve,reject)=>requests.push({entry,signal,resolve,reject}))}:
    name.startsWith('../lib/')?require(name+'.ts'):require(name),mod,mod.exports);
  function runEffects(layoutOnly=false){for(const kind of ['layout','passive'] as const)for(const [i,next]of pending){if(next.kind!==kind||layoutOnly&&kind!=='layout')continue;
    const old=effects.get(i);if(old&&same(old.deps,next.deps))continue;old?.cleanup?.();
    const cleanup=next.create();effects.set(i,{...next,cleanup:typeof cleanup==='function'?cleanup:undefined});}}
  function render(nextPkg=pkg,nextStudy=study,commit=true,layoutOnly=false){
    const before=slots.slice();let result!:Hook;cursor=0;pending=new Map();result=mod.exports.useHeadAtlasPractice(nextPkg,nextStudy);
    if(!commit){slots.splice(0,slots.length,...before);return result;}
    pkg=nextPkg;study=nextStudy;current=result;runEffects(layoutOnly);return result;
  }
  function flush(){let rounds=0;do{assert(++rounds<25,'practice effect loop');dirty=false;render();}while(dirty);return current;}
  function replace(nextStudy:LoadedStudy|null=study,nextPkg={} as LocalHeadPackage){dirty=false;render(nextPkg,nextStudy);return flush();}
  function abandon(nextStudy:LoadedStudy|null=study,nextPkg={} as LocalHeadPackage){return render(nextPkg,nextStudy,false);}
  function unmount(){for(const effect of effects.values())effect.cleanup?.();effects.clear();}
  return {requests,render,flush,replace,abandon,unmount,get current(){return current;},get writes(){return writes;},commitLayout(next:LoadedStudy){return render({} as LocalHeadPackage,next,true,true);},
    replayMount(){let count=0;for(const effect of effects.values())if(effect.kind==='layout'){
      effect.cleanup?.();const cleanup=effect.create();effect.cleanup=typeof cleanup==='function'?cleanup:undefined;count++;
    }return count;},
    async settle(){await Promise.resolve();await Promise.resolve();return flush();}};
}


function watchFocus(h:ReturnType<typeof harness>){
  let focus='other',scrolls=0,headings=0,feedback=0;
  const panel={scrollTo(){scrolls++;},getBoundingClientRect(){return {top:0,bottom:800};},scrollTop:100};
  const heading={focus(){focus='question';headings++;},closest(){return panel;},getBoundingClientRect(){return {top:100,bottom:150};}};
  h.current.headingRef.current=heading as unknown as HTMLHeadingElement;
  h.current.feedbackRef.current={...heading,focus(){focus='feedback';feedback++;}} as unknown as HTMLHeadingElement;
  return {get focus(){return focus;},get scrolls(){return scrolls;},get headings(){return headings;},get feedback(){return feedback;},leave(){focus='scan';}};
}

test('a delayed mask preserves focus and panel scroll after the learner moves to the scan',async()=>{
 const {a,study,loaded}=fixture(),h=harness(study);try{
  h.flush();const seen=watchFocus(h);h.current.startTarget(a);h.flush();assert.equal(seen.focus,'question');
  seen.leave();const scrolls=seen.scrolls,headings=seen.headings;h.requests[0].resolve(loaded(a));await h.settle();
  assert.equal(h.current.target?.entry,a);assert.equal(seen.focus,'scan');assert.equal(seen.scrolls,scrolls);assert.equal(seen.headings,headings);
 }finally{h.unmount();}
});
test('load failure preserves focus, while explicit retry deliberately focuses the question',async()=>{
 const {a,study,loaded}=fixture(),h=harness(study);try{
  h.flush();const seen=watchFocus(h);h.current.startTarget(a);h.flush();seen.leave();const scrolls=seen.scrolls;
  h.requests[0].reject(new Error('Synthetic unavailable mask'));await h.settle();
  assert.match(h.current.error,/Synthetic unavailable/);assert.equal(seen.focus,'scan');assert.equal(seen.scrolls,scrolls);
  h.current.retryOpening();h.flush();assert.equal(seen.focus,'question');assert.equal(h.requests.length,2);
  seen.leave();h.requests[1].resolve(loaded(a));await h.settle();assert.equal(seen.focus,'scan');
 }finally{h.unmount();}
});
test('explicit next, feedback, unscored retry and results retain deliberate focus transitions',async()=>{
 const {a,b,study,loaded}=fixture(),h=harness(study);try{
  h.flush();const seen=watchFocus(h);h.current.startTargets([a,b],'label');h.flush();h.requests[0].resolve(loaded(a));await h.settle();
  h.current.reveal();h.flush();assert.equal(seen.focus,'feedback');
  h.current.retry();h.flush();assert.equal(seen.focus,'question');assert.equal(h.current.score.revealed,1);
  seen.leave();h.current.next();h.flush();assert.equal(seen.focus,'question');assert.equal(h.current.index,1);
  seen.leave();h.requests[1].resolve(loaded(b));await h.settle();assert.equal(seen.focus,'scan');
  h.current.finish();h.flush();assert.equal(seen.focus,'question');assert.equal(h.current.finished,true);assert.equal(h.current.score.revealed,1);
 }finally{h.unmount();}
});
test('an abandoned question cannot refocus or replace a later question',async()=>{
 const {a,b,study,loaded}=fixture(),h=harness(study);try{
  h.flush();const seen=watchFocus(h);h.current.startTargets([a,b]);h.flush();h.current.next();h.flush();
  assert.equal(h.requests[0].signal.aborted,true);seen.leave();const scrolls=seen.scrolls;
  h.requests[0].resolve(loaded(a));await h.settle();assert.equal(h.current.target,null);assert.equal(seen.focus,'scan');assert.equal(seen.scrolls,scrolls);
  h.requests[1].resolve(loaded(b));await h.settle();assert.equal(h.flush().target?.entry,b);assert.equal(seen.focus,'scan');
 }finally{h.unmount();}
});
