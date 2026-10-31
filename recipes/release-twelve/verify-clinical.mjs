import fs from 'node:fs';
import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import {guarded} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/run-native-build-balanced-guarded-20261025.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-release-partition12-repairs';
const sourceFile=root+'/SOURCE.json',sourceSha='59bef410c6765f00f2ec890b103887eb534b2fe48441dc516c11e6c7cc7c21b6',source=json(sourceFile);
const verify=()=>{assert.equal(hash(sourceFile),sourceSha);for(const row of source.sourceRows)assert.equal(hash(source.website+'/'+row.path),row.sha256,row.path);};
verify();assert.equal(hash(source.historicalEnvironment.path),source.historicalEnvironment.sha256);
const tests=['clinical-review-abdominal-eus-current.test.ts','clinical-review-neonatal-cranial-us.test.ts','clinical-review-pulmonary-venous-teaching.test.ts'].map(p=>'tests/'+p);
const evidence=root+'/clinical-focused';
const result=await guarded({site:source.website,dir:evidence,command:'--experimental-strip-types --test --test-reporter=tap --test-concurrency=1 '+tests.join(' '),heap:1024,aggregate:2048,minimum:4096,extraEnv:{...json(source.historicalEnvironment.path).environment,VM_CURRENT_SOURCE_RECEIPT:sourceFile,VM_CURRENT_SOURCE_SHA256:sourceSha,VM_WEBSITE_ROOT:source.website,VM_ATLAS_SOURCE_REPO:source.atlas,ATLAS_SOURCE_REPO:source.atlas,VM_PUBLIC_PREVIEW_SOURCE_ROOT:source.website,TEMP:root+'/tmp',TMP:root+'/tmp'}});
verify();
const text=fs.readFileSync(evidence+'/runner.stdout.log','utf8');
const counts={};for(const key of ['tests','pass','fail','cancelled','skipped','todo']){const matches=[...text.matchAll(new RegExp('^# '+key+' (\\d+)\\r?$','gm'))];assert.equal(matches.length,1,'Unambiguous TAP summary '+key);counts[key]=Number(matches[0][1]);}
const passed=result.passing&&counts.tests>0&&counts.tests===counts.pass&&['fail','cancelled','skipped','todo'].every(k=>counts[k]===0);
const report={at:new Date().toISOString(),source:{path:sourceFile,sha256:sourceSha},tests,counts,passed,guarded:result,sourceUnchanged:true,installed:false,wholeSuitePassing:false};
fs.writeFileSync(root+'/CLINICAL_FOCUSED.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({passed,counts,evidence,sourceSha}));process.exitCode=passed?0:1;
