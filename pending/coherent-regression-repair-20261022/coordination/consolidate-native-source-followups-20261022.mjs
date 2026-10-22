import assert from 'node:assert/strict';
import fs from 'node:fs';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const previous='F:/VisibleMedicine/staging/20261022-reviewed-native-followup-consolidated/PLAN.json';
assert.equal(sha(read(previous)),'23b5b61d15d76ba96963efa4a20a97ea20476c02006a75f364afa0eb2b011228');
const prior=json(previous),source=json(prior.sourceReceipt);
for(const row of source.sourceRows)assert.equal(sha(read(source.website+'/'+row.path)),row.sha256);
const packets=[
 {stage:'F:/VisibleMedicine/staging/20261022-intracranial-runtime-family-followup',files:[
  ['atlas-intracranial-arterial-ultrasound.test.mjs','be62fa493b5e4c3bcb951233cb432a874a25119fa4e92b7bea25e91c9dd55c39']]},
 {stage:'F:/VisibleMedicine/staging/20261022-spinal-dispatch-source-followup',files:[
  ['atlas-spinal-muscle-xray.test.mjs','7a39e919130ce257d590f564b0a9839857df9b2a1c3c786cf2805527fe79e01b'],
  ['spinal-current-source-inverse.mjs','3008622e5256507d67006ca128488decf53d037ad5318f8d896c62ebc9524c89']]},
 {stage:'F:/VisibleMedicine/staging/20261022-question-regional-composition-followup',files:[
  ['clinical-question-role-preservation-20261021.test.mjs','969b1860dffde7f30ab07d7eabefbbdeb8287eefd6ec7064ac16d0c1a20200b9']]},
];
const repairs=[...prior.repairs],batches=[...prior.batches];
for(const packet of packets){
 for(const [name,digest]of packet.files){const path='tests/'+name,beforePath=packet.stage+'/RAW/'+path,proposal=packet.stage+'/CODE/'+path;
  assert.equal(sha(read(beforePath)),sha(read(source.website+'/'+path)));assert.equal(sha(read(proposal)),digest);
  repairs.push({path,beforePath,beforeSha256:sha(read(beforePath)),proposal,proposalSha256:digest});
 }
 batches.push({stage:packet.stage,tests:packet.files.map(([name])=>name),proofSha256:sha(read(packet.stage+'/SOURCE_PROOF.mjs')),
  completeInverseAndDependencyProofMainExecuted:true});
}
assert.equal(repairs.length,24);assert.equal(new Set(repairs.map(row=>row.path)).size,24);
for(const row of prior.repairs){assert.equal(sha(read(row.proposal)),row.proposalSha256);assert.equal(sha(read(row.beforePath)),row.beforeSha256);}
const proposedNextNativeRoots=[...new Set([...prior.proposedNextNativeRoots,...repairs.map(row=>row.path).filter(path=>/\.test\.[cm]?[jt]sx?$/.test(path)),
 'tests/spinal-later-six-preservation.test.mjs','tests/spinal-ct-save-refusal-preservation.test.mjs','tests/clinical-review-regional-muscle-completion-quiz.test.ts'])];
assert.equal(proposedNextNativeRoots.length,35);
const output='F:/VisibleMedicine/staging/20261022-native-runtime-followups-consolidated';assert(!fs.existsSync(output));fs.mkdirSync(output);
const result={...prior,at:new Date().toISOString(),previous,previousSha256:sha(read(previous)),repairs,batches,proposedNextNativeRoots,
 phase:'24 exact source repairs including23test roots plus1inverse helper; native35-root verification pending',selectedCompleteOriginalInverses:24,
 partialRunFollowups:{ids:[45,73,116],terminalCounts:false,
  intracranial:{selected:packets[0].stage,sourceOnlyRuntimeRecordsChecked:2876,gitBlobs:1617,reviewAndRuntimeFamiliesSeparate:true,
   firstLicenseOnlyProposal:'F:/VisibleMedicine/staging/20261022-intracranial-license-checkout-followup',firstProposalIncompleteBeyondLicenseRow:true,
   licenseVerifierUnchanged:'tests/cerebral-checkout-current-adapter.mjs',licenseVerifierSha256:'d7337d329f19dbf4335ee3adc0e1532f9d1e177254039c0fb9ad015a240e6b8d'},
  spinal:{selected:packets[1].stage,newestColicAndPriorV5AdaptersBeforeSixFrozenInverses:true},
  question:{selected:packets[2].stage,fullCurrentPriorOriginalRegionalQuizComposition:true}},
 newFourSourceRepairsOffDeviceBackedUp:false,candidateChanged:false,
 next:'Poll live172-root session14480; keep V5 immutable and no second heavy job. Only actual TERMINAL and diagnostic review permit coherent24repair/5addition overlay and35native roots/types. Preserve original20plan, first license-only proposal, allsource/refusal histories, original5860/280 and136/87/144, full71/eight and independent access. No unchanged production rebuild, clinical approval, spatial registration, private upload, public deploy or desktopPACS changes. Fresh owner saved-draft clearance still precedes preview cutover.',
};
fs.writeFileSync(output+'/PLAN.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
const pointer=json('CURRENT_CHECKPOINT.json');pointer.activeWork.pendingReviewTourFollowups={...pointer.activeWork.pendingReviewTourFollowups,
 supersededBy:output+'/PLAN.json',receipt:output+'/PLAN.json',sha256:sha(read(output+'/PLAN.json')),repairs:24,additions:5,nextNativeRoots:35,
 phase:result.phase,newFourSourceRepairsOffDeviceBackedUp:false,proposalsOffDeviceBackedUp:false,next:result.next};
pointer.activeWork.current.followupPlan=output+'/PLAN.json';pointer.activeWork.current.followupPlanSha256=sha(read(output+'/PLAN.json'));
pointer.activeWork.current.partialRunFollowups=result.partialRunFollowups;pointer.activeWork.current.next=result.next;
pointer.activeWork.current.proposalCodeSourceBackedUp=false;pointer.activeWork.current.previous20ProposalCodeBackedUp=true;
pointer.activeWork.updated=result.at;fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({receipt:output+'/PLAN.json',sha256:sha(read(output+'/PLAN.json')),repairs:24,additions:5,nextNativeRoots:35,candidateChanged:false}));
