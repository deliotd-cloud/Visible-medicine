// Import the two reviewed history-only source repairs; never substitute epochs in current admission.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {prepareUiSuccessor} from './prepare-unbound-ui-successor.mjs';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const receipt='F:/VisibleMedicine/staging/20261022-admission-dependent-source-successor/SOURCE.json',source=json(receipt);
assert.equal(sha(read(receipt)),'6a022d96197ea86b6fd8c32eed179b7619435c65066a8ff8a49257241434a190');
const previousNative=json(path.dirname(receipt)+'/native-integration/TERMINAL.json');
assert.equal(previousNative.code,1);assert.equal(previousNative.counts.fail,1);assert.equal(previousNative.counts.pass,72);assert.deepEqual(previousNative.sourceDrift,[]);
const proposal='F:/VisibleMedicine/staging/20261022-admission-importer-source-followup',resultPath=proposal+'/RESULT.json';
assert.equal(sha(read(resultPath)),'d1c7ace2b7eb34a95989d25d2131c055b0ceaf4073660e1ec88bb187d4414933');
const result=json(resultPath);for(const[p,h]of Object.entries({...result.files,...result.evidence}))assert.equal(sha(read(proposal+'/'+p)),h,p);
const proof=execFileSync(process.execPath,[proposal+'/evidence/prove-source-only.mjs'],{windowsHide:true});
assert.deepEqual(proof,read(proposal+'/evidence/prove-source-only.stdout.txt'),'main executed complete source proof matches recorded output');
const overlays=['drawable-epoch-current-admission.test.mjs','admission-source-roles.mjs'].map(name=>{
 const p='tests/'+name,old=source.sourceRows.find(r=>r.path===p),code=proposal+'/CODE/'+name,hash=result.files['CODE/'+name];assert(hash&&old);
 const before=proposal+'/RAW/'+name+'.raw';assert.equal(sha(read(before)),old.sha256);
 return {path:p,code,sha256:hash,beforeSha256:old.sha256,before};});
const root='F:/VisibleMedicine/staging/20261022-admission-importer-source-successor',planPath=path.resolve('admission-importer-source-plan-20261022.json');assert(!fs.existsSync(planPath));
fs.writeFileSync(planPath,JSON.stringify({root,sourceReceipt:receipt,sourceReceiptSha256:sha(read(receipt)),canonicalHead:'b953ff3f5f1891599cb6e91cb91311d9d6006270',atlasHead:'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1',overlays},null,2)+'\n',{flag:'wx'});
const prepared=prepareUiSuccessor(planPath);assert.equal(prepared.sourcePaths,6187);assert.equal(prepared.review,source.review);assert.deepEqual(prepared.changedProductPaths,[]);
const tests=['tests/drawable-epoch-current-admission.test.mjs','tests/expanded-review-delivery-admission.test.mjs','tests/current-atlas-delivery.test.mjs',
 'tests/colic-adapter-inverse.test.mjs','tests/head-tools-wider-consumer-source-preservation.test.mjs','tests/colic-fa1-historical-closure.test.mjs'];
fs.writeFileSync(root+'/NATIVE_PLAN.json',JSON.stringify({sourceReceipt:root+'/SOURCE.json',sourceReceiptSha256:sha(read(root+'/SOURCE.json')),evidence:root+'/native-integration',tests,
 scope:'Actual two-module historical/current admission and dependent consumer closure after exact importer source-role repair; unchanged current validator/product/Review. Earlier61/62and72/73runs retained. No whole-suite/clinical/deployment claim.'},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({sourceReceipt:root+'/SOURCE.json',sha256:sha(read(root+'/SOURCE.json')),sourcePaths:prepared.sourcePaths,productAndReviewUnchanged:true,ownerPreviewChanged:false}));
