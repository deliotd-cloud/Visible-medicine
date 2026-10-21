import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261021-coherent-usability-candidate',p=json(stage+'/PREPARATION.json'),site=p.site;
const canonicalRows=json(p.currentSourceSnapshot),parent=json(p.reviewBaselineCheckpoint);
assert.equal(sha(read(p.currentSourceSnapshot)),p.currentSourceSnapshotSha256);assert.equal(canonicalRows.length,5267);assert(parent.fullTypesPassed&&parent.fullLocalBuildPassed);assert.equal(parent.actualNativeCounts.pass,131);
const guard=()=>{
 for(const r of [...canonicalRows,...p.preserved])assert.equal(sha(read(p.source+'/'+r.path)),r.sha256,'Owner source:'+r.path);
 for(const r of p.rows)assert.equal(sha(read(site+'/'+r.path)),r.sha256,'Candidate source:'+r.path);
 assert.equal(runGit(['-C',p.source,'rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
 assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),p.sourceCommit);
 assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','status','--porcelain']).toString().trim(),'');
 assert.equal(json(p.source+'/atlas-review/integration-inputs.json').sha256,p.canonicalReview);
 const binding=json(site+'/atlas-review/integration-inputs.json');assert.equal(binding.sha256,p.review);assert.equal(binding.inputs.length,1711);for(const r of binding.inputs)assert.equal(sha(read(site+'/'+r.path)),r.sha256,r.path);
 for(const r of parent.selectedSourceFiles)assert.equal(sha(read(site+'/'+r.path)),r.sha256,'Original tested Review input:'+r.path);
 process.kill(266712,0);process.kill(240632,0);
};
guard();assert(!fs.existsSync(stage+'/VERIFICATION_STARTED.json'));
const save=(name,value)=>fs.writeFileSync(stage+'/'+name,JSON.stringify(value,null,2)+'\n',{flag:'wx'});
save('VERIFICATION_STARTED.json',{at:new Date().toISOString(),driver:process.pid,source:p.sourceCommit,review:p.review,canonicalInstalled:false,ownerFormsRefreshed:false});
const roots=['tests/studio-workbook-table-semantics.test.mjs','tests/studio-workbook-empty-state.test.mjs','tests/studio-workbook-filter-accessibility.test.mjs','tests/studio-workspace.test.ts','tests/studio-queues.test.ts','tests/head-neck-pilot-current.test.mjs','tests/head-neck-pilot.test.ts','tests/head-pilot-delivery-role-preservation-20261021.test.mjs','tests/public-focus-adapter-preservation.test.mjs','tests/header-session.test.ts','tests/atlas-region-picker.test.ts','tests/disc-comparison.test.ts','tests/workspace-utilities-dismissal.test.mjs','tests/desktop-workspace-simplification.test.ts','tests/current-atlas-delivery.test.mjs'];
const commands=[];
function run(name,args){
 const log=stage+'/'+name+'.log',fd=fs.openSync(log,'wx'),at=new Date().toISOString(),begin=Date.now();
 const r=spawnSync(process.execPath,args,{cwd:site,windowsHide:true,stdio:['ignore',fd,fd],env:{...process.env,VM_ATLAS_SOURCE_REPO:'F:/VisibleMedicine/atlas',GOMAXPROCS:'2',RAYON_NUM_THREADS:'1',NODE_OPTIONS:'--max-old-space-size=4096'}});fs.closeSync(fd);
 const receipt={at,args,code:r.status,signal:r.signal,error:r.error?.message??null,durationMs:Date.now()-begin,log,logSha256:sha(read(log)),canonicalInstalled:false};
 if(name==='native'){receipt.counts={};for(const m of read(log).toString().matchAll(/^# (tests|pass|fail|cancelled|skipped|todo) (\d+)\r?$/gm))receipt.counts[m[1]]=Number(m[2]);receipt.failures=[...read(log).toString().matchAll(/^not ok (\d+) - (.+)\r?$/gm)].map(m=>({number:Number(m[1]),title:m[2]}));}
 save(name+'.json',receipt);commands.push(receipt);console.log(JSON.stringify({name,code:r.status,counts:receipt.counts,durationMs:receipt.durationMs}));guard();assert.equal(r.status,0,name);assert.equal(r.signal,null);assert.equal(r.error,undefined);
 if(name==='native'){assert.equal(receipt.counts.fail,0);assert.equal(receipt.counts.skipped,0);assert.equal(receipt.counts.cancelled,0);assert(receipt.counts.pass>=100);}
}
try{
 run('stock-review',['scripts/verify-clinical-review.mjs']);
 run('model-inventory',['scripts/atlas-model-inventory.mjs','--check']);
 run('delivery-policy',['--experimental-strip-types','scripts/verify-atlas-delivery-policy.mjs']);
 run('native',['--test','--experimental-strip-types','--test-reporter=tap','--test-concurrency=1',...roots]);
 run('full-types',['node_modules/typescript/bin/tsc','--noEmit','--incremental','false']);
 run('full-build',['node_modules/vinext/dist/cli.js','build']);
 guard();const native=commands.find(r=>r.counts);
 save('VERIFIED.json',{at:new Date().toISOString(),site,source:p.sourceCommit,review:p.review,canonicalReview:p.canonicalReview,reviewInputs:1711,currentSourceSnapshot:p.currentSourceSnapshot,currentSourceSnapshotSha256:p.currentSourceSnapshotSha256,candidateFiles:p.rows.length,commands,nativeRoots:roots,nativeCounts:native.counts,fullProjectTypesPassed:true,fullLocalBuildPassed:true,stockReviewPassed:true,modelInventoryAndDeliveryPolicyPassed:true,original131ReviewChecksReusedAtExactSource:true,originalReviewVerification:parent.verification,originalReviewVerificationSha256:parent.verificationSha256,allParentReviewSourceBytesUnchanged:true,newestCanonicalTestOnlyBatchesRetained:true,canonicalInstalled:false,ownerFormsRefreshed:false,ownerPreviewRestarted:false,priorCandidateUnchanged:true,privateDatabaseCopied:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false,browserAcceptancePassed:false,wholeSuitePassingClaim:false,fullGoalActive:true});
 console.log(JSON.stringify({verified:stage+'/VERIFIED.json',native:native.counts,types:true,build:true,ownerUnchanged:true}));
}catch(error){save('VERIFICATION_FAILURE.json',{at:new Date().toISOString(),commands,error:String(error),canonicalInstalled:false,ownerFormsRefreshed:false,fullBuildPassed:false,wholeSuitePassingClaim:false});throw error;}
