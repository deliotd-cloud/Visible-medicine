import fs from 'node:fs';
import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';

const input=json(process.argv[2]);
assert.equal(hash(input.plan.path),input.plan.sha256);
const plan=json(input.plan.path);
for(const row of plan.codeFiles)assert.equal(hash(row.path),row.sha256,row.path);
assert.equal(hash(plan.source.path),plan.source.sha256);
const step=plan.steps.find(row=>row.id===input.step);
assert(step);
assert.equal(input.evidence,input.attempt+'/evidence');
assert(input.attempt.startsWith(plan.root+'/attempts/'));
assert(!fs.existsSync(input.evidence));
const {guarded}=await import('file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/run-native-build-balanced-guarded-20261025.mjs');
const source=json(plan.source.path);
assert.equal(hash(source.historicalEnvironment.path),source.historicalEnvironment.sha256);
const environment={...json(source.historicalEnvironment.path).environment,
 VM_CURRENT_SOURCE_RECEIPT:plan.source.path,VM_CURRENT_SOURCE_SHA256:plan.source.sha256,
 VM_WEBSITE_ROOT:source.website,VM_ATLAS_SOURCE_REPO:source.atlas,ATLAS_SOURCE_REPO:source.atlas,
 VM_PUBLIC_PREVIEW_SOURCE_ROOT:source.website,TEMP:plan.root+'/tmp',TMP:plan.root+'/tmp'};
// Keep every original native-job, memory and process-overlap guard.
// A code-75 preflight exit terminates this child, never its coordinator.
const result=await guarded({site:source.website,dir:input.evidence,command:step.command,
 heap:1024,aggregate:2048,minimum:4096,extraEnv:environment});
fs.writeFileSync(input.attempt+'/GUARDED_RESULT.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
process.exitCode=result.passing?0:1;
