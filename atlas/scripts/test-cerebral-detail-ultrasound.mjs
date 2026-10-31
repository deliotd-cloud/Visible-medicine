import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {build} from './workspace-component-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {cerebralDetailIds, cerebralDetailSections, nestedBeforeCerebralDetailUltrasound,
  hippocampalScopeBeforeCerebralDetail, hippocampalScopeWithCerebralDetail} from './cerebral-detail-ultrasound-history.mjs';

const epoch = 'd9bdfa1ceb1d86cabe059e963dcd6284f9527be1';
const require = createRequire(import.meta.url);
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
const clone = value => JSON.parse(JSON.stringify(value));
const built = await build({stdin: {contents: `export * from './content/nested-teaching';
  export * from './lib/nested-teaching'; export * from './lib/nested-review-material';
  export {bodyDisplayCatalog} from './lib/body-display-catalog';
  export {nestedStudyTargets} from './lib/nested-anatomy';
  export {contentTabs} from './lib/content-types';
  export {cerebralCatalog} from './lib/cerebral';
  export {NestedTeaching} from './app/nested-teaching';`,
  resolveDir: process.cwd(), loader: 'tsx'}, bundle: true, platform: 'node', format: 'cjs', write: false});
const scope = {exports: {}};
runInNewContext(built.outputFiles[0].text,
  {module: scope, exports: scope.exports, require, crypto, TextEncoder, URLSearchParams, structuredClone});
const api = scope.exports;
const before = nestedBeforeCerebralDetailUltrasound(api);
const saved = await exactSourceHistoryApi(epoch, 'nested-teaching');
assert.deepEqual(clone(before.nestedConcepts), clone(saved.nestedConcepts), 'Exact d9 lesson corpus restored');
assert.deepEqual(clone(before.nestedTeachingReferences), clone(saved.nestedTeachingReferences), 'All d9 reference values retained');
assert.deepEqual(clone(api.nestedTeachingReferences), clone(saved.nestedTeachingReferences), 'No new or repinned reference keys');
assert.equal(api.nestedConcepts.length, saved.nestedConcepts.length);
assert.equal(api.nestedConcepts.filter(c => cerebralDetailIds.includes(c.id)).length, 4);
const changed = new Set(cerebralDetailIds);
for (const concept of api.nestedConcepts) {
  const old = saved.nestedConcepts.find(c => c.id === concept.id);
  assert(old, 'Every current concept has a d9 predecessor');
  if (!changed.has(concept.id)) assert.deepEqual(clone(concept), clone(old), 'Unrelated concept unchanged');
  else {
    assert.deepEqual(clone(concept.imaging.ultrasound), clone(cerebralDetailSections[concept.id]));
    assert.equal(old.imaging?.ultrasound, undefined);
    if (concept.id === 'cerebral-hippocampus') {
      assert.equal(old.modelLimit, hippocampalScopeBeforeCerebralDetail);
      assert.equal(concept.modelLimit, hippocampalScopeWithCerebralDetail);
    } else assert.equal(concept.modelLimit, old.modelLimit);
  }
}
let rejected = 0;
for (const id of cerebralDetailIds) {
  for (const mutation of [
    a => { a.nestedConcepts.find(c => c.id === id).imaging.ultrasound.body += ' stale'; },
    a => { delete a.nestedConcepts.find(c => c.id === id).imaging.ultrasound; },
    a => { a.nestedConcepts.find(c => c.id === id).imaging.ultrasound.references.push('cerebralLobarCT'); },
    a => { a.nestedConcepts.find(c => c.id === id).imaging.ultrasound.readiness = 'approved'; },
  ]) {
    const stale = clone({nestedConcepts: api.nestedConcepts, nestedTeachingReferences: api.nestedTeachingReferences});
    mutation(stale);
    assert.throws(() => nestedBeforeCerebralDetailUltrasound(stale));
    rejected++;
  }
}
for (const scopeText of [hippocampalScopeBeforeCerebralDetail, hippocampalScopeWithCerebralDetail + ' stale']) {
  const stale = clone({nestedConcepts: api.nestedConcepts});
  stale.nestedConcepts.find(c => c.id === 'cerebral-hippocampus').modelLimit = scopeText;
  assert.throws(() => nestedBeforeCerebralDetailUltrasound(stale));
  rejected++;
}
for (const mutation of [
  a => { a.nestedConcepts = a.nestedConcepts.filter(c => c.id !== cerebralDetailIds[0]); },
  a => { const index = a.nestedConcepts.findIndex(c => c.id === cerebralDetailIds[1]); a.nestedConcepts[index] = clone(a.nestedConcepts.find(c => c.id === cerebralDetailIds[0])); },
]) {
  const stale = clone({nestedConcepts: api.nestedConcepts});
  mutation(stale);
  assert.throws(() => nestedBeforeCerebralDetailUltrasound(stale));
  rejected++;
}
assert.equal(rejected, 20);
const identity = {
  'cerebral-insula': [['FMA72978', 'left-insula'], ['FMA72977', 'right-insula']],
  'cerebral-hippocampus': [['FMA72714', 'left-hippocampus'], ['FMA72713', 'right-hippocampus']],
  'cerebral-superior-temporal-anterior': [['FMA72801', 'anterior-part-of-left-superior-temporal-gyrus'], ['FMA72800', 'anterior-part-of-right-superior-temporal-gyrus']],
  'cerebral-superior-temporal-posterior': [['FMA72805', 'posterior-part-of-left-superior-temporal-gyrus'], ['FMA72804', 'posterior-part-of-right-superior-temporal-gyrus']],
};
const parent = api.cerebralCatalog.parent;
const group = api.nestedReviewRows.find(row => row.study === 'cerebral');
assert(group);
let placements = 0;
const selectionIds = new Set();
for (const id of cerebralDetailIds) {
  const concept = api.nestedConcepts.find(c => c.id === id);
  assert.deepEqual(clone(concept.fmaIds), identity[id].map(([fma]) => fma));
  for (const [fma, slug] of identity[id]) {
    const selected = api.cerebralCatalog.structures.find(s => s.fmaId === fma);
    assert(selected && selected.id.endsWith(':' + slug));
    assert(group.surfaces.some(s => s.id === selected.id), 'Placement is a real review selection');
    const resolved = api.nestedTeachingFor(parent, 'cerebral', selected);
    assert.deepEqual(clone(resolved), clone(concept), 'Real parent and selected source resolve to exact concept');
    const packet = await api.nestedReviewMaterial(group.key, selected.id);
    assert.deepEqual(clone(packet.teaching.concept), clone(concept));
    const lesson = api.nestedTopicLesson(resolved, 'ultrasound');
    assert.equal(lesson.readiness, 'draft');
    assert.equal(lesson.body, cerebralDetailSections[id].body);
    assert.deepEqual(clone(lesson.citations), clone(concept.imaging.ultrasound.references.map(k => api.nestedTeachingReferences[k].url)));
    assert.match(lesson.note, /specialist review pending/);
    assert.match(lesson.note, /No scan access or synchronization/);
    assert.equal(packet.teaching.topics.find(t => t.tab === 'ultrasound').body, lesson.body);
    assert.equal(packet.context.revisions.imaging, null);
    assert(packet.context.blockers.imaging.length > 0);
    assert(await api.nestedReviewSelection(group.key, selected.id, packet.context.sourceHash));
    assert.equal(await api.nestedReviewSelection(group.key, selected.id, '0'.repeat(64)), null);
    const html = renderToStaticMarkup(React.createElement(api.NestedTeaching,
      {parent, study: 'cerebral', selected, initialTopic: 'ultrasound'}));
    assert(html.includes(lesson.body.replaceAll('&', '&amp;').replaceAll("'", '&#x27;').replaceAll('"', '&quot;')));
    for (const url of lesson.citations) assert(html.includes(url));
    assert(html.includes('specialist review pending'));
    assert(html.includes(concept.modelLimit.replaceAll('&', '&amp;').replaceAll("'", '&#x27;')));
    for (const mutate of [s => s.fmaId = 'FMA0', s => s.laterality = 'unspecified',
      s => s.sources[0].sha256 = '0'.repeat(64), s => s.bounds.min[0] += 1]) {
      const stale = clone(selected); mutate(stale);
      assert.equal(api.nestedTeachingFor(parent, 'cerebral', stale), null);
    }
    const staleParent = clone(parent); staleParent.name += ' stale';
    assert.equal(api.nestedTeachingFor(staleParent, 'cerebral', selected), null);
    const cleanBody = api.nestedTeachingFor(parent, 'cerebral', selected).imaging.ultrasound.body;
    resolved.imaging.ultrasound.body = 'consumer mutation';
    assert.equal(api.nestedTeachingFor(parent, 'cerebral', selected).imaging.ultrasound.body, cleanBody);
    assert(!selectionIds.has(selected.id)); selectionIds.add(selected.id); placements++;
  }
}
assert.equal(placements, 8);
let selections = 0, topics = 0, changedTopics = 0, unchangedTopics = 0, scopeChanges = 0;
for (const row of api.nestedReviewRows) for (const surface of row.surfaces) {
  const packet = await api.nestedReviewMaterial(row.key, surface.id);
  assert(packet?.teaching?.concept, 'All source-bound review selections still resolve');
  selections++;
  const current = packet.teaching.concept;
  const prior = saved.nestedConcepts.find(c => c.id === current.id);
  assert(prior);
  if (current.id === 'cerebral-hippocampus') {
    assert.equal(current.modelLimit, hippocampalScopeWithCerebralDetail);
    assert.equal(prior.modelLimit, hippocampalScopeBeforeCerebralDetail);
    scopeChanges++;
  } else assert.equal(current.modelLimit, prior.modelLimit);
  for (const topic of api.contentTabs) {
    topics++;
    const actual = api.nestedTopicLesson(current, topic);
    const previous = api.nestedTopicLesson(prior, topic);
    if (selectionIds.has(surface.id) && topic === 'ultrasound') {
      changedTopics++;
      assert.equal(previous.readiness, 'pending');
      assert.equal(actual.readiness, 'draft');
    } else {
      unchangedTopics++;
      assert.deepEqual(clone(actual), clone(previous), 'Every other lesson retains d9 content');
    }
  }
}
assert.equal(selections, 108);
assert.equal(topics, 972);
assert.equal(changedTopics, 8);
assert.equal(unchangedTopics, 964);
assert.equal(scopeChanges, 2);
console.log(JSON.stringify({passed: true, epoch, selections, topics, changedTopics,
  unchangedTopics, scopeChanges, rejectedMutations: rejected, patientImages: false, clinicalApproval: false}));
