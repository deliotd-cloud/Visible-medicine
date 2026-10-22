import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync, realpathSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import test from 'node:test';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {restorePreExpansionFrame} from './expansion-frame-adoption-inverse.mjs';

const websiteRoot=resolve(process.env.VM_WEBSITE_ROOT ?? process.cwd());
const frozenRoot=join(dirname(fileURLToPath(import.meta.url)),'fixtures/drawable-epoch-preimage');
const faRoot=join(dirname(fileURLToPath(import.meta.url)),'fixtures/colic-fa1-preimage');
const readFa=path=>readFileSync(join(faRoot,path));
const faBindingMoves=new Set([
 'atlas-review/app/body-content.ts','atlas-review/content/body-review-display-pins.json',
 'atlas-review/content/regional-teaching/abdomen.json','docs/anatomy-coverage/index.json',
 'lib/anatomy-coverage-view.ts','scripts/import-clinical-review.mjs',
]);
const readLive=path=>readFileSync(join(websiteRoot,path));
const readOld=path=>readFileSync(join(frozenRoot,'documents',path));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const framePath='components/AtlasRuntimeFrame.tsx';
const binderPath='scripts/bind-clinical-review.mjs';
const frozenFrame=()=>{
 const live=readLive(framePath),priorFrame=readFileSync(join(websiteRoot,'tests/fixtures/atlas-runtime-expansion-before-20261022/AtlasRuntimeFrame.tsx.raw'));
 assert.equal(sha(live),'7d4d9d36f5f8b7a88477355ba76b3adb4e93d080cff9356dfe5725f3fc6c76d8','Exact later same-tab frame');
 assert.equal(sha(priorFrame),'335b8b70b2ff60c3a951efb9eb18d98de8d230411c00896ff4a4123eff051261','Exact c4a/fa1 frame preimage');
 const restored=Buffer.from(restorePreExpansionFrame(live.toString('utf8')));
 assert.deepEqual(restored,priorFrame,'Whole current frame inverses to frozen binding source');
 return restored;
};
const frozenBinder=()=>{
 const live=readLive(binderPath),priorBinder=readFileSync(join(websiteRoot,'tests/fixtures/atlas-runtime-expansion-before-20261022/bind-clinical-review.mjs.raw'));
 const addition="  'components/atlas-runtime-expansion.ts','components/atlas-runtime-frame.css',\n";
 assert.equal(sha(live),'0339eedafdc65e60fb35efd7f59c839a57afa274966c405e4b373f8722f95d06','Exact later same-tab binder');
 assert.equal(sha(priorBinder),'d8ce02c58eba914cc3243714c59dd35cbc0c38f7ddab90df626b14fdf0c7ef8d','Exact c4a/fa1 binder preimage');
 assert.equal(live.toString('utf8').split(addition).length,2,'One authenticated binder addition');
 const restored=Buffer.from(live.toString('utf8').replace(addition,''));
 assert.deepEqual(restored,priorBinder,'Whole current binder inverses to frozen binding source');
 return restored;
};
const prior=JSON.parse(readFileSync(join(frozenRoot,'current-atlas-delivery.json.raw')));
const pinBytes=readFa('current-atlas-delivery.json.raw');
const pin=JSON.parse(pinBytes);
const frameHistoryBytes=frozenFrame();
const binderHistoryBytes=frozenBinder();
const read=path=>Object.hasOwn(pin.documents,path)?readFa('documents/'+path+'.raw'):
 faBindingMoves.has(path)?readFa('binding-inputs/'+path+'.raw'):
 path===framePath?frameHistoryBytes:path===binderPath?binderHistoryBytes:readLive(path);
const source='fa1bf9a233c6989fef42b533bbbac9d6ab034311';
const tree='5418fc0ba22673c086edea7afe13617e34e69f98';
const review='0931a6f0042f2973a0d766c1c55f177f76bb3000867dad197e2bcc2ce6461823';
const independent='190a63238eadcf906abe89dcbb6a67c88afe70b9';
const changedDocuments=[
 'atlas-review/manifest.json','atlas-review/integration-inputs.json',
 'public/atlas-review-viewer/manifest.json','lib/atlas-model-inventory.json',
 'public/atlas-runtime/head-neck/manifest.json','public/atlas-runtime/head-neck/source-inputs.json',
];
const changedBindings=[
 'atlas-review/app/body-explorer.css','docs/anatomy-coverage/index.json',
 'lib/anatomy-coverage-view.ts','scripts/import-clinical-review.mjs',
];
const currentDelivery=await import(pathToFileURL(join(websiteRoot,'tests/current-atlas-delivery.mjs')).href);

test('fa1 current pin is exact, complete and separate from the frozen 0df/c4a pin',()=>{
 assert.equal(sha(pinBytes),'df332899853867a1f36f5da5afdcf80a1a9b1868e9b26f29885df45f2583fde6');
 assert.equal(pin.schema,'vm-current-atlas-test-delivery-2');
 assert.equal(pin.source,source);
 assert.equal(pin.sourceTree,tree);
 assert.equal(pin.reviewIntegration,review);
 assert.equal(pin.reviewSourceFiles,1556);
 assert.equal(pin.viewerFiles,46);
 assert.equal(pin.viewerPackages,22);
 assert.deepEqual(pin.runtimeSources,{
  'head-neck':source,shoulder:independent,'lower-limb':independent,'female-pelvis':independent,
 });
 assert.deepEqual(Object.keys(pin.documents),Object.keys(prior.documents));
 assert.deepEqual(Object.keys(pin.documents).filter(path=>pin.documents[path]!==prior.documents[path]),changedDocuments);
 for(const path of Object.keys(prior.documents)){
  assert.equal(sha(readOld(path)),prior.documents[path],`Frozen 0df/c4a document: ${path}`);
  assert.equal(sha(read(path)),pin.documents[path],`Current fa1 document: ${path}`);
  if(!changedDocuments.includes(path))assert(read(path).equals(readOld(path)),`Unchanged independent runtime: ${path}`);
 }
 assert.equal(currentDelivery.CURRENT_ATLAS_REVISION,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
 assert.notEqual(currentDelivery.CURRENT_ATLAS_REVISION,source,'fa1 is authenticated history, not current');
 assert.deepEqual(currentDelivery.validateCurrentAtlasDelivery({pin,read}),pin);
 assert.equal(realpathSync(currentDelivery.currentAtlasDeliveryRoot()),realpathSync(resolve(process.env.VM_ATLAS_SOURCE_REPO)),
  'Live source root remains an exact clean checkout; current 6d7 admission is checked separately');
 assert.throws(()=>currentDelivery.validateCurrentAtlasDelivery({pin:prior}),
  'The former 0df/c4a pin is historical, never current admission');
});

test('only four source-bound inputs change; all teaching, auth and checklist binding rows persist',()=>{
 const before=JSON.parse(readOld('atlas-review/integration-inputs.json'));
 const after=JSON.parse(read('atlas-review/integration-inputs.json'));
 assert.equal(before.sha256,prior.reviewIntegration);
 assert.equal(after.sha256,review);
 assert.equal(before.inputs.length,1719);
 assert.equal(after.inputs.length,1719);
 assert.deepEqual(after.inputs.map(row=>row.path),before.inputs.map(row=>row.path));
 assert.deepEqual(after.inputs.filter((row,i)=>row.sha256!==before.inputs[i].sha256).map(row=>row.path),changedBindings);
 assert.equal(after.inputs.find(row=>row.path===framePath)?.sha256,sha(frameHistoryBytes),'Frozen fa1 frame binding');
 assert.equal(after.inputs.find(row=>row.path===binderPath)?.sha256,sha(binderHistoryBytes),'Frozen fa1 binder binding');
 for(const row of after.inputs)assert.equal(sha(read(row.path)),row.sha256,row.path);
 const oldReview=JSON.parse(readOld('atlas-review/manifest.json'));
 const newReview=JSON.parse(read('atlas-review/manifest.json'));
 assert.equal(oldReview.files.length,1556);
 assert.equal(newReview.files.length,1556);
 assert.deepEqual(newReview.files.map(row=>row.path),oldReview.files.map(row=>row.path));
 assert.deepEqual(newReview.files.filter((row,i)=>row.importedSha256!==oldReview.files[i].importedSha256).map(row=>row.path),[
  'content/body-renderer-revision.json','content/review-revisions.json','app/body-explorer.css',
 ]);
 const oldInventory=JSON.parse(readOld('lib/atlas-model-inventory.json'));
 const newInventory=JSON.parse(read('lib/atlas-model-inventory.json'));
 assert.deepEqual(newInventory.models,oldInventory.models,'Model paths, bytes and geometry inventory stay exact');
 assert.deepEqual(newInventory.sources.filter(row=>row.module!=='head-neck'),
  oldInventory.sources.filter(row=>row.module!=='head-neck'));
});

test('repinned bytes cannot turn independent families or Review into the new source',()=>{
 for(const family of ['shoulder','lower-limb','female-pelvis']){
  const bad=structuredClone(pin);
  bad.runtimeSources[family]=source;
  assert.throws(()=>currentDelivery.validateCurrentAtlasDelivery({pin:bad,read}),family);
 }
 const bad=structuredClone(pin);
 bad.reviewIntegration=prior.reviewIntegration;
 assert.throws(()=>currentDelivery.validateCurrentAtlasDelivery({pin:bad,read}));
 const foreign=structuredClone(pin);
 foreign.documents['.env.local']='0'.repeat(64);
 assert.throws(()=>currentDelivery.validateCurrentAtlasDelivery({pin:foreign,read}));
});
