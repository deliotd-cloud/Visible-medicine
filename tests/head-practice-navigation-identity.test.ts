import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {createNativeVolumeGeometry} from '../lib/head-atlas-geometry.mjs';
import type {HeadEntry,LoadedEntry,LoadedStudy,LocalHeadPackage} from '../lib/head-atlas-import.ts';

const require=createRequire(import.meta.url);
const source=readFileSync(new URL('../components/HeadAtlasPractice.tsx',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
type Hook=ReturnType<typeof import('../components/HeadAtlasPractice').useHeadAtlasPractice>;
type Effect={kind:'layout'|'passive';deps:unknown[];setup:()=>void|(()=>void);cleanup?:()=>void};

function fixture(){
  const shape=[2,2,2],affine=[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];
  const entry=(id:string):HeadEntry=>({id,label:id,family:'test',representation:'partial_mask',color:[1,0,0],opacity:{fill:.25,outline:.9},mask:{file:id+'.bin',sha256:id.padEnd(64,'a'),dtype:'uint8',shape_kji:shape,offset_kji:[0,0,0],native_shape_kji:shape,ijk_to_ras:affine}});
  const a=entry('a'),b=entry('b'),c=entry('c');
  const definition={image:{file:'image.bin',sha256:'d'.repeat(64),dtype:'int16',shape_kji:shape,ijk_to_ras:affine},entries:[a,b,c]};
  const study:LoadedStudy={definition,data:new Int16Array(8),geometry:createNativeVolumeGeometry(definition.image),range:[0,1]};
  const loaded=(item:HeadEntry):LoadedEntry=>({entry:item,mask:new Uint8Array([1,0,0,0,0,0,0,0]),focus:[0,0,0]});
  return {a,b,c,study,loaded};
}

function harness(initialStudy:LoadedStudy){
  const slots:unknown[]=[],effects=new Map<number,Effect>();
  const requests:Array<{entry:HeadEntry;signal:AbortSignal;resolve:(value:LoadedEntry)=>void;reject:(error:Error)=>void}>=[];
  let cursor=0,dirty=true,pending:Array<()=>void>=[],pendingLayout:Array<()=>void>=[],pkg={} as LocalHeadPackage,study:LoadedStudy|null=initialStudy;
  const equal=(a:unknown[]|undefined,b:unknown[])=>!!a&&a.length===b.length&&a.every((value,index)=>Object.is(value,b[index]));
  const hooks={
    useState(initial:unknown){const index=cursor++;if(!(index in slots))slots[index]=typeof initial==='function'?initial():initial;return [slots[index],(value:unknown)=>{const next=typeof value==='function'?value(slots[index]):value;if(!Object.is(next,slots[index])){slots[index]=next;dirty=true;}}];},
    useRef(initial:unknown){const index=cursor++;if(!(index in slots))slots[index]={current:initial};return slots[index];},
    useMemo(create:()=>unknown,deps:unknown[]){const index=cursor++,old=slots[index] as {deps:unknown[];value:unknown}|undefined;if(!equal(old?.deps,deps))slots[index]={deps,value:create()};return (slots[index] as {value:unknown}).value;},
    useEffect(create:()=>void|(()=>void),deps:unknown[]){const index=cursor++,old=effects.get(index);if(!equal(old?.deps,deps))pending.push(()=>{old?.cleanup?.();const cleanup=create();effects.set(index,{kind:'passive',deps,setup:create,cleanup:typeof cleanup==='function'?cleanup:undefined});});},
    useLayoutEffect(create:()=>void|(()=>void),deps:unknown[]){const index=cursor++,old=effects.get(index);if(!equal(old?.deps,deps))pendingLayout.push(()=>{old?.cleanup?.();const cleanup=create();effects.set(index,{kind:'layout',deps,setup:create,cleanup:typeof cleanup==='function'?cleanup:undefined});});},
  };
  const module={exports:{} as Pick<typeof import('../components/HeadAtlasPractice'),'useHeadAtlasPractice'|'HeadAtlasPractice'>};
  const load=(name:string)=>name==='react'?hooks:name==='./HeadAtlasPracticeReview'?{HeadAtlasPracticeReview:()=>null,HeadAtlasPracticeFeedback:()=>null}:name==='./HeadPracticeSummaryDownload'?{HeadPracticeSummaryDownload:()=>null}:name==='../lib/head-atlas-import'?{loadHeadEntry:(_pkg:LocalHeadPackage,_study:LoadedStudy,entry:HeadEntry,signal:AbortSignal)=>new Promise<LoadedEntry>((resolve,reject)=>requests.push({entry,signal,resolve,reject}))}:name.startsWith('../lib/')?require(name+'.ts'):require(name);
  new Function('require','module','exports',compiled)(load,module,module.exports);
  let current:Hook;
  function flush(){let passes=0;do{assert(++passes<25,'hook effects settle');dirty=false;cursor=0;pending=[];pendingLayout=[];current=module.exports.useHeadAtlasPractice(pkg,study);for(const effect of pendingLayout)effect();for(const effect of pending)effect();}while(dirty);return current!;}
  function button(label:string){
    const effect=hooks.useEffect,layout=hooks.useLayoutEffect;hooks.useEffect=()=>undefined;hooks.useLayoutEffect=()=>undefined;
    let tree:unknown;try{tree=module.exports.HeadAtlasPractice({practice:current!,study,familyNames:{}});}finally{hooks.useEffect=effect;hooks.useLayoutEffect=layout;}
    function find(node:unknown):{onClick:()=>void}|undefined{
      if(Array.isArray(node)){for(const child of node){const found=find(child);if(found)return found;}return;}
      if(!node||typeof node!=='object'||!('props' in node))return;
      const element=node as {type:unknown;props:{children?:unknown;onClick?:()=>void}};
      if(element.type==='button'&&element.props.children===label&&element.props.onClick)return {onClick:element.props.onClick};
      return find(element.props.children);
    }
    const found=find(tree);assert(found,`button ${label}`);return found.onClick;
  }
  return {requests,flush,button,get current(){return current!;},async settle(){await Promise.resolve();await Promise.resolve();return flush();},replace(next:LoadedStudy|null){pkg={} as LocalHeadPackage;study=next;return flush();},replayMount(){let count=0;for(const effect of effects.values())if(effect.kind==='layout'){
    effect.cleanup?.();const cleanup=effect.setup();effect.cleanup=typeof cleanup==='function'?cleanup:undefined;count++;
  }return count;},unmount(){for(const effect of effects.values())effect.cleanup?.();}};
}

test('retired question navigation cannot move or finish a replacement set',async()=>{
  const {a,b,c,study,loaded}=fixture(),h=harness(study);
  h.flush().startTargets([a,b],'label');h.flush();
  h.requests[0].resolve(loaded(a));await h.settle();
  const oldSkip=h.button('Skip question (unanswered)'),oldEnd=h.button('End set');
  h.current.setChoice(b.id);h.flush().submit();h.flush();
  const oldNext=h.button('Next question'),oldFinish=h.current.finish;
  h.current.startTargets([c,a],'label');h.flush();
  for(const action of [oldSkip,oldNext,oldFinish,oldEnd])action();
  h.flush();assert.equal(h.current.active,true);assert.equal(h.current.index,0);assert.equal(h.current.total,2);
  assert.equal(h.requests[1].entry,c);
  h.unmount();
});

test('navigation retires earlier question and same-render repeats; current loading, error and feedback controls work',async()=>{
  const {a,b,c,study,loaded}=fixture(),h=harness(study);
  h.flush().startTargets([a,b,c],'label');h.flush();
  h.requests[0].resolve(loaded(a));await h.settle();
  const firstSkip=h.button('Skip question (unanswered)'),firstFinish=h.current.finish;
  firstSkip();firstSkip();firstFinish();h.flush();
  assert.equal(h.current.index,1,'one click transition cannot advance twice');
  assert.equal(h.current.active,true,'a same-render finish cannot end the next question');
  h.requests[1].reject(Error('read failed'));await h.settle();
  const errorSkip=h.button('Skip question (unanswered)');errorSkip();h.flush();
  assert.equal(h.current.index,2);firstSkip();errorSkip();h.flush();assert.equal(h.current.index,2);
  h.requests[2].resolve(loaded(c));await h.settle();
  h.current.setChoice(c.id);h.flush().submit();h.flush();
  const next=h.button('See results');next();next();h.flush();
  assert.equal(h.current.finished,true);assert.equal(h.current.active,false);
  assert.deepEqual(h.current.results.map(item=>item.outcome),['unanswered','unanswered','correct']);
  h.unmount();
});

test('replacement study and unmount retire old controls; follow-up preserves original score',async()=>{
  const {a,b,study,loaded}=fixture(),h=harness(study);
  h.flush().startTargets([a,b],'label');h.flush();
  h.requests[0].resolve(loaded(a));await h.settle();h.current.setChoice(b.id);h.flush().submit();h.flush();
  const oldNext=h.button('Next question'),oldEnd=h.button('End set');
  h.current.finish();h.flush();assert.equal(h.current.revisitEntries.length,2);
  h.current.revisit();h.flush();const original=h.current.originalScore;
  oldNext();oldEnd();h.flush();assert.equal(h.current.active,true);assert.deepEqual(h.current.originalScore,original);
  const currentFinish=h.current.finish;
  const replacement=fixture();h.replace(replacement.study);currentFinish();h.flush();assert.equal(h.current.active,false);assert.equal(h.current.finished,false);
  h.current.end();h.flush();assert.equal(h.current.total,0,'current idle reset remains available');
  h.current.startTargets([replacement.a],'label');h.flush();const unmountedEnd=h.current.end;h.unmount();unmountedEnd();
  h.flush();assert.equal(h.current.active,true,'unmounted callback cannot mutate retained hook state');
});

test('development effect cleanup/setup replay keeps current navigation usable',()=>{
  const {a,study}=fixture(),h=harness(study);
  h.flush().startTargets([a],'label');h.flush();
  const currentEnd=h.current.end;assert(h.replayMount()>=2,'navigation and follow-up layout effects replay');currentEnd();h.flush();
  assert.equal(h.current.active,false);assert.equal(h.current.total,0);
  h.unmount();
});

test('retired quiz launch controls cannot start a set after scan/package replacement, close or unmount',()=>{
  for(const kind of ['random','single','batch'] as const)for(const scenario of ['replacement','package-only','closed','unmounted']){
    const {a,b,study}=fixture(),h=harness(study);try{
      const original=h.flush();
      const launch=kind==='random'?()=>original.start():kind==='single'?()=>original.startTarget(a):()=>original.startTargets([a,b],'label');
      if(scenario==='replacement')h.replace(fixture().study);
      else if(scenario==='package-only')h.replace(study);
      else if(scenario==='closed')h.replace(null);
      else h.unmount();
      launch();h.flush();
      assert.equal(h.current.active,false,`${kind}/${scenario}: retired launch must stay inactive`);
      assert.equal(h.current.finished,false);
      assert.equal(h.current.total,0);
      assert.equal(h.requests.length,0,'no old mask should be requested in another scan/session');
    }finally{h.unmount();}
  }
});

test('a same-render launch is consumed once while fresh current launch controls remain usable',()=>{
  const {a,b,c,study}=fixture(),h=harness(study);try{
    const first=h.flush();
    assert.equal(first.startTargets([a,b],'label'),true);
    assert.equal(first.startTargets([c],'recall'),false,'queued launch cannot replace the set just started');
    first.start();first.startTarget(c);
    h.flush();assert.equal(h.current.active,true);assert.equal(h.current.total,2);assert.equal(h.current.mode,'label');
    assert.equal(h.requests.length,1);assert.equal(h.requests[0].entry,a);
    h.current.end();h.flush();
    const replacement=fixture();h.replace(replacement.study);
    assert.equal(h.current.startTarget(replacement.c),true);
    h.flush();assert.equal(h.current.total,1);assert.equal(h.requests[1].entry,replacement.c);
    h.current.end();h.flush();assert(h.replayMount()>=2,'current committed layout effects replay');
    h.current.start();h.flush();assert.equal(h.current.active,true);assert.equal(h.current.total,3);
  }finally{h.unmount();}
});
