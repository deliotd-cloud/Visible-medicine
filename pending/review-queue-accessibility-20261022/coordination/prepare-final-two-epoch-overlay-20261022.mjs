import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {json,read,sha} from './source-only-backup-20261019.mjs';
import {fullSourceInverse} from './review-source-packet-20261022.mjs';
const sourceReceipt='F:/VisibleMedicine/staging/20261022-final-loading-history-closures/APPLIED_SOURCE.json',source=json(sourceReceipt);
const sourceReceiptSha256='f36f00858d80c83c4d0b39d8930d35a9c77e76d28613919f4d8d8de738feb096';assert.equal(sha(read(sourceReceipt)),sourceReceiptSha256);
const stage='F:/VisibleMedicine/staging/20261022-final-two-epoch-comparisons',rows=[];
const terminal=json('F:/VisibleMedicine/staging/20261022-final-closure-verification/native-selected/TERMINAL.json');
assert.equal(terminal.terminal,true);assert.equal(terminal.counts.tests,360);assert.equal(terminal.counts.fail,2);assert.deepEqual(terminal.sourceDrift,[]);
for(const [name,expected] of [
 ['current-head-index-whole-role-transition-20261021.test.mjs','9a4480980925a826a37656958e6b6402b2262a8bc686311f7528aaf0352cea2a'],
 ['ui-teaching-admission-contract.test.mjs','62add6d3b2ed76197f9d9cb489c567fd1bd111acf6efaab8ae1604ff1cf32ee0'],
]){
 const relative='tests/'+name,bytes=read(stage+'/'+relative),original=read(source.website+'/'+relative);
 assert.equal(sha(bytes),expected,name);assert.equal(sha(original),source.sourceRows.find(row=>row.path===relative).sha256);
 for(const [kind,contents] of [['RAW',original],['CODE',bytes]]){const to=stage+'/'+kind+'/'+relative;fs.mkdirSync(path.dirname(to),{recursive:true});fs.writeFileSync(to,contents,{flag:'wx'});}
 rows.push({path:relative,before:stage+'/RAW/'+relative,beforeSha256:sha(original),code:stage+'/CODE/'+relative,sha256:sha(bytes),inverse:fullSourceInverse(original,bytes)});
}
fs.writeFileSync(stage+'/PLAN.json',JSON.stringify({sourceReceipt,sourceReceiptSha256,receipt:stage+'/APPLIED_SOURCE.json',rows},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({plan:stage+'/PLAN.json',sha256:sha(read(stage+'/PLAN.json')),paths:2,original360FailureRetained:true}));
