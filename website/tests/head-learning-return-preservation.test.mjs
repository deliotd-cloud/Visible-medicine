import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {headLearningReturnPredecessor} from './head-learning-return-predecessor.mjs';
import {headLearningPresentationPredecessor} from './head-learning-presentation-predecessor.mjs';
const current=headLearningPresentationPredecessor(fs.readFileSync(new URL('../components/HeadAtlasLearningLibrary.tsx',import.meta.url),'utf8'));
const sha=value=>createHash('sha256').update(value).digest('hex');
test('nine declared return-navigation edits preserve the entire previous learning library',()=>{
  const spec=JSON.parse(fs.readFileSync(new URL('./fixtures/head-learning-return-source.json',import.meta.url)));
  assert.equal(spec.chunks.length,9);
  assert.equal(sha(current),'8d3ef094075e523c440b54fde08b16f5bd88712caeaef877c166a9a6f76ba853');
  const previous=headLearningReturnPredecessor(current);
  assert.equal(sha(previous),'a89b35f41ada3cfee0eee4f788ba230e0a6d83d4e7a100fd153a698175b21ede');
  assert.throws(()=>headLearningReturnPredecessor(current+' '));
  assert.throws(()=>headLearningReturnPredecessor(previous));
  for(const term of ['headLinksCurrent()','headLearningLinks','sequence.concepts','aria-current','window.location.hash','focusedReturnRef.current']){
    assert(current.includes(term));assert.throws(()=>headLearningReturnPredecessor(current.replace(term,term+'Changed')));
  }
});
