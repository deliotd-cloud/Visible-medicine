import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

const tests=dirname(fileURLToPath(import.meta.url));
const fixtures=resolve(tests,'fixtures/body-lecture-links');
const laterDeltasBytes=readFileSync(resolve(dirname(fileURLToPath(import.meta.url)),'fixtures/lecture-body-loader-later-deltas.json'));
assert.equal(createHash('sha256').update(laterDeltasBytes).digest('hex'),'51781f3aa6099a76485f1c377f21c0985d198a5b434fbf60e87a34ae2a0404d5','Authenticated later test deltas changed');
const laterDeltas=JSON.parse(laterDeltasBytes.toString('utf8'));
const originals=[
  ['lecture-anatomy-integration.test.ts','186b6b79f718a9f8310230b08e0b4c336ce43ad75589e9c5d10fe2ab77657b01',1],
  ['lecture-multi-anatomy-repository.test.ts','ce16f6b5a647e8d8578ca9e738b0cf096d64b449ab7ed19b2d4d413b086d2052',1],
  ['lecture-repository.test.ts','d57df851e97afb4c292f2b80e400b5df9c4f72fc5ecb6aa715b8b2c86aa55c0e',1],
  ['related-lectures.test.ts','eae79ef9264b91359dfeb1819f369d21f06c3515b5fff8f365b4f2c7f2b45c75',2],
];
const digest=value=>createHash('sha256').update(value).digest('hex');

function removeAuthenticatedLaterDeltas(source,name){
  const edits=laterDeltas[name]??[];
  let inverse=source;
  for(const {at,before,after} of [...edits].reverse()){
    assert.equal(inverse.slice(at,at+after.length),after,`${name}: exact later addition or change at ${at}`);
    inverse=inverse.slice(0,at)+before+inverse.slice(at+after.length);
  }
  return inverse;
}

for(const [name,expectedHash,mockCount] of originals)test(`${name} preserves its entire original except the body mock adapter`,()=>{
  const rawBytes=readFileSync(resolve(fixtures,`${name}.raw`));
  assert.equal(digest(rawBytes),expectedHash,'The immutable original test changed');
  const raw=rawBytes.toString('utf8');
  const candidate=readFileSync(resolve(tests,name),'utf8');
  const newline=raw.includes('\r\n')?'\r\n':'\n';
  const importLine=`import * as lectureBody from '../lib/lecture-body-reference.ts';${newline}`;
  const mockLine=`    './lecture-body-reference.ts':lectureBody,${newline}`;
  assert.equal(candidate.split(importLine).length-1,1,'Exactly one body module import is allowed');
  assert.equal(candidate.split(mockLine).length-1,mockCount,'Every declared repository mock must be present');
  const adapted=candidate.replace(importLine,'').replaceAll(mockLine,'');
  const inverse=removeAuthenticatedLaterDeltas(adapted,name);
  assert.equal(inverse,raw,'The complete existing test source and assertions must be preserved');
});

test('later withdrawal, guided-learning and search safeguards remain in the current tests',()=>{
  const repository=readFileSync(resolve(tests,'lecture-repository.test.ts'),'utf8');
  const related=readFileSync(resolve(tests,'related-lectures.test.ts'),'utf8');
  for(const marker of [
    'withdrawn lecture history remains unavailable to staff and allocated learners while evidence is retained',
    'assert.deepEqual(sqlite.prepare("SELECT manifest_json,integrity_hash,version FROM lecture_versions WHERE workbook_id=?").get(WORKBOOK_ID), preserved);',
  ])assert(repository.includes(marker),`Missing withdrawal safeguard: ${marker}`);
  for(const marker of [
    "import * as structureGuides from '../lib/head-structure-guides.ts';",
    'related guided learning stays collapsed and renders only exact registered step links',
    'invalid or repeated source values cannot reveal a guided-learning entry',
    "assert.doesNotMatch(section,/autoplay|target=|iframe|data-primary/);",
    'Some results are temporarily unavailable',
    'class="search-related-link"',
    'No lecture slides to show',
  ])assert(related.includes(marker),`Missing later safeguard: ${marker}`);
  for(const [name,edits] of Object.entries(laterDeltas)){
    const raw=readFileSync(resolve(tests,name),'utf8');
    const original=readFileSync(resolve(fixtures,`${name}.raw`),'utf8');
    const newline=original.includes('\r\n')?'\r\n':'\n';
    const adapted=raw.replace(`import * as lectureBody from '../lib/lecture-body-reference.ts';${newline}`,'').replaceAll(`    './lecture-body-reference.ts':lectureBody,${newline}`,'');
    assert(edits.length>0,`${name}: later deltas must be explicit`);
    for(const {at,after} of edits){
      assert(after.length>0,`${name}: later delta must contain source`);
      const omitted=adapted.slice(0,at)+adapted.slice(at+after.length);
      assert.throws(()=>assert.equal(removeAuthenticatedLaterDeltas(omitted,name),original),`${name}: deleting a later change must fail`);
      const doubled=adapted.slice(0,at)+after+adapted.slice(at);
      assert.throws(()=>assert.equal(removeAuthenticatedLaterDeltas(doubled,name),original),`${name}: duplicating a later change must fail`);
    }
  }
});
