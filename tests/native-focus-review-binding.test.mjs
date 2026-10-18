import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
const json=p=>JSON.parse(readFileSync(p)),sha=b=>createHash('sha256').update(b).digest('hex');
test('normal Review binding covers native image-focus dependencies and preserves source identity',()=>{
 const pin=validateCurrentAtlasDelivery(),review=json('atlas-review/manifest.json'),binding=json('atlas-review/integration-inputs.json');
 assert.equal(review.revision,'589263554141ba94548f9073327d4e51674bc33b');assert.equal(review.files.length,1511);assert.equal(binding.sha256,pin.reviewIntegration);assert.equal(sha(JSON.stringify(binding.inputs)),binding.sha256);
 for(const path of ['components/HeadAtlasViewer.tsx','components/ImagingAtlasShell.tsx','components/ImagingPaneNavigation.tsx','components/imaging-atlas-shell.css','lib/imaging-pane-focus.ts','scripts/bind-clinical-review.mjs']){
  const inputs=binding.inputs.filter(row=>row.path===path);assert.equal(inputs.length,1,path);assert.equal(inputs[0].sha256,sha(readFileSync(path)),path);
 }
 const previous=json('tests/fixtures/current-atlas-delivery-before-desktop-focus.json');assert.equal(previous.source,pin.source);assert.equal(previous.sourceTree,pin.sourceTree);assert.notEqual(previous.reviewIntegration,pin.reviewIntegration);assert.throws(()=>validateCurrentAtlasDelivery({pin:previous}));
 for(const module of ['head-neck','shoulder','lower-limb','female-pelvis'])for(const suffix of ['manifest.json','source-inputs.json']){
  const path=`public/atlas-runtime/${module}/${suffix}`;assert.equal(pin.documents[path],previous.documents[path],path+' unchanged learner source');
 }
 assert.equal(pin.documents['lib/atlas-model-inventory.json'],previous.documents['lib/atlas-model-inventory.json']);
});
