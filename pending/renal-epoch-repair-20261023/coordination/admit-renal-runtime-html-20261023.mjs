import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261023-renal-epoch-repair',p=json(root+'/PREPARATION.json'),source=json(p.sourceReceipt),rows=new Map(source.sourceRows.map(r=>[r.path,r])),added=[];
for(const module of ['head-neck','shoulder','lower-limb','female-pelvis']){
 const relative='public/atlas-runtime/'+module+'/index.html',record=rows.get(relative);assert(record);
 const bytes=read(p.frozenSource+'/'+relative),manifest=json(p.frozenSource+'/public/atlas-runtime/'+module+'/manifest.json');
 assert.equal(sha(bytes),record.sha256);assert.equal(sha(bytes),manifest.files.find(r=>r.path==='index.html').sha256);
 const dest=p.website+'/'+relative;assert(!fs.existsSync(dest));fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,bytes,{flag:'wx'});added.push(record);
}
fs.writeFileSync(root+'/ADDITIONAL_INPUTS.json',JSON.stringify({at:new Date().toISOString(),sourceReceipt:p.sourceReceipt,sourceReceiptSha256:p.sourceReceiptSha256,added,reason:'Contained emittedTeaching traversal also requires the four exact manifest-bound HTML entrypoints. The initial full pin test failed only on the absent local entrypoint; no product bytes generated or altered.',initialFailure:'main-pin-full.tap',previewChanged:false},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({path:root+'/ADDITIONAL_INPUTS.json',sha256:sha(read(root+'/ADDITIONAL_INPUTS.json')),htmlEntries:4}));
