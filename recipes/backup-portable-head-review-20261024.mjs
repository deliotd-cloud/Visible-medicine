// Tiny filtered first-party source supplement, never raw canonical ancestry/QA.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
process.env.GCM_INTERACTIVE='Never';
const {read,json,sha,backup,runGit}=await import('./source-only-backup-20261019.mjs');
const stage='F:/VisibleMedicine/staging/20261024-head-review-portable-main-v2';
const prepFile=stage+'/PREPARATION.json',prepHash='b51c7ed2d3082fe26aed5bf1aa410eae130a9b979fa6ad23364b18381f54e77b';
const recovery='F:/VisibleMedicine/recovery/checkpoints/20261024-head-review-portable';
const remoteRoot=recovery+'-source-supplement';
assert.equal(sha(read(prepFile)),prepHash);const prep=json(prepFile),terminalFile=stage+'/checks/all-attempt-1/TERMINAL.json';
const selected=prep.files.filter(row=>row.path.startsWith('tests/fixtures/head-review-before-guided/')||[
 'tests/head-mri-comparison-page.test.ts','tests/head-guided-review-page-history.test.mjs',
 'tests/head-review-historical-source.mjs','tests/head-review-historical-source.test.mjs'].includes(row.path)).map(row=>({
  path:'pending/portable-head-review-20261024/website/'+row.path,source:prep.root+'/'+row.path,restore:'website/'+row.path,bytes:row.bytes,sha256:row.sha256}));
assert.equal(selected.length,22);
for(const file of ['source-only-backup-20261019.mjs','backup-portable-head-review-20261024.mjs','prepare-portable-head-review-20261024.mjs','run-portable-head-review-20261024.mjs','compose-portable-head-review-website-20261024.mjs']){
 const source=path.resolve(file),bytes=read(source);selected.push({path:'recipes/'+file,source,restore:'coordination/'+file,bytes:bytes.length,sha256:sha(bytes)});
}
const payload=selected.reduce((sum,row)=>sum+row.bytes,0);assert(payload<=192*1024,'Keep tiny selected-source profile; do not expand it');
const priorFile='F:/VisibleMedicine/recovery/checkpoints/20261024-head-studio-focused-source-supplement/github-backup.json';
assert.equal(sha(read(priorFile)),'c871fd0b8ef91f2fe1b1f4b10dd19aaa294556865f44d781bf5f06339cc60975');
const prior=json(priorFile),base=prior.sourceIdentity.requiredBase;
const dependencies=[base,prior.sourceIdentity.requiredSupplement,{branch:prior.branch,head:prior.head,tree:prior.tree,receiptSha256:sha(read(priorFile))}];
function verify(){
 assert.equal(sha(read(prepFile)),prepHash);const terminal=json(terminalFile);assert.equal(terminal.passing,true);assert.equal(terminal.counts.tests,45);assert.equal(terminal.counts.pass,45);assert.equal(terminal.counts.skipped,0);assert.deepEqual(terminal.sourceDrift,[]);
 for(const row of selected){const bytes=read(row.source);assert.equal(bytes.length,row.bytes);assert.equal(sha(bytes),row.sha256);assert(!bytes.includes(0));new TextDecoder('utf-8',{fatal:true}).decode(bytes);}
 const index=json('CURRENT_CHECKPOINT.json');assert.equal(index.goal.status,'active');assert.equal(index.goal.requirements,71);assert.equal(index.goal.optionalIdeas,8);assert.equal(index.activeWork.current.ownerPreviewPolicy.restartPermitted,false);
}
verify();assert(!fs.existsSync(remoteRoot),'Inspect a prior/uncertain outcome; never blindly push again');
const memory=JSON.parse(execFileSync('powershell',['-NoProfile','-NonInteractive','-Command','Get-CimInstance Win32_PerfFormattedData_PerfOS_Memory | Select-Object AvailableMBytes,PercentCommittedBytesInUse | ConvertTo-Json -Compress'],{encoding:'utf8',windowsHide:true}));
const admitted=memory.AvailableMBytes>=512&&memory.PercentCommittedBytesInUse<=90;
fs.mkdirSync(recovery,{recursive:true});const admission=recovery+'/SOURCE_ADMISSION_'+new Date().toISOString().replace(/[:.]/g,'-')+'.json';
fs.writeFileSync(admission,JSON.stringify({at:new Date().toISOString(),memory,admitted,minimumMiB:512,maximumSelectedBytes:192*1024,payload,paths:selected.length},null,2)+'\n',{flag:'wx'});
if(!admitted){console.log(JSON.stringify({started:false,admission,memory}));process.exitCode=75;}else{
 for(const item of dependencies)assert.equal(runGit(['ls-remote',prior.repository,'refs/heads/'+item.branch]).toString().trim(),item.head+'\trefs/heads/'+item.branch);
 const sources=new Map(selected.map(row=>[row.path,row.source]));
 const result=backup({root:remoteRoot,repo:'F:/VisibleMedicine/history/website-work/github-portable-head-review-20261024.git',branch:'backup/portable-head-review-20261024',parent:null,carryParent:false,
  files:selected.map(({path,bytes,sha256})=>({path,bytes,sha256})),bytesFor:file=>read(sources.get(file)),verifySource:verify,
  sourceIdentity:{kind:'selected-portable-test-package-and-recipes-not-cumulative',websiteParentPreparationSha256:'1cbbdc7afc84674eef4288504865fa08e6e40570c0c39b379c201e4a52ac285b',
   fixtureManifestSha256:'c6880b41ec988457d6113cca19d52f4948a404e1334ef03f034a6758b8d9896e',requiredBase:base,requiredSupplements:dependencies.slice(1),restorePaths:selected.map(({path,restore})=>({path,restore}))},
  scope:'22explicit first-party historical test/page/pure source fixtures, controllers/helper/integrity controls plus5recipes. Frozen source/teaching definitions only, no models, images, scans, masks, private references, identifiers, packages, raw QA or clinical decisions. This selected incremental source supplement requires the exact stated earlier base/supplements and an existing locked Website test environment. Not a cumulative, whole/private or runnable Website backup; no earlier unique source removed. No deployment or clinical/spatial approval.',
  proof:{reportedTestsPassed:45,distinctHistoricalScenarios:14,historicalCollectorEntryPoints:2,currentScenarios:13,integrityControls:4,skipped:0,sourceDrift:[],
   sourceOnly:true,originalTestSha256:'4ec8991cd826c4b614b780607b74584c4bd8bec2544782c02c31944c79351363',rawQaUploaded:false,selectedBytes:payload,memoryAtStart:memory,previewChanged:false,installed:false,clinicalApproval:false,spatialRegistration:false}});
 const pointer={at:new Date().toISOString(),receipt:remoteRoot+'/github-backup.json',sha256:sha(read(remoteRoot+'/github-backup.json')),head:result.head,tree:result.tree,sourcePaths:result.sourcePaths,restoredPaths:result.restoredPaths,selectedBytes:payload,
  requiredBase:base,requiredSupplements:dependencies.slice(1),cumulative:false,wholePrivateOrRunnableWebsiteBackup:false};
 fs.writeFileSync(recovery+'/SOURCE_SUPPLEMENT.json',JSON.stringify(pointer,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({pointer:recovery+'/SOURCE_SUPPLEMENT.json',sha256:sha(read(recovery+'/SOURCE_SUPPLEMENT.json')),head:result.head,tree:result.tree,selected:result.sourcePaths,restored:result.restoredPaths,bytes:payload}));
}
