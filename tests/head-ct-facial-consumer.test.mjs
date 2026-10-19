import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {HEAD_LINK_REVISION,headAtlasConceptOptions} from '../lib/head-atlas-links.ts';
import {headReferenceLearningAvailable} from '../lib/head-learning-resource-availability.ts';
import {headCtBoneComparisonPacket} from '../lib/head-ct-bone-comparison-review.ts';
import {headCtFacialTeachingForConcept,headCtFacialTeachingForReference,headCtFacialQuestionForConcept,HEAD_CT_FACIAL_TEACHING_REVISION,verifiedHeadCtFacialTeachingRevision} from '../lib/head-ct-facial-teaching.ts';
import {headCtFacialClinicalForConcept,headCtFacialClinicalForReference,headCtFacialClinicalPacket,HEAD_CT_FACIAL_CLINICAL_REVISION,verifiedHeadCtFacialClinicalRevision} from '../lib/head-ct-facial-clinical.ts';

const root=new URL('../',import.meta.url);
const source=async path=>readFile(new URL(path,root),'utf8');
const ids=['bone-left-zygomatic','bone-right-zygomatic','bone-mandible'];

test('exact source and independent packet pins; stale source and MRI refused',async()=>{
  assert.equal(await verifiedHeadCtFacialTeachingRevision(HEAD_LINK_REVISION),HEAD_CT_FACIAL_TEACHING_REVISION);
  assert.equal(await verifiedHeadCtFacialClinicalRevision(HEAD_LINK_REVISION),HEAD_CT_FACIAL_CLINICAL_REVISION);
  assert.equal(await verifiedHeadCtFacialTeachingRevision('stale'),null);
  assert.equal(await verifiedHeadCtFacialClinicalRevision('stale'),null);
  assert.equal(await verifiedHeadCtFacialClinicalRevision(HEAD_LINK_REVISION,{...headCtFacialClinicalPacket(),tampered:true}),null);
  for(const id of ids){
    assert.ok(headCtFacialTeachingForConcept(id,'CT',HEAD_LINK_REVISION));
    assert.ok(headCtFacialClinicalForConcept(id,'CT',HEAD_LINK_REVISION));
    assert.equal(headCtFacialTeachingForConcept(id,'MRI',HEAD_LINK_REVISION),null);
    assert.equal(headCtFacialClinicalForConcept(id,'MRI',HEAD_LINK_REVISION),null);
    assert.equal(headCtFacialQuestionForConcept(id,HEAD_LINK_REVISION,'stale'),null);
    assert.equal(headCtFacialTeachingForReference(id,'stale'),null);
    assert.equal(headCtFacialClinicalForReference(id,'stale'),null);
    const generic=headCtFacialTeachingForReference(id,HEAD_LINK_REVISION);
    const genericClinical=headCtFacialClinicalForReference(id,HEAD_LINK_REVISION);
    assert.ok(generic&&genericClinical);
    assert.equal(Object.hasOwn(generic,'imaging'),false);
    assert.equal(Object.hasOwn(generic,'task'),false);
    assert.equal(Object.hasOwn(genericClinical,'imaging'),false);
    assert.equal(headReferenceLearningAvailable(id,HEAD_LINK_REVISION),false);
  }
});

test('old 39 reference notes and 42 link identities remain in canonical source',()=>{
  const options=headAtlasConceptOptions();
  assert.equal(options.length,42);
  assert.equal(options.filter(item=>headReferenceLearningAvailable(item.conceptId,HEAD_LINK_REVISION)).length,39);
  assert.equal(headCtBoneComparisonPacket().items.length,6);
});

test('integrated consumers limit generic 3D and preserve compact labels',async()=>{
  const reference=await source('components/HeadAtlasReferenceTeaching.tsx');
  const linked=await source('components/HeadAtlasLinkedModel.tsx');
  const teaching=await source('components/HeadAtlasTeaching.tsx');
  const navigator=await readFile(new URL('../components/HeadAtlasComparisonNavigation.tsx',import.meta.url),'utf8');
  assert.match(reference,/useVerifiedFacialTeaching/);
  assert.match(reference,/No CT observation, CT reading task or patient-space registration/);
  assert.doesNotMatch(reference,/facialClinical\.imaging/);
  assert.match(teaching,/modality==='CT'&&facialReady/);
  assert.match(linked,/facialReady&&FACIAL_CONCEPTS/);
  assert.match(navigator,/Anatomy, clinical notes &amp; quick check · Draft/);
  assert.match(navigator,/No linked reference teaching note is available/);
});

test('Review stays authorized and separately pinned while lazy personal decision panels do not perform server writes',async()=>{
  const page=await source('app/workspace/atlas-review/head-learning/page.tsx');
  const review=await readFile(new URL('../components/HeadCtFacialTeachingReview.tsx',import.meta.url),'utf8');
  assert.ok(page.indexOf('await authorizeClinicalReview()')<page.indexOf('const ctFacialTeachingRevision='));
  assert.match(page,/teachingRevision=\{ctFacialTeachingRevision\} clinicalRevision=\{ctFacialClinicalRevision\}/);
  assert.match(page,/head-ct-facial-teaching-review/);
  assert.match(review,/teachingRevision!==teachingPin/);
  assert.match(review,/clinicalRevision!==clinicalPin/);
  assert.equal((review.match(/<HeadCtFacialDecisionPanel\b/g)??[]).length,2);
  assert.match(review,/kind="teaching"/);assert.match(review,/kind="clinical"/);
  assert.doesNotMatch(review,/<HeadCtFacialDecisionForm|fetch\(|appendFacialDecision|postFacialDecision/);
});
