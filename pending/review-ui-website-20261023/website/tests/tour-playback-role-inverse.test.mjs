import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {restorePlaybackSourceRole} from './tour-playback-role-inverse.mjs';
const after=readFileSync(new URL('./clinical-review-continuous-guided-playback.test.ts',import.meta.url));
test('complete playback role inverse restores every prior assertion and exact line endings',()=>{
 assert.deepEqual(restorePlaybackSourceRole(after),readFileSync(new URL('./clinical-review-continuous-guided-playback.original.ts.raw.preimage',import.meta.url)));
});
test('foreign bytes, removed parser acceptance and missing historical witnesses refuse inverse',()=>{
 for(const bytes of [Buffer.concat([after,Buffer.from('/* foreign */')]),Buffer.from(after.toString().replace('assert.deepEqual(await current.parseBodyReviewResponse(after,structure.id),after);','')),Buffer.from(after.toString().replace("const reviewedRenalEpoch='2381efe43b75f8a7fb768a069eecd7268c508dac';",''))])assert.throws(()=>restorePlaybackSourceRole(bytes));
});
