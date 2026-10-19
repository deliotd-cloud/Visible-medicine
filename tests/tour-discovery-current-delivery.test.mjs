import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
const read=p=>readFileSync(new URL(p,import.meta.url));
const sha=b=>createHash('sha256').update(b).digest('hex');
test('complete pre-keyboard 30b delivery and all original contracts stay frozen outside exact source/tree seams',()=>{
 const bytes=read('./fixtures/current-atlas-delivery-30b3752e.json');assert.equal(sha(bytes),'7166d8104a3338ba7518c7257f216d97144d511f340b23dbb2c807acb1341dee');
 const old=JSON.parse(bytes);assert.equal(old.source,'30b3752ea64e3ee8439fc44e42410a975983829c');assert.equal(old.sourceTree,'6a9d9a3a1eaca908a2c91f58659e4d3698e75cff');assert.equal(old.reviewIntegration,'405276a2d8a53b75e72504853e06c7132d4235eaa06634ba6ded8c7ba0d6b8d6');assert.equal(old.reviewSourceFiles,1543);assert.throws(()=>validateCurrentAtlasDelivery({pin:old}));
 const original=read('./fixtures/current-atlas-delivery-30b3752e.txt');assert.equal(sha(original),'c6797be1b49783f3a3ba5af8ce2313a68d24edd0b02b8bd14d2b2bb0408e1666');
 const current=validateCurrentAtlasDelivery(),restore=text=>text.split(current.source).join(old.source).split(current.sourceTree).join(old.sourceTree);
 assert.equal(restore(read('./current-atlas-delivery.test.mjs').toString()),original.toString(),'Whole original behavioral and historical refusal bodies remain exact');
 const corpus=read('./fixtures/corpus-xray-v2-current-delivery-30b3752e.mjs.raw');assert.equal(sha(corpus),'66f44b7af0b5261d28420e1681b291f5942bb4676ec239146b535e95ca63ef0e');assert.equal(restore(read('./corpus-xray-v2-current-delivery.test.mjs').toString()),corpus.toString());
 const ui=read('./fixtures/ui-teaching-current-delivery-30b3752e.mjs.raw');assert.equal(sha(ui),'a0b9387c12c0ab17528f81ae158448061f9ce865230b08e64762588203f61b6b');assert.deepEqual(read('./ui-teaching-current-delivery.test.mjs'),ui);
});
