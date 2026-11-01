import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {reconstructUmGuidedEpochParent} from './um-guided-epoch-split-inverse.mjs';
test('UM epoch role split recovers the entire untouched original proof',()=>{
 reconstructUmGuidedEpochParent(readFileSync(new URL('./atlas-um-guided-dissection.test.ts',import.meta.url)),readFileSync(new URL('./um-guided-epoch-original.test.ts.raw',import.meta.url)));
});

test('UM role integrity rejects lost refusal checks, false epochs and disabled tests',()=>{
 const proposed=readFileSync(new URL('./atlas-um-guided-dissection.test.ts',import.meta.url));
 const original=readFileSync(new URL('./um-guided-epoch-original.test.ts.raw',import.meta.url));
 const text=proposed.toString('utf8');
 for(const [before,after] of [
  ["const current = await load('original'), previous = await load('before');", "const current = await load(), previous = await load('before');"],
  ["assert.equal(guided, 154); assert.equal(rejected, 462);", "assert.equal(guided, 154);"],
  ["assert.equal(sha(bytes), exactNoticeHashes[moduleSource], path + ': exact emitted full notice hash');", "assert(true);"],
  ["test('current guided materials require continuous playback review and draft depth review'", "test.skip('current guided materials require continuous playback review and draft depth review'"],
 ]){
  assert.equal(text.split(before).length,2,'One exact tamper target');
  assert.throws(()=>reconstructUmGuidedEpochParent(Buffer.from(text.replace(before,after)),original));
 }
 const corrupt=Buffer.from(original);corrupt[0]^=1;
 assert.throws(()=>reconstructUmGuidedEpochParent(proposed,corrupt));
});
