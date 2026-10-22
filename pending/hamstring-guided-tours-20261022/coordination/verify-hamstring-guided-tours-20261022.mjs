import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';

const stage='F:/VisibleMedicine/staging/20261022-hamstring-guided-tours';
const atlas='F:/VisibleMedicine/staging/20261022-review-traversal-candidate/atlas';
const git=(...args)=>runGit(['-C',atlas,...args]).toString().trim();
assert.equal(git('rev-parse','HEAD'),'2381efe43b75f8a7fb768a069eecd7268c508dac');
assert.equal(git('status','--porcelain'),'');
assert.equal(sha(read(stage+'/RESULT.json')),'e126415cf082609128a98b6e20312c5d5b94140872a2e38ad6ded1208b88f09b');
const worker=json(stage+'/RESULT.json');
assert.equal(sha(read(stage+'/worker-hamstring-tours.ts.raw')),worker.proposal['lib/hamstring-tours.ts']);
assert.equal(sha(read(stage+'/worker-test-hamstring-tours.mjs.raw')),worker.proposal['scripts/test-hamstring-tours.mjs']);
for(const file of ['content/hamstring-tour-pins.json','lib/regional-tours.ts','scripts/pin-hamstring-tours.mjs'])
  assert.equal(sha(read(stage+'/'+file)),worker.proposal[file]);
assert.equal(sha(read(stage+'/preimage/regional-tours.ts')),worker.registryPreimage.sha256);
const protectedPaths=['app/regional-guided-learning.tsx','app/whole-body-guided-learning.tsx','app/body-explorer.tsx','app/tour-speed-control.tsx','lib/guided-playback.ts','lib/tour-camera.ts','lib/regional-tours.ts'];
const unchangedSharedSource=protectedPaths.map(path=>({path,sha256:sha(read(atlas+'/'+path))}));
const proposal=['lib/hamstring-tours.ts','content/hamstring-tour-pins.json','lib/regional-tours.ts','scripts/pin-hamstring-tours.mjs','scripts/test-hamstring-tours.mjs'].map(path=>({path,sha256:sha(read(stage+'/'+path))}));
const runs=[];
for(const [name,args] of [['pins',['scripts/pin-hamstring-tours.mjs','--check']],['tour',['scripts/test-hamstring-tours.mjs']]]){
  const start=Date.now(),run=spawnSync(process.execPath,['--max-old-space-size=256',...args],{cwd:stage,windowsHide:true,maxBuffer:4e6,env:{...process.env,GOMAXPROCS:'2',RAYON_NUM_THREADS:'1'}});
  const stdout=stage+'/main-'+name+'.stdout.log',stderr=stage+'/main-'+name+'.stderr.log';
  fs.writeFileSync(stdout,run.stdout??'',{flag:'wx'});fs.writeFileSync(stderr,run.stderr??'',{flag:'wx'});
  const receipt={args,exit:run.status,elapsedMs:Date.now()-start,error:run.error?.message,stdout,stdoutSha256:sha(read(stdout)),stderr,stderrSha256:sha(read(stderr))};runs.push(receipt);
  assert.equal(run.status,0,String(run.stderr??''));
}
const result=JSON.parse(read(stage+'/main-tour.stdout.log'));
assert.equal(result.originalTours,51);assert.equal(result.proposedTours,53);assert.equal(result.preserved,51);assert.equal(result.stops,8);
assert.equal(result.tourRefusals,102);assert.equal(result.sourceRefusals,78);assert.equal(result.leafRefusals,349);
assert.deepEqual(result.continuousPlaybackRates,[0.5,1,1.5,2,3]);assert.equal(result.reviewEvidenceChecks,8);
for(const row of proposal)assert.equal(sha(read(stage+'/'+row.path)),row.sha256);
for(const row of unchangedSharedSource)assert.equal(sha(read(atlas+'/'+row.path)),row.sha256);
assert.equal(git('status','--porcelain'),'');
const receipt={schema:'vm.hamstring-guided-tours-main-review/1',at:new Date().toISOString(),status:'main-reviewed-source-checks-only-unintegrated',
  baseline:worker.baseline,workerResultSha256:sha(read(stage+'/RESULT.json')),proposal,unchangedSharedSource,runs,result,
  mainCorrections:['Removed an unverified rendered-location assertion.','Replaced unsupported posteromedial-to-semitendinosus wording with deeper medial hamstring.','Do not claim tendon or attachment absence from an uninspected camera frame.','Clarified that tendon/footprint detail is not independently segmented or validated.','Added the primary common-origin reference directly to the semitendinosus stop.'],
  primaryReferenceVerification:{at:new Date().toISOString(),references:worker.references,method:'University gross-anatomy table and indexed primary cadaver abstract verified; radiology review retained as reading reference. No images, measurements or article prose imported. Direct RSNA fetch timed out; indexed primary publisher result found.'},
  testsAreCustomAssertionsNotNodeTestCaseCount:true,originalToursPreserved:51,newDraftTours:2,newStops:8,sourceIdentities:10,sourceBundles:3,
  sharedContinuousPlayback:{unchanged:true,explicitPlay:true,automaticAdvance:true,rates:[0.5,1,1.5,2,3],oneTimesStepMs:24000,oneTimesSweepMs:8000,reducedMotion:'no-camera-sweep',sourceEvidenceOnly:true},
  worker:{task:'/root/hamstring_guided_tours_1022',model:'gpt-6-sol',effort:'medium',finished:true,tokenMeasurement:'unavailable'},
  limits:'Source-level draft only: no project typecheck/build, browser/GPU or clinical acceptance. Source metadata pins do not validate geometry or tendon footprints. No thigh scan, patient matching or spatial registration. Future coherent integration must make pin tooling relocatable, register focused checks, refresh source-bound Review/runtime outputs and pass applicable gates. No canonical/installed/selected full-run source, preview, mask, access, licence or desktop PACS change.',
  reviewBindingPending:true,fullTypesBuildBrowserPending:true,integrated:false,ownerPreviewChanged:false,wholeSuitePassing:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false};
fs.writeFileSync(stage+'/MAIN_REVIEW.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({receipt:stage+'/MAIN_REVIEW.json',sha256:sha(read(stage+'/MAIN_REVIEW.json')),checks:result,integrated:false,previewChanged:false}));
