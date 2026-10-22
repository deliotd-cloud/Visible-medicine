import assert from 'node:assert/strict';
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {json,read,sha} from './source-only-backup-20261019.mjs';
import {fullSourceInverse} from './review-source-packet-20261022.mjs';
const sourceReceipt='F:/VisibleMedicine/staging/20261022-seven-final-source-closures/APPLIED_SOURCE.json';
const sourceReceiptSha256='fc64c71ea81a117b45a156376b339b991f15d4988584d73adbf50831892465d1';
assert.equal(sha(read(sourceReceipt)),sourceReceiptSha256);
const source=json(sourceReceipt),website=source.website,stage='F:/VisibleMedicine/staging/20261022-loading-count-and-tour-closure';
assert(!fs.existsSync(stage));
const initial=json('F:/VisibleMedicine/staging/20261022-seven-final-source-closures/native-current/TERMINAL.json');
assert.deepEqual(initial.counts,{tests:34,pass:33,fail:1,cancelled:0,skipped:0,todo:0});assert.deepEqual(initial.sourceDrift,[]);
const mainStage='F:/VisibleMedicine/staging/20261022-tour-refusal-comparison';
const mainProof=mainStage+'/SOURCE_PROOF_UI.json';
assert.equal(sha(read(mainProof)),'c4c23ea166b4db9d39eb3bdf3888fb48fcf3bba4bdb4f1ac0df4d2beaca42c57');
const rows=json(mainProof).rows.map(({path,before,beforeSha256,code,sha256})=>({path,before,beforeSha256,code,sha256}));
const countStage='F:/VisibleMedicine/staging/20261022-loading-current-admission-count';
for(const [path,[beforeSha256,sha256]] of Object.entries(json(countStage+'/EVIDENCE/RESULT.json').rawAndCodeSha256))rows.push({path,before:countStage+'/RAW/'+path,beforeSha256,code:countStage+'/CODE/'+path,sha256});
const directStage='F:/VisibleMedicine/staging/20261022-loading-direct-consumers';
const directNames=['current-delivery-admission-485.test.mjs','head-disclosure-current-delivery.test.mjs','ui-teaching-current-delivery.test.mjs'];
for(const name of directNames){const path='tests/'+name,before=directStage+'/RAW/'+path,code=directStage+'/CODE/'+path;rows.push({path,before,beforeSha256:sha(read(before)),code,sha256:sha(read(code))});}
assert.equal(rows.length,11);assert.equal(new Set(rows.map(row=>row.path)).size,11);
for(const row of rows){assert.equal(sha(read(row.code)),row.sha256);assert.equal(sha(read(row.before)),row.beforeSha256);assert.deepEqual(read(row.before),read(website+'/'+row.path));fullSourceInverse(read(row.before),read(row.code));}
const api=await import(pathToFileURL(website+'/tests/current-atlas-delivery.mjs'));
const {restoreUiV5Source}=await import(pathToFileURL(website+'/tests/ui-current-v5-source-inverse.mjs'));
const stagedRead=(relative,encoding)=>{
 const row=rows.find(row=>row.path===relative),bytes=read(row?row.code:website+'/'+relative);
 return encoding?bytes.toString(encoding):bytes;
};
let calls=0;const test=(title,callback)=>{callback();calls++;};
const admission=read(directStage+'/CODE/tests/current-delivery-admission-485.test.mjs').toString();
new Function('test','assert','readFileSync','sha','restoreUiV5Source','validateCurrentAtlasDelivery','currentAtlasDeliveryRoot',admission.slice(admission.indexOf('const changes=')))(test,assert,stagedRead,sha,restoreUiV5Source,api.validateCurrentAtlasDelivery,api.currentAtlasDeliveryRoot);
const head=read(directStage+'/CODE/tests/head-disclosure-current-delivery.test.mjs').toString(),start=head.indexOf("test('current 190 Review binds"),end=head.indexOf("\nfor(const target",start);assert(start>0&&end>start);
new Function('test','assert','read','sha','validateCurrentAtlasDelivery',head.slice(start,end))(test,assert,stagedRead,sha,api.validateCurrentAtlasDelivery);
assert.equal(calls,7,'Actual six admission callbacks plus current head binding callback');
fs.mkdirSync(stage);
fs.writeFileSync(stage+'/SOURCE_PROOF.json',JSON.stringify({at:new Date().toISOString(),rows,actualDirectCallbacks:calls,mainTourUiCallbacks:5,actualCountWorkerProof:'EVIDENCE/proof.mjs executed by main',firstNativeFailureRetained:true,productBytesChanged:0,currentValidatorOrPinChanged:false,nativeAccepted:false,ownerPreviewChanged:false},null,2)+'\n',{flag:'wx'});
fs.writeFileSync(stage+'/PLAN.json',JSON.stringify({sourceReceipt,sourceReceiptSha256,receipt:stage+'/APPLIED_SOURCE.json',rows},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({plan:stage+'/PLAN.json',sha256:sha(read(stage+'/PLAN.json')),paths:11,directCallbacks:calls}));
