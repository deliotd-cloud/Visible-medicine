// Coherent current/historical test roles; product and Review bytes remain untouched.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {prepareUiSuccessor} from './prepare-unbound-ui-successor.mjs';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const receipt='F:/VisibleMedicine/staging/20261022-zero-registration-admission-successor/SOURCE.json',source=json(receipt);
assert.equal(sha(read(receipt)),'3a0062d75ac0fa5b331fe8170624675559b5aaec02da4d9d2f9f1cd77f673834');
const previousNative=json(path.dirname(receipt)+'/native-integration/TERMINAL.json');assert.equal(previousNative.code,1);assert.equal(previousNative.counts.fail,1);assert.equal(previousNative.counts.pass,61);assert.deepEqual(previousNative.sourceDrift,[]);
const proposal='F:/VisibleMedicine/staging/20261022-admission-dependent-source-followup',resultPath=proposal+'/RESULT.json';
assert.equal(sha(read(resultPath)),'eee0bf8f4bb9dfbd940df2ba1fb543e8099d0a0688efd31ed3ca4686fcf9d854');
const result=json(resultPath);for(const[p,h]of Object.entries({...result.files,...result.evidence}))assert.equal(sha(read(proposal+'/'+p)),h,p);
const overlays=['drawable-epoch-current-admission.test.mjs','colic-adapter-inverse.test.mjs','head-tools-wider-consumer-source-preservation.test.mjs','admission-source-roles.mjs'].map(name=>{
 const p='tests/'+name,old=source.sourceRows.find(r=>r.path===p),code=proposal+'/CODE/'+name,hash=result.files['CODE/'+name];assert(hash);
 const before=proposal+'/RAW/'+name+'.raw';if(old)assert.equal(sha(read(before)),old.sha256);
 return {path:p,code,sha256:hash,beforeSha256:old?.sha256??null,...(old?{before}:{})};});
const root='F:/VisibleMedicine/staging/20261022-admission-dependent-source-successor',planPath=path.resolve('admission-dependent-source-plan-20261022.json');assert(!fs.existsSync(planPath));
fs.writeFileSync(planPath,JSON.stringify({root,sourceReceipt:receipt,sourceReceiptSha256:sha(read(receipt)),canonicalHead:'b953ff3f5f1891599cb6e91cb91311d9d6006270',atlasHead:'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1',overlays},null,2)+'\n',{flag:'wx'});
const prepared=prepareUiSuccessor(planPath);assert.equal(prepared.sourcePaths,6187);assert.equal(prepared.review,source.review);assert.deepEqual(prepared.changedProductPaths,[]);
const tests=['tests/drawable-epoch-current-admission.test.mjs','tests/expanded-review-delivery-admission.test.mjs','tests/current-atlas-delivery.test.mjs',
 'tests/colic-adapter-inverse.test.mjs','tests/head-tools-wider-consumer-source-preservation.test.mjs','tests/colic-fa1-historical-closure.test.mjs'];
fs.writeFileSync(root+'/NATIVE_PLAN.json',JSON.stringify({sourceReceipt:root+'/SOURCE.json',sourceReceiptSha256:sha(read(root+'/SOURCE.json')),evidence:root+'/native-integration',tests,
 scope:'Actual registration and retained complete historical/current admission for two formerly unregistered modules, dependent colic/head-tools whole-source inverses, and current delivery; unchanged product/Review bytes. Earlier61/62run retained. No whole-suite/clinical/deployment claim.'},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({sourceReceipt:root+'/SOURCE.json',sha256:sha(read(root+'/SOURCE.json')),sourcePaths:prepared.sourcePaths,productAndReviewUnchanged:true,ownerPreviewChanged:false}));
