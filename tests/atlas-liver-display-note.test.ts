import assert from 'node:assert/strict';
import test from 'node:test';
import {currentInputs,delivery,pins,unchangedModels} from './atlas-neck-liver-delivery-fixture.ts';

const source={'lib/organ-anatomy-curriculum.ts':'78279373aa15a8a239f133514cbb47ebb4e86657d77e299ac630603cafcedf1a'};
const phrases=['The liver display aggregate excludes the separately selectable hepatic artery proper, right hepatic vein and left hepatic vein surfaces.','Source coordinates are unchanged; segment boundaries and clinical accuracy are unvalidated.'];
function check(epoch:'historical'|'current'){
 const item=delivery(epoch);pins(item.inputs,source,epoch);
 const runtime=item.teaching();for(const phrase of phrases)assert.ok(runtime.includes(phrase),phrase);
}
test('historical liver display note stays pinned to the saved source and export',()=>check('historical'));
test('current liver note keeps committed source/import, wording and model delivery',()=>{
 const now=delivery('current');currentInputs(now.inputs,Object.keys(source));check('current');unchangedModels();
});
