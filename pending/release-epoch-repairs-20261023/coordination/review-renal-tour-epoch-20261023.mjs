import assert from 'node:assert/strict';
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261023-regional-tour-epoch-diagnosis',report=json(stage+'/REPORT.json');
assert.equal(sha(read(stage+'/REPORT.json')),'5b4082270c9513a5f8ed1bdaf6488d838e03b750ed46d5f9bd73976fff17b9e4');
const root='F:/VisibleMedicine/staging/20261023-regional-tour-epoch-main-review',atlas=report.atlasSource,website=report.frozenWebsite;
if(fs.existsSync(root)){assert(process.argv.includes('--resume'));assert.equal(fs.readdirSync(root).length,0,'Resume only the empty failed audit directory');}else fs.mkdirSync(root);
const git=(commit,p)=>runGit(['-C',atlas,'show',commit+':'+p]),plain=v=>JSON.parse(JSON.stringify(v));
const before=report.historicalBoundary.beforeCommit,introduced=report.historicalBoundary.introductionCommit,current=report.sourceCommit;
const snapshots=[];
for(const [commit,row]of Object.entries(report.epochSnapshots)){
 const s=json(stage+'/EPOCH_'+commit+'.json');
 assert.equal(sha(JSON.stringify(s.tours)),s.fullArraySha256);assert.equal(s.tourCount,s.tours.length);assert.equal(s.stepCount,s.tours.reduce((n,t)=>n+t.steps.length,0));
 if(commit==='review'){assert.equal(sha(read(website+'/atlas-review/lib/regional-tours.ts')),s.sourceSha256);assert.equal(s.sourceSha256,row.sourceSha256);snapshots.push({path:stage+'/EPOCH_review.json',sha256:sha(read(stage+'/EPOCH_review.json')),scope:'actual Review import',fullArraySha256:s.fullArraySha256});continue;}
 assert.equal(s.sourceSha256,sha(git(commit,'lib/regional-tours.ts')));assert.equal(s.sourceSha256,row.sourceSha256);
 assert.equal(runGit(['-C',atlas,'rev-parse',commit+':lib/regional-tours.ts']).toString().trim(),s.sourceBlob);
 snapshots.push({path:stage+'/EPOCH_'+commit+'.json',sha256:sha(read(stage+'/EPOCH_'+commit+'.json')),commit,fullArraySha256:s.fullArraySha256});
}
const review=json(stage+'/EPOCH_review.json');assert.equal(sha(JSON.stringify(review.tours)),review.fullArraySha256);
assert.deepEqual(review.tours,json(stage+'/EPOCH_'+current+'.json').tours);
const {exactSourceHistoryApi}=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);
const left=plain((await exactSourceHistoryApi(before,'review-security')).regionalTours),right=plain((await exactSourceHistoryApi(introduced,'review-security')).regionalTours);
assert.deepEqual(left,json(stage+'/EPOCH_'+before+'.json').tours);assert.deepEqual(right,json(stage+'/EPOCH_'+introduced+'.json').tours);
const renalId='renal-organs-arteries-orientation',oldRevision='renal-organs-arteries-orientation-v1',newRevision='renal-organs-arteries-orientation-20261022-source-bound-draft';
assert.equal(left.length,51);assert.equal(right.length,51);const index=right.findIndex(t=>t.id===renalId);assert.equal(index,19);
assert.equal(left[index].revision,oldRevision);assert.equal(right[index].revision,newRevision);
const inverse=plain(right);inverse[index].revision=oldRevision;assert.deepEqual(inverse,left,'Every other field across 51 tours/309 stops must remain exact');
for(const row of report.boundSourceRecords){const bytes=git(current,row.path),digest=sha(bytes);assert.equal(digest,row.sourceSha256);assert.equal(sha(read(website+'/atlas-review/'+row.path)),digest);assert.equal(sha(read(atlas+'/'+row.path)),digest);
 const imported=json(website+'/atlas-review/manifest.json').files.find(r=>r.path===row.path);assert.equal(imported.sourceSha256,digest);assert.equal(imported.importedSha256,digest);
 assert.equal(json(website+'/atlas-review/integration-inputs.json').inputs.find(r=>r.path==='atlas-review/'+row.path).sha256,digest);
 assert.equal(json(website+'/public/atlas-runtime/head-neck/source-inputs.json').find(r=>r.path===row.path).sha256,digest);
}
const pins=commit=>JSON.parse(git(commit,'content/body-review-display-pins.json')).pins;
const delta=(a,b)=>{const old=new Map(pins(a).map(r=>[r.structureId,r.sha256])),next=pins(b);assert.equal(old.size,1104);assert.equal(next.length,1104);assert(next.every(r=>old.has(r.structureId)));return next.filter(r=>r.sha256!==old.get(r.structureId)).map(r=>r.structureId).sort();};
const prior='190a63238eadcf906abe89dcbb6a67c88afe70b9',renalPins=delta(before,current),earlierPins=delta(prior,before),allPins=delta(prior,current);
assert.deepEqual(allPins,[...new Set([...renalPins,...earlierPins])].sort());assert.equal(renalPins.length,5);assert.equal(earlierPins.length,5);assert.equal(allPins.length,10);
const pinTracePath='F:/VisibleMedicine/staging/20261023-ae84-metadata-closure/LOWER_LIMB_PIN_DIAGNOSIS.json',trace=json(pinTracePath);
assert.deepEqual(earlierPins,trace.earlier.map(r=>r.structureId).sort());assert.deepEqual(allPins,trace.combined.map(r=>r.structureId).sort());
assert.equal(trace.earlier.filter(r=>r.introductions.length===1&&r.introductions[0].startsWith('6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1 ')).length,2);
assert.equal(trace.earlier.filter(r=>r.introductions.length===1&&r.introductions[0].startsWith('da84654113bdd27dbfabd6879d82740c8407f4db ')).length,3);
const expectedRenal=[...new Set([...right[index].contextIds,...right[index].steps.map(s=>s.selectedId)])].sort();assert.deepEqual(renalPins,expectedRenal);
assert.equal(sha(read(website+'/atlas-review/content/body-review-display-pins.json')),sha(git(current,'content/body-review-display-pins.json')));
const receipt={at:new Date().toISOString(),schema:'vm.main-renal-tour-epoch-review/1',report:stage+'/REPORT.json',reportSha256:sha(read(stage+'/REPORT.json')),actualBoundaryApisExecuted:[before,introduced],snapshotsChecked:snapshots,
 current,mainVerifiedSingleRevisionDifference:true,tours:51,steps:right.reduce((n,t)=>n+t.steps.length,0),renalIndex:index,oldRevision,newRevision,allSourceReviewAndHeadRuntimeBindingsMatch:true,
 lowerLimbPin1080:{prior,earlierSourceIds:earlierPins,laterRenalIds:renalPins,combinedIds:allPins,firstIntroductionTrace:pinTracePath,firstIntroductionTraceSha256:sha(read(pinTracePath)),diagnosis:'Original two-colic assertion omitted three exact neck-landmark X-ray revisions and five later source-bound renal-tour revisions. Git first-introduction traces locate the two colic changes at6d7, three neck changes atda846, and the five renal changes at4f20. All 1104 imported display pins match current committed source. Preserve all exact named historical transitions, not a broad or arbitrary changed-ID allowance.'},
 geometryOrTeachingContentEdited:false,productRegressionProven:false,fullSuitePassing:false,previewChanged:false,privateRecordsRead:false,toolingDiagnostics:[{chunk:'75360b',reason:'Initial verifier treated the explicitly named Review-import snapshot as a Git commit. The corrected verifier checks its imported file bytes directly; no snapshot or product source was altered.'},{chunk:'a0b9cc',reason:'The initial assumed two-colic earlier delta was rejected by an actual five-ID delta. Exact Git first-introduction traces identify the additional three neck-landmark revisions. The final ten-ID decomposition is exact and source-bound; no product test or source was relaxed.'}],
 next:'Prepare one isolated exact historical-role repair for the renal boundary; retain all original whole-source/array refusals and the current exact-source guard. Do not change tour captions/stops, Review/runtime imports or running stock source to fit old assertions.'};
fs.writeFileSync(root+'/MAIN_REVIEW.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({receipt:root+'/MAIN_REVIEW.json',sha256:sha(read(root+'/MAIN_REVIEW.json')),tours:51,steps:receipt.steps,pin1080ExactDelta:allPins.length,sourceChanged:false}));
