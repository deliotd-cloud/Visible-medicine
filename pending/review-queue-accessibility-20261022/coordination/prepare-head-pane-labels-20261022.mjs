import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const sourceReceipt='F:/VisibleMedicine/staging/20261022-final-loading-history-closures/APPLIED_SOURCE.json';
assert.equal(sha(read(sourceReceipt)),'f36f00858d80c83c4d0b39d8930d35a9c77e76d28613919f4d8d8de738feb096');
const source=json(sourceReceipt),relative='components/HeadAtlasViewer.tsx',stage='F:/VisibleMedicine/staging/20261022-head-pane-accessible-labels';
assert(!fs.existsSync(stage));
const bytes=read(source.website+'/'+relative);assert.equal(sha(bytes),source.sourceRows.find(row=>row.path===relative).sha256);
for(const kind of ['RAW','CODE']){const destination=stage+'/'+kind+'/'+relative;fs.mkdirSync(path.dirname(destination),{recursive:true});fs.copyFileSync(source.website+'/'+relative,destination,fs.constants.COPYFILE_EXCL);}
fs.mkdirSync(stage+'/CODE/tests');
fs.writeFileSync(stage+'/PREPARED.json',JSON.stringify({at:new Date().toISOString(),sourceReceipt,sourceReceiptSha256:sha(read(sourceReceipt)),website:source.website,relative,rawSha256:sha(bytes),candidateChanged:false},null,2)+'\n',{flag:'wx'});
console.log(stage);
