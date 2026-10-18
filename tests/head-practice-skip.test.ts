import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {createNativeVolumeGeometry} from '../lib/head-atlas-geometry.mjs';
import type {HeadEntry,LoadedEntry,LoadedStudy,LocalHeadPackage} from '../lib/head-atlas-import.ts';
import type {PracticeMode} from '../lib/head-atlas-practice.ts';

const require=createRequire(import.meta.url);
const source=readFileSync(new URL('../components/HeadAtlasPractice.tsx',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
type Effect={deps:unknown[];cleanup?:()=>void};
type Request={entry:HeadEntry;signal:AbortSignal;resolve:(value:LoadedEntry)=>void};

/** Execute the production hook and panel with committed effects and real load microtasks. */
function harness(study:LoadedStudy){
  const slots:unknown[]=[],effects=new Map<number,Effect>(),requests:Request[]=[];
  let cursor=0,dirty=true,pending:Array<()=>void>=[];
  const pkg={} as LocalHeadPackage;
  const equal=(a:unknown[]|undefined,b:unknown[])=>!!a&&a.length===b.length&&a.every((value,index)=>Object.is(value,b[index]));
  const hooks={
    useState(initial:unknown){const index=cursor++;if(!(index in slots))slots[index]=typeof initial==='function'?initial():initial;return [slots[index],(value:unknown)=>{const next=typeof value==='function'?value(slots[index]):value;if(!Object.is(next,slots[index])){slots[index]=next;dirty=true;}}];},
    useRef(initial:unknown){const index=cursor++;if(!(index in slots))slots[index]={current:initial};return slots[index];},
    useMemo(create:()=>unknown,deps:unknown[]){const index=cursor++,old=slots[index] as {deps:unknown[];value:unknown}|undefined;if(!equal(old?.deps,deps))slots[index]={deps,value:create()};return (slots[index] as {value:unknown}).value;},
    useEffect(create:()=>void|(()=>void),deps:unknown[]){const index=cursor++,old=effects.get(index);if(!equal(old?.deps,deps))pending.push(()=>{old?.cleanup?.();const cleanup=create();effects.set(index,{deps,cleanup:typeof cleanup==='function'?cleanup:undefined});});},
    useLayoutEffect(create:()=>void|(()=>void),deps:unknown[]){const index=cursor++,old=effects.get(index);if(!equal(old?.deps,deps))pending.push(()=>{old?.cleanup?.();const cleanup=create();effects.set(index,{deps,cleanup:typeof cleanup==='function'?cleanup:undefined});});},
  };
  const mod={exports:{} as Pick<typeof import('../components/HeadAtlasPractice'),'useHeadAtlasPractice'|'HeadAtlasPractice'>};
  const Review=()=>null,Feedback=()=>null,Summary=()=>null;
  const load=(name:string)=>name==='react'?hooks:name==='./HeadAtlasPracticeReview'?{HeadAtlasPracticeReview:Review,HeadAtlasPracticeFeedback:Feedback}:name==='./HeadPracticeSummaryDownload'?{HeadPracticeSummaryDownload:Summary}:name==='../lib/head-atlas-import'?{loadHeadEntry:(_pkg:LocalHeadPackage,_study:LoadedStudy,entry:HeadEntry,signal:AbortSignal)=>new Promise<LoadedEntry>(resolve=>requests.push({entry,signal,resolve}))}:name.startsWith('../lib/')?require(name+'.ts'):require(name);
  new Function('require','module','exports',compiled)(load,mod,mod.exports);
  let current:ReturnType<typeof mod.exports.useHeadAtlasPractice>;
  function flush(){let passes=0;do{assert(++passes<25,'hook effects settle');dirty=false;cursor=0;pending=[];current=mod.exports.useHeadAtlasPractice(pkg,study);for(const effect of pending)effect();}while(dirty);return current!;}
  function panel(){const effect=hooks.useEffect;hooks.useEffect=()=>undefined;try{return mod.exports.HeadAtlasPractice({practice:current!,study,familyNames:{}});}finally{hooks.useEffect=effect;}}
  function buttons(){const found:Array<{label:string;onClick:()=>void}>=[];
    function visit(value:unknown):void{
      if(Array.isArray(value)){for(const child of value)visit(child);return;}
      if(!value||typeof value!=='object'||!('props' in value))return;
      const node=value as {type:unknown;props:{children?:unknown;onClick?:()=>void}};
      if(node.type==='button'&&typeof node.props.children==='string'&&node.props.onClick)found.push({label:node.props.children,onClick:node.props.onClick});
      visit(node.props.children);
    }
    visit(panel());return found;
  }
  function click(label:string){const button=buttons().find(button=>button.label===label);assert(button,`rendered panel exposes ${label}`);button.onClick();}
  return {requests,flush,buttons,click,get current(){return current!;},async settle(){await Promise.resolve();await Promise.resolve();return flush();},dispose(){for(const effect of effects.values())effect.cleanup?.();}};
}

function fixture(){
  const shape=[2,2,2],affine=[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];
  const entry=(id:string):HeadEntry=>({id,label:id,family:'bst',representation:'partial_mask',color:[1,0,0],opacity:{fill:.25,outline:.9},mask:{file:id+'.bin',sha256:id.padEnd(64,'a'),dtype:'uint8',shape_kji:shape,offset_kji:[0,0,0],native_shape_kji:shape,ijk_to_ras:affine}});
  const a=entry('a'),b=entry('b'),c=entry('c');
  const definition={image:{file:'image.bin',sha256:'d'.repeat(64),dtype:'int16',shape_kji:shape,ijk_to_ras:affine},entries:[a,b,c]};
  const study:LoadedStudy={definition,data:new Int16Array(8),geometry:createNativeVolumeGeometry(definition.image),range:[0,1]};
  const loaded=(item:HeadEntry):LoadedEntry=>({entry:item,mask:new Uint8Array([1,0,0,0,0,0,0,0]),focus:[0,0,0]});
  return {a,b,c,study,loaded};
}

for(const mode of ['locate','label','recall'] as PracticeMode[])test(`${mode} loaded questions can be skipped without changing first attempts or exposing feedback`,async()=>{
  const {a,b,c,study,loaded}=fixture(),h=harness(study);
  try{
    h.flush();assert.equal(h.current.startTargets([a,b,c],mode),true);h.flush();
    h.requests[0].resolve(loaded(a));await h.settle();
    assert.equal(h.buttons().filter(button=>button.label==='Skip question (unanswered)').length,1);
    if(mode==='locate')h.current.acceptPick([0,0,0]);else h.current.setChoice(mode==='label'?a.id:a.label);
    h.flush();h.click('Check answer');h.flush();
    assert.equal(h.current.outcome,'correct');assert(!h.buttons().some(button=>button.label==='Skip question (unanswered)'),'skip is absent after feedback');
    h.click('Next question');h.flush();
    h.requests[1].resolve(loaded(b));await h.settle();
    if(mode==='locate')h.current.acceptPick([0,0,0]);else h.current.setChoice(mode==='label'?a.id:a.label);
    h.flush();h.click('Skip question (unanswered)');h.flush();
    assert.equal(h.current.index,2);assert.equal(h.current.outcome,null);assert.deepEqual(h.current.outcomes,{[a.id]:'correct'});
    assert.deepEqual(h.current.results,[],'review does not disclose a skipped target during the set');
    h.requests[2].resolve(loaded(c));await h.settle();
    assert.equal(h.buttons().filter(button=>button.label==='Skip question (unanswered)').length,1);
    h.click('Skip question (unanswered)');h.flush();
    assert.equal(h.current.finished,true);assert.equal(h.current.active,false);
    assert.deepEqual(h.current.results,[{entry:a,outcome:'correct'},{entry:b,outcome:'unanswered'},{entry:c,outcome:'unanswered'}]);
    assert.deepEqual(h.current.score,{correct:1,attempted:1,revealed:0,remaining:2,total:3});
    assert.deepEqual(h.current.revisitEntries,[b,c]);
    assert(!h.buttons().some(button=>button.label==='Skip question (unanswered)'));
    h.click('Revisit missed structures');h.flush();
    assert.equal(h.current.total,2);assert.deepEqual(h.current.originalScore,{correct:1,attempted:1,revealed:0,remaining:2,total:3});
    assert.deepEqual(h.current.originalResults,[],'original review remains concealed during follow-up');
  }finally{h.dispose();}
});
