import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const sourceReceipt='F:/VisibleMedicine/staging/20261022-seven-final-source-closures/APPLIED_SOURCE.json';
assert.equal(sha(read(sourceReceipt)),'fc64c71ea81a117b45a156376b339b991f15d4988584d73adbf50831892465d1');
const source=json(sourceReceipt),stage='F:/VisibleMedicine/staging/20261022-tour-refusal-comparison';
assert(!fs.existsSync(stage));
const paths=['tests/tour-discovery-current-delivery.test.mjs','tests/corpus-ui-role-preservation.test.mjs'];
for(const relative of paths)for(const kind of ['RAW','CODE']){
 const destination=stage+'/'+kind+'/'+relative;fs.mkdirSync(path.dirname(destination),{recursive:true});fs.copyFileSync(source.website+'/'+relative,destination,fs.constants.COPYFILE_EXCL);
}
fs.writeFileSync(stage+'/PREPARED.json',JSON.stringify({sourceReceipt,sourceReceiptSha256:sha(read(sourceReceipt)),website:source.website,paths},null,2)+'\n',{flag:'wx'});
console.log(stage);
