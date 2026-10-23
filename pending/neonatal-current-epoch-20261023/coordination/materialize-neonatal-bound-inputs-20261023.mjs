// Fill missing read-only test inputs only; no parent or generated edits.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {json,read,sha} from './source-only-backup-20261019.mjs';
import {containedTarget} from './prepare-reviewed-regression-candidate-20261022.mjs';
const stage='F:/VisibleMedicine/staging/20261023-neonatal-current-epoch',prep=json(stage+'/PREPARATION.json');
assert.equal(sha(read(prep.parentReceipt)),prep.parentReceiptSha256);const parent=json(prep.parentReceipt);
const binding=json(prep.parentWebsite+'/atlas-review/integration-inputs.json');assert.equal(binding.sha256,parent.reviewBindingSha256);
const added=[];
for(const r of binding.inputs){
 const file=containedTarget(prep.website,r.path);
 if(!fs.existsSync(file)){
  const previous=parent.sourceRows.find(x=>x.path===r.path);assert(previous);assert.equal(previous.sha256,r.sha256);assert.equal(sha(read(prep.parentWebsite+'/'+r.path)),r.sha256);
  fs.mkdirSync(path.dirname(file),{recursive:true});fs.copyFileSync(prep.parentWebsite+'/'+r.path,file,fs.constants.COPYFILE_EXCL);added.push(previous);
 }
 assert.equal(sha(read(file)),r.sha256,r.path);
}
const result={at:new Date().toISOString(),parentReceipt:prep.parentReceipt,parentReceiptSha256:prep.parentReceiptSha256,boundInputCount:binding.inputs.length,added,allBoundInputsPhysicallyAvailable:true,productChanged:false,previewChanged:false};
fs.writeFileSync(stage+'/BOUND_INPUTS_APPEND.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({added:added.length,allBoundInputs:binding.inputs.length}));
