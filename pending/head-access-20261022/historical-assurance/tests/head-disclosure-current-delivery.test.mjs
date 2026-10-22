import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url)),sha=b=>createHash('sha256').update(b).digest('hex');
const oldCount='assert.equal(inputs.inputs.length, 1679);',newCount='assert.equal(inputs.inputs.length, 1680);';
const oldTour="assert.deepEqual(read('./ui-teaching-current-delivery.test.mjs'),ui);",newTour="assert.equal(read('./ui-teaching-current-delivery.test.mjs').toString().replace('assert.equal(inputs.inputs.length, 1680);','assert.equal(inputs.inputs.length, 1679);'),ui.toString());";

test('bd5465 pre-disclosure source and complete contracts remain exact historical witnesses',()=>{
 const before=read('tests/fixtures/current-atlas-delivery-before-head-disclosure-bd5465ee.json');assert.equal(sha(before),'d85631f028d910ace4d9a8c493c1ddbaaa66e3ba44bdc435d8ce5d9951c0ea38');
 const old=JSON.parse(before);assert.equal(old.source,'bd5465ee3b94c66c3d5701e7749099d07e8f40d3');assert.equal(old.sourceTree,'44ca83bf391164c09f43f4169d25dcacf4b2559d');assert.equal(old.reviewIntegration,'8187a8998fc5b6dc1e4b3d4e8cba60153b1e094b98da7ad43311661d4e54e641');assert.throws(()=>validateCurrentAtlasDelivery({pin:old}));
 for(const [fixture,digest]of[
  ['tests/fixtures/current-atlas-delivery-before-head-disclosure-bd5465ee.mjs.raw','871fcea7bf926778e3a6741815216f97897c0a20e54afa2005431eabb7e34935'],
  ['tests/fixtures/ui-teaching-before-head-disclosure-bd5465ee.mjs.raw','a0b9387c12c0ab17528f81ae158448061f9ce865230b08e64762588203f61b6b'],
  ['tests/fixtures/tour-discovery-before-head-disclosure-bd5465ee.mjs.raw','3aff97ad03171a53dbfe9ed0dabc6b162c8559ae338baf47b1931cbf44932849'],
 ])assert.equal(sha(read(fixture)),digest,'Full retained historical test source: '+fixture);
 const historicalCurrent=read('tests/fixtures/current-atlas-delivery-before-head-disclosure-bd5465ee.mjs.raw').toString();
 assert.equal(/^\s*assert\.equal\(inputs\.inputs\.length, 1679\);/m.test(historicalCurrent),false,'The retained current-atlas contract had no executable 1679-input assertion to invert');
 const historicalUi=read('tests/fixtures/ui-teaching-before-head-disclosure-bd5465ee.mjs.raw').toString();
 assert.equal(historicalUi.split(oldCount).length-1,1,'The authentic UI contract has one count seam');
 const provedUiTransition=historicalUi.replace(oldCount,newCount);
 assert.equal(provedUiTransition.split(newCount).length-1,1);assert.equal(provedUiTransition.replace(newCount,oldCount),historicalUi,'The complete historical UI body and negatives survive that explicit count transition');
 const original=read('tests/fixtures/tour-discovery-before-head-disclosure-bd5465ee.mjs.raw').toString();
 const preRole=read('tests/fixtures/tour-discovery-before-role-batch-20261021.mjs.raw');assert.equal(sha(preRole),'de76cd029107bb874bb6664c08568f7a8944e6fd96283870d6080cf73c331d82');
 let inverse=preRole.toString();
 const beforeRestore='restore=text=>text.split(current.source).join(old.source).split(current.sourceTree).join(old.sourceTree);',afterRestore="restore=text=>text.split(current.source).join(old.source).split(current.sourceTree).join(old.sourceTree).replace('assert.equal(inputs.inputs.length, 1680);','assert.equal(inputs.inputs.length, 1679);');";
 for(const[from,to]of [[afterRestore,beforeRestore],[newTour,oldTour]]){assert.equal(inverse.split(from).length-1,1,'Exact pre-role tour transition: '+from);inverse=inverse.replace(from,to);}
 assert.equal(inverse,original,'The entire pre-disclosure tour source and its original negative assertions survive the exact later seams');
});

test('current 389 Review binds the actual disclosure helper and viewer with emitted runtime and model evidence',()=>{
 const now=validateCurrentAtlasDelivery(),old=JSON.parse(read('tests/fixtures/current-atlas-delivery-before-head-disclosure-bd5465ee.json')),binding=JSON.parse(read('atlas-review/integration-inputs.json'));
 assert.equal(now.source,'389bd0ca846a42c7f21055f55904bcf5df81a09f');assert.equal(now.sourceTree,'25acdee40ee57e0253cdcca924aa64b4b38586c8');assert.notEqual(now.source,old.source);assert.notEqual(now.sourceTree,old.sourceTree);
 assert.equal(now.reviewSourceFiles,1560);assert.equal(binding.inputs.length,1727);assert.equal(binding.sha256,'811baffeb0cfa83626ea4f00383d0ed04fe6980716415d2f919151078cdad9b5');assert.equal(binding.sha256,now.reviewIntegration);assert.equal(sha(JSON.stringify(binding.inputs)),binding.sha256);
 for(const path of ['lib/head-disclosure-keyboard.ts','components/HeadAtlasViewer.tsx','scripts/bind-clinical-review.mjs']){const rows=binding.inputs.filter(row=>row.path===path);assert.equal(rows.length,1);assert.equal(rows[0].sha256,sha(read(path)));}
 for(const name of ['head-neck','shoulder','lower-limb','female-pelvis'])for(const file of ['manifest.json','source-inputs.json']){const path=`public/atlas-runtime/${name}/${file}`;assert.equal(now.documents[path],sha(read(path)));}
 assert.equal(now.documents['lib/atlas-model-inventory.json'],sha(read('lib/atlas-model-inventory.json')));
});

test('pre-head-tools Review pin remains an authenticated older role and cannot approve the changed viewer',()=>{
 const beforeBytes=read('tests/fixtures/current-delivery-before-head-tools-20261022.json');
 assert.equal(sha(beforeBytes),'422a105495609f03a1e20660716406c737e1a14337843ed61d084bf95c7c7bed');
 const before=JSON.parse(beforeBytes);
 assert.equal(before.reviewIntegration,'525f8fbe122bf6bdc15d8b89f572e49e3ac0ce09cd411b8009f67454d938a163');
 const current=validateCurrentAtlasDelivery();
 assert.equal(current.reviewIntegration,'811baffeb0cfa83626ea4f00383d0ed04fe6980716415d2f919151078cdad9b5');
 assert.notEqual(before.reviewIntegration,current.reviewIntegration);
 assert.throws(()=>validateCurrentAtlasDelivery({pin:before}));
});

for(const target of ['lib/head-disclosure-keyboard.ts','components/HeadAtlasViewer.tsx'])test('actual stock verifier refuses changed disclosure dependency: '+target,async()=>{
 const source=read('scripts/verify-clinical-review.mjs').toString();assert.equal(sha(source),'90ee9c953f297521a1f6b8347e40f6e49648496301ce5181929418a2c95404f0');
 let body=source;for(const line of ["import assert from 'node:assert/strict';","import { readFileSync } from 'node:fs';","import { createHash } from 'node:crypto';","import { verifyPlexusReview } from './verify-plexus-review.mjs';","import { verifyAnatomyCoverageView } from './verify-anatomy-coverage-view.mjs';"]){assert.equal(body.split(line).length-1,1);body=body.replace(line,'');}
 let intercepted=0,lateCalls=0;const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
 const run=new AsyncFunction('assert','readFileSync','createHash','verifyPlexusReview','verifyAnatomyCoverageView','console',body);
 const checkedRead=path=>{const bytes=read(path);if(path===target){intercepted++;return Buffer.concat([bytes,Buffer.from('\n/* SYNTHETIC dependency-tamper probe */\n')]);}return bytes;};
 await assert.rejects(run(assert,checkedRead,createHash,()=>{lateCalls++;throw Error('Refusal must occur before later verification');},()=>{lateCalls++;throw Error('Refusal must occur before later verification');},{log(){lateCalls++;}}),error=>error.code==='ERR_ASSERTION'&&error.message.includes('Review input changed; rebind and rebuild: '+target));
 assert.equal(intercepted,1);assert.equal(lateCalls,0);
});

test('portable real-helper regression keeps the whole worker test outside exact path/import seams',()=>{
 const original=read('tests/fixtures/head-viewer-disclosure-package.mjs.raw');assert.equal(sha(original),'1882692122fb03a524ad7aa9cd66a62af68c844a5b626857f33926fa72676ac4');let body=read('tests/head-viewer-disclosure-keyboard.test.mjs').toString();
 for(const[from,to]of [
  ["from '../lib/head-disclosure-keyboard.ts';","from './head-disclosure-keyboard.ts';"],
  ["new URL('./fixtures/head-atlas-viewer-before-disclosure.txt',import.meta.url)","new URL('./preimages/HeadAtlasViewer.tsx',import.meta.url)"],
  ["new URL('./fixtures/head-viewer-before-roving.tsx.raw',import.meta.url)","new URL('./HeadAtlasViewer.tsx',import.meta.url)"],
 ]){assert.equal(body.split(from).length-1,1);body=body.replace(from,to);}assert.equal(body,original.toString());
});
