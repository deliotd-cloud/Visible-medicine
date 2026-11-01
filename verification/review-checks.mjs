import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {guarded} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/run-native-build-balanced-guarded-20261025.mjs';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import {verifyNativeReuse,receiptPath} from '../20261101-focus-delivery/reuse-native.mjs';
const own='G:/VisibleMedicine-temp/proposals/20261101-focus-delivery-assembly',root='G:/VisibleMedicine-temp/staging/20261101-focus-delivery/attempt-1',site=root+'/website';
const source=json(own+'/ASSEMBLY_COMPLETE.json');assert(source.nativeTypesPassed&&source.assemblyPassed);assert(json(root+'/assemble-v2-RESULT.json').passing);
const prep=json(root+'/PREPARATION.json');verifyNativeReuse(receiptPath,prep.native);
const binding=json(site+'/atlas-review/integration-inputs.json');assert.equal(binding.sha256,source.assembled.review);
for(const row of binding.inputs)assert.equal(hash(site+'/'+row.path),row.sha256,row.path);
const previous='G:/VisibleMedicine-temp/staging/20261031-prostate-selection/checks/review2';
assert.equal(hash(previous+'/PROCESS-TERMINAL.json'),'a9692aa50843d3992c8ff0c945d89d9ef9a95e6c5c8814b906dea2e54d1ecedd');
assert.equal(hash(previous+'/owned-processes.jsonl'),'deb1ba50d4d74070693bac59a2b1ddfb6f9e20139c9e3d61f3255cbc11aad774');
assert.equal(json(previous+'/PROCESS-TERMINAL.json').exitCode,0);
const samples=fs.readFileSync(previous+'/owned-processes.jsonl','utf8').trim().split('\n').map(line=>JSON.parse(line));
const sampledPrivatePeakMiB=Math.max(...samples.map(row=>row.processes.reduce((n,p)=>n+p.privateBytes,0)))/1048576;assert(sampledPrivatePeakMiB<2048);
const out=fs.realpathSync(site+'/public/atlas-review-viewer');assert(out.startsWith(fs.realpathSync(root)+path.sep),'Review build output escapes attempt');
fs.writeFileSync(own+'/REVIEW_PLAN.json',JSON.stringify({at:new Date().toISOString(),source:prep.nativeHead,binding:binding.sha256,previousReceipt:previous,sampledPrivatePeakMiB,previousHeapMiB:2304,trialHeapMiB:1536,jobMiB:2048,minimumMiB:4096,unchangedReserveMiB:2048,notPeakGuarantee:true,commandsUnchanged:true,websiteBuildBudgetUnchanged:true,installed:false},null,2)+'\n',{flag:'wx'});
for(const [name,command,heap]of [['review-build','scripts/build-clinical-review-viewer.mjs',1536],['focused-checks','G:/VisibleMedicine-temp/proposals/20261101-focus-delivery/verify.mjs',1024]]){
 const result=await guarded({site,dir:root+'/checks/'+name,command,heap,aggregate:2048,minimum:4096,extraEnv:{VM_ATLAS_SOURCE_REPO:prep.native,ATLAS_SOURCE_REPO:prep.native,VM_CATALOG_DELIVERY_ATTEMPT:root,TEMP:root+'/tmp',TMP:root+'/tmp'}});
 fs.writeFileSync(root+'/'+name+'-RESULT.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});assert(result.passing,name+' failed; keep original evidence');
}
fs.writeFileSync(own+'/REVIEW_CHECKS_COMPLETE.json',JSON.stringify({at:new Date().toISOString(),source:prep.nativeHead,reviewBinding:binding.sha256,nativeTypes:true,nativeRuntime:true,matchingReviewBuild:true,focusedChecks:true,fullWebsiteTypes:false,fullWebsiteBuild:false,installed:false},null,2)+'\n',{flag:'wx'});
console.log('Matching Review build and focused website checks passed. Full website checks remain.');
