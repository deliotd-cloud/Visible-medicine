import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const original=new URL('./fixtures/atlas-arterial-evidence-limits-before-current-admission.txt',import.meta.url);
const admitted=new URL('./atlas-arterial-evidence-limits.test.mjs',import.meta.url);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const originalSha='b15cda66fe97f25d6a6a61126f14e87e1f4c7a30d31a27f03ae42fd7238e9c15';
const approvedSourceSha='d44aca96fd00b8b4ee926434acde3423ba2ca9d67197db3410f2e54908605627';
const unchangedTail="test('actual imported resolver, regional reader and Review worksheet agree; forged identities and packets fail'";

test('arterial admission uses the exact reviewed source transformation',()=>{
 const originalBytes=readFileSync(original),admittedBytes=readFileSync(admitted);
 assert.equal(sha(originalBytes),originalSha,'Exact frozen original bytes');
 // This digest admits one complete result, including every allowed substitution
 // and the added current graph proof. A new or weakened assertion changes it.
 assert.equal(sha(admittedBytes),approvedSourceSha,'Exact reviewed source bytes');
 const before=originalBytes.toString('utf8'),after=admittedBytes.toString('utf8');
 assert(before.includes(unchangedTail));assert(after.includes(unchangedTail));
 assert.equal(after.slice(after.indexOf(unchangedTail)),before.slice(before.indexOf(unchangedTail)),
  'Original negative mutations, storage refusal and emitted-output test stay byte-exact');
 for(const proof of [
  "assert.equal(git(atlas,'rev-parse',`${source}^`).toString().trim(),baseline);",
  'same([changed,preserved],[4,9932]);',
  'assert.equal(refused,142);assert.equal(malformedPackets,16);',
  'assert.equal(storageCalls,0);',
 ]){
  assert(before.includes(proof));assert(after.includes(proof),proof);
 }
 assert(after.includes('assert.equal(compared,9936);'));
});
