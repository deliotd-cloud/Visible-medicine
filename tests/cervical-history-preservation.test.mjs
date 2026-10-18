import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const original=new URL('./fixtures/atlas-cervical-projection-xray-before-current-admission.txt',import.meta.url);
const admitted=new URL('./atlas-cervical-projection-xray.test.mjs',import.meta.url);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const originalSha='855dfc3a8ed9da0a86eaf72ca6fa496f19cdaeedec094636e4726b1c664e84d8';
const admittedSha='a5848c319f0df5d21105f2c7710b62a2d94c8858db4a63368ef3a9e826a9b06b';

test('cervical admission preserves exact old evidence and admits only the reviewed repair',()=>{
  const originalBytes=readFileSync(original),admittedBytes=readFileSync(admitted);
  assert.equal(sha(originalBytes),originalSha,'Exact original 589 feature-era test bytes');
  assert.equal(sha(admittedBytes),admittedSha,'Exact reviewed source bytes; any further edit requires review');
  const before=originalBytes.toString('utf8'),after=admittedBytes.toString('utf8');
  for(const proof of [
    "const featureRevision = '589263554141ba94548f9073327d4e51674bc33b';",
    "const priorRevision = 'f1dc0ccc54ec82aa774720db3c822d3e0ea9c418';",
    "const baseline = '408759d57644b05402e98a937e7cf6338b5509cf';",
    "const handBaseline = '8d32653eaac8b86521618c824214dd6af8e35e29';",
    'const source = await sourceApi(featureRevision);',
    'const currentGit = await sourceApi(revision);',
    'assert.equal(currentCompared, 9936);',
    'assert.equal(changed, 6);',
    'assert.equal(supplemental,56);',
    'assert.equal(handChanges,36);',
    'assert.equal(usChanges,8);',
    'assert.equal(currentPreserved,9928);',
    'assert.equal(preserved, 9830);',
    "assert.ok(await source.parseBodyReviewResponse(worksheet, structure.id));",
    "assert.ok(modelCopies >= 1, 'head-neck runtime ships the exact source muscle bundle');",
  ]) assert(after.includes(proof),`Required exact proof: ${proof}`);
  for(const proof of [
    "assert.equal(pins.entries.length, 6);",
    "assert.equal(spinalPins.entries.length,56);",
    "assert.equal(handPins.entries.length,36);",
    "assert.equal(usPins.entries.length, 8);",
    "assert.equal(catalog.structures.length, 1104);",
    "assert.equal(api.contentTabs.length, 9);",
  ]) {assert(before.includes(proof));assert(after.includes(proof));}
  assert(after.includes("same(api.bodyLesson(structure, tab), currentGit.bodyLesson(structure, tab),"));
});
