import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const sourcePath='F:/VisibleMedicine/staging/20261022-remaining-runtime-admissions/APPLIED_SOURCE.json';
assert.equal(sha(read(sourcePath)),'d72789221c1cbdb0686e65a6316fe42c378f4cddc6e4adfd2b556ad7b79f2f8e');
const source=json(sourcePath),stage='F:/VisibleMedicine/staging/20261022-current-ui-final-closures';
assert(!fs.existsSync(stage));
const paths=['tests/plexus-dependency-rebind.test.mjs','tests/studio-lineage-integration.test.mjs',
 'tests/tour-discovery-current-delivery.test.mjs','tests/corpus-ui-role-preservation.test.mjs'];
for(const row of source.sourceRows)assert.equal(sha(read(source.website+'/'+row.path)),row.sha256,row.path);
for(const relative of paths)for(const kind of ['RAW','CODE']){
 const to=stage+'/'+kind+'/'+relative;fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(source.website+'/'+relative,to,fs.constants.COPYFILE_EXCL);
}
fs.writeFileSync(stage+'/PREPARED.json',JSON.stringify({at:new Date().toISOString(),sourceReceipt:sourcePath,sourceReceiptSha256:sha(read(sourcePath)),website:source.website,
 files:paths.map(path=>({path,rawSha256:sha(read(source.website+'/'+path))})),candidateChanged:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({stage,files:paths.length,candidateChanged:false}));
