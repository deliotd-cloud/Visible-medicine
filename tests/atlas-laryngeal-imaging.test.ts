import assert from 'node:assert/strict';
import test from 'node:test';
import {currentInputs,delivery,pins,unchangedModels} from './atlas-neck-liver-delivery-fixture.ts';

const source={
 'content/laryngeal-imaging-pins.json':'97af73448c9063517468aee21c881a6df3b2fc2f4fd8e6a004c98a58a3607338',
 'content/laryngeal-imaging.ts':'bfcced54a94c0b349fdbd433dbdb015dd9b654c2a434d58fb12da85e2a04efad',
 'lib/laryngeal-imaging.ts':'1f70ea5c5fdd188bd4ab73555a12ed9b77f5ea028d62c63e77eb3111f50417ef',
};
const phrases=['Trace the epiglottis from its broad upper portion','Recognise the thyroid cartilage as the anterior shield','Look for the cricoid ring below the thyroid cartilage','https://pmc.ncbi.nlm.nih.gov/articles/PMC4266916/','No acquired image, validated registration, contouring protocol or airway-management guidance is supplied.'];
function check(epoch:'historical'|'current'){
 const item=delivery(epoch);pins(item.inputs,source,epoch);
 const runtime=item.runtime();for(const phrase of phrases)assert.ok(runtime.includes(phrase),phrase);
}
test('historical laryngeal imaging remains pinned to the saved export',()=>check('historical'));
test('current laryngeal imaging retains source/import, wording and model delivery',()=>{
 const now=delivery('current');currentInputs(now.inputs,Object.keys(source));check('current');unchangedModels();
});
