// Test-only successor; every product, licence, dependency, bound and runtime byte stays exact.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {prepareUiSuccessor} from './prepare-unbound-ui-successor.mjs';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const receipt='F:/VisibleMedicine/staging/20261022-head-surface-cancellation-successor/SOURCE.json',source=json(receipt);
assert.equal(sha(read(receipt)),'67b0f4f7716d062aaa2269c22b759436c3b62e2082248d4a447197d28a3643ed');
const first='F:/VisibleMedicine/staging/20261022-surface-binder-history-followup',second='F:/VisibleMedicine/staging/20261022-source389-spinal-followup';
const selected=[
 [first,'tests/desktop-learning-row-history.test.mjs','bf0374b9a54789d6a8c50df44050350b274fb53d111acd2c47ee5b2d5b5fe6c5'],
 [first,'tests/head-review-compact-preservation.test.mjs','46e360890cabd5e44ef89bb5aa4c3c8fd5a0a809832a275de966a0372bff4355'],
 [first,'tests/surface-binder-history-inverse.mjs','fcf9e92f383d478d565275312839c493236d167bc88371ce2a22d8c914149bc0'],
 [second,'tests/atlas-spinal-muscle-xray.test.mjs','724867c87729d6c1768f49afe850b77610caa753e8b075573cdf1b7c4210be47'],
 [second,'tests/spinal-current-source-inverse.mjs','19dac801c8c8b1c5f403ece33d76ec72f814888d676a69b7aa96742bb63e2a35'],
];
const overlays=selected.map(([root,p,hash])=>{const code=root+'/CODE/'+p;assert.equal(sha(read(code)),hash);const prior=source.sourceRows.find(r=>r.path===p);
 return {path:p,code,sha256:hash,beforeSha256:prior?.sha256??null,...(prior?{before:root+'/RAW/'+p}:{})};});
const root='F:/VisibleMedicine/staging/20261022-surface-spinal-consumer-successor',planPath=path.resolve('surface-spinal-consumer-plan-20261022.json');assert(!fs.existsSync(planPath));
fs.writeFileSync(planPath,JSON.stringify({root,sourceReceipt:receipt,sourceReceiptSha256:sha(read(receipt)),canonicalHead:'b953ff3f5f1891599cb6e91cb91311d9d6006270',atlasHead:'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1',overlays},null,2)+'\n',{flag:'wx'});
const result=prepareUiSuccessor(planPath);assert.equal(result.sourcePaths,6183);assert.equal(result.review,source.review);assert.deepEqual(result.changedProductPaths,[]);
const tests=['tests/desktop-learning-row-history.test.mjs','tests/head-review-compact-preservation.test.mjs','tests/atlas-spinal-muscle-xray.test.mjs',
 'tests/spinal-later-six-preservation.test.mjs','tests/spinal-ct-save-refusal-preservation.test.mjs','tests/spinal-craniofacial-ct-current-compatibility.test.mjs','tests/current-atlas-delivery.test.mjs'];
fs.writeFileSync(root+'/NATIVE_PLAN.json',JSON.stringify({sourceReceipt:root+'/SOURCE.json',sourceReceiptSha256:sha(read(root+'/SOURCE.json')),evidence:root+'/native-integration',tests,
 scope:'Exact surface-binder/neck-source history fixes and all downstream spinal original-refusal proofs plus current delivery. All product and bound inputs unchanged; no whole-suite, clinical or deployment claim.'},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({sourceReceipt:root+'/SOURCE.json',sha256:sha(read(root+'/SOURCE.json')),sourcePaths:result.sourcePaths,nativeRoots:tests.length,productAndBindingUnchanged:true,ownerPreviewChanged:false}));
