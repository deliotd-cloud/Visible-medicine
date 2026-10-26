import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url));
const json=path=>JSON.parse(read(path));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const frozen='tests/fixtures/current-delivery-before-help-d55/';
const oldPin=json(frozen+'current-atlas-delivery.json.raw');
const newPin=json('tests/fixtures/current-atlas-delivery.json');
const exact={
 'current-atlas-delivery.json.raw':'c149f5a673d3ae2dd32d95914c47d3e72993ee1d6925d009db3d3f733d5d2436',
 'current-atlas-delivery.mjs.raw':'02dd815603c922dedbdc5a5fce270fbda736b81220e335d750dcbec1124c833e',
 'current-atlas-delivery.test.mjs.raw':'6e1ba842cb4d2fdf2370c12df9ccbb1a42785369d7e042db6ed3b67048e99275',
 'integration-inputs.json.raw':'c063a72346a42b1e33e9c6b7064f28d91e25c1841608b5ec4bd2b0a782cefede',
};

test('the prior CURRENT fixture and complete test source are frozen; the validator is byte-exact',()=>{
 for(const [name,digest]of Object.entries(exact))assert.equal(sha(read(frozen+name)),digest,name);
 assert.deepEqual(read('tests/current-atlas-delivery.mjs'),read(frozen+'current-atlas-delivery.mjs.raw'));
 assert.equal(sha(read('tests/fixtures/current-atlas-delivery.json')),
  'd2f9892e3e7f32552d546098b438cad2e6242f8d1652b4a432809f964a5ed9bb');
 assert.deepEqual(read('tests/fixtures/current-atlas-delivery.json'),
  read('tests/fixtures/keyboard-help-current-atlas-delivery.json'));
});

test('only the verified presentation binding advances the CURRENT test context',()=>{
 const admitted=validateCurrentAtlasDelivery();
 assert.deepEqual(admitted,newPin);
 assert.equal(CURRENT_ATLAS_REVISION,'a01ea4a00740dee0905204a33893761b8ae1ff1e');
 assert(currentAtlasDeliveryRoot());
 for(const key of ['schema','source','sourceTree','reviewSourceFiles','viewerFiles','viewerPackages'])
  assert.deepEqual(newPin[key],oldPin[key],key);
 assert.deepEqual(newPin.runtimeSources,oldPin.runtimeSources);
 assert.equal(newPin.reviewSourceFiles,1614);
 assert.equal(newPin.viewerFiles,54);assert.equal(newPin.viewerPackages,24);
 assert(!Object.hasOwn(newPin,'clinicalApproval'));
 assert(!Object.hasOwn(newPin,'userAuthorized'));
 const changedDocs=['atlas-review/manifest.json','atlas-review/integration-inputs.json',
  'public/atlas-review-viewer/manifest.json'];
 assert.deepEqual(Object.keys(newPin.documents),Object.keys(oldPin.documents));
 assert.deepEqual(Object.keys(newPin.documents).filter(path=>newPin.documents[path]!==oldPin.documents[path]),changedDocs);
 for(const [path,digest]of Object.entries(newPin.documents))assert.equal(sha(read(path)),digest,path);
 assert.notEqual(newPin.reviewIntegration,oldPin.reviewIntegration);
 const before=json(frozen+'integration-inputs.json.raw'),after=json('atlas-review/integration-inputs.json');
 assert.equal(before.sha256,oldPin.reviewIntegration);
 assert.equal(after.sha256,newPin.reviewIntegration);
 assert.equal(after.sourceCommit,oldPin.source);
 assert.equal(before.inputs.length,1818);assert.equal(after.inputs.length,1818);
 assert.deepEqual(after.inputs.map(row=>row.path),before.inputs.map(row=>row.path));
 const changedInputs=after.inputs.filter((row,index)=>row.sha256!==before.inputs[index].sha256).map(row=>row.path);
 assert.deepEqual(changedInputs,['components/atlas-runtime-frame.css','components/AtlasRuntimeFrame.tsx']);
 for(const row of after.inputs)assert.equal(sha(read(row.path)),row.sha256,row.path);
 const review=json('atlas-review/manifest.json'),viewer=json('public/atlas-review-viewer/manifest.json');
 assert.equal(review.revision,oldPin.source);assert.equal(review.files.length,1614);
 assert.equal(review.websiteIntegrationSha256,newPin.reviewIntegration);
 assert.equal(viewer.sourceCommit,oldPin.source);assert.equal(viewer.websiteIntegrationSha256,newPin.reviewIntegration);
 assert.equal(viewer.files.length,54);assert.equal(viewer.packages.length,24);
 assert.throws(()=>validateCurrentAtlasDelivery({pin:oldPin}),/Current delivery changed/);
});

test('only explicit CURRENT expectations advance; every old case and inverse survives',()=>{
 const before=read(frozen+'current-atlas-delivery.test.mjs.raw').toString();
 const after=read('tests/current-atlas-delivery.test.mjs').toString();
 const seams=[
  [" assert.equal(CURRENT_ATLAS_REVISION,'a01ea4a00740dee0905204a33893761b8ae1ff1e');"," assert.equal(CURRENT_ATLAS_REVISION,'27b341001718b7d5bb4f45aad0c8d8784e287c3b');"],
  [" assert.equal(pin.sourceTree,'362941c8dd6348d985622c4a21686bbf14c135f7');"," assert.equal(pin.sourceTree,'32d418c517d3959089d443e2d374e362dc723157');"],
  ...["'head-neck'",'shoulder',"'lower-limb'","'female-pelvis'"].map(name=>
   [`  ${name}:'a01ea4a00740dee0905204a33893761b8ae1ff1e',`,`  ${name}:'27b341001718b7d5bb4f45aad0c8d8784e287c3b',`]),
  [' assert.equal(sourceFiles,1614);assert.equal(inputs,1818);assert(artifacts>100);',
   ' assert.equal(sourceFiles,1612);assert.equal(inputs,1816);assert(artifacts>100);'],
  [" assert.equal(admitted.source,'a01ea4a00740dee0905204a33893761b8ae1ff1e');assert.equal(admitted.sourceTree,'362941c8dd6348d985622c4a21686bbf14c135f7');",
   " assert.equal(admitted.source,'27b341001718b7d5bb4f45aad0c8d8784e287c3b');assert.equal(admitted.sourceTree,'32d418c517d3959089d443e2d374e362dc723157');"],
  [' assert.equal(admitted.reviewSourceFiles,1614);',' assert.equal(admitted.reviewSourceFiles,1612);'],
  [' assert.equal(review.files.length,1614);assert.equal(binding.inputs.length,1818);',
   ' assert.equal(review.files.length,1612);assert.equal(binding.inputs.length,1816);'],
  [" const current=read('tests/fixtures/current-delivery-before-help-d55/current-atlas-delivery.test.mjs.raw').toString();",
   " const current=read('tests/current-atlas-delivery.test.mjs').toString();"],
 ];
 let reconstructed=after;
 for(const [current,old]of seams){
  assert.equal(reconstructed.split(current).length,2,`One exact changed role: ${current}`);
  reconstructed=reconstructed.replace(current,old);
 }
 assert.equal(reconstructed,before,'The complete old test body is reconstructed byte-for-byte');
 const registrations=text=>[...text.matchAll(/^test\(['"]([^'"]+)['"]/gm)].map(match=>match[1]);
 assert.deepEqual(registrations(after),registrations(before));
 assert(!/\btest\.(?:skip|todo|only)\s*\(/.test(after));
});

test('the advanced pin rejects the retained previous presentation bytes',()=>{
 const oldDocuments={'atlas-review/manifest.json':'review-manifest.json.raw','atlas-review/integration-inputs.json':'integration-inputs.json.raw','public/atlas-review-viewer/manifest.json':'viewer-manifest.json.raw'};
 assert.throws(()=>validateCurrentAtlasDelivery({pin:newPin,read:path=>Object.hasOwn(oldDocuments,path)?read(frozen+oldDocuments[path]):read(path)}),/Current delivery changed/);
});
