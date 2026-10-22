import assert from 'node:assert/strict';
import fs from 'node:fs';
import {json,read,sha} from './source-only-backup-20261019.mjs';
import {fullSourceInverse} from './review-source-packet-20261022.mjs';
const sourceReceipt='F:/VisibleMedicine/staging/20261022-loading-count-and-tour-closure/APPLIED_SOURCE.json';
const sourceReceiptSha256='db554143455025fba5b51b1a9c3332788caadc5ef1758e3d27af2a2c5134ab09';
assert.equal(sha(read(sourceReceipt)),sourceReceiptSha256);const source=json(sourceReceipt);
const stage='F:/VisibleMedicine/staging/20261022-final-loading-history-closures';assert(!fs.existsSync(stage));
const rows=[];
for(const [name,count] of [['20261022-loading-history-followup',2],['20261022-loading-head-live-roles',4],['20261022-loading-ui-consumer-closures',3]]){
 const base='F:/VisibleMedicine/staging/'+name,names=fs.readdirSync(base+'/CODE/tests');assert.equal(names.length,count);
 for(const name of names){
  const path='tests/'+name,before=base+'/RAW/'+path,code=base+'/CODE/'+path,raw=read(before),bytes=read(code);
  assert.deepEqual(raw,read(source.website+'/'+path));
  rows.push({path,before,beforeSha256:sha(raw),code,sha256:sha(bytes),completeInverse:fullSourceInverse(raw,bytes)});
 }
}
assert.equal(rows.length,9);assert.equal(new Set(rows.map(row=>row.path)).size,9);
const previous=json('F:/VisibleMedicine/staging/20261022-loading-count-and-tour-closure/native-current/TERMINAL.json');
assert.equal(previous.counts.fail,3);assert.deepEqual(previous.sourceDrift,[]);
fs.mkdirSync(stage);
fs.writeFileSync(stage+'/PLAN.json',JSON.stringify({sourceReceipt,sourceReceiptSha256,receipt:stage+'/APPLIED_SOURCE.json',rows},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({plan:stage+'/PLAN.json',sha256:sha(read(stage+'/PLAN.json')),paths:rows.length,productChanged:false,firstFailuresRetained:true}));
