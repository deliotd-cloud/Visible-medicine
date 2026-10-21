import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const site='F:/VisibleMedicine/website',stage='F:/VisibleMedicine/staging/20261021-checklist-import-state';
const prior=json('F:/VisibleMedicine/staging/20261021-elbow-history-application/SOURCE_INPUTS_AFTER.json');
const changed='scripts/refresh-completion-checklist.mjs',added='tests/completion-checklist-local-import.test.mjs';
const before=json(stage+'/completion-checklist.before.json'),now=json(site+'/docs/completion-checklist.json');
assert.deepEqual(now.items,before.items);assert.deepEqual(now.baseline,before.baseline);assert.equal(now.items.length,71);assert.equal(now.items.filter(r=>r.scope==='optional').length,8);assert.equal(now.revision,104);
// First native.log retained: all50 pass; the controller expected TAP although Node selected spec.
const commands=[['native-final',['--test','--test-reporter=tap','--test-concurrency=1','tests/completion-checklist-local-import.test.mjs','tests/completion-checklist.test.mjs']],['regenerate',['scripts/refresh-completion-checklist.mjs']],['physical-check',['scripts/refresh-completion-checklist.mjs','--check','--verify-evidence']]];
const receipts=[];
for(const[label,args]of commands){const result=spawnSync(process.execPath,args,{cwd:site,windowsHide:true,encoding:'utf8',maxBuffer:4e6}),output=result.stdout+result.stderr,log=stage+'/'+label+'.log';fs.writeFileSync(log,output,{flag:'wx'});receipts.push({label,args,code:result.status,signal:result.signal,log,logSha256:sha(read(log))});assert.equal(result.status,0,label);if(label==='native-final'){assert.match(output,/# tests 50\r?\n/);assert.match(output,/# pass 50\r?\n/);assert.match(output,/# fail 0\r?\n/);assert.match(output,/# skipped 0\r?\n/);}}
const inputs=new Map(prior.map(r=>[r.path,r]));assert.equal(inputs.size,5150);assert(!inputs.has(added));
for(const r of prior)if(r.path!==changed)assert.equal(sha(read(site+'/'+r.path)),r.sha256,r.path);
for(const p of [changed,added]){const bytes=read(site+'/'+p);inputs.set(p,{path:p,bytes:bytes.length,sha256:sha(bytes)});}
assert.equal(inputs.size,5151);const bound=json(site+'/atlas-review/integration-inputs.json');assert.equal(bound.inputs.length,1710);for(const r of bound.inputs)assert.equal(sha(read(site+'/'+r.path)),r.sha256,r.path);
process.kill(266712,0);fs.writeFileSync(stage+'/SOURCE_INPUTS_AFTER.json',JSON.stringify([...inputs.values()].sort((a,b)=>a.path.localeCompare(b.path)),null,2)+'\n',{flag:'wx'});
const proof={at:new Date().toISOString(),source:'190a63238eadcf906abe89dcbb6a67c88afe70b9',review:bound.sha256,canonicalInstalled:true,paths:[changed,added],sourceSnapshot:stage+'/SOURCE_INPUTS_AFTER.json',sourceSnapshotSha256:sha(read(stage+'/SOURCE_INPUTS_AFTER.json')),controlledInputs:5151,preservedSourceInputs:7,totalNamedInputs:5158,actualCases:50,failures:0,skipped:0,receipts,all71ItemsAndEightIdeasUnchanged:true,completeAuditBaselineUnchanged:true,allOtherControlledSourcesUnchanged:true,reviewBindingsUnchanged:1710,previewPid:266712,previewRestarted:false,fullSuitePassingClaim:false,clinicalApproval:false,publicDeployment:false,latestTwoPathsOffDeviceBackedUp:false};
fs.writeFileSync(stage+'/APPLICATION.json',JSON.stringify(proof,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(proof));
