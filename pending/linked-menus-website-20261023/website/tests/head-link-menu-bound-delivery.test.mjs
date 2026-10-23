import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import test from 'node:test';import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
const site=fileURLToPath(new URL('../',import.meta.url)),stage=path.dirname(site.replace(/[\\/]$/,''));
const read=p=>fs.readFileSync(path.join(site,p)),json=p=>JSON.parse(read(p)),sha=b=>createHash('sha256').update(b).digest('hex');
const prep=JSON.parse(fs.readFileSync(stage+'/PREPARATION.json'));
const proposal=JSON.parse(fs.readFileSync(prep.proposal)),parent=JSON.parse(fs.readFileSync(prep.parentReceipt));
const prior=p=>fs.readFileSync(parent.website+'/'+p),oldInputs=JSON.parse(prior('atlas-review/integration-inputs.json'));

test('the source-authentic comparison and tour components reach the integrated candidate without edits',()=>{
 for(const p of [...proposal.changedPaths,...proposal.addedPaths]){
  const r=proposal.sourceRows.find(r=>r.path===p);assert(r);assert.equal(sha(read(p)),r.sha256,p);
 }
 const binder=read('scripts/bind-clinical-review.mjs').toString();
 const old="'components/HeadAtlasComparisonNavigation.tsx','components/HeadAtlasViewer.tsx'";
 const added="'components/HeadAtlasComparisonNavigation.tsx','components/HeadAtlasLearningPicker.tsx','components/HeadAtlasViewer.tsx'";
 assert.equal(binder.split(added).length-1,1);assert.equal(binder.replace(added,old),prior('scripts/bind-clinical-review.mjs').toString());
 const currentTest=read('tests/current-atlas-delivery.test.mjs').toString();
 assert.equal(currentTest.split('assert.equal(inputs,1740)').length-1,1);
 assert.equal(currentTest.replace('assert.equal(inputs,1740)','assert.equal(inputs,1739)'),prior('tests/current-atlas-delivery.test.mjs').toString());
 for(const p of ['lib/head-atlas-links.ts','lib/head-atlas-navigation.ts','lib/head-live-selection.ts','lib/head-disclosure-keyboard.ts','lib/atlas-model-inventory.json','lib/atlas-delivery-policy.ts','package.json','package-lock.json','LICENSES/THIRD_PARTY_NOTICES.md','app/atlas/head-neck-3d/head-learning.css'])assert.deepEqual(read(p),prior(p),p);
});

test('the review binding covers the newly admitted tour picker plus exactly two changed original inputs',()=>{
 const inputs=json('atlas-review/integration-inputs.json');assert.equal(inputs.inputs.length,1740);
 const expected=[...oldInputs.inputs.map(r=>['scripts/bind-clinical-review.mjs','components/HeadAtlasComparisonNavigation.tsx'].includes(r.path)?{...r,sha256:sha(read(r.path))}:r),
  {path:'components/HeadAtlasLearningPicker.tsx',sha256:sha(read('components/HeadAtlasLearningPicker.tsx'))}].sort((a,b)=>a.path.localeCompare(b.path));
 assert.deepEqual(inputs.inputs,expected);assert.equal(inputs.sha256,sha(JSON.stringify(expected)));
 assert.equal(new Set(inputs.inputs.map(r=>r.path)).size,1740);
 for(const r of inputs.inputs)assert.equal(sha(read(r.path)),r.sha256,r.path);
 const body=json('atlas-review/content/body-renderer-revision.json'),oldBody=JSON.parse(prior('atlas-review/content/body-renderer-revision.json'));
 assert.equal(body.sourceRendererSha256,oldBody.sourceRendererSha256);assert.equal(body.websiteIntegrationSha256,inputs.sha256);
 assert.equal(body.sha256,sha(JSON.stringify({source:body.sourceRendererSha256,website:inputs.sha256})));assert.notEqual(body.sha256,oldBody.sha256);
 assert.deepEqual({...body,sha256:oldBody.sha256,websiteIntegrationSha256:oldBody.websiteIntegrationSha256},oldBody);
 const shoulder=json('atlas-review/content/review-revisions.json'),oldShoulder=JSON.parse(prior('atlas-review/content/review-revisions.json'));
 assert.deepEqual(shoulder.sourceRevisions,oldShoulder.sourceRevisions);
 const revisions=structuredClone(shoulder.sourceRevisions);for(const tracks of Object.values(revisions))for(const track of ['geometry','teaching'])if(tracks[track]!==null)tracks[track]=sha(JSON.stringify({source:tracks[track],website:inputs.sha256}));
 assert.deepEqual(shoulder.revisions,revisions);assert.deepEqual({...shoulder,revisions:oldShoulder.revisions,websiteIntegrationSha256:oldShoulder.websiteIntegrationSha256},oldShoulder);
});

// Execute every stock verifier assertion. Child coverage/plexus checks are inert
// here and separately exercised by the actual native verify/prebuild commands.
const verifier=read('scripts/verify-clinical-review.mjs').toString();
const importLines=verifier.match(/^import .*\r?\n/gm);assert.equal(importLines.length,5);
const body=verifier.replace(/^import .*\r?\n/gm,'');
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
async function stockVerify(overrides=new Map()){
 const calls=[];const run=new AsyncFunction('assert','readFileSync','createHash','verifyPlexusReview','verifyAnatomyCoverageView','console',body);
 await run(assert,p=>{
  assert.equal(typeof p,'string');const target=path.resolve(site,p);assert(target.startsWith(path.resolve(site)+path.sep));
  return overrides.has(p)?overrides.get(p):read(p);
 },createHash,()=>{calls.push('plexus');return {};},async()=>{calls.push('coverage');return {};},{log(){}});
 return calls;
}
test('the actual verifier refuses a tampered picker, changed comparison and stale binding',async()=>{
 assert.deepEqual(await stockVerify(),['coverage','plexus']);
 for(const p of ['components/HeadAtlasLearningPicker.tsx','components/HeadAtlasComparisonNavigation.tsx']){
  await assert.rejects(()=>stockVerify(new Map([[p,Buffer.concat([read(p),Buffer.from('\n// altered')])]])),new RegExp('Review input changed; rebind and rebuild: '+p.replaceAll('.','\\.')));
 }
 await assert.rejects(()=>stockVerify(new Map([['atlas-review/integration-inputs.json',prior('atlas-review/integration-inputs.json')]])));
});

test('the current pin matches production artifacts and rejects the prior presentation without granting clearance',()=>{
 const pin=validateCurrentAtlasDelivery();assert.equal(pin.source,parent.atlasHead);assert.equal(pin.sourceTree,parent.atlasTree);
 assert.notEqual(pin.reviewIntegration,parent.reviewBindingSha256);
 assert.throws(()=>validateCurrentAtlasDelivery({pin:JSON.parse(prior('tests/fixtures/current-atlas-delivery.json'))}));
 const viewer=json('public/atlas-review-viewer/manifest.json'),oldViewer=JSON.parse(prior('public/atlas-review-viewer/manifest.json'));
 assert.equal(viewer.mode,'production');assert.equal(viewer.personalRecordsIncluded,false);assert.equal(viewer.files.length,46);assert.equal(viewer.packages.length,22);assert.deepEqual(viewer.packages,oldViewer.packages);
 assert.deepEqual(read('public/atlas-review-viewer/THIRD_PARTY_NOTICES.txt'),prior('public/atlas-review-viewer/THIRD_PARTY_NOTICES.txt'));
 for(const r of viewer.files)assert.equal(sha(read('public/atlas-review-viewer/'+r.path)),r.sha256);
});
