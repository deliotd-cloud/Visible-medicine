import assert from 'node:assert/strict';
import test from 'node:test';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import {HEAD_MRI_COMPARISON_REVISION} from '../lib/head-mri-comparison-review.ts';
import {HEAD_MRI_ONLY_TEACHING_REVISION} from '../lib/head-mri-only-teaching.ts';
import {HEAD_MRI_LEARNING_REVISION} from '../lib/head-mri-learning.ts';
import {
  HEAD_MRI_DRAFT_CHECKLIST,headMriDraftContext,blankHeadMriDraft,validateHeadMriDraft,
  parseSavedHeadMriDraft,headMriDraftStale,
} from '../lib/head-mri-review-draft-contract.ts';
import {headTeachingDraftContext,parseSavedHeadTeachingDraft} from '../lib/head-teaching-review-contract.ts';

const clone=<T>(value:T):T=>JSON.parse(JSON.stringify(value)) as T;
const ids=['limbic-left-amygdala','limbic-right-amygdala','commissure-corpus-callosum','endocrine-pituitary-gland'];
const savedAt='2026-10-08T12:34:56.000Z';

test('MRI draft context pins the independent four-concept packets and denies inherited approvals',async()=>{
  const context=await headMriDraftContext(HEAD_LINK_REVISION);
  assert.equal(context.schema,'vm-head-mri-draft-context-1');
  assert.equal(context.catalogScope,'head-mri-only-drafts');
  assert.equal(context.packetId,'head-mri-only-learning');
  assert.equal(context.headRevision,HEAD_LINK_REVISION);
  assert.equal(context.comparisonRevision,HEAD_MRI_COMPARISON_REVISION);
  assert.equal(context.teachingRevision,HEAD_MRI_ONLY_TEACHING_REVISION);
  assert.equal(context.learningRevision,HEAD_MRI_LEARNING_REVISION);
  assert.equal(context.checklistVersion,'head-mri-draft-review-1');
  assert.deepEqual(context.checklist,HEAD_MRI_DRAFT_CHECKLIST);
  assert.deepEqual(context.checklist.map(item=>item.id),['identity','extent','facts','exercise','revision']);
  assert.deepEqual(context.conceptIds,ids);
  assert.equal(context.patientRegistration,false);
  assert.equal(context.clinicalApproval,false);
  assert.equal(context.publicationApproval,false);
  for(const revision of ['',HEAD_LINK_REVISION+'0','0'.repeat(64)])
    await assert.rejects(headMriDraftContext(revision));
});

test('only a draft or a detailed correction request can be recorded',async()=>{
  const context=await headMriDraftContext(HEAD_LINK_REVISION),blank=blankHeadMriDraft(context);
  assert.deepEqual(blank,{status:'draft',reviewer:'',qualification:'',scope:'',notes:'',
    checks:{identity:false,extent:false,facts:false,exercise:false,revision:false},attested:false});
  assert.deepEqual(validateHeadMriDraft(blank,context),blank);
  const correction={...blank,status:'changes-required' as const,reviewer:'  Reader  ',notes:'  Recheck MRI native extent.  '};
  assert.deepEqual(validateHeadMriDraft(correction,context),{...correction,reviewer:'Reader',notes:'Recheck MRI native extent.'});
  assert.throws(()=>validateHeadMriDraft({...correction,notes:'  too short  '},context));
  for(const patch of [
    {status:'approved'},{status:'rejected'},{attested:true},{reviewedAt:savedAt},{clinicalApproval:true},
    {reviewer:'x'.repeat(161)},{qualification:'x'.repeat(161)},{scope:'x'.repeat(1001)},{notes:'x'.repeat(8001)},
    {checks:{...blank.checks,approval:true}},{checks:{...blank.checks,extent:undefined}},
    {checks:{identity:true}},{checks:{...blank.checks,identity:'true'}},
  ])assert.throws(()=>validateHeadMriDraft({...blank,...patch},context));
  for(const invalid of [null,[],{},'draft'])assert.throws(()=>validateHeadMriDraft(invalid,context));
});

test('context cannot expand into original head teaching or clinical approval',async()=>{
  const context=await headMriDraftContext(HEAD_LINK_REVISION),blank=blankHeadMriDraft(context);
  const original25=(await headTeachingDraftContext(HEAD_LINK_REVISION)).conceptIds;
  for(const patch of [
    {schema:'vm-head-teaching-draft-context-1'},{catalogScope:'head-linked-teaching-drafts'},
    {packetId:'head-learning-anatomy'},{patientRegistration:true},{clinicalApproval:true},{publicationApproval:true},
    {conceptIds:original25},{conceptIds:[...ids,ids[0]]},{conceptIds:[ids[1],ids[0],ids[2],ids[3]]},
    {conceptIds:[ids[0],ids[1],ids[2],ids[2]]},{conceptIds:[...ids,'deep-left-caudate']},
    {conceptIds:null},{comparisonRevision:'bad'},{teachingRevision:null},{learningRevision:'A'.repeat(64)},
    {checklistVersion:''},{checklist:[...context.checklist].reverse()},
    {checklist:[...context.checklist,context.checklist[0]]},
    {checklist:context.checklist.map((item,index)=>index===0?{...item,label:'   '}:item)},
    {checklist:context.checklist.map((item,index)=>index===0?{...item,label:` ${item.label} `}:item)},
    {checklist:context.checklist.map((item,index)=>index===0?{...item,label:'x'.repeat(1001)}:item)},
    {checklist:context.checklist.map((item,index)=>index===0?{...item,id:'approve'}:item)},
    {unexpected:true},
  ])assert.throws(()=>validateHeadMriDraft(blank,{...context,...patch} as typeof context));
  for(const invalid of [null,[],{}])assert.throws(()=>blankHeadMriDraft(invalid as typeof context));
});

test('saved envelopes are strict, retain valid history and detect a changed source revision',async()=>{
  const context=await headMriDraftContext(HEAD_LINK_REVISION),draft=blankHeadMriDraft(context);
  const event={eventSchema:'vm-head-mri-draft-event-1' as const,context,version:1,savedAt,draft};
  assert.deepEqual(parseSavedHeadMriDraft(event),event);
  assert.equal(headMriDraftStale(event,context),false);
  for(const patch of [
    {eventSchema:'vm-head-teaching-draft-event-1'},{version:0},{version:2147483648},{version:1.5},
    {savedAt:'2026-10-08'},{savedAt:'2026-13-08T12:34:56.000Z'},{savedAt:'2026-10-08T12:34:56Z'},
    {reviewedAt:savedAt},{approval:true},{draft:{...draft,status:'approved'}},{draft:{...draft,attested:true}},
  ])assert.throws(()=>parseSavedHeadMriDraft({...event,...patch}));
  for(const invalid of [null,[],{},'event'])assert.throws(()=>parseSavedHeadMriDraft(invalid));
  const prior=clone(event);
  prior.context.comparisonRevision='a'.repeat(64);
  prior.context.teachingRevision='b'.repeat(64);
  prior.context.learningRevision='c'.repeat(64);
  prior.context.headRevision='d'.repeat(64);
  prior.context.checklistVersion='head-mri-draft-review-2';
  prior.context.checklist[0].label='Historical MRI native identity check';
  assert.deepEqual(parseSavedHeadMriDraft(prior),prior);
  assert.equal(headMriDraftStale(prior,context),true);
  const changedLabel=clone(event);
  changedLabel.context.checklist[0].label='Earlier valid wording';
  assert.deepEqual(parseSavedHeadMriDraft(changedLabel),changedLabel);
  assert.equal(headMriDraftStale(changedLabel,context),true);
  assert.equal(headMriDraftStale(event,{...context,learningRevision:'e'.repeat(64)}),true);
  assert.equal(headMriDraftStale({...event,draft:{...draft,attested:true}} as unknown as ReturnType<typeof parseSavedHeadMriDraft>,context),true);
  for(const patch of [{conceptIds:[...ids,ids[0]]},{clinicalApproval:true},
    {checklist:[...context.checklist].reverse()},{checklist:context.checklist.map((item,index)=>index===1?{...item,label:''}:item)}])
    assert.throws(()=>parseSavedHeadMriDraft({...event,context:{...context,...patch}}));
});

test('MRI and original 25-concept histories reject each other',async()=>{
  const mriContext=await headMriDraftContext(HEAD_LINK_REVISION);
  const headContext=await headTeachingDraftContext(HEAD_LINK_REVISION);
  const mriEvent={eventSchema:'vm-head-mri-draft-event-1',context:mriContext,version:1,savedAt,draft:blankHeadMriDraft(mriContext)};
  const headEvent={eventSchema:'vm-head-teaching-draft-event-1',context:headContext,version:1,savedAt,
    draft:{status:'draft',reviewer:'',qualification:'',scope:'',notes:'',checks:{facts:false,extent:false,comparison:false,exercise:false,revision:false},attested:false}};
  assert.throws(()=>parseSavedHeadTeachingDraft(mriEvent));
  assert.throws(()=>parseSavedHeadMriDraft(headEvent));
  assert.throws(()=>parseSavedHeadMriDraft({...mriEvent,context:headContext}));
  assert.throws(()=>parseSavedHeadTeachingDraft({...headEvent,context:mriContext}));
});
