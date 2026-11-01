import fs from 'node:fs';import assert from 'node:assert/strict';
import {guarded} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/run-native-build-balanced-guarded-20261025.mjs';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const own='G:/VisibleMedicine-temp/proposals/20261101-focus-release29';
const integrated=json(own+'/REPAIRS_INTEGRATED.json');assert.equal(hash(integrated.source.path),integrated.source.sha256);
const seal=json(integrated.source.path);
for(const row of seal.sourceRows)assert.equal(hash(seal.website+'/'+row.path),row.sha256,row.path);
const archive='F:/VisibleMedicine/staging/20261015-tour-speed/export/public/atlas-runtime/head-neck';
assert.equal(hash(archive+'/manifest.json'),'09189d13a033c9c251de2a21672b3d34fbc32fc743cdaf439bffa450e47ef34b');
const groups=[
 ['spinal-standalone','--test tests/spinal-historical-replay.test.mjs'],
 ['repaired-roots','--experimental-strip-types --test-concurrency=1 --test tests/clinical-review-lower-limb-connective-xray.test.ts tests/head-neck-pilot-current.test.mjs tests/tour-delivery-preservation.test.mjs'],
 ['reader-behaviour','--test tests/tour-reading-current-delivery.test.mjs'],
];
const results=[];
for(const [name,command] of groups){
 const result=await guarded({site:seal.website,dir:own+'/'+name,command,heap:1024,aggregate:2048,minimum:4096,extraEnv:{VM_ATLAS_SOURCE_REPO:seal.native,VM_HEAD_PILOT_9FBA_ROOT:archive,VM_CURRENT_SOURCE_RECEIPT:integrated.source.path,VM_CURRENT_SOURCE_SHA256:integrated.source.sha256,TEMP:own+'/tmp',TMP:own+'/tmp'}});
 fs.writeFileSync(own+'/'+name+'-RESULT.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});results.push({name,...result});console.log(JSON.stringify({name,...result}));
}
for(const row of seal.sourceRows)assert.equal(hash(seal.website+'/'+row.path),row.sha256,row.path);
const record={at:new Date().toISOString(),source:integrated.source,results,passing:results.every(r=>r.passing),wholeSuitePassing:false,sourceBytesUnchangedDuringChecks:true};
fs.writeFileSync(own+'/FOCUSED_RESULTS.json',JSON.stringify(record,null,2)+'\n',{flag:'wx'});process.exitCode=record.passing?0:1;
