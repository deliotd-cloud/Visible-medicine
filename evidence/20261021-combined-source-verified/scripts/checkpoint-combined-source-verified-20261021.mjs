import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {backup,read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const base='F:/VisibleMedicine/staging/20261021-',stage=base+'generated-source-closure';
const root='F:/VisibleMedicine/recovery/checkpoints/20261021-combined-source-verified';
const generated=json(stage+'/RESULT.json');assert.equal(generated.passed,true);
const retry=base+'review-final-retry',current=json(retry+'/RESULT.json');assert.equal(current.code,0);assert.equal(current.signal,null);assert.equal(current.inputDrift,false);
const prep=json(retry+'/PREPARATION.json'),inputs=json(retry+'/source-inputs-after.json');assert.equal(inputs.length,5084);
const source=base+'atlas-combined-source',baseCommit='485df97c2530e8e81a8d39a5ee61073ce76d93db';
const sourcePaths=runGit(['-C',source,'diff','--name-only',baseCommit,generated.commit]).toString().trim().split(/\r?\n/).sort();assert.equal(sourcePaths.length,22);
const sourceFiles=sourcePaths.map(p=>({path:p,bytes:read(source+'/'+p).length,sha256:sha(read(source+'/'+p))}));
const applied=['review-harness-and-elbow-application','review-final-retry'];
const finalFiles=new Map();for(const folder of applied)for(const row of json(base+folder+'/STARTED.json').files)finalFiles.set(row.path,row);
const verify=()=>{
 for(const row of inputs)assert.equal(sha(read(prep.site+'/'+row.path)),row.sha256,row.path+' current Website test input');
 for(const row of sourceFiles)assert.equal(sha(read(source+'/'+row.path)),row.sha256,row.path+' current source');
 assert.equal(runGit(['-C',source,'rev-parse','HEAD']).toString().trim(),generated.commit);
 assert.equal(runGit(['-C',source,'rev-parse','HEAD^{tree}']).toString().trim(),generated.tree);
 assert.equal(runGit(['-C',source,'status','--porcelain=v1','--untracked-files=all']).toString().trim(),'');
 assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),'98d7f17e2d120b031633e59e47fc50c82d44b2d0');
 assert.equal(runGit(['-C','F:/VisibleMedicine/website','rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
};verify();assert(!fs.existsSync(root));fs.mkdirSync(root);
const selected=[],local=[];
const copy=(from,relative,remote=true)=>{const bytes=read(from),to=root+'/'+relative;fs.mkdirSync(path.dirname(to),{recursive:true});fs.writeFileSync(to,bytes,{flag:'wx'});assert.equal(sha(read(to)),sha(bytes));(remote?selected:local).push({path:relative,bytes:bytes.length,sha256:sha(bytes)});};
for(const row of finalFiles.values())copy(prep.site+'/'+row.path,'website/'+row.path);
for(const folder of applied){
 for(const row of json(base+folder+'/STARTED.json').files)if(row.beforeSha256)copy(base+folder+'/originals/'+row.path,'preimages/'+folder+'/'+row.path);
 for(const name of ['STARTED.json','RESULT.json'])copy(base+folder+'/'+name,'evidence/'+folder+'/'+name);
}
copy(base+'review-harness-and-elbow-application/INVERSE.json','evidence/head-harness-inverse.json');
for(const row of sourceFiles)copy(source+'/'+row.path,'atlas/'+row.path);
for(const p of ['content/regional-teaching/head-neck.json','content/body-renderer-revision.json'])copy(stage+'/originals/'+p,'preimages/generated/'+p);
for(const name of ['COMMITTED.json','RESULT.json','SNAPSHOT_INVERSE.json'])copy(stage+'/'+name,'evidence/generated/'+name);
for(const name of ['PRE_COMMIT.json','COMMITTED.json','RESULT.json'])copy(base+'committed-source-admission/'+name,'evidence/source-introduction/'+name);
const checks=[
 ['atlas-source-assembly','ACTUAL_COMBINED_HIP'],['atlas-source-assembly','ACTUAL_COMBINED_TOUR_PLAYER'],['atlas-source-assembly','ACTUAL_COMBINED_TYPES'],
 ['spinal-save-application','ACTUAL_SPINAL_SAVE'],['review-harness-and-elbow-application','ACTUAL_REVIEW_REPAIRS'],['review-final-retry','ACTUAL_FINAL_REVIEW_RETRY'],
 ['committed-source-admission','ACTUAL_COMMITTED_DENTAL'],['committed-source-admission','ACTUAL_COMMITTED_REGIONAL_BUILD'],
 ['generated-source-closure','GENERATE_REGIONAL_SNAPSHOTS'],['generated-source-closure','CHECK_REGIONAL_SNAPSHOTS'],['generated-source-closure','GENERATE_RENDERER_BINDING'],
 ['generated-source-closure','CHECK_RENDERER_BINDING'],['generated-source-closure','CHECK_DISPLAY_PINS'],['generated-source-closure','ACTUAL_GENERATED_COMMITTED_DENTAL'],['generated-source-closure','ACTUAL_GENERATED_REGIONAL_BUILD'],
];
const receipts=checks.map(([folder,label])=>{const from=base+folder+'/'+label+'.json',receipt=json(from);assert.equal(receipt.signal,null);assert.equal(sha(read(receipt.log)),receipt.logSha256);copy(from,'evidence/receipts/'+label+'.json');return{folder,label,code:receipt.code,logSha256:receipt.logSha256,receiptSha256:sha(read(from)),footer:receipt.footer};});
for(const folder of ['head-review-grouped-harness','elbow-later-xray-repair','elbow-playback-packet-repair'])copy(base+folder+'/HANDOFF.md','evidence/'+folder+'/HANDOFF.md');
for(const name of ['admit-and-test-head-review-harness-20261021.mjs','admit-and-test-final-review-repairs-20261021.mjs','commit-and-test-combined-atlas-20261021.mjs','close-generated-source-and-build-20261021.mjs','checkpoint-combined-source-verified-20261021.mjs'])copy(name,'scripts/'+name);
copy(retry+'/source-inputs-after.json','local/current-inputs.json',false);
for(const name of ['FINDINGS.json','HANDOFF.md'])copy(base+'plexus-provenance-triage/'+name,'local/plexus/'+name,false);
const summary={at:new Date().toISOString(),source:{commit:generated.commit,tree:generated.tree,parent:generated.introduction,introduction:generated.introduction,baseline:baseCommit,changedSourcePaths:22,clean:true},
 progress:'Actual complete original hip wrapper,75tour-player cases,fresh TypeScript pass. Four dental MRI methods notes bind28existing tooth representations,not28unique lessons or acquired MRI. Genuine introduction30135cdd and generated closure successor are separate actual commits. Stock generation changes28MRI cells/preserves2330head-neck cells;stock checker verifies all12generated files with its declared text-EOL policy,and only two Git paths change. Renderer/display gates, actual committed full transition and regional build pass. Original stale-snapshot build failure retained; no bypass.',
 clinicalTestProgress:'Coverage4/4,arterial6/6,spinal2/2 actual checks pass. Forearm/hepatic/salivary corpus/private-storage modules pass. Elbow exact current/historical six US packets now prove later six X-ray cells and genuine tour playback metadata without dropping whole packets; original inverses retained. Seven real head-review modules initially33/30pass/3fail after manual test resolver repair; the7affected elbow/MRI/guard retries now allpass with no5084input drift. MRI failure was an omitted getClinicalReviewContext in the synthetic test adapter,not a new production permission or checkbox requirement. Earlier30case passes retain unchanged runtime/test dependencies,not a newly rerun33case or full-suite pass.',
 sourceFiles,websiteFiles:[...finalFiles.values()],receipts,
 originalFullSuite:{tests:5502,pass:5355,fail:144,skip:3,inputDrift:false,passingClaim:false},
 remaining:'Original full-suite remaining historical/provenance/input-contract failures remain. Read-only plexus triage found a genuine later two-file presentation pin extension,not evidence of licensing weakening; historical target provenance still needs exact reconstruction. Export/import all four source-derived runtimes/Review from the actual new revision into a separate unpublished Website candidate; preserve137model objects and independent access. Then affected integration/full-suite/build/browser acceptance. Do not refresh owner review tabs or invent clinical/spatial/public approval.',
 actualTwoClinicalModulesAndGuardPass:true,regionalModuleBuildPass:true,canonicalInstalled:false,fullWebsiteSuitePass:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false,fullGoalActive:true};
fs.writeFileSync(root+'/MAIN_REVIEW.json',JSON.stringify(summary,null,2)+'\n',{flag:'wx'});copy(root+'/MAIN_REVIEW.json','evidence/MAIN_REVIEW.json');
const parentRoot='F:/VisibleMedicine/recovery/checkpoints/20261021-lifecycle-repair-progress-v2-backup',parent=json(parentRoot+'/github-backup.json');assert(parent.sourceBackupVerified);assert.equal(parent.head,'73043aeb010c75e4ba19efaf6a3d1732194dff44');
const previous=json(parentRoot+'/remote-source-restored/.source-backup/manifest.json');
const values=new Map(previous.files.map(row=>{const bytes=read(parentRoot+'/remote-source-restored/'+row.path);assert.equal(sha(bytes),row.sha256);return[row.path,bytes];}));
for(const row of selected)values.set('evidence/20261021-combined-source-verified/'+row.path,read(root+'/'+row.path));
const remoteRoot=root+'-backup';
backup({root:remoteRoot,repo:'F:/VisibleMedicine/history/website-work/github-combined-source-verified-20261021.git',branch:'backup/atlas-combined-verified-20261021',
 files:[...values].map(([path,bytes])=>({path,bytes:bytes.length,sha256:sha(bytes)})).sort((a,b)=>a.path.localeCompare(b.path)),bytesFor:p=>values.get(p),verifySource:verify,
 sourceIdentity:summary.source,parent:parent.head,parentTree:parent.tree,parentRepo:parentRoot+'/independent-readback.git',
 proof:{actualFinalRetryPass:true,tourPlayerCases:75,wholeHipPass:true,freshTypesPass:true,genuineSourceIntroduction:true,committedTransitionAndRegionalBuildPass:true,canonicalInstalled:false,clinicalApproval:false},
 scope:'Selected22committed Atlas source/code/generated-teaching paths,review test postimages/exact preimages,small structured receipts/main scripts on prior filtered ancestry. No raw canonical Git ancestry,models,fonts/textures,publisher figures,scans/masks/patient data/private decisions/inbox or private plexus metadata,browser pixels/DOM,long failed source-dump logs,dependencies. Full current-input/plexus/coordination details stay local. Not whole runnable/private-data backup or clinical/public release.'});
const remote=json(remoteRoot+'/github-backup.json');
fs.writeFileSync(root+'/checkpoint.json',JSON.stringify({...summary,selectedFiles:selected,localFiles:local,backup:{receipt:remoteRoot+'/github-backup.json',receiptSha256:sha(read(remoteRoot+'/github-backup.json')),head:remote.head,tree:remote.tree,restoredPaths:remote.restoredPaths}},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({checkpoint:root+'/checkpoint.json',sha256:sha(read(root+'/checkpoint.json')),selectedNewPaths:selected.length,source:generated.commit,backup:remote.head,tree:remote.tree,restoredPaths:remote.restoredPaths}));
