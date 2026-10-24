import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const page=read('app/workspace/atlas-review/head-learning/page.tsx');
const review=read('components/HeadAtlasTeachingReview.tsx');
const navigator=read('components/HeadTeachingReviewNavigator.tsx');

test('sequence navigation is built only inside the authorized, source-bound review',()=>{
  assert(page.indexOf('await authorizeClinicalReview()')<page.indexOf('const sequenceTargets='));
  assert(page.indexOf('headTeachingDraftContext(HEAD_MANIFEST_SHA256)')<page.indexOf('const sequenceTargets='));
  const gates=[
    ['comparisons&&mriLearningRevision','headMriLearningSequences'],
    ['insulaComparisons&&insulaLearningRevision','headInsulaLearningSequences'],
    ['orbitalComparisons&&orbitalLearningRevision','headOrbitalLearningSequences'],
    ['ctBoneComparisons&&ctBoneLearningRevision','headCtBoneLearningSequences'],
    ['imageOnlyComparisons&&cerebellarLearningRevision','headCerebellarLearningSequences'],
  ];
  for(const [gate,sequences] of gates){
    assert(page.includes(`${gate}?sequenceTargets(${sequences},`),`${sequences} must need both verified packets`);
  }
  assert(page.includes('const ctBoneLearningRevision=ctBoneComparisons?await verifiedHeadCtBoneLearningRevision(HEAD_MANIFEST_SHA256):null;'));
  assert(page.includes('...sequenceTargets(headLearningSequences,HEAD_LEARNING_REVISION)'));
  assert(page.includes("id:'head-guided-sequence-'+sequence.id"));
  assert(page.includes('· Draft · ${revision.slice(0,12)}'));
});

test('each listed packet has a unique sequence anchor inside its existing inspection',()=>{
  const components=[
    ['components/HeadAtlasTeachingReview.tsx','learningPacket.sequences.map'],
    ['components/HeadMriComparisonReview.tsx','headMriLearningPacket().sequences.map'],
    ['components/HeadCtBoneLearningReview.tsx','packet.sequences.map'],
    ['components/HeadOrbitalComparisonReview.tsx','headOrbitalLearningPacket().sequences.map'],
    ['components/HeadInsulaComparisonReview.tsx','headInsulaLearningPacket().sequences.map'],
    ['components/HeadImageOnlyComparisonReview.tsx','headCerebellarLearningSequences.map'],
  ];
  for(const [path,sequenceMap] of components){
    const source=read(path);
    assert(source.includes(sequenceMap),path);
    assert(source.includes("id={'head-guided-sequence-'+sequence.id}"),path);
  }
  assert(review.includes('...additionalTargets]')); // Uses the existing in-page navigator.
  assert(navigator.includes("if(node.tagName==='DETAILS')(node as HTMLDetailsElement).open=true"));
  assert(navigator.includes("if(!target||!main.contains(target))return"));
  assert(navigator.includes("event.preventDefault()"));
  assert(review.includes('does not record a sequence decision'));
});
