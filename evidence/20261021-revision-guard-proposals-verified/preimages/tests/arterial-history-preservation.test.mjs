import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const original=new URL('./fixtures/atlas-arterial-evidence-limits-before-current-admission.txt',import.meta.url);
const admitted=new URL('./atlas-arterial-evidence-limits.test.mjs',import.meta.url);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const originalSha='b15cda66fe97f25d6a6a61126f14e87e1f4c7a30d31a27f03ae42fd7238e9c15';
const approvedSourceSha='d44aca96fd00b8b4ee926434acde3423ba2ca9d67197db3410f2e54908605627';
const currentSourceSha='7b105f5146aab1653aedca9a7150a73733575f87e7e848063cb07e8faea9b843';
const unchangedTail="test('actual imported resolver, regional reader and Review worksheet agree; forged identities and packets fail'";

test('arterial admission uses the exact reviewed source transformation',()=>{
 const originalBytes=readFileSync(original),admittedBytes=readFileSync(admitted);
 assert.equal(sha(originalBytes),originalSha,'Exact frozen original bytes');
 // This digest admits one complete result, including every allowed substitution
 // and the added current graph proof. A new or weakened assertion changes it.
 assert.equal(sha(admittedBytes),currentSourceSha,'Exact current arterial source bytes');
 const before=originalBytes.toString('utf8'),after=admittedBytes.toString('utf8');
 const marker="\ntest('original arterial Website contract survives the exact pre-MRA feature retention adapter'";
 assert.equal(after.split(marker).length,2,'one exact MRA lineage assertion');
 const adapter="    same(git(atlas,'show',`6036a7a59dcc1fd75eee4a23af34ca2a568d86b6:${path}`),git(atlas,'show',`${source}:${path}`),`Feature source retained ${path}`);";
 const previous="    same(committed,git(atlas,'show',`${source}:${path}`),`Feature source retained ${path}`);";
 const adapted=after.slice(0,after.indexOf(marker));
 assert.equal(adapted.split(adapter).length,2,'one exact pre-MRA source comparison');
 const preMra=adapted.replace(adapter,previous);
 assert.equal(sha(Buffer.from(preMra)),approvedSourceSha,'Complete prior reviewed arterial source reconstructs');
 assert(before.includes(unchangedTail));assert(preMra.includes(unchangedTail));
 assert.equal(preMra.slice(preMra.indexOf(unchangedTail)),before.slice(before.indexOf(unchangedTail)),
  'Original negative mutations, storage refusal and emitted-output test stay byte-exact');
 for(const proof of [
  "assert.equal(git(atlas,'rev-parse',`${source}^`).toString().trim(),baseline);",
  'same([changed,preserved],[4,9932]);',
  'assert.equal(refused,142);assert.equal(malformedPackets,16);',
  'assert.equal(storageCalls,0);',
 ]){
  assert(before.includes(proof));assert(preMra.includes(proof),proof);
 }
 assert(preMra.includes('assert.equal(compared,9936);'));
});
