import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import pelvicPins from '../content/pelvic-organ-imaging-pins.json' with { type: 'json' };
import { contentContext } from './content-contract-tools.mjs';
import {
  currentClinicalReferenceProjection,
  clinicalReferenceRevisionHash as hash,
  wholeBodyTeachingSnapshot,
} from './clinical-reference-revision-tools.mjs';
import {
  authoringBeforeClinicalReferenceRevision,
  clinicalReferenceRevisionBaseline as baseline,
  clinicalReferenceRevisionTransition as transition,
  hraBeforeClinicalReferenceRevision,
  nestedBeforeClinicalReferenceRevision,
} from './clinical-reference-revision-history.mjs';

const current = await currentClinicalReferenceProjection();
assert.equal(transition.status, 'recorded');
for (const key of ['selectedHash', 'fullSourceHash', 'wholeBodyHash'])
  assert.equal(current[key], transition[key], `Recorded ${key}`);
assert.deepEqual(current.selected, transition.selected);
assert.deepEqual(current.fullSource, transition.fullSource);

const normalize = value => ({
  ...value,
  nested: {
    ...value.nested,
    concepts: Object.fromEntries(value.nested.concepts.map(c => [c.id, c])),
  },
});
function changedPaths(before, after, path = []) {
  if (JSON.stringify(before) === JSON.stringify(after)) return [];
  if (
    before === null || after === null ||
    typeof before !== 'object' || typeof after !== 'object' ||
    Array.isArray(before) || Array.isArray(after)
  ) return [path.join('.')];
  return [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .flatMap(key => changedPaths(before[key], after[key], [...path, key]));
}
const changes = changedPaths(
  normalize(baseline.fullSource),
  normalize(transition.fullSource),
).sort();
const allowed = [
  'hra.references.ccBy4', 'hra.references.haematoma',
  'hra.references.rcc.title', 'hra.references.rcc.url',
  'hra.references.trauma.title', 'hra.references.trauma.url',
  'hra.concepts.capsule.refs',
  ...['clinical', 'pathology', 'ct', 'mri', 'ultrasound'].flatMap(topic => [
    `hra.topicFamilies.capsule.${topic}.body`,
    `hra.topicFamilies.capsule.${topic}.references`,
  ]),
  ...['clinical', 'pathology', 'ct'].flatMap(topic => [
    `hra.topicFamilies.hilum.${topic}.body`,
    `hra.topicFamilies.hilum.${topic}.references`,
  ]),
  ...['ct', 'mri'].flatMap(topic => [
    `hra.topicFamilies.vein.${topic}.body`,
    `hra.topicFamilies.vein.${topic}.references`,
  ]),
  'nested.references.renalReuseLicense',
  'nested.references.renalUreterInjury.title',
  'nested.references.renalUreterInjury.url',
  'nested.concepts.renal-ureteric-arteries.sections.pathology.body',
  'nested.concepts.renal-ureteric-arteries.sections.pathology.references',
  'nested.concepts.renal-ureteric-arteries.imaging.ct.body',
  'nested.concepts.renal-ureteric-arteries.imaging.ct.references',
  'pelvic.references.ccBy4', 'pelvic.references.urethra',
  ...['ct', 'mri', 'ultrasound', 'xray'].flatMap(topic => [
    `pelvic.topics.urethra.${topic}.body`,
    `pelvic.topics.urethra.${topic}.bullets`,
    `pelvic.topics.urethra.${topic}.references`,
  ]),
].sort();
assert.deepEqual(changes, allowed, 'Only approved factual-reference leaves changed');

const context = await contentContext();
const historical = authoringBeforeClinicalReferenceRevision(context);
assert.equal(
  hash(wholeBodyTeachingSnapshot(historical, context.catalog)),
  baseline.wholeBodyHash,
);
for (const [topic, lesson] of Object.entries(baseline.selected.pelvic.lessons))
  assert.deepEqual(historical.bodyLesson(baseline.selected.pelvic.identity, topic), lesson);
const historicalTwice = authoringBeforeClinicalReferenceRevision({
  api: historical,
  catalog: context.catalog,
});
assert.equal(
  hash(wholeBodyTeachingSnapshot(historicalTwice, context.catalog)),
  baseline.wholeBodyHash,
  'Historical adapter is idempotent',
);
const badApi = {
  ...context.api,
  bodyLesson(structure, topic) {
    const lesson = context.api.bodyLesson(structure, topic);
    return structure.id === baseline.selected.pelvic.identity.id && topic === 'ct'
      ? { ...lesson, body: lesson.body + ' unrecorded' }
      : lesson;
  },
};
assert.throws(
  () => authoringBeforeClinicalReferenceRevision({ api: badApi, catalog: context.catalog }),
  /Unrecorded clinical reference revision/,
);
const unrelated = context.api
  .bodyDisplayCatalog(context.catalog)
  .structures.find(structure => structure.id !== baseline.selected.pelvic.identity.id);
const unrelatedApi = {
  ...context.api,
  bodyLesson(structure, topic) {
    const lesson = context.api.bodyLesson(structure, topic);
    return structure.id === unrelated.id && topic === 'anatomy'
      ? { ...lesson, body: lesson.body + ' unrecorded' }
      : lesson;
  },
};
assert.throws(
  () => authoringBeforeClinicalReferenceRevision({ api: unrelatedApi, catalog: context.catalog }),
  /Unrecorded whole-body teaching change/,
);

const nestedCurrent = {
  nestedConcepts: transition.fullSource.nested.concepts,
  nestedTeachingReferences: transition.fullSource.nested.references,
};
const nestedHistorical = nestedBeforeClinicalReferenceRevision(nestedCurrent);
assert.deepEqual(nestedHistorical.nestedConcepts, baseline.fullSource.nested.concepts);
assert.deepEqual(nestedHistorical.nestedTeachingReferences, baseline.fullSource.nested.references);
for (const mutate of [
  refs => { refs.renalUrinaryImaging.title += ' unrecorded'; },
  refs => { refs.renalReuseLicense.url += 'unrecorded'; },
]) {
  const references = structuredClone(transition.fullSource.nested.references);
  mutate(references);
  assert.throws(
    () => nestedBeforeClinicalReferenceRevision({
      nestedConcepts: structuredClone(transition.fullSource.nested.concepts),
      nestedTeachingReferences: references,
    }),
    /Unrecorded nested renal reference revision/,
  );
}
assert.deepEqual(
  hraBeforeClinicalReferenceRevision(transition.selected.hra),
  baseline.selected.hra,
);
for (const topic of ['ct', 'mri']) {
  assert.notDeepEqual(
    transition.fullSource.hra.topicFamilies.vein[topic],
    baseline.fullSource.hra.topicFamilies.vein[topic],
    `HRA renal-vein ${topic} revision is explicit`,
  );
  assert(transition.fullSource.hra.topicFamilies.vein[topic].references.includes(
    transition.fullSource.hra.references.rcc.url,
  ));
}

const httpsReferences = [
  ...Object.values(transition.fullSource.hra.references),
  ...Object.values(transition.fullSource.nested.references),
  ...Object.values(transition.fullSource.pelvic.references).map(url => ({ url })),
];
for (const reference of httpsReferences)
  assert.equal(new URL(reference.url).protocol, 'https:');
for (const key of ['ccBy4'])
  assert.equal(transition.fullSource.hra.references[key].url, 'https://creativecommons.org/licenses/by/4.0/');
assert.equal(transition.fullSource.nested.references.renalReuseLicense.url, 'https://creativecommons.org/licenses/by/4.0/');
assert.equal(transition.fullSource.pelvic.references.ccBy4, 'https://creativecommons.org/licenses/by/4.0/');

const wordCount = text => text.match(/\S+/g)?.length || 0;
const budgets = {};
const add = (key, text) => { budgets[key] = (budgets[key] || 0) + wordCount(text); };
for (const family of Object.values(transition.fullSource.hra.topicFamilies))
  for (const topic of Object.values(family))
    for (const url of topic.references.filter(url => !url.includes('creativecommons.org')))
      add(url, topic.body);
const renal = transition.fullSource.nested.concepts[0];
for (const section of [renal.sections.pathology, renal.imaging.ct])
  for (const key of section.references.filter(key => key !== 'renalReuseLicense'))
    add(transition.fullSource.nested.references[key].url, section.body);
for (const topic of Object.values(transition.fullSource.pelvic.topics.urethra))
  for (const key of topic.references.filter(key => key !== 'ccBy4'))
    add(transition.fullSource.pelvic.references[key], [topic.body, ...topic.bullets].join(' '));
for (const [source, words] of Object.entries(budgets))
  assert(words <= 200, `${source}: ${words} source-attributed words`);

const pelvicBefore = (structure, topic) => {
  const entry = pelvicPins.entries.find(candidate => candidate.identity.id === structure.id);
  return entry?.topics.includes(topic)
    ? entry.previous[topic]
    : historical.bodyLesson(structure, topic);
};
const display = historical.bodyDisplayCatalog(context.catalog);
const legacyPelvicActual = hash({
  body: display.structures.map(structure => ({
    id: structure.id,
    sections: Object.fromEntries(historical.contentTabs.map(topic => [topic, pelvicBefore(structure, topic)])),
  })),
  shoulder: historical.structures,
  recipes: historical.dissectionProfiles,
});
const report = {
  baselineCommit: baseline.sourceCommit,
  changedLeaves: changes.length,
  reconstructedWholeBodyHash: baseline.wholeBodyHash,
  currentWholeBodyHash: transition.wholeBodyHash,
  sourceWordCounts: budgets,
  legacyPelvicGate: {
    command: 'node scripts/validate-pelvic-organ-imaging.mjs',
    expected: pelvicPins.previousAllLessonsAndRecipesHash,
    actualAfterExactRevisionRollback: legacyPelvicActual,
    preExistingMismatch: legacyPelvicActual !== pelvicPins.previousAllLessonsAndRecipesHash,
  },
  legacyNestedPinGate: {
    command: 'npm run nested-teaching:test',
    failingSource: 'vm:anatomy:body:head-neck:right:source-component:fma50519-fj1700',
    changedRevisionScope: 'renal-ureteric-arteries only',
  },
  sourceGeometryChanged: false,
  clinicalApproval: false,
  imagesImported: false,
};
await writeFile('docs/clinical-reference-revision-validation.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
