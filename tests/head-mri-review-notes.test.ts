import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {loadReviewUiHelpers} from './review-ui-harness.ts';
import {HEAD_MRI_DRAFT_CHECKLIST,blankHeadMriDraft,headMriDraftStale,type HeadMriDraftContext} from '../lib/head-mri-review-draft-contract.ts';
import * as contract from '../lib/head-mri-review-draft-contract.ts';
import * as client from '../lib/head-mri-review-draft-client.ts';
import * as workingCopy from '../lib/head-review-working-copy.ts';

const require=createRequire(import.meta.url);
const at='2026-10-08T12:34:56.000Z';
const clone=<T>(value:T):T=>JSON.parse(JSON.stringify(value)) as T;
function context():HeadMriDraftContext{return {
  schema:'vm-head-mri-draft-context-1',catalogScope:'head-mri-only-drafts',packetId:'head-mri-only-learning',
  headRevision:'a'.repeat(64),comparisonRevision:'b'.repeat(64),teachingRevision:'c'.repeat(64),learningRevision:'d'.repeat(64),
  checklistVersion:'head-mri-draft-review-1',checklist:HEAD_MRI_DRAFT_CHECKLIST.map(item=>({...item})),
  conceptIds:['limbic-left-amygdala','limbic-right-amygdala','commissure-corpus-callosum','endocrine-pituitary-gland'],
  patientRegistration:false,clinicalApproval:false,publicationApproval:false,
};}
function event(ctx=context(),version=1,draft=blankHeadMriDraft(ctx)){return {eventSchema:'vm-head-mri-draft-event-1' as const,context:ctx,version,savedAt:at,draft};}
function page(ctx=context(),history:ReturnType<typeof event>[]=[]) {return {context:ctx,history,nextBefore:null,scope:'private-to-signed-in-account-and-institution'};}

test('MRI save payload contains every independent revision and no approval or registration fields',()=>{
  const ctx=context(),draft={...blankHeadMriDraft(ctx),notes:'  Synthetic MRI note  ',checks:{identity:true,extent:false,facts:true,exercise:false,revision:true}};
  const payload=client.headMriDraftSavePayload(ctx,7,draft);
  assert.deepEqual(Object.keys(payload).sort(),['catalogScope','packetId','headRevision','comparisonRevision','teachingRevision','learningRevision','checklistVersion','expectedVersion','draft'].sort());
  for(const key of ['headRevision','comparisonRevision','teachingRevision','learningRevision','checklistVersion'] as const)assert.equal(payload[key],ctx[key]);
  assert.deepEqual(payload.draft.checks,draft.checks);
  assert.equal(payload.draft.notes,'Synthetic MRI note');
  assert.equal(payload.expectedVersion,7);
  assert.equal(payload.draft.attested,false);
  assert.throws(()=>client.headMriDraftSavePayload(ctx,2147483647,draft));
});

test('MRI history validates current context and order while retaining exact stale historical records',()=>{
  const ctx=context(),old=clone(ctx);old.learningRevision='e'.repeat(64);
  const current=event(ctx,3),historical=event(old,2),parsed=client.parseHeadMriHistory(page(ctx,[current,historical]),ctx);
  assert.deepEqual(parsed.history.map(item=>item.version),[3,2]);
  assert.equal(headMriDraftStale(parsed.history[1],ctx),true);
  for(const invalid of [page(old),page(ctx,[historical,current]),page(ctx,[current,current]),{...page(ctx),scope:'public'},{...page(ctx),extra:true},page(ctx,[{...current,draft:{...current.draft,status:'approved' as never}}])])
    assert.throws(()=>client.parseHeadMriHistory(invalid,ctx));
  assert.throws(()=>client.parseHeadMriHistory(page(ctx,[current]),ctx,3));
  const twenty=Array.from({length:20},(_,index)=>event(ctx,20-index));
  assert.equal(client.parseHeadMriHistory({...page(ctx,twenty),nextBefore:1},ctx).nextBefore,1);
  assert.throws(()=>client.parseHeadMriHistory(page(ctx,twenty),ctx));
});

test('MRI save confirmation requires exact next version, context and normalized draft',()=>{
  const ctx=context(),draft={...blankHeadMriDraft(ctx),status:'changes-required' as const,notes:'  Synthetic correction request.  '};
  const saved=event(ctx,8,contract.validateHeadMriDraft(draft,ctx));
  assert.deepEqual(client.confirmHeadMriSave({review:saved},ctx,7,draft),saved);
  const old=clone(ctx);old.comparisonRevision='e'.repeat(64);
  for(const response of [{review:{...saved,version:9}},{review:{...saved,context:old}},{review:{...saved,draft:{...saved.draft,notes:'Different correction.'}}},{review:saved,approved:true},{error:'unconfirmed'}])
    assert.throws(()=>client.confirmHeadMriSave(response,ctx,7,draft));
});

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
  const source=readFileSync(new URL('../components/HeadMriReviewNotes.tsx',import.meta.url),'utf8');
  const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const slots:any[]=[],effects=new Map<number,Effect>(),requests:Request[]=[],copies:workingCopy.HeadReviewWorkingCopy[]=[];
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
  const mod={exports:{} as {HeadMriReviewNotes:(props:{context:HeadMriDraftContext})=>Node}};
  const fetch=(url:string,init:Record<string,any>={})=>new Promise((resolve,reject)=>requests.push({url,init,resolve,reject}));
const load=(id:string)=>id==='../lib/head-review-working-copy'?{...workingCopy,downloadHeadWorkingCopy(value:workingCopy.HeadReviewWorkingCopy){if(downloadFails)throw Error('Download unavailable');copies.push(value);}}:id==='react'?hooks:id==='react/jsx-runtime'?{jsx,jsxs:jsx,Fragment:Symbol('Fragment')}:id==='../lib/head-mri-review-draft-contract'?contract:id==='../lib/head-mri-review-draft-client'?client:id==='../lib/clinical-review-fetch'?{clinicalReviewFetch:fetch,getClinicalReviewContext:()=>null}:id==='./GroupedReviewConfirmation'?ui.grouped:id==='../lib/review-draft-autosave'?ui.autosave:id.endsWith('.css')?{}:require(id);
  new Function('require','module','exports',compiled)(load,mod,mod.exports);
  const oldWindow=(globalThis as any).window;
  (globalThis as any).window={addEventListener(){},removeEventListener(){}};
  function flush(){let passes=0;do{assert(++passes<30,'effects settle');dirty=false;cursor=0;pending=[];tree=mod.exports.HeadMriReviewNotes({context:ctx});for(const effect of pending)effect();}while(dirty);return tree!;}
  async function settle(){for(let i=0;i<8;i++)await Promise.resolve();return flush();}
  function button(label:string){const hit=nodes(tree).find(node=>node.type==='button'&&words(node)===label);assert(hit,`button ${label}`);return hit!;}
  function click(label:string){const hit=button(label);assert.equal(hit.props.disabled||false,false,`${label} enabled`);hit.props.onClick();return flush();}
  function field(label:string){const parent=nodes(tree).find(node=>node.type==='label'&&words(node).includes(label));assert(parent,`label ${label}`);const hit=nodes(parent).find(node=>node.type==='textarea'||node.type==='input'||node.type==='select');assert(hit,`field ${label}`);return hit!;}
  function type(label:string,value:string){field(label).props.onChange({target:{value}});flush();}
  function answer(index:number,body:any,status=200){const req=requests[index];assert(req,`request ${index}`);req.resolve({ok:status>=200&&status<300,status,json:async()=>body});}
return {ctx,requests,copies,failDownload(){downloadFails=true;},flush,settle,button,click,field,type,answer,get tree(){return tree!;},save(){const form=nodes(tree).find(node=>node.type==='form');assert(form);form!.props.onSubmit({preventDefault(){}});flush();},fireAutosave(){ui.fireAutosave();return flush();},pendingAutosave(){return ui.pendingAutosave();},dispose(){for(const effect of effects.values())effect.cleanup?.();alive=false;(globalThis as any).window=oldWindow;}};
}

test('working-copy action preserves incomplete edits and remains available during uncertain saves and changed source',async()=>{
  const h=harness();try{
    h.flush();h.click('Download working copy');
    assert.equal(h.copies[0].editState.baseVersion,null);assert.equal(h.requests.length,1);
    assert.match(words(h.tree),/Confirm the file was saved/);
    h.answer(0,page(h.ctx));await h.settle();
    h.type('Notes / requested corrections',' x\n ');h.type('Status','changes-required');h.click('Download working copy');
    assert.equal(h.copies[1].workingDraft.notes,' x\n ');assert.equal(h.copies[1].workingDraft.status,'changes-required');
    assert.equal(h.copies[1].editState.unsavedChanges,true);assert.equal(h.requests.length,1);
    assert.match(words(h.tree),/Unsaved edits/);
    h.type('Notes / requested corrections','Keep this unsaved correction.');h.save();
    h.click('Download working copy');assert.equal(h.copies[2].editState.saveUncertain,true);
    h.requests[1].reject(Error('Lost response'));await h.settle();
    const priorMessage=nodes(h.tree).find(node=>node.props.role==='alert');
    h.click('Download working copy');assert.equal(h.copies[3].editState.saveUncertain,true);
    assert.equal(h.button('Save private correction request').props.disabled,true);
    if(priorMessage)assert(words(h.tree).includes(words(priorMessage)),'download must not hide the save error');
    h.click('Refresh saved history');const changed=clone(h.ctx);changed.comparisonRevision='e'.repeat(64);
    h.answer(2,page(changed),409);await h.settle();h.click('Download working copy');
    assert.equal(h.copies[4].editState.reloadRequired,true);assert.deepEqual(h.copies[4].context,h.ctx);
    assert.equal(h.requests.length,3);assert.equal(h.requests.filter(r=>r.init.method==='POST').length,1);
    h.failDownload();h.click('Download working copy');
    assert.match(words(h.tree),/Download could not be started/);assert.equal(h.copies.length,5);
    assert.equal(h.field('Notes / requested corrections').props.value,'Keep this unsaved correction.');
    assert.equal(h.button('Save private correction request').props.disabled,true);
  }finally{h.dispose();}
});

test('MRI form starts with GET only, unique title, private labels and exact checklist',async()=>{
  const h=harness();try{
    h.flush();assert.equal(h.requests.length,1);assert.equal(h.requests[0].url,'/api/atlas-review/head-mri-learning');assert.equal(h.requests[0].init.method,undefined);
    assert(nodes(h.tree).some(node=>node.type==='h2'&&node.props.id==='head-mri-review-notes-title'&&words(node)==='Private MRI review notes & corrections'));
    assert.equal(nodes(h.tree).find(node=>node.type==='fieldset')?.props.disabled,true);
    for(const check of h.ctx.checklist)assert(words(h.tree).includes(check.label));
    assert(!/Clinical approval granted|sign.off button/i.test(words(h.tree)));
    h.answer(0,page(h.ctx));await h.settle();assert.equal(h.button('Save private draft').props.disabled||false,false);
  }finally{h.dispose();}
});

test('typed correction survives refresh and failed history; exact save creates history and clears dirty state',async()=>{
  const h=harness();try{
    h.flush();h.answer(0,page(h.ctx));await h.settle();
    h.type('Notes / requested corrections','Synthetic requested correction.');
    const status=h.field('Status');status.props.onChange({target:{value:'changes-required'}});h.flush();
    assert.equal(h.button('Save private correction request').props.disabled||false,false);
    h.click('Refresh saved history');h.answer(1,page(h.ctx));await h.settle();assert.equal(h.field('Notes / requested corrections').props.value,'Synthetic requested correction.');
    h.click('Refresh saved history');h.requests[2].reject(Error('Synthetic history failure'));await h.settle();assert.equal(h.field('Notes / requested corrections').props.value,'Synthetic requested correction.');
    assert.equal(h.button('Save private correction request').props.disabled,true);
    h.click('Refresh saved history');h.answer(3,page(h.ctx));await h.settle();
    // An uncertain operation requires explicit replacement after history comparison.
    h.click('Discard unsaved edits…');assert.match(words(h.tree),/Copy any text you want to keep first/);
    h.click('Keep editing');assert.equal(h.field('Notes / requested corrections').props.value,'Synthetic requested correction.');
    h.click('Discard unsaved edits…');h.click('Confirm discard');h.click('Start fresh draft');
    h.type('Notes / requested corrections','Synthetic MRI draft.');h.save();assert.equal(h.requests.length,5);
    const payload=JSON.parse(h.requests[4].init.body);assert.deepEqual(payload,client.headMriDraftSavePayload(h.ctx,0,{...blankHeadMriDraft(h.ctx),notes:'Synthetic MRI draft.'}));
    h.answer(4,{review:event(h.ctx,1,payload.draft)},201);await h.settle();
    assert.match(words(h.tree),/Saved private MRI version 1/);
    assert.equal(nodes(h.tree).some(node=>node.type==='button'&&words(node)==='Discard unsaved edits…'),false);
  }finally{h.dispose();}
});

test('mismatched save locks writes; old history and valid refresh cannot clear changed source or session',async()=>{
  const h=harness();try{
    h.flush();h.answer(0,page(h.ctx));await h.settle();h.type('Notes / requested corrections','Keep this exact MRI note.');h.save();
    h.answer(1,{review:event(h.ctx,2,{...blankHeadMriDraft(h.ctx),notes:'Different content.'})},201);await h.settle();
    assert.equal(h.field('Notes / requested corrections').props.value,'Keep this exact MRI note.');assert.equal(h.button('Save private draft').props.disabled,true);
    h.save();assert.equal(h.requests.length,2,'uncertain write is never retried');
    h.click('Refresh saved history');h.answer(2,page(h.ctx,[event(h.ctx,1)]));await h.settle();
    assert.equal(h.button('Save private draft').props.disabled,true);
    const old=clone(h.ctx);old.learningRevision='e'.repeat(64);
    h.click('Refresh saved history');h.answer(3,page(old),409);await h.settle();
    h.click('Refresh saved history');h.answer(4,page(h.ctx,[event(h.ctx,1)]));await h.settle();
    assert.equal(h.button('Save private draft').props.disabled,true);
    assert.equal(h.button('Load version 1').props.disabled,true);
    assert.equal(h.button('Start fresh draft').props.disabled,true);
  }finally{h.dispose();}
});

test('lost POST with existing history requires fresh GET and explicit replacement after discard',async()=>{
  const h=harness();try{
    const prior=event(h.ctx,2,{...blankHeadMriDraft(h.ctx),notes:'Previously saved MRI note.'});
    h.flush();h.answer(0,page(h.ctx,[prior]));await h.settle();
    h.type('Notes / requested corrections','Unsaved MRI note after lost response.');h.save();
    assert.equal(h.requests[1].init.method,'POST');
    h.requests[1].reject(Error('Synthetic lost POST response'));await h.settle();
    assert.equal(h.field('Notes / requested corrections').props.value,'Unsaved MRI note after lost response.');
    assert.equal(h.button('Save private draft').props.disabled,true);
    h.click('Discard unsaved edits…');h.click('Confirm discard');
    assert.equal(h.button('Load version 2').props.disabled,true,'old history cannot resolve uncertain write');
    assert.equal(h.button('Start fresh draft').props.disabled,true);
    h.click('Refresh saved history');h.answer(2,page(h.ctx,[prior]));await h.settle();
    assert.equal(h.button('Load version 2').props.disabled||false,false);
    assert.equal(h.button('Start fresh draft').props.disabled||false,false);
    assert.equal(h.button('Save private draft').props.disabled,true,'fresh GET alone does not unlock saving');
    h.click('Load version 2');
    assert.equal(h.field('Notes / requested corrections').props.value,'Previously saved MRI note.');
    assert.equal(h.button('Save private draft').props.disabled||false,false);
    assert.equal(h.requests.filter(request=>request.init.method==='POST').length,1,'lost write was not retried');
  }finally{h.dispose();}
});

test('HTTP 200 history with changed current packet requires page reload despite later valid GET',async()=>{
  const h=harness();try{
    const prior=event(h.ctx,1),changed=clone(h.ctx);changed.comparisonRevision='e'.repeat(64);
    h.flush();h.answer(0,page(h.ctx,[prior]));await h.settle();
    h.click('Refresh saved history');h.answer(1,page(changed),200);await h.settle();
    assert.equal(h.button('Start fresh draft').props.disabled,true);
    assert.equal(h.button('Load version 1').props.disabled,true);
    h.click('Refresh saved history');h.answer(2,page(h.ctx,[prior]),200);await h.settle();
    assert.equal(h.button('Start fresh draft').props.disabled,true);
    assert.equal(h.button('Load version 1').props.disabled,true);
    assert.equal(h.button('Save private draft').props.disabled,true);
    assert.equal(h.requests.filter(request=>request.init.method==='POST').length,0);
  }finally{h.dispose();}
});

test('late request after unmount cannot update form state',async()=>{
  const h=harness();h.flush();h.dispose();h.answer(0,page(h.ctx));for(let i=0;i<8;i++)await Promise.resolve();
});
