import assert from 'node:assert/strict';
import test from 'node:test';
import {regionalMriCorrectionContext,validateRegionalMriCorrectionDraft} from '../lib/regional-mri-correction-contract.ts';
import {regionalMriWorkingCopy,restoreRegionalMriWorkingCopy,readRegionalMriWorkingCopy,downloadRegionalMriWorkingCopy} from '../lib/regional-mri-working-copy.ts';

const account='9'.repeat(64),createdAt='2026-10-13T21:00:00.000Z';
const projection:any={sourceRevision:'a'.repeat(64),projectionRevision:'b'.repeat(64),region:'knee',laterality:'left',series:[{id:'axial',label:'Synthetic axial',imageSha256:'c'.repeat(64),annotations:[{
 id:'one',anatomyId:'knee.test',label:'Synthetic structure',laterality:'left',coverage:'partial',reviewStatus:'provisional',reviewRevision:'d'.repeat(64),reviewScope:'Synthetic source only',
 geometryKind:'mask',gridKind:'derived-source-ras',geometryMappingRevision:'e'.repeat(64),geometrySourceSha256:'f'.repeat(64)}]}]};
const context=()=>regionalMriCorrectionContext(projection,'axial','one')!;
const draft=()=>({status:'changes-required' as const,notes:'  x\n  ',checks:{identity:false,extent:true,sourceScope:false},attested:false as const});
const state=()=>({baseVersion:7,unsavedChanges:true,saveUncertain:true,reloadRequired:true});
const copy=()=>regionalMriWorkingCopy(context(),draft(),state(),account,createdAt);
const altered=(key:string,value:unknown)=>({...structuredClone(copy()),[key]:value});

test('unfinished correction round trips exactly as local text, not a saved event or authority',()=>{
 assert.throws(()=>validateRegionalMriCorrectionDraft(draft()));
 const value=copy(),restored=restoreRegionalMriWorkingCopy(JSON.parse(JSON.stringify(value)),context(),account);
 assert.equal(restored.workingDraft.notes,'  x\n  ');assert.equal(restored.workingDraft.status,'changes-required');
 assert.deepEqual(restored.editState,state());assert.equal(restored.editState.baseVersion,7);
 assert.equal(restored.localOnly,true);
 for(const key of ['serverSaveConfirmed','clinicalApproval','publicationApproval','patientRegistration'] as const)assert.equal(restored[key],false);
 assert.match(restored.warning,/never authorize a save/);assert.equal((restored as any).version,undefined);
 assert(Object.isFrozen(restored));assert(Object.isFrozen(restored.context));assert(Object.isFrozen(restored.workingDraft));
});

test('restore requires exact account and every context field including source and geometry revisions',()=>{
 const value=copy(),current=context();
 assert.throws(()=>restoreRegionalMriWorkingCopy(value,current,'8'.repeat(64)));
 assert.throws(()=>restoreRegionalMriWorkingCopy(value,current,'not-an-account-token'));
 for(const key of Object.keys(current)){
  if(key==='annotation')continue;
  const changed:any=structuredClone(current);changed[key]=typeof changed[key]==='boolean'?true:key.endsWith('Revision')||key==='imageSha256'?'1'.repeat(64):'other';
  assert.throws(()=>restoreRegionalMriWorkingCopy(value,changed,account),`context ${key}`);
 }
 for(const key of Object.keys(current.annotation)){
  const changed:any=structuredClone(current);changed.annotation[key]=changed.annotation[key]===null?'1'.repeat(64):typeof changed.annotation[key]==='string'&&changed.annotation[key].length===64?'1'.repeat(64):'other';
  assert.throws(()=>restoreRegionalMriWorkingCopy(value,changed,account),`annotation ${key}`);
 }
 for(const changed of [altered('accountContext','not-a-hash'),altered('context',{...current,pixels:[]}),altered('assetPath','private'),altered('clinicalApproval',true),altered('publicationApproval',true),altered('patientRegistration',true),altered('serverSaveConfirmed',true),altered('localOnly',false),altered('warning','safe')])
  assert.throws(()=>restoreRegionalMriWorkingCopy(changed,current,account));
});

test('strict draft, state, dates, versions and unknown keys are refused',()=>{
 const value=copy(),c=context();
 for(const status of ['approved','accepted','saved'])assert.throws(()=>restoreRegionalMriWorkingCopy(altered('workingDraft',{...value.workingDraft,status}),c,account));
 for(const changed of [{...value.workingDraft,attested:true},{...value.workingDraft,mask:[]},{...value.workingDraft,notes:'bad\0note'},{...value.workingDraft,notes:'x'.repeat(6001)},{...value.workingDraft,checks:{...value.workingDraft.checks,sourceScope:'yes'}},{...value.workingDraft,checks:{...value.workingDraft.checks,registration:true}}])
  assert.throws(()=>restoreRegionalMriWorkingCopy(altered('workingDraft',changed),c,account));
 for(const baseVersion of [-1,0.5,2147483648,'7'])assert.throws(()=>restoreRegionalMriWorkingCopy(altered('editState',{...value.editState,baseVersion}),c,account));
 for(const changed of [{...value.editState,unsavedChanges:'true'},{...value.editState,saveUncertain:1},{...value.editState,reloadRequired:null},{...value.editState,extra:true}])
  assert.throws(()=>restoreRegionalMriWorkingCopy(altered('editState',changed),c,account));
 for(const date of ['2026-02-30T21:00:00.000Z','2026-10-13T21:00:00Z','invalid'])assert.throws(()=>restoreRegionalMriWorkingCopy(altered('createdAt',date),c,account));
 assert.equal(regionalMriWorkingCopy(c,draft(),{...state(),baseVersion:null},account,createdAt).editState.baseVersion,null);
 assert.equal(regionalMriWorkingCopy(c,draft(),{...state(),baseVersion:0},account,createdAt).editState.baseVersion,0);
});

test('file reader refuses suffix, declared/actual size, invalid JSON and abort around text without network',async()=>{
 const c=context(),valid=JSON.stringify(copy());let reads=0;
 const file=(name:string,size:number,text:string)=>({name,size,async text(){reads++;return text;}});
 const read=(f:any,signal?:AbortSignal)=>readRegionalMriWorkingCopy(f,c,account,signal);
 for(const f of [file('copy.txt',valid.length,valid),file('copy.json',0,valid),file('copy.json',65537,valid),file('copy.json',1.5,valid)])await assert.rejects(read(f));
 assert.equal(reads,0,'declared bad files must not be read');
 await assert.rejects(read(file('copy.JSON',1,'not json')));assert.equal(reads,1);
 await assert.rejects(read(file('copy.json',1,'🙂'.repeat(20000))));assert.equal(reads,2,'UTF-8 bytes after read must be bounded');
 await assert.rejects(read(file('copy.json',1,'x'.repeat(65537))));assert.equal(reads,3);
 const before=new AbortController();before.abort();await assert.rejects(read(file('copy.json',valid.length,valid),before.signal),/cancelled/);assert.equal(reads,3);
 const pending=new AbortController();let release!:(text:string)=>void;const waiting={name:'copy.json',size:valid.length,text:()=>{reads++;return new Promise<string>(resolve=>{release=resolve;});}};
 const promise=read(waiting,pending.signal);pending.abort();release(valid);await assert.rejects(promise,/cancelled/);
 assert.deepEqual(await read(file('copy.json',valid.length,valid)),copy());
});

test('browser download makes a generic local JSON blob and releases URL on success and exceptions',async()=>{
 const originalDocument=Object.getOwnPropertyDescriptor(globalThis,'document'),originalStorage=Object.getOwnPropertyDescriptor(globalThis,'localStorage'),originalFetch=Object.getOwnPropertyDescriptor(globalThis,'fetch'),create=URL.createObjectURL,revoke=URL.revokeObjectURL,timeout=globalThis.setTimeout;
 const blobs:Blob[]=[],revoked:string[]=[],callbacks:Array<()=>void>=[];let failAt='';let appended=0,removed=0,clicked=0;
 const anchor:any={href:'',download:'',hidden:false,remove(){removed++;},click(){clicked++;if(failAt==='click')throw Error('click failed');}};
 try{
  Object.defineProperty(globalThis,'document',{configurable:true,value:{createElement(name:string){assert.equal(name,'a');if(failAt==='create')throw Error('create failed');return anchor;},body:{appendChild(a:unknown){assert.equal(a,anchor);appended++;if(failAt==='append')throw Error('append failed');}}}});
  Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw Error('localStorage touched');}});
  Object.defineProperty(globalThis,'fetch',{configurable:true,value(){throw Error('network touched');}});
  URL.createObjectURL=((blob:Blob)=>{blobs.push(blob);return 'blob:synthetic';}) as typeof URL.createObjectURL;
  URL.revokeObjectURL=(url:string)=>{revoked.push(url);};
  globalThis.setTimeout=((fn:()=>void,delay:number)=>{assert.equal(delay,1000);if(failAt==='timer')throw Error('timer failed');callbacks.push(fn);return 1;}) as unknown as typeof setTimeout;
  downloadRegionalMriWorkingCopy(copy());
  assert.equal(blobs[0].type,'application/json');assert.deepEqual(JSON.parse(await blobs[0].text()),copy());
  assert.equal(anchor.download,'visible-medicine-regional-mri-working-copy-2026-10-13T21-00-00.000Z.json');
  assert(!anchor.download.includes(account));assert(!anchor.download.includes('knee'));assert.equal(clicked,1);assert.equal(removed,1);assert.equal(appended,1);
  callbacks.shift()!();assert.deepEqual(revoked,['blob:synthetic']);
  for(const place of ['create','append','click','timer']){failAt=place;assert.throws(()=>downloadRegionalMriWorkingCopy(copy()));assert.equal(revoked.length,place==='create'?2:place==='append'?3:place==='click'?4:5,place);}
  assert.equal(removed,4,'created anchors are removed even when append, click or timer throws');
 }finally{
  if(originalDocument)Object.defineProperty(globalThis,'document',originalDocument);else Reflect.deleteProperty(globalThis,'document');
  if(originalStorage)Object.defineProperty(globalThis,'localStorage',originalStorage);else Reflect.deleteProperty(globalThis,'localStorage');
  if(originalFetch)Object.defineProperty(globalThis,'fetch',originalFetch);else Reflect.deleteProperty(globalThis,'fetch');
  URL.createObjectURL=create;URL.revokeObjectURL=revoke;globalThis.setTimeout=timeout;
 }
});
