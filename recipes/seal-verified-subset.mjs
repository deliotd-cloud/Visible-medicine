import fs from 'node:fs';import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261030-review-release-continuation',previous=json(root+'/SOURCE-2.json'),site=previous.website,parent=json(previous.parent.path);
for(const row of previous.sourceRows)assert.equal(hash(site+'/'+row.path),row.sha256,row.path);
assert.equal(json(root+'/RESULT-focused-2.json').passing,false);
fs.mkdirSync(root+'/unverified-proposal');
const held=['tests/clinical-review-elbow-arterial-tour.test.ts','tests/renal-tour-epoch-admission.mjs'];
for(const name of held){
 fs.copyFileSync(site+'/'+name,root+'/unverified-proposal/'+name.split('/').at(-1),fs.constants.COPYFILE_EXCL);
 const row=parent.sourceRows.find(row=>row.path===name);assert(row);
 assert.equal(hash(parent.website+'/'+name),row.sha256);
 fs.copyFileSync(parent.website+'/'+name,site+'/'+name);
}
const rows=previous.sourceRows.map(row=>({...row,bytes:fs.statSync(site+'/'+row.path).size,sha256:hash(site+'/'+row.path)}));
const changed=rows.filter(row=>row.sha256!==parent.sourceRows.find(old=>old.path===row.path).sha256).map(row=>row.path);
assert.deepEqual(changed.sort(),['tests/fixtures/current-atlas-delivery.json','tests/head-image-tools-test-role.mjs'].sort());
fs.writeFileSync(root+'/SOURCE-VERIFIED-SUBSET.json',JSON.stringify({...previous,at:new Date().toISOString(),sourceRows:rows,testOnlyChanged:changed,heldProposal:held,heldReason:'Elbow/regional-tour source equality and native expected revision still fail after initial admission; no claim of completed repair.',previous:{path:root+'/SOURCE-2.json',sha256:hash(root+'/SOURCE-2.json')}},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({retained:changed,held}));
