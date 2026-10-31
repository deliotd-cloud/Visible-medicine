import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {restorePlaybackReasoningRole,restoreCurrentPlaybackReasoningEpoch} from './playback-reasoning-epoch.mjs';
const bytes=readFileSync(new URL('./clinical-review-continuous-guided-playback.test.ts',import.meta.url));
const historicalPath='F:/VisibleMedicine/staging/20261023-review-ui-website';
const historical=readFileSync(historicalPath+'/website/tests/clinical-review-continuous-guided-playback.test.ts');
const receiptBytes=readFileSync(historicalPath+'/SOURCE_BOUND.json');
test('current reasoning roles retain the complete preceding playback test byte for byte',()=>{
 assert.equal(createHash('sha256').update(receiptBytes).digest('hex'),'1deb9b7f54fe19a720dcfb0456dba41838e14741b57e716aeed79a672b9dd280');
 const receipt=JSON.parse(receiptBytes),row=receipt.sourceRows.find(r=>r.path==='tests/clinical-review-continuous-guided-playback.test.ts');
 assert.equal(receipt.website,historicalPath+'/website');
 assert.equal(row.sha256,createHash('sha256').update(historical).digest('hex'));
 assert.deepEqual(restoreCurrentPlaybackReasoningEpoch(bytes),historical);
 assert.deepEqual(restorePlaybackReasoningRole(historical),readFileSync(new URL('./fixtures/review-ui-delivery-before/continuous-playback.before-reasoning.ts.raw',import.meta.url)));
});
test('removed current or historical reasoning assertions and foreign bytes refuse the inverse',()=>{
 for(const bad of [Buffer.concat([bytes,Buffer.from('// foreign')]),Buffer.from(bytes.toString().replace('assert.deepEqual(atPlayback.reasoning,before.reasoning,','assert.deepEqual(after.reasoning,before.reasoning,')),Buffer.from(bytes.toString().replace('wire(await reasoning.bodyReviewMaterial(structure.id)).reasoning','null'))])assert.throws(()=>restoreCurrentPlaybackReasoningEpoch(bad));
});

test('original reasoning-role inverse still refuses altered epoch witnesses',()=>{
 for(const bad of [Buffer.concat([historical,Buffer.from('// foreign')]),Buffer.from(historical.toString().replace('assert.deepEqual(atPlayback.reasoning,before.reasoning,','assert.deepEqual(after.reasoning,before.reasoning,')),Buffer.from(historical.toString().replace('wire(await carpal.bodyReviewMaterial(structure.id)).reasoning','null'))])
  assert.throws(()=>restorePlaybackReasoningRole(bad));
});
