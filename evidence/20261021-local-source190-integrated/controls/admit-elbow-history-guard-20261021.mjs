import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const site='F:/VisibleMedicine/website',proposal='F:/VisibleMedicine/staging/20261021-elbow-history-guard-proposal';
const stage='F:/VisibleMedicine/staging/20261021-elbow-history-application',e=json(proposal+'/STAGING_EVIDENCE.json');
const cutover='F:/VisibleMedicine/recovery/local-cutover/20261021-source190-prepared';
const installed=json(cutover+'/INSTALLATION.json'),plan=json(json(cutover+'/PREPARED.json').planFile);
assert(installed.applied);assert.equal(installed.review,'34c11463b3ae1ff1d603f3cf48dd86fa3f29f3bd34663d7200612d2fccb4e78f');
assert.equal(runGit(['-C',installed.atlas,'rev-parse','HEAD']).toString().trim(),installed.sourceAtlas);
assert.equal(sha(read(site+'/tests/clinical-review-elbow-arterial-tour.test.ts')),e.currentElbowTestSha256);
const changes=[{path:e.applyPaths[0],beforeSha256:e.guardPreSha256,sha256:e.guardPostSha256},{path:e.applyPaths[1],beforeSha256:null,sha256:e.priorCurrentFixtureSha256},{path:e.applyPaths[2],beforeSha256:null,sha256:e.deltaSha256}];
for(const r of changes)assert.equal(sha(read(proposal+'/'+r.path)),r.sha256,r.path);
const bound=json(site+'/atlas-review/integration-inputs.json');assert.equal(bound.sha256,installed.review);assert.equal(bound.inputs.length,1710);for(const r of bound.inputs)assert.equal(sha(read(site+'/'+r.path)),r.sha256,r.path);
for(const r of changes)assert(!bound.inputs.some(input=>input.path===r.path));
const native=(label,expected)=>{
 const args=['--test','--test-reporter=spec','tests/elbow-current-lifecycle-preservation.test.mjs'];
 const r=spawnSync(process.execPath,args,{cwd:site,windowsHide:true,env:{...process.env,VM_ATLAS_SOURCE_REPO:installed.atlas},encoding:'utf8',maxBuffer:3e6});
 const output=r.stdout+r.stderr,log=stage+'/'+label+'.log';fs.writeFileSync(log,output,{flag:'wx'});
 const footer=output.split(/\r?\n/).filter(l=>/^[ℹ#] (?:tests|pass|fail|cancelled|skipped|todo) \d+$/.test(l));
 const receipt={at:new Date().toISOString(),args,code:r.status,signal:r.signal,log,logSha256:sha(read(log)),footer,guardSha256:sha(read(site+'/'+changes[0].path)),actualElbowTestSha256:e.currentElbowTestSha256,canonicalInstalled:true,fullSuitePassingClaim:false};
 fs.writeFileSync(stage+'/'+label+'.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
 assert.equal(r.status,expected);assert(footer.includes('ℹ tests 1'));assert(footer.includes('ℹ skipped 0'));assert(footer.includes('ℹ cancelled 0'));
 if(expected===1)assert(output.includes('Exact whole-file inverse restores previous current test'),'The retained first failure must be the known stale historical inverse');
 else {assert(footer.includes('ℹ pass 1'));assert(footer.includes('ℹ fail 0'));}
 return receipt;
};
if(process.argv[2]==='prepare'){
 assert(!fs.existsSync(stage));
 for(const r of changes)if(r.beforeSha256)assert.equal(sha(read(site+'/'+r.path)),r.beforeSha256);else assert(!fs.existsSync(site+'/'+r.path));
 fs.mkdirSync(stage);
 const preserved=new Set(plan.preservedNamedPaths),rows=plan.rows.filter(r=>!preserved.has(r.path)).map(r=>({path:r.path,bytes:read(site+'/'+r.path).length,sha256:sha(read(site+'/'+r.path))}));assert.equal(rows.length,5148);
 fs.writeFileSync(stage+'/SOURCE_INPUTS_BEFORE.json',JSON.stringify(rows,null,2)+'\n',{flag:'wx'});
 for(const r of changes.filter(r=>r.beforeSha256)){const target=stage+'/preimages/'+r.path;fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,read(site+'/'+r.path),{flag:'wx'});}
 const first=native('FIRST_NATIVE_FAILED',1);
 fs.writeFileSync(stage+'/PREPARATION.json',JSON.stringify({at:new Date().toISOString(),site,proposal,source:installed.sourceAtlas,review:installed.review,changes,preservedPaths:[...preserved],beforeControlledInputs:5148,afterControlledInputs:5150,afterNamedInputsIncludingPreserved:5157,firstFailure:first,ownerPreviewPid:json(cutover+'/PREVIEW_STARTED.json').pid},null,2)+'\n',{flag:'wx'});
 const patch=['*** Begin Patch'];for(const r of changes){const target=site+'/'+r.path,next=read(proposal+'/'+r.path).toString().replaceAll('\r\n','\n').trimEnd();if(r.beforeSha256)patch.push('*** Update File: '+target,'@@',...read(target).toString().replaceAll('\r\n','\n').trimEnd().split('\n').map(l=>'-'+l),...next.split('\n').map(l=>'+'+l));else patch.push('*** Add File: '+target,...next.split('\n').map(l=>'+'+l));}patch.push('*** End Patch');console.log(patch.join('\n'));
}else{
 assert.equal(process.argv[2],'finish');const prep=json(stage+'/PREPARATION.json'),inputs=new Map(json(stage+'/SOURCE_INPUTS_BEFORE.json').map(r=>[r.path,r]));
 for(const r of changes){const target=site+'/'+r.path,expected=read(proposal+'/'+r.path).toString(),actual=read(target).toString(),normal=t=>t.replaceAll('\r\n','\n');assert.equal(normal(actual),normal(expected),'Only mechanical EOL restoration after patch');const endings=expected.match(/\r?\n/g)??[],lines=normal(actual).split('\n');assert.equal(lines.pop(),'');assert.equal(lines.length,endings.length);const bytes=Buffer.from(lines.map((line,i)=>line+endings[i]).join(''));assert.equal(sha(bytes),r.sha256);if(sha(read(target))!==r.sha256)fs.writeFileSync(target,bytes);inputs.set(r.path,{path:r.path,bytes:bytes.length,sha256:r.sha256});}
 assert.equal(inputs.size,5150);for(const r of inputs.values())assert.equal(sha(read(site+'/'+r.path)),r.sha256,r.path);
 const result=native('ACTUAL_NATIVE_PASSED',0);for(const r of inputs.values())assert.equal(sha(read(site+'/'+r.path)),r.sha256,r.path);
 for(const r of bound.inputs)assert.equal(sha(read(site+'/'+r.path)),r.sha256,r.path);process.kill(prep.ownerPreviewPid,0);
 fs.writeFileSync(stage+'/SOURCE_INPUTS_AFTER.json',JSON.stringify([...inputs.values()].sort((a,b)=>a.path.localeCompare(b.path)),null,2)+'\n',{flag:'wx'});
 const applied={at:new Date().toISOString(),source:installed.sourceAtlas,review:installed.review,paths:3,controlledInputs:5150,preservedCoordinationAndLicensePaths:7,totalNamedInputs:5157,sourceSnapshot:stage+'/SOURCE_INPUTS_AFTER.json',sourceSnapshotSha256:sha(read(stage+'/SOURCE_INPUTS_AFTER.json')),actualNative:result,firstFailureRetained:true,wholeHistoricalBeforeCurrentSha256:e.historicalBeforeCurrentSha256,wholeOriginalSha256:e.canonicalOriginalFixtureSha256,allOtherControlledSourcesUnchanged:true,reviewBindingsUnchanged:1710,canonicalInstalled:true,ownerPreviewRestartedForTestOnlyChange:false,clinicalApproval:false,fullSuitePassingClaim:false};
 fs.writeFileSync(stage+'/APPLICATION.json',JSON.stringify(applied,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(applied));
}
