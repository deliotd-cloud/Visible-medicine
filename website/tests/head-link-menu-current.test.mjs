// Current a28 coverage, separate from the unchanged authentic image-tools historical root.
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url)),sha=b=>createHash('sha256').update(b).digest('hex');
test('current Review binds the actual linked-menu helper and viewer with emitted runtime and model evidence',()=>{
 const now=validateCurrentAtlasDelivery(),old=JSON.parse(read('tests/fixtures/current-atlas-delivery-before-head-disclosure-bd5465ee.json')),binding=JSON.parse(read('atlas-review/integration-inputs.json'));
 assert.equal(now.source,'a28d03acf07da97a927073d4794abf3b5ce907f7');assert.equal(now.sourceTree,'180330c12bb9b5abf1b7171adca83eeadaad476d');assert.notEqual(now.source,old.source);assert.notEqual(now.sourceTree,old.sourceTree);
 assert.equal(now.reviewSourceFiles,1622);assert.equal(binding.inputs.length,1829);assert.equal(binding.sha256,'dcf5633bae89c708b49849452306036a1d7a229273675b4d5a48d2080d400d19');assert.equal(binding.sha256,now.reviewIntegration);assert.equal(sha(JSON.stringify(binding.inputs)),binding.sha256);
 for(const path of ['components/HeadAtlasLearningPicker.tsx','components/HeadAtlasComparisonNavigation.tsx','lib/head-disclosure-keyboard.ts','scripts/bind-clinical-review.mjs']){const rows=binding.inputs.filter(row=>row.path===path);assert.equal(rows.length,1);assert.equal(rows[0].sha256,sha(read(path)));}
 for(const name of ['head-neck','shoulder','lower-limb','female-pelvis'])for(const file of ['manifest.json','source-inputs.json']){const path=`public/atlas-runtime/${name}/${file}`;assert.equal(now.documents[path],sha(read(path)));}
 assert.equal(now.documents['lib/atlas-model-inventory.json'],sha(read('lib/atlas-model-inventory.json')));
});

test('pre-head-tools Review pin remains an authenticated older role and cannot approve the changed viewer',()=>{
 const beforeBytes=read('tests/fixtures/current-delivery-before-head-tools-20261022.json');
 assert.equal(sha(beforeBytes),'422a105495609f03a1e20660716406c737e1a14337843ed61d084bf95c7c7bed');
 const before=JSON.parse(beforeBytes);
 assert.equal(before.reviewIntegration,'525f8fbe122bf6bdc15d8b89f572e49e3ac0ce09cd411b8009f67454d938a163');
 const current=validateCurrentAtlasDelivery();
 assert.equal(current.reviewIntegration,'dcf5633bae89c708b49849452306036a1d7a229273675b4d5a48d2080d400d19');
 assert.notEqual(before.reviewIntegration,current.reviewIntegration);
 assert.throws(()=>validateCurrentAtlasDelivery({pin:before}));
});

for(const target of ['components/HeadAtlasLearningPicker.tsx','components/HeadAtlasComparisonNavigation.tsx'])test('actual stock verifier refuses changed linked-menu dependency: '+target,async()=>{
 const source=read('scripts/verify-clinical-review.mjs').toString();assert.equal(sha(source),'90ee9c953f297521a1f6b8347e40f6e49648496301ce5181929418a2c95404f0');
 let body=source;for(const line of ["import assert from 'node:assert/strict';","import { readFileSync } from 'node:fs';","import { createHash } from 'node:crypto';","import { verifyPlexusReview } from './verify-plexus-review.mjs';","import { verifyAnatomyCoverageView } from './verify-anatomy-coverage-view.mjs';"]){assert.equal(body.split(line).length-1,1);body=body.replace(line,'');}
 let intercepted=0,lateCalls=0;const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
 const run=new AsyncFunction('assert','readFileSync','createHash','verifyPlexusReview','verifyAnatomyCoverageView','console',body);
 const checkedRead=path=>{const bytes=read(path);if(path===target){intercepted++;return Buffer.concat([bytes,Buffer.from('\n/* SYNTHETIC dependency-tamper probe */\n')]);}return bytes;};
 await assert.rejects(run(assert,checkedRead,createHash,()=>{lateCalls++;throw Error('Refusal must occur before later verification');},()=>{lateCalls++;throw Error('Refusal must occur before later verification');},{log(){lateCalls++;}}),error=>error.code==='ERR_ASSERTION'&&error.message.includes('Review input changed; rebind and rebuild: '+target));
 assert.equal(intercepted,1);assert.equal(lateCalls,0);
});

