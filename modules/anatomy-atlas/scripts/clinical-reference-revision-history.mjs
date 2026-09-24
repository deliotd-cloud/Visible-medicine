// Offline historical reconstruction only; never imported by viewer/review APIs.
import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import { prePelvicUrethralProfiles } from './pelvic-urethral-study-history.mjs';
import { authoringBeforeCoreOrganFunction } from './core-organ-function-history.mjs';
import { beforeForearmVenousImaging } from './forearm-venous-imaging-history.mjs';
import { authoringBeforeThoracoabdominalOrganXray } from './thoracoabdominal-organ-xray-history.mjs';
import { authoringBeforeSpineUltrasound } from './spine-ultrasound-history.mjs';
import { preLiverAnatomyCoverage } from './liver-anatomy-coverage-history.mjs';
import baseline from '../content/clinical-reference-revision.baseline.json' with { type: 'json' };
import transition from '../content/clinical-reference-revision.transition.json' with { type: 'json' };
import {
  clinicalReferenceRevisionHash as hash,
  wholeBodyTeachingSnapshot,
} from './clinical-reference-revision-tools.mjs';

const copy = value => structuredClone(value);
const same = (a, b) => isDeepStrictEqual(a, b);

function verifyRecords() {
  assert.equal(
    hash(baseline),
    'c917f8c95721a2fe7ce9fc892469ade031f1bbf861bba6df26cc9e95e9b088be',
    'Immutable clinical-reference baseline changed',
  );
  assert.equal(baseline.sourceCommit, '3584fc178a408b42caf430b9084e55198a0d18c6');
  assert.equal(hash(baseline.selected), baseline.selectedHash);
  assert.equal(hash(baseline.fullSource), baseline.fullSourceHash);
  assert.equal(
    hash(transition),
    '7e5a1d320e7b7e3c9baaf551be278781e1f3997c2c309280755b4fd9c86dcd3f',
    'Recorded clinical-reference transition changed',
  );
  assert.equal(transition.parentCommit, baseline.sourceCommit);
  assert.equal(hash(transition.selected), transition.selectedHash);
  assert.equal(hash(transition.fullSource), transition.fullSourceHash);
  assert.equal(transition.status, 'recorded');
  assert.notEqual(transition.selectedHash, baseline.selectedHash);
}

verifyRecords();

/** Restore only the four revised urethral body lessons. */
export function authoringBeforeClinicalReferenceRevision({ api, catalog }) {
  api = authoringBeforeThoracoabdominalOrganXray({ api, catalog }).api;
  api = authoringBeforeSpineUltrasound({ api, catalog });
  api = beforeForearmVenousImaging(api);
  api = authoringBeforeCoreOrganFunction({ api, catalog }, {deferWholeSnapshot: true});
  api = preLiverAnatomyCoverage(api, catalog);
  const recipes = prePelvicUrethralProfiles(api.dissectionProfiles, {allowOlder: true});
  if (recipes !== api.dissectionProfiles) api = {...api, dissectionProfiles: recipes};
  const identity = baseline.selected.pelvic.identity;
  const currentIdentity = api
    .bodyDisplayCatalog(catalog)
    .structures.find(structure => structure.id === identity.id);
  assert.deepEqual(currentIdentity, identity, 'Clinical-reference source identity changed');
  const current = Object.fromEntries(
    Object.keys(baseline.selected.pelvic.lessons).map(topic => [
      topic,
      api.bodyLesson(identity, topic),
    ]),
  );
  if (same(current, baseline.selected.pelvic.lessons)) return api;
  assert.equal(transition.status, 'recorded', 'Clinical reference transition is not recorded');
  assert.deepEqual(
    current,
    transition.selected.pelvic.lessons,
    'Unrecorded clinical reference revision',
  );
  assert.equal(
    hash(wholeBodyTeachingSnapshot(api, catalog)),
    transition.wholeBodyHash,
    'Unrecorded whole-body teaching change after clinical reference revision',
  );
  const bodyLesson = (structure, topic) => {
    if (
      structure.id !== identity.id ||
      !Object.hasOwn(baseline.selected.pelvic.lessons, topic)
    )
      return api.bodyLesson(structure, topic);
    assert.deepEqual(structure, identity, 'Cannot reconstruct a different urethral source');
    return copy(baseline.selected.pelvic.lessons[topic]);
  };
  const historical = {
    ...api,
    bodyLesson,
    bodyContent(structure, topic) {
      const { readiness: _readiness, ...content } = bodyLesson(structure, topic);
      return content;
    },
  };
  assert.equal(
    hash(wholeBodyTeachingSnapshot(historical, catalog)),
    baseline.wholeBodyHash,
    'Clinical-reference adapter did not reconstruct the exact baseline',
  );
  return historical;
}

function previousSelected(kind, current) {
  const before = baseline.selected[kind];
  if (same(current, before)) return copy(before);
  assert.equal(transition.status, 'recorded', 'Clinical reference transition is not recorded');
  assert.deepEqual(current, transition.selected[kind], `Unrecorded ${kind} clinical reference revision`);
  return copy(before);
}

/** Historical data projection for immutable nested-teaching digest assertions. */
export function nestedBeforeClinicalReferenceRevision(api) {
  const revisedReferenceKeys = new Set(
    [
      ...Object.keys(baseline.fullSource.nested.references),
      ...Object.keys(transition.fullSource.nested.references),
    ],
  );
  const oldReferences = baseline.fullSource.nested.references;
  const currentReferences = Object.fromEntries(
    [...revisedReferenceKeys]
      .filter(key => Object.hasOwn(api.nestedTeachingReferences, key))
      .map(key => [key, copy(api.nestedTeachingReferences[key])]),
  );
  const currentConcept = copy(api.nestedConcepts.find(
    concept => concept.id === 'renal-ureteric-arteries',
  ));
  const referencesAreBefore = same(currentReferences, oldReferences);
  const conceptIsBefore = same(currentConcept, baseline.selected.nested.concept);
  if (!referencesAreBefore)
    assert.deepEqual(currentReferences, transition.fullSource.nested.references, 'Unrecorded nested renal reference revision');
  if (!conceptIsBefore)
    assert.deepEqual(currentConcept, transition.selected.nested.concept, 'Unrecorded nested renal concept revision');
  assert.equal(referencesAreBefore, conceptIsBefore, 'Mixed nested renal history state');
  return {
    ...api,
    nestedTeachingReferences: Object.fromEntries(
      Object.entries(api.nestedTeachingReferences).flatMap(([key, value]) => {
        if (Object.hasOwn(oldReferences, key)) return [[key, copy(oldReferences[key])]];
        return revisedReferenceKeys.has(key) ? [] : [[key, value]];
      }),
    ),
    nestedConcepts: api.nestedConcepts.map(concept =>
      concept.id === baseline.selected.nested.concept.id
        ? copy(baseline.selected.nested.concept)
        : concept,
    ),
  };
}

/** Historical HRA projection for exact pre-revision checks. */
export function hraBeforeClinicalReferenceRevision(current) {
  return previousSelected('hra', current);
}

export { baseline as clinicalReferenceRevisionBaseline, transition as clinicalReferenceRevisionTransition };
