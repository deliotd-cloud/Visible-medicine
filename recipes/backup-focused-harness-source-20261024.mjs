// Explicit small first-party text supplement; never canonical Git ancestry or private QA.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {read,json,sha,backup,runGit} from './source-only-backup-20261019.mjs';
const recovery='F:/VisibleMedicine/recovery/checkpoints/20261024-head-studio-focused';
const remoteRoot=recovery+'-source-supplement';
const cps=[
 ['F:/VisibleMedicine/recovery/checkpoints/20261024-returned-harness-main-review/checkpoint.json','f3c78255ae9aa2ec10bb952f22f1789b339a0a576e5e8380a7e1816de5aec22b'],
 [recovery+'/checkpoint.json','b31b781dc7d81281c51d3d7fbec9f0639e79235693ee71cd9b9d18dc22d48800'],
];
const priorFile='F:/VisibleMedicine/recovery/checkpoints/20261024-review-harness-preparation-source-supplement/github-backup.json';
assert.equal(sha(read(priorFile)),'921b507be13b204084ffb0422e587de5330e80b2c6312ccfdedaa690a4610705');
const prior=json(priorFile),base=prior.sourceIdentity.requiredBase;
const selected=cps.flatMap(([file,hash])=>{
 assert.equal(sha(read(file)),hash);
 return json(file).records.filter(row=>/^source\/(binder|studio|current)\//.test(row.path)).map(row=>({path:'pending/focused-harness-20261024/'+row.path.slice('source/'.length),source:path.join(path.dirname(file),row.path),restore:row.from,bytes:row.bytes,sha256:row.sha256}));
});
const recipes=['source-test-overlay-20261024.mjs','run-head-source-overlay-20261024.mjs','run-returned-harness-mirror-20261024.mjs','verify-returned-harnesses-20261024.mjs','verify-membership-harness-20261024.mjs','verify-guided-copy-epoch-20261024.mjs','source-only-backup-20261019.mjs','backup-focused-harness-source-20261024.mjs'];
for(const file of recipes){const source=path.resolve(file),bytes=read(source);selected.push({path:'recipes/'+file,source,restore:source,bytes:bytes.length,sha256:sha(bytes)});}
assert.equal(selected.length,22);assert.equal(new Set(selected.map(row=>row.path)).size,selected.length);
const payload=selected.reduce((n,row)=>n+row.bytes,0);assert.ok(payload<=192*1024,'do not enlarge the existing tiny-payload profile');
function verify(){
 for(const [file,hash]of cps)assert.equal(sha(read(file)),hash);
 for(const row of selected){const bytes=read(row.source);assert.equal(bytes.length,row.bytes);assert.equal(sha(bytes),row.sha256,row.path);}
 const index=json('CURRENT_CHECKPOINT.json');assert.equal(index.goal.status,'active');assert.equal(index.goal.requirements,71);assert.equal(index.goal.optionalIdeas,8);assert.equal(index.activeWork.current.ownerPreviewPolicy.restartPermitted,false);
 assert.equal(json(recovery+'/checks/v4/TERMINAL.json').passing,true);
}
verify();assert.ok(!fs.existsSync(remoteRoot),'inspect existing outcome, do not repeat an uncertain push');
const memory=JSON.parse(execFileSync('powershell',['-NoProfile','-Command','Get-CimInstance Win32_PerfFormattedData_PerfOS_Memory | Select-Object AvailableMBytes,PercentCommittedBytesInUse | ConvertTo-Json -Compress'],{encoding:'utf8',windowsHide:true}));
const admitted=Number.isFinite(memory.AvailableMBytes)&&memory.AvailableMBytes>=512&&Number.isFinite(memory.PercentCommittedBytesInUse)&&memory.PercentCommittedBytesInUse<=90;
const admissionFolder=recovery+'/backup-admissions';fs.mkdirSync(admissionFolder,{recursive:true});const admission=admissionFolder+'/'+new Date().toISOString().replace(/[:.]/g,'-')+'.json';fs.writeFileSync(admission,JSON.stringify({memory,admitted,minimumMiB:512,maximumSelectedBytes:192*1024,selectedBytes:payload,selectedPaths:selected.length},null,2)+'\n',{flag:'wx'});
if(!admitted){console.log(JSON.stringify({started:false,admission,memory}));process.exitCode=2;}else{
 const requiredSupplement={branch:prior.branch,head:prior.head,tree:prior.tree,receiptSha256:sha(read(priorFile))};
 for(const dependency of [base,requiredSupplement])assert.equal(runGit(['ls-remote',prior.repository,'refs/heads/'+dependency.branch]).toString().trim(),dependency.head+'\trefs/heads/'+dependency.branch);
 const sources=new Map(selected.map(row=>[row.path,row.source]));
 const result=backup({root:remoteRoot,repo:'F:/VisibleMedicine/history/website-work/github-head-studio-focused-20261024.git',branch:'backup/head-studio-focused-20261024',parent:null,carryParent:false,files:selected.map(({path,bytes,sha256})=>({path,bytes,sha256})),bytesFor:file=>read(sources.get(file)),verifySource:verify,
  sourceIdentity:{kind:'incremental-selected-text-supplement-not-cumulative',websiteSourceSha256:'cf587b88877f0a51b082e1ac039792938ccd6f0a6272a958669651a651b22a8e',requiredBase:base,requiredSupplement,localCheckpoints:cps.map(([path,sha256])=>({path,sha256})),restorePaths:selected.map(({path,restore})=>({path,restore}))},
  scope:'22explicit first-party text test/helper/JSON provenance fixture and recipe files only, <=192KiB. Requires the exact earlier filtered base and Review-harness supplement; no earlier unique source removed. Not a cumulative, whole/private or runnable backup. No scans, masks, models, actual private references, identifiers, licence addenda, dependencies, raw QA, local decision records or later coordination uploaded. One source-bound guided copy assertion is corrected without a product or navigation change. No deployment or clinical approval.',
  proof:{focusedDistinctCasesPassed:66,sourceControlsPassed:9,focusedSkipped:0,fullStockReleaseStillFailing:true,sourceOnly:true,rawQaUploaded:false,selectedBytes:payload,memoryAtStart:memory,previewChanged:false,installed:false,clinicalApproval:false,patientSpaceRegistration:false}});
 const pointer={at:new Date().toISOString(),receipt:remoteRoot+'/github-backup.json',sha256:sha(read(remoteRoot+'/github-backup.json')),head:result.head,tree:result.tree,sourcePaths:result.sourcePaths,restoredPaths:result.restoredPaths,selectedBytes:payload,requiredBase:base,requiredSupplement,cumulative:false,wholePrivateOrRunnableBackup:false};
 fs.writeFileSync(recovery+'/SOURCE_SUPPLEMENT.json',JSON.stringify(pointer,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({supplement:recovery+'/SOURCE_SUPPLEMENT.json',sha256:sha(read(recovery+'/SOURCE_SUPPLEMENT.json')),head:result.head,tree:result.tree,selected:result.sourcePaths,restored:result.restoredPaths,bytes:payload}));
}
