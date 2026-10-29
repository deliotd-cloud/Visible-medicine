import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {predecessorDeliverySource} from './current-delivery-predecessor-inverse.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url));
const sha=b=>createHash('sha256').update(b).digest('hex');
const oldBytes=read('tests/fixtures/review-rebinding-before-e797.json');
assert.equal(sha(oldBytes),'7b14a7455de0b87e781192d5b1072c9c17c42ab5611c96247a0e7e677b416ac8');
const old=JSON.parse(oldBytes);
test('Review presentation rebinding preserves native and model identities while rejecting the old presentation pin',()=>{
 const pin=validateCurrentAtlasDelivery();assert.throws(()=>validateCurrentAtlasDelivery({pin:old}));
 assert.equal(pin.reviewIntegration,'e797853ed87cb3d4dc39a1addafa55aa7962394bc1e961a14c83ca0b54f9f510');
 const restored=structuredClone(pin);restored.reviewIntegration=old.reviewIntegration;
 for(const p of ["atlas-review/manifest.json","atlas-review/integration-inputs.json","public/atlas-review-viewer/manifest.json"])restored.documents[p]=old.documents[p];
 assert.deepEqual(restored,old);
});
test('rebinding retains the entire prior contract and rejects changes outside the two current count seams',()=>{
 const source=read('tests/current-atlas-delivery.test.mjs').toString();
 assert.equal(sha(source.replaceAll(',1852',',1851')),'101be6f4288eff0f4c351207260095c32e86cfe02f38c1df218c420c0c5241ee');
 assert.equal(sha(predecessorDeliverySource(source)),'ad5a1db42623b9a35d023c5b867a85a6cc776c8cf4982c1d2664628161bf900e');
 assert.throws(()=>predecessorDeliverySource(source.replace("assert.throws(()=>validateCurrentAtlasDelivery({pin:old}));",'')));
 assert.throws(()=>predecessorDeliverySource(source+'\n// unexpected change'));
});
