import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const prior='F:/VisibleMedicine/staging/20261022-legacy-shoulder-reference-candidate',stage='F:/VisibleMedicine/staging/20261022-legacy-shoulder-ct-evidence';
assert.equal(sha(read(prior+'/MAIN_REVIEW.json')),'c4c498a1fe5ffae19f22444ed64b8c6a1f8df16560ec60b2c400327a210a9e00');
assert(!fs.existsSync(stage));fs.mkdirSync(stage);
const review=json(prior+'/MAIN_REVIEW.json');
for(const row of review.proposal){assert.equal(sha(read(prior+'/'+row.path)),row.sha256);const target=stage+'/'+row.path;fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(prior+'/'+row.path,target,fs.constants.COPYFILE_EXCL);}
fs.mkdirSync(stage+'/preimage');
for(const file of ['anatomy-data.ts.raw','body-content.ts.raw','worker-muscle-references.ts.raw'])fs.copyFileSync(prior+'/preimage/'+file,stage+'/preimage/'+file,fs.constants.COPYFILE_EXCL);
for(const file of ['app/anatomy-data.ts','lib/legacy-shoulder-muscle-references.ts','scripts/test-legacy-shoulder-references.mjs'])fs.copyFileSync(prior+'/'+file,stage+'/preimage/'+path.basename(file)+'.previous.raw',fs.constants.COPYFILE_EXCL);
fs.writeFileSync(stage+'/PREDECESSOR.json',JSON.stringify({at:new Date().toISOString(),path:prior,mainReviewSha256:sha(read(prior+'/MAIN_REVIEW.json')),proposal:review.proposal},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({stage,files:review.proposal.length,predecessorUnchanged:true}));
