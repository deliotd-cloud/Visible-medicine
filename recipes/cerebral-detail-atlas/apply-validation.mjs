import fs from 'node:fs';import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-cerebral-detail-ultrasound-atlas',site=root+'/atlas',proposal='G:/VisibleMedicine-temp/proposals/20261031-cerebral-detail-us-validation';
const result=json(proposal+'/RESULT.json'),rows=[];
for(const [name,expected] of Object.entries(result.proposedSha256)){
 const from=proposal+'/scripts/'+name,to=site+'/scripts/'+name;assert.equal(hash(from),expected,name);
 const previous=result.expectedOriginalSha256[name];if(previous)assert.equal(hash(to),previous,name);else assert(!fs.existsSync(to));
 fs.copyFileSync(from,to);assert.equal(hash(to),expected);rows.push({path:'scripts/'+name,sha256:expected,previousSha256:previous??null});
}
fs.writeFileSync(root+'/VALIDATION_PROPOSAL.json',JSON.stringify({at:new Date().toISOString(),rows,handoff:{path:proposal+'/HANDOFF.md',sha256:hash(proposal+'/HANDOFF.md')},result:{path:proposal+'/RESULT.json',sha256:hash(proposal+'/RESULT.json')},runtimeValidated:false,installed:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({scripts:rows.length,runtimeValidated:false}));
