import assert from 'node:assert/strict';
import test from 'node:test';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import {blankHeadMriDraft,headMriDraftContext,headMriDraftStale,validateHeadMriDraft,type HeadMriDraftContext} from '../lib/head-mri-review-draft-contract.ts';
import {headTeachingDraftContext,blankHeadTeachingDraft} from '../lib/head-teaching-review-contract.ts';
import {confirmHeadMriSave,headMriDraftSavePayload,parseHeadMriHistory,HeadMriSourceChangedError} from '../lib/head-mri-review-draft-client.ts';
const clone=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const savedAt='2026-10-08T15:30:00.000Z',scope='private-to-signed-in-account-and-institution';
async function fixture(){
  const context=await headMriDraftContext(HEAD_LINK_REVISION),draft=blankHeadMriDraft(context);
  const event=(version:number,c=context)=>({eventSchema:'vm-head-mri-draft-event-1',context:c,version,savedAt,draft});
  return {context,draft,event,page:{context,history:[event(22),event(21)],nextBefore:null,scope}};
}
test('MRI history is strict, exclusive and contiguous, with bounded pages',async()=>{
  const {context,event,page}=await fixture();
  assert.deepEqual(parseHeadMriHistory(page,context).history.map(r=>r.version),[22,21]);
  for(const before of [NaN,Infinity,0,-1,1.5,2147483649])assert.throws(()=>parseHeadMriHistory(page,context,before));
  assert.throws(()=>parseHeadMriHistory(page,context,22));
  for(const value of [null,[],{...page,scope:'public'},{...page,unknown:true},{...page,history:{}},
    {...page,history:[event(21),event(22)]},{...page,history:[event(22),event(22)]},{...page,history:[event(22),event(20)]},
    {...page,nextBefore:21},{...page,history:[event(0)]}])assert.throws(()=>parseHeadMriHistory(value,context));
  const twenty=Array.from({length:20},(_,i)=>event(21-i));
  assert.equal(parseHeadMriHistory({...page,history:twenty,nextBefore:2},context).nextBefore,2);
  assert.throws(()=>parseHeadMriHistory({...page,history:twenty,nextBefore:null},context));
  assert.throws(()=>parseHeadMriHistory({...page,history:[...twenty,event(1)],nextBefore:1},context));
  assert.deepEqual(parseHeadMriHistory({...page,history:[event(1)]},context,2).history.map(r=>r.version),[1]);
  assert.equal(parseHeadMriHistory({...page,history:[]},context,1).nextBefore,null);
});
test('each MRI revision and exact checklist change locks current-context confirmation',async()=>{
  const {context,page}=await fixture();
  const changed:HeadMriDraftContext[]=[];
  for(const key of ['headRevision','comparisonRevision','teachingRevision','learningRevision'] as const)changed.push({...context,[key]:'f'.repeat(64)});
  changed.push({...context,checklistVersion:'old-checklist'});
  const relabel=clone(context);relabel.checklist[0].label+=' Changed.';changed.push(relabel);
  for(const c of changed)assert.throws(()=>parseHeadMriHistory({...page,context:c},context),HeadMriSourceChangedError);
  for(const c of [{...context,clinicalApproval:true},{...context,patientRegistration:true},{...context,publicationApproval:true},{...context,extra:true}])
    assert.throws(()=>parseHeadMriHistory({...page,context:c},context));
});
test('historical MRI events remain stale, without acquiring original-25 scope or modifying inputs',async()=>{
  const {context,event,page}=await fixture(),old=clone(context);
  old.teachingRevision='1'.repeat(64);old.checklist[0].label='Historical wording.';
  const incoming={...page,history:[event(22),event(21,old)]},before=clone(incoming);
  const parsed=parseHeadMriHistory(incoming,context);
  assert.equal(headMriDraftStale(parsed.history[1],context),true);assert.deepEqual(incoming,before);
  parsed.history[0].draft.notes='Only parsed result changes';assert.equal(incoming.history[0].draft.notes,'');
  const original=await headTeachingDraftContext(HEAD_LINK_REVISION);
  const event25={eventSchema:'vm-head-teaching-draft-event-1',context:original,version:21,savedAt,draft:blankHeadTeachingDraft(original)};
  assert.throws(()=>parseHeadMriHistory({...page,history:[event25]},context));
  assert.throws(()=>parseHeadMriHistory({...page,context:original},context));
});
test('MRI payload includes all and only required pins, with validated normalized draft',async()=>{
  const {context,draft}=await fixture(),edited={...draft,reviewer:'  Reader  ',notes:'  Requested MRI correction.  ',status:'changes-required' as const};
  const before=clone(edited),payload=headMriDraftSavePayload(context,4,edited);
  assert.deepEqual(Object.keys(payload).sort(),['catalogScope','packetId','headRevision','comparisonRevision','teachingRevision','learningRevision','checklistVersion','expectedVersion','draft'].sort());
  assert.equal(payload.expectedVersion,4);assert.equal(payload.draft.reviewer,'Reader');assert.equal(payload.draft.notes,'Requested MRI correction.');
  for(const key of ['headRevision','comparisonRevision','teachingRevision','learningRevision','checklistVersion'] as const)assert.equal(payload[key],context[key]);
  assert.deepEqual(edited,before);
  for(const version of [NaN,Infinity,-1,1.5,2147483647])assert.throws(()=>headMriDraftSavePayload(context,version,edited));
  assert.throws(()=>headMriDraftSavePayload(context,0,{...edited,attested:true} as never));
});
test('save confirmation requires exact MRI event, normalized draft and next version',async()=>{
  const {context,draft}=await fixture(),edited={...draft,reviewer:'  Reader  ',notes:'  MRI correction requested.  ',status:'changes-required' as const};
  const normalized=validateHeadMriDraft(edited,context),saved={eventSchema:'vm-head-mri-draft-event-1',context,version:8,savedAt,draft:normalized};
  assert.deepEqual(confirmHeadMriSave({review:saved},context,7,edited),saved);
  const reordered={...saved,draft:{...normalized,checks:Object.fromEntries(Object.entries(normalized.checks).reverse())}};
  assert.deepEqual(confirmHeadMriSave({review:reordered},context,7,edited).draft.notes,normalized.notes);
  const responses:unknown[]=[null,{}, {error:'lost response'},{review:saved,approved:true},{review:{...saved,version:9}},
    {review:{...saved,eventSchema:'vm-head-teaching-draft-event-1'}},{review:{...saved,savedAt:'yesterday'}},
    {review:{...saved,draft:{...normalized,notes:'Different server text'}}},{review:{...saved,draft:{...normalized,checks:{...normalized.checks,identity:true}}}}];
  for(const key of ['headRevision','comparisonRevision','teachingRevision','learningRevision'] as const)responses.push({review:{...saved,context:{...context,[key]:'f'.repeat(64)}}});
  for(const input of responses)assert.throws(()=>confirmHeadMriSave(input,context,7,edited));
  for(const expected of [-1,1.5,2147483647,8])assert.throws(()=>confirmHeadMriSave({review:saved},context,expected,edited));
  assert.equal(edited.notes,'  MRI correction requested.  ','failed confirmations preserve submitted input');
});
