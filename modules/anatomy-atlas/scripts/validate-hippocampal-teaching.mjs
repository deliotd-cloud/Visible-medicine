import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { resolve } from 'node:path';
import { build } from './workspace-component-test-build.mjs';
import { nestedBeforeLobarImaging } from './cerebral-lobar-imaging-history.mjs';

const baseline = 'bd700a5528dd4b2a62653f530d3f474de1f8b5bb';
const require = createRequire(import.meta.url);
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const clone = value => JSON.parse(JSON.stringify(value));
const old = path => execFileSync('git', ['show', baseline + ':' + path], { encoding: 'utf8' });
async function load(contents, resolveDir = process.cwd()) {
  const built = await build({ stdin: { contents, resolveDir, loader: 'tsx' }, bundle: true, platform: 'node', format: 'cjs', write: false });
  const scope = { exports: {} };
  runInNewContext(built.outputFiles[0].text, { module: scope, exports: scope.exports, require, crypto, TextEncoder, URLSearchParams, structuredClone });
  return scope.exports;
}
const api = await load(`export * from './content/nested-teaching'; export * from './lib/nested-teaching'; export * from './lib/nested-review-material'; export {cerebralCatalog} from './lib/cerebral'; export {NestedTeaching} from './app/nested-teaching';`);
const previous = await load(old('content/nested-teaching.ts'), resolve('content'));
const beforeLobar = nestedBeforeLobarImaging(api);
assert.deepEqual(clone(beforeLobar.nestedConcepts.filter(c => c.id !== 'cerebral-hippocampus')), clone(previous.nestedConcepts), 'All older lessons unchanged except independently pinned lobar imaging');
for (const [key, value] of Object.entries(previous.nestedTeachingReferences)) assert.deepEqual(clone(api.nestedTeachingReferences[key]), clone(value));
const newReferences = Object.keys(beforeLobar.nestedTeachingReferences).filter(key => !Object.hasOwn(previous.nestedTeachingReferences, key));
assert.deepEqual(newReferences.sort(), ['hippocampalTopography', 'hippocampalMemory', 'hippocampalLearning', 'hippocampalMRI'].sort());
const pins = JSON.parse(await readFile('content/nested-teaching-bindings.v1.json'));
const priorPins = JSON.parse(old('content/nested-teaching-bindings.v1.json'));
assert.deepEqual({ ...pins, bindings: pins.bindings.filter(b => b.conceptId !== 'cerebral-hippocampus') }, priorPins);
const added = pins.bindings.filter(b => b.conceptId === 'cerebral-hippocampus');
assert.equal(added.length, 2);
assert.deepEqual(added.map(b => b.structure.fmaId).sort(), ['FMA72713', 'FMA72714']);
const group = api.nestedReviewRows.find(g => g.study === 'cerebral');
const parent = api.cerebralCatalog.parent;
for (const binding of added) {
  const selected = api.cerebralCatalog.structures.find(s => s.id === binding.structure.id);
  assert.equal(binding.sourceHash, '11cf97da7aa459f1181c79278b41c9c4369f8954eb5d4a00d1bc22b5cf28964e');
  const concept = api.nestedTeachingFor(parent, 'cerebral', selected);
  assert.equal(concept.id, 'cerebral-hippocampus');
  assert.equal(concept.quiz.basis, 'primary-reference');
  assert.match(concept.quiz.answer, /temporal \(inferior\) horn/i);
  for (const topic of ['anatomy', 'function', 'clinical', 'pathology', 'ct', 'mri', 'quiz']) {
    const lesson = api.nestedTopicLesson(concept, topic);
    assert.equal(lesson.readiness, 'draft');
    assert(lesson.body.length > 30 && lesson.citations.length > 0);
    for (const url of lesson.citations) assert(new URL(url).protocol === 'https:');
  }
  for (const topic of ['xray', 'ultrasound']) assert.equal(api.nestedTopicLesson(concept, topic).readiness, 'pending');
  const packet = await api.nestedReviewMaterial(group.key, selected.id);
  assert.deepEqual(clone(packet.teaching.concept), clone(concept));
  assert.equal(packet.context.revisions.imaging, null);
  assert.equal(packet.context.blockers.teaching.length, 0);
  assert(packet.context.blockers.imaging.length > 0);
  assert.equal(await api.nestedReviewSelection(group.key, selected.id, '0'.repeat(64)), null);
  assert(await api.nestedReviewSelection(group.key, selected.id, packet.context.sourceHash));
  for (const mutate of [s => s.fmaId = 'FMA0', s => s.laterality = 'unspecified', s => s.bundle += '-stale', s => s.sources[0].sha256 = '0'.repeat(64), s => s.bounds.min[0] += 1]) {
    const stale = clone(selected); mutate(stale);
    assert.equal(api.nestedTeachingFor(parent, 'cerebral', stale), null);
  }
  const staleParent = clone(parent); staleParent.name += ' stale';
  assert.equal(api.nestedTeachingFor(staleParent, 'cerebral', selected), null);
  concept.sections.anatomy.body = 'consumer mutation';
  assert.notEqual(api.nestedTeachingFor(parent, 'cerebral', selected).sections.anatomy.body, 'consumer mutation');
  const markup = renderToStaticMarkup(React.createElement(api.NestedTeaching, {parent, study: 'cerebral', selected}));
  assert(markup.includes('medial temporal lobe') && !markup.includes('Teaching is unavailable'));
  const mri = renderToStaticMarkup(React.createElement(api.NestedTeaching, {parent, study: 'cerebral', selected, initialTopic: 'mri'}));
  assert(mri.includes('HARNESS') && mri.includes('specialist review pending'));
}
assert.equal(await readFile('content/nested-review-bindings.json', 'utf8'), old('content/nested-review-bindings.json'), 'All 108 geometry review identities retained');
console.log(JSON.stringify({passed:true,hippocampalBindings:2,previousBindingsPreserved:73,previousConceptsPreserved:previous.nestedConcepts.length,draftTopicsPerSide:7,pendingModalities:['xray','ultrasound'],patientImages:false,clinicalApproval:false}));
