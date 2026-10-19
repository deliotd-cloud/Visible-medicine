import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import * as workingCopy from '../lib/regional-mri-working-copy.ts';

type Node={type:any;props:Record<string,any>};
const hash=(c:string)=>c.repeat(64);
const context={schema:'vm-regional-mri-correction-context-1',sourceRevision:hash('a'),projectionRevision:hash('b'),region:'knee',laterality:'left',sequenceId:'seq',sequenceLabel:'Synthetic sequence',imageSha256:hash('c'),annotation:{id:'ann',anatomyId:'anat.knee',label:'Synthetic annotation',laterality:'left',coverage:'partial',reviewStatus:'accepted-scoped',reviewRevision:hash('d'),reviewScope:'Synthetic scope',geometryKind:'mask',gridKind:'source-native',geometryMappingRevision:hash('e'),geometrySourceSha256:hash('f')},clinicalApproval:false,publicationApproval:false,patientRegistration:false};
const draft={status:'draft',notes:'',checks:{identity:false,extent:false,sourceScope:false},attested:false};
const event=(version:number,notes='saved')=>({eventSchema:'vm-regional-mri-correction-event-1',context,version,savedAt:'2026-10-13T10:00:00.000Z',draft:{...draft,notes}});
const props={sourceRevision:context.sourceRevision,projectionRevision:context.projectionRevision,sequenceId:'seq',annotationId:'ann'};
const token=hash('1'),otherToken=hash('2');
const nodes=(value:any):Node[]=>Array.isArray(value)?value.flatMap(nodes):value?.props?[value,...nodes(value.props.children)]:[];
const words=(value:any):string=>Array.isArray(value)?value.map(words).join(''):value?.props?words(value.props.children):value==null?'':String(value);
const tick=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
const source=readFileSync(new URL('../components/RegionalMriCorrectionPanel.tsx',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function harness(onDirtyChange?:(dirty:boolean)=>void){
 const mod={exports:{} as any},calls:Array<{url:string;options:any;resolve:(response:any)=>void}>=[],downloads:workingCopy.RegionalMriWorkingCopy[]=[];
 let cursor=0,slots:any[]=[],pending=new Map<number,{kind:string;fn:()=>any;deps?:any[]}>(),effects=new Map<number,{kind:string;fn:()=>any;deps?:any[];cleanup?:()=>void}>(),tree:Node,selection={...props,onDirtyChange};
 const same=(a?:any[],b?:any[])=>!!a&&!!b&&a.length===b.length&&a.every((v,i)=>Object.is(v,b[i]));
 const hooks={useState(initial:any){const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return [slots[i],(next:any)=>{slots[i]=typeof next==='function'?next(slots[i]):next}]},useRef(initial:any){const i=cursor++;if(!(i in slots))slots[i]={current:initial};return slots[i]},useLayoutEffect(fn:()=>any,deps?:any[]){pending.set(cursor++,{kind:'layout',fn,deps})},useEffect(fn:()=>any,deps?:any[]){pending.set(cursor++,{kind:'passive',fn,deps})}};
 const jsx=(type:any,props:any)=>({type,props});
 const parseContext=(v:any)=>{if(JSON.stringify(v)!==JSON.stringify(context))throw Error('context');return v;};
 const parseEvent=(v:any)=>{parseContext(v?.context);if(v?.eventSchema!=='vm-regional-mri-correction-event-1'||!Number.isSafeInteger(v.version)||v.version<1||v.draft?.attested!==false)throw Error('event');return v;};
 const imports:Record<string,any>={react:hooks,'react/jsx-runtime':{jsx,jsxs:jsx},'../lib/regional-mri-correction-contract':{parseRegionalMriCorrectionContext:parseContext,parseRegionalMriCorrectionEvent:parseEvent,sameRegionalMriCorrectionContext:(a:any,b:any)=>JSON.stringify(a)===JSON.stringify(b),validateRegionalMriCorrectionDraft:(v:any)=>{if(v.status==='changes-required'&&v.notes.trim().length<10||v.notes.length>6000||v.attested!==false)throw Error('draft');return v;}}};
 imports['../lib/regional-mri-working-copy']={...workingCopy,downloadRegionalMriWorkingCopy:(copy:workingCopy.RegionalMriWorkingCopy)=>downloads.push(copy)};
 new Function('require','module','exports',code)((id:string)=>{assert(Object.hasOwn(imports,id),id);return imports[id];},mod,mod.exports);
 const oldFetch=globalThis.fetch;globalThis.fetch=((url:any,options:any)=>new Promise(resolve=>calls.push({url:String(url),options,resolve}))) as typeof fetch;
 function render(next?:Partial<typeof props>,commit=true){if(next)selection={...selection,...next};cursor=0;pending=new Map();const result=mod.exports.RegionalMriCorrectionPanel(selection);if(commit){tree=result;for(const kind of ['layout','passive'])for(const [i,item] of pending){if(item.kind!==kind)continue;const old=effects.get(i);if(!same(old?.deps,item.deps)){old?.cleanup?.();effects.set(i,{...item,cleanup:item.fn()});}}}return result;}
 const find=(type:string,match:(n:Node)=>boolean=()=>true)=>{const node=nodes(tree).find(n=>n.type===type&&match(n));assert(node,`missing ${type}`);return node;};
 const button=(label:string)=>find('button',n=>words(n).includes(label));
 const open=()=>{find('details').props.onToggle({currentTarget:{open:true}});render();};
 const answer=(i:number,body:any={context,history:[],latestVersion:0,nextBefore:null,scope:'private-to-signed-in-account-and-institution'},status=200,claim=token)=>{calls[i].resolve({status,ok:status>=200&&status<300,headers:new Headers(claim?{'X-Clinical-Review-Context':claim}:{}),json:async()=>body});};
 const strictReplay=()=>{for(const effect of effects.values())effect.cleanup?.();for(const kind of ['layout','passive'])for(const effect of effects.values())if(effect.kind===kind)effect.cleanup=effect.fn();};
 const cleanup=()=>{for(const e of effects.values())e.cleanup?.();globalThis.fetch=oldFetch;};
 return {render,find,button,open,answer,calls,downloads,cleanup,strictReplay,tree:()=>tree};
}

test('closed default, exact private headers, initial draft save and inspection-only wording',async()=>{const h=harness();try{
 h.render();assert.equal(h.calls.length,0);h.open();assert.equal(h.calls.length,1);
 const get=h.calls[0];assert.equal(get.url,'/api/atlas-review/regional-mri');assert.equal(get.options.credentials,'same-origin');assert.equal(get.options.cache,'no-store');assert.equal(get.options.headers['X-Regional-MRI-Annotation'],'ann');assert(!get.url.includes('ann'));
 h.answer(0);await tick();h.render();assert.match(words(h.tree()),/not clinical acceptance/);
 h.find('textarea').props.onChange({currentTarget:{value:'Correct source extent'}});h.render();h.button('Save private draft').props.onClick();assert.equal(h.calls.length,2);const post=h.calls[1];assert.equal(post.options.headers['X-Clinical-Review-Context'],token);assert.equal(post.options.method,'POST');assert.deepEqual(JSON.parse(post.options.body),{context,expectedVersion:0,draft:{...draft,notes:'Correct source extent'}});
 h.answer(1,{review:event(1,'Correct source extent')},201);await tick();h.render();assert.match(words(h.tree()),/draft saved/);assert.equal(h.button('Save private draft').props.disabled,false);
 }finally{h.cleanup();}});

test('competing or uncertain save holds edits until reload and explicit comparison',async()=>{const h=harness();try{
 h.render();h.open();h.answer(0);await tick();h.render();h.find('textarea').props.onChange({currentTarget:{value:'Keep these edits'}});h.render();h.button('Save private draft').props.onClick();h.answer(1,{},409);await tick();h.render();assert.equal(h.find('textarea').props.value,'Keep these edits');assert(h.button('Save private draft').props.disabled);
 h.button('Reload latest history').props.onClick();h.answer(2,{context,history:[event(1,'other')],latestVersion:1,nextBefore:null,scope:'private-to-signed-in-account-and-institution'});await tick();h.render();assert(h.button('Save private draft').props.disabled);h.button('Keep my edits against latest history').props.onClick();h.render();h.button('Save private draft').props.onClick();assert.equal(JSON.parse(h.calls[3].options.body).expectedVersion,1);
 h.answer(3,{bad:true},201);await tick();h.render();assert(h.button('Save private draft').props.disabled);assert.equal(h.find('textarea').props.value,'Keep these edits');
 }finally{h.cleanup();}});

test('late selection response, identity change, invalid page and abandoned render fail closed',async()=>{const h=harness();try{
 h.render();h.open();const pending=h.calls[0];h.render({annotationId:'other'});assert(pending.options.signal.aborted);h.answer(0);await tick();h.render();assert.equal(nodes(h.tree()).filter(n=>n.type==='textarea').length,0);
 h.render({...props});h.open();h.answer(1);await tick();h.render();h.find('textarea').props.onChange({currentTarget:{value:'Retained edits'}});h.render();h.button('Save private draft').props.onClick();h.answer(2,{review:event(1,'Retained edits')},201,otherToken);await tick();h.render();assert.equal(h.find('details').props.open,false);
 const abandoned=h.render({sequenceId:'abandoned'},false);assert(abandoned);assert.equal(h.calls.length,3);h.render({...props});
 }finally{h.cleanup();}});

test('abandoned-render handlers and retired selection cannot issue writes',async()=>{const h=harness();try{
 h.render();h.open();h.answer(0);await tick();h.render();const committedSave=h.button('Save private draft').props.onClick;
 const abandoned=h.render({...props},false);const abandonedSave=nodes(abandoned).find(n=>n.type==='button'&&words(n).includes('Save private draft'))?.props.onClick;assert(abandonedSave);
 abandonedSave();assert.equal(h.calls.length,1);h.render({...props});committedSave();assert.equal(h.calls.length,1,'older committed handler retires when a new render commits');
 h.render({annotationId:'different'});committedSave();assert.equal(h.calls.length,1);
 }finally{h.cleanup();}});

test('history cursor and forged response cannot change draft base',async()=>{const h=harness();try{
 h.render();h.open();h.answer(0,{context,history:Array.from({length:20},(_,i)=>event(21-i)),latestVersion:21,nextBefore:2,scope:'private-to-signed-in-account-and-institution'});await tick();h.render();h.find('textarea').props.onChange({currentTarget:{value:'Local newer edit'}});h.render();h.button('Load older history').props.onClick();assert.equal(h.calls[1].options.headers['X-Regional-MRI-Before'],'2');h.answer(1,{context,history:[event(1)],latestVersion:21,nextBefore:null,scope:'private-to-signed-in-account-and-institution'});await tick();h.render();assert.equal(h.find('textarea').props.value,'Local newer edit');h.button('Save private draft').props.onClick();assert.equal(JSON.parse(h.calls[2].options.body).expectedVersion,21);
 h.answer(2,{review:{...event(22),context:{...context,sequenceId:'forged'}}},201);await tick();h.render();assert(h.button('Save private draft').props.disabled);
 }finally{h.cleanup();}});

test('dirty callback is immediate for edits and clears only after confirmed save',async()=>{const dirty:boolean[]=[];const h=harness(value=>dirty.push(value));try{
 h.render();h.open();h.answer(0);await tick();h.render();assert.equal(dirty.at(-1),false);
 h.find('textarea').props.onChange({currentTarget:{value:'A local correction'}});assert.equal(dirty.at(-1),true);h.render();
 h.button('Save private draft').props.onClick();h.answer(1,{review:event(1,'A local correction')},201);await tick();h.render();assert.equal(dirty.at(-1),false);
 }finally{h.cleanup();}});

test('StrictMode replay retries an interrupted load and quarantines an interrupted save',async()=>{const h=harness();try{
 h.render();h.open();assert.equal(h.calls.length,1);h.strictReplay();assert(h.calls[0].options.signal.aborted);assert.equal(h.calls.length,2);h.answer(0);h.answer(1);await tick();h.render();
 h.find('textarea').props.onChange({currentTarget:{value:'Keep interrupted edit'}});h.render();h.button('Save private draft').props.onClick();assert.equal(h.calls.length,3);h.strictReplay();h.render();assert(h.calls[2].options.signal.aborted);assert(h.button('Save private draft').props.disabled);assert.equal(h.find('textarea').props.value,'Keep interrupted edit');
 }finally{h.cleanup();}});

test('initial history failure exposes an in-place retry before context exists',async()=>{const h=harness();try{
 h.render();h.open();h.answer(0,{},503);await tick();h.render();assert.equal(nodes(h.tree()).filter(n=>n.type==='textarea').length,0);
 h.button('Reload latest history').props.onClick();assert.equal(h.calls.length,2);h.answer(1);await tick();h.render();assert(h.find('textarea'));assert.equal(h.button('Save private draft').props.disabled,false);
 }finally{h.cleanup();}});

test('clean same-account reopening adopts newest saved draft and version',async()=>{const h=harness();try{
 h.render();h.open();h.answer(0,{context,history:[event(1,'first saved note')],latestVersion:1,nextBefore:null,scope:'private-to-signed-in-account-and-institution'});await tick();h.render();assert.equal(h.find('textarea').props.value,'first saved note');
 h.find('details').props.onToggle({currentTarget:{open:false}});h.render();h.open();h.answer(1,{context,history:[event(2,'newer saved note'),event(1,'first saved note')],latestVersion:2,nextBefore:null,scope:'private-to-signed-in-account-and-institution'});await tick();h.render();assert.equal(h.find('textarea').props.value,'newer saved note');h.button('Save private draft').props.onClick();assert.equal(JSON.parse(h.calls[2].options.body).expectedVersion,2);
 }finally{h.cleanup();}});

test('untouched in-flight save is synchronously dirty and warns before unload',async()=>{const dirty:boolean[]=[],listeners=new Set<Function>(),previousWindow=(globalThis as any).window;
 (globalThis as any).window={addEventListener:(name:string,fn:Function)=>{if(name==='beforeunload')listeners.add(fn);},removeEventListener:(name:string,fn:Function)=>{if(name==='beforeunload')listeners.delete(fn);}};
 const h=harness(value=>dirty.push(value));try{
 h.render();h.open();h.answer(0);await tick();h.render();assert.equal(dirty.at(-1),false);assert.equal(listeners.size,0);
 h.button('Save private draft').props.onClick();assert.equal(dirty.at(-1),true,'save becomes dirty before the next render');h.render();assert.equal(listeners.size,1);
 h.answer(1,{review:event(1,'')},201);await tick();h.render();assert.equal(dirty.at(-1),false);assert.equal(listeners.size,0);
 }finally{h.cleanup();if(previousWindow===undefined)delete (globalThis as any).window;else (globalThis as any).window=previousWindow;}});

test('retired source keeps copyable notes, aborts pending write and forbids further actions',async()=>{const h=harness();try{
 h.render();h.open();h.answer(0);await tick();h.render();h.find('textarea').props.onChange({currentTarget:{value:'Retain this source correction'}});h.render();
 const oldSave=h.button('Save private draft').props.onClick;oldSave();h.render();const pending=h.calls[1];
 h.render({sourceRetired:true} as any);assert(pending.options.signal.aborted);assert.equal(h.find('details').props.open,true);
 const notes=h.find('textarea');assert.equal(notes.props.value,'Retain this source correction');assert.equal(notes.props.readOnly,true);assert.equal(notes.props.disabled,false);
 assert.equal(h.button('Save private draft').props.disabled,true);oldSave();h.button('Save private draft').props.onClick();assert.equal(h.calls.length,2);
 h.answer(1,{review:event(1,'Retain this source correction')},201);await tick();h.render();assert.equal(h.find('textarea').props.value,'Retain this source correction');
 assert.match(words(h.tree()),/Retained previous-source draft/);
 }finally{h.cleanup();}});

const localCopy=(notes='Restored private edit',account=token,version=77)=>workingCopy.regionalMriWorkingCopy(context as any,{...draft,notes} as any,
 {baseVersion:version,unsavedChanges:true,saveUncertain:true,reloadRequired:true},account,'2026-10-13T20:00:00.000Z');
const copyFile=(copy:unknown)=>{const text=JSON.stringify(copy);return{name:'working-copy.json',size:new TextEncoder().encode(text).byteLength,text:async()=>text};};
function restoreFile(h:ReturnType<typeof harness>,file:any){const input=h.find('input',n=>n.props.type==='file');input.props.onChange({currentTarget:{files:[file],value:'chosen'}});}

test('working copy downloads unfinished edits locally without saving or uploading',async()=>{const h=harness();try{
 h.render();h.open();h.answer(0);await tick();h.render();
 h.find('select').props.onChange({currentTarget:{value:'changes-required'}});h.render();h.find('textarea').props.onChange({currentTarget:{value:'  x\n '}});h.render();
 const disclosure=h.find('details',n=>words(n).includes('Private working copy · keep unfinished notes')&&n.props.open===undefined);assert(disclosure);
 h.button('Download private working copy').props.onClick();assert.equal(h.downloads.length,1);assert.equal(h.calls.length,1);
 assert.equal(h.downloads[0].workingDraft.notes,'  x\n ');assert.equal(h.downloads[0].workingDraft.status,'changes-required');assert.equal(h.downloads[0].serverSaveConfirmed,false);
 assert.equal(h.downloads[0].editState.unsavedChanges,true);assert.equal(h.downloads[0].clinicalApproval,false);
 }finally{h.cleanup();}});

test('restored working copy stays quarantined until fresh history and explicit current-version comparison',async()=>{const h=harness();try{
 h.render();h.open();h.answer(0);await tick();h.render();restoreFile(h,copyFile(localCopy()));await tick();h.render();
 assert.equal(h.find('textarea').props.value,'Restored private edit');assert(h.button('Save private draft').props.disabled);assert.equal(h.calls.length,1,'file is not uploaded');
 h.button('Reload latest history').props.onClick();h.answer(1,{context,history:[event(4),event(3),event(2),event(1)],latestVersion:4,nextBefore:null,scope:'private-to-signed-in-account-and-institution'});await tick();h.render();
 assert.equal(h.find('textarea').props.value,'Restored private edit');assert(h.button('Save private draft').props.disabled);
 h.button('Keep my edits against latest history').props.onClick();h.render();h.button('Save private draft').props.onClick();
 assert.equal(JSON.parse(h.calls[2].options.body).expectedVersion,4,'recorded file version77 is never adopted');assert.equal(JSON.parse(h.calls[2].options.body).draft.attested,false);
 }finally{h.cleanup();}});

test('wrong-account or altered-source copy keeps existing draft without network or authority changes',async()=>{const h=harness();try{
 h.render();h.open();h.answer(0);await tick();h.render();h.find('textarea').props.onChange({currentTarget:{value:'Existing edit'}});h.render();
 for(const copy of [localCopy('wrong',otherToken),{...localCopy(),context:{...context,projectionRevision:hash('9')}},{...localCopy(),clinicalApproval:true}]){
  restoreFile(h,copyFile(copy));await tick();h.render();assert.equal(h.find('textarea').props.value,'Existing edit');assert.equal(h.calls.length,1);
  assert.match(words(h.tree()),/Existing edits were kept/);
 }
 }finally{h.cleanup();}});

test('late local file read retires on selection change and cannot restore into a new source',async()=>{const h=harness();try{
 h.render();h.open();h.answer(0);await tick();h.render();let complete!:(value:string)=>void;
 restoreFile(h,{name:'working-copy.json',size:100,text:()=>new Promise<string>(resolve=>{complete=resolve;})});h.render({annotationId:'other'});
 complete(JSON.stringify(localCopy()));await tick();h.render();assert.equal(nodes(h.tree()).filter(n=>n.type==='textarea').length,0);assert.equal(h.calls.length,1);
 }finally{h.cleanup();}});

test('declining overwrite keeps current notes and in-flight/retired inputs cannot read files',async()=>{const previousWindow=(globalThis as any).window;let prompts=0,reads=0;
 (globalThis as any).window={confirm:()=>{prompts++;return false;},addEventListener(){},removeEventListener(){}};const h=harness();try{
 h.render();h.open();h.answer(0);await tick();h.render();h.find('textarea').props.onChange({currentTarget:{value:'Keep my current notes'}});h.render();
 restoreFile(h,copyFile(localCopy()));await tick();h.render();assert.equal(prompts,1);assert.equal(h.find('textarea').props.value,'Keep my current notes');
 h.button('Save private draft').props.onClick();h.render();const unread={name:'working-copy.json',size:100,text:async()=>{reads++;return JSON.stringify(localCopy());}};
 assert.equal(h.find('input',n=>n.props.type==='file').props.disabled,true);restoreFile(h,unread);await tick();assert.equal(reads,0);
 h.render({sourceRetired:true} as any);restoreFile(h,unread);await tick();assert.equal(reads,0);h.button('Download private working copy').props.onClick();assert.equal(h.downloads.length,1);
 assert.equal(h.downloads[0].editState.saveUncertain,true);assert.equal(h.downloads[0].editState.reloadRequired,true);
 }finally{h.cleanup();if(previousWindow===undefined)delete (globalThis as any).window;else (globalThis as any).window=previousWindow;}});

test('closed dirty disclosure retains recovery context across soft source retirement',async()=>{const h=harness();try{
 h.render();h.open();h.answer(0);await tick();h.render();h.find('textarea').props.onChange({currentTarget:{value:'Recover after source refresh'}});h.render();
 h.find('details').props.onToggle({currentTarget:{open:false}});h.render({sourceRetired:true} as any);
 assert.equal(h.find('textarea').props.value,'Recover after source refresh');h.button('Download private working copy').props.onClick();
 assert.equal(h.downloads[0].workingDraft.notes,'Recover after source refresh');assert.equal(h.calls.length,1);
 }finally{h.cleanup();}});

test('restore uses the latest committed parent dirty callback after a same-source rerender',async()=>{const first:boolean[]=[],latest:boolean[]=[],h=harness(value=>first.push(value));try{
 h.render();h.open();h.answer(0);await tick();h.render();let complete!:(value:string)=>void;
 restoreFile(h,{name:'working-copy.json',size:100,text:()=>new Promise<string>(resolve=>{complete=resolve;})});
 h.render({onDirtyChange:(value:boolean)=>latest.push(value)} as any);complete(JSON.stringify(localCopy()));await tick();
 assert.equal(latest.at(-1),true,'parent discard guard is notified before the restored draft render');h.render();assert.equal(h.find('textarea').props.value,'Restored private edit');
 }finally{h.cleanup();}});
