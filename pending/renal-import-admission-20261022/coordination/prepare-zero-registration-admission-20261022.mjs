// Test-only successor: authenticate old epochs separately from actual current admission.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {prepareUiSuccessor} from './prepare-unbound-ui-successor.mjs';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const receipt='F:/VisibleMedicine/staging/20261022-current-consumer-assurance-successor/SOURCE.json',source=json(receipt);
assert.equal(sha(read(receipt)),'be8b13e91cb8dfeb8b420b91710437248c18ebe9232e6859a6fe54778b6a8079');
assert.equal(json(path.dirname(receipt)+'/native-integration/TERMINAL.json').code,0);
const proposal='F:/VisibleMedicine/staging/20261022-zero-registration-source-followup',resultPath=proposal+'/RESULT.json';
assert.equal(sha(read(resultPath)),'36853d2c498ed32e3dc8c59f38b8ae0018f66039243bf02cb13cd6bad0e77fee');
const result=json(resultPath);for(const[p,h]of Object.entries({...result.files,...result.evidenceHashes}))assert.equal(sha(read(proposal+'/'+p)),h,p);
const overlays=['drawable-epoch-current-admission.test.mjs','expanded-review-delivery-admission.test.mjs','current-pin-epoch-inverse.mjs'].map(name=>{
 const p='tests/'+name,old=source.sourceRows.find(r=>r.path===p),code=proposal+'/CODE/'+name,hash=result.files['CODE/'+name];assert(hash);
 const before=proposal+'/RAW/'+name+'.raw';if(old)assert.equal(sha(read(before)),old.sha256);
 return {path:p,code,sha256:hash,beforeSha256:old?.sha256??null,...(old?{before}:{})};});
const root='F:/VisibleMedicine/staging/20261022-zero-registration-admission-successor',planPath=path.resolve('zero-registration-admission-plan-20261022.json');assert(!fs.existsSync(planPath));
fs.writeFileSync(planPath,JSON.stringify({root,sourceReceipt:receipt,sourceReceiptSha256:sha(read(receipt)),canonicalHead:'b953ff3f5f1891599cb6e91cb91311d9d6006270',atlasHead:'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1',overlays},null,2)+'\n',{flag:'wx'});
const prepared=prepareUiSuccessor(planPath);assert.equal(prepared.sourcePaths,6186);assert.equal(prepared.review,source.review);assert.deepEqual(prepared.changedProductPaths,[]);
const tests=['tests/drawable-epoch-current-admission.test.mjs','tests/expanded-review-delivery-admission.test.mjs','tests/current-atlas-delivery.test.mjs'];
fs.writeFileSync(root+'/NATIVE_PLAN.json',JSON.stringify({sourceReceipt:root+'/SOURCE.json',sourceReceiptSha256:sha(read(root+'/SOURCE.json')),evidence:root+'/native-integration',tests,
 scope:'Real native registration and full retained historical/current-source admission, emitted delivery and mutation assertions for two previously unregistered modules; unchanged product/Review bytes. Not whole-suite, browser, clinical or deployment acceptance.'},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({sourceReceipt:root+'/SOURCE.json',sha256:sha(read(root+'/SOURCE.json')),sourcePaths:prepared.sourcePaths,productAndReviewUnchanged:true,ownerPreviewChanged:false}));
