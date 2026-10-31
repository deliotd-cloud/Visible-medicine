import fs from 'node:fs';import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import {guarded} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/run-native-build-balanced-guarded-20261025.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-release26',own='G:/VisibleMedicine-temp/proposals/20261031-release26-main',proposal='G:/VisibleMedicine-temp/proposals/20261031-release26-history',sourcePath=root+'/SOURCE4.json';
if(!fs.existsSync(sourcePath)){
 const source=json(root+'/SOURCE3.json');assert(json(root+'/FOLLOWUP.json').result.process.terminalObserved);const manifest=json(proposal+'/MANIFEST.json');
 const selected=['tests/clinical-review-forearm-vascular-xray.test.ts','tests/clinical-review-teaching-heading.test.ts','tests/clinical-review-vocal-tissue-teaching.test.ts','tests/shoulder-current-role-inverse.mjs'];
 const proposals=selected.map(p=>({dir:proposal,...manifest.proposedRows.find(r=>r.path===p)}));proposals.push({dir:own,...json(own+'/HEAD_HISTORY.json')});
 for(const m of proposals){assert(m.path);const row=source.sourceRows.find(r=>r.path===m.path);assert(row);assert.equal(row.sha256,m.baseSha256);assert.equal(hash(source.website+'/'+m.path),m.baseSha256);assert.equal(hash(m.dir+'/'+m.path),m.proposedSha256);fs.copyFileSync(m.dir+'/'+m.path,source.website+'/'+m.path);row.sha256=m.proposedSha256;row.bytes=fs.statSync(source.website+'/'+m.path).size;source.currentChanges.push(m.path);source.changes.push({...row,beforeSha256:m.baseSha256});}
 source.parent={path:root+'/SOURCE3.json',sha256:hash(root+'/SOURCE3.json')};source.at=new Date().toISOString();fs.writeFileSync(sourcePath,JSON.stringify(source,null,2)+'\n',{flag:'wx'});
}
const source=json(sourcePath),site=source.website;for(const row of source.sourceRows)assert.equal(hash(site+'/'+row.path),row.sha256,row.path);
const tests=[...json(root+'/FOCUSED.json').tests,'tests/fda-reference-current-delivery.test.mjs'];
const result=await guarded({site,dir:root+'/focused-3',command:'--experimental-strip-types --test --test-reporter=tap --test-concurrency=1 '+tests.join(' '),heap:1024,aggregate:2048,minimum:4096,extraEnv:{...json(source.historicalEnvironment.path).environment,VM_CURRENT_SOURCE_RECEIPT:sourcePath,VM_CURRENT_SOURCE_SHA256:hash(sourcePath),VM_WEBSITE_ROOT:site,VM_ATLAS_SOURCE_REPO:source.atlas,ATLAS_SOURCE_REPO:source.atlas,VM_PUBLIC_PREVIEW_SOURCE_ROOT:site,TEMP:root+'/tmp',TMP:root+'/tmp'}});
for(const row of source.sourceRows)assert.equal(hash(site+'/'+row.path),row.sha256,row.path);
fs.writeFileSync(root+'/FINAL_FOCUSED.json',JSON.stringify({at:new Date().toISOString(),source:{path:sourcePath,sha256:hash(sourcePath)},tests,result,sourceUnchanged:true,wholeSuitePassing:false},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));process.exitCode=result.passing?0:1;
