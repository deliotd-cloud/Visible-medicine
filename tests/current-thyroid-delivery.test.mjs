import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateCurrentAtlasDelivery,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url));
const sha=b=>createHash('sha256').update(b).digest('hex');
test('thyroid delivery preserves every predecessor assertion and rejects its obsolete pin',()=>{
 const previous=read("tests/fixtures/current-atlas-delivery-before-thyroid.txt");assert.equal(sha(previous),"4d95ac3844f81cb2384c6ca870958fe3e4c85e8e46f4357255dbfd3e1747a7d0");
 const oldPin=read("tests/fixtures/current-atlas-delivery-before-thyroid.json");assert.equal(sha(oldPin),"41219f01228e06c124ee71d21fa8be1c1f40faba0c3d03f1f2af303534dc27ce");assert.throws(()=>validateCurrentAtlasDelivery({pin:JSON.parse(oldPin)}));
 let restored=read("tests/fixtures/current-atlas-delivery-before-tour.txt").toString();for(const[from,to]of [[" assert.equal(CURRENT_ATLAS_REVISION,'0d9750af66d92aa5a421b34ac6d0c8dd3e5bfd66');"," assert.equal(CURRENT_ATLAS_REVISION,'c75c72a4ad92ed15cc617361e6d40812696966ab');"],[" assert.equal(pin.sourceTree,'495d07f5d9aff482dae7c9c30a962acaa7947b50');"," assert.equal(pin.sourceTree,'c60c18bd5f4c17a2b054702897d4263a056bb6e0');"],["  'head-neck':'0d9750af66d92aa5a421b34ac6d0c8dd3e5bfd66',","  'head-neck':'c75c72a4ad92ed15cc617361e6d40812696966ab',"],[" assert.equal(sourceFiles,1683);assert.equal(inputs,1917);assert(artifacts>100);"," assert.equal(sourceFiles,1686);assert.equal(inputs,1920);assert(artifacts>100);"],[" assert.equal(admitted.source,'0d9750af66d92aa5a421b34ac6d0c8dd3e5bfd66');assert.equal(admitted.sourceTree,'495d07f5d9aff482dae7c9c30a962acaa7947b50');"," assert.equal(admitted.source,'c75c72a4ad92ed15cc617361e6d40812696966ab');assert.equal(admitted.sourceTree,'c60c18bd5f4c17a2b054702897d4263a056bb6e0');"],[" assert.equal(admitted.reviewSourceFiles,1683);"," assert.equal(admitted.reviewSourceFiles,1686);"],[" assert.equal(review.files.length,1683);assert.equal(binding.inputs.length,1917);"," assert.equal(review.files.length,1686);assert.equal(binding.inputs.length,1920);"]].reverse()){const lines=restored.split('\n');assert.equal(lines.filter(l=>l===to).length,1);restored=lines.map(l=>l===to?from:l).join('\n');}assert.equal(restored,previous.toString());
 const history=read('tests/current-renderer-delivery.test.mjs').toString().replace("read(\"tests/fixtures/current-atlas-delivery-before-thyroid.txt\").toString().split(marker)","read(\"tests/current-atlas-delivery.test.mjs\").toString().split(marker)");assert.equal(sha(history),"5625857bb80cdd9da4e7d03d53b246141e80bac502a0f6d7daab07ca4dd10e49");
 assert(currentAtlasDeliveryRoot());
});
