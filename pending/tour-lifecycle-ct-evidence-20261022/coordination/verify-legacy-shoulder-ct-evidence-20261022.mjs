import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261022-legacy-shoulder-ct-evidence',prior='F:/VisibleMedicine/staging/20261022-legacy-shoulder-reference-candidate';
assert.equal(sha(read(prior+'/MAIN_REVIEW.json')),'c4c498a1fe5ffae19f22444ed64b8c6a1f8df16560ec60b2c400327a210a9e00');
const parent=json(prior+'/MAIN_REVIEW.json');for(const row of parent.proposal)assert.equal(sha(read(prior+'/'+row.path)),row.sha256);
const replaceOnce=(text,from,to)=>{assert.equal(text.split(from).length,2);return text.replace(from,to);};
let inverse=read(stage+'/app/anatomy-data.ts').toString();
for(const [from,to]of [[
  'CT can assess deltoid bulk and fatty change. Muscle attenuation depends on reconstruction settings and measurement method; this surface model supplies no patient-specific CT measurement or normal threshold.',
  'Muscle bulk and attenuation are compared with adjacent soft tissues and the contralateral side where available.'
],[
  'Review teres minor size and fatty change with the posterior cuff on CT. Muscle appearance varies across rotator-cuff tear patterns; this surface model supplies neither a patient-specific CT grade nor a normal quantitative threshold.',
  'Review muscle size and fatty replacement on soft-tissue windows.'
]])inverse=replaceOnce(inverse,from,to);
assert.equal(inverse,read(prior+'/app/anatomy-data.ts').toString());
inverse=read(stage+'/lib/legacy-shoulder-muscle-references.ts').toString();
for(const array of ["['https://pubmed.ncbi.nlm.nih.gov/38592118/']","['https://pubmed.ncbi.nlm.nih.gov/21604212/', 'https://pubmed.ncbi.nlm.nih.gov/41049670/']"])inverse=replaceOnce(inverse,'ct: '+array,'ct: []');
assert.equal(inverse,read(prior+'/lib/legacy-shoulder-muscle-references.ts').toString());
for(const file of ['app/body-content.ts','lib/legacy-shoulder-bone-references.ts','lib/legacy-shoulder-references.ts'])assert.deepEqual(read(stage+'/'+file),read(prior+'/'+file));
const proposal=parent.proposal.map(row=>({path:row.path,sha256:sha(read(stage+'/'+row.path))}));
const args=['--max-old-space-size=256','--test','--test-concurrency=1','--test-reporter=tap','scripts/test-legacy-shoulder-references.mjs'];
const started=Date.now(),run=spawnSync(process.execPath,args,{cwd:stage,windowsHide:true,maxBuffer:4e6,env:{...process.env,GOMAXPROCS:'2',RAYON_NUM_THREADS:'1'}});
for(const [name,b]of [['native.stdout.log',run.stdout??''],['native.stderr.log',run.stderr??'']])fs.writeFileSync(stage+'/'+name,b,{flag:'wx'});
assert.equal(run.status,0,String(run.stderr??''));
const counts=Object.fromEntries([...String(run.stdout).matchAll(/^# (tests|pass|fail|cancelled|skipped|todo) (\d+)\r?$/gm)].map(m=>[m[1],Number(m[2])]));assert.deepEqual(counts,{tests:5,pass:5,fail:0,cancelled:0,skipped:0,todo:0});
const focused=json(stage+'/FOCUSED_RESULT.json');assert.equal(focused.newCitationPlacements,89);assert.equal(focused.changedPlacements,89);assert.deepEqual(focused.remainingCitationGaps,[]);assert.equal(focused.editedAuthoredSections,11);assert.equal(focused.authoredSectionsWithNewReferences,72);
for(const row of proposal)assert.equal(sha(read(stage+'/'+row.path)),row.sha256);for(const row of parent.proposal)assert.equal(sha(read(prior+'/'+row.path)),row.sha256);
const receipt={schema:'vm.legacy-shoulder-ct-evidence-main-review/1',at:new Date().toISOString(),status:'focused-verified-unintegrated-draft',baseline:parent.baseline,predecessor:{path:prior,mainReviewSha256:sha(read(prior+'/MAIN_REVIEW.json')),proposal:parent.proposal,unchanged:true},proposal,
  sourceChange:'Only two CT body strings and their topic-specific reference arrays change in product code versus the verified predecessor; complete source inverses restore both files byte-for-byte. The focused test changes counts from85to89/70to72/9to11, supplies the two exact new body expectations, and replaces the former held-array assertions with exact primary URL assertions. All unknown identity/topic, clone, X-ray, full-placement, React fragment and Review protections remain executed.',
  native:{args,exit:run.status,elapsedMs:Date.now()-started,counts,stdout:stage+'/native.stdout.log',stdoutSha256:sha(read(stage+'/native.stdout.log')),stderr:stage+'/native.stderr.log',stderrSha256:sha(read(stage+'/native.stderr.log'))},focusedResult:stage+'/FOCUSED_RESULT.json',focusedResultSha256:sha(read(stage+'/FOCUSED_RESULT.json')),focused,
  sources:[
    {url:'https://pubmed.ncbi.nlm.nih.gov/38592118/',title:'Impact of Deltoid Computer Tomography Image Data on the Accuracy of Machine Learning Predictions of Clinical Outcomes after Anatomic and Reverse Total Shoulder Arthroplasty',support:'Primary preoperative CT study measures deltoid volume and intensity; reconstruction-kernel differences preclude treating the model as a normal HU threshold.',limits:'Selected arthroplasty cohort and single platform, industry employment/consultancy disclosed. No algorithm, software, segmentation, dataset, prognosis or threshold imported.'},
    {url:'https://pubmed.ncbi.nlm.nih.gov/21604212/',title:'The teres minor muscle in rotator cuff tendon tears',support:'Primary CT/MRI cohort examines teres-minor size categories and variation by tear pattern.',limits:'Symptomatic cuff-tear imaging, not normal-population thresholds or an individual diagnosis.'},
    {url:'https://pubmed.ncbi.nlm.nih.gov/41049670/',title:'Normalized preoperative muscle volume correlates with shoulder strength at minimum2years after lateralized reverse total shoulder arthroplasty',support:'Primary CT planning study measures cuff/deltoid muscle volumes and3Dfatty infiltration.',limits:'Small retrospective surgical cohort using proprietary planning software. Link only: no proprietary software, code, images, models or data included, no payment or software dependency required.'}
  ],
  sourceAccess:'Public primary abstracts and indexed PubMed text; original factual paraphrases/links only. Initial deltoid direct open returned an incomplete page; indexed primary abstract supplied the methods/results. No access challenge bypass or article/figure copy.',
  interpretation:'Zero missing explicit citation fields in this exact source-composed root draft inventory, not evidence that all claims are clinically approved, every topic complete or all anatomy supplied. Readiness counts and525pending teaching placements are unchanged.',
  limits:'Separate unpublished source proposal. Existing real-React reference JSX fragment checks are not browser/GPU acceptance. Existing source-bound bodyReviewMaterial hashes are tested, but product Review/runtime exports, project types/build/browser and coherent integration remain pending. No clinical decisions or scans/masks/coordinates/geometry/access/licence/desktopPACS change.',reviewRuntimeBindingPending:true,fullTypesBuildBrowserPending:true,integrated:false,previewChanged:false,clinicalApproval:false,spatialRegistration:false,wholeSuitePassing:false,publicDeployment:false};
fs.writeFileSync(stage+'/MAIN_REVIEW.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({receipt:stage+'/MAIN_REVIEW.json',sha256:sha(read(stage+'/MAIN_REVIEW.json')),native:counts,newCitationPlacements:89,remainingCitationPlacements:0,integrated:false,previewChanged:false}));
