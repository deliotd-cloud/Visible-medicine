import assert from 'node:assert/strict';
import test from 'node:test';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import {headLearningLinks,headLearningNavigation,headLearningSequencesForModality} from '../lib/head-atlas-learning.ts';
import {headLinksCurrent} from '../lib/head-link-availability.ts';
import {HEAD_LEARNING_BOOKMARK_KEY,createHeadLearningBookmark,parseHeadLearningBookmark,resolveHeadLearningBookmark,type HeadLearningBookmark} from '../lib/head-learning-bookmark.ts';
import {HEAD_MRI_LEARNING_REVISION} from '../lib/head-mri-learning.ts';
import {HEAD_CT_BONE_LEARNING_REVISION} from '../lib/head-ct-bone-learning.ts';
import {HEAD_CT_FACIAL_LEARNING_REVISION} from '../lib/head-ct-facial-learning.ts';

const sequences=headLearningSequencesForModality();
const sample=()=>createHeadLearningBookmark({sequenceId:'brainstem',conceptId:'brainstem-pons'})!;
const parse=(value:unknown)=>parseHeadLearningBookmark(JSON.stringify(value)??null);

test('every step in all thirteen independently pinned draft sequences round trips to canonical navigation',()=>{
  assert.equal(HEAD_LEARNING_BOOKMARK_KEY,'vm.head-learning-bookmark.v1');
  assert.equal(headLinksCurrent(),true);
  assert.equal(sequences.length,13);
  for(const sequence of sequences)for(const conceptId of sequence.concepts){
    const position={sequenceId:sequence.id,conceptId};
    const bookmark=createHeadLearningBookmark(position);
    assert(bookmark,`${sequence.id}/${conceptId}`);
    assert.deepEqual(Object.keys(bookmark),['schema','sequenceId','conceptId','headRevision','sequenceRevision']);
    assert.equal(bookmark.headRevision,HEAD_LINK_REVISION);
    assert.deepEqual(parseHeadLearningBookmark(JSON.stringify(bookmark)),bookmark);
    assert.deepEqual(resolveHeadLearningBookmark(bookmark),headLearningNavigation(position)??headLearningNavigation(position,'CT'));
    assert.deepEqual(resolveHeadLearningBookmark(bookmark)?.current,headLearningLinks(position));
  }
});

test('independent sequence revision is bound to the sequence family',()=>{
  const mri=createHeadLearningBookmark({sequenceId:'mri-amygdalae',conceptId:'limbic-left-amygdala'});
  const ct=createHeadLearningBookmark({sequenceId:'ct-nasal-ethmoid',conceptId:'bone-left-nasal'});
  assert.equal(mri?.sequenceRevision,HEAD_MRI_LEARNING_REVISION);
  assert.equal(ct?.sequenceRevision,HEAD_CT_BONE_LEARNING_REVISION);
  const facial=createHeadLearningBookmark({sequenceId:'ct-facial-coverage',conceptId:'bone-mandible'});
  assert.equal(facial?.sequenceRevision,HEAD_CT_FACIAL_LEARNING_REVISION);
  assert.notEqual(facial?.sequenceRevision,ct?.sequenceRevision);
  assert.equal(parse({...facial,sequenceRevision:sample().sequenceRevision}),null);
  assert.equal(parse({...facial,sequenceRevision:HEAD_CT_BONE_LEARNING_REVISION}),null);
  assert.notEqual(sample().sequenceRevision,mri?.sequenceRevision);
  assert.notEqual(sample().sequenceRevision,ct?.sequenceRevision);
  assert.equal(parse({...sample(),headRevision:'stale'}),null);
  assert.equal(parse({...sample(),sequenceRevision:'stale'}),null);
  assert.equal(parse({...mri,sequenceRevision:sample().sequenceRevision}),null);
  assert.equal(parse({...ct,sequenceRevision:HEAD_MRI_LEARNING_REVISION}),null);
});

test('unknown IDs, wrong memberships and incomplete positions fail closed',()=>{
  assert.equal(createHeadLearningBookmark({sequenceId:'unknown',conceptId:'brainstem-pons'}),null);
  assert.equal(createHeadLearningBookmark({sequenceId:'brainstem',conceptId:'ventricle-third'}),null);
  assert.equal(createHeadLearningBookmark({sequenceId:'brainstem',conceptId:null}),null);
  assert.equal(parse({...sample(),sequenceId:'unknown'}),null);
  assert.equal(parse({...sample(),conceptId:'unknown'}),null);
  assert.equal(parse({...sample(),conceptId:'ventricle-third'}),null);
});

test('malformed, oversized, extended and identity-bearing storage values are rejected',()=>{
  for(const raw of [null,'','not json','{',' '.repeat(513)]){
    assert.equal(parseHeadLearningBookmark(raw),null);
  }
  for(const value of [
    [],null,{}, {...sample(),schema:2}, {...sample(),schema:'1'},
    {schema:1,sequenceId:'brainstem',conceptId:'brainstem-pons',headRevision:HEAD_LINK_REVISION},
    {...sample(),conceptId:3}, {...sample(),sequenceRevision:null},
    {...sample(),atlasHref:'https://example.invalid'}, {...sample(),url:'/unsafe'},
    {...sample(),patientName:'Example'}, {...sample(),studyId:'private'},
    {...sample(),fileHandle:'opaque'}, {...sample(),quizAnswers:[]},
    {...sample(),completed:true}, {...sample(),timestamp:1},
  ])assert.equal(parse(value),null);
});

test('canonical modality omissions and URLs are rebuilt from the current links',()=>{
  const mri=resolveHeadLearningBookmark(createHeadLearningBookmark({sequenceId:'mri-amygdalae',conceptId:'limbic-left-amygdala'})!);
  const ct=resolveHeadLearningBookmark(createHeadLearningBookmark({sequenceId:'ct-nasal-ethmoid',conceptId:'bone-left-nasal'})!);
  assert(mri&&ct);
  assert.equal(mri.current.ctHref,undefined);
  assert.equal(ct.current.mriHref,undefined);
  for(const href of [mri.current.atlasHref,mri.current.mriHref!,ct.current.atlasHref,ct.current.ctHref!]){
    assert(href);assert(href.startsWith('/'));
    assert(href.includes(`headRevision=${HEAD_LINK_REVISION}`));
    assert(!href.includes('example.invalid'));
  }
});

test('tampered in-memory bookmark objects also fail closed',()=>{
  const valid=sample();
  const tampered:HeadLearningBookmark={...valid,headRevision:'stale'};
  assert.equal(resolveHeadLearningBookmark(tampered),null);
  assert.equal(resolveHeadLearningBookmark({...valid,sequenceRevision:'stale'}),null);
  assert.equal(resolveHeadLearningBookmark({...valid,conceptId:'ventricle-third'}),null);
  assert.equal(resolveHeadLearningBookmark({...valid,url:'https://example.invalid'} as HeadLearningBookmark),null);
  assert.equal(resolveHeadLearningBookmark(Object.defineProperty({...valid},'studyId',{value:'private'}) as HeadLearningBookmark),null);
  assert.equal(resolveHeadLearningBookmark(null as unknown as HeadLearningBookmark),null);
});
