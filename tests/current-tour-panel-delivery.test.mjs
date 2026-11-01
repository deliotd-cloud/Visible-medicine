import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const beforeSource='544e6c63a3428f6a8b24243fee46f6772037396a';
const beforeTree='07c25bbdebefb9f82f01d41d103b46c884e8a098';
const currentSource='7b2e5accf8538f3ffef396f95b0a206b06a76c1b';
const currentTree='29fb4ec503f2a29f8c282b3ab10087e01d2f1095';

test('tour panel source retains every 544 delivery assertion outside four exact source seams',()=>{
 const before=read('tests/fixtures/current-atlas-delivery-before-panel.txt');
 assert.equal(sha(before),'c164ee59ac7e99443169cfb896fffbfbb55a76630a202b12cbc92652ef9ed1a5');
 const source=read('tests/current-atlas-delivery.test.mjs').toString();
 const changes=[
  [` assert.equal(CURRENT_ATLAS_REVISION,'${currentSource}');`,` assert.equal(CURRENT_ATLAS_REVISION,'${beforeSource}');`],
  [` assert.equal(pin.sourceTree,'${currentTree}');`,` assert.equal(pin.sourceTree,'${beforeTree}');`],
  [`  'head-neck':'${currentSource}',`,`  'head-neck':'${beforeSource}',`],
  [` assert.equal(admitted.source,'${currentSource}');assert.equal(admitted.sourceTree,'${currentTree}');`,` assert.equal(admitted.source,'${beforeSource}');assert.equal(admitted.sourceTree,'${beforeTree}');`],
 ];
 let restored=source;
 for(const [from,to] of changes){
  const lines=restored.split('\n');
  assert.equal(lines.filter(line=>line===from).length,1,`One current source seam: ${from}`);
  restored=lines.map(line=>line===from?to:line).join('\n');
 }
 assert.equal(restored,before.toString(),'Complete 544 source, refusal, historical and fixture contracts remain exact');
});

test('tour panel delivery refuses the prior source, tree, runtime, binding and document through the enforcing helper',()=>{
 const beforeBytes=read('tests/fixtures/current-atlas-delivery-before-panel.json');
 assert.equal(sha(beforeBytes),'e51b7ba7a800ccd49ad8a78f64d0316b6ace2ebf135f60163d4204be103a8679');
 const before=JSON.parse(beforeBytes);
 assert.equal(before.source,beforeSource);assert.equal(before.sourceTree,beforeTree);
 const pin=JSON.parse(read('tests/fixtures/current-atlas-delivery.json'));
 assert.equal(CURRENT_ATLAS_REVISION,currentSource);assert.equal(pin.sourceTree,currentTree);
 assert.deepEqual(validateCurrentAtlasDelivery(),pin);
 assert(currentAtlasDeliveryRoot());
 assert.throws(()=>currentAtlasDeliveryRoot({pin:before}),'Complete prior pin cannot be current');
 const negatives=[
  ['source',p=>{p.source=before.source;p.runtimeSources['head-neck']=before.source;}],
  ['tree',p=>{p.sourceTree=before.sourceTree;}],
  ['runtime',p=>{p.runtimeSources['head-neck']=before.runtimeSources['head-neck'];}],
  ['Review binding',p=>{p.reviewIntegration=before.reviewIntegration;}],
  ['Review document',p=>{p.documents['atlas-review/integration-inputs.json']=before.documents['atlas-review/integration-inputs.json'];}],
 ];
 for(const [label,change] of negatives){
  const stale=structuredClone(pin);change(stale);
  assert.notDeepEqual(stale,pin,`${label} must differ from the new admission`);
  assert.throws(()=>currentAtlasDeliveryRoot({pin:stale}),`Enforcing helper rejects old ${label}`);
 }
});
