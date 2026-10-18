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

test('an abandoned package/study render cannot retire the visible idle launch',()=>{
  const {a,study}=fixture(),h=harness(study);try{
    const visible=h.flush(),other=fixture('replacement');
    h.abandon(other.study);
    assert.equal(visible.startTarget(a),true);
    h.flush();assert.equal(h.current.active,true);assert.equal(h.current.total,1);
    assert.equal(h.requests.length,1);assert.equal(h.requests[0].entry,a,'only the original verified mask is requested');
  }finally{h.unmount();}
});

test('speculative replacement callbacks cannot launch a mask request before commit',()=>{
  const {a,study}=fixture(),other=fixture('replacement'),h=harness(study);try{
    const visible=h.flush(),speculative=h.abandon(other.study);
    assert.equal(speculative.startTarget(other.a),false);
    h.flush();assert.equal(h.current.active,false);assert.equal(h.requests.length,0);
    assert.equal(visible.startTarget(a),true);
    h.flush();assert.equal(h.requests[0]?.entry,a);
  }finally{h.unmount();}
});

for(const action of ['next','finish'] as const)test(`visible active ${action} remains usable after an abandoned replacement`,async()=>{
  const {a,b,study,loaded}=fixture(),other=fixture('replacement'),h=harness(study);try{
    h.flush().startTargets([a,b],'label');h.flush();
    assert.equal(h.requests[0].entry,a);
    h.requests[0].resolve(loaded(a));await h.settle();
    const visible=h.current;
    h.abandon(other.study);
    visible[action]();h.flush();
    if(action==='next'){
      assert.equal(h.current.active,true);assert.equal(h.current.index,1);
      assert.equal(h.requests[1].entry,b);
      visible.finish();h.flush();assert.equal(h.current.active,true,'same-render older callback stays retired after current navigation');
    }else{assert.equal(h.current.active,false);assert.equal(h.current.finished,true);assert.equal(h.current.total,2);}
    assert(h.requests.every(request=>study.definition.entries.includes(request.entry)),'no replacement-study mask was loaded');
  }finally{h.unmount();}
});

test('a visible completed result can begin its exact missed-mask follow-up after an abandoned replacement',async()=>{
  const {a,b,study,loaded}=fixture(),other=fixture('replacement'),h=harness(study);try{
    h.flush().startTargets([a],'label');h.flush();h.requests[0].resolve(loaded(a));await h.settle();
    h.current.setChoice(b.id);h.flush().submit();h.flush();
    assert.equal(h.current.outcomes[a.id],'incorrect');
    h.current.next();h.flush();assert.equal(h.current.finished,true);
    const visible=h.current,original=visible.score;
    h.abandon(other.study);
    assert.equal(visible.revisitSubset([a],'label'),true);
    h.flush();assert.equal(h.current.active,true);assert.equal(h.current.total,1);
    assert.deepEqual(h.current.originalScore,original);
    assert.equal(h.requests[1].entry,a,'follow-up loads only the saved current-study mask');
    assert.equal(visible.revisitSubset([a],'label'),false,'same completed snapshot cannot start twice');
  }finally{h.unmount();}
});

test('a genuine replacement commit retires old callbacks and accepts only new verified targets',()=>{
  const {a,study}=fixture(),other=fixture('replacement'),h=harness(study);try{
    const old=h.flush();h.replace(other.study);
    assert.equal(old.startTarget(a),false);
    assert.equal(h.current.startTarget(a),false,'foreign entry cannot enter the replacement set');
    assert.equal(h.current.startTarget(other.a),true);
    h.flush();assert.equal(h.requests.length,1);assert.equal(h.requests[0].entry,other.a);
  }finally{h.unmount();}
});

test('same-render duplicate launch, effect replay and unmount preserve the lifecycle guard',()=>{
  const {a,b,study}=fixture(),h=harness(study);try{
    const idle=h.flush();assert.equal(idle.startTargets([a,b],'label'),true);
    assert.equal(idle.startTargets([a],'label'),false);
    h.flush();assert.equal(h.current.total,2);assert.equal(h.requests.length,1);
    const currentEnd=h.current.end;assert(h.replayMount()>=2,'navigation and follow-up commit effects actually replay');
    currentEnd();h.flush();assert.equal(h.current.active,false);
    const launch=h.current.startTarget;h.unmount();assert.equal(launch(a),false);h.flush();assert.equal(h.current.active,false);
  }finally{h.unmount();}
});

test('the visible answer still scores its exact mask after an abandoned replacement',async()=>{
  const {a,study,loaded}=fixture(),h=harness(study);try{
    h.flush().startTarget(a);h.flush();h.requests[0].resolve(loaded(a));await h.settle();
    h.current.acceptPick([0,0,0]);h.flush();const visible=h.current;
    h.abandon(fixture('replacement').study);
    visible.submit();h.flush();
    assert.equal(h.current.outcome,'correct');
    assert.deepEqual(h.current.outcomes,{[a.id]:'correct'});
    assert.equal(h.current.score.correct,1);assert.equal(h.requests.length,1);
  }finally{h.unmount();}
});

test('replacement layout commit retires old answer callbacks before passive question cleanup',async()=>{
  const {a,study,loaded}=fixture(),h=harness(study);try{
    h.flush().startTarget(a);h.flush();h.requests[0].resolve(loaded(a));await h.settle();
    h.current.acceptPick([0,0,0]);h.flush();const visible=h.current;
    h.commitLayout(fixture('replacement').study);
    const writes=h.writes;
    visible.submit();visible.reveal();visible.acceptPick([1,1,1]);visible.retry();
    assert.equal(h.writes,writes,'no old answer mutates state before passive cleanup can hide it');
    h.flush();assert.deepEqual(h.current.outcomes,{});assert.equal(h.current.target,null);
  }finally{h.unmount();}
});
