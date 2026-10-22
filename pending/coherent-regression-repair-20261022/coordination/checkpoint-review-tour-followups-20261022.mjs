import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {read,json,sha} from './source-only-backup-20261019.mjs';

const root='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking';
const sourceReceipt=root+'/PRODUCT_SOURCE_V5.json',source=json(sourceReceipt);
assert.equal(sha(read(sourceReceipt)),'49a132ab76102e0fb2845df9ab111047630ecdafc0f0a2e61e81fef70a62a03f');
for(const row of source.sourceRows)assert.equal(sha(read(source.website+'/'+row.path)),row.sha256);
const batches=[
 {stage:'F:/VisibleMedicine/staging/20261022-review-frame-history-admission',
  proofSha256:'02621e90a4c8cb68b6bf29c35e6befc5b23c04225ccd8e88f5ebdff50a6706ce',
  tests:['head-review-compact-preservation.test.mjs','live-learning-runtime-harness-preservation.test.mjs','review-navigation-delivery-preservation.test.mjs'],
  codes:['d7c49de5731cdf64dcc57e6e861cf9b2614d763a784a256ade5ba7755a7fc4d4','c07a432944abfd9d410b3b9cedc6387ab3a8b333b4d12e41c1d86591cb4774c0','e89390f4aa8ebf4c8c709f6d6b78e9400e79e0dca7a16e58eea4de371dd8b144'],
  helper:{path:'tests/review-frame-history-inverse.mjs',sha256:'107fac77b4f68f2ca4b91a035a53920210a69a63a14b023e7b0f09e85810041a'},
  completeInverseAndDependencyProofMainExecuted:true,firstCompositionGapCorrectedWithDiagnosticPreimages:true},
 {stage:'F:/VisibleMedicine/staging/20261022-tour-quiz-runtime-family-admission',
  tests:['clinical-review-quiz-disclosure.test.ts','clinical-review-tour-speed.test.ts','clinical-review-specimen-continuous-playback.test.ts','specimen-playback-whole-source-inverse.test.mjs'],
  codes:['4629e27ef0a622a14cf3fd1eaef3bd1f939c17b725d39bba89992c17dfd7b683','455136653f2735cd0be1ca2ab2e52baf96b7efbd996fb79971154d6b781ed09e','d1ef90c77d79b7ddb2b7013576f7a1c68a636b825dfd5179204d476b5a02a072','1fcd5d8fdd44974d9cc9dbe407325eff7ff75cb41cfda0d10e32ebf8967fcd47'],
  completeInverseAndDependencyProofMainExecuted:true,original3076PlaybackAndFourHunkWitnessRetained:true},
];
function files(directory){return fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?files(path.join(directory,entry.name)):[path.join(directory,entry.name)]);}
const repairs=[],additionalFiles=[],alreadyPresent=[];
for(const batch of batches){
 const proof=batch.stage+'/SOURCE_PROOF.mjs';if(batch.proofSha256)assert.equal(sha(read(proof)),batch.proofSha256);else batch.proofSha256=sha(read(proof));
 for(const [index,name]of batch.tests.entries()){
  const file='tests/'+name,before=batch.stage+'/RAW/'+file,proposal=batch.stage+'/CODE/'+file;
  assert.equal(sha(read(before)),sha(read(source.website+'/'+file)),file+': exact live V5 preimage');
  assert.equal(sha(read(proposal)),batch.codes[index]);
  repairs.push({path:file,beforePath:before,beforeSha256:sha(read(before)),proposal,proposalSha256:batch.codes[index]});
 }
 if(batch.helper)assert.equal(sha(read(batch.stage+'/CODE/'+batch.helper.path)),batch.helper.sha256);
 for(const from of files(batch.stage+'/CODE')){
  const file=path.relative(batch.stage+'/CODE',from).replaceAll('\\','/');
  assert(file.startsWith('tests/'));if(batch.tests.some(name=>file==='tests/'+name))continue;
  const row={path:file,from,sha256:sha(read(from)),bytes:read(from).length};
  if(fs.existsSync(source.website+'/'+file)){assert.equal(sha(read(source.website+'/'+file)),row.sha256,'No unlisted replacement: '+file);alreadyPresent.push(row);}
  else additionalFiles.push(row);
 }
}
assert.equal(repairs.length,7);assert.equal(new Set([...repairs,...additionalFiles].map(row=>row.path)).size,repairs.length+additionalFiles.length);
const stage='F:/VisibleMedicine/staging/20261022-reviewed-tour-followup-plan';assert(!fs.existsSync(stage));fs.mkdirSync(stage);
const tests=[...repairs.map(row=>row.path),'tests/current-atlas-delivery.test.mjs','tests/atlas-runtime-frame.test.mjs',
 'tests/atlas-main-bronchus-xray.test.ts','tests/atlas-nested-practice.test.ts','tests/atlas-practice-navigation.test.ts',
 'tests/atlas-projection-ultrasound.test.ts','tests/atlas-search-study-handoff.test.ts'];
const result={at:new Date().toISOString(),phase:'source-reviewed-and-proved-only; await actual terminal before candidate overlay',sourceReceipt,sourceReceiptSha256:sha(read(sourceReceipt)),
 batches,repairs,additionalFiles,alreadyPresent,proposedNextNativeRoots:[...new Set(tests)],
 runningNativeEvidence:root+'/native-selected-repairs-v5',runningNativeSession:14480,runningNativePid:308392,
 sourceProofsAreNotNativeOrBrowserAcceptance:true,candidateChanged:false,canonicalChanged:false,ownerPreviewChanged:false,
 privateOrClinicalDataAdded:false,clinicalApproval:false,wholeSuitePassing:false,
 sourceBackup:'These new proposals/fixtures and this plan are local-only, not included in the previously verified 811a766f source backup.',
 next:'Keep V5 frozen until the 172-root job has a real terminal receipt. Diagnose any failures, then apply the seven exact source-only proposals and named additions coherently with full preimages; run the 14 named focused roots and applicable types. Do not rebuild unchanged production solely for test edits. Preserve the prior 5860/280 result and full71/eight scope. No owner cutover without fresh saved-draft clearance.',
};
fs.writeFileSync(stage+'/PLAN.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
const pointer=json('CURRENT_CHECKPOINT.json');pointer.activeWork.pendingReviewTourFollowups={stage,receipt:stage+'/PLAN.json',sha256:sha(read(stage+'/PLAN.json')),
 phase:result.phase,repairs:repairs.length,additions:additionalFiles.length,alreadyPresent:alreadyPresent.length,sourceReceiptSha256:result.sourceReceiptSha256,
 candidateChanged:false,sourceOnlyProofsMainExecuted:true,proposalsOffDeviceBackedUp:false,next:result.next};
pointer.activeWork.updated=result.at;
fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({receipt:stage+'/PLAN.json',sha256:sha(read(stage+'/PLAN.json')),repairs:repairs.length,additions:additionalFiles.length,alreadyPresent:alreadyPresent.length,nextNativeRoots:result.proposedNextNativeRoots.length,candidateChanged:false}));
