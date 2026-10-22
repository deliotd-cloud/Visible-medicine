import assert from 'node:assert/strict';
import test from 'node:test';
import {build} from 'esbuild';
import {parseRegionalReferenceDraftContext,regionalReferenceDraftContext,sameRegionalReferenceDraftContext,blankRegionalReferenceDraft,validateRegionalReferenceDraft,parseRegionalReferenceDraftEvent} from '../lib/regional-reference-draft-contract.ts';
import {regionalReferenceDraftHeaders,parseRegionalReferenceDraftHistory,confirmRegionalReferenceDraftSave,regionalReferenceWorkingCopy,downloadRegionalReferenceWorkingCopy,RegionalReferenceSourceChangedError} from '../lib/regional-reference-draft-client.ts';
const clone=<T>(v:T):T=>structuredClone(v);
const raw={schema:'vm-regional-reference-teaching-draft-context-1',atlasRevision:'a'.repeat(40),mappingRevision:'b'.repeat(64),teachingRevision:'c'.repeat(64),target:{id:'vm:anatomy:body:leg:left:bone:left-patella',kind:'body',label:'Left patella',side:'left',sourceHash:'d'.repeat(64),specimenRevision:null,relation:'same-structure'},checklistVersion:'regional-reference-teaching-v1',clinicalApproval:false,publicationApproval:false,patientRegistration:false};
const context=parseRegionalReferenceDraftContext(raw),draft={...blankRegionalReferenceDraft(),notes:'Synthetic correction'},event=(version=1,c=context,d=draft)=>({eventSchema:'vm-regional-reference-teaching-draft-event-1',context:c,version,savedAt:'2026-10-14T00:00:00.000Z',draft:d});
const history=(events=[event()],latestVersion=events[0]?.version??0,nextBefore:number|null=null,c=context)=>({context:c,history:events,latestVersion,nextBefore,scope:'private-to-signed-in-account-and-institution'});

test('exact public context parses immutably without upgrading recorded revisions or approval',()=>{
 assert(sameRegionalReferenceDraftContext(context,raw));assert(Object.isFrozen(context.target));
 for(const field of Object.keys(raw)){const value=clone(raw) as Record<string,unknown>;delete value[field];assert.throws(()=>parseRegionalReferenceDraftContext(value),Error,field);}
 for(const patch of [{schema:'other'},{atlasRevision:'A'.repeat(40)},{mappingRevision:'x'.repeat(64)},{teachingRevision:''},{checklistVersion:'v2'},{clinicalApproval:true},{publicationApproval:true},{patientRegistration:true},{patientId:'forbidden'}])assert.throws(()=>parseRegionalReferenceDraftContext({...raw,...patch}));
 for(const patch of [{id:'../private/scan'},{id:['one','two']},{kind:'nested'},{label:''},{label:'\0bad'},{side:'midline'},{sourceHash:'wrong'},{specimenRevision:'d'.repeat(64)},{relation:'nearby-reference'},{sourcePath:'private'}])assert.throws(()=>parseRegionalReferenceDraftContext({...raw,target:{...raw.target,...patch}}));
 const old=parseRegionalReferenceDraftContext({...raw,atlasRevision:'e'.repeat(40)});assert.equal(old.atlasRevision,'e'.repeat(40));assert(!sameRegionalReferenceDraftContext(old,context));
 const specimen=parseRegionalReferenceDraftContext({...raw,target:{...raw.target,kind:'specimen',specimenRevision:'f'.repeat(64)}});assert.equal(specimen.target.kind,'specimen');
 assert(!sameRegionalReferenceDraftContext({...raw,target:{...raw.target,label:'Other'}},context));
});

test('draft/event contract is strict, bounded and never accepts approval or registration',()=>{
 const valid=validateRegionalReferenceDraft(draft);assert(Object.isFrozen(valid.checks));assert.equal(valid.notes,draft.notes);
 for(const patch of [{status:'approved'},{attested:true},{notes:'x'.repeat(6001)},{notes:'\0bad'},{clinicalApproval:true},{checks:{...draft.checks,patientRegistration:true}},{checks:{...draft.checks,facts:'yes'}},{status:'changes-required',notes:'short'}])assert.throws(()=>validateRegionalReferenceDraft({...draft,...patch}));
 assert.equal(validateRegionalReferenceDraft({...draft,status:'changes-required',notes:'A sufficient correction.'}).status,'changes-required');
 for(const patch of [{eventSchema:'other'},{version:0},{version:1.2},{version:2147483648},{savedAt:'2026-02-31T00:00:00.000Z'},{savedAt:'2026-10-14'},{approval:true},{context:{...context,clinicalApproval:true}}])assert.throws(()=>parseRegionalReferenceDraftEvent({...event(),...patch}));
 assert.deepEqual(parseRegionalReferenceDraftEvent(event()),event());
});

test('history and save confirmations require exact current context, ordering, cursor and draft',()=>{
 const parsed=parseRegionalReferenceDraftHistory(history(),context);assert.equal(parsed.latestVersion,1);assert.equal(parsed.nextBefore,null);
 for(const patch of [{history:[event(),event()]},{latestVersion:0},{nextBefore:1},{scope:'public'},{approval:true},{history:[event(2),event(3)]},{history:[event(1,{...context,target:{...context.target,label:'Borrowed'}})]}])assert.throws(()=>parseRegionalReferenceDraftHistory({...history(),...patch},context));
 assert.throws(()=>parseRegionalReferenceDraftHistory(history([],0,null,{...context,teachingRevision:'e'.repeat(64)}),context),RegionalReferenceSourceChangedError);
 const twenty=Array.from({length:20},(_,i)=>event(22-i));assert.equal(parseRegionalReferenceDraftHistory(history(twenty,22,3),context).nextBefore,3);
 assert.equal(parseRegionalReferenceDraftHistory(history([event(2),event(1)],22),context,3).latestVersion,22);
 for(const before of [0,1.5,2147483649])assert.throws(()=>parseRegionalReferenceDraftHistory(history(),context,before));
 const confirmed=confirmRegionalReferenceDraftSave({review:event()},context,0,draft);assert.equal(confirmed.version,1);
 for(const value of [{review:event(2)},{review:event(1,{...context,mappingRevision:'f'.repeat(64)})},{review:event(1,context,{...draft,notes:'other'})},{review:event(),approval:true}])assert.throws(()=>confirmRegionalReferenceDraftSave(value,context,0,draft));
});

test('headers and working-copy export include only public reference context plus explicit private notes/state',()=>{
 const headers=regionalReferenceDraftHeaders(context);assert.deepEqual(Object.keys(headers),['X-Reference-Teaching-Target','X-Reference-Teaching-Relation','X-Reference-Teaching-Atlas','X-Reference-Teaching-Mapping','X-Reference-Teaching-Revision']);
 assert.equal(regionalReferenceDraftHeaders(context,3)['X-Reference-Teaching-Before'],'3');assert.throws(()=>regionalReferenceDraftHeaders(context,0));
 const packet=regionalReferenceWorkingCopy(context,draft,{baseVersion:1,unsavedChanges:true,saveUncertain:true});assert.equal(packet.approval,false);assert.equal(packet.state.baseVersion,1);assert(packet.state.saveUncertain);assert(packet.state.unsavedChanges);
 assert.equal(packet.draft.notes,draft.notes);assert(sameRegionalReferenceDraftContext(packet.context,context));
 for(const forbidden of ['mriRevision','imageSha256','annotation','sequenceId','proofKey','sourcePath','patientId'])assert(!JSON.stringify(packet).includes('"'+forbidden+'"'));
 assert.throws(()=>regionalReferenceWorkingCopy(context,draft,{baseVersion:-1,unsavedChanges:true,saveUncertain:false}));
});

test('working-copy download uses generic local filename and cleans links/URLs on success and click failure',async()=>{
 const packet=regionalReferenceWorkingCopy(context,draft,{baseVersion:null,unsavedChanges:true,saveUncertain:true});
 const originalDocument=Object.getOwnPropertyDescriptor(globalThis,'document'),create=URL.createObjectURL,revoke=URL.revokeObjectURL,timeout=globalThis.setTimeout;
 let removed=0,clicked=0,appended=0,revoked=0,shouldThrow=false,scheduled:(()=>void)|null=null,blob:Blob|null=null;const links:any[]=[];
 try{
  URL.createObjectURL=(value:Blob)=>{blob=value;return 'blob:synthetic-local';};URL.revokeObjectURL=url=>{assert.equal(url,'blob:synthetic-local');revoked++;};
  globalThis.setTimeout=((fn:()=>void)=>{scheduled=fn;return 0;}) as any;
  Object.defineProperty(globalThis,'document',{configurable:true,value:{createElement(tag:string){assert.equal(tag,'a');const link={href:'',download:'',click(){clicked++;if(shouldThrow)throw Error('synthetic click');},remove(){removed++;}};links.push(link);return link;},body:{appendChild(){appended++;}}}});
  downloadRegionalReferenceWorkingCopy(packet);assert.equal(links[0].download,'visible-medicine-teaching-working-copy.json');assert.equal(removed,1);assert.equal(appended,1);assert.equal(clicked,1);assert.equal(revoked,0);assert(scheduled);(scheduled as ()=>void)();assert.equal(revoked,1);
  assert(blob);assert.equal(JSON.parse(await (blob as Blob).text()).draft.notes,draft.notes);
  shouldThrow=true;assert.throws(()=>downloadRegionalReferenceWorkingCopy(packet),/synthetic click/);assert.equal(removed,2);(scheduled as ()=>void)();assert.equal(revoked,2);
 }finally{if(originalDocument)Object.defineProperty(globalThis,'document',originalDocument);else delete (globalThis as any).document;URL.createObjectURL=create;URL.revokeObjectURL=revoke;globalThis.setTimeout=timeout;}
});

test('canonical public body/specimen packets derive exact independent correction contexts',async()=>{
 const built=await build({stdin:{contents:`export {buildRegionalMri3dCatalogue} from './lib/regional-mri-3d-catalogue';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].contents).toString('base64'));
 const catalogue=await api.buildRegionalMri3dCatalogue({revision:'1'.repeat(64),region:'knee'});assert(catalogue?.learning);const kinds=new Set();
 for(const entry of catalogue.learning.entries){const c=regionalReferenceDraftContext({atlasRevision:catalogue.atlasRevision,mappingRevision:catalogue.mappingRevision,entry});assert.equal(c.teachingRevision,entry.revision);assert.deepEqual(c.target,entry.target);assert.equal(c.clinicalApproval,false);kinds.add(c.target.kind);}
 assert.deepEqual(kinds,new Set(['body','specimen']));
});
