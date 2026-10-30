import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import {blankHeadTeachingDraft,headTeachingDraftContext,type HeadTeachingDraftContext} from '../lib/head-teaching-review-contract.ts';
import * as contract from '../lib/head-teaching-review-contract.ts';
import * as client from '../lib/head-teaching-review-client.ts';
import * as workingCopy from '../lib/head-review-working-copy.ts';
import * as recovery from '../lib/head-teaching-review-recovery.ts';
import {loadReviewUiHelpers} from './review-ui-harness.ts';

const require=createRequire(process.env.VM_WEBSITE_PACKAGE??new URL('../package.json',import.meta.url));
const jsx=require('react/jsx-runtime');
const source=readFileSync(new URL('../components/HeadTeachingReviewNotes.tsx',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
(globalThis as any).window={addEventListener(){},removeEventListener(){}};
(globalThis as any).document={};
type Node={type:unknown;props:Record<string,any>};
function walk(node:any,predicate:(node:Node)=>boolean):Node|undefined{
  if(Array.isArray(node)){for(const child of node){const found=walk(child,predicate);if(found)return found;}return;}
  if(!node||typeof node!=='object'||!('props'in node))return;
  if(predicate(node))return node;
  return walk(node.props.children,predicate);
}
const message=(tree:Node)=>String(walk(tree,node=>node.props.className==='head-review-message')?.props.children??'');
const field=(tree:Node,label:string)=>{
  const owner=walk(tree,node=>node.type==='label'&&Array.isArray(node.props.children)&&node.props.children[0]===label);
  const input=walk(owner,node=>node.type==='input'||node.type==='textarea');assert(input,label);return input;
};
const button=(tree:Node,text:string)=>{
  const found=walk(tree,node=>node.type==='button'&&String(node.props.children).includes(text));assert(found,text);return found;
};
const response=(context:HeadTeachingDraftContext,identity:string|null,version=0)=>{
  const draft=blankHeadTeachingDraft(context);
  const history=version?[{eventSchema:'vm-head-teaching-draft-event-1',context,version,savedAt:'2026-10-30T12:00:00.000Z',draft}]:[];
  return new Response(JSON.stringify({context,history,nextBefore:null,scope:'private-to-signed-in-account-and-institution'}),{status:200,headers:identity?{'X-Clinical-Review-Context':identity}:{}});
};

function mounted(context:HeadTeachingDraftContext,fetcher:(input:string,init?:RequestInit)=>Promise<Response>){
  const ui=loadReviewUiHelpers(jsx),slots:any[]=[],effects=new Map<number,{deps:unknown[];create:()=>void|(()=>void);cleanup?:()=>void}>();
  let cursor=0,tree:Node,dirty=true,disposed=false,props={context};
  const pending:Array<()=>void>=[];
  const useEffect=(create:()=>void|(()=>void),deps?:unknown[])=>{
    const index=cursor++,prior=effects.get(index);
    if(!prior||!deps||prior.deps.length!==deps.length||prior.deps.some((item,i)=>!Object.is(item,deps[i])))pending.push(()=>{
      prior?.cleanup?.();const cleanup=create();effects.set(index,{deps:deps??[],create,cleanup:typeof cleanup==='function'?cleanup:undefined});
    });
  };
  const hooks={
    useRef(initial:unknown){const index=cursor++;return slots[index]??(slots[index]={current:initial});},
    useState(initial:any){const index=cursor++;if(!(index in slots))slots[index]=typeof initial==='function'?initial():initial;
      return [slots[index],(next:any)=>{const value=typeof next==='function'?next(slots[index]):next;if(!Object.is(value,slots[index])){slots[index]=value;dirty=true;}}];},
    useEffect,
  };
  const mod={exports:{} as {HeadTeachingReviewNotes:(props:{context:HeadTeachingDraftContext})=>Node}};
  const imports:Record<string,unknown>={
    react:hooks,'react/jsx-runtime':jsx,
    '../lib/clinical-review-fetch':{clinicalReviewFetch:fetcher,getClinicalReviewContext:()=>null},
    '../lib/head-teaching-review-contract':contract,
    '../lib/head-teaching-review-client':client,
    '../lib/head-review-working-copy':workingCopy,
    '../lib/head-teaching-review-recovery':recovery,
    '../lib/review-draft-autosave':ui.autosave,
    '../lib/clinical-review-navigation-guard':{registerClinicalReviewNavigationGuard:()=>()=>{}},
    './GroupedReviewConfirmation':ui.grouped,
  };
  new Function('require','module','exports',code)((id:string)=>id.endsWith('.css')?{}:Object.hasOwn(imports,id)?imports[id]:assert.fail(`Unexpected import: ${id}`),mod,mod.exports);
  function flush(){let rounds=0;do{assert(++rounds<12,'render settled');dirty=false;cursor=0;pending.length=0;tree=mod.exports.HeadTeachingReviewNotes(props);for(const effect of pending)effect();}while(dirty);return tree;}
  async function settle(){for(let i=0;i<8;i++)await Promise.resolve();return flush();}
  function dispose(){if(disposed)return;disposed=true;for(const entry of [...effects.values()].reverse())entry.cleanup?.();effects.clear();}
  function strictReplay(){for(const entry of effects.values())entry.cleanup?.();for(const entry of effects.values()){const cleanup=entry.create();entry.cleanup=typeof cleanup==='function'?cleanup:undefined;}}
  return {flush,settle,dispose,strictReplay,get tree(){return tree;},setContext(next:HeadTeachingDraftContext){props={context:next};dirty=true;flush();},fireAutosave:ui.fireAutosave};
}

test('mounted immediate edit and unmount restores only after fresh matching GET, without POST',async()=>{
  const context=await headTeachingDraftContext(HEAD_LINK_REVISION);
  let posts=0,identity='same-account';
  const fetcher=async(_input:string,init?:RequestInit)=>{if(init?.method==='POST'){posts++;throw Error('unexpected POST');}return response(context,identity);};
  const first=mounted(context,fetcher);first.flush();await first.settle();
  field(first.tree,'Notes / requested corrections').props.onChange({target:{value:'  invalid, unfinished  '}});
  first.dispose(); // no intervening render: cleanup must see the synchronous snapshot.
  const wrong=mounted(context,async()=>response(context,'other-account'));wrong.flush();await wrong.settle();
  assert.doesNotMatch(message(wrong.tree),/Recovered unsaved/);wrong.dispose();
  assert.equal(field(wrong.tree,'Notes / requested corrections').props.value,'');
  const missing=mounted(context,async()=>response(context,null));missing.flush();await missing.settle();
  assert.doesNotMatch(message(missing.tree),/Recovered unsaved/);
  assert.equal(field(missing.tree,'Notes / requested corrections').props.value,'');missing.dispose();
  const second=mounted(context,fetcher);second.flush();await second.settle();
  assert.match(message(second.tree),/Recovered unsaved/);
  assert.equal(field(second.tree,'Notes / requested corrections').props.value,'  invalid, unfinished  ');
  second.fireAutosave();assert.equal(posts,0);
  button(second.tree,'Discard unsaved edits').props.onClick();second.flush();
  button(second.tree,'Confirm discard').props.onClick();second.flush();second.dispose();
  const third=mounted(context,fetcher);third.flush();await third.settle();
  assert.doesNotMatch(message(third.tree),/Recovered unsaved/);third.dispose();
});

test('mounted restore preserves original version conflict and uncertain in-flight write lock',async()=>{
  const context=await headTeachingDraftContext(HEAD_LINK_REVISION);
  let version=0,posts=0,finishPost:(response:Response)=>void=()=>{};
  const fetcher=async(_input:string,init?:RequestInit)=>{
    if(init?.method==='POST'){posts++;return new Promise<Response>(resolve=>{finishPost=resolve;});}
    return response(context,'account-version',version);
  };
  const first=mounted(context,fetcher);first.flush();await first.settle();
  field(first.tree,'Review scope').props.onChange({target:{value:'reviewed packet'}});
  first.dispose();version=1;
  const conflict=mounted(context,fetcher);conflict.flush();await conflict.settle();
  assert.match(message(conflict.tree),/Saving is locked/);
  assert.equal(button(conflict.tree,'Save private').props.disabled,true);
  button(conflict.tree,'Discard unsaved edits').props.onClick();conflict.flush();button(conflict.tree,'Confirm discard').props.onClick();conflict.flush();conflict.dispose();
  version=0;
  const writing=mounted(context,fetcher);writing.flush();await writing.settle();
  field(writing.tree,'Reviewer name (self-reported)').props.onChange({target:{value:'Synthetic reviewer'}});
  writing.flush();field(writing.tree,'Review scope').props.onChange({target:{value:'reviewed packet'}});
  writing.flush();const form=walk(writing.tree,node=>node.type==='form');assert(form);
  form.props.onSubmit({preventDefault(){}});writing.dispose();
  const restored=mounted(context,fetcher);restored.flush();await restored.settle();
  assert.match(message(restored.tree),/Saving is locked/);
  assert.equal(button(restored.tree,'Save private').props.disabled,true);
  restored.fireAutosave();assert.equal(posts,1);
  finishPost(new Response('{}',{status:500}));
  button(restored.tree,'Discard unsaved edits').props.onClick();restored.flush();button(restored.tree,'Confirm discard').props.onClick();restored.flush();restored.dispose();
});

test('mounted profile stays in first edited snapshot and source prop change cannot relabel old draft',async()=>{
  const context=await headTeachingDraftContext(HEAD_LINK_REVISION);
  const draft={...blankHeadTeachingDraft(context),reviewer:'Saved Reviewer',qualification:'Radiologist'};
  const saved={eventSchema:'vm-head-teaching-draft-event-1',context,version:1,savedAt:'2026-10-30T12:00:00.000Z',draft};
  const changed={...context,checklistVersion:context.checklistVersion+'-changed'};
  const fetcher=async()=>new Response(JSON.stringify({context,history:[saved],nextBefore:null,scope:'private-to-signed-in-account-and-institution'}),{headers:{'X-Clinical-Review-Context':'account-profile'}});
  const first=mounted(context,fetcher);first.flush();await first.settle();
  field(first.tree,'Notes / requested corrections').props.onChange({target:{value:'first edit'}});
  first.setContext(changed);first.dispose();
  assert.equal(recovery.claimRecoveryRecord(changed,'account-profile'),null);
  const original=recovery.claimRecoveryRecord(context,'account-profile');assert(original);
  assert.equal(original.snapshot.draft.reviewer,'Saved Reviewer');
  assert.equal(original.snapshot.draft.qualification,'Radiologist');
  assert.equal(original.snapshot.reloadRequired,true);
  assert(recovery.clearRecoveryRecord(original.id,original.generation));
});

test('pending old-source GET cannot claim a private record after the prop source changes',async()=>{
  const context=await headTeachingDraftContext(HEAD_LINK_REVISION);
  const changed={...context,checklistVersion:context.checklistVersion+'-changed'};
  const baseline=blankHeadTeachingDraft(context);
  const handle=recovery.createRecoveryRecord(context,'account-pending',{draft:{...baseline,notes:'old-source private text'},baseline,baseVersion:0,dirty:true,uncertain:false,reloadRequired:false,writeInFlight:false});assert(handle);
  const detached=recovery.detachRecoveryRecord(handle.id,handle.generation,false);assert(detached);
  let release:(value:Response)=>void=()=>{};
  const pending=new Promise<Response>(resolve=>{release=resolve;});
  const form=mounted(context,async()=>pending);form.flush();
  form.setContext(changed);
  release(response(context,'account-pending'));
  await form.settle();
  assert.equal(field(form.tree,'Notes / requested corrections').props.value,'');
  assert.match(message(form.tree),/source changed while history was loading/);
  form.dispose();
  const retained=recovery.claimRecoveryRecord(context,'account-pending');assert(retained);
  assert.equal(retained.snapshot.draft.notes,'old-source private text');
  assert(recovery.clearRecoveryRecord(retained.id,retained.generation));
});

test('mounted recovered draft requires an explicit save and a confirmed save clears its record',async()=>{
  const context=await headTeachingDraftContext(HEAD_LINK_REVISION);
  let posts=0;
  const fetcher=async(_input:string,init?:RequestInit)=>{
    if(init?.method==='POST'){
      posts++;
      const body=JSON.parse(String(init.body));
      return new Response(JSON.stringify({review:{eventSchema:'vm-head-teaching-draft-event-1',context,version:body.expectedVersion+1,savedAt:'2026-10-30T12:00:00.000Z',draft:body.draft}}),{headers:{'X-Clinical-Review-Context':'account-save'}});
    }
    return response(context,'account-save');
  };
  const first=mounted(context,fetcher);first.flush();await first.settle();
  field(first.tree,'Review scope').props.onChange({target:{value:'exact reviewed packet'}});first.dispose();
  const second=mounted(context,fetcher);second.flush();await second.settle();
  assert.match(message(second.tree),/Recovered unsaved/);
  second.fireAutosave();assert.equal(posts,0);
  const form=walk(second.tree,node=>node.type==='form');assert(form);form.props.onSubmit({preventDefault(){}});
  await second.settle();assert.equal(posts,1);
  assert.match(message(second.tree),/Saved private version 1/);second.dispose();
  const third=mounted(context,fetcher);third.flush();await third.settle();
  assert.doesNotMatch(message(third.tree),/Recovered unsaved/);third.dispose();
});

test('effect replay retains the active draft and keeps its recovery record available after unmount',async()=>{
  const context=await headTeachingDraftContext(HEAD_LINK_REVISION),identity='strict-replay';
  const fetcher=async()=>response(context,identity);
  const first=mounted(context,fetcher);first.flush();await first.settle();
  field(first.tree,'Notes / requested corrections').props.onChange({target:{value:'Strict Mode retained text'}});first.flush();
  first.strictReplay();await first.settle();
  assert.equal(field(first.tree,'Notes / requested corrections').props.value,'Strict Mode retained text');first.dispose();
  const copy=recovery.claimRecoveryRecord(context,identity);assert(copy);assert.equal(copy.snapshot.draft.notes,'Strict Mode retained text');
  assert(recovery.clearRecoveryRecord(copy.id,copy.generation));
});

test('simultaneous copies cannot discard each other and a full recovery store gives visible guidance',async()=>{
  const context=await headTeachingDraftContext(HEAD_LINK_REVISION),identity='simultaneous';
  const fetcher=async()=>response(context,identity);
  const first=mounted(context,fetcher),second=mounted(context,fetcher);first.flush();second.flush();await first.settle();await second.settle();
  field(first.tree,'Notes / requested corrections').props.onChange({target:{value:'first independent copy'}});first.flush();
  field(second.tree,'Notes / requested corrections').props.onChange({target:{value:'second independent copy'}});second.flush();
  button(first.tree,'Discard unsaved edits').props.onClick();first.flush();button(first.tree,'Confirm discard').props.onClick();first.flush();first.dispose();second.dispose();
  const remaining=recovery.claimRecoveryRecord(context,identity);assert(remaining);assert.equal(remaining.snapshot.draft.notes,'second independent copy');assert(recovery.clearRecoveryRecord(remaining.id,remaining.generation));assert.equal(recovery.claimRecoveryRecord(context,identity),null);
  const draft=blankHeadTeachingDraft(context),records=[];
  try{
    for(let i=0;i<32;i++){const record=recovery.createRecoveryRecord(context,'capacity-'+i,{draft,baseline:draft,baseVersion:0,dirty:true,uncertain:false,reloadRequired:false,writeInFlight:false});assert(record);records.push(record);}
    const full=mounted(context,async()=>response(context,'capacity-visible'));full.flush();await full.settle();
    field(full.tree,'Notes / requested corrections').props.onChange({target:{value:'keep this local form text'}});full.flush();
    assert(walk(full.tree,node=>node.props.role==='alert'&&String(node.props.children).includes('In-memory recovery is full')));
    assert.equal(field(full.tree,'Notes / requested corrections').props.value,'keep this local form text');full.dispose();
  }finally{for(const record of records)assert(recovery.clearRecoveryRecord(record.id,record.generation));}
});
