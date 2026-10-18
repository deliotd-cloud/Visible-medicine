import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { build } from './workspace-test-build.mjs';
import { build as componentBuild } from './workspace-component-test-build.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';
import {
  nestedBeforePosteriorFossaUltrasound, posteriorFossaUltrasoundIds,
  posteriorFossaUltrasoundReferenceKeys,
} from './posterior-fossa-ultrasound-history.mjs';

assert.equal(process.argv.length, 2, 'No test-mode arguments');
const baseline = '3e66d2a7cb1807f792929cbe292a4cfc81e4e79e';
const old = path => execFileSync('git', ['--no-replace-objects', 'show', `${baseline}:${path}`], {
  maxBuffer: 16e6,
});
const plain = value => JSON.parse(JSON.stringify(value));
const entry = "export * from './content/nested-teaching';export * from './lib/nested-teaching';export * from './lib/nested-anatomy';export * from './lib/nested-review-material';export * from './lib/nested-review';export * from './lib/nested-review-api';export {bodyDisplayCatalog} from './lib/body-display-catalog';export {contentTabs} from './lib/content-types';";
const built = await build({ stdin: { contents: entry, resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, write: false, platform: 'node', format: 'esm' });
const now = await import('data:text/javascript;base64,' + Buffer.from(built.outputFiles[0].text).toString('base64'));
// This replays every imported application module from Git, including transitive
// review, renderer and teaching dependencies. It cannot borrow today's graph.
const before = await exactSourceHistoryApi(baseline, 'nested-review-security');
const original = { nestedConcepts: now.nestedConcepts, nestedTeachingReferences: now.nestedTeachingReferences };
const restored = nestedBeforePosteriorFossaUltrasound(original);
assert.notEqual(restored, original);
assert.equal(nestedBeforePosteriorFossaUltrasound(restored), restored);
assert.deepEqual(plain(restored.nestedConcepts), plain(before.nestedConcepts),
  'The complete prior concept graph is exact after the four fields are reversed');
assert.deepEqual(plain(restored.nestedTeachingReferences), plain(before.nestedTeachingReferences),
  'The complete prior reference graph is exact after the three scoped refs are reversed');
assert.equal(now.nestedConcepts.length, before.nestedConcepts.length);
assert.deepEqual(Object.keys(now.nestedTeachingReferences).filter(key =>
  !Object.hasOwn(before.nestedTeachingReferences, key)), posteriorFossaUltrasoundReferenceKeys);

const urls = {
  posteriorFossaNeonatalUS2024: 'https://onlinelibrary.wiley.com/doi/10.1002/jum.16551',
  posteriorFossaBrainstemMorphometry: 'https://www.frontiersin.org/journals/neurology/articles/10.3389/fneur.2021.770908/full',
  posteriorFossaUltrasoundMRI: 'https://pubmed.ncbi.nlm.nih.gov/25899415/',
};
for (const key of posteriorFossaUltrasoundReferenceKeys) {
  assert.deepEqual(Object.keys(now.nestedTeachingReferences[key]).sort(),
    ['scopedToConcept', 'title', 'url']);
  assert.equal(now.nestedTeachingReferences[key].scopedToConcept, true);
  assert.equal(now.nestedTeachingReferences[key].url, urls[key]);
  assert(now.nestedTeachingReferences[key].title.trim());
}
const expectedReferences = {
  'brainstem-midbrain': ['posteriorFossaNeonatalUS2024'],
  'brainstem-pons': ['posteriorFossaBrainstemMorphometry'],
  'brainstem-medulla': ['posteriorFossaBrainstemMorphometry'],
  'brainstem-cerebellum': ['posteriorFossaNeonatalUS2024', 'posteriorFossaUltrasoundMRI'],
};
for (const id of posteriorFossaUltrasoundIds) {
  const concept = now.nestedConcepts.find(item => item.id === id);
  const prior = before.nestedConcepts.find(item => item.id === id);
  assert.equal(concept.study, 'brainstem');
  assert.equal(prior.imaging?.ultrasound, undefined);
  assert.equal(concept.imaging.ultrasound.readiness, 'draft');
  assert.deepEqual(concept.imaging.ultrasound.references, expectedReferences[id]);
  assert.match(concept.imaging.ultrasound.body, /neonatal|infant/i);
  assert.match(concept.imaging.ultrasound.body, /adult/i);
  assert.match(concept.imaging.ultrasound.body, /not|no |neither|does not/i);
  assert.doesNotMatch(concept.imaging.ultrasound.body, /routine adult ultrasound (shows|resolves|diagnoses)|patient.scan registration is provided/i);
  for (const topic of now.contentTabs.filter(tab => tab !== 'ultrasound'))
    assert.deepEqual(now.nestedTopicLesson(concept, topic), before.nestedTopicLesson(prior, topic), `${id}/${topic}`);
}
// Charge the full section to every cited URL, including an older lesson that
// uses the same publication under a different key. This prevents key splitting
// from hiding an overlong source-derived paraphrase.
const newUrls = new Set(Object.values(urls));
const wordsByUrl = Object.fromEntries([...newUrls].map(url => [url, 0]));
const citedByUrl = Object.fromEntries([...newUrls].map(url => [url, new Set()]));
for (const concept of now.nestedConcepts) {
  for (const section of [...Object.values(concept.sections), ...Object.values(concept.imaging ?? {})]) {
    for (const key of section.references) {
      const url = now.nestedTeachingReferences[key].url;
      if (!newUrls.has(url)) continue;
      wordsByUrl[url] += section.body.trim().split(/\s+/u).length;
      citedByUrl[url].add(concept.id);
    }
  }
}
for (const [url, words] of Object.entries(wordsByUrl)) {
  assert(words > 0 && words <= 200, `Conservative source-word budget: ${url} ${words}`);
}
assert.deepEqual([...citedByUrl[urls.posteriorFossaUltrasoundMRI]].sort(),
  ['brainstem-cerebellum', 'ventricular-fourth'], 'Existing shared-URL lesson counted');

for (const id of posteriorFossaUltrasoundIds) {
  const altered = plain(original);
  altered.nestedConcepts.find(item => item.id === id).imaging.ultrasound.body += ' foreign';
  assert.throws(() => nestedBeforePosteriorFossaUltrasound(altered), /Unrecorded/);
  const partial = plain(original);
  delete partial.nestedConcepts.find(item => item.id === id).imaging.ultrasound;
  assert.throws(() => nestedBeforePosteriorFossaUltrasound(partial), /Incomplete/);
}
for (const key of posteriorFossaUltrasoundReferenceKeys) {
  const altered = plain(original);
  altered.nestedTeachingReferences[key].url += '?foreign=1';
  assert.throws(() => nestedBeforePosteriorFossaUltrasound(altered), /Unrecorded/);
  const partial = plain(original);
  delete partial.nestedTeachingReferences[key];
  assert.throws(() => nestedBeforePosteriorFossaUltrasound(partial), /Incomplete/);
}
const unrelated = plain(original);
unrelated.nestedConcepts.find(item => item.id === 'brainstem-pons').sections.anatomy.body += ' foreign';
const unrelatedRestored = nestedBeforePosteriorFossaUltrasound(unrelated);
assert.notDeepEqual(unrelatedRestored.nestedConcepts, plain(before.nestedConcepts),
  'Unrelated teaching must survive reversal and fail the complete historical graph comparison');
const unrelatedReference = plain(original);
unrelatedReference.nestedTeachingReferences.unrecorded = { title: 'foreign', url: 'https://example.invalid/' };
assert.notDeepEqual(nestedBeforePosteriorFossaUltrasound(unrelatedReference).nestedTeachingReferences,
  plain(before.nestedTeachingReferences), 'Unrelated reference addition is not swallowed');

for (const path of [
  'content/nested-teaching-bindings.v1.json', 'content/nested-review-bindings.json',
  'public/models/bodyparts3d/full-body/catalog.json', 'public/models/bodyparts3d/brainstem/catalog.json',
  'lib/nested-teaching.ts', 'lib/nested-anatomy.ts', 'lib/nested-review-material.ts',
  'lib/nested-review-api.ts', 'app/nested-teaching.tsx',
]) assert.deepEqual(readFileSync(path), old(path), `${path}: source/review contract unchanged`);

const catalog = now.bodyDisplayCatalog(JSON.parse(readFileSync('public/models/bodyparts3d/full-body/catalog.json')));
assert.deepEqual(now.nestedReviewRows, before.nestedReviewRows);
const targets = now.nestedStudyTargets(catalog);
assert.deepEqual(targets, before.nestedStudyTargets(catalog));
const currentRenderer = JSON.parse(readFileSync('content/body-renderer-revision.json'));
const previousRenderer = JSON.parse(old('content/body-renderer-revision.json'));
const rendererAdvanced = currentRenderer.sha256 !== previousRenderer.sha256;
const brainstemCatalog = JSON.parse(readFileSync('public/models/bodyparts3d/brainstem/catalog.json'));
const protectedBundles = new Set();
const admittedFmas = new Set(now.nestedConcepts.filter(item =>
  posteriorFossaUltrasoundIds.includes(item.id)).flatMap(item => item.fmaIds));
for (const target of targets.filter(item => item.study === 'brainstem' &&
  admittedFmas.has(item.structure.fmaId))) {
  const parent = catalog.structures.find(item => item.id === target.parentId);
  protectedBundles.add(parent.bundle);
  protectedBundles.add(target.structure.bundle);
}
for (const id of protectedBundles) {
  const bundle = [...catalog.bundles, ...brainstemCatalog.bundles].find(item => item.id === id);
  assert(bundle, `Missing protected brainstem bundle ${id}`);
  const path = 'public' + bundle.url.split('?')[0];
  assert.deepEqual(readFileSync(path), old(path), `${path}: source GLB bytes unchanged`);
}
const component = await componentBuild({ stdin: { contents: "export {NestedTeaching} from './app/nested-teaching';",
  resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, write: false,
  platform: 'node', format: 'cjs' });
const require = createRequire(import.meta.url);
const React = require('react');
const render = require('react-dom/server').renderToStaticMarkup;
const module = { exports: {} };
runInNewContext(component.outputFiles[0].text, { module, exports: module.exports, require, URLSearchParams });
const forbiddenStorage = new Proxy({}, { get() { throw Error('Stale request reached storage'); } });
const request = payload => new Request('https://atlas.test/api/nested-review', {
  method: 'POST', headers: { origin: 'https://atlas.test', 'content-type': 'application/json',
    'oai-authenticated-user-id': 'SYNTHETIC_POSTERIOR_FOSSA_TEST' }, body: JSON.stringify(payload),
});
let contexts = 0, changed = 0, unchanged = 0, otherTopics = 0, staleRejects = 0,
  staleGeometryRejects = 0, identityRejects = 0, rendererGeometryChanged = 0;
for (const group of now.nestedReviewRows) for (const row of group.surfaces) {
  const packet = await now.nestedReviewMaterial(group.key, row.id);
  const prior = await before.nestedReviewMaterial(group.key, row.id);
  assert(packet && prior);
  contexts++;
  assert.deepEqual(packet.source, prior.source);
  assert.deepEqual(packet.atlasLink, prior.atlasLink);
  assert.equal(packet.context.sourceHash, prior.context.sourceHash);
  assert.equal(packet.context.sourceFrame, prior.context.sourceFrame);
  assert.equal(packet.context.rendererHash, currentRenderer.sha256);
  assert.equal(prior.context.rendererHash, previousRenderer.sha256);
  if (rendererAdvanced) {
    assert.notEqual(packet.context.revisions.geometry, prior.context.revisions.geometry);
    assert.notEqual(packet.context.materialHash, prior.context.materialHash);
    rendererGeometryChanged++;
    const c = packet.context;
    const response = await now.postNestedReview(request({
      catalogScope: c.catalogScope, nestedKey: c.nestedKey,
      sourceFrame: c.sourceFrame, structureId: c.structureId, track: 'geometry', expectedVersion: 0,
      materialHash: c.materialHash, revisionHash: prior.context.revisions.geometry,
      checklistVersion: c.checklistVersion, draft: now.blankNestedReview(c, 'geometry'),
    }), forbiddenStorage);
    assert.equal(response.status, 409, 'old renderer geometry revision refused before storage');
    staleGeometryRejects++;
  } else {
    assert.equal(packet.context.revisions.geometry, prior.context.revisions.geometry);
  }
  assert.deepEqual(packet.context.checklists, prior.context.checklists);
  assert.deepEqual(packet.context.blockers, prior.context.blockers);
  assert.equal(packet.context.revisions.imaging, null);
  assert.equal(prior.context.revisions.imaging, null);
  assert(packet.context.blockers.imaging.length);
  const id = packet.teaching.concept?.id;
  if (!posteriorFossaUltrasoundIds.includes(id)) {
    unchanged++;
    assert.deepEqual(packet.teaching, prior.teaching, `${group.key}/${row.id}: unrelated teaching`);
    assert.equal(packet.context.teachingHash, prior.context.teachingHash);
    assert.equal(packet.context.revisions.teaching, prior.context.revisions.teaching);
    assert.deepEqual(packet.context.teachingTabs, prior.context.teachingTabs);
    continue;
  }
  changed++;
  const concept = packet.teaching.concept;
  const lesson = now.nestedTopicLesson(concept, 'ultrasound');
  assert.equal(lesson.readiness, 'draft');
  assert.equal(lesson.body, concept.imaging.ultrasound.body);
  assert.deepEqual(lesson.citations, concept.imaging.ultrasound.references.map(key => urls[key]));
  assert.match(lesson.note, /No scan access or synchronization/);
  assert.equal(prior.teaching.topics.find(topic => topic.tab === 'ultrasound').readiness, 'pending');
  assert.equal(packet.teaching.topics.find(topic => topic.tab === 'ultrasound').body, lesson.body);
  assert(packet.context.teachingTabs.includes('ultrasound'));
  assert.notEqual(packet.context.teachingHash, prior.context.teachingHash);
  assert.notEqual(packet.context.revisions.teaching, prior.context.revisions.teaching);
  assert.notEqual(packet.context.materialHash, prior.context.materialHash);
  for (const tab of now.contentTabs.filter(tab => tab !== 'ultrasound' && tab !== 'quiz')) {
    assert.deepEqual(packet.teaching.topics.find(topic => topic.tab === tab),
      prior.teaching.topics.find(topic => topic.tab === tab), `${id}/${tab}: other Review topic`);
    otherTopics++;
  }
  const parent = packet.source.parent, selected = packet.source.structure;
  assert.deepEqual(now.nestedTeachingFor(parent, group.study, selected), concept);
  const html = render(React.createElement(module.exports.NestedTeaching,
    { parent, study: group.study, selected, initialTopic: 'ultrasound' }));
  assert(html.includes(render(React.createElement('p', null, lesson.body))));
  for (const url of lesson.citations) assert(html.includes(url));
  for (const key of expectedReferences[id]) assert(html.includes(now.nestedTeachingReferences[key].title));
  assert(!html.includes('Ultrasound · pending'));
  const again = now.nestedTeachingFor(parent, group.study, selected);
  again.imaging.ultrasound.body += ' mutated';
  again.imaging.ultrasound.references.push('foreign');
  assert.deepEqual(now.nestedTeachingFor(parent, group.study, selected), concept, 'resolver returns detached data');
  for (const mutate of [
    value => { value.fmaId = 'FMA0'; },
    value => { value.laterality = 'foreign'; },
    value => { value.sources[0].sha256 = '0'.repeat(64); },
    value => { value.bundle = 'foreign'; },
  ]) {
    const stale = plain(selected); mutate(stale);
    assert.equal(now.nestedTeachingFor(parent, group.study, stale), null); identityRejects++;
  }
  for (const mutate of [
    value => { value.fmaId = 'FMA0'; },
    value => { value.sources[0].sha256 = '0'.repeat(64); },
    value => { value.bundle = 'foreign'; },
  ]) {
    const stale = plain(parent); mutate(stale);
    assert.equal(now.nestedTeachingFor(stale, group.study, selected), null); identityRejects++;
  }
  assert.equal(now.nestedTeachingFor(parent, 'ventricles', selected), null);
  const c = packet.context;
  const payload = { catalogScope: c.catalogScope, nestedKey: c.nestedKey,
    sourceFrame: c.sourceFrame, structureId: c.structureId, track: 'teaching', expectedVersion: 0,
    materialHash: c.materialHash, revisionHash: c.revisions.teaching,
    checklistVersion: c.checklistVersion, draft: now.blankNestedReview(c, 'teaching') };
  for (const delta of [
    { materialHash: prior.context.materialHash },
    { revisionHash: prior.context.revisions.teaching },
    { sourceFrame: 'foreign-frame' },
  ]) {
    const response = await now.postNestedReview(request({ ...payload, ...delta }), forbiddenStorage);
    assert.equal(response.status, 409, 'stale review refused before storage'); staleRejects++;
  }
}
assert.deepEqual({ contexts, changed, unchanged, otherTopics, staleRejects, identityRejects },
  { contexts: 108, changed: 4, unchanged: 104, otherTopics: 28, staleRejects: 12, identityRejects: 28 });
assert.equal(rendererGeometryChanged, rendererAdvanced ? 108 : 0);
assert.equal(staleGeometryRejects, rendererGeometryChanged);
console.log(JSON.stringify({ baseline, contexts, posteriorFossaDrafts: changed,
  unrelatedReviewsExact: unchanged, otherTopicsExact: otherTopics,
  staleRejectedBeforeStorage: staleRejects, identityRejects,
  rendererAdvanced, rendererGeometryChanged, staleGeometryRejectedBeforeStorage: staleGeometryRejects,
  sourceBundlesExact: protectedBundles.size,
  sourceWordsByReference: Object.fromEntries(Object.entries(urls).map(([key, url]) => [key, wordsByUrl[url]])),
  acquiredImages: false, scanRegistration: false, clinicalApproval: false }));
