import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261022-legacy-shoulder-reference-candidate';
const baseline='F:/VisibleMedicine/staging/20261022-review-traversal-candidate/atlas';
const worker='F:/VisibleMedicine/staging/20261022-legacy-shoulder-muscle-references/RESULT.json';
assert.equal(sha(read(worker)),'f7c875aefcc842b37732a60b4ab6f2f4e11908f6d89f7904a9292fd2fd099134');
assert.equal(sha(read(stage+'/preimage/worker-muscle-references.ts.raw')),json(worker).proposalSha256);
const result=json(stage+'/FOCUSED_RESULT.json'),tap=read(stage+'/native-green.observed.tap').toString();
const counts=Object.fromEntries([...tap.matchAll(/^# (tests|pass|fail|cancelled|skipped|todo) (\d+)\r?$/gm)].map(m=>[m[1],Number(m[2])]));
assert.deepEqual(counts,{tests:5,pass:5,fail:0,cancelled:0,skipped:0,todo:0});
assert.equal(result.resolvedPlacements,9936);assert.equal(result.newCitationPlacements,85);assert.equal(result.remainingCitationGaps.length,4);
assert.equal(result.affectedSourceSelections,12);assert.equal(result.authoredSectionsWithNewReferences,70);assert.equal(result.editedAuthoredSections,9);
for(const row of result.unchangedRendererAndReviewSource)assert.equal(sha(read(baseline+'/'+row.path)),row.sha256);
assert.equal(runGit(['-C',baseline,'status','--porcelain']).toString().trim(),'');
assert.equal(runGit(['-C',baseline,'rev-parse','HEAD']).toString().trim(),result.source);
const proposal=['app/anatomy-data.ts','app/body-content.ts','lib/legacy-shoulder-bone-references.ts','lib/legacy-shoulder-muscle-references.ts','lib/legacy-shoulder-references.ts','scripts/test-legacy-shoulder-references.mjs'].map(path=>({path,sha256:sha(read(stage+'/'+path))}));
const diffs=[];
for(const file of ['anatomy-data','body-content']){
  const before=stage+'/preimage/'+file+'.ts.raw',after=stage+'/app/'+file+'.ts';assert.deepEqual(read(before),read(baseline+'/app/'+file+'.ts'));
  const diff=spawnSync('git',['diff','--no-index','--',before,after],{windowsHide:true,maxBuffer:2e6});assert.equal(diff.status,1);
  const name=file+'.source-change.patch';fs.writeFileSync(stage+'/'+name,diff.stdout,{flag:'wx'});
  diffs.push({path:stage+'/'+name,sha256:sha(read(stage+'/'+name)),beforeSha256:sha(read(before)),afterSha256:sha(read(after))});
}
const review={schema:'vm.legacy-shoulder-reference-main-review/1',at:new Date().toISOString(),status:'focused-verified-unintegrated-draft',baseline:{path:baseline,head:result.source,tree:'db21ed3dee259c390878450b3495468996a3af85',clean:true},proposal,diffs,
  worker:{result:worker,sha256:sha(read(worker)),task:'/root/shoulder_muscle_references_1022',model:'gpt-6-sol',effort:'medium',sourceRecords:25,finished:true,tokens:'unavailable'},
  native:{command:'node --max-old-space-size=256 --test --test-concurrency=1 --test-reporter=tap scripts/test-legacy-shoulder-references.mjs',processEnvironment:{GOMAXPROCS:'2',RAYON_NUM_THREADS:'1'},execSession:78890,exit:0,counts,elapsedMs:20616.2358,observedTap:stage+'/native-green.observed.tap',observedTapSha256:sha(read(stage+'/native-green.observed.tap')),capture:'Observed stdout reconstructed without a rerun from exec chunks2b6490(TAP header) andf7f1bf(complete remaining output); not a direct raw stdout file.'},
  focusedResult:stage+'/FOCUSED_RESULT.json',focusedResultSha256:sha(read(stage+'/FOCUSED_RESULT.json')),result,
  mainChanges:['Added identity/topic-specific further-reading links to70legacy authored sections and the existing Brain function note.','Nine legacy sections receive targeted anatomical/imaging/provenance corrections; all other original text, quiz answers and X-ray sections remain exact.','Correct biceps anchor location: superior glenoid–labral region, not proximal humeral attachment.','Replace unverified anterior-distal supraspinatus tear preference with observed-location teaching.','Remove unsubstantiated comparative deltoid-injury frequency and thin-fat-plane/normal-echo claims; cite scoped denervation and ultrasound-landmark sources.','Scope biceps CT arthrography separately from routine unenhanced CT and scope pulley visibility to adequately visualised structures.','Replace an unconditional source-mesh/crop claim with the actual one-selection interface boundary.'],
  evidenceLimits:['References are original-source links only; no article text, images, data or dependencies are imported. Linked full texts may have separate access terms; no new fees or automatic access conferred.','NCBI/RSNA review sources and society guidelines are distinguished from primary patient studies in the retained worker source catalog. A case/cohort is not general prevalence or a source geometry validation.','Deltoid MRI uses only the qualitative denervation association from PMID41145831. Its linked erratum41204987 was inaccessible behind a browser check; no numerical result, prognosis or corrected detail is asserted. Specialist full-source review remains pending.','Normal conventional cortical-MRI and age-related marrow references are not patient-specific normal limits; the existing bone draft remains subject to radiologist review.','Deltoid and teres-minor CT still have no vetted topic-specific reference: two authored sections/four displayed placements remain flagged, with no fabricated citation or automatic readiness downgrade.','Exact existing JSX fragments render links using real React server rendering, not a full component/browser/GPU acceptance.','Actual root bodyReviewMaterial hashes changed for12affected selections while source hashes stayed exact and one unaffected worksheet stayed exact; this is not a newly exported/installed Review/runtime or a clinical decision.'],
  selectedCompleteRunSourceUnchanged:true,reviewRuntimeBindingPending:true,fullTypesBuildBrowserPending:true,integrated:false,ownerPreviewChanged:false,wholeSuitePassing:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false};
fs.writeFileSync(stage+'/MAIN_REVIEW.json',JSON.stringify(review,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({receipt:stage+'/MAIN_REVIEW.json',sha256:sha(read(stage+'/MAIN_REVIEW.json')),native:counts,newCitationPlacements:85,remainingCitationPlacements:4,editedAuthoredSections:9,sourceSelections:12,integrated:false,previewChanged:false}));
