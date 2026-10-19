import assert from 'node:assert/strict';
import test from 'node:test';
import {regionalMriCorrectionContext,parseRegionalMriCorrectionContext,sameRegionalMriCorrectionContext,validateRegionalMriCorrectionDraft,parseRegionalMriCorrectionEvent} from '../lib/regional-mri-correction-contract.ts';
import {regionalMriCorrectionKey} from '../lib/regional-mri-correction-store.ts';
const projection:any={schema:'visible-medicine.regional-mri-review-context/1',sourceRevision:'a'.repeat(64),projectionRevision:'b'.repeat(64),region:'knee',laterality:'left',registration:'none',release:'local-private-draft',series:[
 {id:'axial',label:'Axial synthetic',imageSha256:'c'.repeat(64),annotations:[{id:'one',anatomyId:'knee.test',label:'Synthetic structure',laterality:'left',coverage:'partial',reviewStatus:'provisional',
  reviewRevision:'d'.repeat(64),reviewScope:'Only this synthetic source',geometryKind:'mask',gridKind:'derived-source-ras',geometryMappingRevision:'e'.repeat(64),geometrySourceSha256:'f'.repeat(64)}]},
 {id:'coronal',label:'Coronal synthetic',imageSha256:'1'.repeat(64),annotations:[]}]};
const context=()=>regionalMriCorrectionContext(projection,'axial','one')!;
const draft={status:'draft',notes:'  Preserve unfinished wording\nexactly.  ',checks:{identity:false,extent:true,sourceScope:false},attested:false};
const event=()=>({eventSchema:'vm-regional-mri-correction-event-1',context:context(),version:1,savedAt:'2026-10-13T21:00:00.000Z',draft});
test('exact server selection preserves source scope, partial derived/provisional limits and detached frozen metadata',()=>{
 const c=context();assert(c);assert(Object.isFrozen(c));assert(Object.isFrozen(c.annotation));assert.equal(c.annotation.reviewStatus,'provisional');assert.equal(c.annotation.coverage,'partial');
 assert.equal(c.annotation.gridKind,'derived-source-ras');assert.equal(c.clinicalApproval,false);assert.equal(c.publicationApproval,false);assert.equal(c.patientRegistration,false);
 assert.notStrictEqual(c.annotation,projection.series[0].annotations[0]);
 assert.equal(regionalMriCorrectionContext(projection,'coronal','one'),null);assert.equal(regionalMriCorrectionContext(projection,'axial','unknown'),null);
 assert(!JSON.stringify(c).includes('points_ras_mm'));assert(!JSON.stringify(c).includes('file'));
 assert(sameRegionalMriCorrectionContext(c,structuredClone(c)));assert(!sameRegionalMriCorrectionContext(c,{...c,clinicalApproval:true}));
});
test('every identity/scope/geometry field is independently exact for comparison and isolated history keys',()=>{
 const c=context();let count=0;
 for(const key of Object.keys(c)){
  if(key==='annotation')continue;const altered:any=structuredClone(c);altered[key]=typeof altered[key]==='boolean'?true:'altered';assert(!sameRegionalMriCorrectionContext(c,altered),key);count++;
 }
 for(const key of Object.keys(c.annotation)){
  const altered:any=structuredClone(c);altered.annotation[key]=altered.annotation[key]===null?'altered':'changed';assert(!sameRegionalMriCorrectionContext(c,altered),key);count++;
 }
 assert.equal(count,23);
 for(const key of ['sourceRevision','projectionRevision','sequenceId'] as const){const altered={...c,[key]:key==='sequenceId'?'coronal':'2'.repeat(64)};assert.notEqual(regionalMriCorrectionKey(c),regionalMriCorrectionKey(altered));}
 assert.notEqual(regionalMriCorrectionKey(c),regionalMriCorrectionKey({...c,annotation:{...c.annotation,id:'variant'}}));
 assert.throws(()=>parseRegionalMriCorrectionContext({...c,pixels:[]}));assert.throws(()=>parseRegionalMriCorrectionContext({...c,annotation:{...c.annotation,points:[]}}));
});
test('drafts preserve whitespace but reject approval authority, unknown fields, malformed checks and invalid corrections',()=>{
 const d=validateRegionalMriCorrectionDraft(draft);assert.equal(d.notes,draft.notes);assert(Object.isFrozen(d.checks));
 assert.throws(()=>validateRegionalMriCorrectionDraft({...draft,status:'approved'}));assert.throws(()=>validateRegionalMriCorrectionDraft({...draft,attested:true}));
 assert.throws(()=>validateRegionalMriCorrectionDraft({...draft,status:'changes-required',notes:' tiny '}));
 assert.throws(()=>validateRegionalMriCorrectionDraft({...draft,notes:'x'.repeat(6001)}));assert.throws(()=>validateRegionalMriCorrectionDraft({...draft,notes:'bad\0notes'}));
 assert.throws(()=>validateRegionalMriCorrectionDraft({...draft,checks:{...draft.checks,registration:true}}));assert.throws(()=>validateRegionalMriCorrectionDraft({...draft,checks:{...draft.checks,identity:'yes'}}));
 assert.throws(()=>validateRegionalMriCorrectionDraft({...draft,sourceMask:[]}));
 assert.equal(validateRegionalMriCorrectionDraft({...draft,status:'changes-required',notes:'Review the exact source margin.'}).status,'changes-required');
});
test('historical events parse without current-source upgrading and reject invalid dates, bounds or approvals',()=>{
 const original=event(),saved=parseRegionalMriCorrectionEvent(original);assert.equal(saved.context.sourceRevision,'a'.repeat(64));assert(Object.isFrozen(saved));
 assert.notStrictEqual(saved.context,original.context);assert.notStrictEqual(saved.draft,original.draft);
 for(const version of [0,-1,1.5,2147483648,'1'])assert.throws(()=>parseRegionalMriCorrectionEvent({...original,version}));
 for(const savedAt of ['2026-02-30T21:00:00.000Z','2026-10-13T21:00:00Z','invalid'])assert.throws(()=>parseRegionalMriCorrectionEvent({...original,savedAt}));
 assert.throws(()=>parseRegionalMriCorrectionEvent({...original,approved:true}));assert.throws(()=>parseRegionalMriCorrectionEvent({...original,context:{...original.context,patientRegistration:true}}));
});
