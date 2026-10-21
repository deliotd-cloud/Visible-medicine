import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import * as navigationGuard from '../lib/clinical-review-navigation-guard.ts';
import {createRequire} from 'node:module';
import ts from 'typescript';
import * as contract from '../lib/regional-guide-review-contract.ts';
import {loadReviewUiHelpers} from './review-ui-harness.ts';

const require=createRequire(import.meta.url);
const context=(revision='a'.repeat(64))=>contract.parseRegionalGuideReviewContext({schema:'vm-regional-guide-review-context-1',region:'knee',guideId:'posterior-knee',guideRevision:'posterior-20261014-v1',contentRevision:revision,checklistVersion:'regional-guide-teaching-v1',approvalScope:'guide-teaching-only',patientRegistration:false,publicationApproval:false});
const decision=(status:contract.RegionalGuideDecision['status']='in-progress',notes='')=>({...contract.blankRegionalGuideDecision(),status,notes});
const saved=(ctx=context(),version=1,review=decision())=>({eventSchema:'vm-regional-guide-teaching-review-event-1' as const,context:ctx,version,savedAt:'2026-10-14T12:00:00.000Z',decision:review});
const page=(ctx=context(),events:ReturnType<typeof saved>[]=[],nextBefore:number|null=null)=>({context:ctx,history:events,latestVersion:events[0]?.version??0,nextBefore,scope:'private-to-signed-in-account-and-institution'});
type Node={type:any;props:Record<string,any>};
const nodes=(value:any):Node[]=>Array.isArray(value)?value.flatMap(nodes):value&&typeof value==='object'&&'type'in value&&'props'in value?[value,...nodes(value.props.children)]:[];
const words=(value:any):string=>Array.isArray(value)?value.map(words).join(''):value&&typeof value==='object'&&'props'in value?words(value.props.children):typeof value==='string'||typeof value==='number'?String(value):'';

function harness(initial=context(),initialRetired=false){
 const source=readFileSync(new URL('../components/RegionalGuideReviewNotes.tsx',import.meta.url),'utf8');
 const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const slots:any[]=[],effects=new Map<number,{deps:unknown[];create:()=>void|(()=>void);cleanup?:()=>void}>(),requests:{url:string;init:any;resolve:(v:any)=>void}[]=[],downloads:string[]=[];
 let ctx=initial,externallyRetired=initialRetired,cursor=0,pending:Array<()=>void>=[],changed=true,tree:Node,alive=true;
 const equal=(a:unknown[]|undefined,b:unknown[])=>!!a&&a.length===b.length&&a.every((v,i)=>Object.is(v,b[i]));
 const effect=(create:()=>void|(()=>void),deps:unknown[])=>{const i=cursor++,old=effects.get(i);if(!equal(old?.deps,deps))pending.push(()=>{old?.cleanup?.();const cleanup=create();effects.set(i,{deps,create,cleanup:typeof cleanup==='function'?cleanup:undefined});});};
 const hooks={useState(initial:any){const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return [slots[i],(next:any)=>{assert(alive,'no update after unmount');const value=typeof next==='function'?next(slots[i]):next;if(!Object.is(value,slots[i])){slots[i]=value;changed=true;}}];},useRef(initial:any){const i=cursor++;if(!(i in slots))slots[i]={current:initial};return slots[i];},useEffect:effect,useLayoutEffect:effect};
 const jsx=(type:any,props:any)=>({type,props});
 const helpers=loadReviewUiHelpers({jsx,jsxs:jsx,Fragment:Symbol('Fragment')});
 const mod={exports:{} as {RegionalGuideReviewNotes:(props:{context:ReturnType<typeof context>;externallyRetired?:boolean})=>Node}};
 const fetch=(url:string,init:any={})=>new Promise(resolve=>requests.push({url,init,resolve}));
 const load=(id:string)=>id==='../lib/clinical-review-navigation-guard'?navigationGuard:id==='react'?hooks:id==='react/jsx-runtime'?{jsx,jsxs:jsx,Fragment:Symbol('Fragment')}:id==='../lib/regional-guide-review-contract'?contract:id==='../lib/clinical-review-fetch'?{clinicalReviewFetch:fetch}:id==='./GroupedReviewConfirmation'?helpers.grouped:id==='../lib/review-draft-autosave'?helpers.autosave:id.endsWith('.css')?{}:require(id);
 new Function('require','module','exports',compiled)(load,mod,mod.exports);
 const oldNavigationDocument=Object.getOwnPropertyDescriptor(globalThis,'document');
 const navigationListeners=new Set<Function>();
 const navigationDocument={
  defaultView:{location:{href:'https://visiblemedicine.test/atlas/head-learning?mode=review'},confirm(){throw Error('No synthetic navigation was dispatched');}},
  addEventListener(type:string,listener:Function,capture:boolean){assert.equal(type,'click');assert.equal(capture,true);assert(!navigationListeners.has(listener));navigationListeners.add(listener);},
  removeEventListener(type:string,listener:Function,capture:boolean){assert.equal(type,'click');assert.equal(capture,true);assert(navigationListeners.delete(listener),'registered navigation listener removed');},
 };
 const oldWindow=(globalThis as any).window,oldDocument=(globalThis as any).document,oldCreate=URL.createObjectURL,oldRevoke=URL.revokeObjectURL;
 (globalThis as any).window={addEventListener(){},removeEventListener(){}};
 (globalThis as any).document={...navigationDocument,body:{appendChild(){}},createElement(){return {href:'',download:'',click(){downloads.push(this.download);},remove(){}};}};
 URL.createObjectURL=()=> 'blob:private';URL.revokeObjectURL=()=>{};
 function flush(){let count=0;do{assert(++count<35,'effects settle');changed=false;cursor=0;pending=[];tree=mod.exports.RegionalGuideReviewNotes({context:ctx,externallyRetired});for(const run of pending)run();}while(changed);return tree!;}
 async function settle(){for(let i=0;i<8;i++)await Promise.resolve();return flush();}
 function button(label:string){const hit=nodes(tree).find(n=>n.type==='button'&&words(n)===label);assert(hit,`button ${label}`);return hit!;}
 function click(label:string){const hit=button(label);assert(!hit.props.disabled,`${label} enabled`);hit.props.onClick();flush();}
 function open(value=true){tree.props.onToggle({currentTarget:{open:value}});flush();}
 function note(value:string){const field=nodes(tree).find(n=>n.type==='textarea');assert(field);field.props.onChange({target:{value}});flush();}
 function select(value:string){const field=nodes(tree).find(n=>n.type==='select');assert(field);field.props.onChange({target:{value}});flush();}
 function check(index:number,value=true){const fields=nodes(tree).filter(n=>n.type==='input'&&n.props.type==='checkbox');assert(fields[index],`check ${index}`);fields[index].props.onChange({target:{checked:value}});flush();}
 function answer(i:number,value:any,status=200){const req=requests[i];assert(req,`request ${i}`);req.resolve({ok:status>=200&&status<300,status,json:async()=>value});}
 function save(){const form=nodes(tree).find(n=>n.type==='form');assert(form);form.props.onSubmit({preventDefault(){}});flush();}
 function dispose(){for(const effect of effects.values())effect.cleanup?.();assert.equal(helpers.pendingAutosave(),0,'unmount cancels debounce');alive=false;(globalThis as any).window=oldWindow;(globalThis as any).document=oldDocument;assert.equal(navigationListeners.size,0,'navigation listener cleaned up on unmount');if(oldNavigationDocument)Object.defineProperty(globalThis,'document',oldNavigationDocument);else delete (globalThis as any).document;URL.createObjectURL=oldCreate;URL.revokeObjectURL=oldRevoke;}
 return {requests,downloads,flush,settle,button,click,open,note,select,check,answer,save,dispose,fireAutosave:helpers.fireAutosave,pendingAutosave:helpers.pendingAutosave,setContext(value:ReturnType<typeof context>){ctx=value;flush();},setExternallyRetired(value:boolean,nextContext?:ReturnType<typeof context>){externallyRetired=value;if(nextContext)ctx=nextContext;flush();},get tree(){return tree!;}};
}

test('closed form does not write; exact read and explicit save validate the returned event',async()=>{
 const h=harness();try{h.flush();assert.equal(h.requests.length,0);h.open();assert.match(h.requests[0].url,/region=knee&guide=posterior-knee&revision=a{64}$/);h.answer(0,page());await h.settle();assert.equal(h.requests.length,1);
  h.note('Private reviewer note');h.save();assert.equal(h.requests[1].init.method,'POST');assert.equal(JSON.parse(h.requests[1].init.body).expectedVersion,0);assert.deepEqual(JSON.parse(h.requests[1].init.body).decision,decision('in-progress','Private reviewer note'));
  h.answer(1,{review:saved(context(),1,decision('in-progress','Private reviewer note'))},201);await h.settle();assert.match(words(h.tree),/Private teaching review version 1 recorded/);assert.equal(h.requests.length,2);
 }finally{h.dispose();}
});

test('approval requires all four checks and explicit attestation; scope remains prominent',async()=>{
 const h=harness();try{h.flush();h.open();h.answer(0,page());await h.settle();h.select('approved');assert.match(words(h.tree),/does not approve native MRI extents, a 3D match, masks, patient registration, publication, or learner release/i);
  for(const criterion of contract.regionalGuideReviewChecks)assert.ok(words(h.tree).includes(criterion.label),criterion.id);
  h.save();assert.equal(h.requests.length,1);assert.match(words(h.tree),/requires all checks/i);
  h.check(0);h.note('Revised after attestation');h.save();assert.equal(h.requests.length,1,'wording edit clears attestation');h.check(0);h.save();assert.equal(h.requests.length,2);
  const approved={...decision('approved','Revised after attestation'),checks:{facts:true,scope:true,sources:true,navigation:true},attested:true};assert.deepEqual(JSON.parse(h.requests[1].init.body).decision,approved);
  h.answer(1,{review:saved(context(),1,approved)},201);await h.settle();assert.match(words(h.tree),/Approval recorded for this exact teaching wording only/);
 }finally{h.dispose();}
});

test('dirty refresh retains working copy and requires explicit compare before rebase',async()=>{
 const h=harness();try{h.flush();h.open();h.answer(0,page(context(),[saved(context(),1)]));await h.settle();h.note('Keep my precise correction');h.click('Refresh saved history');h.answer(1,page(context(),[saved(context(),2)]));await h.settle();assert.equal(nodes(h.tree).find(n=>n.type==='textarea')?.props.value,'Keep my precise correction');assert.equal(h.button('Save private review').props.disabled,true);
  h.click('Keep my edits against latest version 2');h.save();assert.equal(JSON.parse(h.requests[2].init.body).expectedVersion,2);
 }finally{h.dispose();}
});

test('version conflict never retries automatically and demands fresh comparison',async()=>{
 const h=harness();try{h.flush();h.open();h.answer(0,page(context(),[saved(context(),1)]));await h.settle();h.note('Conflict copy');h.save();h.answer(1,{code:'version-conflict'},409);await h.settle();assert.equal(h.requests.length,2);assert.equal(h.button('Keep my edits against latest version 1').props.disabled,true);
  h.click('Refresh saved history');h.answer(2,page(context(),[saved(context(),2)]));await h.settle();h.click('Keep my edits against latest version 2');h.save();assert.equal(JSON.parse(h.requests[3].init.body).expectedVersion,2);
 }finally{h.dispose();}
});

test('source or account retirement preserves private local export and blocks saves',async()=>{
 for(const duringRead of [true,false]){const h=harness();try{h.flush();h.open();if(duringRead){h.answer(0,{error:'source changed'},409);await h.settle();}else{h.answer(0,page());await h.settle();h.note('Retain locally');h.save();h.answer(1,{error:'account changed'},409);await h.settle();}
  assert.match(words(h.tree),/Saving is retired/i);h.click('Export notes only (.txt)');assert.equal(h.downloads.length,1);assert.match(words(h.tree),/Status, checks, attestation and version are not included/);assert.equal(h.button('Refresh saved history').props.disabled,true);if(!duringRead)assert.equal(h.button('Save private review').props.disabled,true);
 }finally{h.dispose();}}
});

test('context change and unmount abort pending operations and ignore late save',async()=>{
 const h=harness();try{h.flush();h.open();h.answer(0,page());await h.settle();h.note('Retain original revision');h.save();const pending=h.requests[1];h.setContext(context('b'.repeat(64)));assert.equal(pending.init.signal.aborted,true);h.answer(1,{review:saved(context(),1,decision('in-progress','Retain original revision'))},201);await h.settle();assert.match(words(h.tree),/previous notes remain read-only/i);assert.equal(h.requests.length,2);h.click('Export notes only (.txt)');assert.equal(h.downloads.length,1);h.dispose();}catch(error){h.dispose();throw error;}
 const other=harness();other.flush();other.open();const pending=other.requests[0];other.dispose();assert.equal(pending.init.signal.aborted,true);other.answer(0,page());await Promise.resolve();
});

test('stale prior revision approval is marked for re-review; older pages deduplicate',async()=>{
 const h=harness();try{const prior=context('b'.repeat(64)),approved={...decision('approved'),checks:{facts:true,scope:true,sources:true,navigation:true},attested:true};h.flush();h.open();const first=Array.from({length:20},(_,i)=>saved(i===0?context():prior,21-i,i===0?decision():approved));h.answer(0,page(context(),first,2));await h.settle();assert.match(words(h.tree),/Prior revision — needs re-review for current wording/);h.note('Current edit');h.click('Load older history');assert.equal(h.requests[1].init.headers['X-Regional-Guide-Before'],'2');h.answer(1,{...page(context(),[saved(prior,1,approved)]),latestVersion:21});await h.settle();assert.equal(nodes(h.tree).find(n=>n.type==='textarea')?.props.value,'Current edit');assert.match(words(h.tree),/Saved history · 21 loaded/);
 }finally{h.dispose();}
});

test('use latest loads exact saved decision without carrying attestation, or starts fresh for old revision',async()=>{
 const approved={...decision('approved','Saved exact wording'),checks:{facts:true,scope:true,sources:true,navigation:true},attested:true};
 for(const previousRevision of [false,true]){const h=harness();try{
  h.flush();h.open();h.answer(0,page(context(),[saved(context(),1)]));await h.settle();h.click('Refresh saved history');
  h.answer(1,page(context(),[saved(previousRevision?context('b'.repeat(64)):context(),2,approved)]));await h.settle();
  h.click('Use latest history without edits');const field=nodes(h.tree).find(n=>n.type==='textarea');assert(field);
  if(previousRevision){assert.equal(field.props.value,'');assert.equal(nodes(h.tree).find(n=>n.type==='select')?.props.value,'in-progress');assert.match(words(h.tree),/fresh review is required/i);}
  else{assert.equal(field.props.value,'Saved exact wording');assert.equal(nodes(h.tree).find(n=>n.type==='select')?.props.value,'approved');assert.equal(nodes(h.tree).filter(n=>n.type==='input'&&n.props.type==='checkbox')[0].props.checked,false);h.save();assert.equal(h.requests.length,2,'old attestation cannot record another approval');}
  assert.equal(h.button(previousRevision?'Save private review':'Record teaching approval').props.disabled,false);
 }finally{h.dispose();}}
});

test('initial saved history offers direct restore only when clean and never carries old approval',async()=>{
 const approved={...decision('approved','Previously reviewed wording'),checks:{facts:true,scope:true,sources:true,navigation:true},attested:true};
 const empty=harness();try{empty.flush();empty.open();empty.answer(0,page());await empty.settle();assert.equal(nodes(empty.tree).some(n=>n.type==='button'&&words(n)==='Restore latest saved review'),false);}finally{empty.dispose();}
 for(const previousRevision of [false,true]){const h=harness();try{
  h.flush();h.open();h.answer(0,page(context(),[saved(previousRevision?context('b'.repeat(64)):context(),1,approved)]));await h.settle();
  assert.equal(nodes(h.tree).find(n=>n.type==='textarea')?.props.value,'','initial load leaves the form untouched');
  h.click('Restore latest saved review');
  assert.equal(nodes(h.tree).find(n=>n.type==='textarea')?.props.value,previousRevision?'':'Previously reviewed wording');
  assert.equal(nodes(h.tree).find(n=>n.type==='select')?.props.value,previousRevision?'in-progress':'approved');
  if(previousRevision)assert.match(words(h.tree),/fresh review is required/i);
  else{assert.equal(nodes(h.tree).filter(n=>n.type==='input'&&n.props.type==='checkbox')[0].props.checked,false);h.save();assert.equal(h.requests.length,1,'restored approval still needs fresh attestation');}
  h.note('New unsaved edit');assert.equal(nodes(h.tree).some(n=>n.type==='button'&&words(n)==='Restore latest saved review'),false,'dirty editor hides restore');
 }finally{h.dispose();}}
});

test('externally retired initial visit opens for export but never reads or saves',async()=>{
 const h=harness(context(),true);try{h.flush();h.open();assert.equal(h.requests.length,0);assert.equal(nodes(h.tree).find(n=>n.type==='fieldset')?.props.disabled,true);h.save();assert.equal(h.requests.length,0);h.click('Export notes only (.txt)');assert.equal(h.downloads.length,1);assert.equal(h.button('Refresh saved history').props.disabled,true);h.setExternallyRetired(false);h.open(false);h.open();assert.equal(h.requests.length,0,'retirement remains latched for the page');}finally{h.dispose();}
});

test('external retirement aborts pending read and dirty save while retaining copy and blocking old callbacks',async()=>{
 for(const duringSave of [false,true]){const h=harness();try{
  h.flush();h.open();if(duringSave){h.answer(0,page());await h.settle();h.note('Retain this private review');h.save();}
  const pending=duringSave?1:0,oldToggle=h.tree.props.onToggle,oldForm=nodes(h.tree).find(n=>n.type==='form')?.props.onSubmit,oldRefresh=h.button('Refresh saved history').props.onClick;
  h.setExternallyRetired(true,context('b'.repeat(64)));assert.equal(h.requests[pending].init.signal.aborted,true);
  assert.equal(nodes(h.tree).find(n=>n.type==='textarea')?.props.value,duringSave?'Retain this private review':'');
  if(duringSave)assert.match(words(h.tree),/save outcome is unconfirmed/i);
  h.answer(pending,duringSave?{review:saved(context(),1,decision('in-progress','Retain this private review'))}:page(),duringSave?201:200);await h.settle();
  oldToggle({currentTarget:{open:true}});oldForm?.({preventDefault(){}});oldRefresh();h.flush();assert.equal(h.requests.length,pending+1,'old callbacks cannot reopen network work');
  h.click('Export notes only (.txt)');assert.equal(h.downloads.length,1);h.click('Discard working copy');h.open();assert.equal(h.requests.length,pending+1,'discard does not bypass retirement');
 }finally{h.dispose();}}
});

test('in-progress edits debounce one private save for the exact source and version',async()=>{
 const h=harness();try{
  h.flush();h.open();h.answer(0,page());await h.settle();
  h.note('First working note');assert.equal(h.pendingAutosave(),1);assert.equal(h.requests.length,1);
  h.note('Revised working note');assert.equal(h.pendingAutosave(),1,'editing restarts the debounce');
  h.fireAutosave();h.flush();assert.equal(h.requests.length,2);assert.equal(h.pendingAutosave(),0);
  assert.deepEqual(JSON.parse(h.requests[1].init.body),{context:context(),expectedVersion:0,decision:decision('in-progress','Revised working note')});
  h.answer(1,{review:saved(context(),1,decision('in-progress','Revised working note'))},201);await h.settle();
  assert.equal(h.pendingAutosave(),0);assert.equal(h.requests.length,2);
 }finally{h.dispose();}
});

test('autosave excludes approval, correction requests, and unconfirmed outcomes',async()=>{
 for(const status of ['approved','changes-required'] as const){const h=harness();try{
  h.flush();h.open();h.answer(0,page());await h.settle();h.note('Working note');h.select(status);
  assert.equal(h.pendingAutosave(),0);h.fireAutosave();assert.equal(h.requests.length,1,`${status} is never autosaved`);
 }finally{h.dispose();}}
 const h=harness();try{
  h.flush();h.open();h.answer(0,page());await h.settle();h.note('Retain after uncertain response');h.fireAutosave();h.flush();
  h.answer(1,{error:'Outcome unknown'},500);await h.settle();assert.equal(h.pendingAutosave(),0);
  h.fireAutosave();assert.equal(h.requests.length,2,'an uncertain save never retries');
 }finally{h.dispose();}
});

test('manual save, refresh, discard, close, context change, and retirement cancel pending autosave',async()=>{
 for(const action of ['manual','refresh','discard','close','context','retire'] as const){const h=harness();try{
  h.flush();h.open();h.answer(0,page());await h.settle();h.note('Unsaved exact review');assert.equal(h.pendingAutosave(),1);
  if(action==='manual')h.save();else if(action==='refresh')h.click('Refresh saved history');else if(action==='discard')h.click('Discard working copy');else if(action==='close')h.open(false);else if(action==='context')h.setContext(context('b'.repeat(64)));else h.setExternallyRetired(true);
  assert.equal(h.pendingAutosave(),0,`${action} cancels debounce`);h.fireAutosave();assert.equal(h.requests.length,action==='manual'||action==='refresh'?2:1);
 }finally{h.dispose();}}
});
