import fs from 'node:fs';
import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import {guarded} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/run-native-build-balanced-guarded-20261025.mjs';
const mode=process.argv[2];assert(['pilot','baseline'].includes(mode));
const root='G:/VisibleMedicine-temp/proposals/20261031-release16-main',stage='G:/VisibleMedicine-temp/staging/20261031-release14-family-epoch-ready',sp=stage+'/SOURCE.json',sh='162396d752cd48e440f89dc51b953947380ffcd4fbae7cd697677be89d7580a1',s=json(sp),p='G:/VisibleMedicine-temp/proposals/20261031-thoracic-reader-pilot',m=json(p+'/MANIFEST.json');
assert.equal(hash(p+'/MANIFEST.json'),'b2979feff3cfa71ddfde9e13202ba7816540536f23717dfe3bcafaaaf00a77b2');
function verify(){assert.equal(hash(sp),sh);for(const r of s.sourceRows)assert.equal(hash(s.website+'/'+r.path),r.sha256,r.path);for(const r of m.files)assert.equal(hash(p+'/'+r.path),r.sha256,r.path);assert.equal(hash(s.historicalEnvironment.path),s.historicalEnvironment.sha256);}
verify();const start=Date.now();
const command=mode==='pilot'?'--experimental-strip-types --import file:///'+p+'/run-thoracic-pilot.mjs --test --test-reporter=tap --test-concurrency=1 '+p+'/tests/atlas-thoracic-core-reasoning.test.ts':'--experimental-strip-types --test --test-reporter=tap --test-concurrency=1 tests/atlas-thoracic-core-reasoning.test.ts';
const result=await guarded({site:s.website,dir:root+'/benchmark-'+mode,command,heap:1024,aggregate:2048,minimum:4096,extraEnv:{...json(s.historicalEnvironment.path).environment,VM_CURRENT_SOURCE_RECEIPT:sp,VM_CURRENT_SOURCE_SHA256:sh,VM_WEBSITE_ROOT:s.website,VM_ATLAS_SOURCE_REPO:s.atlas,ATLAS_SOURCE_REPO:s.atlas,VM_PUBLIC_PREVIEW_SOURCE_ROOT:s.website,TEMP:stage+'/tmp',TMP:stage+'/tmp'}});
verify();const record={at:new Date().toISOString(),mode,source:{path:sp,sha256:sh},proposal:{path:p+'/MANIFEST.json',sha256:hash(p+'/MANIFEST.json')},verifiedSourceRows:s.sourceRows.length,elapsedMs:Date.now()-start,result,installed:false};fs.writeFileSync(root+'/BENCHMARK-'+mode+'.json',JSON.stringify(record,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(record));process.exitCode=result.passing?0:1;
