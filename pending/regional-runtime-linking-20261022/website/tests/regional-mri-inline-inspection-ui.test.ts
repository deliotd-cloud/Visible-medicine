import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

type Node={type:any;props:Record<string,any>;key?:string};
type Deferred<T>={promise:Promise<T>;resolve:(value:T)=>void;reject:(error:Error)=>void};
const deferred=<T>():Deferred<T>=>{let resolve!:(v:T)=>void,reject!:(e:Error)=>void;const promise=new Promise<T>((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
const flush=async()=>{await Promise.resolve();await Promise.resolve();await Promise.resolve();};
const treeNodes=(value:any):Node[]=>Array.isArray(value)?value.flatMap(treeNodes):value?.props?[value,...treeNodes(value.props.children)]:[];
const words=(value:any):string=>Array.isArray(value)?value.map(words).join(''):value?.props?words(value.props.children):value==null?'':String(value);
const source=readFileSync(new URL('../components/RegionalMriInlineInspection.tsx',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const focusSource=readFileSync(new URL('../lib/regional-mri-specimen-focus.ts',import.meta.url),'utf8');
const focusCode=ts.transpileModule(focusSource,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const bodyFocusCode=ts.transpileModule(readFileSync(new URL('../lib/regional-mri-body-focus.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const referenceCode=ts.transpileModule(readFileSync(new URL('../lib/regional-mri-reference-selection.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const pin='a'.repeat(64),atlas='b'.repeat(40),bundle='c'.repeat(64);
function inspection(key='one',kind:'body'|'specimen'='body'){
 const id=kind==='body'?'public-body':'vm:reference:um-5t6tz7-v1-2:knee:acl';
 const href=kind==='body'?'/atlas/3d?region=leg':'/atlas/lower-limb-3d?'+new URLSearchParams({specimen:'um-limb-1',specimenScope:'knee',specimenPart:id,specimenSource:bundle,specimenRevision:'d'.repeat(64),specimenView:'anterior',atlasRevision:atlas});
 const target={id,label:'Public reference',kind,side:kind==='body'?'left':'right',sourceHash:bundle,runtimeRevision:atlas,specimenRevision:kind==='body'?null:'d'.repeat(64),relation:'same-structure',oppositeSide:kind==='specimen',href};
 return {key,src:kind==='body'?'/atlas-runtime/head-neck/index.html?region=leg&study=1':'/atlas-runtime/lower-limb/index.html?'+new URLSearchParams({specimen:'um-limb-1',specimenScope:'knee',specimenPart:id,specimenSource:bundle,specimenRevision:'d'.repeat(64),specimenView:'anterior'}),manifestUrl:kind==='body'?'/atlas-runtime/head-neck/manifest.json':'/atlas-runtime/lower-limb/manifest.json',runtimeRegion:kind==='body'?'head-neck':'independent-right-lower-limb',atlasRevision:atlas,runtimeRevision:atlas,mappingRevision:'e'.repeat(64),mri:{revision:pin,seriesId:'axial',seriesLabel:'Synthetic sequence',imageSha256:'f'.repeat(64),annotationId:'a1',anatomyId:'anat.knee.bne.patella',label:'Synthetic annotation',side:'left',coverage:'partial',reviewStatus:'accepted-scoped',reviewRevision:'1'.repeat(64),reviewScope:'Synthetic source scope',geometryKind:'mask',gridKind:'derived-source-ras',geometryMappingRevision:'2'.repeat(64)},target,provisional:false};
}
function bodyInspection(key:string,region:'leg'|'thigh'='leg',slug='popliteus',source=bundle){
 const base=inspection(key,'body'),id=`vm:anatomy:body:${region}:left:muscle:left-${slug}`;
 const query=new URLSearchParams({region,study:'1',structure:id,side:'left',source});
 return {...base,src:'/atlas-runtime/head-neck/index.html?'+query,target:{...base.target,id,sourceHash:source,href:'/atlas/3d?'+query+'&atlasRevision='+atlas}};
}
function bodySnapshot(proof:ReturnType<typeof bodyInspection>,session:string,sequence:number,id=proof.target.id,source=proof.target.sourceHash){
 return {type:'vm-body-semantic-selection',version:1,revision:atlas,region:new URL(proof.src,'https://fixture.invalid').searchParams.get('region'),session,sequence,status:'selected',selection:{kind:'root',id,source,laterality:'left'}};
}
async function openBody(h:ReturnType<typeof harness>,proof:ReturnType<typeof bodyInspection>,props:object={},manifest:object={}){
 h.render({inspection:proof,...props});h.answer(0,true,manifest);await flush();h.render();const frame=h.frame();frame.props.onLoad({currentTarget:frame.props.ref.current});h.render();
 const request=h.posts.at(-1).message;assert.equal(request.type,'vm-body-semantic-selection-request');
 return {frame,session:request.session,ack:()=>h.message({type:'vm-body-semantic-focus-result',version:1,revision:atlas,region:new URL(proof.src,'https://fixture.invalid').searchParams.get('region'),session:request.session,command:1,status:'accepted'})};
}
function harness(){
 const mod={exports:{} as any},owned=new WeakSet<object>(),calls:Array<{url:string;options:any;deferred:Deferred<any>}>=[];
 const oldWindow=(globalThis as any).window,oldDocument=(globalThis as any).document;
 const oldSetTimeout=globalThis.setTimeout,oldClearTimeout=globalThis.clearTimeout;
 const timers=new Map<number,()=>void>();let timerId=0;
 (globalThis as any).setTimeout=(fn:()=>void)=>{const id=++timerId;timers.set(id,fn);return id;};
 (globalThis as any).clearTimeout=(id:number)=>{timers.delete(id);};
 const listeners=new Map<string,Set<(event:any)=>void>>(),posts:any[]=[];
 const add=(name:string,fn:(event:any)=>void)=>{if(!listeners.has(name))listeners.set(name,new Set());listeners.get(name)!.add(fn);};
 const remove=(name:string,fn:(event:any)=>void)=>listeners.get(name)?.delete(fn);
 const frameWindow={postMessage:(message:any,origin:string)=>posts.push({message,origin})};
 (globalThis as any).window={location:{origin:'https://visible-medicine.invalid'},addEventListener:add,removeEventListener:remove};
 (globalThis as any).document={hidden:false,addEventListener:add,removeEventListener:remove};
 const closeCalls:number[]=[];let cursor=0,slots:any[]=[],pending=new Map<number,{kind:'layout'|'passive';fn:()=>any;deps?:any[]}>(),effects=new Map<number,{kind:'layout'|'passive';fn:()=>any;deps?:any[];cleanup?:()=>void}>(),tree:Node,props={inspection:inspection(),onClose:()=>{closeCalls.push(1)}};
 owned.add(props.inspection);
 const same=(a:any[]|undefined,b:any[]|undefined)=>!!a&&!!b&&a.length===b.length&&a.every((v,i)=>Object.is(v,b[i]));
 const hooks={useState(initial:any){const i=cursor++;if(!(i in slots))slots[i]=initial;return [slots[i],(next:any)=>{slots[i]=typeof next==='function'?next(slots[i]):next}]},useRef(initial:any){const i=cursor++;if(!(i in slots))slots[i]={current:initial};return slots[i]},useLayoutEffect(fn:()=>any,deps?:any[]){pending.set(cursor++,{kind:'layout',fn,deps})},useEffect(fn:()=>any,deps?:any[]){pending.set(cursor++,{kind:'passive',fn,deps})}};
 const runtime={jsx:(type:any,props:any,key?:string)=>({type,props,key}),jsxs:(type:any,props:any,key?:string)=>({type,props,key})};
 const inline={isRegionalMriInlineInspection:(value:any)=>owned.has(value),regionalMriInlineManifestCurrent:(proof:any,manifest:any)=>owned.has(proof)&&manifest?.sourceCommit===proof.runtimeRevision&&manifest?.valid===true&&(!manifest.sources||manifest.sources.includes(proof.target.sourceHash)),
  regionalMriInlineFamilyKey:(proof:any)=>{if(!owned.has(proof)||proof.target.kind!=='specimen')return null;const url=new URL(proof.src,'https://fixture.invalid');url.searchParams.delete('specimenPart');return JSON.stringify([url.pathname,url.search,proof.target.sourceHash,proof.target.specimenRevision,proof.atlasRevision,proof.runtimeRevision,proof.mappingRevision,proof.mri.revision,proof.mri.seriesId,proof.mri.imageSha256,proof.mri.side,proof.provisional]);},
  regionalMriInlineBodyFamilyKey:(proof:any)=>{if(!owned.has(proof)||proof.target.kind!=='body'||!proof.target.id.startsWith('vm:anatomy:body:'))return null;const url=new URL(proof.src,'https://fixture.invalid');url.searchParams.delete('structure');url.searchParams.delete('source');return JSON.stringify(['body-root',url.pathname,url.search,proof.atlasRevision,proof.runtimeRevision,proof.mappingRevision,proof.target.side,proof.target.relation,proof.mri.revision,proof.mri.seriesId,proof.mri.imageSha256,proof.mri.side,proof.provisional]);},
  regionalMriInlineReferenceFamilyKey:(proof:any)=>inline.regionalMriInlineFamilyKey(proof)??inline.regionalMriInlineBodyFamilyKey(proof)};
 const focusMod={exports:{} as any};new Function('require','module','exports',focusCode)((id:string)=>{assert.equal(id,'./regional-mri-inline-inspection.ts');return inline;},focusMod,focusMod.exports);
 const bodyFocusMod={exports:{} as any};new Function('require','module','exports',bodyFocusCode)((id:string)=>{assert.equal(id,'./regional-mri-inline-inspection.ts');return inline;},bodyFocusMod,bodyFocusMod.exports);
 const referenceMod={exports:{} as any};new Function('require','module','exports',referenceCode)((id:string)=>{if(id==='./regional-mri-specimen-focus.ts')return focusMod.exports;assert.equal(id,'./regional-mri-body-focus.ts');return bodyFocusMod.exports;},referenceMod,referenceMod.exports);
 const imports:Record<string,any>={react:hooks,'react/jsx-runtime':runtime,'../lib/regional-mri-inline-inspection':inline,'../lib/regional-mri-specimen-focus':focusMod.exports,'../lib/regional-mri-body-focus':bodyFocusMod.exports,'../lib/regional-mri-reference-selection':referenceMod.exports};
 new Function('require','module','exports',code)((id:string)=>{assert(Object.hasOwn(imports,id),id);return imports[id];},mod,mod.exports);
 const oldFetch=globalThis.fetch;
 globalThis.fetch=((url:any,options:any)=>{const d=deferred<any>();calls.push({url:String(url),options,deferred:d});return d.promise;}) as typeof fetch;
 function commit(kinds:('layout'|'passive')[]=['layout','passive']){for(const kind of kinds)for(const [i,item] of pending){if(item.kind!==kind)continue;const old=effects.get(i);if(!same(old?.deps,item.deps)){old?.cleanup?.();const cleanup=item.fn();effects.set(i,{...item,cleanup});}}}
 function render(next?:any,doCommit=true,layoutOnly=false){if(next){props={...props,...next};if(next.inspection&&next.owned!==false)owned.add(next.inspection);}cursor=0;pending=new Map();const result=mod.exports.RegionalMriInlineInspection(props);if(doCommit){tree=result;commit(layoutOnly?['layout']:['layout','passive']);}return result as Node;}
 function find(type:string,predicate:(n:Node)=>boolean=()=>true){const n=treeNodes(tree).find(x=>x.type===type&&predicate(x));assert(n,`missing ${type}`);return n;}
 function count(type:string){return treeNodes(tree).filter(x=>x.type===type).length;}
 function reverseActions(){return treeNodes(tree).filter(x=>x.type==='button'&&words(x).startsWith('Show ')&&words(x).endsWith(' on MRI'));}
 function status(){return words(find('p',n=>n.props.role==='status'));}
 function answer(index:number,valid=true,extra:object={}){calls[index].deferred.resolve({ok:true,redirected:false,json:async()=>({sourceCommit:atlas,valid,...extra})});}
 function button(label:string){return find('button',n=>words(n).includes(label));}
 function cleanup(){for(const effect of effects.values())effect.cleanup?.();effects.clear();globalThis.fetch=oldFetch;(globalThis as any).window=oldWindow;(globalThis as any).document=oldDocument;globalThis.setTimeout=oldSetTimeout;globalThis.clearTimeout=oldClearTimeout;}
 function strictReplay(){for(const effect of effects.values())effect.cleanup?.();for(const kind of ['layout','passive'])for(const effect of effects.values())if(effect.kind===kind)effect.cleanup=effect.fn();}
 function message(data:any,origin='https://visible-medicine.invalid',source:any=frameWindow){for(const fn of listeners.get('message')??[])fn({data,origin,source});}
 function event(name:string){for(const fn of listeners.get(name)??[])fn({type:name});}
 function hidden(value:boolean){(globalThis as any).document.hidden=value;event('visibilitychange');}
 function expire(){const callbacks=[...timers.values()];timers.clear();for(const fn of callbacks)fn();}
 function frame(){const node=find('iframe');node.props.ref.current={contentWindow:frameWindow};return node;}
 return {render,finishPassive:()=>commit(['passive']),find,count,reverseActions,status,answer,button,calls,closeCalls,cleanup,strictReplay,tree:()=>tree,message,frame,frameWindow,posts,event,hidden,expire,isCurrentSelection:focusMod.exports.isCurrentRegionalMriSpecimenSelection as (value:unknown)=>boolean};
}

test('no frame before successful public manifest check; fetch is private-proof-free and fail-closed',async()=>{
 const h=harness();try{
  h.render();assert.equal(h.count('iframe'),0);assert.equal(h.calls.length,1);
  assert.equal(h.calls[0].url,'/atlas-runtime/head-neck/manifest.json');
  assert.equal(h.calls[0].options.cache,'no-store');assert.equal(h.calls[0].options.credentials,'omit');assert.equal(h.calls[0].options.redirect,'error');
  assert.equal(h.calls[0].options.signal.aborted,false);
  assert(!h.calls[0].url.includes(pin)&&!h.calls[0].url.includes('Synthetic'));
  h.answer(0);await flush();h.render();assert.equal(h.count('iframe'),1);assert.match(h.status(),/Loading the existing 3D reference/);
  const frame=h.find('iframe');frame.props.ref.current={};frame.props.onLoad({currentTarget:frame.props.ref.current});h.render();
  assert.match(h.status(),/not independently confirmed/);assert.doesNotMatch(h.status(),/matched/i);
 }finally{h.cleanup();}
});

test('failed or stale manifest never loads frame; retry uses a fresh request',async()=>{
 const h=harness();try{
  h.render();h.answer(0,false);await flush();h.render();assert.equal(h.count('iframe'),0);assert.match(h.status(),/could not load/);
  h.button('Retry this reference').props.onClick();h.render();assert.equal(h.calls.length,2);assert.equal(h.count('iframe'),0);
  assert(h.calls[0].options.signal.aborted);h.answer(1);await flush();h.render();assert.equal(h.count('iframe'),1);
  const old=h.find('iframe');old.props.ref.current={};old.props.onError({currentTarget:old.props.ref.current});h.render();assert.equal(h.count('iframe'),0);
  h.button('Retry this reference').props.onClick();h.render();assert.equal(h.calls.length,3);h.answer(2);await flush();h.render();assert.equal(h.count('iframe'),1);
 }finally{h.cleanup();}
});

test('temporary checklist and full-Atlas link stay local, public and reset with context',async()=>{
 const h=harness();try{
  h.render();h.answer(0);await flush();h.render();
  const first=h.find('input',n=>n.props.type==='checkbox');assert.equal(first.props.checked,false);first.props.onChange({currentTarget:{checked:true}});h.render();assert.equal(h.find('input',n=>n.props.type==='checkbox').props.checked,true);
  assert.match(words(h.tree()),/not saved|not a saved review/i);assert.match(words(h.tree()),/derived-source-ras/);
  const link=h.find('a');assert.equal(link.props.href,'/atlas/3d?region=leg');assert.equal(link.props.rel,'noopener noreferrer');
  const oldClick=link.props.onClick;h.render({inspection:inspection('two','specimen')});assert.equal(h.count('iframe'),0);assert.equal(h.calls[1].url,'/atlas-runtime/lower-limb/manifest.json');
  assert.equal(h.find('input',n=>n.props.type==='checkbox').props.checked,false);let prevented=false;oldClick({preventDefault(){prevented=true}});assert(prevented);
  h.button('Close 3D reference').props.onClick();assert.equal(h.closeCalls.length,1);
 }finally{h.cleanup();}
});

test('retired, abandoned and StrictMode-replayed callbacks cannot resurrect stale frame or invoke close',async()=>{
 const h=harness();try{
  h.render();const oldClose=h.button('Close 3D reference').props.onClick;
  const abandoned=h.render({inspection:inspection('abandoned')},false);
  assert(abandoned);oldClose();assert.equal(h.closeCalls.length,1,'abandoned render must not retire committed controls');
  h.render({inspection:inspection('current')});assert(h.calls[0].options.signal.aborted);
  oldClose();assert.equal(h.closeCalls.length,1,'old committed controls retire after a new commit');
  h.answer(0);await flush();h.render();assert.equal(h.count('iframe'),0,'aborted completion cannot show old frame');
  h.strictReplay();assert(h.calls.at(-2)?.options.signal.aborted);h.render();
  const newest=h.calls.length-1;h.answer(newest);await flush();h.render();assert.equal(h.count('iframe'),1);
  const frame=h.find('iframe');frame.props.ref.current={};const staleLoad=frame.props.onLoad;
  h.render({inspection:inspection('replacement','specimen')});staleLoad({currentTarget:frame.props.ref.current});h.render();assert.equal(h.count('iframe'),0);
 }finally{h.cleanup();}
});

test('specimen frame survives compatible targets; ACK and fresh snapshot confirm only current context',async()=>{
 const h=harness();try{
  const first=inspection('first','specimen');h.render({inspection:first});h.answer(0);await flush();h.render();
  const frame=h.frame();frame.props.onLoad({currentTarget:frame.props.ref.current});h.render();
  h.message({type:'vm-specimen-selection-ready',version:1,revision:atlas});
  const session=h.posts.at(-1).message.session;assert.equal(h.posts.at(-1).message.type,'vm-specimen-selection-request');
  const snapshot=(sequence:number,status:string,target?:object)=>({type:'vm-specimen-selection',version:1,revision:atlas,session,sequence,status,...(target?{target}:{})});
  h.message(snapshot(1,'empty'));assert.equal(h.posts.at(-1).message.type,'vm-specimen-focus');
  h.message({type:'vm-specimen-focus-result',version:1,revision:atlas,session,command:1,status:'accepted'});h.render();
  assert.doesNotMatch(h.status(),/Model reports/);
  h.message(snapshot(2,'selected',{scope:'knee',id:first.target.id,source:bundle,revision:first.target.specimenRevision,laterality:'right-source-report'}));h.render();
  assert.match(h.status(),/Model reports this named selection/);
  const second=inspection('second','specimen');second.target.id='vm:reference:um-5t6tz7-v1-2:knee:pcl';
  second.target.href=second.target.href.replace('acl','pcl');second.src=second.src.replace('acl','pcl');
  h.render({inspection:second});h.render();assert.equal(h.count('iframe'),1);assert.equal(h.find('iframe').key,frame.key);
  assert.equal(h.find('iframe').props.src,frame.props.src,'compatible target keeps exact frame URL');
  assert.doesNotMatch(h.status(),/Model reports/);
  const newSession=h.posts.at(-1).message.session;assert.notEqual(newSession,session);
  h.message(snapshot(3,'selected',{scope:'knee',id:first.target.id,source:bundle,revision:first.target.specimenRevision,laterality:'right-source-report'}));
  h.render({suspended:true});h.render();assert.match(h.status(),/Prior reference retained/);
  h.message({type:'vm-specimen-focus-result',version:1,revision:atlas,session:newSession,command:1,status:'accepted'});h.render();
  assert.doesNotMatch(h.status(),/Model reports/);
 }finally{h.cleanup();}
});

test('specimen host ignores wrong window, origin and compiled revision before sending any command',async()=>{
 const h=harness();try{
  h.render({inspection:inspection('focus','specimen')});h.answer(0);await flush();h.render();h.frame();
  const ready={type:'vm-specimen-selection-ready',version:1,revision:atlas};
  h.message(ready,'https://foreign.invalid');h.message(ready,undefined,{});
  h.message({...ready,revision:'0'.repeat(40)});assert.equal(h.posts.length,0);
  h.message(ready);const session=h.posts.at(-1).message.session;assert.equal(h.posts.length,1);
  const empty={type:'vm-specimen-selection',version:1,revision:atlas,session,sequence:1,status:'empty'};
  h.message(empty,'https://foreign.invalid');h.message(empty,undefined,{});
  h.message({...empty,revision:'0'.repeat(40)});assert.equal(h.posts.length,1);
  h.message(empty);assert.equal(h.posts.length,2);assert.equal(h.posts.at(-1).message.type,'vm-specimen-focus');
 }finally{h.cleanup();}
});

test('only exact ready envelopes may be cached across a compatible target change',async()=>{
 const h=harness();try{
  const first=inspection('ready-one','specimen');h.render({inspection:first});h.answer(0);await flush();h.render();h.frame();
  h.message({type:'vm-specimen-selection-ready',version:2,revision:atlas});
  h.message({type:'vm-specimen-selection-ready',version:1,revision:atlas,extra:true});
  assert.equal(h.posts.length,0);
  const second=inspection('ready-two','specimen');second.target.id='vm:reference:um-5t6tz7-v1-2:knee:pcl';
  second.target.href=second.target.href.replace('acl','pcl');second.src=second.src.replace('acl','pcl');
  h.render({inspection:second});h.render();assert.equal(h.posts.length,0,'invalid ready cannot authorize cached request');
  h.message({type:'vm-specimen-selection-ready',version:1,revision:atlas});
  assert.equal(h.posts.length,1);assert.equal(h.posts[0].message.type,'vm-specimen-selection-request');
  const priorSession=h.posts[0].message.session;
  h.message({type:'vm-specimen-selection',version:1,revision:atlas,session:priorSession,sequence:1,status:'blocked',reason:'unavailable',extra:true});
  const third=inspection('ready-three','specimen');third.target.id='vm:reference:um-5t6tz7-v1-2:knee:mcl';
  third.target.href=third.target.href.replace('acl','mcl');third.src=third.src.replace('acl','mcl');
  h.render({inspection:third});h.render();assert.equal(h.posts.length,2,'malformed unavailable snapshot cannot clear valid readiness');
 }finally{h.cleanup();}
});

test('hidden and pagehide revoke focus; suspension clears worksheet without reviving ticks',async()=>{
 const h=harness();try{
  const proof=inspection('hidden','specimen');h.render({inspection:proof});h.answer(0);await flush();h.render();h.frame();
  const tick=h.find('input',n=>n.props.type==='checkbox');tick.props.onChange({currentTarget:{checked:true}});h.render();
  assert.equal(h.find('input',n=>n.props.type==='checkbox').props.checked,true);
  h.message({type:'vm-specimen-selection-ready',version:1,revision:atlas});
  const session=h.posts.at(-1).message.session;
  h.message({type:'vm-specimen-selection',version:1,revision:atlas,session,sequence:1,status:'empty'});
  assert.equal(h.posts.at(-1).message.type,'vm-specimen-focus');
  h.hidden(true);h.render();
  h.message({type:'vm-specimen-focus-result',version:1,revision:atlas,session,command:1,status:'accepted'});
  h.message({type:'vm-specimen-selection',version:1,revision:atlas,session,sequence:2,status:'selected',target:{scope:'knee',id:proof.target.id,source:bundle,revision:proof.target.specimenRevision,laterality:'right-source-report'}});
  h.render();assert.doesNotMatch(h.status(),/Model reports/);
  h.hidden(false);h.render({suspended:true});h.render();
  const suspendedTick=h.find('input',n=>n.props.type==='checkbox');assert.equal(suspendedTick.props.checked,false);assert.equal(suspendedTick.props.disabled,true);
  h.render({suspended:false});h.render();assert.equal(h.find('input',n=>n.props.type==='checkbox').props.checked,false);
  h.event('pagehide');h.message({type:'vm-specimen-selection-ready',version:1,revision:atlas});
  assert.equal(h.posts.at(-1).message.type,'vm-specimen-focus','pagehide prevents a fresh request');
  h.event('pageshow');h.message({type:'vm-specimen-selection-ready',version:1,revision:atlas});
  assert.equal(h.posts.at(-1).message.type,'vm-specimen-selection-request');
  assert.notEqual(h.posts.at(-1).message.session,session);
 }finally{h.cleanup();}
});

test('loaded channel timeout retires late readiness and snapshots; retry needs a fresh frame when not ready',async()=>{
 const h=harness();try{
  h.render({inspection:inspection('timeout','specimen')});h.answer(0);await flush();h.render();
  const frame=h.frame();frame.props.onLoad({currentTarget:frame.props.ref.current});h.render();
  h.expire();h.render();assert.match(h.status(),/could not be confirmed/);
  const sentBeforeLate=h.posts.length;
  h.message({type:'vm-specimen-selection-ready',version:1,revision:atlas});assert.equal(h.posts.length,sentBeforeLate,'late ready is inert');
  h.button('Retry model focus').props.onClick();h.render();assert.equal(h.count('iframe'),0);
  assert.equal(h.calls.length,2);h.answer(1);await flush();h.render();const retriedFrame=h.frame();
  retriedFrame.props.onLoad({currentTarget:retriedFrame.props.ref.current});h.render();
  h.message({type:'vm-specimen-selection-ready',version:1,revision:atlas});
  const session=h.posts.at(-1).message.session;assert(session);
  h.render();h.expire();h.render();assert.match(h.status(),/could not be confirmed/);
  const sentBeforeSnapshot=h.posts.length;
  h.message({type:'vm-specimen-selection',version:1,revision:atlas,session,sequence:1,status:'empty'});
  assert.equal(h.posts.length,sentBeforeSnapshot,'timed-out snapshot cannot dispatch focus');
 }finally{h.cleanup();}
});

test('focus handling timeout consumes old command and cannot be confirmed by a late ACK',async()=>{
 const h=harness();try{
  const proof=inspection('focus-timeout','specimen');h.render({inspection:proof});h.answer(0);await flush();h.render();
  const frame=h.frame();frame.props.onLoad({currentTarget:frame.props.ref.current});h.render();
  h.message({type:'vm-specimen-selection-ready',version:1,revision:atlas});
  const session=h.posts.at(-1).message.session;
  h.message({type:'vm-specimen-selection',version:1,revision:atlas,session,sequence:1,status:'empty'});h.render();
  assert.equal(h.posts.at(-1).message.type,'vm-specimen-focus');
  h.expire();h.render();assert.match(h.status(),/could not be confirmed/);
  h.message({type:'vm-specimen-focus-result',version:1,revision:atlas,session,command:1,status:'accepted'});
  h.message({type:'vm-specimen-selection',version:1,revision:atlas,session,sequence:2,status:'selected',target:{scope:'knee',id:proof.target.id,source:bundle,revision:proof.target.specimenRevision,laterality:'right-source-report'}});
  h.render();assert.doesNotMatch(h.status(),/Model reports/);
  h.button('Retry model focus').props.onClick();assert.equal(h.posts.at(-1).message.type,'vm-specimen-selection-request');
  assert.notEqual(h.posts.at(-1).message.session,session);
 }finally{h.cleanup();}
});

test('same iframe reload and readiness revoke a confirmed claim until a new command and snapshot',async()=>{
 const h=harness();try{
  const proof=inspection('reload','specimen');h.render({inspection:proof});h.answer(0);await flush();h.render();
  const frame=h.frame();frame.props.onLoad({currentTarget:frame.props.ref.current});h.render();
  const first=h.posts.at(-1).message.session;
  const target={scope:'knee',id:proof.target.id,source:bundle,revision:proof.target.specimenRevision,laterality:'right-source-report'};
  const snapshot=(session:string,sequence:number)=>({type:'vm-specimen-selection',version:1,revision:atlas,session,sequence,status:'selected',target});
  const ack=(session:string)=>({type:'vm-specimen-focus-result',version:1,revision:atlas,session,command:1,status:'accepted'});
  h.message(snapshot(first,1));h.message(ack(first));h.message(snapshot(first,2));h.render();assert.match(h.status(),/Model reports/);
  const sameFrame=h.frame();sameFrame.props.onLoad({currentTarget:sameFrame.props.ref.current});h.render();
  assert.equal(h.find('iframe').key,frame.key);assert.doesNotMatch(h.status(),/Model reports/);
  const second=h.posts.at(-1).message.session;assert.notEqual(second,first);
  h.message(snapshot(first,3));h.message(ack(first));h.render();assert.doesNotMatch(h.status(),/Model reports/);
  h.message(snapshot(second,1));h.message(ack(second));h.message(snapshot(second,2));h.render();assert.match(h.status(),/Model reports/);
  h.message({type:'vm-specimen-selection-ready',version:1,revision:atlas});h.render();
  const third=h.posts.at(-1).message.session;assert.notEqual(third,second);assert.doesNotMatch(h.status(),/Model reports/);
  h.message(snapshot(second,3));h.render();assert.doesNotMatch(h.status(),/Model reports/);
 }finally{h.cleanup();}
});

test('readiness before first load and visible return each require a fresh session',async()=>{
 const h=harness();try{
  h.render({inspection:inspection('early','specimen')});h.answer(0);await flush();h.render();const frame=h.frame();
  h.message({type:'vm-specimen-selection-ready',version:1,revision:atlas});
  const early=h.posts.at(-1).message.session;
  frame.props.onLoad({currentTarget:frame.props.ref.current});h.render();
  const loaded=h.posts.at(-1).message.session;assert.notEqual(loaded,early);
  h.message({type:'vm-specimen-selection',version:1,revision:atlas,session:early,sequence:1,status:'empty'});
  assert.equal(h.posts.at(-1).message.session,loaded,'preload session cannot focus after load');
  h.hidden(true);h.render();const count=h.posts.length;
  h.hidden(false);h.render();assert.equal(h.posts.length,count+1);
  const resumed=h.posts.at(-1).message.session;assert.notEqual(resumed,loaded);
  h.message({type:'vm-specimen-selection',version:1,revision:atlas,session:loaded,sequence:1,status:'empty'});
  assert.equal(h.posts.at(-1).message.session,resumed,'hidden session cannot focus after return');
 }finally{h.cleanup();}
});

test('committed suspension blocks the old listener before passive cleanup',async()=>{
 const h=harness();try{
  h.render({inspection:inspection('gap','specimen')});h.answer(0);await flush();h.render();const frame=h.frame();
  frame.props.onLoad({currentTarget:frame.props.ref.current});h.render();const sent=h.posts.length;
  h.render({suspended:true},true,true);
  h.message({type:'vm-specimen-selection-ready',version:1,revision:atlas});
  assert.equal(h.posts.length,sent,'old listener cannot command while the new commit is suspended');
  h.finishPassive();h.render();assert.match(h.status(),/Prior reference retained/);
 }finally{h.cleanup();}
});

test('a fresh reported specimen requires an explicit MRI action, including a different live knee target',async()=>{
 const h=harness(),selected:any[]=[];try{
  const proof=inspection('reverse','specimen');
  h.render({inspection:proof,getMriSelectionLabel:(selection:any)=>selection.target.id.endsWith(':acl')?'ACL':selection.target.id.endsWith(':pcl')?'PCL':null,onSelectMri:(selection:any)=>selected.push(selection)});
  h.answer(0);await flush();h.render();const frame=h.frame();frame.props.onLoad({currentTarget:frame.props.ref.current});h.render();
  const source=frame.props.src,key=frame.key,session=h.posts.at(-1).message.session;
  const target=(id:string)=>({scope:'knee',id:`vm:reference:um-5t6tz7-v1-2:knee:${id}`,source:bundle,revision:proof.target.specimenRevision,laterality:'right-source-report'});
  const snapshot=(sequence:number,id:string)=>({type:'vm-specimen-selection',version:1,revision:atlas,session,sequence,status:'selected',target:target(id)});
  assert.equal(h.reverseActions().length,0,'no reverse action before a fresh report');
  h.message(snapshot(1,'acl'));h.render();assert.equal(h.reverseActions().length,0,'initial baseline is not selectable');
  h.message({type:'vm-specimen-focus-result',version:1,revision:atlas,session,command:1,status:'accepted'});h.render();
  assert.equal(selected.length,0);assert.equal(h.reverseActions().length,0,'ACK alone cannot select MRI');
  h.message(snapshot(2,'acl'));h.render();assert.equal(selected.length,0);
  h.button('Show ACL on MRI').props.onClick();assert.equal(selected.length,1);
  assert.equal(selected[0].target.id,target('acl').id);assert(h.isCurrentSelection(selected[0]));
  h.message(snapshot(3,'pcl'));h.render();assert.equal(selected.length,1,'live model reports never select MRI automatically');
  assert.doesNotMatch(h.status(),/Model reports this named selection/,'requested ACL focus still has its own status');
  assert.equal(h.find('iframe').props.src,source);assert.equal(h.find('iframe').key,key);
  h.button('Show PCL on MRI').props.onClick();assert.equal(selected.length,2);
  assert.equal(selected[1].target.id,target('pcl').id);assert(h.isCurrentSelection(selected[1]));
  assert.equal(h.isCurrentSelection(selected[0]),false,'a newer report retires the old proof');
  assert.match(words(h.tree()),/Model interactions do not change this MRI/);
 }finally{h.cleanup();}
});

test('copied action callbacks and retired reports cannot change MRI after a newer report or context retirement',async()=>{
 const h=harness(),selected:any[]=[];try{
  const proof=inspection('stale-reverse','specimen');
  h.render({inspection:proof,getMriSelectionLabel:(selection:any)=>selection.target.id.endsWith(':acl')?'ACL':'PCL',onSelectMri:(selection:any)=>selected.push(selection)});
  h.answer(0);await flush();h.render();const frame=h.frame();frame.props.onLoad({currentTarget:frame.props.ref.current});h.render();
  const session=h.posts.at(-1).message.session,target=(id:string)=>({scope:'knee',id:`vm:reference:um-5t6tz7-v1-2:knee:${id}`,source:bundle,revision:proof.target.specimenRevision,laterality:'right-source-report'});
  const snapshot=(sequence:number,id:string)=>({type:'vm-specimen-selection',version:1,revision:atlas,session,sequence,status:'selected',target:target(id)});
  h.message(snapshot(1,'acl'));h.message({type:'vm-specimen-focus-result',version:1,revision:atlas,session,command:1,status:'accepted'});h.message(snapshot(2,'acl'));h.render();
  const aclClick=h.button('Show ACL on MRI').props.onClick;
  h.message(snapshot(3,'pcl'));h.render();aclClick();assert.equal(selected.length,0,'old action is inert after a newer report');
  const pclClick=h.button('Show PCL on MRI').props.onClick;
  const next=inspection('new-context','specimen');h.render({inspection:next});pclClick();assert.equal(selected.length,0,'old action is inert after a context change');
  assert.equal(h.reverseActions().length,0);
  h.message(snapshot(4,'pcl'));h.render();assert.equal(selected.length,0,'old-session message is inert');
 }finally{h.cleanup();}
});

test('reverse action needs a fresh resolver label and current proof, and retires on lifecycle changes',async()=>{
 const h=harness(),selected:any[]=[];try{
  const proof=inspection('lifecycle-reverse','specimen');let label:string|null=null;
  h.render({inspection:proof,getMriSelectionLabel:()=>label,onSelectMri:(selection:any)=>selected.push(selection)});
  h.answer(0);await flush();h.render();const frame=h.frame();frame.props.onLoad({currentTarget:frame.props.ref.current});h.render();
  const session=h.posts.at(-1).message.session,target={scope:'knee',id:proof.target.id,source:bundle,revision:proof.target.specimenRevision,laterality:'right-source-report'};
  const snapshot=(sequence:number)=>({type:'vm-specimen-selection',version:1,revision:atlas,session,sequence,status:'selected',target});
  h.message(snapshot(1));h.message({type:'vm-specimen-focus-result',version:1,revision:atlas,session,command:1,status:'accepted'});h.message(snapshot(2));h.render();
  assert.equal(h.reverseActions().length,0,'null resolver suppresses the action');
  label='ACL';h.render();const oldClick=h.button('Show ACL on MRI').props.onClick;
  label=null;oldClick();assert.equal(selected.length,0,'label is resolved again at click time');
  label='ACL';h.render();const hiddenClick=h.button('Show ACL on MRI').props.onClick;
  h.hidden(true);hiddenClick();h.render();assert.equal(selected.length,0);
  h.hidden(false);h.render();assert.equal(h.reverseActions().length,0);
  h.message({type:'vm-specimen-selection-ready',version:1,revision:atlas});const renewed=h.posts.at(-1).message.session;
  h.message({type:'vm-specimen-selection',version:1,revision:atlas,session:renewed,sequence:1,status:'empty'});h.render();assert.equal(h.reverseActions().length,0);
  h.message({type:'vm-specimen-focus-result',version:1,revision:atlas,session:renewed,command:1,status:'accepted'});
  h.message({type:'vm-specimen-selection',version:1,revision:atlas,session:renewed,sequence:2,status:'selected',target});h.render();
  const suspendClick=h.button('Show ACL on MRI').props.onClick;
  h.render({suspended:true});suspendClick();assert.equal(selected.length,0);
  h.render({suspended:false});h.render();assert.equal(h.reverseActions().length,0);
  h.event('pagehide');assert.equal(selected.length,0);
  h.event('pageshow');h.render();assert.equal(h.reverseActions().length,0);
  h.button('Close 3D reference').props.onClick();oldClick();assert.equal(selected.length,0);
 }finally{h.cleanup();}
});

test('foreign, blocked and empty model reports cannot offer or trigger MRI selection',async()=>{
 const h=harness(),selected:any[]=[];try{
  const proof=inspection('hostile-reverse','specimen');
  h.render({inspection:proof,getMriSelectionLabel:()=> 'ACL',onSelectMri:(selection:any)=>selected.push(selection)});
  h.answer(0);await flush();h.render();const frame=h.frame();frame.props.onLoad({currentTarget:frame.props.ref.current});h.render();
  const session=h.posts.at(-1).message.session,target={scope:'knee',id:proof.target.id,source:bundle,revision:proof.target.specimenRevision,laterality:'right-source-report'};
  const snapshot=(sequence:number)=>({type:'vm-specimen-selection',version:1,revision:atlas,session,sequence,status:'selected',target});
  h.message(snapshot(1));h.message({type:'vm-specimen-focus-result',version:1,revision:atlas,session,command:1,status:'accepted'});
  h.message(snapshot(2),'https://foreign.invalid');h.message(snapshot(2),undefined,{});
  h.message({...snapshot(2),revision:'0'.repeat(40)});h.render();assert.equal(h.reverseActions().length,0);
  h.message(snapshot(2));h.render();const click=h.button('Show ACL on MRI').props.onClick;
  h.message({type:'vm-specimen-selection',version:1,revision:atlas,session,sequence:3,status:'empty'});h.render();
  assert.equal(h.reverseActions().length,0);click();assert.equal(selected.length,0);
  h.message({type:'vm-specimen-selection',version:1,revision:atlas,session,sequence:4,status:'blocked',reason:'practice'});h.render();
  assert.equal(h.reverseActions().length,0);click();assert.equal(selected.length,0);
  h.button('Retry model focus').props.onClick();h.render();assert.equal(h.reverseActions().length,0);
  h.message(snapshot(5));h.render();assert.equal(h.reverseActions().length,0,'retired session cannot restore the action');
 }finally{h.cleanup();}
});

test('without reverse-selection props existing specimen inspection never offers an MRI action',async()=>{
 const h=harness();try{
  const proof=inspection('legacy-reverse','specimen');h.render({inspection:proof});h.answer(0);await flush();h.render();
  const frame=h.frame();frame.props.onLoad({currentTarget:frame.props.ref.current});h.render();
  const session=h.posts.at(-1).message.session,target={scope:'knee',id:proof.target.id,source:bundle,revision:proof.target.specimenRevision,laterality:'right-source-report'};
  const selected=(sequence:number)=>({type:'vm-specimen-selection',version:1,revision:atlas,session,sequence,status:'selected',target});
  h.message(selected(1));h.message({type:'vm-specimen-focus-result',version:1,revision:atlas,session,command:1,status:'accepted'});h.message(selected(2));h.render();
  assert.match(h.status(),/Model reports this named selection/);assert.equal(h.reverseActions().length,0);
 }finally{h.cleanup();}
});

test('intentional alternate model selection is described as browsing, not failed focus, with explicit restore',async()=>{
 const h=harness(),selected:any[]=[];try{
  const proof=inspection('browsing','specimen');h.render({inspection:proof,getMriSelectionLabel:(selection:any)=>selection.target.id.endsWith(':pcl')?'PCL':null,onSelectMri:(selection:any)=>selected.push(selection)});
  h.answer(0);await flush();h.render();const frame=h.frame();frame.props.onLoad({currentTarget:frame.props.ref.current});h.render();
  const session=h.posts.at(-1).message.session,target=(id:string)=>({scope:'knee',id:`vm:reference:um-5t6tz7-v1-2:knee:${id}`,source:bundle,revision:proof.target.specimenRevision,laterality:'right-source-report'});
  const report=(sequence:number,id:string)=>h.message({type:'vm-specimen-selection',version:1,revision:atlas,session,sequence,status:'selected',target:target(id)});
  report(1,'acl');h.message({type:'vm-specimen-focus-result',version:1,revision:atlas,session,command:1,status:'accepted'});report(2,'acl');h.render();
  report(3,'pcl');h.render();assert.match(h.status(),/Viewing another model selection/);assert.match(h.status(),/MRI is unchanged/);assert.doesNotMatch(h.status(),/could not|failed/i);
  const oldLink=h.button('Show PCL on MRI').props.onClick;assert.equal(selected.length,0);assert.equal(h.find('iframe').key,frame.key);assert.equal(h.find('iframe').props.src,frame.props.src);
  h.button('Restore requested selection').props.onClick();h.render();assert.notEqual(h.posts.at(-1).message.session,session);
  oldLink();assert.equal(selected.length,0);assert.equal(h.reverseActions().length,0);assert.doesNotMatch(h.status(),/Viewing another/);
 }finally{h.cleanup();}
});

test('an unmapped live model selection has a clear no-link message, while an empty report remains unconfirmed',async()=>{
 const h=harness();try{
  const proof=inspection('no-link-browsing','specimen');h.render({inspection:proof,getMriSelectionLabel:()=>null,onSelectMri:()=>assert.fail('No MRI selection permitted')});
  h.answer(0);await flush();h.render();const frame=h.frame();frame.props.onLoad({currentTarget:frame.props.ref.current});h.render();
  const session=h.posts.at(-1).message.session,target={scope:'knee',id:proof.target.id,source:bundle,revision:proof.target.specimenRevision,laterality:'right-source-report'};
  const report=(sequence:number,value:object)=>h.message({type:'vm-specimen-selection',version:1,revision:atlas,session,sequence,status:'selected',target:value});
  report(1,target);h.message({type:'vm-specimen-focus-result',version:1,revision:atlas,session,command:1,status:'accepted'});report(2,target);h.render();
  report(3,{...target,id:'vm:reference:um-5t6tz7-v1-2:knee:meniscus-group'});h.render();
  assert.match(h.status(),/No supported MRI link is available in this sequence/);assert.doesNotMatch(h.status(),/could not|failed/i);assert.equal(h.reverseActions().length,0);
  h.message({type:'vm-specimen-selection',version:1,revision:atlas,session,sequence:4,status:'empty'});h.render();
  assert.match(h.status(),/could not be confirmed/);assert.doesNotMatch(h.status(),/Viewing another/);h.button('Retry model focus');
 }finally{h.cleanup();}
});

test('a fresh reported return to the requested selection clears browsing copy without inventing camera completion',async()=>{
 const h=harness();try{
  const proof=inspection('return-from-browsing','specimen');h.render({inspection:proof});h.answer(0);await flush();h.render();const frame=h.frame();frame.props.onLoad({currentTarget:frame.props.ref.current});h.render();
  const session=h.posts.at(-1).message.session,target={scope:'knee',id:proof.target.id,source:bundle,revision:proof.target.specimenRevision,laterality:'right-source-report'};
  const report=(sequence:number,value:object)=>h.message({type:'vm-specimen-selection',version:1,revision:atlas,session,sequence,status:'selected',target:value});
  report(1,target);h.message({type:'vm-specimen-focus-result',version:1,revision:atlas,session,command:1,status:'accepted'});report(2,target);
  report(3,{...target,id:'vm:reference:um-5t6tz7-v1-2:knee:pcl'});h.render();assert.match(h.status(),/Viewing another/);
  report(4,target);h.render();assert.match(h.status(),/Model reports this named selection/);assert.doesNotMatch(h.status(),/Viewing another|could not|camera completed/i);
  assert.equal(h.reverseActions().length,0);assert.match(words(h.tree()),/No MRI anatomical match, spatial registration, mirroring or synchronized camera completion is implied/);
 }finally{h.cleanup();}
});

test('actual body controller in the inline component waits for a fresh exact root report in both regions',async()=>{
 for(const region of ['leg','thigh'] as const){const h=harness();try{
  const proof=bodyInspection('live-'+region,region),loaded=await openBody(h,proof);
  const first=bodySnapshot(proof,loaded.session,1);h.message(first,'https://foreign.invalid');h.message(first,undefined,{});h.render();assert.doesNotMatch(h.status(),/Model reports/);
  h.message(first);loaded.ack();h.message(bodySnapshot(proof,loaded.session,2,proof.target.id+'-old'));h.render();assert.doesNotMatch(h.status(),/Model reports/);
  h.message(bodySnapshot(proof,loaded.session,3));h.render();assert.match(h.status(),/Model reports this named selection/);assert.equal(h.reverseActions().length,0);
  assert.equal(h.find('iframe').key,loaded.frame.key);assert.equal(h.calls.length,1);
  for(const post of h.posts){assert.equal(post.origin,'https://visible-medicine.invalid');assert.equal(post.message.region,region);assert(!JSON.stringify(post.message).includes(pin));assert.doesNotMatch(JSON.stringify(post.message),/Synthetic|annotationId|points_ras_mm/);}
 }finally{h.cleanup();}}
});

test('explicit body browsing action permits another bundle but old actions retire on newer selection and restore',async()=>{
 const h=harness(),selected:any[]=[];try{
  const proof=bodyInspection('body-browse'),alternate=proof.target.id+'-artery';
  const loaded=await openBody(h,proof,{getMriSelectionLabel:(s:any)=>s.target.id===alternate?'Artery':null,onSelectMri:(s:any)=>selected.push(s)});
  h.message(bodySnapshot(proof,loaded.session,1));loaded.ack();h.message(bodySnapshot(proof,loaded.session,2));
  h.message(bodySnapshot(proof,loaded.session,3,alternate,'9'.repeat(64)));h.render();assert.match(h.status(),/Viewing another model selection/);
  const click=h.button('Show Artery on MRI').props.onClick;assert.equal(selected.length,0);click();assert.equal(selected.length,1);assert.equal(selected[0].target.source,'9'.repeat(64));
  h.message(bodySnapshot(proof,loaded.session,4,alternate+'-unmapped'));click();h.render();assert.equal(selected.length,1);assert.match(h.status(),/No supported MRI link/);
  h.button('Restore requested selection').props.onClick();h.render();assert.notEqual(h.posts.at(-1).message.session,loaded.session);assert.equal(h.reverseActions().length,0);
  h.message(bodySnapshot(proof,loaded.session,5,alternate));h.render();assert.equal(h.reverseActions().length,0);assert.equal(h.find('iframe').props.src,loaded.frame.props.src);
 }finally{h.cleanup();}
});

test('compatible body reference retains its frame across bundles while replacing the owned channel session',async()=>{
 const h=harness(),selected:any[]=[];try{
  const proof=bodyInspection('body-retain'),next=bodyInspection('body-retain-next','leg','artery','9'.repeat(64));
  const loaded=await openBody(h,proof,{getMriSelectionLabel:()=> 'Next',onSelectMri:(s:any)=>selected.push(s)},{sources:[bundle,'9'.repeat(64)]});
  h.message(bodySnapshot(proof,loaded.session,1));loaded.ack();h.message(bodySnapshot(proof,loaded.session,2));h.render();const stale=h.button('Show Next on MRI').props.onClick;
  h.render({inspection:next});stale();h.render();assert.equal(selected.length,0);assert.equal(h.calls.length,1);assert.equal(h.find('iframe').key,loaded.frame.key);assert.equal(h.find('iframe').props.src,loaded.frame.props.src);
  const renewed=h.posts.at(-1).message.session;assert.notEqual(renewed,loaded.session);h.message(bodySnapshot(proof,loaded.session,3));h.render();assert.equal(h.reverseActions().length,0);
  h.message(bodySnapshot(next,renewed,1));h.message({type:'vm-body-semantic-focus-result',version:1,revision:atlas,region:'leg',session:renewed,command:1,status:'accepted'});h.message(bodySnapshot(next,renewed,2));h.render();assert.match(h.status(),/Model reports/);
  h.hidden(true);h.button('Show Next on MRI').props.onClick();h.render();assert.equal(selected.length,0);h.hidden(false);h.render();assert.equal(h.reverseActions().length,0);
 }finally{h.cleanup();}
});

test('a compatible body target missing from the cached verified manifest closes rather than borrowing a bundle',async()=>{
 const h=harness();try{
  const proof=bodyInspection('body-manifest'),loaded=await openBody(h,proof,{}, {sources:[bundle]});
  h.message(bodySnapshot(proof,loaded.session,1));loaded.ack();h.message(bodySnapshot(proof,loaded.session,2));h.render();const sent=h.posts.length;
  h.render({inspection:bodyInspection('body-missing-bundle','leg','artery','9'.repeat(64))});h.render();
  assert.equal(h.count('iframe'),0);assert.match(h.status(),/could not load|source changed/);assert.equal(h.posts.length,sent);assert.equal(h.reverseActions().length,0);assert.equal(h.calls.length,1);
 }finally{h.cleanup();}
});

test('a pending manifest also verifies the latest compatible body target before showing a frame',async()=>{
 const h=harness();try{
  const proof=bodyInspection('body-pending'),next=bodyInspection('body-pending-next','leg','artery','9'.repeat(64));h.render({inspection:proof});h.render({inspection:next});
  assert.equal(h.calls.length,1);h.answer(0,true,{sources:[bundle]});await flush();h.render();assert.equal(h.count('iframe'),0);assert.match(h.status(),/could not load|source changed/);assert.equal(h.posts.length,0);
 }finally{h.cleanup();}
});

test('changing from root body to independent specimen uses a new protocol and retires old body actions',async()=>{
 const h=harness(),selected:any[]=[];try{
  const proof=bodyInspection('body-to-specimen'),loaded=await openBody(h,proof,{getMriSelectionLabel:()=> 'Body',onSelectMri:(s:any)=>selected.push(s)});
  h.message(bodySnapshot(proof,loaded.session,1));loaded.ack();h.message(bodySnapshot(proof,loaded.session,2));h.render();const stale=h.button('Show Body on MRI').props.onClick;
  h.render({inspection:inspection('new-specimen','specimen')});stale();h.render();assert.equal(selected.length,0);assert.equal(h.count('iframe'),0);
  h.message(bodySnapshot(proof,loaded.session,3));h.answer(1);await flush();h.render();const frame=h.frame();frame.props.onLoad({currentTarget:frame.props.ref.current});h.render();
  assert.equal(h.posts.at(-1).message.type,'vm-specimen-selection-request');assert(!('region' in h.posts.at(-1).message));assert.equal(h.reverseActions().length,0);
 }finally{h.cleanup();}
});

test('same root ID with another source bundle is browsing and can restore the exact requested source',async()=>{
 const h=harness(),selected:any[]=[];try{
  const proof=bodyInspection('same-root-another-source'),loaded=await openBody(h,proof,{
   getMriSelectionLabel:(s:any)=>s.target.source===bundle?'Requested':null,onSelectMri:(s:any)=>selected.push(s),
  });
  h.message(bodySnapshot(proof,loaded.session,1));loaded.ack();h.message(bodySnapshot(proof,loaded.session,2));h.render();
  assert.match(h.status(),/Model reports this named selection/);const stale=h.button('Show Requested on MRI').props.onClick;
  h.message(bodySnapshot(proof,loaded.session,3,proof.target.id,'9'.repeat(64)));h.render();
  assert.match(h.status(),/Viewing another model selection/);assert.match(h.status(),/No supported MRI link/);
  assert.doesNotMatch(h.status(),/Model reports this named selection|camera completed/);assert.equal(h.reverseActions().length,0);
  stale();assert.equal(selected.length,0);h.button('Restore requested selection').props.onClick();h.render();
  const renewed=h.posts.at(-1).message.session;assert.notEqual(renewed,loaded.session);
  h.message(bodySnapshot(proof,loaded.session,4));h.render();assert.doesNotMatch(h.status(),/Model reports this named selection/);
  h.message(bodySnapshot(proof,renewed,1));h.message({type:'vm-body-semantic-focus-result',version:1,revision:atlas,region:'leg',session:renewed,command:1,status:'accepted'});
  h.message(bodySnapshot(proof,renewed,2));h.render();assert.match(h.status(),/Model reports this named selection/);
  assert.doesNotMatch(h.status(),/Viewing another|camera completed/);assert.equal(selected.length,0);
  assert.equal(h.find('iframe').key,loaded.frame.key);assert.equal(h.find('iframe').props.src,loaded.frame.props.src);
 }finally{h.cleanup();}
});
