import assert from 'node:assert/strict';
import path from 'node:path';
import {read,json,sha} from './source-only-backup-20261019.mjs';
import {backupReviewedRegressionQueue} from './backup-reviewed-regression-queue-20261022.mjs';
const root='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking',receipt=root+'/PRODUCT_SOURCE_V5.json',source=json(receipt);
const head=json(root+'/native-head-guard/TERMINAL.json'),cranio=json(root+'/native-craniofacial-current/TERMINAL.json'),types=json(root+'/quality-types-v5/TERMINAL.json');
for(const result of [head,cranio,types]){assert.equal(result.code,0);assert.deepEqual(result.sourceDrift,[]);}
assert.equal(head.counts.pass,46);assert.equal(cranio.counts.pass,47);
const prior=json(root+'/PRODUCT_SOURCE_V3.json');
assert.deepEqual(source.sourceRows.filter(row=>!row.path.startsWith('tests/')),prior.sourceRows.filter(row=>!row.path.startsWith('tests/')),'Reused build has the identical non-test graph');
for(const row of source.sourceRows)assert.equal(sha(read(source.website+'/'+row.path)),row.sha256);
const additions=[],prefix='pending/regional-runtime-linking-20261022/head-cranio-controls/';
for(const name of ['head-cerebellar-review.test.ts','head-deep-grey-review.test.ts','head-hippocampal-clinical.test.ts','head-lobar-review.test.ts','head-ventricular-review.test.ts'])for(const part of ['CODE','RAW']){
 const from='F:/VisibleMedicine/staging/20261022-head-review-guard-harness/'+part+'/tests/'+name;
 additions.push({path:prefix+part+'/tests/'+name,from,sha256:sha(read(from))});
}
for(const part of ['CODE','RAW']){
 const from='F:/VisibleMedicine/staging/20261022-craniofacial-current-family-admission/'+part+'/tests/craniofacial-ct-current-delivery.test.mjs';
 additions.push({path:prefix+part+'/tests/craniofacial-ct-current-delivery.test.mjs',from,sha256:sha(read(from))});
}
for(const name of ['head-review-guard-harness','craniofacial-current-family-admission']){
 const from='F:/VisibleMedicine/staging/20261022-'+name+'/SOURCE_PROOF.mjs';
 additions.push({path:prefix+'proofs/'+name+'.mjs',from,sha256:sha(read(from))});
}
const queue='F:/VisibleMedicine/staging/20261022-clinical-runtime-family-consolidated/QUEUE.json';
backupReviewedRegressionQueue({queuePath:queue,queueSha256:'23d98d1a329bedd8d9007518f5d6fd0a1143553dfea9edaf16e571269d946993',expectedProposals:161,
 parentReceipt:'F:/VisibleMedicine/recovery/checkpoints/20261022-clinical-runtime-product-source-backup/github-backup.json',
 parentReceiptSha256:'5a993ebe7ef1c40e06a84deed912892f6c2f0461cae4af60e5b257d18848e2ff',parentRepo:'F:/VisibleMedicine/history/website-work/github-clinical-runtime-product-20261022.git',
 stem:'head-cranio-controls',additionalSourceFiles:additions,
 coordinationScripts:['prepare-head-review-guard-followup-20261022.mjs','verify-head-review-guard-followup-20261022.mjs','prepare-craniofacial-current-followup-20261022.mjs',
  'verify-craniofacial-current-followup-20261022.mjs','verify-regional-runtime-quality-20261022.mjs','start-regional-runtime-qa-proxy-20261022.mjs','backup-head-cranio-controls-20261022.mjs','checkpoint-head-cranio-controls-20261022.mjs'],
 productProof:{sourceReceiptSha256:sha(read(receipt)),sourcePaths:6042,headChecks:head.counts,craniofacialChecks:cranio.counts,fullTypes:true,
  productBuildReusedOnlyAfterExactNonTestIdentity:true,sourceBoundSpecimenRouteBrowserChecked:true,fullMriScanWorkflowBrowserChecked:false,
  browserImagesAndLogsUploaded:false,canonicalInstalled:false,ownerPreviewChanged:false,clinicalApproval:false,patientRegistration:false,wholeSuitePassing:false},
});
