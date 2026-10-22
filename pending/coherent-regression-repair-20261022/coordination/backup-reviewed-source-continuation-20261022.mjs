import assert from 'node:assert/strict';
import {json,read,sha} from './source-only-backup-20261019.mjs';
import {backupReviewedRegressionQueue} from './backup-reviewed-regression-queue-20261022.mjs';
const planPath='F:/VisibleMedicine/staging/20261022-reviewed-source-continuation/PLAN.json';
assert.equal(sha(read(planPath)),'3ea1ec6220680ce72cc6796925b8066107258cc1fbdd3f5328d2df332901aa71');
const plan=json(planPath),previous=json(plan.previous),source=json(plan.sourceReceipt);
for(const row of source.sourceRows)assert.equal(sha(read(source.website+'/'+row.path)),row.sha256);
const additions=[],prefix='pending/regional-runtime-linking-20261022/reviewed-source-continuation/';
function add(from){
 from=from.replaceAll('\\','/');assert(from.startsWith('F:/VisibleMedicine/staging/'));
 assert(/\.(mjs|ts|raw)$/.test(from),'Authored source only: '+from);
 additions.push({path:prefix+from.slice('F:/VisibleMedicine/staging/'.length),from,sha256:sha(read(from))});
}
for(const row of plan.repairs.slice(previous.repairs.length)){
 assert.equal(sha(read(row.proposal)),row.proposalSha256);assert.equal(sha(read(row.beforePath)),row.beforeSha256);
 add(row.proposal);add(row.beforePath);
}
for(const row of plan.additionalFiles.slice(previous.additionalFiles.length)){assert.equal(sha(read(row.from)),row.sha256);add(row.from);}
for(const batch of plan.batches.slice(previous.batches.length))for(const proof of batch.proofs){
 assert.equal(sha(read(proof.path)),proof.sha256);assert.equal(proof.mainExecutedExitCode,0);add(proof.path);
}
for(const file of [
 '20261022-desktop-frame-history-followup/CODE/tests/colic-adapter-inverse.test.mjs',
 '20261022-desktop-frame-history-followup/RAW/tests/colic-adapter-inverse.test.mjs',
 '20261022-colic-complete-source-followup/PREDECESSOR/tests/colic-adapter-inverse.test.mjs',
 '20261022-original-failure-coverage-triage/build-evidence.mjs',
 '20261022-paused-tour-runtime-followup/CODE/tests/atlas-paused-tour-imaging-checks.mjs',
 '20261022-paused-tour-runtime-followup/RAW/tests/atlas-paused-tour-imaging-checks.mjs',
 '20261022-paused-tour-runtime-followup/PROVE_SOURCE.mjs',
 ])add('F:/VisibleMedicine/staging/'+file);
assert.equal(new Set(additions.map(row=>row.path)).size,additions.length);
backupReviewedRegressionQueue({queuePath:source.queue,queueSha256:source.queueSha256,expectedProposals:161,
 parentReceipt:'F:/VisibleMedicine/recovery/checkpoints/20261022-native-source-followups-source-backup/github-backup.json',
 parentReceiptSha256:'2fd938a941c6427de21d705b4d7aed9e005c5bfce10e8427fe94df18e8130db4',
 parentRepo:'F:/VisibleMedicine/history/website-work/github-native-source-followups-20261022.git',
 stem:'reviewed-source-continuation',additionalSourceFiles:additions,
 coordinationScripts:['create-reviewed-source-continuation-20261022.mjs','prepare-reviewed-source-followups-20261022.mjs',
  'audit-colic-source-closure-20261022.mjs','backup-reviewed-source-continuation-20261022.mjs',
  'checkpoint-reviewed-source-continuation-20261022.mjs','record-preview-hold-20261022.mjs'],
 productProof:{planSha256:sha(read(planPath)),sourceReceiptSha256:sha(read(plan.sourceReceipt)),selectedFollowupRepairs:47,
  additions:6,nextNativeRoots:89,originalFailurePaths:224,formerlyUnselectedPaths:33,
  fullV5AndHistoricalTheoremsPreserved:true,colicAll13SourcePatchesProved:true,
  headEntrypointCurrentAndHistoricalRolesSeparate:true,pausedProposalNotSelected:true,
  rawDiagnosticLogsAndGeneratedMetadataFixturesExcluded:true,independentSourceProofsNotNativeAcceptance:true,
  current172RootRunStillUnaccepted:true,canonicalInstalled:false,ownerPreviewChanged:false,
  ownerExplicitlyHoldsNormalPreview:true,wholeSuitePassing:false,clinicalApproval:false,patientRegistration:false},
});
