import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {read,json,sha} from './source-only-backup-20261019.mjs';
import {backupReviewedRegressionQueue} from './backup-reviewed-regression-queue-20261022.mjs';
const root='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking';
const source=json(root+'/PRODUCT_SOURCE_V3.json'),native=json(root+'/native-mri-runtime-v3/TERMINAL.json');
assert.equal(native.code,0);assert.equal(native.counts.fail,0);assert.equal(native.counts.skipped,0);assert.deepEqual(native.sourceDrift,[]);
const types=json(root+'/quality-types-v3/TERMINAL.json'),build=json(root+'/quality-build-v3/TERMINAL.json');
for(const result of [types,build]){assert.equal(result.code,0);assert.deepEqual(result.sourceDrift,[]);}
const final=new Map(),extra=[];
for(const row of [...source.overlay,...source.subsequentTestOverlays]){
 final.set(row.path,row);
 if(row.beforeSha256!==null){
  const normal=row.from.replaceAll('\\','/');assert(normal.includes('/CODE/'));
  const from=normal.replace('/CODE/','/RAW/');assert.equal(sha(read(from)),row.beforeSha256);
  extra.push({path:'pending/regional-runtime-linking-20261022/preimages/'+path.basename(path.dirname(path.dirname(path.dirname(normal))))+'/'+row.path,from,sha256:row.beforeSha256});
 }
}
for(const row of final.values()){
 assert.equal(sha(read(source.website+'/'+row.path)),row.sha256);
 extra.push({path:'pending/regional-runtime-linking-20261022/website/'+row.path,from:row.from,sha256:row.sha256});
}
for(const name of ['regional-runtime-draft-ui-preservation','regional-runtime-index-history','thoracic-eus-binding-name']){
 const from='F:/VisibleMedicine/staging/20261022-'+name+'/SOURCE_PROOF.mjs';
 extra.push({path:'pending/regional-runtime-linking-20261022/proofs/'+name+'.mjs',from,sha256:sha(read(from))});
}
for(const name of ['head-cerebellar-review.test.ts','head-deep-grey-review.test.ts','head-hippocampal-clinical.test.ts','head-lobar-review.test.ts','head-ventricular-review.test.ts'])for(const part of ['CODE','RAW']){
 const from='F:/VisibleMedicine/staging/20261022-head-review-guard-harness/'+part+'/tests/'+name;
 extra.push({path:'pending/regional-runtime-linking-20261022/next-head-harness/'+part+'/tests/'+name,from,sha256:sha(read(from))});
}
const headProof='F:/VisibleMedicine/staging/20261022-head-review-guard-harness/SOURCE_PROOF.mjs';
extra.push({path:'pending/regional-runtime-linking-20261022/next-head-harness/SOURCE_PROOF.mjs',from:headProof,sha256:sha(read(headProof))});
assert.equal(new Set(extra.map(row=>row.path)).size,extra.length,'Unique named authored-source/preimage paths');
for(const row of source.sourceRows)assert.equal(sha(read(source.website+'/'+row.path)),row.sha256,'Closed final candidate');
const queue='F:/VisibleMedicine/staging/20261022-clinical-runtime-family-consolidated/QUEUE.json';
backupReviewedRegressionQueue({queuePath:queue,queueSha256:'23d98d1a329bedd8d9007518f5d6fd0a1143553dfea9edaf16e571269d946993',expectedProposals:161,
 parentReceipt:'F:/VisibleMedicine/recovery/checkpoints/20261022-regional-tour-orbital-family-admission-source-backup/github-backup.json',
 parentReceiptSha256:'9f2fe335d7f2b6ba398b968a157f6e2e4aca4fefe6e05dc8149af5dc67828f10',parentRepo:'F:/VisibleMedicine/history/website-work/github-regional-tour-orbital-family-admission-20261022.git',
 stem:'clinical-runtime-product',additionalSourceFiles:extra,
 coordinationScripts:['consolidate-clinical-runtime-family-admission-20261022.mjs','prepare-regional-runtime-product-candidate-20261022.mjs','overlay-regional-runtime-test-repairs-20261022.mjs','verify-regional-runtime-product-candidate-20261022.mjs','verify-regional-runtime-quality-20261022.mjs','backup-clinical-runtime-product-20261022.mjs','checkpoint-clinical-runtime-product-20261022.mjs'],
 productProof:{sourceReceiptSha256:sha(read(root+'/PRODUCT_SOURCE_V3.json')),sourceFiles:final.size,focusedNative:native.counts,fullTypes:true,containedBuild:true,ownerPreviewChanged:false,patientRegistration:false,clinicalApproval:false,wholeSuitePassing:false},
});
