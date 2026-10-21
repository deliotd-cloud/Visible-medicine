import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261021-imaging-comparison-label-candidate',p=json(stage+'/PREPARATION.json'),site=p.site;
const save=(name,v)=>fs.writeFileSync(stage+'/'+name,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const canonicalRows=json(p.canonicalSnapshot),baselineRows=json(p.baselineSnapshot);
assert.equal(sha(read(p.baselineSnapshot)),p.baselineSnapshotSha256);assert.equal(sha(read(p.canonicalSnapshot)),p.canonicalSnapshotSha256);
const generated=new Set(['atlas-review/integration-inputs.json','atlas-review/manifest.json','atlas-review/content/body-renderer-revision.json','atlas-review/content/review-revisions.json']);
const fixture='tests/fixtures/current-atlas-delivery.json';
function guard(){
 for(const r of baselineRows)assert.equal(sha(read(p.baseline+'/website/'+r.path)),r.sha256,'Immutable baseline:'+r.path);
 for(const r of [...canonicalRows,...p.preserved])assert.equal(sha(read(p.canonical+'/'+r.path)),r.sha256,'Owner:'+r.path);
 for(const r of p.rows)if(!generated.has(r.path)&&!r.path.startsWith('public/atlas-review-viewer/')&&r.path!==fixture)assert.equal(sha(read(site+'/'+r.path)),r.sha256,'Candidate:'+r.path);
 assert.equal(runGit(['-C',p.canonical,'rev-parse','HEAD']).toString().trim(),p.websiteHead);
 assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),p.source);assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','status','--porcelain']).toString().trim(),'');
 process.kill(266712,0);process.kill(240632,0);
}
guard();assert(!fs.existsSync(stage+'/VERIFICATION_STARTED.json'));
save('VERIFICATION_STARTED.json',{at:new Date().toISOString(),driver:process.pid,canonicalInstalled:false,ownerFormsRefreshed:false});
const commands=[];
function run(name,args){
 const log=stage+'/'+name+'.log',fd=fs.openSync(log,'wx'),at=new Date().toISOString(),begin=Date.now();
 const r=spawnSync(process.execPath,args,{cwd:site,windowsHide:true,stdio:['ignore',fd,fd],env:{...process.env,VM_ATLAS_SOURCE_REPO:'F:/VisibleMedicine/atlas',GOMAXPROCS:'2',RAYON_NUM_THREADS:'1',NODE_OPTIONS:'--max-old-space-size=4096'}});fs.closeSync(fd);
 const receipt={at,args,code:r.status,signal:r.signal,error:r.error?.message??null,durationMs:Date.now()-begin,log,logSha256:sha(read(log)),canonicalInstalled:false};
 if(name==='native'){receipt.counts={};for(const m of read(log).toString().matchAll(/^# (tests|pass|fail|cancelled|skipped|todo) (\d+)\r?$/gm))receipt.counts[m[1]]=Number(m[2]);receipt.failures=[...read(log).toString().matchAll(/^not ok (\d+) - (.+)\r?$/gm)].map(m=>({number:Number(m[1]),title:m[2]}));}
 save(name+'.json',receipt);commands.push(receipt);console.log(JSON.stringify({name,code:r.status,counts:receipt.counts,durationMs:receipt.durationMs}));guard();assert.equal(r.status,0,name);assert.equal(r.signal,null);assert.equal(r.error,undefined);
 if(name==='native'){assert.equal(receipt.counts.fail,0);assert.equal(receipt.counts.skipped,0);assert.equal(receipt.counts.cancelled,0);assert(receipt.counts.pass>0);}
}
const oldBinding=json(site+'/atlas-review/integration-inputs.json'),oldReview=json(site+'/atlas-review/manifest.json'),oldBody=json(site+'/atlas-review/content/body-renderer-revision.json'),oldShoulder=json(site+'/atlas-review/content/review-revisions.json'),oldViewer=json(site+'/public/atlas-review-viewer/manifest.json'),oldPin=json(site+'/'+fixture);
const roots=['tests/imaging-atlas-shell.test.ts','tests/imaging-pane-navigation.test.ts','tests/imaging-image-focus.test.mjs','tests/head-inline-comparison.test.ts','tests/head-atlas-navigation.test.ts','tests/review-navigation-delivery-preservation.test.mjs','tests/current-atlas-delivery.test.mjs'];
try{
 assert.equal(oldBinding.sha256,p.reviewBefore);assert.equal(oldBinding.inputs.length,1711);
 run('bind-review',['scripts/bind-clinical-review.mjs']);
 const binding=json(site+'/atlas-review/integration-inputs.json'),review=json(site+'/atlas-review/manifest.json');
 assert.equal(binding.inputs.length,1711);assert.equal(binding.sourceCommit,oldBinding.sourceCommit);assert.notEqual(binding.sha256,oldBinding.sha256);assert.equal(sha(JSON.stringify(binding.inputs)),binding.sha256);
 const expectedInputs=oldBinding.inputs.map(r=>r.path==='components/ImagingAtlasShell.tsx'?{...r,sha256:p.proposedPaths.find(v=>v.path===r.path).candidateSha256}:r);
 assert.deepEqual(binding.inputs,expectedInputs,'Sole presentation input change');
 const inverseReview=structuredClone(review);inverseReview.websiteIntegrationSha256=oldReview.websiteIntegrationSha256;
 for(const r of inverseReview.files){const old=oldReview.files.find(v=>v.path===r.path);assert(old);if(['content/body-renderer-revision.json','content/review-revisions.json'].includes(r.path))r.importedSha256=old.importedSha256;else assert.deepEqual(r,old);}
 assert.deepEqual(inverseReview,oldReview,'Imported source metadata is exact outside stock revision serialization');
 const body=json(site+'/atlas-review/content/body-renderer-revision.json');
 const expectedBody=structuredClone(oldBody);expectedBody.websiteIntegrationSha256=binding.sha256;expectedBody.sha256=sha(JSON.stringify({source:oldBody.sourceRendererSha256,website:binding.sha256}));assert.deepEqual(body,expectedBody);
 const shoulder=json(site+'/atlas-review/content/review-revisions.json'),expectedShoulder=structuredClone(oldShoulder);expectedShoulder.websiteIntegrationSha256=binding.sha256;
 for(const [id,tracks]of Object.entries(expectedShoulder.sourceRevisions))for(const track of ['geometry','teaching'])expectedShoulder.revisions[id][track]=tracks[track]===null?null:sha(JSON.stringify({source:tracks[track],website:binding.sha256}));
 assert.deepEqual(shoulder,expectedShoulder,'No source revisions or decisions migrate');
 run('build-review-viewer',['scripts/build-clinical-review-viewer.mjs']);
 const viewer=json(site+'/public/atlas-review-viewer/manifest.json');
 assert.equal(viewer.sourceCommit,p.source);assert.equal(viewer.websiteIntegrationSha256,binding.sha256);assert.equal(viewer.files.length,46);assert.equal(viewer.packages.length,22);assert.equal(viewer.mode,'production');assert.equal(viewer.personalRecordsIncluded,false);assert.equal(viewer.modelDelivery,oldViewer.modelDelivery);
 assert.deepEqual(viewer.packages,oldViewer.packages,'No changed dependency or licensing inventory');
 for(const r of viewer.files)assert.equal(sha(read(site+'/public/atlas-review-viewer/'+r.path)),r.sha256);
 const pin=structuredClone(oldPin);pin.reviewIntegration=binding.sha256;
 for(const file of ['atlas-review/integration-inputs.json','atlas-review/manifest.json','public/atlas-review-viewer/manifest.json']){assert(Object.hasOwn(pin.documents,file));pin.documents[file]=sha(read(site+'/'+file));}
 const inversePin=structuredClone(pin);inversePin.reviewIntegration=oldPin.reviewIntegration;inversePin.documents=oldPin.documents;assert.deepEqual(inversePin,oldPin);
 assert.equal(sha(read(site+'/'+fixture)),sha(read(p.baseline+'/website/'+fixture)));
 fs.writeFileSync(site+'/'+fixture,JSON.stringify(pin,null,2)+'\n'); // Mechanical stock-output fingerprint serialization.
 const sourceRows=p.rows.filter(r=>!r.path.startsWith('public/atlas-review-viewer/')).map(r=>({...r,bytes:read(site+'/'+r.path).length,sha256:sha(read(site+'/'+r.path))}));
 for(const file of ['manifest.json',...viewer.files.map(r=>r.path)]){const path='public/atlas-review-viewer/'+file,bytes=read(site+'/'+path);sourceRows.push({path,bytes:bytes.length,sha256:sha(bytes)});}
 assert.equal(sourceRows.length,p.rows.length);assert.equal(new Set(sourceRows.map(r=>r.path)).size,sourceRows.length);
 const sourcePath=stage+'/FINAL_SOURCE_INPUTS.json';save('FINAL_SOURCE_INPUTS.json',sourceRows);
 save('PRESENTATION_TRANSITION.json',{at:new Date().toISOString(),source:p.source,reviewBefore:oldBinding.sha256,reviewAfter:binding.sha256,reviewInputs:1711,sourceInputChanges:['components/ImagingAtlasShell.tsx'],generatedRevisionPaths:[...generated],changedDeliveryDocuments:Object.keys(oldPin.documents).filter(k=>pin.documents[k]!==oldPin.documents[k]),stockBinderAndViewer:true,wholeReviewAndSourceRevisionInverseExact:true,packagesUnchanged:true,privatePlexusPacketAndModuleUnchanged:true,sourceSnapshot:sourcePath,sourceSnapshotSha256:sha(read(sourcePath)),canonicalInstalled:false,ownerFormsRefreshed:false,clinicalApproval:false,spatialRegistration:false});
 run('stock-review',['scripts/verify-clinical-review.mjs']);
 run('native',['--test','--experimental-strip-types','--test-reporter=tap','--test-concurrency=1',...roots]);
 run('full-types',['node_modules/typescript/bin/tsc','--noEmit','--incremental','false']);
 run('full-build',['node_modules/vinext/dist/cli.js','build']);
 guard();for(const r of sourceRows)assert.equal(sha(read(site+'/'+r.path)),r.sha256);
 save('VERIFIED.json',{at:new Date().toISOString(),stage,site,source:p.source,review:binding.sha256,reviewBefore:oldBinding.sha256,reviewInputs:1711,sourceFiles:sourceRows.length,sourceSnapshot:sourcePath,sourceSnapshotSha256:sha(read(sourcePath)),commands,nativeRoots:roots,actualNativeCounts:commands.find(r=>r.counts).counts,newLabelScenarios:12,realPaneNavigationUsed:true,wholePresentationTransitionExact:true,stockReviewPassed:true,fullProjectTypesPassed:true,fullLocalBuildPassed:true,canonicalInstalled:false,ownerFormsRefreshed:false,ownerPreviewRestarted:false,priorCandidateUnchanged:true,allClinicalDecisionsUnchanged:true,clinicalApproval:false,spatialRegistration:false,publicDeployment:false,browserAcceptancePassed:false,wholeSuitePassingClaim:false,fullGoalActive:true});
 console.log(JSON.stringify({verified:stage+'/VERIFIED.json',review:binding.sha256,native:commands.find(r=>r.counts).counts,types:true,build:true,ownerUnchanged:true}));
}catch(error){save('VERIFICATION_FAILURE.json',{at:new Date().toISOString(),commands,error:String(error),canonicalInstalled:false,ownerFormsRefreshed:false,wholeSuitePassingClaim:false});throw error;}
