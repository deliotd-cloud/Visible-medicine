// Mechanical, source-only fixture builder. Run only after the new candidate import is complete.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../../../',import.meta.url));
const before='F:/VisibleMedicine/staging/20261017-salpingopharyngeus-website/website-before/source/';
const base='tests/fixtures/head-masks-before-salpingopharyngeus/';
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const read=(parent,relative)=>fs.readFileSync(path.join(parent,relative));
const pin=JSON.parse(read(before,'tests/fixtures/current-atlas-delivery.json'));
const inputs=JSON.parse(read(before,'atlas-review/integration-inputs.json'));
assert.equal(pin.source,'0ac11ca2eb8effe47f2b6927f7987a9a36c7e3a2');
assert.equal(pin.reviewIntegration,'301707213f9c79bc07eb091870c616bf5f1d413511e19a7e1a2457c9db4581a6');
assert.equal(inputs.inputs.length,1645);
assert.equal(inputs.sha256,pin.reviewIntegration);
for(const row of inputs.inputs)assert.equal(sha(read(before,row.path)),row.sha256,'Original input: '+row.path);
const documents={};
for(const relative of [...Object.keys(pin.documents),'docs/completion-checklist.json','docs/completion-checklist.md'])documents[relative]=sha(read(before,relative));
const mandatory=[...Object.keys(documents),'tests/fixtures/current-atlas-delivery.json','tests/historical-head-mask-epoch.mjs','tests/head-mask-resource-binding.test.mjs','tests/head-comparison-renderer-revision.test.mjs','tests/clinical-review-inbox-navigation-revision.test.mjs'];
const selected=new Set(mandatory);
for(const row of inputs.inputs){
 let live;
 try{live=read(root,row.path)}catch{live=null}
 if(!live||sha(live)!==row.sha256)selected.add(row.path);
}
const records=[];
for(const relative of [...selected].sort()){
 assert(/\.(?:ts|tsx|css|json|mjs|md|txt|html)$/.test(relative),'Source-only path: '+relative);
 const frozenPath=base+relative.replaceAll('/','__')+'.txt';
 const bytes=read(before,relative);
 const destination=path.join(root,frozenPath);
 if(fs.existsSync(destination))assert.deepEqual(fs.readFileSync(destination),bytes,'Existing frozen original: '+relative);
 else fs.writeFileSync(destination,bytes,{flag:'wx'});
 records.push({path:relative,frozenPath,sha256:sha(bytes)});
}
const manifest={schema:'vm-head-masks-before-salpingopharyngeus-1',source:pin.source,reviewIntegration:pin.reviewIntegration,inputs:inputs.inputs,documents,records};
fs.writeFileSync(path.join(root,base,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({inputs:inputs.inputs.length,documents:Object.keys(documents).length,records:records.length,changedInputs:records.length-mandatory.length}));
