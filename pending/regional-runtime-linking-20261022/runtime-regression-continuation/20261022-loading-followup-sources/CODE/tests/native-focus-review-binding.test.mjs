import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
const json=p=>JSON.parse(readFileSync(p)),sha=b=>createHash('sha256').update(b).digest('hex');
test('normal Review binding covers native image-focus dependencies and preserves source identity',()=>{
 const pin=validateCurrentAtlasDelivery(),review=json('atlas-review/manifest.json'),binding=json('atlas-review/integration-inputs.json');
 const historicalBytes=readFileSync('tests/fixtures/current-atlas-delivery-aaa8a6a4.json');
 assert.equal(sha(historicalBytes),'d0550d6202c5121489f16a1ce292226994d7f525c9c1d8da8b0822822ecb48d2');
 const historical=JSON.parse(historicalBytes);
 assert.equal(historical.source,'aaa8a6a428e74a2055310630f9dfee8731fe0eee');
 assert.equal(historical.sourceTree,'7c0b886d66d2adf64d6d29e44938f39d8cd61046');
 assert.equal(historical.reviewIntegration,'d7036f8da6dae70ead5f54469c8e8a9511a94aecfc8da3833d26f20476012e1b');
 assert.equal(historical.reviewSourceFiles,1544);
 assert.throws(()=>validateCurrentAtlasDelivery({pin:historical}));
 assert.equal(pin.source,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
 assert.equal(pin.sourceTree,'e9165d7122361f809a267af1414b337b69097fe2');
 assert.equal(review.revision,pin.source);assert.equal(review.files.length,pin.reviewSourceFiles);assert.equal(pin.reviewSourceFiles,1558);
 assert.equal(binding.sourceCommit,pin.source);assert.equal(binding.sha256,pin.reviewIntegration);assert.equal(binding.inputs.length,1724);assert.equal(sha(JSON.stringify(binding.inputs)),binding.sha256);
 for(const path of ['components/HeadAtlasViewer.tsx','components/ImagingAtlasShell.tsx','components/ImagingPaneNavigation.tsx','components/imaging-atlas-shell.css','lib/imaging-pane-focus.ts','scripts/bind-clinical-review.mjs']){
  const inputs=binding.inputs.filter(row=>row.path===path);assert.equal(inputs.length,1,path);assert.equal(inputs[0].sha256,sha(readFileSync(path)),path);
 }
});

test('frozen desktop-focus transition preserves its own learner and model identity but cannot admit current delivery',()=>{
 const beforeBytes=readFileSync('tests/fixtures/current-atlas-delivery-before-desktop-focus.json');
 const afterBytes=readFileSync('tests/fixtures/current-atlas-delivery-58926355.json');
 assert.equal(sha(beforeBytes),'978d254d315c1c9a54bcd268d47f1585549501561a276b6c5edd07ff19403216');
 assert.equal(sha(afterBytes),'3a29ea22a99e88869409f164ad50598e69106484e9b4f0603e4434e92d7df1f4');
 const previous=JSON.parse(beforeBytes),after=JSON.parse(afterBytes),pin=validateCurrentAtlasDelivery();
 assert.equal(previous.source,'589263554141ba94548f9073327d4e51674bc33b');
 assert.equal(previous.sourceTree,'ba724f0a46448132a6e5fc4c24f63730b53540f9');
 assert.equal(after.source,previous.source);assert.equal(after.sourceTree,previous.sourceTree);
 assert.equal(after.reviewSourceFiles,1511);
 assert.equal(previous.reviewIntegration,'464ccf522d725e5636fb3c14429e371402f1f0832d0feaeed3c025d6906e7990');
 assert.equal(after.reviewIntegration,'56b9e31355b4e8a1671738e7f7d106edfbfcdb6af5e3e1f6e2699b225baf1ce2');
 assert.notEqual(previous.reviewIntegration,after.reviewIntegration);
 assert.notEqual(after.source,pin.source);assert.notEqual(after.sourceTree,pin.sourceTree);
 assert.throws(()=>validateCurrentAtlasDelivery({pin:previous}));
 assert.throws(()=>validateCurrentAtlasDelivery({pin:after}));
 for(const module of ['head-neck','shoulder','lower-limb','female-pelvis'])for(const suffix of ['manifest.json','source-inputs.json']){
  const path=`public/atlas-runtime/${module}/${suffix}`;assert.equal(after.documents[path],previous.documents[path],path+' unchanged learner source in 589 transition');
 }
 assert.equal(after.documents['lib/atlas-model-inventory.json'],previous.documents['lib/atlas-model-inventory.json']);
});
