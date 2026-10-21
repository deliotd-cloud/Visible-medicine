import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261021-revision-guard-batch-v2',prep=json(stage+'/PREPARATION.json');
const suite='F:/VisibleMedicine/staging/20261021-source190-complete-suite';
const native='F:/VisibleMedicine/staging/20261021-source190-website/website/.local/website-test-runs/2026-10-21T05-37-11-497Z-a5ab569e-0361-46d1-91d6-64fd8586c1c0';
// Do not mutate the frozen full-suite inputs. A live wait/timeout is not a
// terminal receipt and must never be treated as permission to replace source.
assert(fs.existsSync(suite+'/TERMINAL.json')&&fs.existsSync(native+'/receipt.json'),'Complete suite must be genuinely terminal before admission');
const terminal=json(suite+'/TERMINAL.json'),receipt=json(native+'/receipt.json');
assert.equal(terminal.signal,null);assert.deepEqual(terminal.originalNamedInputDrift,[]);
assert.equal(sha(read(suite+'/RUNNER.log')),terminal.logSha256);
assert.equal(receipt.testInputDrift,false);assert.notEqual(receipt.publicPreviewAssetDrift,true);
assert(receipt.counts?.tests>0&&receipt.counts.cancelled===0,'Incomplete/cancelled test child is not a normal terminal gate');
for(const r of json(suite+'/SOURCE_INPUTS.json'))assert.equal(sha(read(prep.site+'/'+r.path)),r.sha256,r.path);
for(const r of prep.receipts){assert.equal(sha(read(r.file)),r.sha256);const v=json(r.file);assert.equal(v.code,0);assert.equal(sha(read(v.log)),v.logSha256);}
const bound=json(prep.site+'/atlas-review/integration-inputs.json');assert.equal(bound.sha256,prep.review);
for(const r of bound.inputs)assert.equal(sha(read(prep.site+'/'+r.path)),r.sha256,r.path);
assert(!fs.existsSync(stage+'/ADMISSION_PLAN.json'));
for(const row of prep.changes){
 const bytes=read(row.from);assert.equal(sha(bytes),row.sha256);
 assert.equal(sha(Buffer.from(bytes.toString().replaceAll('\r\n','\n'))),row.sha256,
  'Patch must not normalize a byte-pinned source or immutable fixture: '+row.path);
 assert(bytes.toString().endsWith('\n'),'Retain exact final newline: '+row.path);
}
const patch=['*** Begin Patch'];
for(const row of prep.changes){
 const target=prep.site+'/'+row.path,next=read(row.from);assert.equal(sha(next),row.sha256);
 if(row.beforeSha256){
  const previous=read(target);assert.equal(sha(previous),row.beforeSha256,row.path);
  const to=stage+'/preimages/'+row.path;fs.mkdirSync(path.dirname(to),{recursive:true});fs.writeFileSync(to,previous,{flag:'wx'});
  // Exact full-file context: replacement refuses even a changed preimage line.
  patch.push('*** Update File: '+target,'@@',...previous.toString().replaceAll('\r\n','\n').replace(/\n$/,'').split('\n').map(l=>'-'+l),
   ...next.toString().replaceAll('\r\n','\n').replace(/\n$/,'').split('\n').map(l=>'+'+l));
 }else{
  assert(!fs.existsSync(target),row.path);patch.push('*** Add File: '+target,...next.toString().replaceAll('\r\n','\n').replace(/\n$/,'').split('\n').map(l=>'+'+l));
 }
}
patch.push('*** End Patch');
fs.writeFileSync(stage+'/ADMISSION_PLAN.json',JSON.stringify({at:new Date().toISOString(),changes:prep.changes,
 wholeSuiteReceipt:native+'/receipt.json',wholeSuiteCounts:receipt.counts,sourceInputsBefore:5107,sourceInputsAfter:5109,
 patchEmittedOnly:true,applied:false,canonicalInstalled:false,clinicalApproval:false},null,2)+'\n',{flag:'wx'});
console.log(patch.join('\n'));
