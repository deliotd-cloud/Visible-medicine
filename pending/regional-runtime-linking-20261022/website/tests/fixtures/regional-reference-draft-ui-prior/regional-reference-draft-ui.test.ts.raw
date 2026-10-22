import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import * as navigationGuard from '../lib/clinical-review-navigation-guard.ts';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {loadReviewUiHelpers} from './review-ui-harness.ts';
import * as contract from '../lib/regional-reference-draft-contract.ts';
import * as client from '../lib/regional-reference-draft-client.ts';

const require=createRequire(import.meta.url);
const context=()=>contract.parseRegionalReferenceDraftContext({schema:'vm-regional-reference-teaching-draft-context-1',atlasRevision:'a'.repeat(40),mappingRevision:'b'.repeat(64),teachingRevision:'c'.repeat(64),target:{id:'vm:reference:synthetic',kind:'body',label:'Synthetic right knee',side:'right',sourceHash:'d'.repeat(64),specimenRevision:null,relation:'same-structure'},checklistVersion:'regional-reference-teaching-v1',clinicalApproval:false,publicationApproval:false,patientRegistration:false});
const copy=<T>(value:T):T=>JSON.parse(JSON.stringify(value)) as T;
const saved=(ctx=context(),version=1,draft=contract.blankRegionalReferenceDraft())=>({eventSchema:'vm-regional-reference-teaching-draft-event-1' as const,context:ctx,version,savedAt:'2026-10-14T12:00:00.000Z',draft});
const page=(ctx=context(),events:ReturnType<typeof saved>[]=[])=>({context:ctx,history:events,latestVersion:events[0]?.version??0,nextBefore:null,scope:'private-to-signed-in-account-and-institution'});
type Node={type:any;props:Record<string,any>};
const nodes=(value:any):Node[]=>Array.isArray(value)?value.flatMap(nodes):value&&typeof value==='object'&&'type'in value&&'props'in value?[value,...nodes(value.props.children)]:[];
const words=(value:any):string=>Array.isArray(value)?value.map(words).join(''):value&&typeof value==='object'&&'props'in value?words(value.props.children):typeof value==='string'||typeof value==='number'?String(value):'';
function harness(initial=context()){
 const source=readFileSync(new URL('../components/RegionalReferenceReviewNotes.tsx',import.meta.url),'utf8');
 const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const slots:any[]=[],effects=new Map<number,{deps:unknown[];create:()=>void|(()=>void);cleanup?:()=>void}>(),requests:{url:string;init:any;resolve:(v:any)=>void;reject:(e:Error)=>void}[]=[],copies:any[]=[];
 let ctx=initial,cursor=0,pending:Array<()=>void>=[],changed=true,tree:Node,alive=true;
 const equal=(a:unknown[]|undefined,b:unknown[])=>!!a&&a.length===b.length&&a.every((v,i)=>Object.is(v,b[i]));
 const effect=(create:()=>void|(()=>void),deps:unknown[])=>{const i=cursor++,old=effects.get(i);if(!equal(old?.deps,deps))pending.push(()=>{old?.cleanup?.();const cleanup=create();effects.set(i,{deps,create,cleanup:typeof cleanup==='function'?cleanup:undefined});});};
 const hooks={useState(initial:any){const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return [slots[i],(next:any)=>{assert(alive,'no update after unmount');const value=typeof next==='function'?next(slots[i]):next;if(!Object.is(value,slots[i])){slots[i]=value;changed=true;}}];},useRef(initial:any){const i=cursor++;if(!(i in slots))slots[i]={current:initial};return slots[i];},useEffect:effect,useLayoutEffect:effect};
 const jsx=(type:any,props:any)=>({type,props});
 const ui=loadReviewUiHelpers({jsx,jsxs:jsx,Fragment:Symbol('Fragment')});
 const mod={exports:{} as {RegionalReferenceReviewNotes:(props:{context:ReturnType<typeof context>})=>Node}};
 const fetch=(url:string,init:any={})=>new Promise((resolve,reject)=>requests.push({url,init,resolve,reject}));
 const load=(id:string)=>id==='../lib/clinical-review-navigation-guard'?navigationGuard:id==='react'?hooks:id==='react/jsx-runtime'?{jsx,jsxs:jsx,Fragment:Symbol('Fragment')}:id==='../lib/regional-reference-draft-contract'?contract:id==='../lib/regional-reference-draft-client'?{...client,downloadRegionalReferenceWorkingCopy(packet:any){copies.push(packet);}}:id==='../lib/clinical-review-fetch'?{clinicalReviewFetch:fetch}:id==='./GroupedReviewConfirmation'?ui.grouped:id==='../lib/review-draft-autosave'?ui.autosave:id.endsWith('.css')?{}:require(id);
 new Function('require','module','exports',compiled)(load,mod,mod.exports);
 const oldNavigationDocument=Object.getOwnPropertyDescriptor(globalThis,'document');
 const navigationListeners=new Set<Function>();
 const navigationDocument={
  defaultView:{location:{href:'https://visiblemedicine.test/atlas/head-learning?mode=review'},confirm(){throw Error('No synthetic navigation was dispatched');}},
  addEventListener(type:string,listener:Function,capture:boolean){assert.equal(type,'click');assert.equal(capture,true);assert(!navigationListeners.has(listener));navigationListeners.add(listener);},
  removeEventListener(type:string,listener:Function,capture:boolean){assert.equal(type,'click');assert.equal(capture,true);assert(navigationListeners.delete(listener),'registered navigation listener removed');},
 };
 (globalThis as any).document=navigationDocument;
 const oldWindow=(globalThis as any).window;(globalThis as any).window={addEventListener(){},removeEventListener(){}};
 function flush(){let count=0;do{assert(++count<35,'effects settle');changed=false;cursor=0;pending=[];tree=mod.exports.RegionalReferenceReviewNotes({context:ctx});for(const run of pending)run();}while(changed);return tree!;}
 async function settle(){for(let i=0;i<8;i++)await Promise.resolve();return flush();}
 function button(label:string){const hit=nodes(tree).find(n=>n.type==='button'&&words(n)===label);assert(hit,`button ${label}`);return hit!;}
 function click(label:string){const hit=button(label);assert(!hit.props.disabled,`${label} enabled`);hit.props.onClick();flush();}
 function open(value=true){tree.props.onToggle({currentTarget:{open:value}});flush();}
 function note(value:string){const field=nodes(tree).find(n=>n.type==='textarea');assert(field);field.props.onChange({target:{value}});flush();}
 function answer(i:number,value:any,status=200){const req=requests[i];assert(req,`request ${i}`);req.resolve({ok:status>=200&&status<300,status,json:async()=>value});}
 function save(){const form=nodes(tree).find(n=>n.type==='form');assert(form);form.props.onSubmit({preventDefault(){}});flush();}
 function dispose(){for(const effect of effects.values())effect.cleanup?.();alive=false;(globalThis as any).window=oldWindow;assert.equal(navigationListeners.size,0,'navigation listener cleaned up on unmount');if(oldNavigationDocument)Object.defineProperty(globalThis,'document',oldNavigationDocument);else delete (globalThis as any).document;}
 return {requests,copies,flush,settle,button,click,open,note,answer,save,dispose,fireAutosave:ui.fireAutosave,pendingAutosave:ui.pendingAutosave,setContext(value:ReturnType<typeof context>){ctx=value;flush();},speculate(value:ReturnType<typeof context>){cursor=0;pending=[];const speculative=mod.exports.RegionalReferenceReviewNotes({context:value});pending=[];return speculative;},replayEffects(){for(const value of effects.values())value.cleanup?.();for(const value of effects.values()){const cleanup=value.create();value.cleanup=typeof cleanup==='function'?cleanup:undefined;}flush();},get tree(){return tree!;}};
}

test('closed until explicit open; exact private history, save and older pagination',async()=>{
 const h=harness();try{
  h.flush();assert.equal(h.requests.length,0);h.open();assert.equal(h.requests[0].url,'/api/atlas-review/reference-learning');assert.equal(h.requests[0].init.cache,'no-store');assert(!h.requests[0].url.includes('?'));
  const ctx=context();h.answer(0,page(ctx));await h.settle();h.note('Synthetic reference correction');h.save();assert.equal(h.requests[1].init.method,'POST');assert.equal(JSON.parse(h.requests[1].init.body).expectedVersion,0);
  h.answer(1,{review:saved(ctx,1,{...contract.blankRegionalReferenceDraft(),notes:'Synthetic reference correction'})},201);await h.settle();assert.match(words(h.tree),/Saved private version 1/);assert.equal(h.button('Save private draft').props.disabled,false);
  h.click('Refresh saved history');h.answer(2,page(ctx,[saved(ctx,1)]));await h.settle();assert.equal(h.copies.length,0);
 }finally{h.dispose();}
});

test('dirty refresh keeps text and base; explicit comparison rebases only current context',async()=>{
 const h=harness();try{
  h.flush();h.open();const ctx=context();h.answer(0,page(ctx,[saved(ctx,1)]));await h.settle();h.note('My retained note');h.click('Refresh saved history');h.answer(1,page(ctx,[saved(ctx,2)]));await h.settle();assert.equal(nodes(h.tree).find(n=>n.type==='textarea')?.props.value,'My retained note');assert.equal(h.button('Save private draft').props.disabled,true);
  h.click('Export working copy');assert.equal(h.copies[0].state.baseVersion,1);assert.equal(h.copies[0].state.unsavedChanges,true);
  h.click('Keep my edits against latest version 2');h.save();assert.equal(JSON.parse(h.requests[2].init.body).expectedVersion,2);
 }finally{h.dispose();}
});

test('older history pages append without changing the current draft or latest base',async()=>{
 const h=harness();try{
  const ctx=context(),first=Array.from({length:20},(_,i)=>saved(ctx,21-i));h.flush();h.open();h.answer(0,{...page(ctx,first),nextBefore:2});await h.settle();h.note('Continue writing');h.click('Load older history');assert.equal(h.requests[1].init.headers['X-Reference-Teaching-Before'],'2');h.answer(1,{...page(ctx,[saved(ctx,1)]),latestVersion:21});await h.settle();assert.equal(nodes(h.tree).find(n=>n.type==='textarea')?.props.value,'Continue writing');h.click('Export working copy');assert.equal(h.copies[0].state.baseVersion,21);assert.match(words(h.tree),/Saved history · 21 loaded/);
 }finally{h.dispose();}
});

test('uncoded 409 retires save; coded version conflict and uncertain failure retain exportable edits',async()=>{
 for(const [reply,status,retired] of [[{code:'version-conflict',error:'race'},409,false],[{error:'account changed'},409,true],[{error:'temporarily unavailable'},503,false]] as const){
  const h=harness();try{h.flush();h.open();h.answer(0,page(context()));await h.settle();h.note('Retain this note');h.save();h.answer(1,reply,status);await h.settle();h.click('Export working copy');assert.equal(h.copies[0].draft.notes,'Retain this note');assert.equal(h.copies[0].state.saveUncertain,true);assert.equal(h.button('Save private draft').props.disabled,true);if(retired)assert.match(words(h.tree),/Saving is retired/);}finally{h.dispose();}
 }
});

test('close, context switch and unmount retire stale responses without replacing owned notes',async()=>{
 const h=harness();try{h.flush();h.open();h.open(false);h.answer(0,page(context()));await h.settle();assert.equal(h.requests.length,1);h.open();h.answer(1,page(context()));await h.settle();h.note('Owned note');const staleRefresh=h.button('Refresh saved history').props.onClick,staleExport=h.button('Export working copy').props.onClick;const next=copy(context());next.teachingRevision='e'.repeat(64);h.setContext(contract.parseRegionalReferenceDraftContext(next));staleRefresh();h.flush();assert.equal(h.requests.length,2);assert.match(words(h.tree),/previous notes are held read-only/i);h.click('Export working copy');assert.equal(h.copies[0].draft.notes,'Owned note');assert.equal(h.copies[0].context.teachingRevision,'c'.repeat(64));h.click('Discard edits…');h.click('Confirm discard');staleExport();assert.equal(h.copies.length,1);h.dispose();}catch(error){h.dispose();throw error;}
});

test('context switch during GET or POST retires callbacks and permits explicit old-copy discard',async()=>{
 for(const duringSave of [false,true]){
  const h=harness();try{
   h.flush();h.open();
   if(duringSave){h.answer(0,page(context()));await h.settle();h.note('Pending save note');h.save();}
   const pending=duringSave?1:0;
   const next=copy(context());next.teachingRevision='e'.repeat(64);h.setContext(contract.parseRegionalReferenceDraftContext(next));
   assert.equal(h.button('Discard edits…').props.disabled,false,'context transition must release busy');
   h.click('Export working copy');assert.equal(h.copies[0].draft.notes,duringSave?'Pending save note':'');
   if(duringSave)assert.equal(h.copies[0].state.saveUncertain,true);
   h.click('Discard edits…');h.click('Confirm discard');
   h.answer(pending,duringSave?{review:saved(context(),1,{...contract.blankRegionalReferenceDraft(),notes:'Pending save note'})}:page(context()),duringSave?201:200);
   await h.settle();assert.equal(words(h.tree).includes('Pending save note'),false);h.open();assert.equal(h.requests.length,pending+2);
  }finally{h.dispose();}
 }
});

test('version conflict cannot rebase against old history before fresh successful GET',async()=>{
 const h=harness();try{
  h.flush();h.open();h.answer(0,page(context(),[saved(context(),1)]));await h.settle();h.note('Version conflict note');h.save();h.answer(1,{code:'version-conflict',error:'race'},409);await h.settle();
  assert.equal(h.button('Keep my edits against latest version 1').props.disabled,true,'old history is not comparison proof');
  h.click('Refresh saved history');h.answer(2,page(context(),[saved(context(),2)]));await h.settle();
  h.click('Keep my edits against latest version 2');h.save();assert.equal(JSON.parse(h.requests[3].init.body).expectedVersion,2);
 }finally{h.dispose();}
});

test('captured use-latest callback cannot clear uncertain state after context changes',async()=>{
 const h=harness();try{
  h.flush();h.open();h.answer(0,page(context()));await h.settle();h.save();h.answer(1,{code:'version-conflict',error:'race'},409);await h.settle();
  const stale=h.button('Use latest history without edits').props.onClick;
  const next=copy(context());next.teachingRevision='e'.repeat(64);h.setContext(contract.parseRegionalReferenceDraftContext(next));stale();h.flush();
  h.click('Export working copy');assert.equal(h.copies[0].state.saveUncertain,true);assert.equal(h.copies[0].context.teachingRevision,'c'.repeat(64));
 }finally{h.dispose();}
});

test('discard after an unconfirmed save does not resolve outcome or reuse old version',async()=>{
 const h=harness();try{
  h.flush();h.open();h.answer(0,page(context()));await h.settle();h.note('May have been saved');h.save();h.answer(1,{error:'temporarily unavailable'},503);await h.settle();
  h.click('Discard edits…');h.click('Confirm discard');h.click('Export working copy');
  assert.equal(h.copies[0].draft.notes,'');assert.equal(h.copies[0].state.saveUncertain,true);assert.equal(h.button('Save private draft').props.disabled,true);
  h.click('Refresh saved history');h.answer(2,page(context(),[saved(context(),1,{...contract.blankRegionalReferenceDraft(),notes:'May have been saved'})]));await h.settle();
  assert.equal(h.button('Save private draft').props.disabled,true);
  h.click('Use latest history without edits');assert.equal(h.button('Save private draft').props.disabled,false);
 }finally{h.dispose();}
});

test('captured load-saved handler cannot replace the base after a newer clean refresh',async()=>{
 const h=harness();try{
  h.flush();h.open();h.answer(0,page(context(),[saved(context(),1)]));await h.settle();
  const staleLoad=h.button('Load saved version 1').props.onClick;
  h.click('Refresh saved history');h.answer(1,page(context(),[saved(context(),2)]));await h.settle();
  staleLoad();h.flush();h.click('Export working copy');
  assert.equal(h.copies[0].state.baseVersion,1);assert.equal(h.button('Save private draft').props.disabled,true);
 }finally{h.dispose();}
});

test('captured discard confirmation cannot destroy notes after source change or close and reopen',async()=>{
 for(const transition of ['source','close','edit'] as const){
  const h=harness();try{
   h.flush();h.open();h.answer(0,page(context()));await h.settle();h.note('Keep these exact notes');h.click('Discard edits…');
   const stale=h.button('Confirm discard').props.onClick;
   if(transition==='source'){const next=copy(context());next.teachingRevision='e'.repeat(64);h.setContext(contract.parseRegionalReferenceDraftContext(next));}
   if(transition==='close'){h.open(false);h.open();}
   if(transition==='edit')h.note('Edited after prompt');
   stale();h.flush();h.click('Export working copy');
   assert.equal(h.copies[0].draft.notes,transition==='edit'?'Edited after prompt':'Keep these exact notes');
   assert.equal(h.copies[0].context.teachingRevision,'c'.repeat(64));
  }finally{h.dispose();}
 }
});

test('StrictMode effect replay retires pending read and save, releasing busy while preserving save uncertainty',async()=>{
 for(const duringSave of [false,true]){
  const h=harness();try{
   h.flush();h.open();if(duringSave){h.answer(0,page(context()));await h.settle();h.note('Potentially committed');h.save();}
   const pending=duringSave?1:0;h.replayEffects();
   assert.equal(h.button('Refresh saved history').props.disabled,false,'replay must release busy');
   h.click('Export working copy');assert.equal(h.copies[0].state.saveUncertain,duringSave);
   h.answer(pending,duringSave?{review:saved(context(),1,{...contract.blankRegionalReferenceDraft(),notes:'Potentially committed'})}:page(context()),duringSave?201:200);
   await h.settle();assert.equal(h.button('Refresh saved history').props.disabled,false);
   h.click('Refresh saved history');assert.equal(h.requests.length,pending+2);
  }finally{h.dispose();}
 }
});

test('abandoned speculative context render cannot retire committed request or consume old confirmation',async()=>{
 const h=harness();try{
  h.flush();h.open();h.answer(0,page(context()));await h.settle();h.note('Committed note');h.click('Discard edits…');
  const next=copy(context());next.teachingRevision='e'.repeat(64);const speculative=h.speculate(contract.parseRegionalReferenceDraftContext(next));
  const speculativeConfirm=nodes(speculative).find(n=>n.type==='button'&&words(n)==='Confirm discard');assert(speculativeConfirm);speculativeConfirm.props.onClick();
  h.flush();h.click('Export working copy');assert.equal(h.copies[0].draft.notes,'Committed note');
  assert.equal(h.button('Confirm discard').props.disabled||false,false,'committed prompt remains valid');
  h.click('Keep notes');h.click('Refresh saved history');h.answer(1,page(context()));await h.settle();
  assert.equal(h.button('Refresh saved history').props.disabled,false);
 }finally{h.dispose();}
});

test('pending draft autosave is cancelled by close, source change, and unmount',async()=>{
 for(const transition of ['close','source','unmount'] as const){
  const h=harness();try{
   h.flush();h.open();h.answer(0,page(context()));await h.settle();h.note('Unsent draft note');
   assert.equal(h.pendingAutosave(),1,`${transition}: one draft debounce pending`);
   if(transition==='close')h.open(false);
   if(transition==='source'){const next=copy(context());next.teachingRevision='e'.repeat(64);h.setContext(contract.parseRegionalReferenceDraftContext(next));}
   if(transition==='unmount')h.dispose();
   assert.equal(h.pendingAutosave(),0,`${transition}: debounce cancelled`);
   h.fireAutosave();assert.equal(h.requests.length,1,`${transition}: no stale POST`);
  }finally{if(transition!=='unmount')h.dispose();}
 }
});

test('automatic save records only a private draft and never approves considerations',async()=>{
 const h=harness();try{
  h.flush();h.open();h.answer(0,page(context()));await h.settle();h.note('Synthetic correction for draft only');
  const considerations=nodes(h.tree).find(n=>n.type?.name==='NotesConsiderations');assert(considerations);
  assert.deepEqual(considerations.props.criteria,contract.regionalReferenceDraftChecks);
  assert.equal(considerations.props.checked,false);
  considerations.props.onChange(true);h.flush();
  assert.equal(h.pendingAutosave(),1);h.fireAutosave();assert.equal(h.requests.length,2);
  const submitted=JSON.parse(h.requests[1].init.body);
  assert.equal(submitted.draft.status,'draft');assert.equal(submitted.draft.attested,false);
  assert.deepEqual(submitted.draft.checks,Object.fromEntries(contract.regionalReferenceDraftChecks.map(check=>[check.id,true])));
  assert.equal(submitted.expectedVersion,0);
  h.answer(1,{review:saved(context(),1,submitted.draft)},201);await h.settle();
  assert.equal(h.pendingAutosave(),0);assert.match(words(h.tree),/Saved private version 1/);
  assert.match(words(h.tree),/do not approve teaching, clinical use, publication/);
 }finally{h.dispose();}
});
