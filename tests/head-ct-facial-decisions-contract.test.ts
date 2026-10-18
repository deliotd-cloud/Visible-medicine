import assert from 'node:assert/strict';
import test from 'node:test';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import {HEAD_CT_FACIAL_COMPARISON_REVISION,CT_FACIAL_COMPARISON_CONCEPTS} from '../lib/head-ct-facial-comparison-review.ts';
import {HEAD_CT_FACIAL_TEACHING_REVISION} from '../lib/head-ct-facial-teaching.ts';
import {HEAD_CT_FACIAL_CLINICAL_REVISION} from '../lib/head-ct-facial-clinical.ts';
import {HEAD_CT_BONE_COMPARISON_REVISION} from '../lib/head-ct-bone-comparison-review.ts';
import {ctBoneDecisionContext} from '../lib/head-ct-bone-decision-contract.ts';
import {ctBoneTeachingDecisionContext} from '../lib/head-ct-bone-teaching-decision-contract.ts';
import {facialDecisionKind,facialDecisionConcept,facialDecisionContext,parseFacialDecisionContext,blankFacialDecision,validateFacialDecision,parseSavedFacialDecision,facialDecisionStale,currentFacialEducationalAcceptance} from '../lib/head-ct-facial-decision-contract.ts';

const copy=<T>(v:T):T=>JSON.parse(JSON.stringify(v));
const at='2026-10-16T10:00:00.000Z';

test('six facial contexts bind each independent packet and preserve six existing bone helpers',async()=>{
  assert.deepEqual([...CT_FACIAL_COMPARISON_CONCEPTS],['bone-left-zygomatic','bone-right-zygomatic','bone-mandible']);
  assert(facialDecisionKind('teaching'));assert(facialDecisionKind('clinical'));assert(!facialDecisionKind('semantic'));
  assert(facialDecisionConcept('bone-mandible'));assert(!facialDecisionConcept('bone-occipital'));
  assert.notEqual(HEAD_CT_FACIAL_TEACHING_REVISION,HEAD_CT_FACIAL_CLINICAL_REVISION);
  for(const kind of ['teaching','clinical'] as const)for(const concept of CT_FACIAL_COMPARISON_CONCEPTS){
    const c=await facialDecisionContext(HEAD_LINK_REVISION,concept,kind);
    assert.equal(c.kind,kind);assert.equal(c.conceptId,concept);
    assert.equal(c.catalogScope,`head-ct-facial-${kind}`);assert.equal(c.packetId,c.catalogScope);
    assert.equal(c.comparisonRevision,HEAD_CT_FACIAL_COMPARISON_REVISION);
    assert.equal(c.packetRevision,kind==='teaching'?HEAD_CT_FACIAL_TEACHING_REVISION:HEAD_CT_FACIAL_CLINICAL_REVISION);
    assert.deepEqual(c.checklist.map(x=>x.id),kind==='teaching'?['facts','references','exercise','limits']:['wording','scan-attribution','imaging','bindings']);
    assert.equal(c.decisionScope,'personal-educational-only');
    assert.deepEqual([c.patientRegistration,c.clinicalApproval,c.publicationApproval],[false,false,false]);
    assert.deepEqual(validateFacialDecision(blankFacialDecision(c),c),blankFacialDecision(c));
  }
  for(const concept of ['bone-left-parietal','bone-right-parietal','bone-left-nasal','bone-right-nasal','bone-occipital','bone-ethmoid']){
    const comparison=await ctBoneDecisionContext(HEAD_LINK_REVISION,concept);
    const teaching=await ctBoneTeachingDecisionContext(HEAD_LINK_REVISION,concept);
    assert.equal(comparison.packetId,'head-ct-bone-comparisons');assert.equal(comparison.comparisonRevision,HEAD_CT_BONE_COMPARISON_REVISION);
    assert.equal(teaching.packetId,'head-ct-bone-teaching');assert.equal(teaching.comparisonRevision,HEAD_CT_BONE_COMPARISON_REVISION);
  }
  await assert.rejects(facialDecisionContext('a'.repeat(64),'bone-mandible','teaching'));
  await assert.rejects(facialDecisionContext(HEAD_LINK_REVISION,'bone-occipital','teaching'));
  await assert.rejects(facialDecisionContext(HEAD_LINK_REVISION,'bone-mandible','semantic'));
});

test('acceptance needs personal attestation, identity, qualification and all kind-specific checks',async()=>{
  for(const kind of ['teaching','clinical'] as const){
    const c=await facialDecisionContext(HEAD_LINK_REVISION,'bone-mandible',kind),blank=blankFacialDecision(c);
    const accepted={...blank,status:'accepted-educational' as const,reviewer:' Synthetic reviewer ',qualification:' Self-reported qualification ',checks:Object.fromEntries(c.checklist.map(x=>[x.id,true])),attested:true};
    assert.equal(validateFacialDecision(accepted,c).reviewer,'Synthetic reviewer');
    for(const change of [{reviewer:' '},{qualification:''},{attested:false},{status:'accepted-clinical'},{status:'accepted-teaching'},
      {clinicalApproval:true},{checks:{...accepted.checks,extra:true}},{checks:{...accepted.checks,[c.checklist[0].id]:false}},
      {notes:'x'.repeat(8001)}])assert.throws(()=>validateFacialDecision({...accepted,...change},c));
    assert.throws(()=>validateFacialDecision({...blank,attested:true},c));
    assert.throws(()=>validateFacialDecision({...blank,status:'changes-required',notes:'short'},c));
    assert.equal(validateFacialDecision({...blank,status:'changes-required',notes:'Review the saved extent.'},c).status,'changes-required');
  }
});

test('historical events retain wording but full context differences expire educational acceptance',async()=>{
  const teaching=await facialDecisionContext(HEAD_LINK_REVISION,'bone-mandible','teaching');
  const clinical=await facialDecisionContext(HEAD_LINK_REVISION,'bone-mandible','clinical');
  const blank=blankFacialDecision(teaching);
  const event=parseSavedFacialDecision({eventSchema:'vm-ct-facial-decision-event-1',context:teaching,version:1,savedAt:at,
    decision:{...blank,status:'accepted-educational',reviewer:'Synthetic reviewer',qualification:'Test fixture',checks:Object.fromEntries(teaching.checklist.map(x=>[x.id,true])),attested:true}});
  assert(currentFacialEducationalAcceptance(event,teaching));
  assert(facialDecisionStale(event,clinical));assert(!currentFacialEducationalAcceptance(event,clinical));
  const corrected=parseSavedFacialDecision({...event,version:2,decision:{...blank,status:'changes-required',notes:'Synthetic correction supersedes earlier acceptance.'}});
  assert(!currentFacialEducationalAcceptance(corrected,teaching));
  for(const edit of [
    (x:typeof event)=>{x.context.headRevision='a'.repeat(64);},
    (x:typeof event)=>{x.context.comparisonRevision='b'.repeat(64);},
    (x:typeof event)=>{x.context.packetRevision='c'.repeat(64);},
    (x:typeof event)=>{x.context.checklistVersion='older';},
    (x:typeof event)=>{x.context.checklist[0].label='Earlier factual wording';},
    (x:typeof event)=>{x.context.attestation='Earlier personal educational attestation';},
    (x:typeof event)=>{x.context.conceptId='bone-left-zygomatic';},
  ]){const old=copy(event);edit(old);assert.deepEqual(parseSavedFacialDecision(old),old);assert(facialDecisionStale(old,teaching));assert(!currentFacialEducationalAcceptance(old,teaching));}
});

test('strict scope and kind parsing refuses foreign families, swapped checklists and approval flags',async()=>{
  const c=await facialDecisionContext(HEAD_LINK_REVISION,'bone-left-zygomatic','clinical');
  const teaching=await facialDecisionContext(HEAD_LINK_REVISION,'bone-left-zygomatic','teaching');
  for(const change of [
    {kind:'teaching'},{catalogScope:'head-ct-facial-teaching'},{packetId:'head-ct-facial-teaching'},
    {catalogScope:'head-ct-bone-teaching',packetId:'head-ct-bone-teaching'},{conceptId:'bone-occipital'},
    {checklist:teaching.checklist},{checklist:[...c.checklist].reverse()},
    {headRevision:'old'},{comparisonRevision:'old'},{packetRevision:'old'},
    {decisionScope:'clinical'},{patientRegistration:true},{clinicalApproval:true},{publicationApproval:true},{extra:true},
  ])assert.throws(()=>parseFacialDecisionContext({...c,...change}));
  assert.throws(()=>parseFacialDecisionContext({...c,checklist:c.checklist.map((x,i)=>i?x:{...x,label:' '})}));
  assert.throws(()=>parseFacialDecisionContext({...c,attestation:' '}));
  assert.equal(parseFacialDecisionContext(c).kind,'clinical');
});

test('saved event parser enforces event bounds, canonical time and decision validity',async()=>{
  const c=await facialDecisionContext(HEAD_LINK_REVISION,'bone-right-zygomatic','teaching');
  const event={eventSchema:'vm-ct-facial-decision-event-1' as const,context:c,version:1,savedAt:at,decision:blankFacialDecision(c)};
  assert.deepEqual(parseSavedFacialDecision(event),event);
  for(const change of [{version:0},{version:2147483648},{version:1.1},{version:NaN},
    {savedAt:'2026-02-30T10:00:00.000Z'},{savedAt:'2026-10-16T10:00:00Z'},{savedAt:'2026-10-16T10:00:00.000+00:00'},
    {eventSchema:'vm-ct-bone-teaching-decision-event-1'},{context:{...c,packetId:'head-ct-facial-clinical'}},
    {decision:{...event.decision,attested:true}},{extra:true}])assert.throws(()=>parseSavedFacialDecision({...event,...change}));
  assert(facialDecisionStale({...event,version:0},c));
});
