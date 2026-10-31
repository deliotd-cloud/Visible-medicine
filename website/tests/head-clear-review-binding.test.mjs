import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateCurrentAtlasDelivery as validateLiveDelivery,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';
import {fileURLToPath} from 'node:url';
const sha=b=>createHash('sha256').update(b).digest('hex');
const successorReceipt=readFileSync('G:/VisibleMedicine-temp/staging/20261031-head-clear-focus/SOURCE.json');
assert.equal(sha(successorReceipt),'889063c7b54d2123a73fa805e529623ea98d731f6ade6dbdb2db5d97825e281a');
const successor=JSON.parse(successorReceipt);
assert.equal(successor.parent.sha256,'ee0f74a5372b1d5a876b79f21b7d006104a8f8254e4c40e3eea1745750642991');
assert.equal(successor.review,'ee28f53f79ea413c860c054f39628dd2225be13b5856849818d2eaf8da73f59c');
const read=p=>{const rows=successor.sourceRows.filter(r=>r.path===p);assert.equal(rows.length,1,p);const bytes=readFileSync(successor.website+'/'+p);assert.equal(bytes.length,rows[0].bytes,p);assert.equal(sha(bytes),rows[0].sha256,p);return bytes;};
for(const [path,expected] of [['tests/current-atlas-delivery.mjs','62831a4e68cdcc3665768782d135c93c1dce77e4f9ad0a6498f9af7cbccfd09b'],['tests/current-delivery-predecessor-inverse.mjs','7bfcf7de04532addaf73364d8cfa28274572191f90f232e32a595a780175896d']])assert.equal(sha(read(path)),expected,path);
const {validateCurrentAtlasDelivery}=await import('file:///G:/VisibleMedicine-temp/staging/20261031-head-clear-focus/website/tests/current-atlas-delivery.mjs');
const {restorePreClearSelectionDeliverySource}=await import('file:///G:/VisibleMedicine-temp/staging/20261031-head-clear-focus/website/tests/current-delivery-predecessor-inverse.mjs');
const receipt=readFileSync('G:/VisibleMedicine-temp/staging/20261031-release22-repairs/SOURCE.json');
assert.equal(sha(receipt),'ee0f74a5372b1d5a876b79f21b7d006104a8f8254e4c40e3eea1745750642991');
const previous=JSON.parse(receipt);
const historicalRead=p=>{const rows=previous.sourceRows.filter(r=>r.path===p);assert.equal(rows.length,1,p);const bytes=readFileSync(previous.website+'/'+p);assert.equal(bytes.length,rows[0].bytes,p);assert.equal(sha(bytes),rows[0].sha256,p);return bytes;};

test('Clear selection changes only the one viewer input and invalidates the preceding presentation',()=>{
 const before=JSON.parse(historicalRead('atlas-review/integration-inputs.json')),after=JSON.parse(read('atlas-review/integration-inputs.json'));
 assert.equal(before.sha256,'cd2912d0b7ba9458cba4eba9bb8a5321d49262602c5ead9f959a9d43946251a3');
 assert.equal(after.sha256,'ee28f53f79ea413c860c054f39628dd2225be13b5856849818d2eaf8da73f59c');
 assert.equal(after.sha256,sha(JSON.stringify(after.inputs)));
 assert.deepEqual(after.inputs.map(r=>r.path),before.inputs.map(r=>r.path));assert.equal(after.inputs.length,1866);
 assert.deepEqual(after.inputs.filter((r,n)=>r.sha256!==before.inputs[n].sha256),[{path:'components/HeadAtlasViewer.tsx',sha256:'4a6ead3cfb9d2e70fcf2cede92a1ebd230758767808c08944a6535624c5f77d9'}]);
 for(const row of after.inputs)assert.equal(sha(read(row.path)),row.sha256,row.path);
 const oldPin=JSON.parse(historicalRead('tests/fixtures/current-atlas-delivery.json')),pin=validateCurrentAtlasDelivery();assert.throws(()=>validateCurrentAtlasDelivery({pin:oldPin}));
 const restored=structuredClone(pin);restored.reviewIntegration=oldPin.reviewIntegration;
 for(const p of ['atlas-review/manifest.json','atlas-review/integration-inputs.json','public/atlas-review-viewer/manifest.json'])restored.documents[p]=oldPin.documents[p];
 assert.deepEqual(restored,oldPin,'Only the generated review presentation and its binding changed');
 const oldRevisions=JSON.parse(historicalRead('atlas-review/content/review-revisions.json')),revisions=JSON.parse(read('atlas-review/content/review-revisions.json'));
 assert.deepEqual(revisions.sourceRevisions,oldRevisions.sourceRevisions);assert.deepEqual(revisions.display,oldRevisions.display);assert.equal(revisions.modelHash,oldRevisions.modelHash);
 const body=JSON.parse(read('atlas-review/content/body-renderer-revision.json')),oldBody=JSON.parse(historicalRead('atlas-review/content/body-renderer-revision.json'));assert.equal(body.sourceRendererSha256,oldBody.sourceRendererSha256);assert.notEqual(body.sha256,oldBody.sha256);
 const viewer=JSON.parse(read('public/atlas-review-viewer/manifest.json'));assert.equal(viewer.websiteIntegrationSha256,after.sha256);assert.equal(viewer.personalRecordsIncluded,false);for(const row of viewer.files)assert.equal(sha(read('public/atlas-review-viewer/'+row.path)),row.sha256,row.path);
});

test('the entire preceding delivery test is retained and unrelated edits are rejected',()=>{
 const source=read('tests/current-atlas-delivery.test.mjs').toString(),prior=historicalRead('tests/current-atlas-delivery.test.mjs').toString();
 assert.equal(restorePreClearSelectionDeliverySource(source),prior);
 assert.throws(()=>restorePreClearSelectionDeliverySource(source+'\n// foreign edit'));
 assert.throws(()=>restorePreClearSelectionDeliverySource(source.replace('assert.equal(current.sha256','assert.equal(current.altered')));
});


test('current Clear selection presentation follows the candidate source and Review binding',()=>{
 const live=fileURLToPath(new URL('../',import.meta.url));
 const pin=validateLiveDelivery();
 currentAtlasDeliveryRoot();
 const binding=JSON.parse(readFileSync(live+'/atlas-review/integration-inputs.json'));
 assert.equal(binding.sourceCommit,pin.source);
 assert.equal(binding.sha256,pin.reviewIntegration);
 assert.equal(binding.sha256,sha(JSON.stringify(binding.inputs)));
 const viewer=readFileSync(live+'/components/HeadAtlasViewer.tsx');
 assert.match(viewer.toString(),/Clear selection/);
 assert.equal(binding.inputs.find(row=>row.path==='components/HeadAtlasViewer.tsx')?.sha256,sha(viewer));
 const review=JSON.parse(readFileSync(live+'/atlas-review/manifest.json'));
 assert.equal(review.revision,pin.source);
 assert.equal(review.websiteIntegrationSha256,binding.sha256);
 assert.equal(JSON.parse(readFileSync(live+'/public/atlas-review-viewer/manifest.json')).websiteIntegrationSha256,binding.sha256);
});


