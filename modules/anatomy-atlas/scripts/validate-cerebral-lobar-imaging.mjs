import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {resolve} from 'node:path';
import {build} from './workspace-component-test-build.mjs';
import {nestedBeforeLobarImaging, lobarIds} from './cerebral-lobar-imaging-history.mjs';
import {nestedBeforeVentricularUltrasound} from './ventricular-ultrasound-history.mjs';
import {nestedBeforeCTOrientation} from './nested-ct-orientation-history.mjs';
import {nestedBeforeEyeCrossSectional} from './eye-cross-sectional-history.mjs';
const base = '2c9d80ba1eaba9f520a7da9ac7fcb1201ca42a65';
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
const api = await load(`export * from './content/nested-teaching'; export * from './lib/nested-teaching'; export * from './lib/nested-review-material'; export {cerebralCatalog} from './lib/cerebral'; export {NestedTeaching} from './app/nested-teaching';`);
const previous = await load(old('content/nested-teaching.ts'), resolve('content'));
const restored = nestedBeforeLobarImaging(nestedBeforeVentricularUltrasound(nestedBeforeEyeCrossSectional(nestedBeforeCTOrientation(api))));
assert.deepEqual(clone(restored.nestedConcepts), clone(previous.nestedConcepts), 'All 47 prior concepts and non-imaging fields preserved');
assert.deepEqual(clone(restored.nestedTeachingReferences), clone(previous.nestedTeachingReferences), 'All prior references preserved');
for (const path of ['content/nested-teaching-bindings.v1.json', 'content/nested-review-bindings.json']) assert.equal(await readFile(path, 'utf8'), old(path), path + ' unchanged');
const parent = api.cerebralCatalog.parent;
const group = api.nestedReviewRows.find(g => g.study === 'cerebral');
let selections = 0;
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
    for (const topic of ['xray', 'ultrasound']) assert.equal(api.nestedTopicLesson(concept, topic).readiness, 'pending');
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
console.log(JSON.stringify({passed: true, selections, newModalityPlacements: 16, priorConceptsPreserved: 47, clinicalApproval: false, patientImages: false}));
