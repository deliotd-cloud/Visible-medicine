import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import {HEAD_TEACHING_REVISION,headTeachingPacket} from '../lib/head-atlas-teaching.ts';
import {
  headTeachingDraftContext,blankHeadTeachingDraft,validateHeadTeachingDraft,
  parseSavedHeadTeachingDraft,headTeachingDraftStale,
} from '../lib/head-teaching-review-contract.ts';

const clone=<T>(value:T):T=>JSON.parse(JSON.stringify(value)) as T;
const savedAt='2026-10-08T12:34:56.000Z';

test('current draft context is pinned to the complete packet and exact paired identities',async()=>{
  const packet=headTeachingPacket(),context=await headTeachingDraftContext(HEAD_LINK_REVISION);
  assert.equal(createHash('sha256').update(JSON.stringify(packet)).digest('hex'),HEAD_TEACHING_REVISION);
  assert.equal(context.schema,'vm-head-teaching-draft-context-1');
  assert.equal(context.catalogScope,'head-linked-teaching-drafts');
  assert.equal(context.packetId,'head-learning-anatomy');
  assert.equal(context.packetRevision,HEAD_TEACHING_REVISION);
  assert.equal(context.headRevision,HEAD_LINK_REVISION);
  assert.equal(context.checklistVersion,'head-teaching-draft-review-2');
  assert.deepEqual(context.checklist.map(item=>item.id),['facts','extent','comparison','exercise','revision']);
  assert.deepEqual(context.checklist.map(item=>item.label),packet.content.reviewChecks);
  assert.deepEqual(context.conceptIds,packet.content.notes.map(note=>note.conceptId));
  assert.equal(context.conceptIds.length,25);
  assert.equal(new Set(context.conceptIds).size,25);
  for(const side of ['left','right'])for(const name of ['caudate','putamen','globus-pallidus','thalamus'])
    assert(context.conceptIds.includes(`deep-${side}-${name}`));
  for(const side of ['left','right']){
    for(const lobe of ['frontal','parietal','temporal','occipital'])assert(context.conceptIds.includes(`cortex-${side}-${lobe}-lobe`));
    assert(context.conceptIds.includes(`limbic-${side}-hippocampus`));
  }
  assert.equal(context.patientRegistration,false);
  assert.equal(context.clinicalApproval,false);
  assert.equal(context.publicationApproval,false);
  for(const revision of ['',HEAD_LINK_REVISION+'0','0'.repeat(64)])
    await assert.rejects(headTeachingDraftContext(revision));
});

test('changed packet content refuses a context until the exact original is restored',async()=>{
  const mutable=headTeachingPacket().content as unknown as {notes:{task:string}[]};
  const original=mutable.notes[0].task;
  try{
    mutable.notes[0].task=original+' temporary hash probe';
    await assert.rejects(headTeachingDraftContext(HEAD_LINK_REVISION),/hash/);
  }finally{
    mutable.notes[0].task=original;
  }
  assert.equal((await headTeachingDraftContext(HEAD_LINK_REVISION)).packetRevision,HEAD_TEACHING_REVISION);
});

test('draft validation permits only notes and correction requests, never approval or attestation',async()=>{
  const context=await headTeachingDraftContext(HEAD_LINK_REVISION),blank=blankHeadTeachingDraft(context);
  assert.deepEqual(blank,{status:'draft',reviewer:'',qualification:'',scope:'',notes:'',
    checks:{facts:false,extent:false,comparison:false,exercise:false,revision:false},attested:false});
  assert.deepEqual(validateHeadTeachingDraft(blank,context),blank);
  const correction={...blank,status:'changes-required' as const,notes:'  Please recheck the saved outline.  ',reviewer:'  Reader  '};
  assert.deepEqual(validateHeadTeachingDraft(correction,context),{...correction,notes:'Please recheck the saved outline.',reviewer:'Reader'});
  assert.throws(()=>validateHeadTeachingDraft({...correction,notes:' short '},context));
  for(const patch of [{status:'approved'},{status:'rejected'},{attested:true},{reviewedAt:savedAt},{clinicalApproval:true},
    {reviewer:'x'.repeat(161)},{qualification:'x'.repeat(161)},{scope:'x'.repeat(1001)},{notes:'x'.repeat(8001)},
    {checks:{...blank.checks,extra:true}},{checks:{...blank.checks,extent:undefined}},
    {checks:{facts:true}},{checks:{...blank.checks,facts:'true'}}])
    assert.throws(()=>validateHeadTeachingDraft({...blank,...patch},context));
});

test('context validation rejects forged scope and malformed concepts or checklist',async()=>{
  const context=await headTeachingDraftContext(HEAD_LINK_REVISION),blank=blankHeadTeachingDraft(context);
  const invalid=[
    {...context,clinicalApproval:true},{...context,publicationApproval:true},{...context,patientRegistration:true},
    {...context,catalogScope:'body-display-catalog'},{...context,packetId:'another-packet'},
    {...context,conceptIds:[...context.conceptIds,'deep-screen-left-caudate']},
    {...context,conceptIds:context.conceptIds.map((id,index)=>index===7?'deep-middle-caudate':id)},
    {...context,conceptIds:context.conceptIds.map((id,index)=>index===15?'cortex-middle-frontal-lobe':id)},
    {...context,conceptIds:context.conceptIds.map((id,index)=>index===15?'cortex-left-frontal-extra':id)},
    {...context,conceptIds:context.conceptIds.map((id,index)=>index===24?'limbic-left-amygdala':id)},
    {...context,conceptIds:context.conceptIds.map((id,index)=>index===24?'limbic-middle-hippocampus':id)},
    {...context,conceptIds:[...context.conceptIds,context.conceptIds[0]]},
    {...context,checklist:[...context.checklist,{id:'approve',label:'Approve'}]},
    {...context,unexpected:true},
  ];
  for(const value of invalid)assert.throws(()=>validateHeadTeachingDraft(blank,value as typeof context));
});

test('saved envelopes are strict and prior valid revisions remain readable but stale',async()=>{
  const context=await headTeachingDraftContext(HEAD_LINK_REVISION),draft=blankHeadTeachingDraft(context);
  const event={eventSchema:'vm-head-teaching-draft-event-1' as const,context,version:1,savedAt,draft};
  assert.deepEqual(parseSavedHeadTeachingDraft(event),event);
  assert.equal(headTeachingDraftStale(event,context),false);
  for(const patch of [{eventSchema:'vm-body-review-event-1'},{version:0},{version:2147483648},
    {version:1.5},{savedAt:'2026-10-08'},{savedAt:'2026-13-08T12:34:56.000Z'},
    {savedAt:'2026-10-08T12:34:56Z'},{reviewedAt:savedAt},{approval:true},
    {draft:{...draft,status:'approved'}},{draft:{...draft,attested:true}}])
    assert.throws(()=>parseSavedHeadTeachingDraft({...event,...patch}));
  const prior=clone(event);
  prior.context.packetRevision='a3ac202362d22f451fcf8638c8e9b480fd869208ca689caaed65a447711e832e';
  prior.context.checklistVersion='head-teaching-draft-review-1';
  prior.context.conceptIds=prior.context.conceptIds.slice(0,15);
  assert.deepEqual(parseSavedHeadTeachingDraft(prior),prior);
  assert.equal(headTeachingDraftStale(prior,context),true);
  assert.throws(()=>validateHeadTeachingDraft(draft,{...prior.context,conceptIds:[...prior.context.conceptIds,'limbic-left-amygdala']}));
  assert.equal(headTeachingDraftStale(event,{...context,checklist:[...context.checklist].reverse()}),true);
});
