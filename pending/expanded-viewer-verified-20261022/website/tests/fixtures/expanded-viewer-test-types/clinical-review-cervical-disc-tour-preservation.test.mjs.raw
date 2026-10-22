import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const original=new URL('./fixtures/clinical-review-cervical-disc-tour-before-lifecycle.ts.raw',import.meta.url);
const candidate=new URL('./clinical-review-cervical-disc-tour.test.ts',import.meta.url);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const originalSha='49d1df96cd5aeb5b04b78445b4e56df751e62b1d4c3534b4aae3bbd0d0b0b814';
const candidateSha='14e140f9979b17a168a70d92baa8e0eca3f8952db886aa3362f44d28577258cc';
function verify(source){
  assert.equal(sha(source),candidateSha,'Exact reviewed lifecycle candidate; changes require a new review');
  const text=source.toString('utf8');
  for(const proof of [
    "const beforeRevision='6b6d9bba99985dfc5ca8deb52ca9e2632b837d25'",
    "const introduction='c26ef4bf570f05e4b0e078a620db49ca67922ed9'",
    "const currentRevision='509b01da5d72f33bd774e4a59d63e2406af1f2ff'",
    "const deliveryRevision=activeAtlas()",
    "const checkpoint=await exactSourceHistoryApi(currentRevision,'regional-tour-review')",
    "const source=await currentHistory(deliveryRevision,'regional-tour-review')",
    "const prior=await exactSourceHistoryApi(beforeRevision,'regional-tour-review')",
    "const introduced=await exactSourceHistoryApi(introduction,'regional-tour-review')",
    "assert.equal(changed,13);assert.equal(catalog.structures.length-changed,1091);assert.equal(topicPlacements,9936)",
    "assert.deepEqual({nested,specimen},{nested:108,specimen:356})",
    "sameExceptDerived(sourceContext,context,['/rendererHash','/revisions/geometry']",
    "sameExceptDerived(exact.context,current.context,['/materialHash','/rendererHash','/revisions/geometry']",
    "sameExceptDerived(old.context,frozenPacket.context,['/materialHash','/rendererHash','/revisions/geometry']",
    "assert.equal(nowContext.sourceHash,oldContext.sourceHash",
    "assert.equal(context.teachingHash,sourceContext.teachingHash",
    "assert.deepEqual(live.regionalTours,source.regionalTours,'complete delivered Review tour population matches actual current source')",
    "bodyTeaching:542,bodyTourLength:17,bodyContinuousInPlace:304,firstTourIntroductions:10,bodyDirectContinuous:314",
    "assert.deepEqual([...addedFirstTours],firstTourIntroductions,'exact ten newly present first-tour packet IDs')",
    "nested:108,nestedTeaching:27,nestedUs:4,nestedContinuous:23,specimen:356,specimenTeaching:329,specimenContinuous:329",
    "assert.equal(await live.parseBodyReviewResponse(forged,id),null)",
    "assert.throws(()=>live.regionalTourStructures(missing,tour))",
    "assert.throws(()=>live.regionalTourStructures(altered,tour))",
    "assert.throws(()=>live.regionalTourStructures(catalog,frame))",
    "assert.equal(viewer.personalRecordsIncluded,false)",
    "for(const flag of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection'])",
  ])assert(text.includes(proof),`Required original or lifecycle proof: ${proof}`);
  assert(!/\btest\.(?:skip|todo|only)\s*\(/.test(text));
}
test('exact cervical original and lifecycle candidate remain reviewable and tamper-resistant',()=>{
  const old=readFileSync(original),next=readFileSync(candidate);
  assert.equal(sha(old),originalSha,'Byte-exact original cervical theorem');
  verify(next);
  assert.throws(()=>verify(Buffer.from(next.toString().replace('assert.equal(changed,13)','assert.equal(changed,12)'))));
  assert.throws(()=>verify(Buffer.from('if(false){\n'+next+'\n}')));
});
