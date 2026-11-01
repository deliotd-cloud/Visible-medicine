import fs from 'node:fs';import assert from 'node:assert/strict';
import {guarded} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/run-native-build-balanced-guarded-20261025.mjs';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const own='G:/VisibleMedicine-temp/proposals/20261101-focus-release29',source=json(own+'/VERIFIED_REPAIRS.json').source;
assert.equal(hash(source.path),source.sha256);const seal=json(source.path);
for(const row of seal.sourceRows)assert.equal(hash(seal.website+'/'+row.path),row.sha256,row.path);
const plan=json(own+'/SPINAL_DIAGNOSTIC_PLAN.json');assert.equal(hash(plan.originalWrapper.path),plan.originalWrapper.sha256);assert.equal(hash(plan.diagnostic.path),plan.diagnostic.sha256);
const groups=[['corrected-connective','--experimental-strip-types --test tests/clinical-review-lower-limb-connective-xray.test.ts'],['spinal-diagnostic','--test-reporter=tap --test '+own+'/spinal-diagnostic.mjs']];
const results=[];
for(const[name,command]of groups){
 const result=await guarded({site:seal.website,dir:own+'/'+name,command,heap:1024,aggregate:2048,minimum:4096,extraEnv:{VM_ATLAS_SOURCE_REPO:seal.native,VM_HEAD_PILOT_9FBA_ROOT:'F:/VisibleMedicine/staging/20261015-tour-speed/export/public/atlas-runtime/head-neck',VM_CURRENT_SOURCE_RECEIPT:source.path,VM_CURRENT_SOURCE_SHA256:source.sha256,TEMP:own+'/tmp',TMP:own+'/tmp'}});
 fs.writeFileSync(own+'/'+name+'-RESULT.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});results.push({name,...result});console.log(JSON.stringify({name,...result}));
}
for(const row of seal.sourceRows)assert.equal(hash(seal.website+'/'+row.path),row.sha256,row.path);
fs.writeFileSync(own+'/FINAL_FOCUSED_RESULTS.json',JSON.stringify({at:new Date().toISOString(),source,results,passing:results.every(r=>r.passing),wholeSuitePassing:false},null,2)+'\n',{flag:'wx'});
process.exitCode=results.every(r=>r.passing)?0:1;
