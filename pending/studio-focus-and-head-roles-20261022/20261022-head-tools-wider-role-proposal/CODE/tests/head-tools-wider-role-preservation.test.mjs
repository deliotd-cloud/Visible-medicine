import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {restoreHeadToolsBefore20261022} from './head-tools-epoch-20261022.mjs';
import {beforeLoadingPin} from './review-frame-history-inverse.mjs';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const viewer='components/HeadAtlasViewer.tsx';
const oldViewer='tests/fixtures/head-toolbar-before-compaction-20261022.tsx.raw';
const oldBinding='tests/fixtures/head-tools-prior-integration-inputs-20261022.json.raw';
const oldPin='tests/fixtures/current-delivery-before-head-tools-20261022.json';
const currentPin='tests/fixtures/current-atlas-delivery.json';

test('whole current viewer and complete binding invert to the authenticated prior source role',()=>{
 const currentViewer=read(viewer),historicalViewer=read(oldViewer);
 assert.equal(sha(currentViewer),'a9b7c4b3d8f4febab394e983ace55df020cbcc84dc33daa8b2af6e7abd90fd1b');
 assert.equal(restoreHeadToolsBefore20261022(currentViewer,historicalViewer),historicalViewer.toString());
 const priorBytes=read(oldBinding),currentBytes=read('atlas-review/integration-inputs.json');
 assert.equal(sha(priorBytes),'58b0fd76cdfd582e1485403d15723ea0171c4a362b4ee1b65d1a2e5e4140380e');
 assert.equal(sha(currentBytes),'3c159e7d1abecd4735ed5182cd9143a968a15718f6abc6a0faccd504c0c66513');
 const prior=JSON.parse(priorBytes),current=JSON.parse(currentBytes);
 assert.equal(prior.sha256,'525f8fbe122bf6bdc15d8b89f572e49e3ac0ce09cd411b8009f67454d938a163');
 assert.equal(current.sha256,'3ed1585515a52a0480bc433aa135309abc38bace5f9a581cffe3b48660f23a9a');
 assert.equal(prior.inputs.length,1724);assert.equal(current.inputs.length,1724);
 assert.deepEqual(current.inputs.map(row=>row.path),prior.inputs.map(row=>row.path));
 assert.deepEqual(current.inputs.filter((row,i)=>row.sha256!==prior.inputs[i].sha256).map(row=>row.path),[viewer]);
 assert.equal(prior.inputs.find(row=>row.path===viewer).sha256,sha(historicalViewer));
 assert.equal(current.inputs.find(row=>row.path===viewer).sha256,sha(currentViewer));
 assert.equal(sha(JSON.stringify(current.inputs)),current.sha256);
 const inverse=structuredClone(current);
 inverse.sha256=prior.sha256;
 inverse.inputs.find(row=>row.path===viewer).sha256=sha(historicalViewer);
 assert.deepEqual(inverse,prior,'Every other binding field and input row remains byte exact');
 const live=validateCurrentAtlasDelivery(),historical=JSON.parse(read(oldPin));
 assert.equal(live.reviewIntegration,current.sha256);
 assert.equal(historical.reviewIntegration,prior.sha256);
 assert.throws(()=>validateCurrentAtlasDelivery({pin:historical}));
 assert.equal(beforeLoadingPin(read(currentPin)).reviewIntegration,'4db82d92f6de502a342396d290380253aff46ef754b23e6161672d40c9abce99');
});

test('source, binding and pin mutations cannot pass the historical/current inverse',()=>{
 const currentViewer=read(viewer),historicalViewer=read(oldViewer);
 assert.throws(()=>restoreHeadToolsBefore20261022(Buffer.concat([currentViewer,Buffer.from('\n// forged\n')]),historicalViewer));
 assert.throws(()=>restoreHeadToolsBefore20261022(currentViewer,Buffer.concat([historicalViewer,Buffer.from(' ')])));
 const currentBytes=read(currentPin);
 assert.throws(()=>beforeLoadingPin(Buffer.concat([currentBytes,Buffer.from(' ')])));
 const binding=JSON.parse(read('atlas-review/integration-inputs.json'));
 const bad=structuredClone(binding);bad.inputs.find(row=>row.path===viewer).sha256='0'.repeat(64);
 assert.notEqual(sha(JSON.stringify(bad.inputs)),binding.sha256);
 const live=validateCurrentAtlasDelivery();
 const badBindingBytes=Buffer.from(JSON.stringify(bad));
 const badBindingPin=structuredClone(live);
 badBindingPin.documents['atlas-review/integration-inputs.json']=sha(badBindingBytes);
 assert.throws(()=>validateCurrentAtlasDelivery({pin:badBindingPin,read:path=>
  path==='atlas-review/integration-inputs.json'?badBindingBytes:read(path)}));
 assert.throws(()=>validateCurrentAtlasDelivery({pin:{...live,reviewIntegration:'0'.repeat(64)}}));
 assert.throws(()=>validateCurrentAtlasDelivery({pin:{...live,documents:{...live.documents,'atlas-review/integration-inputs.json':'0'.repeat(64)}}}));
});
