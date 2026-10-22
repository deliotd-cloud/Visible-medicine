import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-neck-xray-website-candidate',prep=json(root+'/WEBSITE_PREPARED.json'),previous=json(prep.sourceReceipt),site=prep.website;
assert(!fs.existsSync(root+'/SOURCE.json'));assert(!fs.existsSync(root+'/COMPATIBILITY_RESTORE.json'));
const missing=previous.sourceRows.filter(row=>!fs.existsSync(site+'/'+row.path));assert(missing.length>0);
for(const row of missing){assert(/^public\/atlas-review-viewer\/assets\/[A-Za-z0-9_-]+\.(?:js|css)$/.test(row.path),row.path);
 assert.equal(sha(read(previous.website+'/'+row.path)),row.sha256);fs.mkdirSync(path.dirname(site+'/'+row.path),{recursive:true});fs.copyFileSync(previous.website+'/'+row.path,site+'/'+row.path,fs.constants.COPYFILE_EXCL);assert.equal(sha(read(site+'/'+row.path)),row.sha256);}
fs.writeFileSync(root+'/COMPATIBILITY_RESTORE.json',JSON.stringify({at:new Date().toISOString(),sourceReceipt:prep.sourceReceipt,sourceReceiptSha256:prep.sourceReceiptSha256,
 restored:missing,onlyMissingPriorHashedJsCss:true,newViewerFilesUnchanged:true,ownerPreviewChanged:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({restored:missing.length,ownerPreviewChanged:false}));
