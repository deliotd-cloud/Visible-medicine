import fs from 'node:fs';import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import {guarded} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/run-native-build-balanced-guarded-20261025.mjs';
const proposal='G:/VisibleMedicine-temp/proposals/20261031-release26-repairs',root='G:/VisibleMedicine-temp/staging/20261031-release26',sourcePath=root+'/SOURCE5.json',baseline=json(proposal+'/BASELINE.json');
assert(json(root+'/verification-twentysix/STATE.json').terminal);
assert.equal(hash(baseline.source4.path),baseline.source4.sha256);
assert.equal(hash(baseline.tap.path),baseline.tap.sha256);
if(!fs.existsSync(sourcePath)){
 const source=json(baseline.source4.path);
 for(const row of source.sourceRows)assert.equal(hash(source.website+'/'+row.path),row.sha256,row.path);
 for(const m of baseline.files){
  const row=source.sourceRows.find(r=>r.path===m.path);assert(row);
  assert.equal(row.sha256,m.stagingSha256);assert.equal(hash(proposal+'/'+m.path),m.proposalSha256);
  fs.copyFileSync(proposal+'/'+m.path,source.website+'/'+m.path);
  row.sha256=m.proposalSha256;row.bytes=fs.statSync(source.website+'/'+m.path).size;
  source.currentChanges.push(m.path);source.changes.push({...row,beforeSha256:m.stagingSha256});
 }
 source.parent=baseline.source4;source.at=new Date().toISOString();
 fs.writeFileSync(sourcePath,JSON.stringify(source,null,2)+'\n',{flag:'wx'});
}
const source=json(sourcePath),site=source.website,tests=baseline.files.map(r=>r.path);
for(const row of source.sourceRows)assert.equal(hash(site+'/'+row.path),row.sha256,row.path);
const result=await guarded({site,dir:root+'/focused-4',command:'--experimental-strip-types --test --test-reporter=tap --test-concurrency=1 '+tests.join(' '),heap:1024,aggregate:2048,minimum:4096,extraEnv:{...json(source.historicalEnvironment.path).environment,VM_CURRENT_SOURCE_RECEIPT:sourcePath,VM_CURRENT_SOURCE_SHA256:hash(sourcePath),VM_WEBSITE_ROOT:site,VM_ATLAS_SOURCE_REPO:source.atlas,ATLAS_SOURCE_REPO:source.atlas,VM_PUBLIC_PREVIEW_SOURCE_ROOT:site,TEMP:root+'/tmp',TMP:root+'/tmp'}});
for(const row of source.sourceRows)assert.equal(hash(site+'/'+row.path),row.sha256,row.path);
fs.writeFileSync(root+'/PARTITION26_FOCUSED.json',JSON.stringify({at:new Date().toISOString(),source:{path:sourcePath,sha256:hash(sourcePath)},tests,result,sourceUnchanged:true,wholeSuitePassing:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(result));process.exitCode=result.passing?0:1;
