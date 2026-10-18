import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {projectCoverageView,COVERAGE_SOURCE_REVISION,COVERAGE_SNAPSHOT_REVISION} from '../lib/anatomy-coverage-view.ts';
import {ATLAS_DELIVERY_POLICY} from '../lib/atlas-delivery-policy.ts';
const json=p=>JSON.parse(readFileSync(p)),sha=b=>createHash('sha256').update(b).digest('hex');
const source='589263554141ba94548f9073327d4e51674bc33b',priorSource='f1dc0ccc54ec82aa774720db3c822d3e0ea9c418',oldSource='8d32653eaac8b86521618c824214dd6af8e35e29';
const frozen='F:/VisibleMedicine/recovery/checkpoints/20261016-intracranial-us-integration/website-overlay/source';
const frozenManifest=json('F:/VisibleMedicine/recovery/checkpoints/20261016-intracranial-us-integration/website-overlay/manifest.json');
const historicalPaths=['docs/anatomy-coverage/index.json','atlas-review/manifest.json','lib/atlas-model-inventory.json','lib/anatomy-coverage-view.ts','lib/atlas-delivery-policy.ts'];
function verifiedFrozen(read=path=>readFileSync(frozen+'/'+path)){
 for(const path of historicalPaths){
  const record=frozenManifest.files.find(file=>file.path===path);assert(record,path);
  const bytes=read(path);
  assert.equal(sha(bytes),record.sha256,'Frozen checkpoint changed: '+path);
  assert.equal(bytes.length,record.size,'Frozen checkpoint size changed: '+path);
 }
}
const historicalCoverage=()=>import(pathToFileURL(frozen+'/lib/anatomy-coverage-view.ts').href);
const historicalPolicy=()=>import(pathToFileURL(frozen+'/lib/atlas-delivery-policy.ts').href);
const before=json('tests/fixtures/anatomy-coverage-8d32653e.json'),prior=json('tests/fixtures/anatomy-coverage-f1dc0ccc.json');
const after=json(frozen+'/docs/anatomy-coverage/index.json'),review=json(frozen+'/atlas-review/manifest.json');
test('exact previous coverage inventory and all anatomical holds survive the teaching-only transition',async()=>{
 verifiedFrozen();
 const {COVERAGE_SOURCE_REVISION:historicalSource,COVERAGE_SNAPSHOT_REVISION:historicalSnapshot}=await historicalCoverage();
 assert.equal(before.sourceRevision,oldSource);assert.equal(sha(JSON.stringify(before)),'812f2ad805b2ce0b311e098eb33415019694fb55b872e32d8d09c0d7def8d311');
 assert.equal(prior.sourceRevision,priorSource);assert.equal(sha(JSON.stringify(prior)),'e8e3fcd13421f10b3ab0f0cac6f1fedf5dcf824358e58264906d2a2956c9d002');
 assert.equal(after.sourceRevision,source);assert.equal(historicalSource,source);assert.equal(sha(JSON.stringify(after)),historicalSnapshot);
 for(const key of ['schema','scopedCounts','documentedRootTargetGroups','independentWithheldSourceCatalogs','referenceBacklog','assessment','remainingScope','countingRules']){assert.deepEqual(prior[key],before[key],`8d to f1 ${key}`);assert.deepEqual(after[key],prior[key],`f1 to 589 ${key}`);}
 const oldInputs=before.evidence.sourceInputs,priorInputs=prior.evidence.sourceInputs,inputs=after.evidence.sourceInputs;
 assert.deepEqual(Object.keys(priorInputs),Object.keys(oldInputs));assert.deepEqual(Object.keys(inputs),Object.keys(priorInputs));assert.equal(Object.keys(inputs).length,167);
 assert.deepEqual(Object.keys(priorInputs).filter(p=>priorInputs[p]!==oldInputs[p]),['package.json']);
 assert.equal(priorInputs['package.json'],'c9c047b61e2d8252bb3aa6fe52150412ec7d590f3461551766206e98598f6868');
 assert.equal(oldInputs['package.json'],'520c2bca09743e299a8a4e5522cd060df9fe7697a501dc644271e63f874eb9e6');
 assert.deepEqual(Object.keys(inputs).filter(p=>inputs[p]!==priorInputs[p]),['package.json']);
 assert.equal(inputs['package.json'],'fd90fee78ca19522ffc4604c7351fcea0e88a464385f8a84d806f5364637a5a8');
 assert.equal(after.assessment.anatomicalCompletenessProven,false);assert.equal(after.assessment.clinicalApprovalAsserted,false);
});
test('historical 589 coverage projects only its exact imported source and rejects old, mixed and altered inputs',async()=>{
 verifiedFrozen();
 const {projectCoverageView:historicalProject}=await historicalCoverage();
 const view=await historicalProject(after,review);assert(view);assert.equal(view.sourceRevision,source);
 assert.deepEqual(view.counts,{root:1104,nested:108,specimenViews:9,specimenMemberships:356,specimenSelections:267,shoulder:9});
 assert.equal(await historicalProject(before,review),null);
 assert.equal(await historicalProject(prior,review),null);
 const mixed=structuredClone(review);mixed.revision=oldSource;assert.equal(await historicalProject(after,mixed),null);
 const changed=structuredClone(after);changed.documentedRootTargetGroups[0].state='complete';assert.equal(await historicalProject(changed,review),null);
 const forged=structuredClone(review),path=Object.keys(after.evidence.sourceInputs).find(p=>forged.files.some(f=>f.path===p));assert(path);forged.files.find(f=>f.path===path).importedSha256='0'.repeat(64);assert.equal(await historicalProject(after,forged),null);
});
test('historical private registered model delivery changes metadata only and preserves every model byte identity',async()=>{
 verifiedFrozen();
 const {ATLAS_DELIVERY_POLICY:historicalDeliveryPolicy}=await historicalPolicy();
 const oldBytes=readFileSync('tests/fixtures/atlas-model-inventory-8d32653e.json'),bytes=readFileSync(frozen+'/lib/atlas-model-inventory.json'),old=JSON.parse(oldBytes),next=JSON.parse(bytes);
 const priorBytes=readFileSync('tests/fixtures/atlas-model-inventory-f1dc0ccc.json'),priorInventory=JSON.parse(priorBytes);
 assert.equal(sha(oldBytes),'56090796195feead0298e3fe2cd092191f0ab4456c2c669ca0c7e311f90ae71b');
 assert.equal(sha(priorBytes),'b977e46905346409479bd74447dbb0df72ae78f49784ae2c93f59dd13032cfce');
 assert.equal(historicalDeliveryPolicy.manifestRevision,sha(bytes));assert.equal(historicalDeliveryPolicy.audience,'administrator-review');assert(!Object.hasOwn(historicalDeliveryPolicy,'approvedRevision'));
 assert.deepEqual(priorInventory.models,old.models);assert.deepEqual(next.models,priorInventory.models);assert.equal(next.models.length,137);assert.equal(next.models.flatMap(m=>m.paths).length,144);assert.equal(next.models.reduce((n,m)=>n+m.bytes,0),199072480);
 assert.deepEqual(next.sources.map(s=>s.module),old.sources.map(s=>s.module));for(const row of next.sources)assert.equal(row.sourceCommit,source);for(const row of priorInventory.sources)assert.equal(row.sourceCommit,priorSource);for(const row of old.sources)assert.equal(row.sourceCommit,oldSource);
});

test("previous cervical source assertions remain hash-frozen",()=>{
 assert.equal(sha(readFileSync('tests/fixtures/atlas-cervical-source-transition-4e9f5385.txt')),'786f67f4a49e020ece4ee4541db8c19e4c875e0cba3445666eac291f298a3c39');
 assert.equal(sha(readFileSync('tests/fixtures/atlas-cervical-projection-xray-4e9f5385.txt')),'84030d8a139e66bb0f31a99928df5fb7ee91c66b85a64c468aca0520a34413ec');
 assert.equal(sha(readFileSync('tests/fixtures/atlas-cervical-source-transition-f1dc0ccc.txt')),'a95804ea6a35c23719a8f56db505c9f20d0615765d2a82b1fb9e4ac142f5449d');
});


test('historical checkpoint refuses altered source bytes',()=>{
 assert.throws(()=>verifiedFrozen(path=>{
  const bytes=readFileSync(frozen+'/'+path);
  if(path!=='lib/anatomy-coverage-view.ts')return bytes;
  const changed=Buffer.from(bytes);changed[0]^=1;return changed;
 }),/Frozen checkpoint changed/);
});

test('current coverage admits only the fixture-bound bc925 source and rejects altered evidence',async()=>{
 const pin=validateCurrentAtlasDelivery();currentAtlasDeliveryRoot();
 assert.equal(pin.source,CURRENT_ATLAS_REVISION);
 const current=json('docs/anatomy-coverage/index.json'),currentReview=json('atlas-review/manifest.json');
 assert.equal(current.sourceRevision,pin.source);
 assert.equal(currentReview.revision,pin.source);
 assert.equal(COVERAGE_SOURCE_REVISION,pin.source);
 assert.equal(sha(JSON.stringify(current)),COVERAGE_SNAPSHOT_REVISION);
 const view=await projectCoverageView(current,currentReview);assert(view);
 assert.equal(view.sourceRevision,pin.source);
 assert.equal(await projectCoverageView(after,currentReview),null,'Historic source cannot be current');
 const forged=structuredClone(currentReview),path=Object.keys(current.evidence.sourceInputs).find(p=>forged.files.some(f=>f.path===p));assert(path);
 forged.files.find(f=>f.path===path).sourceSha256='0'.repeat(64);
 assert.equal(await projectCoverageView(current,forged),null,'Forged source input rejected');
});

test('current private model policy must match the fixture-bound inventory',()=>{
 const pin=validateCurrentAtlasDelivery(),bytes=readFileSync('lib/atlas-model-inventory.json');
 assert.equal(sha(bytes),pin.documents['lib/atlas-model-inventory.json']);
 assert.equal(ATLAS_DELIVERY_POLICY.audience,'administrator-review');
 assert(!Object.hasOwn(ATLAS_DELIVERY_POLICY,'approvedRevision'));
 assert.equal(ATLAS_DELIVERY_POLICY.manifestRevision,sha(bytes));
});
