import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateCurrentAtlasDelivery,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';
import {predecessorDeliverySource,restorePreRecoveryCurrentDeliverySource} from './current-delivery-predecessor-inverse.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url));
const sha=b=>createHash('sha256').update(b).digest('hex');
const oldBytes=read('tests/fixtures/review-rebinding-before-e797.json');
assert.equal(sha(oldBytes),'7b14a7455de0b87e781192d5b1072c9c17c42ab5611c96247a0e7e677b416ac8');
const old=JSON.parse(oldBytes);
test('Review presentation rebinding preserves native and model identities while rejecting the old presentation pin',()=>{
 const root='G:/VisibleMedicine-temp/staging/20261030-foot-context-layout/website';
 const bytes=readFileSync(root+'/tests/fixtures/current-atlas-delivery.json');
 assert.equal(sha(bytes),'ffce8ad93f602b3b4cfe3d963410d496aa5706ab22615a6757d87b1c09405e30','Authentic e797 presentation witness');
 const pin=validateCurrentAtlasDelivery({pin:JSON.parse(bytes),root});
 assert.throws(()=>validateCurrentAtlasDelivery({pin:old,root}));
 assert.equal(pin.reviewIntegration,'e797853ed87cb3d4dc39a1addafa55aa7962394bc1e961a14c83ca0b54f9f510');
 const restored=structuredClone(pin);restored.reviewIntegration=old.reviewIntegration;
 for(const p of ["atlas-review/manifest.json","atlas-review/integration-inputs.json","public/atlas-review-viewer/manifest.json"])restored.documents[p]=old.documents[p];
 assert.deepEqual(restored,old);
});
test('rebinding retains the entire prior contract and rejects changes outside the two current count seams',()=>{
 const source=read('tests/current-atlas-delivery.test.mjs').toString();
 const beforeRecovery=restorePreRecoveryCurrentDeliverySource(source);
 assert.equal(sha(beforeRecovery.replaceAll(',1852',',1851')),'101be6f4288eff0f4c351207260095c32e86cfe02f38c1df218c420c0c5241ee');
 assert.equal(sha(predecessorDeliverySource(source)),'ad5a1db42623b9a35d023c5b867a85a6cc776c8cf4982c1d2664628161bf900e');
 assert.throws(()=>predecessorDeliverySource(source.replace("assert.throws(()=>validateCurrentAtlasDelivery({pin:old}));",'')));
 assert.throws(()=>predecessorDeliverySource(source+'\n// unexpected change'));
});

test('current note-recovery rebinding preserves every native and model identity',()=>{
 const bytes=read('tests/fixtures/review-rebinding-before-head-note-recovery.json');
 assert.equal(sha(bytes),'2216d5cd77cdcf3455b7a8a276785b8a8f2e181a8ee7909473f1899e8e0f536e');
 const before=JSON.parse(bytes),pin=validateCurrentAtlasDelivery();
 assert.equal(pin.source,'c32bc81cf0fd7ec22fa83e8b1365019297f9a0b3');
 assert.equal(pin.reviewIntegration,'3648a75bdf7543a29047e74193231fad27afd450d9b0ebc7164393ba2a0d3b2f');
 assert.throws(()=>validateCurrentAtlasDelivery({pin:before}),'Old presentation cannot be accepted for current files');
 const restored=structuredClone(pin);restored.reviewIntegration=before.reviewIntegration;
 for(const path of ['atlas-review/manifest.json','atlas-review/integration-inputs.json','public/atlas-review-viewer/manifest.json'])restored.documents[path]=before.documents[path];
 assert.deepEqual(restored,before,'Only the exact three presentation documents and their binding changed');
 for(const field of ['source','sourceTree','reviewIntegration']){
  const altered=structuredClone(pin);altered[field]='0'.repeat(field==='reviewIntegration'?64:40);
  assert.throws(()=>currentAtlasDeliveryRoot({pin:altered}),field+': altered manifest/Git identity rejected');
 }
});
