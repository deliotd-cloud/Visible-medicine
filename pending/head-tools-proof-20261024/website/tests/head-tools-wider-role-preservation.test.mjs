import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {restoreHeadToolsBefore20261022} from './head-tools-epoch-20261022.mjs';
import {beforeLoadingPin} from './review-frame-history-inverse.mjs';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {readHistoricalHeadToolsRole,validateHistoricalHeadToolsDelivery,assertCurrentHeadToolsSource,restoreCurrentHeadToolsViewer} from './head-tools-current-role.mjs';

const read=readHistoricalHeadToolsRole;
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const viewer='components/HeadAtlasViewer.tsx';
const oldViewer='tests/fixtures/head-toolbar-before-compaction-20261022.tsx.raw';
const oldBinding='tests/fixtures/head-tools-prior-integration-inputs-20261022.json.raw';
const oldPin='tests/fixtures/current-delivery-before-head-tools-20261022.json';
const currentPin='tests/fixtures/current-atlas-delivery.json';

test('authenticated 20261022 viewer and binding invert to the exact pre-head-tools role',()=>{
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
 const live=validateHistoricalHeadToolsDelivery(),historical=JSON.parse(read(oldPin));
 assert.equal(live.reviewIntegration,current.sha256);
 assert.equal(historical.reviewIntegration,prior.sha256);
 assert.throws(()=>validateHistoricalHeadToolsDelivery({pin:historical}));
 assert.equal(beforeLoadingPin(read(currentPin)).reviewIntegration,'4db82d92f6de502a342396d290380253aff46ef754b23e6161672d40c9abce99');
});

test('historical source, binding and pin mutations cannot pass the original role inverse',()=>{
 const currentViewer=read(viewer),historicalViewer=read(oldViewer);
 assert.throws(()=>restoreHeadToolsBefore20261022(Buffer.concat([currentViewer,Buffer.from('\n// forged\n')]),historicalViewer));
 assert.throws(()=>restoreHeadToolsBefore20261022(currentViewer,Buffer.concat([historicalViewer,Buffer.from(' ')])));
 const currentBytes=read(currentPin);
 assert.throws(()=>beforeLoadingPin(Buffer.concat([currentBytes,Buffer.from(' ')])));
 const binding=JSON.parse(read('atlas-review/integration-inputs.json'));
 const bad=structuredClone(binding);bad.inputs.find(row=>row.path===viewer).sha256='0'.repeat(64);
 assert.notEqual(sha(JSON.stringify(bad.inputs)),binding.sha256);
 const live=validateHistoricalHeadToolsDelivery();
 const badBindingBytes=Buffer.from(JSON.stringify(bad));
 const badBindingPin=structuredClone(live);
 badBindingPin.documents['atlas-review/integration-inputs.json']=sha(badBindingBytes);
 assert.throws(()=>validateHistoricalHeadToolsDelivery({pin:badBindingPin,read:path=>
  path==='atlas-review/integration-inputs.json'?badBindingBytes:read(path)}));
 assert.throws(()=>validateHistoricalHeadToolsDelivery({pin:{...live,reviewIntegration:'0'.repeat(64)}}));
 assert.throws(()=>validateHistoricalHeadToolsDelivery({pin:{...live,documents:{...live.documents,'atlas-review/integration-inputs.json':'0'.repeat(64)}}}));
});

const currentRead=path=>readFileSync(new URL('../'+path,import.meta.url));
test('current delivery is independently validated and is not silently substituted into the historical role',()=>{
 const current=validateCurrentAtlasDelivery(),historical=validateHistoricalHeadToolsDelivery();
 assert.equal(current.source,'d143c28fb1e5da200712af6629a375c25d17dad7');
 assert.equal(current.reviewIntegration,'35fdca381e22b1c9a5fad703d673fd8fdac427aeb9580f3375243be5f7c06709');
 assert.equal(current.reviewSourceFiles,1593);assert.equal(historical.reviewSourceFiles,1558);
 assert.notEqual(current.reviewIntegration,historical.reviewIntegration);
 assert.deepEqual(Object.keys(current.documents).sort(),Object.keys(historical.documents).sort());
 const {receipt}=assertCurrentHeadToolsSource(currentPin),rows=new Map(receipt.sourceRows.map(r=>[r.path,r]));
 for(const path of [viewer,'atlas-review/integration-inputs.json',currentPin])assertCurrentHeadToolsSource(path);
 const binding=JSON.parse(currentRead('atlas-review/integration-inputs.json'));
 assert.equal(binding.inputs.length,1783);assert.equal(binding.sourceCommit,current.source);
 assert.equal(sha(JSON.stringify(binding.inputs)),current.reviewIntegration);
 for(const input of binding.inputs){assert.equal(sha(currentRead(input.path)),input.sha256,input.path);assert.equal(rows.get(input.path)?.sha256,input.sha256,input.path+': independent sealed-source row');}
 assert.throws(()=>validateCurrentAtlasDelivery({pin:historical}),'Historical pin is not current delivery');
 assert.throws(()=>validateHistoricalHeadToolsDelivery({pin:current}),'Current pin is not historical delivery');
});

test('all sixteen viewer transition hunks restore the whole authenticated head-tools viewer',()=>{
 const prior=read(viewer),now=currentRead(viewer);
 assert.deepEqual(restoreCurrentHeadToolsViewer(now,prior),prior);
 assert.equal(restoreHeadToolsBefore20261022(prior,read(oldViewer)),read(oldViewer).toString());
 assert.throws(()=>restoreHeadToolsBefore20261022(now,read(oldViewer)),'Later viewer cannot impersonate the original source epoch');
 assert.throws(()=>restoreCurrentHeadToolsViewer(Buffer.concat([now,Buffer.from('\\n// forged\\n')]),prior));
 assert.throws(()=>restoreCurrentHeadToolsViewer(now,Buffer.concat([prior,Buffer.from(' ')])));
 assert.throws(()=>restoreCurrentHeadToolsViewer(prior,now));
});

test('live delivery and source mutations still fail without falling back to the historical witnesses',()=>{
 const current=validateCurrentAtlasDelivery(),binding=JSON.parse(currentRead('atlas-review/integration-inputs.json'));
 const bad=structuredClone(binding);bad.inputs.find(r=>r.path===viewer).sha256='0'.repeat(64);
 const bytes=Buffer.from(JSON.stringify(bad)),pin=structuredClone(current);
 pin.documents['atlas-review/integration-inputs.json']=sha(bytes);
 assert.throws(()=>validateCurrentAtlasDelivery({pin,read:path=>path==='atlas-review/integration-inputs.json'?bytes:currentRead(path)}));
 assert.throws(()=>validateCurrentAtlasDelivery({pin:{...current,reviewIntegration:'0'.repeat(64)}}));
 assert.throws(()=>validateCurrentAtlasDelivery({pin:{...current,source:'0'.repeat(40)}}));
 assert.throws(()=>beforeLoadingPin(currentRead(currentPin)),'Original pin inverse retains its exact original epoch');
 assert.throws(()=>assertCurrentHeadToolsSource(viewer,Buffer.concat([currentRead(viewer),Buffer.from(' ')])));
 for(const unknown of ['../private','constructor','public/models/raw.nrrd'])assert.throws(()=>readHistoricalHeadToolsRole(unknown));
 for(const [path] of Object.entries(current.documents)){
  assert.throws(()=>validateCurrentAtlasDelivery({pin:current,read:p=>p===path?Buffer.concat([currentRead(p),Buffer.from(' ')]):currentRead(p)}),path);
  assert.throws(()=>validateHistoricalHeadToolsDelivery({read:p=>p===path?Buffer.concat([read(p),Buffer.from(' ')]):read(p)}),path+': historical guard');
 }
});

