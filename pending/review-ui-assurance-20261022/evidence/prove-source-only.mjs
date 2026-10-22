import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const stage=resolve(fileURLToPath(new URL('..',import.meta.url)));
const website='F:/VisibleMedicine/staging/20261022-admission-dependent-source-successor/website';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const staged=path=>readFileSync(join(stage,path));
const live=path=>readFileSync(join(website,path));
const expected={
 'CODE/review-navigation-delivery-preservation.test.mjs':'8e640a38c213608bde64fe2e1835e38364728d13d595e18bdff9c9b9e09145cb',
 'CODE/ui-teaching-current-delivery.test.mjs':'4f0aed84267d3adf55699201608a13560b8b829795b1db2aee22b7d251668f8f',
 'RAW/review-navigation-delivery-preservation.test.mjs.raw':'326b425f1d529b590eaa345f94a9dd440ed2bcfe5fbbb19dcb918048a002b995',
 'RAW/ui-teaching-current-delivery.test.mjs.raw':'8d585dd4af1fa8e5c3ed6256e822cdffa9dbbff0e09428aebeb1bf26961b5ed7',
};
assert.equal(sha(readFileSync('F:/VisibleMedicine/staging/20261022-admission-dependent-source-successor/SOURCE.json')),
 '6a022d96197ea86b6fd8c32eed179b7619435c65066a8ff8a49257241434a190');
for(const [path,digest]of Object.entries(expected))assert.equal(sha(staged(path)),digest,path);
for(const path of Object.keys(expected).filter(path=>path.startsWith('CODE/')))
 execFileSync(process.execPath,['--check',join(stage,path)],{windowsHide:true});
console.log('PASS frozen SOURCE receipt, four CODE/RAW hashes and two syntax checks');

const {sourceHunks}=await import(pathToFileURL(join(website,'tests/head-tools-wider-consumer-inverse.mjs')).href);
const sourceProofs={
 'review-navigation-delivery-preservation.test.mjs':[
  'c5193c477ff30b25beb9ac95356f5eb2e8b427e01d80c9c9b29c371e552f6413',
  '9ee2f48591b1f0e95cd779e4e5dd8793d2a4f16a44d38d880cf8fb44b1c01555',
  '7a48f225e74a54e8feeb033bafb12f3a86a0df25299ca1785378da1b3c35c116',
  '771881c9e6041416fa3bb7071d7deaf35520d9d653cd38854ad06acf06eb6b80',
 ],
 'ui-teaching-current-delivery.test.mjs':[
  '3e23f3e22d63faca9ed174f27184c892d099887c7bf428a21b87415040319046',
  'f4ea6edd7a5748f9c52bbfef2ff57c1f0999c5f5fc6818cd6400341aed6a05b0',
 ],
};
for(const [name,digests]of Object.entries(sourceProofs)){
 const old=staged('RAW/'+name+'.raw').toString('utf8'),current=staged('CODE/'+name).toString('utf8');
 assert.deepEqual(Buffer.from(old),staged('RAW/'+name+'.raw'));
 assert.deepEqual(Buffer.from(current),staged('CODE/'+name));
 const hunks=sourceHunks(old,current);
 assert.deepEqual(hunks.map(hunk=>sha(Buffer.from(JSON.stringify(hunk)))),digests,name+' exact source seams');
 const restored=current.split('\n');
 for(const hunk of hunks.toReversed()){
  assert.deepEqual(restored.slice(hunk.newStart,hunk.newStart+hunk.added.length),hunk.added);
  restored.splice(hunk.newStart,hunk.added.length,...hunk.removed);
 }
 assert.equal(restored.join('\n'),old,name+' entire original assertion body');
}
console.log('PASS both whole original test sources restored through exact pinned hunks');

const pinInverse=await import(pathToFileURL(join(website,'tests/current-pin-epoch-inverse.mjs')).href);
const deliveryInverse=await import(pathToFileURL(join(website,'tests/four-consumer-source-inverse.mjs')).href);
const compact=await import(pathToFileURL(join(website,'tests/review-frame-history-inverse.mjs')).href);
const currentPin=live('tests/fixtures/current-atlas-delivery.json');
const intermediatePin=live('tests/fixtures/head-surface-before-20261022/tests__fixtures__current-atlas-delivery.json.raw');
const priorPin=live('tests/fixtures/current-atlas-delivery-before-neck-xray-20261022.json');
assert.deepEqual(pinInverse.restorePreNeckPin(currentPin,intermediatePin,priorPin),priorPin);
for(const index of [0,1,2]){
 const triple=[currentPin,intermediatePin,priorPin];triple[index]=Buffer.concat([triple[index],Buffer.from(' ')]);
 assert.throws(()=>pinInverse.restorePreNeckPin(...triple));
}
const old=JSON.parse(live('tests/fixtures/review-navigation-delivery/current-atlas-delivery.json.raw'));
const compactPin=compact.beforeCompactPin(priorPin);
const changed=Object.keys(old.documents).filter(path=>old.documents[path]!==compactPin.documents[path]).sort();
assert.deepEqual(changed,['atlas-review/integration-inputs.json','atlas-review/manifest.json','public/atlas-review-viewer/manifest.json']);
const reconstructed=structuredClone(compactPin);reconstructed.reviewIntegration=old.reviewIntegration;reconstructed.documents=old.documents;
assert.deepEqual(reconstructed,old);
console.log('PASS current→intermediate→prior pin, three mutations, compact receipt and three Review changes');

const beforeSurface=live('tests/fixtures/head-surface-before-20261022/tests__current-atlas-delivery.test.mjs.raw');
const beforeNeck=live('tests/fixtures/current-atlas-delivery-before-neck-xray-20261022.mjs.raw');
const historicalDelivery=deliveryInverse.restorePreNeckDelivery(live('tests/current-atlas-delivery.test.mjs'),beforeSurface,beforeNeck);
const compactDelivery=compact.beforeCompactDeliveryTest(historicalDelivery.toString()),seam='assert.equal(inputs,1712)';
assert.equal(compactDelivery.split(seam).length,2);
assert.equal(compactDelivery.replace(seam,'assert.equal(inputs,1710)'),
 live('tests/fixtures/review-navigation-delivery/current-atlas-delivery.test.mjs.raw').toString());
assert.throws(()=>deliveryInverse.restorePreNeckDelivery(Buffer.concat([live('tests/current-atlas-delivery.test.mjs'),Buffer.from(' ')]),beforeSurface,beforeNeck));
console.log('PASS complete current→pre-surface→pre-neck→compact delivery-test source and current mutation refusal');

const current=JSON.parse(currentPin),binding=JSON.parse(live('atlas-review/integration-inputs.json')),
 review=JSON.parse(live('atlas-review/manifest.json'));
assert.equal(current.source,'389bd0ca846a42c7f21055f55904bcf5df81a09f');
assert.equal(current.reviewIntegration,'811baffeb0cfa83626ea4f00383d0ed04fe6980716415d2f919151078cdad9b5');
assert.equal(current.reviewSourceFiles,1560);assert.equal(review.files.length,1560);
assert.equal(binding.inputs.length,1727);assert.equal(binding.sourceCommit,current.source);
assert.equal(sha(JSON.stringify(binding.inputs)),current.reviewIntegration);
for(const path of ['atlas-review/integration-inputs.json','atlas-review/manifest.json','public/atlas-review-viewer/manifest.json'])
 assert.equal(sha(live(path)),current.documents[path],path);
console.log('PASS actual Atlas389/Review811b/1560 imported/1727 bound and three current Review documents');
console.log('SOURCE_ONLY_PASS; native UI/Review tests and deeper assertions unverified');
