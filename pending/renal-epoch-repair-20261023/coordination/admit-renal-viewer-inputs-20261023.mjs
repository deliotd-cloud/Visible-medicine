import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261023-renal-epoch-repair',p=json(root+'/PREPARATION.json'),source=json(p.sourceReceipt),rows=new Map(source.sourceRows.map(r=>[r.path,r])),manifest=json(p.website+'/public/atlas-review-viewer/manifest.json'),added=[];
for(const entry of manifest.files.filter(r=>/\.(?:html|js)$/.test(r.path))){
 assert(!entry.path.split('/').includes('..'));const relative='public/atlas-review-viewer/'+entry.path,record=rows.get(relative);assert(record);
 const bytes=read(p.frozenSource+'/'+relative);assert.equal(sha(bytes),record.sha256);assert.equal(sha(bytes),entry.sha256);
 const dest=p.website+'/'+relative;assert(!fs.existsSync(dest));fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,bytes,{flag:'wx'});added.push(record);
}
fs.writeFileSync(root+'/ADDITIONAL_VIEWER_INPUTS.json',JSON.stringify({at:new Date().toISOString(),sourceReceiptSha256:p.sourceReceiptSha256,added,reason:'Full feature assertions traverse emitted teaching from the protected Review viewer too. Admit only exact manifest-bound HTML/JS, no binary models or new build.',initialFailure:'main-pin-full-v2.tap',previewChanged:false},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({path:root+'/ADDITIONAL_VIEWER_INPUTS.json',sha256:sha(read(root+'/ADDITIONAL_VIEWER_INPUTS.json')),viewerHtmlAndJs:added.length}));
