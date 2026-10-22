import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {beforeCompactDeliveryTest,beforeCompactPin,compactInputs} from './review-frame-history-inverse.mjs';
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root));
const sha=b=>createHash('sha256').update(b).digest('hex');
test('all previous current-delivery assertions survive the enumerated helper and head navigator additions',()=>{
 const original=read('tests/fixtures/review-navigation-delivery/current-atlas-delivery.test.mjs.raw');
 assert.equal(sha(original),'8b6215fe75454f5d30ee128b994538ecf87db6748ff2f5ce193b47f9f0a3b250');
 const actual=beforeCompactDeliveryTest(read('tests/current-atlas-delivery.test.mjs').toString()),seam='assert.equal(inputs,1712)';
 assert.equal(actual.split(seam).length,2);
 assert.equal(actual.replace(seam,'assert.equal(inputs,1710)'),original.toString());
});
test('previous delivery receipt stays exact while only three generated Review documents change',()=>{
 const beforeBytes=read('tests/fixtures/review-navigation-delivery/current-atlas-delivery.json.raw');
 assert.equal(sha(beforeBytes),'b6301e20b714a67df82575f9f9b75f642fbf44310560444cfb537692bf5cef1f');
 const current=validateCurrentAtlasDelivery(),currentBinding=JSON.parse(read('atlas-review/integration-inputs.json'));
 assert.equal(currentBinding.inputs.length,1724);assert.equal(currentBinding.sourceCommit,current.source);
 const old=JSON.parse(beforeBytes),now=beforeCompactPin(read('tests/fixtures/current-atlas-delivery.json'));
 const changed=Object.keys(old.documents).filter(p=>old.documents[p]!==now.documents[p]).sort();
 assert.deepEqual(changed,['atlas-review/integration-inputs.json','atlas-review/manifest.json','public/atlas-review-viewer/manifest.json']);
 const inverse=structuredClone(now);inverse.reviewIntegration=old.reviewIntegration;inverse.documents=old.documents;assert.deepEqual(inverse,old);
 const binding=compactInputs();
 assert.equal(binding.inputs.length,1712);assert.equal(binding.inputs.filter(r=>r.path==='lib/clinical-review-navigation-guard.ts').length,1);
 assert.equal(binding.inputs.find(r=>r.path==='lib/clinical-review-navigation-guard.ts').sha256,sha(read('lib/clinical-review-navigation-guard.ts')));
});
