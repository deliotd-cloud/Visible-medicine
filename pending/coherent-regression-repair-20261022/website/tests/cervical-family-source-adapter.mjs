import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
export const cervicalFamilyCurrentSha='8f39ef8f48cbb6c0970bd14c2e92ed75eefcabe8a1db4c65d2b915bad1b8daff';
export const cervicalTypedPriorSha='36b41c79a10d04fedc0bbb962accf58486ec2542f819e94aca3654d70a42f365';
const priorPath=new URL('./fixtures/cervical-disc-tour-typed-current-before-family.test.ts.raw',import.meta.url);
export const cervicalFamilySeams=[
 ["import {currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';",
  "import {currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';"],
 [" const deliveryPin=validateCurrentAtlasDelivery();\n assert.equal(deliveryRevision,deliveryPin.source,'Review remains bound to current Atlas source');\n",''],
 ['assert.equal(manifest.sourceCommit,deliveryPin.runtimeSources[name],name);',
  'assert.equal(manifest.sourceCommit,deliveryRevision,name);'],
];

export function restoreCervicalTypedPrior(currentBytes){
 assert.equal(sha(currentBytes),cervicalFamilyCurrentSha,'Exact family-aware cervical test source');
 const prior=readFileSync(priorPath);
 assert.equal(sha(prior),cervicalTypedPriorSha,'Exact full typed prior source');
 let restored=Buffer.from(currentBytes).toString('utf8');
 for(const [current,previous] of cervicalFamilySeams){
  assert.equal(restored.split(current).length,2,'One authenticated family-admission seam');
  restored=restored.replace(current,previous);
 }
 const bytes=Buffer.from(restored);
 assert.deepEqual(bytes,prior,'Full typed prior restored after only declared family seams');
 return bytes;
}
