import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {build} from './workspace-component-test-build.mjs';
import {nestedBeforeLobarImaging, nestedBeforeNeonatalLobarUltrasound,
  nestedBeforePosteriorLobarUltrasound, lobarIds} from './cerebral-lobar-imaging-history.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
const base = '2c9d80ba1eaba9f520a7da9ac7fcb1201ca42a65';
const lobarRevision = '2792be3b4f5d2913aa506f35691b53ae6c711867';
const require = createRequire(import.meta.url);
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
const clone = value => JSON.parse(JSON.stringify(value));
const old = path => execFileSync('git', ['show', base + ':' + path], {encoding: 'utf8'});
async function load(contents, resolveDir = process.cwd()) {
  const built = await build({stdin: {contents, resolveDir, loader: 'tsx'}, bundle: true, platform: 'node', format: 'cjs', write: false});
  const module = {exports: {}};
  runInNewContext(built.outputFiles[0].text, {module, exports: module.exports, require, crypto, TextEncoder, URLSearchParams, structuredClone});
  return module.exports;
}
const api = await load(`export * from './content/nested-teaching'; export * from './lib/nested-teaching'; export * from './lib/nested-review-material'; export {contentTabs} from './lib/content-types'; export {cerebralCatalog} from './lib/cerebral'; export {NestedTeaching} from './app/nested-teaching';`);
// Replay each historical import from the named Git tree. A historical top-level
// file bundled against current dependencies would mix later cardiac teaching in.
const previous = await exactSourceHistoryApi(base, 'nested-teaching');
const lobarEpoch = await exactSourceHistoryApi(lobarRevision, 'nested-teaching');
const precedingEpoch = await exactSourceHistoryApi('2c80143a1c7332173dd83a92a637b3ef9a729098', 'nested-teaching');
const restored = nestedBeforeLobarImaging(lobarEpoch);
assert.deepEqual(clone(restored.nestedConcepts), clone(previous.nestedConcepts), 'All 47 prior concepts and non-imaging fields preserved');
assert.deepEqual(clone(restored.nestedTeachingReferences), clone(previous.nestedTeachingReferences), 'All prior references preserved');
const beforePosterior = nestedBeforePosteriorLobarUltrasound(api);
assert.deepEqual(clone(beforePosterior.nestedConcepts), clone(precedingEpoch.nestedConcepts),
  'Complete preceding 2c concept epoch restored before frontal/parietal inverse');
assert.deepEqual(clone(beforePosterior.nestedTeachingReferences), clone(precedingEpoch.nestedTeachingReferences),
  'Complete preceding 2c references restored');
const beforeNeonatal = nestedBeforeNeonatalLobarUltrasound(beforePosterior);
for (const id of lobarIds) {
  const conceptId = 'cerebral-' + id;
  assert.deepEqual(clone(beforeNeonatal.nestedConcepts.find(c => c.id === conceptId)),
    clone(lobarEpoch.nestedConcepts.find(c => c.id === conceptId)),
    'Current lobar teaching and CT/MRI content retain the exact lobar epoch');
}
for (const key of ['cerebralLobarCT', 'cerebralLobarMRI'])
  assert.deepEqual(clone(beforeNeonatal.nestedTeachingReferences[key]),
    clone(lobarEpoch.nestedTeachingReferences[key]), 'Current CT/MRI reference retains the exact lobar epoch');
assert.equal(await readFile('content/nested-teaching-bindings.v1.json', 'utf8'),
  old('content/nested-teaching-bindings.v1.json'), 'Original teaching selection identities unchanged');
const reviewPath = 'content/nested-review-bindings.json';
const currentReview = await readFile(reviewPath, 'utf8');
assert.equal(currentReview, execFileSync('git', ['show', 'c32bc81cf0fd7ec22fa83e8b1365019297f9a0b3:' + reviewPath], {encoding: 'utf8'}),
  'Current review selection identities unchanged by neonatal prose');
const originalReview = JSON.parse(old(reviewPath));
const beforeCoronaryTokens = clone(JSON.parse(currentReview));
const coronaryGroup = beforeCoronaryTokens.groups.filter(g => g.key === '["vm:anatomy:body:thorax:unpaired:organ:heart","coronary-venous"]');
const originalCoronaryGroup = originalReview.groups.filter(g => g.key === coronaryGroup[0]?.key);
assert.equal(coronaryGroup.length, 1);
assert.equal(originalCoronaryGroup.length, 1);
assert.equal(coronaryGroup[0].selections.length, 2);
assert.equal(originalCoronaryGroup[0].selections.length, 2);
const coronaryTokens = {
  'vm:anatomy:body:thorax:unpaired:vessel:coronary-sinus': {
    original: '28f20596d970801f2261db5dae1234cfa52313a67f16ad6dedbf483c6e56529f',
    current: '67291c05cafa50c94e6a162c6091c8b01bca0c54e1b399b139a2096d6fda74fb',
  },
  'vm:anatomy:body:thorax:unpaired:vessel:small-cardiac-vein': {
    original: 'e2116b99624f4f2a9dcbb0f358db2a99deac73625c0d1cb9350d72e18f36c11b',
    current: '1e55364de5f07ae05d818422d07d4b83345bb111e7161fffb21f994df82c3e5e',
  },
};
for (const [group, epoch] of [[coronaryGroup[0], 'current'], [originalCoronaryGroup[0], 'original']])
  for (const selection of group.selections) {
    assert.equal(selection.sourceToken, coronaryTokens[selection.id]?.[epoch], 'Exact recorded coronary token');
    delete selection.sourceToken;
  }
assert.deepEqual(beforeCoronaryTokens, originalReview,
  'All original review identities preserved outside two later coronary tokens');
const parent = api.cerebralCatalog.parent;
const group = api.nestedReviewRows.find(g => g.study === 'cerebral');
let selections = 0;
let neonatalUltrasoundPlacements = 0;
let originalNeonatalPlacements = 0;
for (const id of lobarIds) {
  const expected = api.nestedConcepts.find(c => c.id === 'cerebral-' + id);
  const structures = api.cerebralCatalog.structures.filter(s => expected.fmaIds.includes(s.fmaId));
  assert.equal(structures.length, 2);
  for (const selected of structures) {
    selections++;
    const concept = api.nestedTeachingFor(parent, 'cerebral', selected);
    assert.equal(concept.id, expected.id);
    for (const topic of ['ct', 'mri']) {
      const lesson = api.nestedTopicLesson(concept, topic);
      assert.equal(lesson.readiness, 'draft');
      assert(lesson.citations.length > 0);
      assert.match(lesson.note, /specialist review pending/);
      assert.match(lesson.note, /No scan access or synchronization/);
      const html = renderToStaticMarkup(React.createElement(api.NestedTeaching, {parent, study: 'cerebral', selected, initialTopic: topic}));
      assert(html.includes(lesson.body.replaceAll('&', '&amp;').replaceAll("'", '&#x27;').replaceAll('"', '&quot;')));
      for (const url of lesson.citations) assert(html.includes(url));
    }
    assert.equal(api.nestedTopicLesson(concept, 'xray').readiness, 'pending');
    const ultrasound = api.nestedTopicLesson(concept, 'ultrasound');
    if (lobarIds.includes(id)) {
      neonatalUltrasoundPlacements++;
      if (['frontal', 'parietal'].includes(id)) originalNeonatalPlacements++;
      assert.equal(ultrasound.readiness, 'draft');
      assert.deepEqual(clone(concept.imaging.ultrasound.references), ['cerebralNeonatalUS', 'cerebralNeonatalUSWindow']);
      assert.deepEqual(clone(ultrasound.citations), clone(concept.imaging.ultrasound.references.map(key => api.nestedTeachingReferences[key].url)));
      assert.match(ultrasound.note, /specialist review pending/);
      assert.match(ultrasound.note, /No scan access or synchronization/);
      const html = renderToStaticMarkup(React.createElement(api.NestedTeaching, {parent, study: 'cerebral', selected, initialTopic: 'ultrasound'}));
      assert(html.includes(ultrasound.body.replaceAll('&', '&amp;').replaceAll("'", '&#x27;').replaceAll('"', '&quot;')));
      for (const url of ultrasound.citations) assert(html.includes(url));
    } else assert.equal(ultrasound.readiness, 'pending');
    const packet = await api.nestedReviewMaterial(group.key, selected.id);
    assert.deepEqual(clone(packet.teaching.concept), clone(concept));
    assert.equal(packet.context.revisions.imaging, null);
    assert(packet.context.blockers.imaging.length > 0);
    for (const change of [s => s.fmaId = 'FMA0', s => s.laterality = 'unspecified', s => s.sources[0].sha256 = '0'.repeat(64)]) {
      const stale = clone(selected); change(stale);
      assert.equal(api.nestedTeachingFor(parent, 'cerebral', stale), null);
    }
  }
}
assert.equal(selections, 8);
assert.equal(neonatalUltrasoundPlacements, 8);
assert.equal(originalNeonatalPlacements, 4, 'Original four frontal/parietal placements remain draft');
let allSelections = 0;
let allTopics = 0;
let unchangedTopics = 0;
let posteriorDrafts = 0;
for (const row of api.nestedReviewRows) for (const surface of row.surfaces) {
  const packet = await api.nestedReviewMaterial(row.key, surface.id);
  assert(packet?.teaching?.concept, 'All source-pinned review selections resolve');
  allSelections++;
  const concept = packet.teaching.concept;
  const prior = precedingEpoch.nestedConcepts.find(c => c.id === concept.id);
  assert(prior, 'Preceding concept exists for each review selection');
  for (const topic of api.contentTabs) {
    const currentLesson = api.nestedTopicLesson(concept, topic);
    const priorLesson = api.nestedTopicLesson(prior, topic);
    allTopics++;
    if (['cerebral-temporal', 'cerebral-occipital'].includes(concept.id) && topic === 'ultrasound') {
      posteriorDrafts++;
      assert.equal(priorLesson.readiness, 'pending');
      assert.equal(currentLesson.readiness, 'draft');
    } else {
      unchangedTopics++;
      assert.deepEqual(clone(currentLesson), clone(priorLesson), 'Unchanged review topic retains preceding lesson');
    }
  }
}
assert.equal(allSelections, 108);
assert.equal(allTopics, 972);
assert.equal(unchangedTopics, 968);
assert.equal(posteriorDrafts, 4);
console.log(JSON.stringify({passed: true, selections, allSelections, allTopics, unchangedTopics,
  newModalityPlacements: 24, neonatalUltrasoundPlacements, originalNeonatalPlacements,
  priorConceptsPreserved: 47, clinicalApproval: false, patientImages: false}));
