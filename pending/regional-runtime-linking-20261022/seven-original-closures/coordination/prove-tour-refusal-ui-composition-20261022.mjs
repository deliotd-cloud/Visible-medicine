import assert from 'node:assert/strict';
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {json,read,sha} from './source-only-backup-20261019.mjs';
import {fullSourceInverse} from './review-source-packet-20261022.mjs';
const stage='F:/VisibleMedicine/staging/20261022-tour-refusal-comparison',prepared=json(stage+'/PREPARED.json');
assert.equal(sha(read(prepared.sourceReceipt)),prepared.sourceReceiptSha256);
const website=prepared.website,api=await import(pathToFileURL(website+'/tests/current-atlas-delivery.mjs'));
const rows=prepared.paths.map(path=>{
 const raw=read(stage+'/RAW/'+path),code=read(stage+'/CODE/'+path);assert.deepEqual(raw,read(website+'/'+path));
 return {path,before:stage+'/RAW/'+path,beforeSha256:sha(raw),code:stage+'/CODE/'+path,sha256:sha(code),inverse:fullSourceInverse(raw,code)};
});
const ui='F:/VisibleMedicine/staging/20261022-loading-direct-consumers/CODE/tests/ui-teaching-current-delivery.test.mjs';
const beforeUi=read('F:/VisibleMedicine/staging/20261022-loading-direct-consumers/RAW/tests/ui-teaching-current-delivery.test.mjs');
assert.equal(sha(beforeUi),'89125a0699029efb7186800ba761ecbe0748c052753424fc02fc36231f5f5913');
assert.deepEqual(Buffer.from(read(ui).toString().replace('assert.equal(inputs.inputs.length, 1724);','assert.equal(inputs.inputs.length, 1723);')),beforeUi);
const readFromTests=p=>{
 const relative='tests/'+p.replace(/^\.\//,'');
 if(relative==='tests/ui-teaching-current-delivery.test.mjs')return read(ui);
 return prepared.paths.includes(relative)?read(stage+'/CODE/'+relative):read(new URL(p,pathToFileURL(website+'/tests/')));
};
let calls=0;const test=(title,callback)=>{callback();calls++;};
const tour=read(stage+'/CODE/tests/tour-discovery-current-delivery.test.mjs').toString();
new Function('test','assert','read','sha','CURRENT_ATLAS_REVISION','validateCurrentAtlasDelivery',tour.slice(tour.indexOf("test('complete pre-keyboard")))(
 test,assert,readFromTests,sha,api.CURRENT_ATLAS_REVISION,api.validateCurrentAtlasDelivery);
const corpus=read(stage+'/CODE/tests/corpus-ui-role-preservation.test.mjs').toString();
new Function('test','assert','read','sha',corpus.slice(corpus.indexOf('const once=')))(test,assert,readFromTests,sha);
assert.equal(calls,5,'Actual complete tour callback and all four corpus/UI witnesses execute');
const result={at:new Date().toISOString(),rows,actualSourceCallbacks:calls,stagedUiSha256:sha(read(ui)),currentValidatorOrPinChanged:false,productBytesChanged:false,nativeAccepted:false,ownerPreviewChanged:false};
fs.writeFileSync(stage+'/SOURCE_PROOF_UI.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({proof:stage+'/SOURCE_PROOF_UI.json',sha256:sha(read(stage+'/SOURCE_PROOF_UI.json')),callbacks:calls}));
