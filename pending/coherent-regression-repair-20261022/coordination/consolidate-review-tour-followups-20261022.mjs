import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const sourceReceipt='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking/PRODUCT_SOURCE_V5.json';
assert.equal(sha(read(sourceReceipt)),'49a132ab76102e0fb2845df9ab111047630ecdafc0f0a2e61e81fef70a62a03f');
const source=json(sourceReceipt);for(const row of source.sourceRows)assert.equal(sha(read(source.website+'/'+row.path)),row.sha256);
const previous='F:/VisibleMedicine/staging/20261022-reviewed-tour-followup-plan/PLAN.json';
assert.equal(sha(read(previous)),'05c7188d7b9851b954460a113d1103aacaf3865fb9e9b7bd939099e78c5f00d9');
const prior=json(previous),repairs=[...prior.repairs],batches=[...prior.batches];
const packets=[
 {stage:'F:/VisibleMedicine/staging/20261022-six-clinical-runtime-admission',tests:[
 'clinical-review-tour-imaging.test.ts','clinical-review-um-ankle-imaging.test.ts','clinical-review-upper-venous-tour.test.ts',
 'clinical-review-visceral-arterial-xray.test.ts','clinical-review-vocal-tissue-teaching.test.ts','tongue-palate-delivery.test.ts',
 'regional-tour-role-preservation-20261021.test.mjs','limb-suprahyoid-role-preservation-20261021.test.mjs','venous-urinary-role-preservation-20261021.test.mjs']},
 {stage:'F:/VisibleMedicine/staging/20261022-closed56-57-provider-admission',tests:[
 'closed56-femoral-epoch.test.mjs','head-manual-recovery-54-to-55-closed.test.mjs','historical-head-toolbar-css-extension.test.mjs','closed57-original-tests.test.mjs']},
];
const six=packets[0].stage;
assert.equal(sha(read(six+'/MAIN_COMPOSITION.json')),'5ac13873764915178847c6ca25f7ee73b80f40b9047b3bba74e084898d60922f');
assert.equal(sha(read(six+'/MAIN_COMPOSITION_REFUSAL.json')),'511e2467318cf46ff6893e5347e6def387d6dd28777edab6b2703084b6f2d168');
const composed=json(six+'/MAIN_COMPOSITION.json');assert.equal(composed.checks.length,3);
assert.equal(composed.tongue.changedMriLessons,30);assert.equal(composed.tongue.originalQuizPlacementsRetained,8);
assert.equal(composed.tongue.exactCompleteSnapshotInverse,true);
assert.equal(sha(read(six+'/CODE/tests/tongue-palate-delivery.test.ts')),'5dd1101cc8ce1a84618878d905b890d82484229bef3efc1c71c8015c4546b665');
for(const packet of packets){
 for(const name of packet.tests){
  const file='tests/'+name,beforePath=packet.stage+'/RAW/'+file,proposal=packet.stage+'/CODE/'+file;
  assert.equal(sha(read(beforePath)),sha(read(source.website+'/'+file)),file+': full V5 preimage');
  repairs.push({path:file,beforePath,beforeSha256:sha(read(beforePath)),proposal,proposalSha256:sha(read(proposal))});
 }
 batches.push({...packet,proofSha256:sha(read(packet.stage+'/SOURCE_PROOF.mjs')),completeInverseAndDependencyProofMainExecuted:true});
}
assert.equal(repairs.length,20);assert.equal(new Set(repairs.map(row=>row.path)).size,20);
for(const row of [...prior.repairs,...prior.additionalFiles,...prior.alreadyPresent])assert.equal(sha(read(row.proposal??row.from)),row.proposalSha256??row.sha256);
const output='F:/VisibleMedicine/staging/20261022-reviewed-native-followup-consolidated';assert(!fs.existsSync(output));fs.mkdirSync(output);
const proposedNextNativeRoots=[...new Set([...prior.proposedNextNativeRoots,...repairs.map(row=>row.path),
 'tests/closed54-55-provider-preservation.test.mjs','tests/historical-head-toolbar-css-preservation-57-closed.test.mjs'])];
const result={...prior,at:new Date().toISOString(),previous,previousSha256:sha(read(previous)),batches,repairs,proposedNextNativeRoots,
 phase:'20 main-reviewed source-only proposals; await real 172-root terminal before overlay',
 selectedCompleteOriginalInverses:20,sourceComposition:{receipt:six+'/MAIN_COMPOSITION.json',sha256:sha(read(six+'/MAIN_COMPOSITION.json')),
  originalRefusal:six+'/MAIN_COMPOSITION_REFUSAL.json',originalRefusalSha256:sha(read(six+'/MAIN_COMPOSITION_REFUSAL.json')),initialFalseUnchangedSnapshotClaimCorrected:true,
  exactChangedMriLessons:30,completeOriginal6036SnapshotRestored:true,quizSourceFilesUnchanged:3,completeQuizPlacementsUnchanged:8},
 selectedStrictCurrentPinAndValidatorChanged:false,clinicalOrAnatomicalDataChanged:false,
 sourceBackup:'New source proposals remain local-only until a new verified filtered backup; raw generated metadata fixtures must remain local.',
 next:'Keep V5 frozen for the running172-root job. After real terminal and diagnosis, integrate this full20-proposal/5-addition source plan with exact preimages and run all29 listed roots plus relevant types. No unchanged production build rerun. Keep initial rejected tongue proposal and proof/allocation diagnostics. Preserve full original5860/280,136/87/144 and71/eight scope; source-only proofs are not native/clinical/browser release approval. Fresh normal-draft clearance still precedes owner preview cutover.',
};
assert.equal(proposedNextNativeRoots.length,29);
fs.writeFileSync(output+'/PLAN.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
const pointer=json('CURRENT_CHECKPOINT.json');pointer.activeWork.pendingReviewTourFollowups={...pointer.activeWork.pendingReviewTourFollowups,
 supersededBy:output+'/PLAN.json',receipt:output+'/PLAN.json',sha256:sha(read(output+'/PLAN.json')),repairs:20,additions:5,nextNativeRoots:29,phase:result.phase,next:result.next};
pointer.activeWork.pendingSixClinicalRuntimeAdmission={...pointer.activeWork.pendingSixClinicalRuntimeAdmission,phase:'corrected and independently source-composition proved; unintegrated',
 sourceCompositionAccepted:true,proof:six+'/MAIN_COMPOSITION.json',proofSha256:sha(read(six+'/MAIN_COMPOSITION.json')),firstRefusalRetained:true};
pointer.activeWork.updated=result.at;
fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({receipt:output+'/PLAN.json',sha256:sha(read(output+'/PLAN.json')),repairs:20,additions:5,nextNativeRoots:29,candidateChanged:false}));
