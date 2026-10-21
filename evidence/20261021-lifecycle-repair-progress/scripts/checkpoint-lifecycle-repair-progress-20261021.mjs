// Filtered, independently read-back source checkpoint; never copies private imports.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {backup,read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const base='F:/VisibleMedicine/staging/20261021-';
const root='F:/VisibleMedicine/recovery/checkpoints/20261021-lifecycle-repair-progress-v2';
const applied=['current-contract-application','clinical-retry','spinal-save-application'];
const spine=base+'spinal-save-application',prep=json(spine+'/PREPARATION.json');
const inputs=json(spine+'/source-inputs-after.json');assert.equal(inputs.length,5083);
const runs=applied.map(name=>{
 const folder=base+name,label=name==='current-contract-application'?'ACTUAL_CURRENT_CONTRACTS':name==='clinical-retry'?'ACTUAL_CLINICAL_REPAIRS':'ACTUAL_SPINAL_SAVE';
 const start=json(folder+'/STARTED.json'),resultPath=folder+'/RESULT.json';
 const result=fs.existsSync(resultPath)?json(resultPath):null;
 return {name,folder,label,start,result};
});
assert(runs[0].result&&runs[1].result,'previous two jobs must be terminal');
for(const run of runs)if(run.result){
 assert.equal(run.result.signal,null);assert.equal(run.result.inputDrift,false);
 const receipt=json(run.folder+'/'+run.label+'.json');
 assert.equal(sha(read(receipt.log)),receipt.logSha256);
 assert.equal(sha(read(run.folder+'/'+run.label+'.json')),run.result.receiptSha256);
}
const queue=json(base+'after-suite-dental/state.json');assert(queue.actualFullDentalGatePass);
assert.equal(queue.currentSourcePaths.length,21);
const current=new Map();for(const run of runs)for(const row of run.start.files)current.set(row.path,row);
const verify=()=>{
 for(const row of inputs)assert.equal(sha(read(prep.site+'/'+row.path)),row.sha256,row.path+' current stable input');
 for(const row of current.values())assert.equal(sha(read(prep.site+'/'+row.path)),row.sha256,row.path+' admitted postimage');
 for(const row of queue.currentSourcePaths)assert.equal(sha(read(queue.target+'/'+row.path)),row.sha256,row.path+' combined source');
 assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),'98d7f17e2d120b031633e59e47fc50c82d44b2d0');
 assert.equal(runGit(['-C','F:/VisibleMedicine/website','rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
};verify();assert(!fs.existsSync(root));fs.mkdirSync(root);
const selected=[],local=[];
const copy=(from,relative,remote=true)=>{
 const bytes=read(from),to=root+'/'+relative;fs.mkdirSync(path.dirname(to),{recursive:true});fs.writeFileSync(to,bytes,{flag:'wx'});
 const row={path:relative,bytes:bytes.length,sha256:sha(bytes)};assert.equal(sha(read(to)),row.sha256);(remote?selected:local).push(row);
};
for(const row of current.values())copy(prep.site+'/'+row.path,'website/'+row.path);
for(const run of runs){
 for(const row of run.start.files)if(row.beforeSha256)copy(run.folder+'/originals/'+row.path,'preimages/'+run.name+'/'+row.path);
 copy(run.folder+'/STARTED.json','evidence/'+run.name+'/STARTED.json');
 if(run.result)for(const name of ['RESULT.json',run.label+'.json'])copy(run.folder+'/'+name,'evidence/'+run.name+'/'+name);
}
for(const row of queue.currentSourcePaths)copy(queue.target+'/'+row.path,'atlas/'+row.path);
for(const step of queue.steps)copy(step.receipt,'evidence/dental/'+step.label+'.json');
copy(base+'atlas-source-assembly/QUEUED_DENTAL_FULL_TRANSITION.log','evidence/dental/actual-transition-summary.log');
for(const name of ['admit-clinical-assurance-candidate-20261021.mjs','run-admitted-clinical-tests-20261021.mjs','admit-and-test-coverage-contracts-20261021.mjs','admit-and-test-clinical-repairs-20261021.mjs','prepare-hepatic-proof-import-fix-20261021.mjs','admit-and-test-spinal-save-20261021.mjs','checkpoint-lifecycle-repair-progress-20261021.mjs'])copy(name,'scripts/'+name);
for(const [folder,names] of [['elbow-forearm-tour-epoch-repair',['HANDOFF.md']],['salivary-later-ct-repair',['HANDOFF.md','FILES.md']],['hepatic-xray-contract-proposal',['HANDOFF.md','FILES.md']],['spinal-ct-save-refusal-proposal',['HANDOFF.md','FILES.md']]])for(const name of names)copy(base+folder+'/'+name,'evidence/'+folder+'/'+name);
copy('F:/VisibleMedicine/recovery/checkpoints/20261021-lifecycle-repair-progress/FAILURE.md','evidence/backup-preparation-correction.md');
copy(base+'website-terminal-triage/HANDOFF.md','evidence/terminal-full-suite-classification.md');
copy(spine+'/source-inputs-after.json','local/source-inputs-after.json',false);
copy(base+'after-suite-dental/state.json','local/dental-state.json',false);
const summary={at:new Date().toISOString(),scope:'Reviewed test lifecycle repairs and actual assembled Atlas source; installed owner preview unchanged.',
 namedWebsiteInputs:5083,websitePaths:[...current.values()],atlasSource:queue.source,atlasUncommittedPaths:queue.currentSourcePaths,
 originalFullSuite:{tests:5502,pass:5355,fail:144,skip:3,inputDrift:false,passingClaim:false},
 actualRuns:runs.map(run=>({name:run.name,result:run.result,started:run.start,terminal:run.result!==null})),
 dental:queue.actualFullTheorem,actualFullDentalGatePass:true,
 limitations:'Forearm/hepatic/salivary real modules pass in15case retry but elbow whole-current packet still observes genuine later X-ray changes;14/15 is not a full pass. Coverage4/4 and arterial6/6 pass; spinal display-only failure moved to real save boundary and its actual result is separately recorded. Original full144failure inventory remains; no inferred full-suite/clinical/spatial/install acceptance. Tour/history, quiz, private-storage and malformed/refusal checks retained. New worker grouped-harness/elbow-later-X-ray proposals excluded until main-reviewed. Full source21 is uncommitted, no introduction identity predicted.',
 next:'Finish actual spinal result and exact elbow later-X-ray lifecycle proof; independently verify grouped-confirmation test harness fixes. Then actual combined-source hip/player/types/build/export/Review/Website/browser gates and genuine source introduction replay. No refresh of owner review tabs.',
 canonicalInstalled:false,fullWebsiteSuitePass:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false,fullGoalActive:true};
fs.writeFileSync(root+'/MAIN_REVIEW.json',JSON.stringify(summary,null,2)+'\n',{flag:'wx'});copy(root+'/MAIN_REVIEW.json','evidence/MAIN_REVIEW.json');
const parentRoot='F:/VisibleMedicine/recovery/checkpoints/20261021-clinical-assurance-ready-backup',parent=json(parentRoot+'/github-backup.json');
assert(parent.sourceBackupVerified);assert.equal(parent.head,'810c3488cf8aed7871ce0af328944b3689763a16');
const old=json(parentRoot+'/remote-source-restored/.source-backup/manifest.json');
const values=new Map(old.files.map(row=>{const bytes=read(parentRoot+'/remote-source-restored/'+row.path);assert.equal(sha(bytes),row.sha256);return[row.path,bytes];}));
for(const row of selected)values.set('evidence/20261021-lifecycle-repair-progress/'+row.path,read(root+'/'+row.path));
const backupRoot=root+'-backup';
backup({root:backupRoot,repo:'F:/VisibleMedicine/history/website-work/github-lifecycle-repair-progress-20261021.git',branch:'backup/lifecycle-repair-progress-20261021',
 files:[...values].map(([path,bytes])=>({path,bytes:bytes.length,sha256:sha(bytes)})).sort((a,b)=>a.path.localeCompare(b.path)),bytesFor:p=>values.get(p),verifySource:verify,
 sourceIdentity:{atlasBase:queue.source,namedWebsiteInputs:5083,canonicalInstalled:false},parent:parent.head,parentTree:parent.tree,parentRepo:parentRoot+'/independent-readback.git',
 proof:{actualRuns:summary.actualRuns.map(run=>({name:run.name,result:run.result,terminal:run.terminal})),actualFullDentalGatePass:true,canonicalInstalled:false,clinicalApproval:false},
 scope:'Selected admitted Website test postimages/exact preimages,21assembled Atlas code/evidence/pin paths, concise actual receipts and main-controlled scripts on previous filtered source-only ancestry. No whole private imports/inbox/patient scans/masks/models/dependencies/raw canonical Git ancestry/browser pixels or DOM/long failed source-dump logs. Source-input/process/coordination snapshots stay local. Not a complete runnable/private-data backup or clinical release.'});
const remote=json(backupRoot+'/github-backup.json');
fs.writeFileSync(root+'/checkpoint.json',JSON.stringify({...summary,selectedFiles:selected,localFiles:local,backup:{receipt:backupRoot+'/github-backup.json',receiptSha256:sha(read(backupRoot+'/github-backup.json')),head:remote.head,tree:remote.tree,restoredPaths:remote.restoredPaths}},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({checkpoint:root+'/checkpoint.json',sha256:sha(read(root+'/checkpoint.json')),selectedNewPaths:selected.length,backup:remote.head,tree:remote.tree,restoredPaths:remote.restoredPaths}));
