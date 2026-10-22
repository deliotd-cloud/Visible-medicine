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
const readFromTests=p=>{
 const relative='tests/'+p.replace(/^\.\//,'');
 return prepared.paths.includes(relative)?read(stage+'/CODE/'+relative):read(new URL(p,pathToFileURL(website+'/tests/')));
};
const tour=read(stage+'/CODE/tests/tour-discovery-current-delivery.test.mjs').toString();
const start=tour.indexOf("test('complete pre-keyboard"),corpus=read(stage+'/CODE/tests/corpus-ui-role-preservation.test.mjs').toString();
let calls=0;
const test=(title,callback)=>{callback();calls++;};
new Function('test','assert','read','sha','CURRENT_ATLAS_REVISION','validateCurrentAtlasDelivery',tour.slice(start))(
 test,assert,readFromTests,sha,api.CURRENT_ATLAS_REVISION,api.validateCurrentAtlasDelivery);
const definitions=corpus.slice(corpus.indexOf('const once='),corpus.indexOf('const preserve='));
const bodyStart=corpus.indexOf("test('whole tour historical proof"),bodyEnd=corpus.indexOf("\ntest('whole UI source",bodyStart);
assert(bodyStart>0&&bodyEnd>bodyStart);
new Function('test','assert','read','sha',definitions+corpus.slice(bodyStart,bodyEnd))(test,assert,readFromTests,sha);
assert.equal(calls,2,'Both complete source assertions execute, not only hash checks');
const result={at:new Date().toISOString(),rows,actualSourceCallbacks:calls,currentValidatorOrPinChanged:false,productBytesChanged:false,nativeAccepted:false,ownerPreviewChanged:false};
fs.writeFileSync(stage+'/SOURCE_PROOF.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
fs.writeFileSync(stage+'/PLAN.json',JSON.stringify({sourceReceipt:prepared.sourceReceipt,sourceReceiptSha256:prepared.sourceReceiptSha256,receipt:stage+'/APPLIED_SOURCE.json',rows},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({proof:stage+'/SOURCE_PROOF.json',sha256:sha(read(stage+'/SOURCE_PROOF.json')),callbacks:calls,plan:stage+'/PLAN.json'}));
