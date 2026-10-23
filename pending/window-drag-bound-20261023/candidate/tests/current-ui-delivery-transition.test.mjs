import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateCurrentAtlasDelivery,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url));
const sha=b=>createHash('sha256').update(b).digest('hex');
const history='tests/fixtures/current-ui-delivery-before-9e14/';
function originalContract(text){
  const currentCount='assert.equal(sourceFiles,1567);assert.equal(inputs,1735);assert(artifacts>100);',priorCount=currentCount.replace('1735','1734');
  assert.equal(text.split(currentCount).length,2,'Exact contrast-binding count role');text=text.replace(currentCount,priorCount);
  for(const[from,to]of [
    ["assert.equal(CURRENT_ATLAS_REVISION,'9e1407629bd6f85061537c9f013fd72e4543e0da');","assert.equal(CURRENT_ATLAS_REVISION,'2381efe43b75f8a7fb768a069eecd7268c508dac');"],
    ["assert.equal(pin.sourceTree,'9404fb39a8b08aff7ef5300d2ef963abd5639045');","assert.equal(pin.sourceTree,'db21ed3dee259c390878450b3495468996a3af85');"],
    ["'head-neck':'9e1407629bd6f85061537c9f013fd72e4543e0da'","'head-neck':'2381efe43b75f8a7fb768a069eecd7268c508dac'"],
    ["shoulder:'9e1407629bd6f85061537c9f013fd72e4543e0da'","shoulder:'190a63238eadcf906abe89dcbb6a67c88afe70b9'"],
    ['assert.equal(sourceFiles,1567);assert.equal(inputs,1734);assert(artifacts>100);','assert.equal(sourceFiles,1562);assert.equal(inputs,1729);assert(artifacts>100);'],
  ]){assert.equal(text.split(from).length,2,'Exact unique current-delivery role');text=text.replace(from,to);}
  assert.equal(sha(text),'7f745b24ac233d3d9fca6b80a54e5387f2dc50eafa45a372cdb615520473b8b8');
  assert.equal(text,read(history+'contract.test.mjs.raw').toString());return text;
}
test('exact captured delivery identifies the coherent source without an approval field',()=>{
  const pin=validateCurrentAtlasDelivery();
  assert.equal(pin.source,'9e1407629bd6f85061537c9f013fd72e4543e0da');assert.equal(pin.sourceTree,'9404fb39a8b08aff7ef5300d2ef963abd5639045');
  assert.equal(pin.reviewSourceFiles,1567);assert.equal(pin.viewerFiles,46);assert.equal(pin.viewerPackages,22);assert(currentAtlasDeliveryRoot());
  assert(!Object.hasOwn(pin,'clinicalApproval'));assert(!Object.hasOwn(pin,'userAuthorized'));
  assert.equal(sha(read('tests/fixtures/current-atlas-delivery.json')),'ecac01f362f768a28581da4d4af859e152a5014da6226a0d6d24e41b019d8490');
});
test('all original tests and validator survive only five observed source/tree/runtime/count seams',()=>{
  assert.equal(sha(read(history+'contract.test.mjs.raw')),'7f745b24ac233d3d9fca6b80a54e5387f2dc50eafa45a372cdb615520473b8b8');
  const validator=read('tests/current-atlas-delivery.mjs');assert.equal(sha(validator),'52551fd5ec16154a78b94f78e0cdfbfee6a1bea629f70714f3dd5f93ccb81bb5');assert.deepEqual(validator,read(history+'validator.mjs.raw'));
  const current=read('tests/current-atlas-delivery.test.mjs').toString();originalContract(current);
  assert.throws(()=>originalContract(current.replace('assert.throws(()=>validateCurrentAtlasDelivery({pin:old}));','assert(old);')));
  assert.throws(()=>originalContract(current.replace("assert.equal(CURRENT_ATLAS_REVISION,'9e1407629bd6f85061537c9f013fd72e4543e0da');",'')));
  assert.throws(()=>originalContract(current+'\n// unreviewed change\n'));
});
test('the exact complete predecessor is retained as history and cannot admit this candidate',()=>{
  const bytes=read(history+'pin.json.raw');assert.equal(sha(bytes),'9313b2135cb50648751e50e49643479ec8bf83f2fe4f787bc2c25d4a632302a1');
  const old=JSON.parse(bytes);assert.equal(old.source,'2381efe43b75f8a7fb768a069eecd7268c508dac');assert.equal(old.reviewSourceFiles,1562);
  assert.throws(()=>validateCurrentAtlasDelivery({pin:old}),/Current delivery changed/);
});
