// Keep current assurance389 separate from the newer renal candidate4f20.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {prepareUiSuccessor} from './prepare-unbound-ui-successor.mjs';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const receipt='F:/VisibleMedicine/staging/20261022-admission-importer-source-successor/SOURCE.json',source=json(receipt);
assert.equal(sha(read(receipt)),'fcccc077d15911a94d395832be0cfe28e8eb15e2b0d37e80f01463645e0c89f1');
const priorNative=json(path.dirname(receipt)+'/native-integration/TERMINAL.json');assert.equal(priorNative.code,0);assert.equal(priorNative.counts.pass,74);assert.deepEqual(priorNative.sourceDrift,[]);
const proposal='F:/VisibleMedicine/staging/20261022-review-ui-source-followup',resultPath=proposal+'/RESULT.json';
assert.equal(sha(read(resultPath)),'386b9392ae2702a897b855a87158e4d26249bb06972e88936acfa348c5d129fd');
const result=json(resultPath);for(const[p,h]of Object.entries({...result.files,...result.evidence}))assert.equal(sha(read(proposal+'/'+p)),h,p);
const proof=execFileSync(process.execPath,[proposal+'/evidence/prove-source-only.mjs'],{windowsHide:true});
assert.deepEqual(proof,read(proposal+'/evidence/prove-source-only.stdout.txt'));
const overlays=['review-navigation-delivery-preservation.test.mjs','ui-teaching-current-delivery.test.mjs'].map(name=>{
 const p='tests/'+name,old=source.sourceRows.find(r=>r.path===p);assert(old);
 const before=proposal+'/RAW/'+name+'.raw';assert.equal(sha(read(before)),old.sha256);
 return {path:p,code:proposal+'/CODE/'+name,sha256:result.files['CODE/'+name],beforeSha256:old.sha256,before};});
const root='F:/VisibleMedicine/staging/20261022-review-ui-source-successor',planPath=path.resolve('review-ui-source-plan-20261022.json');assert(!fs.existsSync(planPath));
fs.writeFileSync(planPath,JSON.stringify({root,sourceReceipt:receipt,sourceReceiptSha256:sha(read(receipt)),canonicalHead:'b953ff3f5f1891599cb6e91cb91311d9d6006270',atlasHead:'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1',overlays},null,2)+'\n',{flag:'wx'});
const prepared=prepareUiSuccessor(planPath);assert.equal(prepared.sourcePaths,6187);assert.equal(prepared.review,source.review);assert.deepEqual(prepared.changedProductPaths,[]);
const tests=[...json(path.dirname(receipt)+'/NATIVE_PLAN.json').tests,'tests/review-navigation-delivery-preservation.test.mjs','tests/ui-teaching-current-delivery.test.mjs'];
fs.writeFileSync(root+'/NATIVE_PLAN.json',JSON.stringify({sourceReceipt:root+'/SOURCE.json',sourceReceiptSha256:sha(read(root+'/SOURCE.json')),evidence:root+'/native-integration',tests,
 scope:'Actual current versus compact historical navigation proof and unchanged deeper UI teaching emitted-module/protected-write cases, alongside74 preceding admission checks. All product/Review bytes unchanged; no whole-suite claim.'},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({sourceReceipt:root+'/SOURCE.json',sha256:sha(read(root+'/SOURCE.json')),sourcePaths:prepared.sourcePaths,productAndReviewUnchanged:true,ownerPreviewChanged:false}));
