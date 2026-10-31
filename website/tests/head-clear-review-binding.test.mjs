import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {restorePreClearSelectionDeliverySource} from './current-delivery-predecessor-inverse.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const read=p=>readFileSync(new URL('../'+p,import.meta.url));
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
