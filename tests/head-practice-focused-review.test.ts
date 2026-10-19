import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {createNativeVolumeGeometry} from '../lib/head-atlas-geometry.mjs';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import type {HeadEntry,LoadedEntry,LoadedStudy,LocalHeadPackage} from '../lib/head-atlas-import.ts';
import type {PracticeMode} from '../lib/head-atlas-practice.ts';

const require=createRequire(import.meta.url);
const source=readFileSync(new URL('../components/HeadAtlasPractice.tsx',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
type Request={entry:HeadEntry;signal:AbortSignal;options?:{maskOnly?:boolean};resolve:(value:LoadedEntry)=>void};
type Effect={kind:'layout'|'passive';deps:unknown[];cleanup?:()=>void};

function fixture(modality:'CT'|'MRI'='CT'){
  const shape=[2,2,2],affine=[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];
  const entry=(id:string):HeadEntry=>({id,label:id,family:'bst',representation:'partial_mask',color:[1,0,0],opacity:{fill:.25,outline:.9},mask:{file:id+'.bin',sha256:id.padEnd(64,'a'),dtype:'uint8',shape_kji:shape,offset_kji:[0,0,0],native_shape_kji:shape,ijk_to_ras:affine}});
  const a=entry('a'),b=entry('b'),c=entry('c'),d=entry('d');
  const definition={image:{file:`${modality}.bin`,sha256:'f'.repeat(64),dtype:'int16',shape_kji:shape,ijk_to_ras:affine},entries:[a,b,c,d]};
  const study:LoadedStudy={definition,data:new Int16Array(8),geometry:createNativeVolumeGeometry(definition.image),range:[0,1]};
  const loaded=(item:HeadEntry):LoadedEntry=>({entry:item,mask:new Uint8Array([1,0,0,0,0,0,0,0]),focus:[0,0,0]});
  return {a,b,c,d,study,loaded};
}

/** Deterministic committed-effect hook runner using the actual component bindings. */
function harness(initial:LoadedStudy,modality:'CT'|'MRI'){
  const slots:unknown[]=[],effects=new Map<number,Effect>(),requests:Request[]=[];
  let cursor=0,dirty=true,pending:Array<()=>void>=[],pendingLayout:Array<()=>void>=[],pkg={} as LocalHeadPackage,study:LoadedStudy|null=initial;
  const equal=(a:unknown[]|undefined,b:unknown[])=>!!a&&a.length===b.length&&a.every((v,i)=>Object.is(v,b[i]));
  const hooks={
    useState(initialValue:unknown){const i=cursor++;if(!(i in slots))slots[i]=typeof initialValue==='function'?initialValue():initialValue;return [slots[i],(value:unknown)=>{const next=typeof value==='function'?value(slots[i]):value;if(!Object.is(next,slots[i])){slots[i]=next;dirty=true;}}];},
    useRef(initialValue:unknown){const i=cursor++;if(!(i in slots))slots[i]={current:initialValue};return slots[i];},
    useMemo(create:()=>unknown,deps:unknown[]){const i=cursor++,old=slots[i] as {deps:unknown[];value:unknown}|undefined;if(!equal(old?.deps,deps))slots[i]={deps,value:create()};return (slots[i] as {value:unknown}).value;},
    useEffect(create:()=>void|(()=>void),deps:unknown[]){const i=cursor++,old=effects.get(i);if(!equal(old?.deps,deps))pending.push(()=>{old?.cleanup?.();const cleanup=create();effects.set(i,{kind:'passive',deps,cleanup:typeof cleanup==='function'?cleanup:undefined});});},
    useLayoutEffect(create:()=>void|(()=>void),deps:unknown[]){const i=cursor++,old=effects.get(i);if(!equal(old?.deps,deps))pendingLayout.push(()=>{old?.cleanup?.();const cleanup=create();effects.set(i,{kind:'layout',deps,cleanup:typeof cleanup==='function'?cleanup:undefined});});},
  };
  const Review=()=>null,Feedback=()=>null,Summary=()=>null;
  const mod={exports:{} as Pick<typeof import('../components/HeadAtlasPractice'),'useHeadAtlasPractice'|'HeadAtlasPractice'>};
  const load=(name:string)=>name==='react'?hooks:name==='./HeadAtlasPracticeReview'?{HeadAtlasPracticeReview:Review,HeadAtlasPracticeFeedback:Feedback}:name==='./HeadPracticeSummaryDownload'?{HeadPracticeSummaryDownload:Summary}:name==='../lib/head-atlas-import'?{loadHeadEntry:(_pkg:LocalHeadPackage,_study:LoadedStudy,entry:HeadEntry,signal:AbortSignal,options?:{maskOnly?:boolean})=>new Promise<LoadedEntry>(resolve=>requests.push({entry,signal,options,resolve}))}:name.startsWith('../lib/')?require(name+'.ts'):require(name);
  new Function('require','module','exports',compiled)(load,mod,mod.exports);
  let current:ReturnType<typeof mod.exports.useHeadAtlasPractice>;
  function flush(){let passes=0;do{assert(++passes<25,'hook effects settle');dirty=false;cursor=0;pending=[];pendingLayout=[];current=mod.exports.useHeadAtlasPractice(pkg,study);for(const effect of pendingLayout)effect();for(const effect of pending)effect();}while(dirty);return current!;}
  function reviews(){
    const effect=hooks.useEffect,layout=hooks.useLayoutEffect;hooks.useEffect=()=>undefined;hooks.useLayoutEffect=()=>undefined;
    let tree:unknown;try{tree=mod.exports.HeadAtlasPractice({practice:current!,study,familyNames:{},reviewContext:{modality,revision:HEAD_LINK_REVISION,onSelect:()=>{}}});}finally{hooks.useEffect=effect;hooks.useLayoutEffect=layout;}
    const found:Array<Record<string,unknown>>=[];
    function visit(value:unknown):void{if(Array.isArray(value)){value.forEach(visit);return;}if(!value||typeof value!=='object'||!('props' in value))return;const node=value as {type:unknown;props:Record<string,unknown>};if(node.type===Review)found.push(node.props);visit(node.props.children);}
    visit(tree);return found;
  }
  return {requests,flush,reviews,get current(){return current!;},async settle(){await Promise.resolve();await Promise.resolve();return flush();},replace(next:LoadedStudy|null,changePackage=true){if(changePackage)pkg={} as LocalHeadPackage;study=next;return flush();},dispose(){for(const effect of effects.values())effect.cleanup?.();}};
}

async function complete(h:ReturnType<typeof harness>,entries:HeadEntry[],loaded:(entry:HeadEntry)=>LoadedEntry){
  assert.equal(h.flush().startTargets(entries,'label'),true);h.flush();
  for(const [index,entry] of entries.entries()){
    assert.equal(h.requests[index].entry,entry);
    h.requests[index].resolve(loaded(entry));await h.settle();
    if(index===0){h.current.setChoice(entries[1].id);h.flush().submit();}
    else if(index===1)h.current.reveal();
    else if(index===3){h.current.setChoice(entry.id);h.flush().submit();}
    h.flush().next();h.flush();
  }
  assert.deepEqual(h.current.results.map(result=>result.outcome),['incorrect','revealed','unanswered','correct']);
  assert.equal(h.current.finished,true);
}

for(const modality of ['CT','MRI'] as const)test(`${modality} focused review launches exact ordered missed subset through rendered review`,async()=>{
  const {a,b,c,d,study,loaded}=fixture(modality),h=harness(study,modality);
  try{
    await complete(h,[a,b,c,d],loaded);
    const originalScore=h.current.score,originalResults=h.current.results;
    const [review]=h.reviews();assert(review);
    assert.equal(review.modality,modality);assert.equal(review.revision,HEAD_LINK_REVISION);
    assert.deepEqual((review.items as Array<{entry:HeadEntry}>).map(row=>row.entry),[a,b,c,d]);
    const launch=review.onPracticeEntries as (targets:HeadEntry[],mode:PracticeMode)=>boolean;
    assert.equal(typeof launch,'function');
    assert.equal(launch([c,a],'recall'),true);
    assert.equal(launch([b],'locate'),false,'same-render duplicate launch is rejected');
    const opening=h.flush();assert.equal(opening.mode,'recall');assert.equal(opening.total,2);assert.equal(opening.score.attempted,0);
    assert.deepEqual(opening.originalScore,originalScore);assert.deepEqual(opening.originalResults,[],'original review is displayed only after completion');
    assert.equal(h.requests.at(-1)?.entry,c);assert.equal(h.requests.at(-1)?.options?.maskOnly,true);
    h.requests.at(-1)!.resolve(loaded(c));await h.settle();h.current.setChoice(c.label);h.flush().submit();h.flush().next();h.flush();
    assert.equal(h.requests.at(-1)?.entry,a);h.requests.at(-1)!.resolve(loaded(a));await h.settle();h.current.reveal();h.flush().next();h.flush();
    assert.deepEqual(h.current.results.map(row=>[row.entry,row.outcome]),[[c,'correct'],[a,'revealed']]);
    assert.deepEqual(h.current.originalResults,originalResults);assert.deepEqual(h.current.originalScore,originalScore);
    const [followup,original]=h.reviews();assert.equal(followup.label,'Review follow-up set');assert.equal(original.label,'Review original set');
    assert.deepEqual((original.items as Array<{entry:HeadEntry}>).map(row=>row.entry),[a,b,c,d]);
    assert.equal((original.onPracticeEntries as (targets:HeadEntry[],mode:PracticeMode)=>boolean)([b],'locate'),true);
    h.flush();assert.equal(h.current.mode,'locate');assert.deepEqual(h.current.originalScore,originalScore);
    assert.equal(launch([a],'label'),false,'current review callback retires when original review launches');
    assert.equal(h.requests.at(-1)?.entry,b);assert.equal(h.requests.at(-1)?.options?.maskOnly,true);
  }finally{h.dispose();}
});

test('focused review rejects invalid entire requests, stale callbacks and fresh-session contamination',async()=>{
  const {a,b,c,d,study,loaded}=fixture(),h=harness(study,'CT');
  try{
    await complete(h,[a,b,c,d],loaded);
    const [review]=h.reviews();const launch=review.onPracticeEntries as (targets:HeadEntry[],mode:PracticeMode)=>boolean;
    const score=h.current.score,requests=h.requests.length;
    for(const targets of [[],[d],[a,d],[{...a}],[a,{...b}]] as HeadEntry[][])
      assert.equal(launch(targets,'label'),false,`reject ${targets.map(item=>item.id).join(',')}`);
    assert.equal(launch([a],'bad' as PracticeMode),false);
    assert.equal((h.current.revisitSubset as (targets:HeadEntry[],mode:PracticeMode,source:string)=>boolean)([a],'label','bad'),false);
    const savedMask=a.mask;a.mask=undefined;
    assert.equal(launch([a],'label'),false,'a no-mask target is no longer eligible');
    a.mask=savedMask;
    assert.equal(h.requests.length,requests);assert.deepEqual(h.flush().score,score);
    assert.equal(launch([a],'label'),true);
    assert.equal(launch([b],'label'),false,'repeated event before commit cannot replace first set');
    h.flush();assert.equal(h.requests.at(-1)?.entry,a);
    h.current.finish();h.flush();assert.equal(launch([b],'label'),false,'old completed review callback stays retired');
    h.current.end();h.flush();assert.equal(launch([a],'label'),false,'end retires old callback');
    h.current.startTargets([a],'label');h.flush();assert.equal(launch([b],'label'),false,'new set retires old callback');
    const reopened=h.requests.at(-1)!;assert.equal(reopened.entry,a);assert.equal(reopened.options?.maskOnly,true);
    reopened.resolve(loaded(a));await h.settle();h.current.reveal();h.flush().next();h.flush();
    assert.equal(h.current.revisitSubset([a],'label','original'),false,'new set has no original review');
    assert.equal(launch([a],'label'),false);
    h.replace(fixture('MRI').study,false);assert.equal(launch([a],'label'),false,'study replacement retires callback');
    assert.deepEqual(h.current.results,[]);assert.equal(h.current.originalScore,null);
    h.replace(fixture().study);assert.equal(launch([a],'label'),false,'package replacement keeps old callback retired');
  }finally{h.dispose();}
});

test('focused review rejects repeated exact targets as one invalid request',async()=>{
  const {a,b,c,d,study,loaded}=fixture(),h=harness(study,'CT');
  try{
    await complete(h,[a,b,c,d],loaded);
    const [review]=h.reviews(),before=h.current.score;
    assert.equal((review.onPracticeEntries as (targets:HeadEntry[],mode:PracticeMode)=>boolean)([a,a],'label'),false);
    assert.equal(h.requests.length,4);assert.equal(h.flush().finished,true);assert.deepEqual(h.current.score,before);
  }finally{h.dispose();}
});
