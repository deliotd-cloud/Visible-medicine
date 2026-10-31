import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-prostate-website',site=root+'/website',proposal='G:/VisibleMedicine-temp/proposals/20261031-prostate-coverage',coverage=json(proposal+'/PROPOSAL.json');
assert.equal(coverage.sourceRevision,'df175264724a98ca4f70de19e1bfabd325084fdb');
for(const r of coverage.overlayFiles){assert.equal(hash(site+'/'+r.path),r.baselineSha256,r.path);const from=proposal+'/'+r.path;assert.equal(hash(from),r.proposalSha256,r.path);fs.copyFileSync(from,site+'/'+r.path);}
const run=(label,args)=>{const r=spawnSync(process.execPath,['--max-old-space-size=768',...args],{cwd:site,encoding:'utf8',windowsHide:true,maxBuffer:2e6,env:{...process.env,VM_ATLAS_SOURCE_REPO:coverage.exactLfSource,ATLAS_SOURCE_REPO:coverage.exactLfSource}});fs.writeFileSync(root+'/logs/'+label+'.log',r.stdout+r.stderr,{flag:'wx'});assert.equal(r.status,0,label);};
run('coverage',['scripts/check-anatomy-coverage.mjs','--source-root',coverage.exactLfSource,'--check']);
const oldInventory=json(site+'/lib/atlas-model-inventory.json');run('inventory',['scripts/atlas-model-inventory.mjs']);const inventory=json(site+'/lib/atlas-model-inventory.json');
assert.deepEqual(inventory.models,oldInventory.models,'No model byte or public inventory admission');
const p=site+'/lib/atlas-delivery-policy.ts',policy=fs.readFileSync(p,'utf8');assert(policy.includes("audience: 'administrator-review'"));const before=policy.match(/manifestRevision: '([a-f0-9]{64})'/);assert(before);const digest=hash(site+'/lib/atlas-model-inventory.json');fs.writeFileSync(p,policy.replace(before[1],digest));
run('policy',['--experimental-strip-types','scripts/verify-atlas-delivery-policy.mjs']);
run('lecture-catalog',['scripts/lecture-body-catalog.mjs']);
run('bind',['scripts/bind-clinical-review.mjs']);
fs.writeFileSync(root+'/REVIEW_PREPARED.json',JSON.stringify({at:new Date().toISOString(),coverage:{path:proposal+'/PROPOSAL.json',sha256:hash(proposal+'/PROPOSAL.json')},review:json(site+'/atlas-review/integration-inputs.json').sha256,inputs:json(site+'/atlas-review/integration-inputs.json').inputs.length,imported:json(site+'/atlas-review/manifest.json').files.length,modelBytesUnchanged:true,privateAudienceUnchanged:true,installed:false},null,2)+'\n',{flag:'wx'});
console.log(fs.readFileSync(root+'/REVIEW_PREPARED.json','utf8'));
