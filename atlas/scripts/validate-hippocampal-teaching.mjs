import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { build } from './workspace-component-test-build.mjs';
import { nestedBeforeLobarImaging } from './cerebral-lobar-imaging-history.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';
import { nestedBeforeCerebralDetailUltrasound } from './cerebral-detail-ultrasound-history.mjs';

const baseline = 'bd700a5528dd4b2a62653f530d3f474de1f8b5bb';
const hippocampalRevision = 'ed3e0e2a202b359023be127567c2a268d901a396';
const lobarRevision = '2792be3b4f5d2913aa506f35691b53ae6c711867';
const require = createRequire(import.meta.url);
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const clone = value => JSON.parse(JSON.stringify(value));
const old = path => execFileSync('git', ['show', baseline + ':' + path], { encoding: 'utf8' });
const historical = (commit,path) => execFileSync('git', ['show', commit + ':' + path], { encoding: 'utf8' });
async function load(contents, resolveDir = process.cwd()) {
  const built = await build({ stdin: { contents, resolveDir, loader: 'tsx' }, bundle: true, platform: 'node', format: 'cjs', write: false });
  const scope = { exports: {} };
  runInNewContext(built.outputFiles[0].text, { module: scope, exports: scope.exports, require, crypto, TextEncoder, URLSearchParams, structuredClone });
  return scope.exports;
}
const api = await load(`export * from './content/nested-teaching'; export * from './lib/nested-teaching'; export * from './lib/nested-review-material'; export {cerebralCatalog} from './lib/cerebral'; export {NestedTeaching} from './app/nested-teaching';`);
// Replay every relative import from its immutable Git epoch. Compiling an old
// top-level TS string against today's modules creates a hybrid, not history.
const previous = await exactSourceHistoryApi(baseline,'nested-teaching');
const hippocampal = await exactSourceHistoryApi(hippocampalRevision,'nested-teaching');
const lobar = await exactSourceHistoryApi(lobarRevision,'nested-teaching');
const beforeLobar = nestedBeforeLobarImaging(lobar);
const beforeCerebralDetail = nestedBeforeCerebralDetailUltrasound(api);
const currentHippocampus = api.nestedConcepts.find(c => c.id === 'cerebral-hippocampus');
const priorHippocampus = beforeCerebralDetail.nestedConcepts.find(c => c.id === 'cerebral-hippocampus');
const hippocampalEpochConcept = hippocampal.nestedConcepts.find(c => c.id === 'cerebral-hippocampus');
assert(hippocampalEpochConcept);
for (const topic of ['xray', 'ultrasound']) {
  assert.equal(hippocampalEpochConcept.imaging?.[topic], undefined, 'Original hippocampal epoch has no authored lesson for this modality');
  assert.equal(api.nestedTopicLesson(hippocampalEpochConcept, topic).readiness, 'pending');
}
assert.equal(currentHippocampus.imaging.ultrasound.readiness, 'draft');
assert.equal(priorHippocampus.imaging.ultrasound, undefined);
assert.deepEqual(clone(beforeCerebralDetail.nestedTeachingReferences), clone(api.nestedTeachingReferences));
assert.deepEqual(clone(beforeLobar.nestedConcepts),clone(hippocampal.nestedConcepts),'Exact later lobar epoch reverses to the hippocampal epoch');
assert.deepEqual(clone(beforeLobar.nestedTeachingReferences),clone(hippocampal.nestedTeachingReferences));
assert.deepEqual(clone(hippocampal.nestedConcepts.filter(c => c.id !== 'cerebral-hippocampus')), clone(previous.nestedConcepts), 'All older lessons unchanged at the exact hippocampal transition');
for (const [key, value] of Object.entries(previous.nestedTeachingReferences)) assert.deepEqual(clone(hippocampal.nestedTeachingReferences[key]), clone(value));
const newReferences = Object.keys(hippocampal.nestedTeachingReferences).filter(key => !Object.hasOwn(previous.nestedTeachingReferences, key));
assert.deepEqual(newReferences.sort(), ['hippocampalTopography', 'hippocampalMemory', 'hippocampalLearning', 'hippocampalMRI'].sort());
const pins = JSON.parse(await readFile('content/nested-teaching-bindings.v1.json'));
const hippocampalPins = JSON.parse(historical(hippocampalRevision,'content/nested-teaching-bindings.v1.json'));
const priorPins = JSON.parse(old('content/nested-teaching-bindings.v1.json'));
assert.deepEqual({ ...hippocampalPins, bindings: hippocampalPins.bindings.filter(b => b.conceptId !== 'cerebral-hippocampus') }, priorPins);
const added = pins.bindings.filter(b => b.conceptId === 'cerebral-hippocampus');
assert.deepEqual(added,hippocampalPins.bindings.filter(b=>b.conceptId==='cerebral-hippocampus'),'Current two exact hippocampal bindings retain the original epoch');
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
  assert.equal(api.nestedTopicLesson(concept, 'xray').readiness, 'pending');
  assert.equal(api.nestedTopicLesson(concept, 'ultrasound').readiness, 'draft');
  for (const topic of ['xray', 'ultrasound']) assert.equal(api.nestedTopicLesson(priorHippocampus, topic).readiness, 'pending');
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
assert.equal(historical(hippocampalRevision,'content/nested-review-bindings.json'), old('content/nested-review-bindings.json'), 'All original 108 geometry review identities retained at the hippocampal transition');
console.log(JSON.stringify({passed:true,hippocampalBindings:2,previousBindingsPreserved:73,previousConceptsPreserved:previous.nestedConcepts.length,priorDraftTopicsPerSide:7,currentDraftTopicsPerSide:8,pendingModalitiesAtHippocampalEpoch:['xray','ultrasound'],currentDraftUltrasound:true,patientImages:false,clinicalApproval:false}));
