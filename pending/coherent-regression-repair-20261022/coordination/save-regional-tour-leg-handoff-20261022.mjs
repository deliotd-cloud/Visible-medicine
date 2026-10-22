// Scoped local source handoff only: no remote, validator, UI or canonical write.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read=p=>readFileSync(p),sha=b=>createHash('sha256').update(b).digest('hex');
const root='F:/VisibleMedicine/recovery/checkpoints/20261022-regional-tour-leg-source-handoff';
assert(!existsSync(root));
const pointer=JSON.parse(read('CURRENT_CHECKPOINT.json'));
const queue=pointer.activeWork.pendingRegressionRepairQueue;
assert.equal(queue.sha256,'69bf8a07fe2b7bee6357169d4ae03127c59958290784ec0de2588eb4795f602b');
assert(queue.sourceBackupIncludesThisWholeBatch);
const website='F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate/website';
const packets=[
 {stage:'F:/VisibleMedicine/staging/20261022-regional-tour-runtime-family-admission',code:'CODE',raw:'RAW',proof:'SOURCE_PROOF.mjs',proofSha256:'dd9244ee0b05d2173cd475377a33455bf7c162eaaaf8f3a16a5510bf790f951e',names:['clinical-review-elbow-arterial-tour.test.ts','clinical-review-lower-venous-tour-v2.test.ts','clinical-review-medial-thigh-tour.test.ts','clinical-review-portal-hepatic-tour.test.ts','clinical-review-pulmonary-venous-tour.test.ts','clinical-review-regional-tour.test.ts','clinical-epoch-batch-c-originals.test.mjs','elbow-current-lifecycle-preservation.test.mjs','regional-tour-role-preservation-20261021.test.mjs']},
 {stage:'F:/VisibleMedicine/staging/20261022-branch-hip-iliac-hepatic-family-admission',code:'proposal',raw:'original',proof:'prove-source.mjs',proofSha256:'917602d9916da84cd82d168ddf09ebac7e3b63407f8f5e391a6e40c0dd790e3f',names:['clinical-review-forearm-branch-xray.test.ts','clinical-review-hepatic-arterial-xray.test.ts','clinical-review-hip-muscle-xray.test.ts','clinical-review-iliac-venous-xray.test.ts','clinical-review-intracranial-arterial-xray.test.ts']},
 {stage:'F:/VisibleMedicine/staging/20261022-leg-vessel-source-family-admission',code:'CODE',raw:'RAW',proof:null,names:['clinical-review-leg-arterial-xray.test.ts','clinical-review-leg-venous-xray.test.ts']},
];
const selected=JSON.parse(read(queue.receipt));
for(const packet of packets){
 if(packet.proof)assert.equal(sha(read(packet.stage+'/'+packet.proof)),packet.proofSha256);
 packet.rows=packet.names.map(name=>{
  const path='tests/'+name,before=read(packet.stage+'/'+packet.raw+'/'+path),proposal=read(packet.stage+'/'+packet.code+'/'+path);
  assert.deepEqual(before,read(website+'/'+path));assert(!selected.repairs.some(row=>row.path===path));assert.notDeepEqual(proposal,before);
  return {path,beforeSha256:sha(before),proposalSha256:sha(proposal)};
 });
 packet.mainReadDiffAndExecutedSourceProof=true;packet.nativeRerun=false;packet.inSelectedQueue=false;packet.remoteBackupVerified=false;
}
assert.equal(packets.reduce((n,p)=>n+p.rows.length,0),16);
const legProof=JSON.parse(read(packets[2].stage+'/SOURCE_PROOF_RESULT.json'));
assert.equal(legProof.wholeOriginalInverses,2);assert.equal(legProof.mutationRefusals,6);assert.equal(legProof.nativeExecuted,false);
const handoff={at:new Date().toISOString(),sourceOnly:true,mainIntegrationRequired:true,noNativeRerunWhileSession92110Live:true,reviewedPendingPackets:packets,
 staleWorkerProofRefused:{stage:packets[1].stage,reason:'Three CODE proposals acquired strict validator imports after their first proof. Main refused the stale inverse/hash handoff; worker froze CODE and refreshed actual proof before acceptance.',earlierProofSha256:'cbb07ae327e8f5245c0ed33fd568cb95fd7e53d6801f3e33eabcb8a8e93aa459',selectedProofSha256:packets[1].proofSha256,noCanonicalOrFrozenChange:true},
 workers:[
  {agent:'/root/nonhead_expansion_harness_1022',stage:'F:/VisibleMedicine/staging/20261022-clinical-batch-c-family-closure',state:'Assigned: four remaining Batch-C consumers plus all-eight compositional witness; retain historical original map/hunks and negative checks',paths:['tests/clinical-review-limb-nerve-quiz.test.ts','tests/clinical-review-longus-colli-quiz.test.ts','tests/clinical-review-median-cubital-xray.test.ts','tests/clinical-review-mesenteric-vessel-teaching.test.ts','tests/clinical-epoch-batch-c-originals.test.mjs'],mainReviewed:false},
  {agent:'/root/paused_pelvic_source_families_1022',stage:'F:/VisibleMedicine/staging/20261022-orbital-neonatal-family-admission',state:'Assigned: five direct orbital/neonatal question tests; report dependencies before outside edits',paths:['tests/clinical-review-neonatal-cranial-us.test.ts','tests/clinical-review-orbital-apex-ct.test.ts','tests/clinical-review-orbital-ring-ct.test.ts','tests/clinical-review-orbital-sensory-mri.test.ts','tests/clinical-review-short-ciliary-quiz.test.ts'],identifiedUnownedDependencies:['tests/clinical-epoch-batch-d-preservation.test.mjs','tests/clinical-question-role-preservation-20261021.test.mjs'],mainReviewed:false}
 ],
 sourceAssemblyPlanner:{script:'prepare-reviewed-regression-candidate-20261022.mjs',sha256:'e85add4b4cc2fc787aaf906466b50fbba3cd158e138c4866afb89d58522310a8',proof:'F:/VisibleMedicine/staging/20261022-regional-imaging-assembly-plan-proof/RESULT.json',proofSha256:'81e32fa74b583392938ab3fcf586835526b81cd7f37c61728cb946899d2a9eab',realAssemblyPerformed:false},
 forwardingSourceProof:{receipt:'F:/VisibleMedicine/staging/20261022-navigation-historical-forwarding-proof/RESULT.json',sha256:'a5bcce139d126939159a629171112113a7070e2e562a64d43b6d97a5eb867d4f',actualForwardingCases:4,validatorExecuted:false},
 next:'Finish complete Batch-C and orbital preservation closures, then select one coherent next queue without duplicate paths; do not integrate the intermediate Batch-C witness over the final all-eight witness. Keep actual1143 regression/frozen5811 candidate/clean Atlas6d7 and owner preview unchanged. Native acceptance requires original affected roots/helpers/types/build and strict refusals once actual heavy run terminates. Further untriaged observed failures remain; full71/eight goal is active, no clinical sign-off stall.'};
for(const record of [handoff.sourceAssemblyPlanner,handoff.forwardingSourceProof])assert.equal(sha(read(record.proof??record.receipt)),record.proofSha256??record.sha256);
mkdirSync(root,{recursive:true});writeFileSync(root+'/SOURCE_HANDOFF.json',JSON.stringify(handoff,null,2)+'\n',{flag:'wx'});
pointer.activeWork.pendingRegressionWorkerHandoffs=handoff;pointer.activeWork.latestMainCoordinationMapSha256=sha(read('WORKSPACE_MAP.md'));pointer.activeWork.updated=handoff.at;
writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({receipt:root+'/SOURCE_HANDOFF.json',sha256:sha(read(root+'/SOURCE_HANDOFF.json')),reviewedLocalPendingPaths:16,selectedQueueRemoteVerifiedPaths:97,ownerPreviewChanged:false,nativePassingClaim:false}));
