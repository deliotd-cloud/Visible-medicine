import assert from 'node:assert/strict';
import path from 'node:path';
import {json,read,sha} from './source-only-backup-20261019.mjs';
import {backupReviewedRegressionQueue} from './backup-reviewed-regression-queue-20261022.mjs';
const planPath='F:/VisibleMedicine/staging/20261022-native-runtime-followups-consolidated/PLAN.json';
assert.equal(sha(read(planPath)),'e46623e9018cf718ca2dcfacb0f9d9f06cff867870b19ea8c8d094a5446047f1');
const plan=json(planPath),source=json(plan.sourceReceipt);
for(const row of source.sourceRows)assert.equal(sha(read(source.website+'/'+row.path)),row.sha256);
const additions=[],prefix='pending/regional-runtime-linking-20261022/native-source-followups/';
function add(from){from=from.replaceAll('\\','/');assert(from.startsWith('F:/VisibleMedicine/staging/'));assert(/\.(mjs|ts|raw)$/.test(from));
 additions.push({path:prefix+from.slice('F:/VisibleMedicine/staging/'.length),from,sha256:sha(read(from))});}
const newRepairs=plan.repairs.slice(20);assert.equal(newRepairs.length,4);
for(const row of newRepairs){assert.equal(sha(read(row.proposal)),row.proposalSha256);assert.equal(sha(read(row.beforePath)),row.beforeSha256);add(row.proposal);add(row.beforePath);}
for(const batch of plan.batches.slice(4)){assert.equal(sha(read(batch.stage+'/SOURCE_PROOF.mjs')),batch.proofSha256);add(batch.stage+'/SOURCE_PROOF.mjs');}
const original='F:/VisibleMedicine/staging/20261022-intracranial-license-checkout-followup';
for(const file of ['CODE/tests/atlas-intracranial-arterial-ultrasound.test.mjs','RAW/tests/atlas-intracranial-arterial-ultrasound.test.mjs','SOURCE_PROOF.mjs'])add(original+'/'+file);
assert.equal(new Set(additions.map(row=>row.path)).size,additions.length);
backupReviewedRegressionQueue({queuePath:source.queue,queueSha256:source.queueSha256,expectedProposals:161,
 parentReceipt:'F:/VisibleMedicine/recovery/checkpoints/20261022-review-tour-followups-source-backup/github-backup.json',
 parentReceiptSha256:'6950a0535ac0c683f2e9cb5a03e4e77d1363285fdd30d904b03688b2097c7301',
 parentRepo:'F:/VisibleMedicine/history/website-work/github-review-tour-followups-20261022.git',stem:'native-source-followups',additionalSourceFiles:additions,
 coordinationScripts:['consolidate-native-source-followups-20261022.mjs','prepare-native-source-followups-20261022.mjs','backup-native-source-followups-20261022.mjs',
  'checkpoint-native-source-followups-20261022.mjs','prepare-review-tour-followups-20261022.mjs','checkpoint-review-tour-admissions-20261022.mjs'],
 productProof:{planSha256:sha(read(planPath)),sourceReceiptSha256:sha(read(plan.sourceReceipt)),selectedFollowupRepairs:24,newSourceRepairs:4,
  nextNativeRoots:35,sourceOnlyInputRecordsVerified:2876,exactGitBlobsVerified:1617,wholeV5AndAllHistoricalInversesPreserved:true,
  firstLicenseOnlyProposalPreserved:true,licenseVerifierAndSharedPinUnchanged:true,newNativeBatchExecuted:false,
  canonicalInstalled:false,ownerPreviewChanged:false,wholeSuitePassing:false,clinicalApproval:false,patientRegistration:false},
});
