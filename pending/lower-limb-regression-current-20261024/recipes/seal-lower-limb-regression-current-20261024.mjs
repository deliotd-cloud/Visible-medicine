// Test-only proof; production/type/browser acceptance remains at the parent.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hash,json} from './seal-simple-website-successor.mjs';
const stage='F:/VisibleMedicine/staging/20261024-lower-limb-regression-current',prep=json(stage+'/PREPARATION.json');
assert.equal(hash(prep.parentReceipt),'d2c288a5be7b54dda220a0f539e72c15988f63543124323c5b08c60533950df2');
const parent=json(prep.parentReceipt),site=prep.website;
const changedPaths=['tests/lower-limb-display-pin-history.mjs','tests/lower-limb-display-pin-history.test.mjs',
 'tests/clinical-review-lower-limb-connective-xray.test.ts','tests/release-epoch-composition-preservation.test.mjs'];
const newPaths=[...prep.preimages.map(r=>r.preimage),'tests/lower-limb-current-role-inverse.mjs',
 'tests/lower-limb-pin-history-source-roles.test.mjs','tests/lower-limb-current-source-roles.test.mjs'];
const changed=[];
for(const r of parent.sourceRows){
 assert.equal(hash(parent.website+'/'+r.path),r.sha256,r.path);
 if(hash(site+'/'+r.path)!==r.sha256){assert(changedPaths.includes(r.path),r.path);changed.push(r.path);}
}
assert.deepEqual(new Set(changed),new Set(changedPaths));
const sourceRows=[...parent.sourceRows.map(r=>r.path),...newPaths].sort().map(p=>({path:p,bytes:fs.statSync(site+'/'+p).size,sha256:hash(site+'/'+p)}));
assert.equal(sourceRows.length,6518);assert.equal(new Set(sourceRows.map(r=>r.path)).size,6518);
for(const phase of ['baseline','current']){
 const dir=stage+'/checks/'+phase,t=json(dir+'/TERMINAL.json'),snapshot=json(dir+'/SOURCE_BEFORE.json');
 assert.equal(hash(dir+'/stdout.log'),t.stdoutSha256);assert.equal(hash(dir+'/stderr.log'),t.stderrSha256);
 assert.equal(hash(dir+'/SOURCE_BEFORE.json'),t.sourceBeforeSha256);assert(t.sourceUnchanged&&t.nativeUnchanged&&!t.resourceFailure);
 assert.equal(t.counts.skipped+t.counts.cancelled,0);
 if(phase==='current'){assert.equal(t.code,0);assert.equal(t.counts.pass,12);assert.equal(t.counts.fail,0);assert.deepEqual(snapshot.sourceRows,sourceRows);}
 else{assert.equal(t.code,1);assert.equal(t.counts.fail,1);assert.equal(t.counts.tests,1);assert.deepEqual(new Map(snapshot.sourceRows.map(r=>[r.path,r.sha256])),new Map(parent.sourceRows.map(r=>[r.path,r.sha256])));const text=fs.readFileSync(dir+'/stdout.log','utf8');assert(text.includes("+ 'b79e110d2d28f18993263926ba35aa7a3f478b20'"));assert(text.includes("- '190a63238eadcf906abe89dcbb6a67c88afe70b9'"));}
}
for(const r of json(parent.buildArtifacts).files)assert.equal(hash(parent.website+'/dist/'+r.path),r.sha256,r.path);
for(const [repo,head]of [[prep.atlas,prep.atlasHead],['F:/VisibleMedicine/website','b953ff3f5f1891599cb6e91cb91311d9d6006270'],['F:/VisibleMedicine/atlas','6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1']])
 assert.equal(execFileSync('git',['-C',repo,'rev-parse','HEAD'],{encoding:'utf8',windowsHide:true,stdio:'pipe'}).trim(),head);
assert.equal(execFileSync('git',['-C',prep.atlas,'status','--porcelain'],{encoding:'utf8',windowsHide:true,stdio:'pipe'}).trim(),'');
const p=json('CURRENT_CHECKPOINT.json');assert.equal(p.goal.status,'active');assert.equal(p.activeWork.current.activeExecutionSessions.length,0);assert.equal(p.activeWork.current.ownerPreviewPolicy.restartPermitted,false);
assert.equal(p.activeWork.current.latestWebsiteCandidate.sourceReceiptSha256,hash(prep.parentReceipt));
const evidencePaths=['PREPARATION.json','MAIN_TRANSITION.json',...['baseline','current'].flatMap(n=>['STARTED.json','SOURCE_BEFORE.json','TERMINAL.json','stdout.log','stderr.log'].map(f=>'checks/'+n+'/'+f))];
const evidence=evidencePaths.map(p=>({path:p,bytes:fs.statSync(stage+'/'+p).size,sha256:hash(stage+'/'+p)}));
const proof={at:new Date().toISOString(),website:site,atlas:prep.atlas,atlasHead:prep.atlasHead,atlasTree:prep.atlasTree,parentReceipt:prep.parentReceipt,parentReceiptSha256:hash(prep.parentReceipt),sourceRows,sourcePaths:sourceRows.length,changedPaths,newPaths,evidence,
 nativeRoots:5,nativeCases:12,failedBaselineCasesRetained:1,baselineClassification:'Stale current-runtime assertion expected historical190a instead of actual b79 before feature execution; no product failure inferred.',
 allInheritedProductGeneratedSourceExact:true,allOriginalConsumerAndHelperTheoremsReconstructExactly:true,laterPinChangingEpochs:11,pinCount:1104,changedIdCounts:[2,3,5,22,6,3,8,6,8,12,12,12,20,8],
 originalFourXrayDraftsReviewed:4,originalHistoricalUntouchedTeachingPlacements:9932,originalHistoricalUntouchedWorksheets:1100,
 completeSourcePreAndPostSeals:true,newBuildRun:false,newTypecheckRun:false,newBrowserRun:false,unchangedParentBuildVerified:true,
 parentProductionBuildArtifacts:parent.buildArtifacts,parentProductionBuildSha256:parent.buildArtifactsSha256,latestCompleteWebsiteUnchanged:true,
 worker:{model:'gpt-6-sol',effort:'medium',exclusivePaths:['tests/lower-limb-display-pin-history.mjs','tests/lower-limb-display-pin-history.test.mjs','tests/lower-limb-pin-history-source-roles.test.mjs'],actualTokenUsage:'unavailable',mainPreExecutionCorrection:'Added complete-current helper/test guards before the inverse; otherwise removing the added epoch table could hide mutations in that table. This new harness defect was corrected before native tests; no rerun or product weakening.'},
 remaining:'Other historical/current source-role cohorts and full-suite/runtime/private-study/AT/performance/clinical/release gates remain open. This is not a resolution of all107historic failures/3host skips or a fresh current Website deployment.',
 testOnly:true,previewChanged:false,installed:false,publicDeployment:false,clinicalApproval:false,patientSpaceRegistration:false};
fs.writeFileSync(stage+'/PROOF_BOUND.json',JSON.stringify(proof,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({proof:stage+'/PROOF_BOUND.json',sha256:hash(stage+'/PROOF_BOUND.json'),sourcePaths:sourceRows.length,cases:12,previewChanged:false}));
