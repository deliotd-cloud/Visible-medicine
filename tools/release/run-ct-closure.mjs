import fs from 'node:fs';import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import {guarded} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/run-native-build-balanced-guarded-20261025.mjs';
const proposal='G:/VisibleMedicine-temp/proposals/20261031-release26-repairs',root='G:/VisibleMedicine-temp/staging/20261031-release26',sourcePath=root+'/SOURCE7.json',baseline=json(proposal+'/BASELINE.json');
const tests=['tests/atlas-nested-ct-orientation.test.ts'];
assert(json(root+'/PARTITION26_CORRECTIONS.json').result.process.terminalObserved);
if(!fs.existsSync(sourcePath)){
 const source=json(root+'/SOURCE6.json');
 for(const row of source.sourceRows)assert.equal(hash(source.website+'/'+row.path),row.sha256,row.path);
 for(const file of tests){
  const m=baseline.files.find(r=>r.path===file),row=source.sourceRows.find(r=>r.path===file);assert(m&&row);
  assert.equal(hash(proposal+'/versions/v2/'+file),row.sha256);
  assert.equal(hash(proposal+'/'+file),m.proposalSha256);
  fs.copyFileSync(proposal+'/'+file,source.website+'/'+file);
  row.sha256=m.proposalSha256;row.bytes=fs.statSync(source.website+'/'+file).size;
  const change=source.changes.find(r=>r.path===file);assert(change);Object.assign(change,row);
 }
 source.parent={path:root+'/SOURCE6.json',sha256:hash(root+'/SOURCE6.json')};source.at=new Date().toISOString();
 fs.writeFileSync(sourcePath,JSON.stringify(source,null,2)+'\n',{flag:'wx'});
}
const source=json(sourcePath),site=source.website;
const result=await guarded({site,dir:root+'/focused-6',command:'--experimental-strip-types --test --test-reporter=tap --test-concurrency=1 '+tests.join(' '),heap:1024,aggregate:2048,minimum:4096,extraEnv:{...json(source.historicalEnvironment.path).environment,VM_CURRENT_SOURCE_RECEIPT:sourcePath,VM_CURRENT_SOURCE_SHA256:hash(sourcePath),VM_WEBSITE_ROOT:site,VM_ATLAS_SOURCE_REPO:source.atlas,ATLAS_SOURCE_REPO:source.atlas,VM_PUBLIC_PREVIEW_SOURCE_ROOT:site,TEMP:root+'/tmp',TMP:root+'/tmp'}});
for(const row of source.sourceRows)assert.equal(hash(site+'/'+row.path),row.sha256,row.path);
fs.writeFileSync(root+'/PARTITION26_CT_CLOSURE.json',JSON.stringify({at:new Date().toISOString(),source:{path:sourcePath,sha256:hash(sourcePath)},tests,result,sourceUnchanged:true,wholeSuitePassing:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(result));process.exitCode=result.passing?0:1;
