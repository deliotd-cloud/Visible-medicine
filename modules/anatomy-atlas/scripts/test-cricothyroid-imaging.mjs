import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { resolve } from 'node:path';
import { build } from './workspace-component-test-build.mjs';

const baseline = '97f48a1';
const require = createRequire(import.meta.url);
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const clone = value => JSON.parse(JSON.stringify(value));
const old = path => execFileSync('git', ['show', `${baseline}:${path}`], { maxBuffer: 32e6 });
async function load(contents, resolveDir = process.cwd()) {
  const built = await build({ stdin: { contents, resolveDir, loader: 'tsx' }, bundle: true, write: false, platform: 'node', format: 'cjs' });
  const module = { exports: {} };
  runInNewContext(built.outputFiles[0].text, { module, exports: module.exports, require, crypto, TextEncoder, URLSearchParams, structuredClone });
  return module.exports;
}
const api = await load(`
  export * from './lib/nested-teaching';
  export * from './lib/nested-anatomy';
  export * from './lib/nested-review-material';
  export { cricothyroidCatalog } from './lib/cricothyroid';
  export { bodyDisplayCatalog } from './lib/body-display-catalog';
  export { NestedTeaching } from './app/nested-teaching';
  export * from './content/cricothyroid-teaching';
`);
const previous = await load(old('content/cricothyroid-teaching.ts').toString('utf8'), resolve('content'));
const withoutImaging = value => value.map(({ imaging, ...rest }) => rest);
assert.deepEqual(clone(withoutImaging(api.cricothyroidConcepts)), clone(previous.cricothyroidConcepts), 'Existing non-imaging concept content retained');
for (const [key, value] of Object.entries(previous.cricothyroidTeachingReferences))
  assert.deepEqual(clone(api.cricothyroidTeachingReferences[key]), clone(value), `Prior reference ${key} retained`);
const addedReferences = Object.keys(api.cricothyroidTeachingReferences).filter(key => !Object.hasOwn(previous.cricothyroidTeachingReferences, key));
assert.deepEqual(addedReferences.sort(), ['cricothyroidCTApproximation', 'cricothyroidMicroMRI'].sort());
const expectedCitations = { ct: 'https://pubmed.ncbi.nlm.nih.gov/10971539/', mri: 'https://pubmed.ncbi.nlm.nih.gov/21816571/' };
assert.equal(api.cricothyroidTeachingReferences.cricothyroidCTApproximation.url, expectedCitations.ct);
assert.equal(api.cricothyroidTeachingReferences.cricothyroidMicroMRI.url, expectedCitations.mri);
const unchangedPaths = [
  'content/nested-teaching-bindings.v1.json',
  'content/nested-review-bindings.json',
  'public/models/bodyparts3d/full-body/catalog.json',
  'public/models/bodyparts3d/cricothyroid/catalog.json',
  'public/models/bodyparts3d/cricothyroid/cricothyroid.glb',
  'content/prototypes/cricothyroid/cricothyroid-prototype.glb',
];
for (const path of unchangedPaths) assert.deepEqual(await readFile(path), old(path), `${path} unchanged from ${baseline}`);

const root = api.bodyDisplayCatalog(JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json', 'utf8')));
const parent = api.cricothyroidCatalog.parent;
const targets = api.nestedStudyTargets(root).filter(target => target.study === 'cricothyroid');
const group = api.nestedReviewRows.find(row => row.study === 'cricothyroid');
assert(group);
assert.equal(targets.length, 4);
assert.deepEqual(clone(targets.map(target => target.structure.fmaId)), ['FMA46611', 'FMA46612', 'FMA46613', 'FMA46614']);
assert.equal(group.surfaces.length, 4);
for (const target of targets) {
  const selected = target.structure;
  const resolved = api.resolveNestedTarget(root, parent.id, target, selected.laterality);
  assert(resolved);
  assert.deepEqual(clone(resolved.structure), clone(selected));
  assert.equal(api.resolveNestedTarget(root, parent.id, { ...target, sourceHash: '0'.repeat(64) }, selected.laterality), null);
  assert.equal(api.resolveNestedTarget(root, parent.id, target, selected.laterality === 'right' ? 'left' : 'right'), null);
  assert.equal(api.resolveNestedTarget(root, 'foreign-parent', target, 'both'), null);
  const staleRoot = clone(root);
  staleRoot.structures.find(structure => structure.id === parent.id).sources[0].sha256 = '0'.repeat(64);
  assert.equal(api.resolveNestedTarget(staleRoot, parent.id, target, 'both'), null);
  const concept = api.nestedTeachingFor(parent, 'cricothyroid', selected);
  assert.equal(concept.id, 'cricothyroid-source-parts');
  assert.deepEqual(Object.keys(concept.imaging).sort(), ['ct', 'mri']);
  for (const topic of ['ct', 'mri']) {
    const lesson = api.nestedTopicLesson(concept, topic);
    assert.equal(lesson.readiness, 'draft');
    assert(lesson.citations.includes(expectedCitations[topic]));
    assert.match(lesson.note, /specialist review pending/);
    assert.match(lesson.note, /No scan access or synchronization/);
    const html = renderToStaticMarkup(React.createElement(api.NestedTeaching, { parent, study: 'cricothyroid', selected, initialTopic: topic }));
    const escapedBody = renderToStaticMarkup(React.createElement('p', null, lesson.body));
    assert(html.includes(escapedBody), `${selected.fmaId} ${topic} body visible in real SSR`);
    assert(html.includes('teaching draft') && html.includes('specialist review pending'));
    for (const url of lesson.citations) assert(html.includes(url), `${selected.fmaId} ${topic} SSR citation`);
  }
  assert.match(concept.imaging.ct.body, /human|patient|people/i);
  assert.match(concept.imaging.ct.body, /postoperative|post-operative|after.*(?:surgery|approximation)/i);
  assert.match(concept.imaging.ct.body, /distance/i);
  assert.match(concept.imaging.ct.body, /(?:not|does not|cannot|did not)[^.]*bell(?:y|ies)|bell(?:y|ies)[^.]*not/i);
  assert.match(concept.imaging.mri.body, /single|one /i);
  assert.match(concept.imaging.mri.body, /excised/i);
  assert.match(concept.imaging.mri.body, /postmortem|post-mortem/i);
  assert.match(concept.imaging.mri.body, /7\s*-?\s*T(?:esla)?\b|7\s*tesla/i);
  assert.match(concept.imaging.mri.body, /research/i);
  assert.match(concept.imaging.mri.body, /routine.*clinical|clinical.*routine/i);
  for (const topic of ['xray', 'ultrasound']) {
    const lesson = api.nestedTopicLesson(concept, topic);
    assert.equal(lesson.readiness, 'pending');
    assert.equal(lesson.citations, undefined);
  }
  const packet = await api.nestedReviewMaterial(group.key, selected.id);
  assert(packet);
  assert.deepEqual(clone(packet.teaching.concept), clone(concept));
  assert.equal(packet.context.revisions.imaging, null);
  assert(packet.context.blockers.imaging.length > 0);
  for (const topic of ['ct', 'mri']) {
    assert(packet.context.teachingTabs.includes(topic));
    const materialTopic = packet.teaching.topics.find(item => item.tab === topic);
    assert.equal(materialTopic.readiness, 'draft');
    assert.deepEqual(clone(materialTopic.references), clone(api.nestedTopicLesson(concept, topic).citations));
  }
  for (const topic of ['xray', 'ultrasound']) assert(!packet.context.teachingTabs.includes(topic));
  assert.equal(await api.nestedReviewSelection(group.key, selected.id, '0'.repeat(64)), null);
  assert(await api.nestedReviewSelection(group.key, selected.id, packet.context.sourceHash));
  assert.equal(await api.nestedReviewMaterial(group.key, `${selected.id}-stale`), null);
  for (const mutate of [part => part.sources[0].sha256 = '0'.repeat(64), part => part.laterality = 'unknown', part => part.fmaId = 'FMA0', part => part.bundle += '-stale', part => part.bounds.min[0]++]) {
    const stale = clone(selected); mutate(stale);
    assert.equal(api.nestedTeachingFor(parent, 'cricothyroid', stale), null);
  }
  const staleParent = clone(parent); staleParent.name += ' stale';
  assert.equal(api.nestedTeachingFor(staleParent, 'cricothyroid', selected), null);
  const unavailable = renderToStaticMarkup(React.createElement(api.NestedTeaching, { parent: staleParent, study: 'cricothyroid', selected, initialTopic: 'ct' }));
  assert(unavailable.includes('Teaching is unavailable'));
  concept.imaging.ct.body = 'consumer mutation';
  concept.imaging.mri.references.length = 0;
  assert.deepEqual(clone(api.nestedTeachingFor(parent, 'cricothyroid', selected)), clone(packet.teaching.concept));
  const originalPacket = clone(packet);
  packet.teaching.concept.imaging.ct.body = 'review consumer mutation';
  packet.source.structure.sources[0].sha256 = '0'.repeat(64);
  packet.context.blockers.imaging.length = 0;
  assert.deepEqual(clone(await api.nestedReviewMaterial(group.key, selected.id)), originalPacket, 'Review material remains detached');
}
console.log(JSON.stringify({ passed: true, baseline, selections: targets.length, newDraftPlacements: targets.length * 2, pendingModalities: ['xray', 'ultrasound'], unchangedGeometryAndBindingFiles: unchangedPaths.length, realSSR: true, imagingRevision: null, patientImages: false, clinicalApproval: false }));
