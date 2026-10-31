import fs from 'node:fs';
import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-release-partition10-ready',site=root+'/website';
const pin=root+'/PARENT_SOURCE.json',parent=json(pin);
assert.equal(hash(pin),'0d4856c755796a748b38c530679e9a6bd30efc7906272a23bf8a2eff5ddaf5a1');
const allowed=new Set([
 'tests/clinical-review-navigation.test.ts','tests/imaging-presentation.test.mjs','tests/partition6-history-context.mjs','tests/partition10-font-history.mjs','tests/partition10-font-history.test.mjs',
 'tests/axillary-admission-preservation.test.mjs','tests/clinical-review-axillary-branch-xray.test.ts','tests/clinical-review-shoulder-muscle-xray.test.ts','tests/arterial-delivery-roles.mjs','tests/complete-release-five-followups-preservation.test.mjs','tests/partition10-anatomy-history.mjs',
 'tests/current-atlas-title-tour-delivery.test.mjs','tests/head-feature-roles-preservation.test.mjs','tests/head-link-menu-bound-delivery.test.mjs','tests/head-pilot-delivery-role-preservation-20261021.test.mjs','tests/partition10-head-history.mjs',
]);
const existing=new Set(parent.sourceRows.map(r=>r.path));
const newPaths=[...allowed].filter(p=>!existing.has(p)&&fs.existsSync(site+'/'+p));
const changes=[];
const rows=parent.sourceRows.map(row=>{
 assert.equal(hash(parent.website+'/'+row.path),row.sha256,'Parent source changed');
 const actual=hash(site+'/'+row.path);
 if(actual===row.sha256)return row;
 assert(allowed.has(row.path),'Unexpected candidate change: '+row.path);
 changes.push({path:row.path,before:row.sha256,after:actual});return {path:row.path,sha256:actual,bytes:fs.statSync(site+'/'+row.path).size};
});
for(const path of newPaths){const sha256=hash(site+'/'+path);changes.push({path,before:null,after:sha256});rows.push({path,sha256,bytes:fs.statSync(site+'/'+path).size});}
rows.sort((a,b)=>a.path.localeCompare(b.path));
const inputs=json(site+'/atlas-review/integration-inputs.json');assert.equal(inputs.sha256,parent.review);
for(const row of inputs.inputs)assert.equal(hash(site+'/'+row.path),row.sha256,'Protected input changed');
const oldEnv='F:/VisibleMedicine/staging/20261030-release-repair-website/HISTORICAL_ENVIRONMENT_2.json';
assert.equal(hash(oldEnv),'bd5fc429483bc9cf7ba26ed5290b1c70bdd6e01cb74d8b9aa18b490dfae973f5');
const additionPath='G:/VisibleMedicine-temp/proposals/20261031-partition-ten-head-impl/HISTORICAL_ENVIRONMENT_ADDITIONS.json';
const additions=json(additionPath);assert.deepEqual(Object.keys(additions.additions),['VM_HEAD_PILOT_9FBA_ROOT']);
assert.equal(hash(additions.additions.VM_HEAD_PILOT_9FBA_ROOT+'/manifest.json'),'09189d13a033c9c251de2a21672b3d34fbc32fc743cdaf439bffa450e47ef34b');
const env={schema:'vm-partition-ten-historical-environment/1',parent:{path:oldEnv,sha256:hash(oldEnv)},additions:{path:additionPath,sha256:hash(additionPath)},environment:{...json(oldEnv).environment,...additions.additions},globalConfigurationChanged:false};
fs.writeFileSync(root+'/HISTORICAL_ENVIRONMENT.json',JSON.stringify(env,null,2)+'\n',{flag:'wx'});
const source={...parent,schema:'vm-release-partition-ten-source/1',at:new Date().toISOString(),parent:{path:pin,sha256:hash(pin)},website:site,sourceRows:rows,currentChanges:changes.map(r=>r.path),authoredPaths:[...new Set([...parent.authoredPaths,...changes.map(r=>r.path)])],runtimeUnchangedFromParent:true,installed:false};
fs.writeFileSync(root+'/SOURCE.json',JSON.stringify(source,null,2)+'\n',{flag:'wx'});
const composition={at:new Date().toISOString(),source:{path:root+'/SOURCE.json',sha256:hash(root+'/SOURCE.json')},changed:changes,environment:{path:root+'/HISTORICAL_ENVIRONMENT.json',sha256:hash(root+'/HISTORICAL_ENVIRONMENT.json')},allProductBytesUnchanged:true,protectedInputsUnchanged:true,installed:false,wholeSuitePassing:false};
fs.writeFileSync(root+'/COMPOSITION.json',JSON.stringify(composition,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({source:composition.source,changes:changes.length,rows:rows.length,review:source.review}));
