// Main integration of the three separately reviewed, test-only source packages.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261022-seven-final-source-closures';
const sourceReceipt='F:/VisibleMedicine/staging/20261022-remaining-runtime-admissions/APPLIED_SOURCE.json';
const sourceReceiptSha256='d72789221c1cbdb0686e65a6316fe42c378f4cddc6e4adfd2b556ad7b79f2f8e';
assert.equal(sha(read(sourceReceipt)),sourceReceiptSha256);
assert(!fs.existsSync(stage));
const mainProof='F:/VisibleMedicine/staging/20261022-current-ui-final-closures/MAIN_SOURCE_PROOF.json';
assert.equal(sha(read(mainProof)),'808123b224bfb0cc90fe9703f3fe3bf60d318f1859f7105d5aa6d0e1aca71307');
const rows=json(mainProof).rows.map(({path,code,sha256,before,beforeSha256})=>({path,code,sha256,before,beforeSha256}));
const limb='F:/VisibleMedicine/staging/20261022-limb-urinary-final-closures';
for(const [path,beforeSha256,sha256] of [
 ['tests/limb-suprahyoid-role-preservation-20261021.test.mjs','d51678cc4a2f42badbc9fb3fd0afffabb6094c7af2fa2f225f4acb907c6e0fcb','6199b846dcce39829e61d21ff8bcdf07648152492a9034122761b98e83d2a7c8'],
 ['tests/venous-urinary-role-preservation-20261021.test.mjs','4130539addc372692276dcad2da6bb8b1913e93b41df98394045ae42f7d58b4e','5816c24ad3defd9eef3055939519cce94bc4f8af307713b915de3f2795f8dd21'],
])rows.push({path,before:limb+'/RAW/'+path,beforeSha256,code:limb+'/CODE/'+path,sha256});
const orbital='F:/VisibleMedicine/staging/20261022-orbital-radial-final-closures';
for(const item of json(orbital+'/EVIDENCE.json').paths)rows.push({path:item.path,before:orbital+'/RAW/'+item.path,beforeSha256:item.rawSha256,code:orbital+'/CODE/'+item.path,sha256:item.codeSha256});
assert.equal(rows.length,9);assert.equal(new Set(rows.map(row=>row.path)).size,9);
const source=json(sourceReceipt);
for(const row of rows){
 assert.equal(sha(read(row.code)),row.sha256,row.path);
 if(row.beforeSha256){assert.equal(sha(read(row.before)),row.beforeSha256);assert.deepEqual(read(row.before),read(source.website+'/'+row.path));}
 else assert(!fs.existsSync(source.website+'/'+row.path));
}
fs.mkdirSync(stage);
fs.writeFileSync(stage+'/PLAN.json',JSON.stringify({sourceReceipt,sourceReceiptSha256,receipt:stage+'/APPLIED_SOURCE.json',rows},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({plan:stage+'/PLAN.json',sha256:sha(read(stage+'/PLAN.json')),paths:rows.length,productChanges:0}));
