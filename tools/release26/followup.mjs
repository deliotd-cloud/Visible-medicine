import fs from 'node:fs';import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import {guarded} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/run-native-build-balanced-guarded-20261025.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-release26',sourcePath=root+'/SOURCE3.json';
if(!fs.existsSync(sourcePath)){
 const source=json(root+'/SOURCE2.json');assert(json(root+'/FOCUSED.json').result.process.terminalObserved);const proposal='G:/VisibleMedicine-temp/proposals/20261031-release26-history',manifest=json(proposal+'/MANIFEST.json');
 for(const p of ['tests/fda-reference-current-delivery.test.mjs','tests/renal-tour-epoch-admission.mjs']){const m=manifest.proposedRows.find(r=>r.path===p),row=source.sourceRows.find(r=>r.path===p);assert(m&&row);assert.equal(hash(source.website+'/'+p),row.sha256);assert.equal(hash(proposal+'/'+p),m.proposedSha256);fs.copyFileSync(proposal+'/'+p,source.website+'/'+p);row.sha256=m.proposedSha256;row.bytes=fs.statSync(source.website+'/'+p).size;const old=source.changes.find(r=>r.path===p);if(old)Object.assign(old,row);else{source.changes.push({...row,beforeSha256:m.baseSha256});source.currentChanges.push(p);}}
 source.parent={path:root+'/SOURCE2.json',sha256:hash(root+'/SOURCE2.json')};source.at=new Date().toISOString();fs.writeFileSync(sourcePath,JSON.stringify(source,null,2)+'\n',{flag:'wx'});
}
const source=json(sourcePath),site=source.website;for(const row of source.sourceRows)assert.equal(hash(site+'/'+row.path),row.sha256,row.path);
const first=json(root+'/FOCUSED.json').tests,remaining=first.slice(first.indexOf('tests/clinical-review-forearm-vascular-xray.test.ts'));
const tests=['tests/clinical-review-axillary-branch-xray.test.ts',...remaining,'tests/fda-reference-current-delivery.test.mjs'];
const result=await guarded({site,dir:root+'/focused-2',command:'--experimental-strip-types --test --test-reporter=tap --test-concurrency=1 '+tests.join(' '),heap:1024,aggregate:2048,minimum:4096,extraEnv:{...json(source.historicalEnvironment.path).environment,VM_CURRENT_SOURCE_RECEIPT:sourcePath,VM_CURRENT_SOURCE_SHA256:hash(sourcePath),VM_WEBSITE_ROOT:site,VM_ATLAS_SOURCE_REPO:source.atlas,ATLAS_SOURCE_REPO:source.atlas,VM_PUBLIC_PREVIEW_SOURCE_ROOT:site,TEMP:root+'/tmp',TMP:root+'/tmp'}});
for(const row of source.sourceRows)assert.equal(hash(site+'/'+row.path),row.sha256,row.path);
fs.writeFileSync(root+'/FOLLOWUP.json',JSON.stringify({at:new Date().toISOString(),source:{path:sourcePath,sha256:hash(sourcePath)},tests,result,sourceUnchanged:true,wholeSuitePassing:false},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));process.exitCode=result.passing?0:1;
