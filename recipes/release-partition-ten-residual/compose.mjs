import fs from 'node:fs';
import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-release-partition10-final',site=root+'/website',pin=root+'/PARENT_SOURCE.json';
assert.equal(hash(pin),'7164d154e054a675884b281852fd4dae078e7f944f2d881df8eaf0c856b4b72a');
const parent=json(pin),allowed=new Set(['tests/clinical-review-shoulder-muscle-xray.test.ts','tests/head-feature-roles-preservation.test.mjs','tests/head-practice-exit-preservation.test.mjs']),changes=[];
const rows=parent.sourceRows.map(row=>{
 assert.equal(hash(parent.website+'/'+row.path),row.sha256,'Parent source changed');
 const actual=hash(site+'/'+row.path);if(actual===row.sha256)return row;
 assert(allowed.has(row.path),'Unexpected candidate change: '+row.path);
 changes.push({path:row.path,before:row.sha256,after:actual});return {path:row.path,sha256:actual,bytes:fs.statSync(site+'/'+row.path).size};
});
assert.equal(changes.length,3);
const inputs=json(site+'/atlas-review/integration-inputs.json');assert.equal(inputs.sha256,parent.review);
for(const row of inputs.inputs)assert.equal(hash(site+'/'+row.path),row.sha256,'Protected input changed');
const source={...parent,schema:'vm-release-partition-ten-successor/1',at:new Date().toISOString(),parent:{path:pin,sha256:hash(pin)},website:site,sourceRows:rows,currentChanges:changes.map(row=>row.path),authoredPaths:[...new Set([...parent.authoredPaths,...changes.map(row=>row.path)])],runtimeUnchangedFromParent:true,installed:false};
fs.writeFileSync(root+'/SOURCE.json',JSON.stringify(source,null,2)+'\n',{flag:'wx'});
const composition={at:new Date().toISOString(),source:{path:root+'/SOURCE.json',sha256:hash(root+'/SOURCE.json')},changed:changes,allProductBytesUnchanged:true,protectedInputsUnchanged:true,installed:false,wholeSuitePassing:false};
fs.writeFileSync(root+'/COMPOSITION.json',JSON.stringify(composition,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(composition));
