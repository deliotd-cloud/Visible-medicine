import fs from 'node:fs';import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-release-partition8-ready',proposal='G:/VisibleMedicine-temp/proposals/20261031-release-partition8-repair';
const prepared=json(root+'/PREPARED.json'),parent=json(prepared.parent.path),site=prepared.website;
assert.equal(hash(prepared.parent.path),prepared.parent.sha256);
const changes=[
  {path:'tests/deep-brain-history-role.mjs',sha256:'56e331155d924d4e898afecab0c30ce1f0461ac01f0defefb47405505ff4a286'},
  {path:'tests/tour-discovery-current-delivery.test.mjs',sha256:'4c737580f94bf37777f2c59aad3af0155e9cb25e3d0216c012f79cf147b165bb'},
];
for(const row of parent.sourceRows)assert.equal(hash(site+'/'+row.path),row.sha256,row.path);
for(const row of changes){assert.equal(hash(proposal+'/'+row.path),row.sha256,row.path);fs.copyFileSync(proposal+'/'+row.path,site+'/'+row.path);}
const paths=changes.map(row=>row.path);
for(const row of parent.sourceRows)if(!paths.includes(row.path))assert.equal(hash(site+'/'+row.path),row.sha256,row.path);
const rows=parent.sourceRows.map(row=>paths.includes(row.path)?{path:row.path,sha256:hash(site+'/'+row.path),bytes:fs.statSync(site+'/'+row.path).size}:row);
for(const row of json(site+'/atlas-review/integration-inputs.json').inputs)assert.equal(hash(site+'/'+row.path),row.sha256,row.path);
const source={...parent,schema:'vm-release-partition8-source/1',at:new Date().toISOString(),parent:prepared.parent,website:site,sourceRows:rows,currentChanges:paths,authoredPaths:[...new Set([...parent.authoredPaths,...paths])],runtimeUnchangedFromParent:true,installed:false};
fs.writeFileSync(root+'/SOURCE.json',JSON.stringify(source,null,2)+'\n',{flag:'wx'});
const negative=fs.readFileSync(proposal+'/tests/deep-brain-history-role-negative.test.mjs','utf8');
assert.equal(negative.split("from './deep-brain-history-role.mjs'").length,2);
fs.writeFileSync(root+'/negative-role.test.mjs',negative.replace("from './deep-brain-history-role.mjs'","from './website/tests/deep-brain-history-role.mjs'"),{flag:'wx'});
fs.writeFileSync(root+'/COMPOSITION.json',JSON.stringify({at:new Date().toISOString(),source:{path:root+'/SOURCE.json',sha256:hash(root+'/SOURCE.json')},proposalReceipt:{path:proposal+'/REPAIR_RECEIPT.json',sha256:hash(proposal+'/REPAIR_RECEIPT.json')},changed:changes,productBytesUnchanged:true,protectedInputsUnchanged:true,integratedFocusedChecksPending:true,wholeSuitePassing:false,installed:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({source:hash(root+'/SOURCE.json'),rows:rows.length,changed:paths,productUnchanged:true}));
