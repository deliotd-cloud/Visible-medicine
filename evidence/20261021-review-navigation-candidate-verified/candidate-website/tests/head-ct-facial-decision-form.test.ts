import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import * as navigationGuard from '../lib/clinical-review-navigation-guard.ts';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {loadReviewUiHelpers} from './review-ui-harness.ts';
import type {FacialDecisionContext} from '../lib/head-ct-facial-decision-contract.ts';
const require=createRequire(import.meta.url),at='2026-10-09T12:34:56.000Z';
const websiteRequire=createRequire(process.env.VM_WEBSITE_PACKAGE??new URL('../package.json',import.meta.url));
const ts=websiteRequire('typescript') as typeof import('typescript');
const sourceRoot=process.env.VM_WEBSITE_SOURCE_ROOT??fileURLToPath(new URL('..',import.meta.url));
const contractSource=process.env.VM_FACIAL_CONTRACT_CANDIDATE??sourceRoot+'/lib/head-ct-facial-decision-contract.ts';
function evaluate(path:string,dependencies:Record<string,unknown>={}):any{
  const compiled=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const module={exports:{} as any};
  new Function('require','module','exports',compiled)((id:string)=>dependencies[id]??(id.endsWith('.css')?{}:websiteRequire(id)),module,module.exports);
  return module.exports;
}
const contract=evaluate(contractSource,{
  './head-ct-facial-comparison-review.ts':{CT_FACIAL_COMPARISON_CONCEPTS:['bone-left-zygomatic','bone-right-zygomatic','bone-mandible']},
  './head-ct-facial-teaching.ts':{},
  './head-ct-facial-clinical.ts':{},
});
const client=evaluate(sourceRoot+'/lib/head-ct-facial-decision-client.ts',{'./head-ct-facial-decision-contract.ts':contract});
const workingCopy=evaluate(sourceRoot+'/lib/head-ct-facial-working-copy.ts',{'./head-ct-facial-decision-contract.ts':contract});
const current:FacialDecisionContext={
  schema:'vm-ct-facial-decision-context-1',kind:'teaching',catalogScope:'head-ct-facial-teaching',packetId:'head-ct-facial-teaching',
  conceptId:'bone-mandible',headRevision:'a'.repeat(64),comparisonRevision:'b'.repeat(64),packetRevision:'c'.repeat(64),
  checklistVersion:'ct-facial-teaching-review-1',checklist:[
    {id:'facts',label:'Facts checked'},{id:'references',label:'References checked'},
    {id:'exercise',label:'Exercise checked'},{id:'limits',label:'Limits checked'}],
  attestation:'I checked exact educational evidence.',decisionScope:'personal-educational-only',
  patientRegistration:false,clinicalApproval:false,publicationApproval:false
};
const clone=<T>(value:T):T=>JSON.parse(JSON.stringify(value)) as T;
const context=()=>clone(current);
const clinicalContext=():FacialDecisionContext=>({...context(),kind:'clinical',catalogScope:'head-ct-facial-clinical',packetId:'head-ct-facial-clinical',checklistVersion:'ct-facial-clinical-review-1',checklist:[
  {id:'wording',label:'Wording checked'},{id:'scan-attribution',label:'Scan attribution checked'},
  {id:'imaging',label:'Imaging checked'},{id:'bindings',label:'Bindings checked'}]});
function event(ctx=context(),version=1,decision=contract.blankFacialDecision(ctx)){return {eventSchema:'vm-ct-facial-decision-event-1' as const,context:ctx,version,savedAt:at,decision};}
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
  const source=readFileSync(new URL('../components/HeadCtFacialDecisionForm.tsx',import.meta.url),'utf8');
  const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const slots:any[]=[],effects=new Map<number,Effect>(),requests:Request[]=[],copies:any[]=[];
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
  const mod={exports:{} as {HeadCtFacialDecisionForm:(props:{context:FacialDecisionContext})=>Node}};
  const fetch=(url:string,init:Record<string,any>={})=>new Promise((resolve,reject)=>requests.push({url,init,resolve,reject}));
const load=(id:string)=>id==='../lib/clinical-review-navigation-guard'?navigationGuard:id==='../lib/head-ct-facial-working-copy'?{...workingCopy,downloadFacialWorkingCopy(value:any){if(downloadFails)throw Error('Download unavailable');copies.push(value);}}:id==='react'?hooks:id==='react/jsx-runtime'?{jsx,jsxs:jsx,Fragment:Symbol('Fragment')}:id==='../lib/head-ct-facial-decision-contract'?contract:id==='../lib/head-ct-facial-decision-client'?client:id==='../lib/clinical-review-fetch'?{clinicalReviewFetch:fetch,getClinicalReviewContext:()=>null}:id==='./GroupedReviewConfirmation'?ui.grouped:id==='../lib/review-draft-autosave'?ui.autosave:id.endsWith('.css')?{}:require(id);
  new Function('require','module','exports',compiled)(load,mod,mod.exports);
 const oldNavigationDocument=Object.getOwnPropertyDescriptor(globalThis,'document');
 const navigationListeners=new Set<Function>();
 const navigationDocument={
  defaultView:{location:{href:'https://visiblemedicine.test/atlas/head-learning?mode=review'},confirm(){throw Error('No synthetic navigation was dispatched');}},
  addEventListener(type:string,listener:Function,capture:boolean){assert.equal(type,'click');assert.equal(capture,true);assert(!navigationListeners.has(listener));navigationListeners.add(listener);},
  removeEventListener(type:string,listener:Function,capture:boolean){assert.equal(type,'click');assert.equal(capture,true);assert(navigationListeners.delete(listener),'registered navigation listener removed');},
 };
 (globalThis as any).document=navigationDocument;
  const oldWindow=(globalThis as any).window;
  (globalThis as any).window={addEventListener(){},removeEventListener(){}};
  function flush(){let passes=0;do{assert(++passes<30,'effects settle');dirty=false;cursor=0;pending=[];tree=mod.exports.HeadCtFacialDecisionForm({context:ctx});for(const effect of pending)effect();}while(dirty);return tree!;}
  async function settle(){for(let i=0;i<8;i++)await Promise.resolve();return flush();}
  function button(label:string){const hit=nodes(tree).find(node=>node.type==='button'&&words(node)===label);assert(hit,`button ${label}`);return hit!;}
  function click(label:string){const hit=button(label);assert.equal(hit.props.disabled||false,false,`${label} enabled`);hit.props.onClick();return flush();}
  function field(label:string){const parent=nodes(tree).find(node=>node.type==='label'&&words(node).includes(label));assert(parent,`label ${label}`);const hit=nodes(parent).find(node=>node.type==='textarea'||node.type==='input'||node.type==='select');assert(hit,`field ${label}`);return hit!;}
  function type(label:string,value:string){field(label).props.onChange({target:{value}});flush();}
  function answer(index:number,body:any,status=200){const req=requests[index];assert(req,`request ${index}`);req.resolve({ok:status>=200&&status<300,status,json:async()=>body});}
return {ctx,requests,copies,failDownload(){downloadFails=true;},flush,settle,button,click,field,type,answer,get tree(){return tree!;},save(){const form=nodes(tree).find(node=>node.type==='form');assert(form);form!.props.onSubmit({preventDefault(){}});flush();},fireAutosave(){ui.fireAutosave();return flush();},pendingAutosave(){return ui.pendingAutosave();},dispose(){for(const effect of effects.values())effect.cleanup?.();alive=false;(globalThis as any).window=oldWindow;assert.equal(navigationListeners.size,0,'navigation listener cleaned up on unmount');if(oldNavigationDocument)Object.defineProperty(globalThis,'document',oldNavigationDocument);else delete (globalThis as any).document;}};
}


test('client binds per-item history, exact next-version decisions and current source',()=>{
  const ctx=context(),draft={...contract.blankFacialDecision(ctx),notes:' Synthetic note '},payload=client.facialSavePayload(ctx,0,draft);
  assert.deepEqual(Object.keys(payload).sort(),['context','decision','expectedVersion']);
  assert.equal(payload.decision.notes,'Synthetic note');
  const saved=event(ctx,1,payload.decision);assert.deepEqual(client.confirmFacialSave({review:saved},ctx,0,draft),saved);
  const neighbour={...ctx,conceptId:'bone-left-zygomatic' as const};
  for(const input of [page(neighbour),page(ctx,[event(neighbour)]),page(ctx,[event(ctx,3),event(ctx,1)]),{...page(ctx),nextBefore:1}])assert.throws(()=>client.parseFacialHistory(input,ctx));
  for(const input of [{review:{...saved,version:2}},{review:{...saved,context:neighbour}},{review:{...saved,decision:{...draft,notes:'Changed'}}}])assert.throws(()=>client.confirmFacialSave(input,ctx,0,draft));
  const old={...ctx,comparisonRevision:'e'.repeat(64)};assert.equal(client.parseFacialHistory(page(ctx,[event(old)]),ctx).history[0].context.comparisonRevision,old.comparisonRevision);
  assert.throws(()=>client.parseFacialHistory(page(ctx,[event(ctx,2)]),ctx,4));
});

test('form keeps incomplete working copies and locks uncertain saves until explicit recovery',async()=>{
  const h=harness();try{
    h.flush();assert.equal(h.requests[0].url,'/api/atlas-review/head-ct-facial-decisions?concept=bone-mandible&kind=teaching');
    h.answer(0,page(h.ctx));await h.settle();
    h.type('Notes / requested corrections',' x\n ');h.type('Status','accepted-educational');h.click('Download working copy');
    assert.equal(h.copies[0].workingDraft.notes,' x\n ');assert.equal(h.copies[0].serverSaveConfirmed,false);
    h.save();assert.equal(h.requests.length,1,'incomplete attestation cannot save');
    h.type('Status','changes-required');h.type('Notes / requested corrections','Synthetic correction request.');h.save();
    h.requests[1].reject(Error('Lost response'));await h.settle();
    assert.equal(h.button('Save private teaching correction request').props.disabled,true);
    h.click('Download working copy');assert.equal(h.copies[1].editState.saveUncertain,true);
    h.click('Refresh saved history');h.answer(2,page(h.ctx));await h.settle();
    assert.equal(h.field('Notes / requested corrections').props.value,'Synthetic correction request.');
    assert.equal(h.button('Save private teaching correction request').props.disabled,true);
    h.click('Discard unsaved edits…');h.click('Confirm discard');h.click('Start fresh draft');
    h.type('Notes / requested corrections','New synthetic note.');h.save();
    const payload=JSON.parse(h.requests[3].init.body);h.answer(3,{review:event(h.ctx,1,payload.decision)},201);await h.settle();
    assert.match(words(h.tree),/Saved private teaching facial educational version 1/);
  }finally{h.dispose();}
});

test('teaching acceptance is explicit, invalidated by edits and never inherited from loaded history',async()=>{
  const h=harness();try{
    const accepted={...contract.blankFacialDecision(h.ctx),status:'accepted-educational' as const,reviewer:'Test reviewer',qualification:'Test radiologist',checks:{facts:true,references:true,exercise:true,limits:true},attested:true};
    h.flush();h.answer(0,page(h.ctx,[event(h.ctx,1,accepted)]));await h.settle();h.click('Load version 1');
    assert.equal(h.field(h.ctx.attestation).props.checked,false);h.save();assert.equal(h.requests.length,1);
    h.field(h.ctx.attestation).props.onChange({target:{checked:true}});h.flush();
    h.type('Notes / requested corrections','Edited evidence.');assert.equal(h.field(h.ctx.attestation).props.checked,false);
    h.field(h.ctx.attestation).props.onChange({target:{checked:true}});h.flush();h.save();
const payload=JSON.parse(h.requests[1].init.body);assert.equal(payload.decision.attested,true);assert.deepEqual(Object.keys(payload.decision.checks).sort(),h.ctx.checklist.map(check=>check.id).sort());assert(h.ctx.checklist.every(check=>payload.decision.checks[check.id]===true));assert.equal(payload.expectedVersion,1);
    h.answer(1,{review:event(h.ctx,2,payload.decision)},201);await h.settle();
    assert.match(words(h.tree),/Educational teaching accepted; no clinical or publication approval/);
    assert.match(words(h.tree),/Superseded version/);
  }finally{h.dispose();}
});

test('changed session/source and mismatched success cannot discard edits or unlock writes',async()=>{
  const h=harness();try{
    h.flush();h.answer(0,page(h.ctx));await h.settle();h.type('Notes / requested corrections','Preserve this note.');h.save();
    h.answer(1,{review:event(h.ctx,2)},201);await h.settle();assert.equal(h.button('Save private teaching draft').props.disabled,true);
    h.click('Refresh saved history');h.answer(2,page({...h.ctx,packetRevision:'e'.repeat(64)}));await h.settle();
    h.click('Refresh saved history');h.answer(3,page(h.ctx));await h.settle();
    assert.equal(h.button('Start fresh draft').props.disabled,true);assert.equal(h.field('Notes / requested corrections').props.value,'Preserve this note.');
    h.click('Download working copy');assert.equal(h.copies[0].editState.reloadRequired,true);
    assert.equal(h.requests.filter(r=>r.init.method==='POST').length,1);
  }finally{h.dispose();}
});

test('late history response cannot update an unmounted form',async()=>{
  const h=harness();h.flush();h.dispose();h.answer(0,page(h.ctx));for(let i=0;i<8;i++)await Promise.resolve();
});

test('clinical orientation uses its own kind, revision family and save label',async()=>{
  const h=harness(clinicalContext());try{
    h.flush();assert.equal(h.requests[0].url,'/api/atlas-review/head-ct-facial-decisions?concept=bone-mandible&kind=clinical');
    h.answer(0,page(h.ctx));await h.settle();
    assert.match(words(h.tree),/Private facial CT clinical-orientation educational review/);
    assert.throws(()=>client.parseFacialHistory(page(context(),[event(context())]),h.ctx),client.FacialSourceChangedError);
    const other=event(context());assert.throws(()=>client.parseFacialHistory(page(h.ctx,[other]),h.ctx));
    h.type('Notes / requested corrections','Clinical synthetic note.');h.save();
    const payload=JSON.parse(h.requests[1].init.body);assert.equal(payload.context.kind,'clinical');assert.equal(payload.expectedVersion,0);
    h.answer(1,{review:event(h.ctx,1,payload.decision)},201);await h.settle();
    assert.match(words(h.tree),/Saved private clinical facial educational version 1/);
    h.click('Download working copy');assert.equal(h.copies[0].kind,'clinical');
  }finally{h.dispose();}
});

test('panel retires a pending source check when kind changes on the same concept',async()=>{
  const source=readFileSync(sourceRoot+'/components/HeadCtFacialDecisionPanel.tsx','utf8');
  const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const slots:any[]=[],effects=new Map<number,{deps:unknown[];cleanup?:()=>void}>(),pending:Array<()=>void>=[],verifications:Array<{resolve:(ctx:any)=>void}>=[];
  let cursor=0,dirty=true,props={manifestRevision:'a'.repeat(64),conceptId:'bone-mandible',label:'Mandible',kind:'teaching' as 'teaching'|'clinical'};
  const hooks={useState(initial:any){const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return [slots[i],(next:any)=>{slots[i]=typeof next==='function'?next(slots[i]):next;dirty=true;}];},
    useRef(initial:any){const i=cursor++;if(!(i in slots))slots[i]={current:initial};return slots[i];},
    useEffect(create:()=>void|(()=>void),deps:unknown[]){const i=cursor++,old=effects.get(i);if(!old||old.deps.some((value,index)=>!Object.is(value,deps[index])))pending.push(()=>{old?.cleanup?.();const cleanup=create();effects.set(i,{deps,cleanup:typeof cleanup==='function'?cleanup:undefined});});}};
  const jsx=(type:unknown,props:Record<string,any>)=>({type,props});
  const Form=()=>null;
  const mod={exports:{} as any};
  new Function('require','module','exports',compiled)((id:string)=>id==='react'?hooks:id==='react/jsx-runtime'?{jsx,jsxs:jsx}:id==='../lib/head-ct-facial-decision-contract'?{
    facialDecisionContext(){return new Promise(resolve=>verifications.push({resolve}));}}:id==='./HeadCtFacialDecisionForm'?{HeadCtFacialDecisionForm:Form}:require(id),mod,mod.exports);
  let tree:any;
  function flush(){let n=0;do{assert(++n<20);dirty=false;cursor=0;pending.length=0;tree=mod.exports.HeadCtFacialDecisionPanel(props);for(const effect of [...pending])effect();}while(dirty);}
  flush();nodes(tree).find(node=>node.type==='button')!.props.onClick();flush();assert.equal(verifications.length,1);
  props={...props,kind:'clinical'};flush();
  verifications[0].resolve(context());for(let i=0;i<8;i++)await Promise.resolve();flush();
  assert.notEqual(tree.type,Form,'old teaching form must not mount');
  nodes(tree).find(node=>node.type==='button')!.props.onClick();flush();assert.equal(verifications.length,2);
  verifications[1].resolve(clinicalContext());for(let i=0;i<8;i++)await Promise.resolve();flush();
  assert.equal(tree.type,Form);
  for(const effect of effects.values())effect.cleanup?.();
});
