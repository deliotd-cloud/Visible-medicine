import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateCurrentAtlasDelivery,currentAtlasDeliveryRoot,CURRENT_ATLAS_REVISION} from './current-atlas-delivery.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url));
const sha=b=>createHash('sha256').update(b).digest('hex');
const lineReplace=(value,pairs)=>{const lines=value.split('\n');for(const [from] of pairs)assert.equal(lines.filter(l=>l===from).length,1,from);return lines.map(l=>pairs.find(([from])=>l===from)?.[1]??l).join('\n');};
test('tour delivery preserves the complete prior contract and rejects its pin',()=>{
 const prior=read('tests/fixtures/current-atlas-delivery-before-tour.txt');assert.equal(sha(prior),'bda9401394df7f9ddc8dfe77225356165b4114b7e0411dd3940147f8421f83d1');
 const oldPin=read('tests/fixtures/current-atlas-delivery-before-tour.json');assert.equal(sha(oldPin),'4b45b802688748ab372a492f2df25e7dfa980baf992c578712770cbb933bdc0f');
 assert.throws(()=>validateCurrentAtlasDelivery({pin:JSON.parse(oldPin)}));
 const changes=[[" assert.equal(CURRENT_ATLAS_REVISION,'c75c72a4ad92ed15cc617361e6d40812696966ab');"," assert.equal(CURRENT_ATLAS_REVISION,'544e6c63a3428f6a8b24243fee46f6772037396a');"],[" assert.equal(pin.sourceTree,'c60c18bd5f4c17a2b054702897d4263a056bb6e0');"," assert.equal(pin.sourceTree,'07c25bbdebefb9f82f01d41d103b46c884e8a098');"],["  'head-neck':'c75c72a4ad92ed15cc617361e6d40812696966ab',","  'head-neck':'544e6c63a3428f6a8b24243fee46f6772037396a',"],[" assert.equal(admitted.source,'c75c72a4ad92ed15cc617361e6d40812696966ab');assert.equal(admitted.sourceTree,'c60c18bd5f4c17a2b054702897d4263a056bb6e0');"," assert.equal(admitted.source,'544e6c63a3428f6a8b24243fee46f6772037396a');assert.equal(admitted.sourceTree,'07c25bbdebefb9f82f01d41d103b46c884e8a098');"]];
 const current=read('tests/fixtures/current-atlas-delivery-before-panel.txt').toString();
 assert.equal(lineReplace(current,changes.map(([from,to])=>[to,from])),prior.toString());
 const oldThyroid=read('tests/fixtures/current-thyroid-delivery-before-tour.txt');assert.equal(sha(oldThyroid),'32b77e3717355b49e4018f41addb0d9419358c71d6b44441ed0b2fa8ffaf17f9');
 const thyroid=read('tests/current-thyroid-delivery.test.mjs').toString();
 assert.equal(thyroid.replace("let restored=read(\"tests/fixtures/current-atlas-delivery-before-tour.txt\").toString();","let restored=read(\"tests/current-atlas-delivery.test.mjs\").toString();"),oldThyroid.toString());
 assert.equal(thyroid.split("let restored=read(\"tests/fixtures/current-atlas-delivery-before-tour.txt\").toString();").length,2);
});
test('tour current pin binds only the measured new source, Review and emitted documents',()=>{
 const pin=JSON.parse(read('tests/fixtures/current-atlas-delivery.json'));
 assert.equal(CURRENT_ATLAS_REVISION,'7b2e5accf8538f3ffef396f95b0a206b06a76c1b');assert.equal(pin.sourceTree,'29fb4ec503f2a29f8c282b3ab10087e01d2f1095');
 assert.equal(pin.runtimeSources['head-neck'],pin.source);
 assert.equal(pin.reviewSourceFiles,1686);assert.equal(pin.viewerFiles,63);assert.equal(pin.viewerPackages,24);
 assert.deepEqual(validateCurrentAtlasDelivery(),pin);
 for(const altered of [
  value=>{value.source='c75c72a4ad92ed15cc617361e6d40812696966ab';value.runtimeSources['head-neck']=value.source},
  value=>{value.sourceTree='c60c18bd5f4c17a2b054702897d4263a056bb6e0'},
  value=>{value.runtimeSources['head-neck']='c75c72a4ad92ed15cc617361e6d40812696966ab'},
  value=>{value.reviewIntegration='0'.repeat(64)},
  value=>{value.documents['atlas-review/manifest.json']='0'.repeat(64)},
 ]){const changed=structuredClone(pin);altered(changed);assert.throws(()=>currentAtlasDeliveryRoot({pin:changed}));}
});
