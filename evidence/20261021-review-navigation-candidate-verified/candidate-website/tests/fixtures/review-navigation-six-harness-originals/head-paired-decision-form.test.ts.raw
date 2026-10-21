import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {loadReviewUiHelpers} from './review-ui-harness.ts';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import {blankPairedDecision,type PairedDecisionContext} from '../lib/head-paired-decision-contract.ts';
import * as contract from '../lib/head-paired-decision-contract.ts';
import * as client from '../lib/head-paired-decision-client.ts';
import * as workingCopy from '../lib/head-paired-working-copy.ts';
const require=createRequire(import.meta.url),at='2026-10-09T12:34:56.000Z';
const current=await contract.pairedDecisionContext(HEAD_LINK_REVISION,'cortex-left-insula');
const clone=<T>(value:T):T=>JSON.parse(JSON.stringify(value)) as T;
const context=()=>clone(current);
function event(ctx=context(),version=1,decision=blankPairedDecision(ctx)){return {eventSchema:'vm-paired-decision-event-1' as const,context:ctx,version,savedAt:at,decision};}
function page(ctx=context(),history:ReturnType<typeof event>[]=[]){return {context:ctx,history,nextBefore:null,scope:'private-to-signed-in-account-and-institution'};}
type Node={type:unknown;props:Record<string,any>};
type Request={url:string;init:Record<string,any>;resolve:(response:any)=>void;reject:(error:Error)=>void};
type Effect={deps:unknown[];cleanup?:()=>void};
const children=(node:Node)=>node.props.children;
function nodes(value:any):Node[]{
  if(Array.isArray(value))return value.flatMap(nodes);
  if(!value||typeof value!=='object'||!('type'in value)||!('props'in value))return [];
  if(typeof value.type==='function')return nodes(value.type(value.props));
  return [value,...nodes(children(value))];
}
function words(value:any):string{
  if(Array.isArray(value))return value.map(words).join('');
  if(value&&typeof value==='object'&&typeof value.type==='function')return words(value.type(value.props));
  if(value&&typeof value==='object'&&'props'in value)return words(value.props.children);
  return typeof value==='string'||typeof value==='number'?String(value):'';
}
function harness(ctx=context()){
  const source=readFileSync(new URL('../components/HeadPairedDecisionForm.tsx',import.meta.url),'utf8');
  const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const slots:any[]=[],effects=new Map<number,Effect>(),requests:Request[]=[],copies:ReturnType<typeof workingCopy.pairedWorkingCopy>[]=[];
  let downloadFails=false;
  let cursor=0,pending:Array<()=>void>=[],dirty=true,tree:Node,alive=true;
  const equal=(a:unknown[]|undefined,b:unknown[])=>!!a&&a.length===b.length&&a.every((value,index)=>Object.is(value,b[index]));
  const hooks={
    useState(initial:any){const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return [slots[i],(next:any)=>{assert(alive,'no state update after unmount');const value=typeof next==='function'?next(slots[i]):next;if(!Object.is(value,slots[i])){slots[i]=value;dirty=true;}}];},
    useRef(initial:any){const i=cursor++;if(!(i in slots))slots[i]={current:initial};return slots[i];},
    useEffect(create:()=>void|(()=>void),deps:unknown[]){const i=cursor++,old=effects.get(i);if(!equal(old?.deps,deps))pending.push(()=>{old?.cleanup?.();const cleanup=create();effects.set(i,{deps,cleanup:typeof cleanup==='function'?cleanup:undefined});});},
  };
  const jsx=(type:unknown,props:Record<string,any>)=>({type,props});
  const ui=loadReviewUiHelpers({jsx,jsxs:jsx,Fragment:Symbol('Fragment')});
  const mod={exports:{} as {HeadPairedDecisionForm:(props:{context:PairedDecisionContext})=>Node}};
  const fetch=(url:string,init:Record<string,any>={})=>new Promise((resolve,reject)=>requests.push({url,init,resolve,reject}));
const load=(id:string)=>id==='../lib/head-paired-working-copy'?{...workingCopy,downloadPairedWorkingCopy(value:ReturnType<typeof workingCopy.pairedWorkingCopy>){if(downloadFails)throw Error('Download unavailable');copies.push(value);}}:id==='react'?hooks:id==='react/jsx-runtime'?{jsx,jsxs:jsx,Fragment:Symbol('Fragment')}:id==='../lib/head-paired-decision-contract'?contract:id==='../lib/head-paired-decision-client'?client:id==='../lib/clinical-review-fetch'?{clinicalReviewFetch:fetch,getClinicalReviewContext:()=>null}:id==='./GroupedReviewConfirmation'?ui.grouped:id==='../lib/review-draft-autosave'?ui.autosave:id.endsWith('.css')?{}:require(id);
  new Function('require','module','exports',compiled)(load,mod,mod.exports);
  const oldWindow=(globalThis as any).window;
  (globalThis as any).window={addEventListener(){},removeEventListener(){}};
  function flush(){let passes=0;do{assert(++passes<30,'effects settle');dirty=false;cursor=0;pending=[];tree=mod.exports.HeadPairedDecisionForm({context:ctx});for(const effect of pending)effect();}while(dirty);return tree!;}
  async function settle(){for(let i=0;i<8;i++)await Promise.resolve();return flush();}
  function button(label:string){const hit=nodes(tree).find(node=>node.type==='button'&&words(node)===label);assert(hit,`button ${label}`);return hit!;}
  function click(label:string){const hit=button(label);assert.equal(hit.props.disabled||false,false,`${label} enabled`);hit.props.onClick();return flush();}
  function field(label:string){const parent=nodes(tree).find(node=>node.type==='label'&&words(node).includes(label));assert(parent,`label ${label}`);const hit=nodes(parent).find(node=>node.type==='textarea'||node.type==='input'||node.type==='select');assert(hit,`field ${label}`);return hit!;}
  function type(label:string,value:string){field(label).props.onChange({target:{value}});flush();}
  function answer(index:number,body:any,status=200){const req=requests[index];assert(req,`request ${index}`);req.resolve({ok:status>=200&&status<300,status,json:async()=>body});}
return {ctx,requests,copies,failDownload(){downloadFails=true;},flush,settle,button,click,field,type,answer,get tree(){return tree!;},save(){const form=nodes(tree).find(node=>node.type==='form');assert(form);form!.props.onSubmit({preventDefault(){}});flush();},fireAutosave(){ui.fireAutosave();return flush();},pendingAutosave(){return ui.pendingAutosave();},dispose(){for(const effect of effects.values())effect.cleanup?.();alive=false;(globalThis as any).window=oldWindow;}};
}


test('client binds per-item history, exact next-version decisions and current source',()=>{
  const ctx=context(),draft={...blankPairedDecision(ctx),notes:' Synthetic note '},payload=client.pairedSavePayload(ctx,0,draft);
  assert.deepEqual(Object.keys(payload).sort(),['context','decision','expectedVersion']);
  assert.equal(payload.decision.notes,'Synthetic note');
  const saved=event(ctx,1,payload.decision);assert.deepEqual(client.confirmPairedSave({review:saved},ctx,0,draft),saved);
  const neighbour={...ctx,conceptId:'cortex-right-insula' as const};
  for(const input of [page(neighbour),page(ctx,[event(neighbour)]),page(ctx,[event(ctx,3),event(ctx,1)]),{...page(ctx),nextBefore:1}])assert.throws(()=>client.parsePairedHistory(input,ctx));
  for(const input of [{review:{...saved,version:2}},{review:{...saved,context:neighbour}},{review:{...saved,decision:{...draft,notes:'Changed'}}}])assert.throws(()=>client.confirmPairedSave(input,ctx,0,draft));
  const old={...ctx,comparisonRevision:'e'.repeat(64)};assert.equal(client.parsePairedHistory(page(ctx,[event(old)]),ctx).history[0].context.comparisonRevision,old.comparisonRevision);
  assert.throws(()=>client.parsePairedHistory(page(ctx,[event(ctx,2)]),ctx,4));
});

test('form keeps incomplete working copies and locks uncertain saves until explicit recovery',async()=>{
  const h=harness();try{
    h.flush();assert.equal(h.requests[0].url,'/api/atlas-review/head-paired-comparisons?concept=cortex-left-insula');
    h.answer(0,page(h.ctx));await h.settle();
    h.type('Notes / requested corrections',' x\n ');h.type('Status','accepted-semantic');h.click('Download working copy');
    assert.equal(h.copies[0].workingDraft.notes,' x\n ');assert.equal(h.copies[0].serverSaveConfirmed,false);
    h.save();assert.equal(h.requests.length,1,'incomplete attestation cannot save');
    h.type('Status','changes-required');h.type('Notes / requested corrections','Synthetic correction request.');h.save();
    h.requests[1].reject(Error('Lost response'));await h.settle();
    assert.equal(h.button('Save private correction request').props.disabled,true);
    h.click('Download working copy');assert.equal(h.copies[1].editState.saveUncertain,true);
    h.click('Refresh saved history');h.answer(2,page(h.ctx));await h.settle();
    assert.equal(h.field('Notes / requested corrections').props.value,'Synthetic correction request.');
    assert.equal(h.button('Save private correction request').props.disabled,true);
    h.click('Discard unsaved edits…');h.click('Confirm discard');h.click('Start fresh draft');
    h.type('Notes / requested corrections','New synthetic note.');h.save();
    const payload=JSON.parse(h.requests[3].init.body);h.answer(3,{review:event(h.ctx,1,payload.decision)},201);await h.settle();
    assert.match(words(h.tree),/Saved private comparison version 1/);
  }finally{h.dispose();}
});

test('semantic acceptance is explicit, invalidated by edits and never inherited from loaded history',async()=>{
  const h=harness();try{
    const accepted={...blankPairedDecision(h.ctx),status:'accepted-semantic' as const,reviewer:'Test reviewer',qualification:'Test radiologist',checks:{identity:true,extent:true,comparison:true,limits:true},attested:true};
    h.flush();h.answer(0,page(h.ctx,[event(h.ctx,1,accepted)]));await h.settle();h.click('Load version 1');
    assert.equal(h.field(h.ctx.attestation).props.checked,false);h.save();assert.equal(h.requests.length,1);
    h.field(h.ctx.attestation).props.onChange({target:{checked:true}});h.flush();
    h.field(h.ctx.attestation).props.onChange({target:{checked:false}});h.flush();
    assert.equal(h.field(h.ctx.attestation).props.checked,false);h.save();assert.equal(h.requests.length,1,'unchecking clears every criterion and attestation');
    h.field(h.ctx.attestation).props.onChange({target:{checked:true}});h.flush();
    h.type('Notes / requested corrections','Edited evidence.');assert.equal(h.field(h.ctx.attestation).props.checked,false);
    h.field(h.ctx.attestation).props.onChange({target:{checked:true}});h.flush();h.save();
const payload=JSON.parse(h.requests[1].init.body);assert.equal(payload.decision.attested,true);assert.deepEqual(Object.keys(payload.decision.checks).sort(),h.ctx.checklist.map(check=>check.id).sort());assert(h.ctx.checklist.every(check=>payload.decision.checks[check.id]===true));assert.equal(payload.expectedVersion,1);
    h.answer(1,{review:event(h.ctx,2,payload.decision)},201);await h.settle();
    assert.match(words(h.tree),/Semantic comparison accepted; no clinical or publication approval/);
    assert.match(words(h.tree),/Superseded version/);
  }finally{h.dispose();}
});

test('draft autosave waits for a current draft and cancels on decision, manual save and uncertainty',async()=>{
  const h=harness();try{
    h.flush();h.answer(0,page(h.ctx));await h.settle();
    h.type('Notes / requested corrections','Unsubmitted draft note.');
    assert.equal(h.pendingAutosave(),1);
    h.type('Status','accepted-semantic');
    h.fireAutosave();assert.equal(h.requests.length,1,'acceptance is never autosaved');
    h.type('Status','draft');
    h.type('Notes / requested corrections','Edited draft note.');
    assert.equal(h.pendingAutosave(),1);
    h.save();assert.equal(h.pendingAutosave(),0,'manual save cancels debounce');
    h.fireAutosave();assert.equal(h.requests.length,2);
    const manual=JSON.parse(h.requests[1].init.body);
    assert.equal(manual.decision.status,'draft');assert.equal(manual.decision.attested,false);
    h.requests[1].reject(Error('Unconfirmed'));await h.settle();
    h.type('Notes / requested corrections','Still retained.');
    h.fireAutosave();assert.equal(h.requests.length,2,'an uncertain write never retries');
  }finally{h.dispose();}
  const automatic=harness();try{
    automatic.flush();automatic.answer(0,page(automatic.ctx));await automatic.settle();
    automatic.type('Notes / requested corrections','Autosaved draft note.');
    automatic.fireAutosave();assert.equal(automatic.requests.length,2);
    const payload=JSON.parse(automatic.requests[1].init.body);
    assert.equal(payload.decision.status,'draft');assert.equal(payload.decision.attested,false);
    assert.deepEqual(payload.context,automatic.ctx);
  }finally{automatic.dispose();}
});

test('changed session/source and mismatched success cannot discard edits or unlock writes',async()=>{
  const h=harness();try{
    h.flush();h.answer(0,page(h.ctx));await h.settle();h.type('Notes / requested corrections','Preserve this note.');h.save();
    h.answer(1,{review:event(h.ctx,2)},201);await h.settle();assert.equal(h.button('Save private draft').props.disabled,true);
    h.click('Refresh saved history');h.answer(2,page({...h.ctx,comparisonRevision:'e'.repeat(64)}));await h.settle();
    h.click('Refresh saved history');h.answer(3,page(h.ctx));await h.settle();
    assert.equal(h.button('Start fresh draft').props.disabled,true);assert.equal(h.field('Notes / requested corrections').props.value,'Preserve this note.');
    h.click('Download working copy');assert.equal(h.copies[0].editState.reloadRequired,true);
    assert.equal(h.requests.filter(r=>r.init.method==='POST').length,1);
  }finally{h.dispose();}
});

test('late history response cannot update an unmounted form',async()=>{
  const h=harness();h.flush();h.dispose();h.answer(0,page(h.ctx));for(let i=0;i<8;i++)await Promise.resolve();
});

test('all seven exact comparison contexts save correction drafts without widening their review scope',async()=>{
  for(const concept of [...contract.PAIRED_DECISION_CONCEPTS,...contract.IMAGE_ONLY_DECISION_CONCEPTS]){
    const ctx=await contract.pairedDecisionContext(HEAD_LINK_REVISION,concept),h=harness(ctx);
    try{
      h.flush();assert.equal(h.requests.length,1);
      assert.equal(h.requests[0].url,`/api/atlas-review/head-paired-comparisons?concept=${concept}`);
      h.answer(0,page(ctx));await h.settle();
      h.type('Status','changes-required');h.type('Notes / requested corrections',`Synthetic correction for ${concept}.`);
      h.save();h.save();assert.equal(h.requests.length,2,'duplicate submit is suppressed');
      const payload=JSON.parse(h.requests[1].init.body);
      assert.deepEqual(payload.context,ctx);assert.equal(payload.expectedVersion,0);
      assert.equal(payload.decision.status,'changes-required');assert.equal(payload.decision.attested,false);
      h.answer(1,{review:event(ctx,1,payload.decision)},201);await h.settle();
      assert.match(words(h.tree),/Saved private comparison version 1\. Corrections requested; no clinical or publication approval/);
      h.click('Download working copy');assert.equal(h.copies[0].editState.unsavedChanges,false);
      assert.equal(h.copies[0].serverSaveConfirmed,false,'a downloaded working copy never becomes server-save evidence');
    }finally{h.dispose();}
  }
});

test('all comparison forms retain notes and permanently lock saves on expired or changed authorization',async()=>{
  for(const status of [401,403,409]){
    const ctx=await contract.pairedDecisionContext(HEAD_LINK_REVISION,'orbit-right-globe'),h=harness(ctx);
    try{
      h.flush();h.answer(0,page(ctx));await h.settle();
      h.type('Notes / requested corrections','Synthetic note to preserve.');
      h.click('Refresh saved history');h.answer(1,{error:'Synthetic access/source change'},status);await h.settle();
      h.click('Refresh saved history');h.answer(2,page(ctx));await h.settle();
      assert.equal(h.field('Notes / requested corrections').props.value,'Synthetic note to preserve.');
      assert.equal(h.button('Save private draft').props.disabled,true);
      h.save();assert.equal(h.requests.length,3,'successful history refresh cannot restore writes after authorization/source failure');
      h.click('Download working copy');assert.equal(h.copies[0].editState.reloadRequired,true);
    }finally{h.dispose();}
  }
});
