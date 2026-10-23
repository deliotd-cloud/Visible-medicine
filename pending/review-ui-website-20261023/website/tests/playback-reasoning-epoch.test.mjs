import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {restorePlaybackReasoningRole} from './playback-reasoning-epoch.mjs';
const bytes=readFileSync(new URL('./clinical-review-continuous-guided-playback.test.ts',import.meta.url));
test('current reasoning roles retain the complete preceding playback test byte for byte',()=>{
 assert.deepEqual(restorePlaybackReasoningRole(bytes),readFileSync(new URL('./fixtures/review-ui-delivery-before/continuous-playback.before-reasoning.ts.raw',import.meta.url)));
});
test('removed current or historical reasoning assertions and foreign bytes refuse the inverse',()=>{
 for(const bad of [Buffer.concat([bytes,Buffer.from('// foreign')]),Buffer.from(bytes.toString().replace('assert.deepEqual(atPlayback.reasoning,before.reasoning,','assert.deepEqual(after.reasoning,before.reasoning,')),Buffer.from(bytes.toString().replace('wire(await carpal.bodyReviewMaterial(structure.id)).reasoning','null'))])assert.throws(()=>restorePlaybackReasoningRole(bad));
});
