import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const epoch='F:/VisibleMedicine/staging/20261021-revision-guard-batch-v11',admitted=json(epoch+'/ADMISSION_RESULT.json');
const native='F:/VisibleMedicine/staging/20261021-review-queue-return-native-proof-v2',old=json(native+'/PREPARATION.json'),proof=json(native+'/REVIEW_RETURN_CONTEXT_V2.json');
assert.equal(admitted.site,old.sourceSite);assert.equal(proof.code,0);assert.equal(sha(read(proof.log)),proof.logSha256);
for(const line of ['tests 40','pass 40','fail 0','cancelled 0','skipped 0','todo 0'])assert(proof.footer.includes('ℹ '+line));
for(const row of json(epoch+'/SOURCE_INPUTS_AFTER.json'))assert.equal(sha(read(admitted.site+'/'+row.path)),row.sha256,row.path);
const bound=json(admitted.site+'/atlas-review/integration-inputs.json');assert.equal(bound.sha256,admitted.review);
const stage='F:/VisibleMedicine/staging/20261021-review-return-application';assert(!fs.existsSync(stage));
const changes=old.proposed.map(row=>({...row,beforeSha256:row.path.startsWith('components/')?'59605fcb29edecede8f6412842ad8ba760161b928b78657045c52388894984cd':null}));
for(const row of changes){
 assert.equal(sha(read(row.from)),row.sha256);assert(!bound.inputs.some(input=>input.path===row.path),'Do not change Review-bound source without rebind');
 assert.equal(row.beforeSha256?sha(read(admitted.site+'/'+row.path)):fs.existsSync(admitted.site+'/'+row.path),row.beforeSha256??false);
}
for(const row of old.unchangedExistingTests)assert.equal(sha(read(admitted.site+'/'+row.path)),row.sha256);
fs.mkdirSync(stage);const prep={stage,site:admitted.site,atlas:old.atlas,sourceSite:admitted.site,source:admitted.source,review:admitted.review,changes,
 proposed:changes,unchangedExistingTests:old.unchangedExistingTests,priorSnapshot:epoch+'/SOURCE_INPUTS_AFTER.json',priorSnapshotSha256:sha(read(epoch+'/SOURCE_INPUTS_AFTER.json')),
 controlledNativeReceipt:native+'/REVIEW_RETURN_CONTEXT_V2.json',controlledNativeReceiptSha256:sha(read(native+'/REVIEW_RETURN_CONTEXT_V2.json')),ownerPreviewChanged:false,canonicalInstalled:false};
fs.writeFileSync(stage+'/PREPARATION.json',JSON.stringify(prep,null,2)+'\n',{flag:'wx'});
const patch=['*** Begin Patch'];
for(const row of changes){
 const target=prep.site+'/'+row.path,next=read(row.from).toString().replaceAll('\r\n','\n').trimEnd();
 if(row.beforeSha256){const bytes=read(target);const copy=stage+'/preimages/'+row.path;fs.mkdirSync(path.dirname(copy),{recursive:true});fs.writeFileSync(copy,bytes,{flag:'wx'});
  patch.push('*** Update File: '+target,'@@',...bytes.toString().replaceAll('\r\n','\n').trimEnd().split('\n').map(line=>'-'+line),...next.split('\n').map(line=>'+'+line));
 }else patch.push('*** Add File: '+target,...next.split('\n').map(line=>'+'+line));
}
patch.push('*** End Patch');console.log(patch.join('\n'));
