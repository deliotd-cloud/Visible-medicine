import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,realpathSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import test from 'node:test';
import {fileURLToPath,pathToFileURL} from 'node:url';

const website=resolve(process.env.VM_WEBSITE_ROOT ?? process.cwd());
const source=resolve(process.env.VM_ATLAS_SOURCE_REPO ?? join(website,'..','atlas'));
const frozen=join(dirname(fileURLToPath(import.meta.url)),'fixtures/colic-fa1-preimage');
const read=path=>readFileSync(join(website,path));
const readOld=path=>readFileSync(join(frozen,path));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const fa='fa1bf9a233c6989fef42b533bbbac9d6ab034311';
const current='6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1';
const tree='e9165d7122361f809a267af1414b337b69097fe2';
const review='ae8413f4b4371381ad4451f7fb33478fa761330c35acbd95025d5bf8f3ebcd59';
const independent='190a63238eadcf906abe89dcbb6a67c88afe70b9';
const oldPin=JSON.parse(readOld('current-atlas-delivery.json.raw'));
const pinBytes=read('tests/fixtures/current-atlas-delivery.json');
const pin=JSON.parse(pinBytes);
const changedDocuments=[
 'atlas-review/manifest.json','atlas-review/integration-inputs.json',
 'public/atlas-review-viewer/manifest.json','lib/atlas-model-inventory.json',
 'public/atlas-runtime/head-neck/manifest.json','public/atlas-runtime/head-neck/source-inputs.json',
];
const addedBindings=[
 'atlas-review/content/colic-artery-ultrasound.ts','atlas-review/lib/colic-artery-ultrasound.ts',
];
const changedBindings=[
 'atlas-review/app/body-content.ts','atlas-review/content/body-review-display-pins.json',
 'atlas-review/content/regional-teaching/abdomen.json','docs/anatomy-coverage/index.json',
 'lib/anatomy-coverage-view.ts','scripts/import-clinical-review.mjs',
];
const addedImports=['lib/colic-artery-ultrasound.ts','content/colic-artery-ultrasound.ts'];
const changedImports=[
 'app/body-content.ts','content/body-renderer-revision.json','content/review-revisions.json',
 'content/body-review-display-pins.json','content/regional-teaching/abdomen.json',
];
const ids=[
 'vm:anatomy:body:abdomen:midline:vessel:middle-colic-artery',
 'vm:anatomy:body:abdomen:right:vessel:right-colic-artery',
];
const delivery=await import(pathToFileURL(join(website,'tests/current-atlas-delivery.mjs')).href);

test('corrected 6d7 current pin admits exact clean source and keeps fa1 as history',()=>{
 assert.equal(sha(pinBytes),'3e69cdcae68524ad65a6b542fa7c7d51180c676a3f43b187dcb39d55de95ddeb');
 assert.equal(pin.schema,'vm-current-atlas-test-delivery-2');
 assert.equal(pin.source,current);assert.equal(pin.sourceTree,tree);
 assert.equal(pin.reviewIntegration,review);assert.equal(pin.reviewSourceFiles,1558);
 assert.equal(pin.viewerFiles,46);assert.equal(pin.viewerPackages,22);
 assert.deepEqual(pin.runtimeSources,{'head-neck':current,shoulder:independent,
  'lower-limb':independent,'female-pelvis':independent});
 assert.deepEqual(Object.keys(pin.documents),Object.keys(oldPin.documents));
 assert.deepEqual(Object.keys(pin.documents).filter(path=>pin.documents[path]!==oldPin.documents[path]),changedDocuments);
 for(const path of Object.keys(pin.documents)){
  const old=readOld('documents/'+path+'.raw'),now=read(path);
  assert.equal(sha(old),oldPin.documents[path],path+' fa1');
  assert.equal(sha(now),pin.documents[path],path+' current');
  if(!changedDocuments.includes(path))assert(now.equals(old),path+' independent runtime bytes');
 }
 assert.equal(delivery.CURRENT_ATLAS_REVISION,current);
 assert.deepEqual(delivery.validateCurrentAtlasDelivery(),pin);
 assert.equal(realpathSync(delivery.currentAtlasDeliveryRoot()),realpathSync(source));
 assert.throws(()=>delivery.validateCurrentAtlasDelivery({pin:oldPin}),
  'Complete prior fa1 pin cannot silently become current 6d7 admission');
});

test('Review adds exactly two source files and binding inputs; all former declarations persist',()=>{
 const before=JSON.parse(readOld('documents/atlas-review/integration-inputs.json.raw'));
 const after=JSON.parse(read('atlas-review/integration-inputs.json'));
 assert.equal(before.sha256,oldPin.reviewIntegration);assert.equal(after.sha256,review);
 assert.equal(before.inputs.length,1719);assert.equal(after.inputs.length,1721);
 const prior=new Map(before.inputs.map(row=>[row.path,row.sha256]));
 assert.deepEqual(after.inputs.filter(row=>!prior.has(row.path)).map(row=>row.path),addedBindings);
 assert.deepEqual(after.inputs.filter(row=>prior.has(row.path)&&prior.get(row.path)!==row.sha256).map(row=>row.path),changedBindings);
 for(const row of before.inputs){
  const old=changedBindings.includes(row.path)?readOld('binding-inputs/'+row.path+'.raw'):read(row.path);
  assert.equal(sha(old),row.sha256,row.path+' fa1 source byte');
 }
 for(const row of after.inputs)assert.equal(sha(read(row.path)),row.sha256,row.path+' current source byte');
 const oldReview=JSON.parse(readOld('documents/atlas-review/manifest.json.raw'));
 const newReview=JSON.parse(read('atlas-review/manifest.json'));
 assert.equal(oldReview.files.length,1556);assert.equal(newReview.files.length,1558);
 const priorFiles=new Map(oldReview.files.map(row=>[row.path,row]));
 assert.deepEqual(newReview.files.filter(row=>!priorFiles.has(row.path)).map(row=>row.path),addedImports);
 assert.deepEqual(newReview.files.filter(row=>priorFiles.has(row.path)&&
  row.importedSha256!==priorFiles.get(row.path).importedSha256).map(row=>row.path),changedImports);
 for(const row of newReview.files){
  assert.equal(sha(read('atlas-review/'+row.path)),row.importedSha256,row.path+' imported byte');
  if(priorFiles.has(row.path)){
   const old=changedImports.includes(row.path)?readOld('imported-sources/'+row.path+'.raw'):read('atlas-review/'+row.path);
   assert.equal(sha(old),priorFiles.get(row.path).importedSha256,row.path+' old import authenticated');
   if(!changedImports.includes(row.path))assert.equal(row.importedSha256,priorFiles.get(row.path).importedSha256,row.path+' old import retained');
  }
  else assert.equal(sha(readFileSync(join(source,row.path))),row.sourceSha256,row.path+' new source byte');
 }
 const oldInventory=JSON.parse(readOld('documents/lib/atlas-model-inventory.json.raw'));
 const inventory=JSON.parse(read('lib/atlas-model-inventory.json'));
 assert.deepEqual(inventory.models,oldInventory.models,'All 137 models and 144 paths unchanged');
 assert.deepEqual(inventory.sources.filter(row=>row.module!=='head-neck'),
  oldInventory.sources.filter(row=>row.module!=='head-neck'),'Three independent runtime families unchanged');
});

test('only the two exact colic US lessons and review packets change; coverage facts remain',()=>{
 const oldAbdomen=JSON.parse(readOld('binding-inputs/atlas-review/content/regional-teaching/abdomen.json.raw'));
 const abdomen=JSON.parse(read('atlas-review/content/regional-teaching/abdomen.json'));
 assert.equal(oldAbdomen.entries.length,74);assert.equal(abdomen.entries.length,74);
 assert.deepEqual(abdomen.entries.map(row=>row.identity),oldAbdomen.entries.map(row=>row.identity));
 assert.deepEqual(abdomen.entries.filter((row,i)=>JSON.stringify(row)!==JSON.stringify(oldAbdomen.entries[i]))
  .map(row=>JSON.parse(row.identity).id),ids);
 for(const id of ids){
  const at=abdomen.entries.findIndex(row=>JSON.parse(row.identity).id===id);
  const before=oldAbdomen.entries[at],after=abdomen.entries[at];
  assert.equal(before.lessons.ultrasound.readiness,'pending');
  assert.equal(after.lessons.ultrasound.readiness,'draft');
  assert.deepEqual(Object.fromEntries(Object.entries(after.lessons).filter(([key])=>key!=='ultrasound')),
   Object.fromEntries(Object.entries(before.lessons).filter(([key])=>key!=='ultrasound')),id+' other tabs');
  assert.match(after.lessons.ultrasound.note,/radiologist review pending/i);
  assert.match(after.lessons.ultrasound.note,/No routine transabdominal/i);
  assert.match(after.lessons.ultrasound.note,/separate/i);
 }
 assert.match(abdomen.entries.find(row=>JSON.parse(row.identity).id===ids[0]).lessons.ultrasound.title,/Linear endoscopic ultrasound \(EUS\)/);
 assert.match(abdomen.entries.find(row=>JSON.parse(row.identity).id===ids[1]).lessons.ultrasound.title,/Intraoperative ultrasound \(IOUS\)/);
 const left='vm:anatomy:body:abdomen:left:vessel:left-colic-artery';
 assert.equal(abdomen.entries.find(row=>JSON.parse(row.identity).id===left).lessons.ultrasound.readiness,'pending');
 const oldPins=JSON.parse(readOld('binding-inputs/atlas-review/content/body-review-display-pins.json.raw'));
 const pins=JSON.parse(read('atlas-review/content/body-review-display-pins.json'));
 assert.equal(oldPins.pins.length,1104);assert.equal(pins.pins.length,1104);
 assert.deepEqual(pins.pins.filter((row,i)=>JSON.stringify(row)!==JSON.stringify(oldPins.pins[i])).map(row=>row.structureId),ids);
 const oldCoverage=JSON.parse(readOld('coverage-index.json.raw'));
 const coverage=JSON.parse(read('docs/anatomy-coverage/index.json'));
 assert.equal(oldCoverage.sourceRevision,fa);assert.equal(coverage.sourceRevision,current);
 for(const key of Object.keys(oldCoverage).filter(key=>!['sourceRevision','sourceArtifacts'].includes(key)))
  assert.deepEqual(coverage[key],oldCoverage[key],key+' unchanged coverage fact');
 assert.deepEqual(coverage.sourceArtifacts.map(row=>row.path),oldCoverage.sourceArtifacts.map(row=>row.path));
});

test('wrong-family, stale-Review, missing-document and private additions are refused',()=>{
 for(const family of ['shoulder','lower-limb','female-pelvis']){
  const bad=structuredClone(pin);bad.runtimeSources[family]=current;
  assert.throws(()=>delivery.validateCurrentAtlasDelivery({pin:bad}),family);
 }
 const stale=structuredClone(pin);stale.reviewIntegration=oldPin.reviewIntegration;
 assert.throws(()=>delivery.validateCurrentAtlasDelivery({pin:stale}));
 const missing=structuredClone(pin);delete missing.documents['atlas-review/manifest.json'];
 assert.throws(()=>delivery.validateCurrentAtlasDelivery({pin:missing}));
 const foreign=structuredClone(pin);foreign.documents['.env.local']='0'.repeat(64);
 assert.throws(()=>delivery.validateCurrentAtlasDelivery({pin:foreign}));
});
