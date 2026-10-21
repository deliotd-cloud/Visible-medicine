import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url)),sha=b=>createHash('sha256').update(b).digest('hex');
const oldCount='assert.equal(inputs.inputs.length, 1679);',newCount='assert.equal(inputs.inputs.length, 1680);';
const oldTour="assert.deepEqual(read('./ui-teaching-current-delivery.test.mjs'),ui);",newTour="assert.equal(read('./ui-teaching-current-delivery.test.mjs').toString().replace('assert.equal(inputs.inputs.length, 1680);','assert.equal(inputs.inputs.length, 1679);'),ui.toString());";

test('same-Atlas pre-disclosure delivery stays immutable and old complete contracts survive the one observed count seam',()=>{
 const before=read('tests/fixtures/current-atlas-delivery-before-head-disclosure-bd5465ee.json');assert.equal(sha(before),'d85631f028d910ace4d9a8c493c1ddbaaa66e3ba44bdc435d8ce5d9951c0ea38');
 const old=JSON.parse(before),now=validateCurrentAtlasDelivery();assert.equal(old.source,now.source);assert.equal(old.sourceTree,now.sourceTree);assert.equal(old.reviewIntegration,'8187a8998fc5b6dc1e4b3d4e8cba60153b1e094b98da7ad43311661d4e54e641');assert.notEqual(now.reviewIntegration,old.reviewIntegration);assert.throws(()=>validateCurrentAtlasDelivery({pin:old}));
 for(const [path,fixture,digest,from,to]of[
  ['tests/current-atlas-delivery.test.mjs','tests/fixtures/current-atlas-delivery-before-head-disclosure-bd5465ee.mjs.raw','871fcea7bf926778e3a6741815216f97897c0a20e54afa2005431eabb7e34935',newCount,oldCount],
  ['tests/ui-teaching-current-delivery.test.mjs','tests/fixtures/ui-teaching-before-head-disclosure-bd5465ee.mjs.raw','a0b9387c12c0ab17528f81ae158448061f9ce865230b08e64762588203f61b6b',newCount,oldCount],
  ['tests/tour-discovery-current-delivery.test.mjs','tests/fixtures/tour-discovery-before-head-disclosure-bd5465ee.mjs.raw','3aff97ad03171a53dbfe9ed0dabc6b162c8559ae338baf47b1931cbf44932849',newTour,oldTour],
 ]){const bytes=read(fixture);assert.equal(sha(bytes),digest);let actual=read(path).toString();if(path==='tests/tour-discovery-current-delivery.test.mjs'){const before='restore=text=>text.split(current.source).join(old.source).split(current.sourceTree).join(old.sourceTree);',after="restore=text=>text.split(current.source).join(old.source).split(current.sourceTree).join(old.sourceTree).replace('assert.equal(inputs.inputs.length, 1680);','assert.equal(inputs.inputs.length, 1679);');";assert.equal(actual.split(after).length-1,1);actual=actual.replace(after,before);}assert.equal(actual.split(from).length-1,1);assert.equal(actual.replace(from,to),bytes.toString(),'Every original whole contract/assertion retained: '+path);}
});

test('normal Review binds the actual disclosure helper and viewer, without changing any Atlas runtime or model policy',()=>{
 const now=validateCurrentAtlasDelivery(),old=JSON.parse(read('tests/fixtures/current-atlas-delivery-before-head-disclosure-bd5465ee.json')),binding=JSON.parse(read('atlas-review/integration-inputs.json'));
 assert.equal(binding.inputs.length,1680);assert.equal(binding.sha256,now.reviewIntegration);assert.equal(sha(JSON.stringify(binding.inputs)),binding.sha256);
 for(const path of ['lib/head-disclosure-keyboard.ts','components/HeadAtlasViewer.tsx','scripts/bind-clinical-review.mjs']){const rows=binding.inputs.filter(row=>row.path===path);assert.equal(rows.length,1);assert.equal(rows[0].sha256,sha(read(path)));}
 for(const name of ['head-neck','shoulder','lower-limb','female-pelvis'])for(const file of ['manifest.json','source-inputs.json']){const path=`public/atlas-runtime/${name}/${file}`;assert.equal(now.documents[path],old.documents[path]);}
 assert.equal(now.documents['lib/atlas-model-inventory.json'],old.documents['lib/atlas-model-inventory.json']);
});

for(const target of ['lib/head-disclosure-keyboard.ts','components/HeadAtlasViewer.tsx'])test('actual stock verifier refuses changed disclosure dependency: '+target,()=>{
 const source=read('scripts/verify-clinical-review.mjs').toString();assert.equal(sha(source),'a97e725ae997c554d00a4d2f18fe6ca4fad02c67a6961df48e919ee20d127179');
 let body=source;for(const line of ["import assert from 'node:assert/strict';","import { readFileSync } from 'node:fs';","import { createHash } from 'node:crypto';","import { verifyPlexusReview } from './verify-plexus-review.mjs';"]){assert.equal(body.split(line).length-1,1);body=body.replace(line,'');}
 let intercepted=0,lateCalls=0;const run=new Function('assert','readFileSync','createHash','verifyPlexusReview','console',body);
 const checkedRead=path=>{const bytes=read(path);if(path===target){intercepted++;return Buffer.concat([bytes,Buffer.from('\n/* SYNTHETIC dependency-tamper probe */\n')]);}return bytes;};
 assert.throws(()=>run(assert,checkedRead,createHash,()=>{lateCalls++;throw Error('Refusal must occur before later verification');},{log(){lateCalls++;}}),error=>error.code==='ERR_ASSERTION'&&error.message.includes('Review input changed; rebind and rebuild: '+target));
 assert.equal(intercepted,1);assert.equal(lateCalls,0);
});

test('portable real-helper regression keeps the whole worker test outside exact path/import seams',()=>{
 const original=read('tests/fixtures/head-viewer-disclosure-package.mjs.raw');assert.equal(sha(original),'1882692122fb03a524ad7aa9cd66a62af68c844a5b626857f33926fa72676ac4');let body=read('tests/head-viewer-disclosure-keyboard.test.mjs').toString();
 for(const[from,to]of [
  ["from '../lib/head-disclosure-keyboard.ts';","from './head-disclosure-keyboard.ts';"],
  ["new URL('./fixtures/head-atlas-viewer-before-disclosure.txt',import.meta.url)","new URL('./preimages/HeadAtlasViewer.tsx',import.meta.url)"],
  ["new URL('../components/HeadAtlasViewer.tsx',import.meta.url)","new URL('./HeadAtlasViewer.tsx',import.meta.url)"],
 ]){assert.equal(body.split(from).length-1,1);body=body.replace(from,to);}assert.equal(body,original.toString());
});
