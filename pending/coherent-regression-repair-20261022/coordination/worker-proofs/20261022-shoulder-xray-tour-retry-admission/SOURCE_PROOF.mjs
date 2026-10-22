import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';

// Source bytes only: no tests, TS transpilation, SSR, validator or build execution.
const website='F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate/website';
const atlas='F:/VisibleMedicine/atlas';
const stage='F:/VisibleMedicine/staging/20261022-shoulder-xray-tour-retry-admission';
const read=(base,path)=>readFileSync(join(base,path));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const pinned={
  'tests/atlas-shoulder-soft-xray-delivery.test.ts':'1427c2be2e3123b70c425be26cdc962356e0a08588f8ee3f60454915c5e4208e',
  'tests/atlas-tour-retry.test.ts':'62573605849a788dc50c68a9e2a2bae8537653d2448e19a4ab67951b21067e75',
  'tests/current-atlas-delivery.mjs':'52551fd5ec16154a78b94f78e0cdfbfee6a1bea629f70714f3dd5f93ccb81bb5',
  'tests/fixtures/current-atlas-delivery.json':'db46c1722ed839a4c8a57bd9bad4028dd90f5cb765641172ab4cdc9581e0d80f',
};
for(const [path,hash] of Object.entries(pinned))assert.equal(sha(read(website,path)),hash,`frozen source drift: ${path}`);
const tour=read(website,'tests/atlas-tour-retry.test.ts');
assert.deepEqual(tour,read(stage,'tests/preimages/atlas-tour-retry.test.ts.raw'));
assert.equal((tour.toString('utf8').match(/^test\(/gm)||[]).length,1);
const original=read(stage,'tests/preimages/atlas-shoulder-soft-xray-delivery.test.ts.raw');
const proposal=read(stage,'tests/atlas-shoulder-soft-xray-delivery.test.ts');
assert.deepEqual(original,read(website,'tests/atlas-shoulder-soft-xray-delivery.test.ts'));
assert.equal(sha(proposal),'b037ecec7035ebfa1c7f78be8e38a6e1f02778a42b85725ed6a42c50f0c6ffe3');
const inverse=[
  [" const runtimeSource=execFileSync('git',['show',`${pin.runtimeSources.shoulder}:${path}`],{cwd:currentAtlasDeliveryRoot(),maxBuffer:32e6,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});\r\n",''],
  [" assert(entry,path);assert.equal(review.revision,pin.source);assert.equal(manifest.sourceCommit,pin.runtimeSources.shoulder);\r\n",
   " assert(entry,path);assert.equal(review.revision,pin.source);assert.equal(manifest.sourceCommit,pin.source);\r\n"],
  [" assert.deepEqual(inputs.filter((row:{path:string})=>row.path===path),[{path,sha256:sha(runtimeSource)}]);\r\n",
   " assert.deepEqual(inputs.filter((row:{path:string})=>row.path===path),[{path,sha256:sha(source)}]);\r\n"],
];
function verifyInverse(text){
  let restored=text;
  for(const [added,prior] of inverse){
    assert.equal(restored.split(added).length,2,`nonunique inverse seam: ${added}`);
    restored=restored.replace(added,prior);
  }
  assert.deepEqual(Buffer.from(restored,'utf8'),original,'whole historical and current X-ray test did not restore');
}
const candidateText=proposal.toString('utf8');
verifyInverse(candidateText);
for(const changed of [
  candidateText.replace(inverse[0][0],''),
  candidateText+inverse[2][0],
  candidateText.replace(inverse[1][0],inverse[1][0].replace('pin.runtimeSources.shoulder','pin.source')),
])assert.throws(()=>verifyInverse(changed),'source inverse must refuse a missing, duplicated or substituted runtime seam');
for(const bytes of [original,proposal,tour]){
  const value=bytes.toString('utf8');
  assert.equal((value.match(/\r\n/g)||[]).length,(value.match(/\n/g)||[]).length,'CRLF representation changed');
}
assert.equal((proposal.toString('utf8').match(/^test\(/gm)||[]).length,2);
assert.match(original.toString('utf8'),/assert\.throws\(\(\)=>validateCurrentAtlasDelivery\(/);
assert.match(tour.toString('utf8'),/assert\.throws\(\(\)=>validateCurrentAtlasDelivery\(/);

const pin=JSON.parse(read(website,'tests/fixtures/current-atlas-delivery.json'));
assert.equal(pin.source,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
assert.equal(pin.runtimeSources.shoulder,'190a63238eadcf906abe89dcbb6a67c88afe70b9');
assert.equal(pin.runtimeSources['head-neck'],pin.source);
for(const path of [
  'public/atlas-runtime/shoulder/manifest.json',
  'public/atlas-runtime/shoulder/source-inputs.json',
  'public/atlas-runtime/head-neck/manifest.json',
  'public/atlas-runtime/head-neck/source-inputs.json',
  'atlas-review/manifest.json',
])assert.equal(sha(read(website,path)),pin.documents[path],`pinned delivery document drift: ${path}`);
const shoulder=JSON.parse(read(website,'public/atlas-runtime/shoulder/manifest.json'));
const shoulderInputs=JSON.parse(read(website,'public/atlas-runtime/shoulder/source-inputs.json'));
const head=JSON.parse(read(website,'public/atlas-runtime/head-neck/manifest.json'));
const headInputs=JSON.parse(read(website,'public/atlas-runtime/head-neck/source-inputs.json'));
const review=JSON.parse(read(website,'atlas-review/manifest.json'));
assert.equal(shoulder.sourceCommit,pin.runtimeSources.shoulder);
assert.equal(head.sourceCommit,pin.source);
assert.equal(review.revision,pin.source);
const committed=(revision,path)=>execFileSync('git',['--no-replace-objects','show',`${revision}:${path}`],{cwd:atlas,maxBuffer:32e6,windowsHide:true});
const xray='lib/shoulder-soft-tissue-xray.ts';
const runtimeHash=sha(committed(pin.runtimeSources.shoulder,xray));
const reviewHash=sha(committed(pin.source,xray));
assert.deepEqual(shoulderInputs.filter(row=>row.path===xray),[{path:xray,sha256:runtimeHash}]);
const xrayReview=review.files.filter(row=>row.path===xray);
assert.equal(xrayReview.length,1);
assert.equal(xrayReview[0].sourceSha256,reviewHash);
assert.equal(xrayReview[0].importedSha256,sha(read(website,`atlas-review/${xray}`)));
for(const path of ['app/regional-guided-learning.tsx','lib/anatomy-load-retry.ts','app/body-scene.tsx']){
  const sourceHash=sha(committed(pin.source,path));
  const input=headInputs.filter(row=>row.path===path);
  const imported=review.files.filter(row=>row.path===path);
  assert.equal(input.length,1);assert.equal(imported.length,1);
  assert.equal(input[0].sha256,sourceHash,`head-neck current input: ${path}`);
  assert.equal(imported[0].sourceSha256,sourceHash,`current Review source: ${path}`);
}
process.stdout.write(JSON.stringify({status:'PASS_SOURCE_ONLY',xrayOriginalSha256:sha(original),xrayProposalSha256:sha(proposal),tourUnchangedSha256:sha(tour),xrayRuntimeRevision:pin.runtimeSources.shoulder,xrayReviewRevision:pin.source,tourHeadRevision:pin.runtimeSources['head-neck'],xrayTests:2,tourTests:1,inverseSeams:inverse.length})+'\n');
