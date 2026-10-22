// Two reviewed source-role repairs in the separate older assurance epoch only.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {prepareUiSuccessor} from './prepare-unbound-ui-successor.mjs';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const receipt='F:/VisibleMedicine/staging/20261022-review-ui-source-successor/SOURCE.json',source=json(receipt);
assert.equal(sha(read(receipt)),'400dad398f35767645590505fb9af192a5b803e039c96286fbd81875bb85fb21');
const priorNative=json(path.dirname(receipt)+'/native-integration/TERMINAL.json');assert.equal(priorNative.code,0);assert.equal(priorNative.counts.pass,80);assert.deepEqual(priorNative.sourceDrift,[]);
const proposal='F:/VisibleMedicine/staging/20261022-head-disclosure-history-followup';
assert.equal(sha(read(proposal+'/RESULT.json')),'1dec3f8d5bf4db2568ce5ee9a87833bf37ea8c35ede552e5bb18065692e566c7');
const result=json(proposal+'/RESULT.json');
const proof=execFileSync(process.execPath,[proposal+'/CODE/source-role-proof.mjs'],{windowsHide:true});
assert.deepEqual(proof,read(proposal+'/evidence/source-role-proof.txt'));
const overlays=result.changedTests.map(row=>{
 const prior=source.sourceRows.find(r=>r.path===row.path);assert(prior);assert.equal(prior.sha256,row.baselineSha256);
 const before=proposal+'/RAW/'+path.basename(row.path)+'.raw',code=proposal+'/CODE/'+row.path;
 assert.equal(sha(read(before)),row.baselineSha256);assert.equal(sha(read(code)),row.proposalSha256);
 return {path:row.path,code,sha256:row.proposalSha256,before,beforeSha256:prior.sha256};
});assert.equal(overlays.length,2);
const root='F:/VisibleMedicine/staging/20261022-head-disclosure-history-successor',planPath=path.resolve('head-disclosure-history-plan-20261022.json');assert(!fs.existsSync(planPath));
fs.writeFileSync(planPath,JSON.stringify({root,sourceReceipt:receipt,sourceReceiptSha256:sha(read(receipt)),canonicalHead:'b953ff3f5f1891599cb6e91cb91311d9d6006270',atlasHead:'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1',overlays},null,2)+'\n',{flag:'wx'});
const prepared=prepareUiSuccessor(planPath);assert.equal(prepared.sourcePaths,6187);assert.equal(prepared.review,source.review);assert.deepEqual(prepared.changedProductPaths,[]);
const tests=[...json(path.dirname(receipt)+'/NATIVE_PLAN.json').tests,...overlays.map(r=>r.path)];
fs.writeFileSync(root+'/NATIVE_PLAN.json',JSON.stringify({sourceReceipt:root+'/SOURCE.json',sourceReceiptSha256:sha(read(root+'/SOURCE.json')),evidence:root+'/native-integration',tests,
 scope:'Actual disclosure dependency-tamper and complete history/source-role consumers alongside80preceding actual checks. Product/Review unchanged; older389assurance separate from renal4f20and new model-access candidate. No whole-suite/clinical/deployment claim.'},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({sourceReceipt:root+'/SOURCE.json',sha256:sha(read(root+'/SOURCE.json')),sourcePaths:prepared.sourcePaths,productAndReviewUnchanged:true,ownerPreviewChanged:false}));
