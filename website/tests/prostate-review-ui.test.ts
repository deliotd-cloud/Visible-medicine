import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import * as contract from '../lib/prostate-review-contract.ts';
import * as navigationGuard from '../lib/clinical-review-navigation-guard.ts';

const require=createRequire(import.meta.url);
const context=(revision='a'.repeat(64),model='b'.repeat(64))=>contract.prostateReviewContext({revision,modelRevision:model});
const saved=(ctx=context(),version=1,decision=contract.blankProstateDecision())=>({eventSchema:'vm-prostate-zones-review-event-1' as const,context:ctx,version,savedAt:'2026-11-01T12:00:00.000Z',decision});
const page=(ctx=context(),events:ReturnType<typeof saved>[]=[],nextBefore:number|null=null,latestVersion=events[0]?.version??0)=>({context:ctx,history:events,latestVersion,nextBefore,scope:'private-to-signed-in-account-and-institution'});
type Node={type:any;props:Record<string,any>};
const nodes=(value:any):Node[]=>Array.isArray(value)?value.flatMap(nodes):value&&typeof value==='object'&&'type'in value&&'props'in value?[value,...nodes(value.props.children)]:[];
const words=(value:any):string=>Array.isArray(value)?value.map(words).join(''):value&&typeof value==='object'&&'props'in value?words(value.props.children):typeof value==='string'||typeof value==='number'?String(value):'';

function harness(initial=context(),initialRetired=false){
 const source=readFileSync(new URL('../components/ProstateReviewNotes.tsx',import.meta.url),'utf8');
 const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const slots:any[]=[],effects=new Map<number,{deps:unknown[];cleanup?:()=>void}>(),requests:{url:string;init:any;resolve:(v:any)=>void}[]=[],downloads:string[]=[];
 const beforeUnload=new Set<Function>(),clickListeners=new Set<Function>();
 let ctx=initial,externallyRetired=initialRetired,cursor=0,pending:Array<()=>void>=[],changed=true,tree:Node,alive=true;
 const equal=(a:unknown[]|undefined,b:unknown[])=>!!a&&a.length===b.length&&a.every((v,i)=>Object.is(v,b[i]));
 const effect=(create:()=>void|(()=>void),deps:unknown[])=>{const i=cursor++,old=effects.get(i);if(!equal(old?.deps,deps))pending.push(()=>{old?.cleanup?.();const cleanup=create();effects.set(i,{deps,cleanup:typeof cleanup==='function'?cleanup:undefined});});};
 const hooks={useState(initial:any){const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return [slots[i],(next:any)=>{assert(alive,'no update after unmount');const value=typeof next==='function'?next(slots[i]):next;if(!Object.is(value,slots[i])){slots[i]=value;changed=true;}}];},useRef(initial:any){const i=cursor++;if(!(i in slots))slots[i]={current:initial};return slots[i];},useEffect:effect,useLayoutEffect:effect};
 const jsx=(type:any,props:any)=>({type,props});
 const mod={exports:{} as {ProstateReviewNotes:(props:{context:ReturnType<typeof context>;externallyRetired?:boolean})=>Node}};
 const fetch=(url:string,init:any={})=>new Promise(resolve=>requests.push({url,init,resolve}));
 const load=(id:string)=>id==='../lib/clinical-review-navigation-guard'?navigationGuard:id==='react'?hooks:id==='react/jsx-runtime'?{jsx,jsxs:jsx,Fragment:Symbol('Fragment')}:id==='../lib/prostate-review-contract'?contract:id==='../lib/clinical-review-fetch'?{clinicalReviewFetch:fetch}:id.endsWith('.css')?{}:require(id);
 new Function('require','module','exports',compiled)(load,mod,mod.exports);
 const oldDocument=Object.getOwnPropertyDescriptor(globalThis,'document'),oldWindow=Object.getOwnPropertyDescriptor(globalThis,'window'),oldCreate=URL.createObjectURL,oldRevoke=URL.revokeObjectURL;
 (globalThis as any).window={addEventListener(type:string,listener:Function){assert.equal(type,'beforeunload');beforeUnload.add(listener);},removeEventListener(type:string,listener:Function){assert.equal(type,'beforeunload');assert(beforeUnload.delete(listener));}};
 (globalThis as any).document={defaultView:{location:{href:'https://visiblemedicine.test/workspace/atlas-review/prostate?revision='+initial.contentRevision},confirm(){return false;}},addEventListener(type:string,listener:Function,capture:boolean){assert.equal(type,'click');assert.equal(capture,true);clickListeners.add(listener);},removeEventListener(type:string,listener:Function,capture:boolean){assert.equal(type,'click');assert.equal(capture,true);assert(clickListeners.delete(listener));},body:{appendChild(){}},createElement(){return {href:'',download:'',click(){downloads.push(this.download);},remove(){}};}};
 URL.createObjectURL=()=> 'blob:private';URL.revokeObjectURL=()=>{};
 function flush(){let count=0;do{assert(++count<40,'effects settle');changed=false;cursor=0;pending=[];tree=mod.exports.ProstateReviewNotes({context:ctx,externallyRetired});for(const run of pending)run();}while(changed);return tree!;}
 async function settle(){for(let i=0;i<8;i++)await Promise.resolve();return flush();}
 function button(label:string){const hit=nodes(tree).find(n=>n.type==='button'&&words(n)===label);assert(hit,`button ${label}`);return hit!;}
 function click(label:string){const hit=button(label);assert(!hit.props.disabled,`${label} enabled`);hit.props.onClick();flush();}
 function open(value=true){tree.props.onToggle({currentTarget:{open:value}});flush();}
 function note(value:string){const field=nodes(tree).find(n=>n.type==='textarea');assert(field);field.props.onChange({target:{value}});flush();}
 function select(index:number,value:string){const field=nodes(tree).filter(n=>n.type==='select')[index];assert(field);field.props.onChange({target:{value}});flush();}
 function attest(value=true){const field=nodes(tree).find(n=>n.type==='input'&&n.props.type==='checkbox');assert(field);field.props.onChange({target:{checked:value}});flush();}
 function answer(i:number,value:any,status=200){const req=requests[i];assert(req,`request ${i}`);req.resolve({ok:status>=200&&status<300,status,json:async()=>value});}
 function save(){const form=nodes(tree).find(n=>n.type==='form');assert(form);form.props.onSubmit({preventDefault(){}});flush();}
 function leavingClick(){let prevented=0;const anchor={href:'https://visiblemedicine.test/workspace/atlas',target:'',hasAttribute(){return false;}};const event={target:{closest(){return anchor;}},button:0,defaultPrevented:false,metaKey:false,ctrlKey:false,shiftKey:false,altKey:false,preventDefault(){prevented++;},stopPropagation(){},stopImmediatePropagation(){}};for(const listener of clickListeners)listener(event);return prevented;}
 function dispose(){for(const effect of effects.values())effect.cleanup?.();alive=false;assert.equal(clickListeners.size,0,'navigation guard cleaned up');assert.equal(beforeUnload.size,0,'beforeunload cleaned up');if(oldDocument)Object.defineProperty(globalThis,'document',oldDocument);else delete (globalThis as any).document;if(oldWindow)Object.defineProperty(globalThis,'window',oldWindow);else delete (globalThis as any).window;URL.createObjectURL=oldCreate;URL.revokeObjectURL=oldRevoke;}
 return {requests,downloads,flush,settle,button,click,open,note,select,attest,answer,save,leavingClick,dispose,setContext(value:ReturnType<typeof context>){ctx=value;flush();},setExternallyRetired(value:boolean,nextContext?:ReturnType<typeof context>){externallyRetired=value;if(nextContext)ctx=nextContext;flush();},get tree(){return tree!;},get beforeUnloadCount(){return beforeUnload.size;}};
}

test('closed panel has no network or automatic approval write; explicit save uses one grouped decision',async()=>{
 const h=harness();try{h.flush();assert.equal(h.requests.length,0);h.open();assert.match(h.requests[0].url,/revision=a{64}$/);h.answer(0,page());await h.settle();
  h.select(0,'approved');assert.equal(h.requests.length,1);h.save();assert.equal(h.requests.length,1,'approval requires attestation');h.attest();h.save();
  const body=JSON.parse(h.requests[1].init.body);assert.equal(h.requests[1].init.method,'POST');assert.equal(body.expectedVersion,0);assert.deepEqual(body.decision,{geometry:'approved',teaching:'not-reviewed',notes:'',attested:true});
  h.answer(1,{review:saved(context(),1,body.decision)},201);await h.settle();assert.equal(h.requests.length,2);assert.match(words(h.tree),/recorded/i);
 }finally{h.dispose();}
});

test('edits and rebasing clear the one attestation for selected sections',async()=>{
 const h=harness();try{h.flush();h.open();h.answer(0,page());await h.settle();h.select(1,'approved');h.attest();h.note('Teaching wording correction');assert.equal(nodes(h.tree).find(n=>n.type==='input'&&n.props.type==='checkbox')?.props.checked,false);h.save();assert.equal(h.requests.length,1);
  h.attest();h.click('Refresh saved history');h.answer(1,page(context(),[saved(context(),2)]));await h.settle();assert.equal(h.button('Save review').props.disabled,true);h.click('Keep my edits against latest version 2');assert.equal(nodes(h.tree).find(n=>n.type==='input'&&n.props.type==='checkbox')?.props.checked,false);h.save();assert.equal(h.requests.length,2);h.attest();h.save();assert.equal(JSON.parse(h.requests[2].init.body).expectedVersion,2);
 }finally{h.dispose();}
});

test('closing or unmounting aborts late responses; reopening retains working notes',async()=>{
 const h=harness();try{h.flush();h.open();const first=h.requests[0];h.open(false);assert.equal(first.init.signal.aborted,true);h.answer(0,page());await h.settle();assert.equal(h.requests.length,1);h.open();assert.equal(h.requests.length,2);h.answer(1,page());await h.settle();h.note('Keep this correction');h.save();const pending=h.requests[2];h.open(false);assert.equal(pending.init.signal.aborted,true);h.answer(2,{review:saved(context(),1,{...contract.blankProstateDecision(),notes:'Keep this correction'})},201);await h.settle();assert.match(words(h.tree),/save unconfirmed/i);assert.equal(nodes(h.tree).find(n=>n.type==='textarea')?.props.value,'Keep this correction');}finally{h.dispose();}
 const other=harness();other.flush();other.open();const pending=other.requests[0];other.dispose();assert.equal(pending.init.signal.aborted,true);other.answer(0,page());await Promise.resolve();
});

test('source or account retirement keeps private notes exportable and prevents writes',async()=>{
 for(const mode of ['source','account'] as const){const h=harness();try{h.flush();h.open();h.answer(0,page());await h.settle();h.note('Private retained copy');if(mode==='source'){h.click('Refresh saved history');h.answer(1,{error:'source changed'},409);}else{h.save();h.answer(1,{error:'account changed'},403);}await h.settle();assert.match(words(h.tree),/retired/i);assert.equal(nodes(h.tree).find(n=>n.type==='textarea')?.props.value,'Private retained copy');h.click('Export notes only (.txt)');assert.equal(h.downloads.length,1);h.save();assert.equal(h.requests.length,2);}finally{h.dispose();}}
});

test('stale context props retain old copy read only, and external retirement aborts pending work',async()=>{
 const h=harness();try{h.flush();h.open();h.answer(0,page());await h.settle();h.note('Old revision correction');h.save();const pending=h.requests[1];h.setContext(context('c'.repeat(64)));assert.equal(pending.init.signal.aborted,true);h.answer(1,{review:saved(context(),1,{...contract.blankProstateDecision(),notes:'Old revision correction'})},201);await h.settle();assert.match(words(h.tree),/read-only/i);assert.equal(nodes(h.tree).find(n=>n.type==='textarea')?.props.value,'Old revision correction');h.click('Export notes only (.txt)');assert.equal(h.downloads.length,1);h.save();assert.equal(h.requests.length,2);}finally{h.dispose();}
 const other=harness();try{other.flush();other.open();const pending=other.requests[0];other.setExternallyRetired(true);assert.equal(pending.init.signal.aborted,true);other.answer(0,page());await other.settle();assert.match(words(other.tree),/retired/i);assert.equal(other.requests.length,1);}finally{other.dispose();}
});

test('version conflict and mismatched save reply require refresh and explicit comparison',async()=>{
 const h=harness();try{h.flush();h.open();h.answer(0,page(context(),[saved(context(),1)]));await h.settle();h.note('Keep specific edit');h.save();h.answer(1,{code:'version-conflict'},409);await h.settle();assert.equal(h.requests.length,2);assert.equal(h.button('Save review').props.disabled,true);h.click('Refresh saved history');h.answer(2,page(context(),[saved(context(),2)]));await h.settle();h.click('Keep my edits against latest version 2');h.save();assert.equal(JSON.parse(h.requests[3].init.body).expectedVersion,2);h.answer(3,{review:saved(context(),3,{...contract.blankProstateDecision(),notes:'Different reply'})},201);await h.settle();assert.match(words(h.tree),/did not match|unconfirmed/i);assert.equal(h.button('Save review').props.disabled,true);assert.equal(nodes(h.tree).find(n=>n.type==='textarea')?.props.value,'Keep specific edit');}finally{h.dispose();}
});

test('navigation guard covers dirty copy and cleans up after discard and unmount',async()=>{
 const h=harness();try{h.flush();h.open();h.answer(0,page());await h.settle();h.note('Unsaved correction');assert.equal(h.beforeUnloadCount,1);assert.equal(h.leavingClick(),1);h.click('Discard working copy');assert.equal(h.beforeUnloadCount,0);assert.equal(h.leavingClick(),0);}finally{h.dispose();}
});

test('older history uses exact cursor, preserves latest version and working copy',async()=>{
 const h=harness();try{h.flush();h.open();const first=Array.from({length:20},(_,i)=>saved(i===0?context():context('c'.repeat(64)),21-i));h.answer(0,page(context(),first,2,21));await h.settle();h.note('Current correction');h.click('Load older history');assert.equal(h.requests[1].init.headers['X-Prostate-Review-Before'],'2');h.answer(1,page(context(),[saved(context('c'.repeat(64)),1)],null,21));await h.settle();assert.equal(nodes(h.tree).find(n=>n.type==='textarea')?.props.value,'Current correction');assert.match(words(h.tree),/Saved history · 21 loaded/);assert.match(words(h.tree),/Prior revision/i);}finally{h.dispose();}
});
