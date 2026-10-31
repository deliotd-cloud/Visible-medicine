// Run only after the currently active native partition is terminal.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import {guarded} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/run-native-build-balanced-guarded-20261025.mjs';

assert.deepEqual(process.argv.slice(2),['--run']);
const root='G:/VisibleMedicine-temp/proposals/20261031-hand-pilot-native';
const stage='G:/VisibleMedicine-temp/staging/20261031-release16-final';
const sourcePath=stage+'/SOURCE.json';
const sourceHash='ec5e332400ad3744044342deb9f7c6d80de0d1ab432107f96c0a5d221faecc8b';
const pilot='G:/VisibleMedicine-temp/proposals/20261031-hand-history-speed-pilot';
const pilotHash='e9f4705d3308a5c86e0fe68c7f355dc79284a6ad31e818f5a25f982b7e635fb4';
const wrapperHash='314633e4fafa7044233adcdb0dbf0dafe8dfb801511b7f775f3c68dd825127f9';
const source=json(sourcePath),manifest=json(pilot+'/MANIFEST.json');
const verify=()=>{
 assert.equal(hash(sourcePath),sourceHash);
 assert.equal(hash(pilot+'/MANIFEST.json'),pilotHash);
 assert.equal(hash(root+'/run-hand-pilot.mjs'),wrapperHash);
 assert.equal(source.website,stage+'/website');
 assert.equal(manifest.baseline.website,source.website);
 assert.equal(manifest.baseline.sourceSha256,sourceHash);
 for(const row of source.sourceRows)assert.equal(hash(source.website+'/'+row.path),row.sha256,row.path);
 for(const row of manifest.files)assert.equal(hash(pilot+'/'+row.path),row.sha256,row.path);
 assert.equal(hash(source.historicalEnvironment.path),source.historicalEnvironment.sha256);
};
verify();
const attempt=fs.mkdtempSync(root+'/attempt-');
fs.mkdirSync(attempt+'/tmp');
const command='--experimental-strip-types --import file:///'+root+'/run-hand-pilot.mjs --test --test-reporter=tap --test-concurrency=1 tests/atlas-hand-vessel-xray.test.mjs';
fs.writeFileSync(attempt+'/INTENT.json',JSON.stringify({source:{path:sourcePath,sha256:sourceHash},
 pilot:{path:pilot+'/MANIFEST.json',sha256:pilotHash},wrapper:{path:root+'/run-hand-pilot.mjs',sha256:wrapperHash},
 command,wholeSuitePassing:false,installed:false},null,2)+'\n',{flag:'wx'});
const start=Date.now();
const result=await guarded({site:source.website,dir:attempt+'/evidence',command,
 heap:1024,aggregate:2048,minimum:4096,
 extraEnv:{...json(source.historicalEnvironment.path).environment,
  VM_CURRENT_SOURCE_RECEIPT:sourcePath,VM_CURRENT_SOURCE_SHA256:sourceHash,
  VM_WEBSITE_ROOT:source.website,VM_ATLAS_SOURCE_REPO:source.atlas,ATLAS_SOURCE_REPO:source.atlas,
  VM_PUBLIC_PREVIEW_SOURCE_ROOT:source.website,TEMP:attempt+'/tmp',TMP:attempt+'/tmp'}});
verify();
let counts=null;
if(result.passing){
 const output=fs.readFileSync(attempt+'/evidence/runner.stdout.log','utf8');
 counts={};
 for(const key of ['tests','pass','fail','cancelled','skipped','todo']){
  const matches=[...output.matchAll(new RegExp('^# '+key+' (\\d+)\\r?$','gm'))];
  assert.equal(matches.length,1,'Unambiguous TAP summary '+key);
  counts[key]=Number(matches[0][1]);
 }
 assert.deepEqual(counts,{tests:3,pass:3,fail:0,cancelled:0,skipped:0,todo:0});
}
const record={at:new Date().toISOString(),elapsedMs:Date.now()-start,source:{path:sourcePath,sha256:sourceHash},
 pilot:{path:pilot+'/MANIFEST.json',sha256:pilotHash},wrapper:{path:root+'/run-hand-pilot.mjs',sha256:wrapperHash},
 counts,result,accepted:result.passing&&counts?.pass===3,wholeSuitePassing:false,installed:false};
fs.writeFileSync(attempt+'/RESULT.json',JSON.stringify(record,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({attempt,accepted:record.accepted,elapsedMs:record.elapsedMs,counts}));
process.exitCode=record.accepted?0:1;
