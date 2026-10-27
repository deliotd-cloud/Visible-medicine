import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {practiceRevisitEntries} from '../lib/head-atlas-practice.ts';
import {createNativeVolumeGeometry} from '../lib/head-atlas-geometry.mjs';
import type {HeadEntry,LoadedEntry,LoadedStudy,LocalHeadPackage} from '../lib/head-atlas-import.ts';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';

const require=createRequire(import.meta.url);
const source=readFileSync(new URL('../components/HeadAtlasPractice.tsx',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
type Effect={deps:unknown[];cleanup?:()=>void};
type Request={entry:HeadEntry;signal:AbortSignal;resolve:(value:LoadedEntry)=>void;reject:(reason:Error)=>void};

/** Minimal deterministic hook scheduler: ordered state slots, dependency checks,
 * committed effect cleanup/setup, and real promise microtasks. No browser, pixels,
 * clinical fixtures, React internals or new test dependency. Not concurrent-React QA. */
function harness(initialStudy:LoadedStudy,missedStudySet?:{count:number;total:number;onAdd:()=>void}){
  const slots:unknown[]=[],effects=new Map<number,Effect>(),requests:Request[]=[];
  let cursor=0,dirty=true,pending:Array<()=>void>=[],pkg={} as LocalHeadPackage,study:LoadedStudy|null=initialStudy;
  const equal=(a:unknown[]|undefined,b:unknown[])=>!!a&&a.length===b.length&&a.every((v,i)=>Object.is(v,b[i]));
  const hooks={
    useState(initial:unknown){const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return [slots[i],(value:unknown)=>{const next=typeof value==='function'?value(slots[i]):value;if(!Object.is(next,slots[i])){slots[i]=next;dirty=true;}}];},
    useRef(initial:unknown){const i=cursor++;if(!(i in slots))slots[i]={current:initial};return slots[i];},
    useMemo(create:()=>unknown,deps:unknown[]){const i=cursor++,old=slots[i] as {deps:unknown[];value:unknown}|undefined;if(!equal(old?.deps,deps))slots[i]={deps,value:create()};return (slots[i] as {value:unknown}).value;},
    useEffect(create:()=>void|(()=>void),deps:unknown[]){const i=cursor++,old=effects.get(i);if(!equal(old?.deps,deps))pending.push(()=>{old?.cleanup?.();const cleanup=create();effects.set(i,{deps,cleanup:typeof cleanup==='function'?cleanup:undefined});});},
    useLayoutEffect(create:()=>void|(()=>void),deps:unknown[]){const i=cursor++,old=effects.get(i);if(!equal(old?.deps,deps))pending.push(()=>{old?.cleanup?.();const cleanup=create();effects.set(i,{deps,cleanup:typeof cleanup==='function'?cleanup:undefined});});},
  };
  const mod={exports:{} as Pick<typeof import('../components/HeadAtlasPractice'),'useHeadAtlasPractice'|'HeadAtlasPractice'>};
  const Feedback=()=>null;
  const Review=()=>null;
  const Summary=()=>null;
  const load=(name:string)=>name==='react'?hooks:name==='./HeadAtlasPracticeReview'?{HeadAtlasPracticeReview:Review,HeadAtlasPracticeFeedback:Feedback}:name==='../lib/head-atlas-import'?{loadHeadEntry:(_pkg:LocalHeadPackage,_study:LoadedStudy,entry:HeadEntry,signal:AbortSignal)=>new Promise<LoadedEntry>((resolve,reject)=>requests.push({entry,signal,resolve,reject}))}:name.startsWith('../lib/')?require(name+'.ts'):require(name);
  new Function('require','module','exports',compiled)((name:string)=>name==='./HeadPracticeSummaryDownload'?{HeadPracticeSummaryDownload:Summary}:load(name),mod,mod.exports);
  let current:ReturnType<typeof mod.exports.useHeadAtlasPractice>;
  function flush(){let passes=0;do{assert(++passes<25,'hook effects settle');dirty=false;cursor=0;pending=[];current=mod.exports.useHeadAtlasPractice(pkg,study);for(const effect of pending)effect();}while(dirty);return current!;}
  function panelTree(){
    // Invoke the rendered React button's event binding, not the hook method directly.
    // The panel's focus-only effect is irrelevant without a mounted DOM.
    const effect=hooks.useEffect;hooks.useEffect=()=>undefined;
    try{return mod.exports.HeadAtlasPractice({practice:current!,study,familyNames:{},reviewContext:{modality:'CT',revision:HEAD_LINK_REVISION,onSelect:()=>{},missedStudySet}});}finally{hooks.useEffect=effect;}
  }
  function feedbackProps():Record<string,unknown>|undefined {
    function find(value:unknown):Record<string,unknown>|undefined{
      if(Array.isArray(value)){for(const child of value){const hit=find(child);if(hit)return hit;}return;}
      if(!value||typeof value!=='object'||!('props' in value))return;
      const node=value as {type:unknown;props:Record<string,unknown>};
      if(node.type===Feedback)return node.props;
      return find(node.props.children);
    }
    return find(panelTree());
  }
  function reviewProps():Array<Record<string,unknown>> {
    const found:Array<Record<string,unknown>>=[];
    function visit(value:unknown):void{
      if(Array.isArray(value)){for(const child of value)visit(child);return;}
      if(!value||typeof value!=='object'||!('props' in value))return;
      const node=value as {type:unknown;props:Record<string,unknown>};
      if(node.type===Review)found.push(node.props);
      visit(node.props.children);
    }
    visit(panelTree());return found;
  }
  function summaryProps():Record<string,unknown>|undefined {
    function find(value:unknown):Record<string,unknown>|undefined{
      if(Array.isArray(value)){for(const child of value){const hit=find(child);if(hit)return hit;}return;}
      if(!value||typeof value!=='object'||!('props' in value))return;
      const node=value as {type:unknown;props:Record<string,unknown>};
      return node.type===Summary?node.props:find(node.props.children);
    }
    return find(panelTree());
  }
  function panelButton(label:string){
    const tree=panelTree();
    function find(value:unknown):{onClick?:()=>void;disabled?:boolean}|undefined{
      if(Array.isArray(value)){for(const child of value){const hit=find(child);if(hit)return hit;}return;}
      if(!value||typeof value!=='object'||!('props' in value))return;
      const node=value as {type:unknown;props:{children?:unknown;onClick?:()=>void;disabled?:boolean}};
      if(node.type==='button'&&node.props.children===label)return node.props;
      return find(node.props.children);
    }
    const button=find(tree);assert(button,`rendered panel exposes ${label}`);return button;
  }
  function textInput(){
    type InputProps={value:string;placeholder?:string;maxLength:number;autoComplete:string;spellCheck:boolean;onChange:(event:{target:{value:string}})=>void;onKeyDown:(event:{key:string;nativeEvent:{isComposing:boolean};repeat:boolean;preventDefault:()=>void})=>void};
    function find(value:unknown):InputProps|undefined{
      if(Array.isArray(value)){for(const child of value){const hit=find(child);if(hit)return hit;}return;}
      if(!value||typeof value!=='object'||!('props' in value))return;
      const node=value as {type:unknown;props:InputProps&{type?:string;children?:unknown}};
      return node.type==='input'&&node.props.type==='text'?node.props:find(node.props.children);
    }
    return find(panelTree());
  }
  function panelText(){
    const parts:string[]=[];
    function visit(value:unknown):void{
      if(Array.isArray(value)){for(const child of value)visit(child);return;}
      if(typeof value==='string'){parts.push(value);return;}
      if(value&&typeof value==='object'&&'props' in value)visit((value as {props:{children?:unknown}}).props.children);
    }
    visit(panelTree());return parts.join(' ');
  }
  function clickPanelButton(label:string){const button=panelButton(label);assert(button.onClick,`rendered ${label} has an action`);assert.notEqual(button.disabled,true,`${label} is enabled`);button.onClick();}
  return {requests,flush,feedbackProps,reviewProps,summaryProps,panelButton,textInput,panelText,clickPanelButton,clickEndSet:()=>clickPanelButton('End set'),get current(){return current!;},async settle(){await Promise.resolve();await Promise.resolve();return flush();},replace(next:LoadedStudy|null){pkg={} as LocalHeadPackage;study=next;return flush();},dispose(){for(const effect of effects.values())effect.cleanup?.();}};
}

test('summary export appears only for ended current-study sets and keeps original follow-up results separate',async()=>{
  const {a,b,study,loaded}=fixture(),h=harness(study);try{
    h.flush();assert.equal(h.summaryProps(),undefined);
    h.current.startTargets([a,b],'label');h.flush();assert.equal(h.summaryProps(),undefined);
    h.requests[0].resolve(loaded(a));await h.settle();
    h.current.setChoice(b.id);h.flush();h.clickPanelButton('Check answer');h.flush();
    assert.equal(h.summaryProps(),undefined,'feedback is not an ended set');
    h.clickEndSet();h.flush();
    assert.deepEqual(h.summaryProps()?.items,[{entry:a,outcome:'incorrect'},{entry:b,outcome:'unanswered'}]);
    assert.equal(h.summaryProps()?.entries,study.definition.entries);assert.equal(h.summaryProps()?.mode,'label');
    assert.equal(h.summaryProps()?.originalItems,undefined);
    h.clickPanelButton('Revisit missed structures');h.flush();assert.equal(h.summaryProps(),undefined);
    h.requests.at(-1)!.resolve(loaded(a));await h.settle();
    h.current.setChoice(a.id);h.flush();h.clickPanelButton('Check answer');h.flush();
    h.clickEndSet();h.flush();
    assert.equal((h.summaryProps()?.items as Array<{outcome:string}>)[0].outcome,'correct');
    assert.equal((h.summaryProps()?.originalItems as Array<{outcome:string}>)[0].outcome,'incorrect');
    h.replace(fixture().study);assert.equal(h.summaryProps(),undefined,'old study cannot be exported');
  }finally{h.dispose();}
});

test('actual completed panel offers optional missed-study handoff without starting another attempt',async()=>{
  const {a,b,study,loaded}=fixture();let additions=0;
  const control={count:1,total:2,onAdd(){additions++;}},h=harness(study,control);
  try{
    h.flush();assert(!h.panelText().includes('Add missed structures'));
    h.current.startTargets([a,b],'label');h.flush();assert(!h.panelText().includes('Add missed structures'));
    h.requests[0].resolve(loaded(a));await h.settle();h.clickPanelButton('Reveal answer');h.flush();
    assert(!h.panelText().includes('Add missed structures'),'feedback alone is not completion');
    h.clickEndSet();h.flush();const results=h.current.results,score=h.current.score;
    assert.match(h.panelText(),/1 of 2 new missed structures/);
    h.clickPanelButton('Add missed structures to My study set');assert.equal(additions,1);
    assert.equal(h.current.active,false);assert.equal(h.current.finished,true);assert.deepEqual(h.current.results,results);assert.deepEqual(h.current.score,score);
    control.count=0;assert.equal(h.panelButton('Add missed structures to My study set').disabled,true);assert.match(h.panelText(),/My study set is full/);
    control.total=0;assert.match(h.panelText(),/already in My study set/);
    h.replace(fixture().study);assert(!h.panelText().includes('Add missed structures'));
  }finally{h.dispose();}
});

test('actual question panel exposes learning only after feedback and retires it on retry, next, replacement and end',async()=>{
  const {a,b,study,loaded}=fixture(),h=harness(study);try{
    h.flush().startTargets([a,b],'label');h.flush();assert.equal(h.feedbackProps(),undefined);
    h.requests[0].resolve(loaded(a));await h.settle();assert.equal(h.feedbackProps(),undefined);
    h.current.setChoice(b.id);h.flush();h.clickPanelButton('Check answer');h.flush();
    assert.equal(h.feedbackProps()?.entry,a);assert.equal(h.feedbackProps()?.outcome,'incorrect');
    assert.equal(h.feedbackProps()?.revision,HEAD_LINK_REVISION);
    h.clickPanelButton('Try again (unscored)');h.flush();assert.equal(h.feedbackProps(),undefined);
    h.current.setChoice(a.id);h.flush();h.clickPanelButton('Check answer');h.flush();
    assert.equal(h.feedbackProps()?.outcome,'correct');assert.equal(h.current.score.correct,0);
    h.clickPanelButton('Next question');h.flush();assert.equal(h.feedbackProps(),undefined);
    h.requests[1].resolve(loaded(b));await h.settle();assert.equal(h.feedbackProps(),undefined);
    h.clickPanelButton('Reveal answer');h.flush();assert.equal(h.feedbackProps()?.entry,b);
    h.replace(fixture().study);assert.equal(h.feedbackProps(),undefined);
    h.replace(study).startTarget(a);h.flush();
    const reopened=h.requests.at(-1)!;assert.equal(reopened.entry,a);assert.equal(reopened.signal.aborted,false);
    reopened.resolve(loaded(a));await h.settle();
    h.clickPanelButton('Reveal answer');h.flush();assert.equal(h.feedbackProps()?.entry,a);
    h.clickEndSet();h.flush();assert.equal(h.feedbackProps(),undefined);
  }finally{h.dispose();}
});

function fixture(){
  const shape=[2,2,2],affine=[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];
  const entry=(id:string):HeadEntry=>({id,label:id,family:'bst',representation:'partial_mask',color:[1,0,0],opacity:{fill:.25,outline:.9},mask:{file:id+'.bin',sha256:id.padEnd(64,'a'),dtype:'uint8',shape_kji:shape,offset_kji:[0,0,0],native_shape_kji:shape,ijk_to_ras:affine}});
  const a=entry('a'),b=entry('b'),definition={image:{file:'image.bin',sha256:'c'.repeat(64),dtype:'int16',shape_kji:shape,ijk_to_ras:affine},entries:[a,b]};
  const study:LoadedStudy={definition,data:new Int16Array(8),geometry:createNativeVolumeGeometry(definition.image),range:[0,1]};
  const loaded=(item:HeadEntry):LoadedEntry=>({entry:item,mask:new Uint8Array([1,0,0,0,0,0,0,0]),focus:[0,0,0]});
  return {a,b,study,loaded};
}

for(const mode of ['locate','label'] as const)test(`system-filtered ${mode} practice retains every eligible question in completed review`,async()=>{
 const {a,b,study,loaded}=fixture();
 const duplicate={...a,id:'other-system-duplicate',label:'Other system duplicate',family:'ctx'};
 b.family='ctx';study.definition.entries.splice(1,0,duplicate);
 const h=harness(study);try{
  h.flush();h.current.setFamily('ctx');h.current.setMode(mode);h.flush();
  assert.deepEqual(h.current.available,[b]);
  h.clickPanelButton('Start practice');h.flush();
  assert.equal(h.current.total,1);assert.equal(h.requests.length,1);assert.equal(h.requests[0].entry,b);
  h.requests[0].resolve(loaded(b));await h.settle();
  if(mode==='locate')h.current.acceptPick([0,0,0]);else h.current.setChoice(b.id);
  h.flush();h.current.submit();h.flush();assert.equal(h.current.outcome,'correct');
  h.current.next();h.flush();
  assert.equal(h.current.finished,true);assert.equal(h.current.score.correct,1);
  assert.deepEqual(h.current.results,[{entry:b,outcome:'correct'}]);
  assert.equal(h.current.revisitEntries.length,0);
 }finally{h.dispose();}
});

for(const mode of ['locate','label'] as const)test(`same-byte masks at different positions survive ${mode} questions and review`,async()=>{
  const {a,b,study}=fixture();
  a.mask={...a.mask!,shape_kji:[1,1,1]};
  b.mask={...a.mask,file:'b.bin',offset_kji:[1,1,1]};
  const h=harness(study);
  try{
    h.flush();assert.equal(h.current.startTargets([a,b],mode),true);h.flush();assert.equal(h.current.total,2);
    for(const [index,item] of [a,b].entries()){
      assert.equal(h.requests[index].entry,item);
      h.requests[index].resolve({entry:item,mask:new Uint8Array([1]),focus:index===0?[0,0,0]:[1,1,1]});await h.settle();
      assert(h.current.choices.includes(a)&&h.current.choices.includes(b));
      if(mode==='locate')h.current.acceptPick(index===0?[0,0,0]:[1,1,1]);else h.current.setChoice(item.id);
      h.flush();h.clickPanelButton('Check answer');h.flush();assert.equal(h.current.outcome,'correct');
      h.current.next();h.flush();
    }
    assert.equal(h.current.finished,true);assert.equal(h.current.score.correct,2);
    assert.deepEqual(h.current.results.map(item=>item.entry),[a,b]);
    assert.deepEqual(h.current.revisitEntries,[]);
  }finally{h.dispose();}
});

test('sequence deck filters foreign, alias and duplicate entries while keeping canonical order and fresh attempts',async()=>{
 const {a,b,study,loaded}=fixture(),alias={...b,id:'alias',source:{geometry_alias_of:b.id}};
 study.definition.entries.push(alias);
 const h=harness(study);try{
  h.flush();assert.equal(h.current.startTargets([{...a},alias]),false);assert.equal(h.flush().active,false);
  assert.equal(h.current.startTargets([b,{...a},a,b,alias]),true);h.flush();
  assert.equal(h.current.total,2);assert.equal(h.requests[0].entry,b);assert.equal(h.current.mode,'locate');
  h.requests[0].resolve(loaded(b));await h.settle();h.current.acceptPick([0,0,0]);h.flush().submit();h.flush();
  assert.equal(h.current.outcome,'correct');
  assert.equal(h.current.startTargets([b,a]),true);h.flush();
  assert.equal(h.current.target,null);assert.equal(h.current.outcome,null);assert.deepEqual(h.current.outcomes,{});
  assert.equal(h.current.score.attempted,0);assert.equal(h.requests[1].entry,b);
  h.requests[1].resolve(loaded(b));await h.settle();h.current.next();h.flush();assert.equal(h.requests[2].entry,a);
  const old=h.requests[2];h.replace(fixture().study);assert(old.signal.aborted);
  old.resolve(loaded(a));await h.settle();assert.equal(h.current.target,null);assert.equal(h.current.total,0);
  h.replace(null);assert.equal(h.current.startTargets([a,b]),false);
 }finally{h.dispose();}
});

test('label-style sequence practice scores labels, retains style on revisit and rejects unsupported modes',async()=>{
 const {a,b,study,loaded}=fixture(),h=harness(study);try{
  h.flush();assert.equal(h.current.startTargets([a,b],'label'),true);h.flush();
  assert.equal(h.current.mode,'label');h.requests[0].resolve(loaded(a));await h.settle();
  h.current.setChoice(b.id);h.flush().submit();h.flush();assert.equal(h.current.outcome,'incorrect');
  h.current.retry();h.flush();h.current.setChoice(a.id);h.flush().submit();h.flush();
  assert.equal(h.current.outcome,'correct');assert.equal(h.current.score.correct,0,'retry cannot replace first attempt');
  assert.equal(h.current.startTargets([a], 'foreign' as never),false);h.flush();
  assert.equal(h.current.mode,'label');assert.equal(h.current.outcome,'correct');assert.equal(h.current.total,2);
  h.current.finish();h.flush();h.current.revisit();h.flush();assert.equal(h.current.mode,'label');
  assert.equal(h.current.originalScore?.correct,0);
  h.current.end();h.flush();assert.equal(h.current.startTarget(a),true);h.flush();
  assert.equal(h.current.mode,'locate','single-structure Find action keeps its existing style');
 }finally{h.dispose();}
});

test('revisit helper uses exact eligible study objects, ordered misses and no duplicates',()=>{
  const {a,b,study}=fixture(),clone={...a},alias={...b,id:'alias',source:{geometry_alias_of:b.id}};
  assert.deepEqual(practiceRevisitEntries([a,b,a,clone,alias],{a:'incorrect',b:'correct'},[...study.definition.entries,alias]),[a]);
  assert.deepEqual(practiceRevisitEntries([a,b],{a:'revealed'},study.definition.entries),[a,b]);
  assert.deepEqual(practiceRevisitEntries([a,b],{},[{...a},{...b}]),[]);
});

test('rendered revisit action tests only misses and keeps the original score unchanged',async()=>{
  const {study,loaded}=fixture(),h=harness(study);try{
    h.flush().start();h.flush();const first=h.requests[0].entry;
    h.requests[0].resolve(loaded(first));await h.settle();
    h.current.acceptPick([1,1,1]);h.flush().submit();h.flush().next();h.flush();
    const second=h.requests[1].entry;h.requests[1].resolve(loaded(second));await h.settle();
    h.current.acceptPick([0,0,0]);h.flush().submit();h.flush().next();h.flush();
    const original={...h.current.score};assert.equal(original.correct,1);assert.equal(original.attempted,2);
    assert.deepEqual(h.current.revisitEntries,[first]);
    h.clickPanelButton('Revisit missed structures');h.flush();
    assert.equal(h.current.total,1);assert.equal(h.current.target,null);assert.deepEqual(h.current.outcomes,{});
    assert.deepEqual(h.current.originalScore,original);assert.equal(h.requests[2].entry,first);
    h.requests[2].resolve(loaded(first));await h.settle();
    h.current.acceptPick([0,0,0]);h.flush().submit();h.flush().next();h.flush();
    assert.equal(h.current.score.correct,1);assert.equal(h.current.score.total,1);
    assert.deepEqual(h.current.originalScore,original);assert.deepEqual(h.current.revisitEntries,[]);
    h.current.revisit();assert.equal(h.flush().active,false,'nothing left to revisit');
    h.clickPanelButton('Choose another set');assert.equal(h.flush().originalScore,null);
  }finally{h.dispose();}
});

test('follow-up keeps the exact original item outcomes through repeated rounds and conceals them while active',async()=>{
  const {study,a,b,loaded}=fixture();
  const c={...a,id:'c',label:'c',mask:{...a.mask!,file:'c.bin',sha256:'c'.repeat(64)}};
  const d={...a,id:'d',label:'d',mask:{...a.mask!,file:'d.bin',sha256:'d'.repeat(64)}};
  study.definition.entries.push(c,d);
  const h=harness(study);try{
    h.flush().startTargets([a,b,c,d]);h.flush();
    h.requests[0].resolve(loaded(a));await h.settle();h.current.acceptPick([1,1,1]);h.flush().submit();h.flush().next();h.flush();
    h.requests[1].resolve(loaded(b));await h.settle();h.current.acceptPick([0,0,0]);h.flush().submit();h.flush().next();h.flush();
    h.requests[2].resolve(loaded(c));await h.settle();h.current.reveal();h.flush().next();h.flush();
    h.requests[3].resolve(loaded(d));await h.settle();h.current.finish();h.flush();
    const original=[{entry:a,outcome:'incorrect'},{entry:b,outcome:'correct'},{entry:c,outcome:'revealed'},{entry:d,outcome:'unanswered'}];
    assert.deepEqual(h.current.results,original);assert.deepEqual(h.current.originalResults,[]);
    h.current.revisit();h.flush();assert.deepEqual(h.current.originalResults,[]);
    assert.deepEqual(h.reviewProps(),[],'active questions expose neither review');
    h.requests[4].resolve(loaded(a));await h.settle();h.current.acceptPick([0,0,0]);h.flush().submit();h.flush();
    assert.deepEqual(h.current.originalResults,[],'pending feedback must not expose original review');
    h.current.finish();h.flush();
    assert.deepEqual(h.current.originalResults,original);
    assert.deepEqual(h.current.results,[{entry:a,outcome:'correct'},{entry:c,outcome:'unanswered'},{entry:d,outcome:'unanswered'}]);
    assert.deepEqual(h.reviewProps().map(props=>({label:props.label,items:props.items})),[
      {label:'Review follow-up set',items:h.current.results},
      {label:'Review original set',items:original},
    ]);
    h.current.revisit();h.flush();assert.deepEqual(h.current.originalResults,[]);
    h.current.finish();h.flush();assert.deepEqual(h.current.originalResults,original);
    h.current.end();h.flush();assert.deepEqual(h.current.originalResults,[]);
  }finally{h.dispose();}
});

test('revealed and unanswered follow-ups retain question style and the first original snapshot across rounds',async()=>{
  const {study,loaded}=fixture(),h=harness(study);try{
    h.flush().setMode('label');h.flush().start();h.flush();
    h.requests[0].resolve(loaded(h.requests[0].entry));await h.settle();h.current.reveal();h.flush().finish();h.flush();
    const original={...h.current.score};assert.equal(original.revealed,1);assert.equal(original.remaining,1);
    assert.equal(h.current.revisitEntries.length,2);
    h.clickPanelButton('Revisit missed structures');h.flush();assert.equal(h.current.mode,'label');
    h.current.revisit();h.flush();assert.equal(h.requests.length,2,'active follow-up cannot restart itself');
    h.current.finish();h.flush();assert.equal(h.requests[1].signal.aborted,true);
    h.clickPanelButton('Revisit missed structures');h.flush();assert.deepEqual(h.current.originalScore,original);
    h.requests[1].resolve(loaded(h.requests[1].entry));await h.settle();assert.equal(h.current.target,null,'aborted round cannot restore an answer');
    h.requests[2].resolve(loaded(h.requests[2].entry));await h.settle();
    h.current.setChoice(h.requests[2].entry.id);h.flush().submit();assert.equal(h.flush().outcome,'correct');
    assert.deepEqual(h.current.originalScore,original);
  }finally{h.dispose();}
});

test('new study, new set and guided target clear the original snapshot and abort follow-up loading',async()=>{
  for(const action of ['replace','start','target'] as const){
    const {study,a,b,loaded}=fixture(),h=harness(study);try{
      h.flush().startTarget(a);h.flush().finish();h.flush();h.clickPanelButton('Revisit missed structures');h.flush();
      assert.ok(h.current.originalScore);assert.equal(h.requests.length,2);
      if(action==='replace')h.replace(fixture().study);
      else if(action==='start'){h.current.end();h.flush().start();h.flush();}
      else {h.current.startTarget(b);h.flush();}
      assert.equal(h.current.originalScore,null);assert.deepEqual(h.current.originalResults,[]);assert.equal(h.requests[1].signal.aborted,true);
      h.requests[1].resolve(loaded(a));await h.settle();assert.equal(h.current.target,null);assert.deepEqual(h.current.outcomes,{});
    }finally{h.dispose();}
  }
});

test('End set while opening aborts pending load; an abort-ignoring completion cannot reactivate or score',async()=>{
  const {study,a,loaded}=fixture(),h=harness(study);try{
    h.flush().startTarget(a);const opening=h.flush();assert.equal(opening.active,true);assert.equal(opening.target,null);assert.equal(h.requests.length,1);
    h.clickEndSet();const ended=h.flush();assert.equal(ended.active,false);assert.equal(ended.finished,true);assert.equal(h.requests[0].signal.aborted,true);
    h.requests[0].resolve(loaded(a));const late=await h.settle();assert.equal(late.active,false);assert.equal(late.finished,true);assert.equal(late.target,null);assert.deepEqual(late.outcomes,{});assert.equal(late.score.attempted,0);assert.equal(late.error,'');
  }finally{h.dispose();}
});

test('Choose another set clears a pending deck and ignores its late rejection',async()=>{
  const {study,a}=fixture(),h=harness(study);try{
    h.flush().startTarget(a);h.flush().end();const ended=h.flush();assert.equal(ended.active,false);assert.equal(ended.finished,false);assert.equal(ended.total,0);assert.equal(h.requests[0].signal.aborted,true);
    h.requests[0].reject(Error('obsolete load failed'));const late=await h.settle();assert.equal(late.error,'');assert.equal(late.total,0);assert.equal(late.target,null);
  }finally{h.dispose();}
});

test('superseded questions reject stale content while the current load and error remain visible',async()=>{
  const {study,a,b,loaded}=fixture(),h=harness(study);try{
    h.flush().startTarget(a);h.flush().startTarget(b);h.flush();assert.equal(h.requests.length,2);assert.equal(h.requests[0].signal.aborted,true);
    h.requests[1].resolve(loaded(b));assert.equal((await h.settle()).target?.entry,b);
    h.requests[0].resolve(loaded(a));assert.equal((await h.settle()).target?.entry,b);
    h.current.startTarget(a);h.flush();h.requests[2].reject(Error('current load failed'));const failed=await h.settle();assert.equal(failed.error,'current load failed');assert.equal(failed.target,null);assert.equal(failed.active,true);
  }finally{h.dispose();}
});

test('package or modality replacement invalidates a pending quiz and all session outcomes',async()=>{
  const {study,a,loaded}=fixture(),h=harness(study);try{
    h.flush().startTarget(a);h.flush();const replaced=h.replace(fixture().study);assert.equal(replaced.active,false);assert.equal(replaced.finished,false);assert.equal(replaced.total,0);assert.equal(h.requests[0].signal.aborted,true);
    h.requests[0].resolve(loaded(a));const late=await h.settle();assert.equal(late.target,null);assert.deepEqual(late.outcomes,{});assert.equal(late.error,'');
    const closed=h.replace(null);assert.equal(closed.available.length,0);assert.equal(closed.active,false);
  }finally{h.dispose();}
});

test('review exists only after ending, retains first attempt after retry, and clears on new package or set',async()=>{
  const {study,a,loaded}=fixture(),h=harness(study);try{
    h.flush().startTarget(a);assert.deepEqual(h.flush().results,[]);
    h.requests[0].resolve(loaded(a));await h.settle();
    h.current.acceptPick([1,1,1]);h.flush().submit();h.flush();assert.equal(h.current.outcome,'incorrect');
    h.current.retry();h.flush().acceptPick([0,0,0]);h.flush().submit();h.flush();assert.equal(h.current.outcome,'correct');
    assert.deepEqual(h.current.results,[],'feedback is not a completed review');
    h.current.next();const ended=h.flush();assert.deepEqual(ended.results,[{entry:a,outcome:'incorrect'}]);
    assert.equal(ended.score.correct,0);assert.equal(ended.score.attempted,1);
    h.current.end();assert.deepEqual(h.flush().results,[]);
    h.current.startTarget(a);h.flush();h.clickEndSet();assert.deepEqual(h.flush().results,[{entry:a,outcome:'unanswered'}]);
    assert.deepEqual(h.replace(fixture().study).results,[]);
  }finally{h.dispose();}
});

for(const mode of ['locate','label'] as const){
  for(const [first,second] of [['correct','revealed'],['revealed','correct'],['incorrect','revealed']] as const){
    test(`${mode} same-render ${first} then ${second} preserves the first answer`,async()=>{
      const {a,b,study,loaded}=fixture(),h=harness(study);try{
        h.flush().startTargets([a,b],mode);h.flush();h.requests[0].resolve(loaded(a));await h.settle();
        if(mode==='locate')h.current.acceptPick(first==='incorrect'?[1,1,1]:[0,0,0]);
        else h.current.setChoice(first==='incorrect'?b.id:a.id);
        h.flush();
        const rendered=h.current;
        if(first==='revealed')rendered.reveal();else rendered.submit();
        if(second==='revealed')rendered.reveal();else rendered.submit();
        const answered=h.flush();
        assert.equal(answered.outcome,first,'feedback keeps the first action');
        assert.deepEqual(answered.outcomes,{[a.id]:first},'first-attempt result agrees with feedback');
        assert.equal(answered.score.correct,first==='correct'?1:0);
        assert.equal(answered.score.revealed,first==='revealed'?1:0);
        answered.retry();const retry=h.flush();
        assert.equal(retry.outcome,null,'retry clears current feedback');
        assert.deepEqual(retry.outcomes,{[a.id]:first},'retry preserves the first result');
        if(mode==='locate')retry.acceptPick([0,0,0]);else retry.setChoice(a.id);
        h.flush().submit();const followUp=h.flush();
        assert.equal(followUp.outcome,'correct');
        assert.deepEqual(followUp.outcomes,{[a.id]:first},'unscored retry keeps the first result');
        followUp.next();h.flush();h.requests[1].resolve(loaded(b));await h.settle();
        assert.equal(h.current.outcome,null,'next question begins with no feedback');
        h.current.reveal();const next=h.flush();
        assert.equal(next.outcome,'revealed','next question accepts its own result');
        assert.deepEqual(next.outcomes,{[a.id]:first,[b.id]:'revealed'});
      }finally{h.dispose();}
    });
  }
}

test('retry retires old handlers even when the loaded mask object is unchanged',async()=>{
  const {a,b,study,loaded}=fixture(),h=harness(study);try{
    h.flush().startTarget(a);h.flush();h.requests[0].resolve(loaded(a));await h.settle();
    h.current.acceptPick([1,1,1]);h.flush();const first=h.current;
    first.submit();h.flush().retry();h.flush();
    first.reveal();first.acceptPick([1,1,1]);first.submit();
    assert.equal(h.flush().outcome,null);assert.equal(h.current.pick,null);
    h.current.acceptPick([0,0,0]);h.current.submit();
    assert.equal(h.flush().outcome,'correct');assert.deepEqual(h.current.outcomes,{[a.id]:'incorrect'});
    h.current.startTargets([b],'label');h.flush();h.requests[1].resolve(loaded(b));await h.settle();
    // The selected label, like a point, is current before the next state commit.
    h.current.setChoice(b.id);h.current.submit();assert.equal(h.flush().outcome,'correct');
  }finally{h.dispose();}
});

test('ending an opening question retires the load before effect cleanup',async()=>{
  const {a,study,loaded}=fixture(),h=harness(study);try{
    h.flush().startTarget(a);h.flush();
    h.current.finish();h.requests[0].resolve(loaded(a));
    const ended=await h.settle();assert.equal(ended.finished,true);assert.equal(ended.target,null);
    assert.deepEqual(ended.outcomes,{});assert.equal(ended.error,'');
  }finally{h.dispose();}
});

test('a captured locate submit cannot grade a pick cleared by navigation before rerender',async()=>{
  const {a,study,loaded}=fixture(),h=harness(study);try{
    h.flush().startTarget(a);h.flush();h.requests[0].resolve(loaded(a));await h.settle();
    h.current.acceptPick([0,0,0]);h.flush();
    const rendered=h.current;
    rendered.clearPendingPick([1,1,1]);rendered.submit();
    const current=h.flush();
    assert.equal(current.pick,null);
    assert.equal(current.outcome,null,'the invisible previous pick is not graded');
    assert.deepEqual(current.outcomes,{});
  }finally{h.dispose();}
});

for(const transition of ['next','end','replace'] as const)test(`captured answer handlers cannot score after ${transition}`,async()=>{
  const {a,b,study,loaded}=fixture(),h=harness(study);try{
    h.flush().startTargets([a,b],'locate');h.flush();h.requests[0].resolve(loaded(a));await h.settle();
    h.current.acceptPick([0,0,0]);h.flush();const stale=h.current;
    if(transition==='next'){
      h.current.next();h.flush();h.requests[1].resolve(loaded(b));await h.settle();
    }else if(transition==='end'){
      h.current.end();h.flush();
    }else h.replace(fixture().study);
    stale.submit();stale.reveal();const current=h.flush();
    assert.equal(current.outcome,null,`old ${a.id} callback cannot show feedback after ${transition}`);
    assert.deepEqual(current.outcomes,{},`old ${a.id} callback cannot record a result after ${transition}`);
    assert.equal(current.score.attempted,0);
    if(transition==='next'){
      current.acceptPick([0,0,0]);h.flush().submit();const answered=h.flush();
      assert.equal(answered.outcome,'correct','new question still accepts its answer');
      assert.deepEqual(answered.outcomes,{[b.id]:'correct'});
    }
  }finally{h.dispose();}
});

test('locate navigation clears a stale pick before scoring and a fresh click grades its own voxel',async()=>{
  const {study,a,loaded}=fixture(),h=harness(study);try{
    h.flush().startTarget(a);h.flush();h.requests[0].resolve(loaded(a));await h.settle();
    h.current.acceptPick([0,0,0]);assert.deepEqual(h.flush().pick,[0,0,0]);
    h.current.clearPendingPick([0,0,0]);assert.deepEqual(h.flush().pick,[0,0,0],'same voxel keeps the pending answer');
    h.current.clearPendingPick([0,0,1]);const moved=h.flush();
    assert.equal(moved.pick,null,'navigating away disarms the invisible pick');
    assert.equal(h.panelButton('Check answer').disabled,true);
    moved.submit();const unanswered=h.flush();
    assert.equal(unanswered.outcome,null);assert.deepEqual(unanswered.outcomes,{});assert.equal(unanswered.score.attempted,0);
    unanswered.acceptPick([0,0,0]);h.flush();
    h.current.clearPendingPick([1,1,1]);h.current.acceptPick([1,1,1]);
    assert.deepEqual(h.flush().pick,[1,1,1],'a click can clear and replace a pick in one event');
    h.current.submit();const feedback=h.flush();
    assert.equal(feedback.outcome,'incorrect');assert.deepEqual(feedback.outcomes,{[a.id]:'incorrect'});
    feedback.clearPendingPick([0,0,0]);assert.deepEqual(h.flush().pick,[1,1,1],'navigation after feedback retains the graded point');
    assert.equal(h.current.outcome,'incorrect');assert.equal(h.current.score.attempted,1);
  }finally{h.dispose();}
});

test('label practice ignores image cursor navigation and keeps the chosen label',async()=>{
  const {study,loaded}=fixture(),h=harness(study);try{
    h.flush().setMode('label');h.flush().start();h.flush();
    const target=h.requests[0].entry;h.requests[0].resolve(loaded(target));await h.settle();
    h.current.setChoice(target.id);h.flush().clearPendingPick([1,1,1]);
    assert.equal(h.flush().choice,target.id);h.current.submit();
    assert.equal(h.flush().outcome,'correct');
  }finally{h.dispose();}
});

test('typed recall hides the answer before feedback and accepts case, punctuation and spacing variants',async()=>{
  const {study,a,loaded}=fixture(),h=harness(study);a.label='Left temporal lobe';try{
    h.flush();h.current.setMode('recall');h.flush();
    assert.match(h.panelText(),/Type the structure name/);
    h.current.startTargets([a],'recall');h.flush();
    h.requests[0].resolve(loaded(a));await h.settle();
    const input=h.textInput();assert(input);assert.equal(input.value,'');assert.equal(input.placeholder,undefined);
    assert.equal(input.maxLength,200);assert.equal(input.autoComplete,'off');assert.equal(input.spellCheck,false);
    assert.doesNotMatch(h.panelText(),/Left temporal lobe/);
    assert.equal(h.panelButton('Check answer').disabled,true);
    input.onChange({target:{value:'  LEFT, temporal   lobe!  '}});
    assert.equal(h.current.choice,'','state has not rerendered yet');
    h.current.submit();const answered=h.flush();
    assert.equal(answered.outcome,'correct');assert.deepEqual(answered.outcomes,{[a.id]:'correct'});
    assert.match(h.panelText(),/Left temporal lobe/);
  }finally{h.dispose();}
});

test('typed recall rejects wrong side and empty punctuation, and retry leaves first score unchanged',async()=>{
  const {study,a,loaded}=fixture(),h=harness(study);a.label='Left temporal lobe';try{
    h.flush().startTargets([a],'recall');h.flush();h.requests[0].resolve(loaded(a));await h.settle();
    h.textInput()!.onChange({target:{value:' ... '}});h.flush();
    assert.equal(h.panelButton('Check answer').disabled,true);
    h.current.submit();assert.equal(h.flush().outcome,null);
    h.textInput()!.onChange({target:{value:'Right temporal lobe'}});
    h.current.submit();const first=h.flush();assert.equal(first.outcome,'incorrect');assert.equal(first.score.attempted,1);
    first.retry();h.flush();assert.equal(h.textInput()!.value,'');
    h.textInput()!.onChange({target:{value:'Left temporal lobe'}});h.current.submit();const retry=h.flush();
    assert.equal(retry.outcome,'correct');assert.deepEqual(retry.outcomes,{[a.id]:'incorrect'});
    assert.equal(retry.score.correct,0);assert.equal(retry.score.attempted,1);
  }finally{h.dispose();}
});

test('typed Enter submits once, ignores composition, and old handlers cannot grade a new question',async()=>{
  const {study,a,b,loaded}=fixture(),h=harness(study);a.label='Left temporal lobe';b.label='Right temporal lobe';try{
    h.flush().startTargets([a,b],'recall');h.flush();h.requests[0].resolve(loaded(a));await h.settle();
    const input=h.textInput()!;let prevented=0;
    input.onChange({target:{value:a.label}});
    input.onKeyDown({key:'Enter',nativeEvent:{isComposing:true},repeat:false,preventDefault:()=>{prevented++;}});
    assert.equal(h.flush().outcome,null);assert.equal(prevented,0);
    input.onKeyDown({key:'Enter',nativeEvent:{isComposing:false},repeat:false,preventDefault:()=>{prevented++;}});
    assert.equal(h.flush().outcome,'correct');assert.equal(prevented,1);
    h.current.next();h.flush();h.requests[1].resolve(loaded(b));await h.settle();
    input.onChange({target:{value:b.label}});
    input.onKeyDown({key:'Enter',nativeEvent:{isComposing:false},repeat:false,preventDefault:()=>{prevented++;}});
    assert.equal(h.flush().outcome,null);assert.deepEqual(h.current.outcomes,{[a.id]:'correct'});
    h.textInput()!.onChange({target:{value:b.label}});h.current.submit();
    assert.equal(h.flush().outcome,'correct');
  }finally{h.dispose();}
});

test('failed question retries the same exact annotation without changing the deck or recording an attempt',async()=>{
  const {study,a,loaded}=fixture(),h=harness(study);try{
    h.flush().startTarget(a);h.flush();h.requests[0].reject(Error('Synthetic read failed'));await h.settle();
    assert.equal(h.current.error,'Synthetic read failed');assert.equal(h.current.target,null);
    h.clickPanelButton('Retry opening question');const retrying=h.flush();
    assert.equal(retrying.error,'');assert.equal(retrying.index,0);assert.equal(retrying.total,1);
    assert.equal(h.requests.length,2);assert.equal(h.requests[0].signal.aborted,true);assert.equal(h.requests[1].entry,a);
    assert.deepEqual(retrying.outcomes,{});assert.equal(retrying.score.attempted,0);
    h.requests[1].resolve(loaded(a));const opened=await h.settle();assert.equal(opened.target?.entry,a);
    h.current.acceptPick([0,0,0]);h.flush().submit();assert.equal(h.flush().outcome,'correct');
    h.current.retryOpening();assert.equal(h.flush().outcome,'correct');assert.equal(h.requests.length,2,'loaded answers cannot restart the loader');
  }finally{h.dispose();}
});

test('skipping a failed question advances the same set and preserves an unanswered first result',async()=>{
  const {study,loaded}=fixture(),h=harness(study);try{
    h.flush().start();h.flush();const first=h.requests[0].entry;
    h.requests[0].reject(Error('Synthetic first read failed'));await h.settle();
    h.clickPanelButton('Skip question (unanswered)');const next=h.flush();
    assert.equal(next.active,true);assert.equal(next.index,1);assert.equal(next.total,2);assert.equal(next.error,'');
    assert.equal(h.requests.length,2);assert.notEqual(h.requests[1].entry,first);assert.equal(h.requests[0].signal.aborted,true);
    const second=h.requests[1].entry;h.requests[1].resolve(loaded(second));await h.settle();
    h.current.acceptPick([0,0,0]);h.flush().submit();h.flush().next();const ended=h.flush();
    assert.deepEqual(ended.results,[{entry:first,outcome:'unanswered'},{entry:second,outcome:'correct'}]);
    assert.equal(ended.score.correct,1);assert.equal(ended.score.attempted,1);assert.equal(ended.score.remaining,1);
    assert.deepEqual(ended.outcomes,{[second.id]:'correct'});
  }finally{h.dispose();}
});

test('an unusable mask can be skipped on the last question without fabricating a score',async()=>{
  const {study,a,loaded}=fixture(),h=harness(study);try{
    h.flush().startTarget(a);h.flush();h.requests[0].resolve({...loaded(a),mask:new Uint8Array(8)});await h.settle();
    assert.match(h.current.error,/no usable saved mask/);assert.equal(h.current.target,null);
    h.clickPanelButton('Skip question (unanswered)');const ended=h.flush();
    assert.equal(ended.active,false);assert.equal(ended.finished,true);assert.equal(h.requests[0].signal.aborted,true);
    assert.deepEqual(ended.results,[{entry:a,outcome:'unanswered'}]);assert.equal(ended.score.attempted,0);assert.equal(ended.score.correct,0);
  }finally{h.dispose();}
});

test('ending or replacing a set during retry rejects late success and keeps no stale error',async()=>{
  for(const replace of [false,true]){
    const {study,a,loaded}=fixture(),h=harness(study);try{
      h.flush().startTarget(a);h.flush();h.requests[0].reject(Error('Synthetic read failed'));await h.settle();
      h.clickPanelButton('Retry opening question');h.flush();assert.equal(h.requests.length,2);
      if(replace)h.replace(fixture().study);else{h.clickEndSet();h.flush();}
      assert.equal(h.requests[1].signal.aborted,true);h.requests[1].resolve(loaded(a));await h.settle();
      assert.equal(h.current.active,false);assert.equal(h.current.target,null);assert.equal(h.current.error,'');assert.deepEqual(h.current.outcomes,{});
      assert.equal(h.current.finished,!replace);
    }finally{h.dispose();}
  }
});

test('opening and explicit retry focus the question; background failure and success do not refocus',async()=>{
  const {study,a,loaded}=fixture(),h=harness(study);let focusCount=0,scrollCount=0;
  try{
    const initial=h.flush();initial.headingRef.current={focus:()=>{focusCount++;},closest:()=>({scrollTo:()=>{scrollCount++;}})} as unknown as HTMLHeadingElement;
    initial.startTarget(a);h.flush();assert.equal(focusCount,1);
    h.requests[0].reject(Error('Synthetic read failed'));await h.settle();assert.equal(focusCount,1);assert.equal(scrollCount,1);
    h.clickPanelButton('Retry opening question');h.flush();assert.equal(focusCount,2);
    h.requests[1].resolve(loaded(a));await h.settle();assert.equal(focusCount,2);assert.equal(scrollCount,2);
  }finally{h.dispose();}
});
