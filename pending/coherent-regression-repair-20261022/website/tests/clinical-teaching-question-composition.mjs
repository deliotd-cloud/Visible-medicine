import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const now='36a5c8cc982e41db700cd9d805ac175c3375f0af61bee4fd14f31de9c255a958';
const before='d8a09984ef5392e6df069e37f775e2543d09fb36b868a8af4467c32d554796fa';
const inverse=[
 ["import { CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery } from './current-atlas-delivery.mjs';","import { currentAtlasDeliveryRoot } from './current-atlas-delivery.mjs';"],
 ['assert.equal(review.revision,CURRENT_ATLAS_REVISION);',"assert.equal(review.revision,'190a63238eadcf906abe89dcbb6a67c88afe70b9');"],
 ["assert.equal(learner.sourceCommit,validateCurrentAtlasDelivery().runtimeSources['head-neck']);","assert.equal(learner.sourceCommit,'190a63238eadcf906abe89dcbb6a67c88afe70b9');"],
];

export function restoreTeachingQuestionCandidate(name,currentBytes,frozenBytes){
 assert.equal(name,'clinical-review-reasoning.test.ts','only admitted reasoning source');
 assert.equal(sha(currentBytes),now,'exact current CODE digest');
 assert.equal(sha(frozenBytes),before,'exact complete frozen CODE digest');
 let recovered=currentBytes.toString('utf8');
 assert.deepEqual(Buffer.from(recovered),currentBytes,'lossless candidate UTF-8');
 for(const [current,prior] of inverse){
  assert.equal(recovered.split(current).length,2,'unique inverse seam');
  recovered=recovered.replace(current,prior);
 }
 const result=Buffer.from(recovered);
 assert.deepEqual(result,frozenBytes,'complete frozen CODE reconstructed');
 return result;
}
