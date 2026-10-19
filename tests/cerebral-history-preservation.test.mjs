import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const original=new URL('./fixtures/atlas-cerebral-lobar-imaging-before-current-admission.txt',import.meta.url);
const admitted=new URL('./fixtures/current-proof-corrections/atlas-cerebral-lobar-imaging.test.ts.raw',import.meta.url);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const originalSha='2e6587c4bb20edd5cd0251e362d3c9fe678f5b06fa20cf1d0a440abc9ffa401f';
const admittedSha='6c1b1772dac7cf8c26e4bedf304dba8ce2ef1a19535bc059f062a1146cddb720';
const unchangedTail="  assert.deepEqual(json('lib/atlas-model-inventory.json').models,prior('lib/atlas-model-inventory.json').models);";

test('cerebral history admission preserves exact original evidence and worksheet assertions',()=>{
  const originalBytes=readFileSync(original),admittedBytes=readFileSync(admitted);
  assert.equal(sha(originalBytes),originalSha,'Frozen full original test bytes');
  assert.equal(sha(admittedBytes),admittedSha,'Exact reviewed source transformation');
  const before=originalBytes.toString('utf8'),after=admittedBytes.toString('utf8');
  assert(before.includes(unchangedTail));assert(after.includes(unchangedTail));
  assert.equal(after.slice(after.indexOf(unchangedTail)),before.slice(before.indexOf(unchangedTail)),
    'Original anatomy, bindings, safety flags, drafts, landmarks, stale revisions and Review return stay byte-exact');
  for(const proof of [
    "const revision='88cea927d48729769b96ad8fe680b0872b7e6687';",
    "const websiteMilestone='f2f7adbb34af7d7a3bb9affa3ada082fe423ecf6';",
    "const originalSource='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';",
    "const base='c73aeae9b5f0b21091a97612d9ed54f3dd549c8e';",
    "assert.equal(source.sourceSha256,inputs.find((f:any)=>f.path===path)?.sha256);",
    "assert.equal(source.importedSha256,sha(milestoneBytes('atlas-review/'+path)));",
    "assert.equal(count,8);",
  ]){assert(before.includes(proof),proof);assert(after.includes(proof),proof);}
  assert(after.includes("assert.equal(source.sourceSha256,sha(sourceAt(revision,path))"));
  assert(after.includes("assert.equal(offset,blobs.length,'Complete committed source graph')"));
  assert(after.includes("for(const row of liveReview.files){"));
  assert(after.includes("for(const row of liveInputs)assert.equal(row.sha256,sourceHashes.get(row.path)"));
});
