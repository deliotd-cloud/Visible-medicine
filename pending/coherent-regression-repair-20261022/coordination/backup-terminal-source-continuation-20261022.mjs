import assert from 'node:assert/strict';
import {json,read,sha} from './source-only-backup-20261019.mjs';
import {backupReviewedRegressionQueue} from './backup-reviewed-regression-queue-20261022.mjs';

const planPath='F:/VisibleMedicine/staging/20261022-terminal-source-continuation/PLAN.json';
assert.equal(sha(read(planPath)),'c434483f2f05fba330d3412655716a7fb76c3b8c50294509571fe024260fa46f');
const plan=json(planPath),sourcePath='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking/PRODUCT_SOURCE_V6.json';
assert.equal(sha(read(sourcePath)),'44b20981b029abc59f4a5efcaa2c8e6a9fbddb7e2e00886c0db914646681169c');
const source=json(sourcePath);
for(const row of source.sourceRows)assert.equal(sha(read(source.website+'/'+row.path)),row.sha256);
const prefix='pending/regional-runtime-linking-20261022/terminal-source-continuation/';
const selected=new Map();
function add(from){
 from=from.replaceAll('\\','/');assert(from.startsWith('F:/VisibleMedicine/staging/'));
 assert(/\.(?:mjs|ts|raw)$/.test(from)&&!from.endsWith('.json.raw'),'Authored source, not generated metadata: '+from);
 const path=prefix+from.slice('F:/VisibleMedicine/staging/'.length);
 selected.set(path,{path,from,sha256:sha(read(from))});
}
for(const row of plan.repairs){assert.equal(sha(read(row.proposal)),row.proposalSha256);assert.equal(sha(read(row.beforePath)),row.beforeSha256);add(row.proposal);add(row.beforePath);}
const excludedGenerated=[];
for(const row of plan.additionalFiles){assert.equal(sha(read(row.from)),row.sha256);if(/\.(?:mjs|ts|raw)$/.test(row.from)&&!row.from.endsWith('.json.raw'))add(row.from);else excludedGenerated.push(row.path);}
for(const batch of plan.batches)for(const proof of batch.proofs??[]){
 assert.equal(sha(read(proof.path)),proof.sha256);assert.equal(proof.mainExecutedExitCode,0);
 if(/\.(?:mjs|ts|raw)$/.test(proof.path))add(proof.path);
}
for(const file of [
 '20261022-current-head-history-closure/MAIN_TEST_SOURCE_INVERSE.before-literal-count.mjs',
 '20261022-ui-dependent-source-followups/MAIN_PROOF.before-module-loader.mjs',
 '20261022-ui-dependent-source-followups/MAIN_PROOF.before-case-count.mjs',
 '20261022-terminal-source-continuation/PREPARER.before-versioned-preflight.mjs',
])add('F:/VisibleMedicine/staging/'+file);
backupReviewedRegressionQueue({queuePath:source.queue,queueSha256:source.queueSha256,expectedProposals:161,
 parentReceipt:'F:/VisibleMedicine/recovery/checkpoints/20261022-reviewed-source-continuation-source-backup/github-backup.json',
 parentReceiptSha256:'398f3b04fed46c694f27a00b6971fc7194968e377c7bc58aa9f5fd2f89d16825',
 parentRepo:'F:/VisibleMedicine/history/website-work/github-reviewed-source-continuation-20261022.git',
 stem:'terminal-source-continuation',additionalSourceFiles:[...selected.values()],
 coordinationScripts:['record-selected-native-terminal-20261022.mjs','select-terminal-source-followups-20261022.mjs',
  'prepare-reviewed-source-followups-20261022.mjs','verify-terminal-source-followups-20261022.mjs',
  'review-source-packet-20261022.mjs','test-source-packet-inverse-20261022.mjs',
  'prepare-ui-dependent-source-followups-20261022.mjs','prove-ui-dependent-source-followups-20261022.mjs',
  'backup-terminal-source-continuation-20261022.mjs','checkpoint-terminal-source-continuation-20261022.mjs'],
 productProof:{selectedPlanSha256:sha(read(planPath)),sourceReceiptSha256:sha(read(sourcePath)),
  selectedRepairs:68,selectedAdditions:7,selectedNativeRoots:101,sourcePaths:6049,
  originalTerminalCounts:{tests:386,pass:355,fail:31,cancelled:0,skipped:0,todo:0},
  actualFailureMarkersDiagnosed:31,wholeOriginalSourceInversesRetained:true,
  sharedCurrentPinAndValidatorsUnchanged:true,nonTestProductBytesUnchanged:true,
  isolatedV6OverlayOnly:true,normalPreviewExplicitlyUnchanged:true,
  nativeV6AcceptancePending:true,excludedGeneratedMetadataAdditions:excludedGenerated,
  initialFailedProofSourceVersionsRetained:true,rawLogsScansModelsPrivateStateExcluded:true,
  wholeSuitePassing:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false},
});
