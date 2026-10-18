import test from 'node:test';
import assert from 'node:assert/strict';
import { createDraft, renderReview } from './build-review.mjs';
import { validateDraftExam } from './contract.mjs';

function context(label = 'indeterminate') {
  return {sourceEvidence:[],licenceEvidence:[],cases:[{sourceLabel:label,patientRecords:[],assets:[{
    path:'C:/synthetic-fixture.png',sha256:'a'.repeat(64),sourceRecord:{dataset_id:'synthetic',patient_key:'synthetic-person',study_key:'synthetic-study',anatomy:'wrist',view:'frontal',laterality:'left'}
  }]}]};
}

test('indeterminate keys, morphology and difficulty stay unresolved with all reviews pending',()=>{
  const built=createDraft(context());
  assert.equal(validateDraftExam(built.exam).ok,true);
  assert.equal(built.exam.cases[0].questions[0].answer,null);
  assert.equal(built.exam.cases[0].questions[1].answer,null);
  assert.equal(built.exam.cases[0].fields.difficulty,null);
  assert.ok(Object.values(built.exam.reviews).every(r=>r.status==='pending'&&r.evidence===null));
  assert.match(built.exam.cases[0].questions[2].answer,/frontal/);
});
test('no-fracture is not asserted normal and source evidence edits change revision',()=>{
  const ctx=context('no-fracture'), built=createDraft(ctx);
  assert.match(built.exam.cases[0].fields.answer,/not a normal-study diagnosis/);
  ctx.cases[0].patientRecords.push({synthetic:'other-study'});
  assert.notEqual(createDraft(ctx).revision,built.revision);
});
test('source identifiers remain absent from draft; private HTML escapes text and cannot connect',()=>{
  const built=createDraft(context());
  assert.doesNotMatch(JSON.stringify(built.exam),/synthetic-person|synthetic-study|C:\//);
  built.exam.cases[0].questions[0].answer='<script>evil()</script>';
  const html=renderReview(built);
  assert.ok(html.includes('&lt;script&gt;evil()&lt;/script&gt;'));
  assert.ok(html.includes("connect-src 'none'"));
  assert.doesNotMatch(html,/<script|https?:\/\//);
});
test('patient group remains stable across studies; case identity differs',()=>{
  const a=context(),b=context();
  b.cases[0].assets[0].sourceRecord.study_key='second-synthetic-study';
  const ca=createDraft(a).exam.cases[0], cb=createDraft(b).exam.cases[0];
  assert.equal(ca.patientLinkage.groupId,cb.patientLinkage.groupId);
  assert.notEqual(ca.caseId,cb.caseId);
});
test('selection policy is revision-bound and metal-labelled legacy pilots cannot rebuild',()=>{
  const ctx=context(), prior=createDraft(ctx).revision;
  ctx.selectionPolicy={version:1,visualSurgeryScreen:'pending'};
  assert.notEqual(createDraft(ctx).revision,prior);
  ctx.cases[0].assets[0].sourceRecord.hard_negative_tags=['metal'];
  assert.throws(()=>createDraft(ctx),/SURGERY_OR_CAST_EXCLUSION_REQUIRED/);
  ctx.cases[0].assets[0].sourceRecord.hard_negative_tags=['cast'];
  assert.throws(()=>createDraft(ctx),/SURGERY_OR_CAST_EXCLUSION_REQUIRED/);
});
