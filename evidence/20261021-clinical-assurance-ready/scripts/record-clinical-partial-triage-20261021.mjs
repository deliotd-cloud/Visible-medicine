// Verify an immutable worker observation against actual TAP; no test execution.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261021-clinical-failure-triage';
const input=root+'/FAILURES.json',data=json(input),tap=read(data.source).toString();
assert.equal(sha(read(input)),'7154fa4b86def7e864e32e83a056d64b5d89af6b3118b31e8a45c49b66cf7129');
assert(data.partial&&!data.terminalReceiptObserved);assert.equal(data.observedThrough,1071);
const included=[];
for(const row of data.failures){
 assert(/^clinical-review-[a-z0-9-]+\.test\.(?:ts|mjs)$/.test(row.file));
 const lines=read('F:/VisibleMedicine/staging/20261020-combined-website-ui/website/tests/'+row.file).toString().split(/\r?\n/);
 for(const [number,registration,assertion,cause] of row.entries){
  assert(number>=850&&number<=1071);assert(Object.hasOwn(data.keys,cause));
  assert(new RegExp('^not ok '+number+' - ','m').test(tap),'Actual failed TAP case '+number);
  assert(lines[registration-1].includes('test('),row.file+' registration '+registration);
  assert(lines[assertion-1]?.trim(),row.file+' first assertion/call '+assertion);
  included.push(number);
 }
}
assert.equal(included.length,57);assert.equal(new Set(included).size,57);
const actual=[...tap.matchAll(/^not ok (\d+) - /gm)].map(row=>Number(row[1])).filter(n=>n>=850&&n<=1071);
assert.deepEqual([...included].sort((a,b)=>a-b),actual);
const receipt={at:new Date().toISOString(),workerObservationSha256:sha(read(input)),observedThrough:1071,
 actualFailedMarkersVerified:57,allObservedClinicalFailuresInScopeAccountedFor:true,
 limit:'First-failure source classification, not runtime diagnosis or a pass for assertions hidden behind initial gates. The live TAP may now contain later markers; this bounded observation is not terminal.',
 partial:true,testsRun:false,canonicalInstalled:false};
fs.writeFileSync(root+'/MAIN_VERIFICATION.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(receipt));
