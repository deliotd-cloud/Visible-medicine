import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { build } from './workspace-test-build.mjs';
import { build as componentBuild } from './workspace-component-test-build.mjs';
import { hraDigest } from './hra-pelvis-source.mjs';
const compile = async (contents, resolveDir = process.cwd()) => {
  const b = await build({ stdin: { contents, resolveDir, loader: 'ts' }, bundle: true, write: false, format: 'esm', platform: 'node' });
  return import('data:text/javascript;base64,' + Buffer.from(b.outputFiles[0].text).toString('base64'));
};
const api = await compile("export * from './content/hra-renal-teaching.ts'; export * from './content/hra-renal-clinical.ts'; export * from './lib/hra-renal-teaching.ts'; export {hraRenalDefinition} from './lib/hra-renal.ts';");
const { hraRenalDefinition: def, hraRenalTeaching: lessonFor, hraRenalTopicFamilies: families, hraRenalClinicalConcepts: concepts, hraRenalClinicalReferences: references, hraRenalReferenceTitles: titles, authoredHraRenalLesson, authoredHraRenalClinical } = api;
const beforeCommit = 'bd0ec72c46247676c02e9375ba9038823c6e75df';
const previous = await compile(execFileSync('git', ['show', beforeCommit + ':content/hra-renal-teaching.ts'], { encoding: 'utf8' }), process.cwd() + '/content');
assert.equal(def.surfaces.length, 82); assert.equal(Object.keys(concepts).length, 12); assert.equal(Object.keys(families).length, 9);
assert.equal(new Set(Object.values(families).flatMap(f => Object.values(f).map(t => t.body))).size, 44);
const knownURLs = new Set(Object.values(references).map(r => r.url));
assert.equal(knownURLs.size, 11);
for (const invalid of ['unknown', '__proto__', 'constructor', 'toString']) {
  assert.equal(authoredHraRenalClinical(invalid), null); assert.equal(authoredHraRenalLesson(invalid), null);
}
const counts = { clinical: 0, pathology: 0, ct: 0, mri: 0, ultrasound: 0, xray: 0 };
const snapshot = JSON.stringify(def); let rejections = 0;
for (const s of def.surfaces) {
  const lesson = lessonFor(def, s), old = previous.authoredHraRenalLesson(s.concept);
  assert.deepEqual({ anatomy: lesson.anatomy, function: lesson.function, references: lesson.references }, old, 'Original core lesson preserved');
  const c = concepts[s.concept]; assert(c);
  assert.deepEqual(lesson.extended.topics, families[c.family]);
  assert(lesson.extended.modelLimit.includes(c.limit));
  assert(lesson.extended.modelLimit.includes('radiologist review pending'));
  assert.equal(lesson.extended.selfCheck.question, c.question);
  for (const [topic, value] of Object.entries(lesson.extended.topics)) {
    assert(Object.hasOwn(counts, topic)); counts[topic]++;
    assert.equal(value.readiness, 'draft'); assert(value.body && value.references.length);
    assert(value.references.every(url => knownURLs.has(url) && titles[url]));
  }
  assert(lesson.extended.selfCheck.references.every(url => knownURLs.has(url)));
  lesson.extended.topics.clinical.body = 'corrupted'; lesson.extended.selfCheck.answer = 'corrupted';
  lesson.extended.topics.clinical.references.push('https://foreign.example/');
  assert.notEqual(lessonFor(def, s).extended.topics.clinical.body, 'corrupted');
  assert.notEqual(lessonFor(def, s).extended.selfCheck.answer, 'corrupted');
  assert(!lessonFor(def, s).extended.topics.clinical.references.includes('https://foreign.example/'));
  for (const field of ['id', 'name', 'nodeName', 'laterality', 'concept', 'sourceOntologyId', 'sourcePart', 'tissue']) {
    assert.equal(lessonFor(def, { ...s, [field]: 'foreign' }), null); rejections++;
  }
}
assert.deepEqual(counts, { clinical: 82, pathology: 82, ct: 82, mri: 61, ultrasound: 58, xray: 33 });
for (const mutate of [d => d.source.version = 'other', d => d.catalog.bundles[0].sha256 = '0'.repeat(64), d => d.catalog.coordinateSystem.sourceToSceneColumnMajor[0] *= -1, d => d.studies[0].ids.pop()]) {
  const bad = JSON.parse(snapshot); mutate(bad);
  for (const s of def.surfaces) { assert.equal(lessonFor(bad, s), null); rejections++; }
}
assert.equal(JSON.stringify(def), snapshot);
// No source geometry, catalogue, dissection recipe or practice adapter migration.
for (const path of ['public/models/hra-renal/kidneys.glb', 'public/models/hra-renal/catalog.json', 'content/sources/hra-renal/renal-source.glb', 'content/sources/hra-renal/retention.json', 'docs/hra-renal-source-audit.json', 'lib/hra-renal.ts', 'lib/hra-renal-teaching.ts', 'app/body-explorer.tsx', 'app/um-limb-learning.tsx', 'package-lock.json']) {
  const old = execFileSync('git', ['show', beforeCommit + ':' + path], { maxBuffer: 16e6 });
  const current = await readFile(path);
  // Git-normalised text and original binary both compared without rewriting source.
  const norm = bytes => path.endsWith('.glb') ? bytes : Buffer.from(bytes.toString().replace(/\r\n/g, '\n'));
  assert.deepEqual(norm(current), norm(old), path + ' unexpectedly changed');
}
const bundle = await componentBuild({ stdin: { contents: "export { SpecimenLearning } from './app/um-limb-learning.tsx';", resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, write: false, format: 'cjs', platform: 'node', plugins: [{ name: 'unused-scene', setup(t) { t.onLoad({ filter: /body-scene\.tsx$/ }, () => ({ loader: 'js', contents: 'export function BodyScene(){return null;} export function retryBodyAssets(){}' })); } }] });
const require = createRequire(import.meta.url), React = require('react'), mod = { exports: {} };
runInNewContext(bundle.outputFiles[0].text, { module: mod, exports: mod.exports, require, URL, console, process: { env: { NODE_ENV: 'test' } } });
const render = require('react-dom/server').renderToStaticMarkup;
let renders = 0, pending = 0;
for (const s of def.surfaces) for (const topic of ['anatomy', 'function', ...Object.keys(counts)]) {
  const lesson = lessonFor(def, s);
  const html = render(React.createElement(mod.exports.SpecimenLearning, { definition: def, selected: s, initialTopic: topic, resolveLesson: lessonFor, referenceTitles: titles }));
  assert(html.includes('Teaching draft')); assert(html.includes('Clinical self-check'));
  const body = topic === 'anatomy' ? lesson.anatomy : topic === 'function' ? lesson.function : lesson.extended.topics[topic]?.body;
  if (body) assert(html.includes(render(React.createElement('p', null, body))), s.id + ' ' + topic);
  else { assert(html.includes('teaching is pending for this source selection')); pending++; }
  if (['ct', 'mri', 'xray', 'ultrasound'].includes(topic)) assert(html.includes('No patient images, scan alignment or measured pathology'));
  renders++;
}
assert.equal(pending, 94);
assert(render(React.createElement(mod.exports.SpecimenLearning, { definition: def, selected: { ...def.surfaces[0], nodeName: 'foreign' }, initialTopic: 'mri', resolveLesson: lessonFor })).includes('Teaching unavailable for this source binding'));
const report = {
  sourceBoundSelections: 82, distinctConcepts: 12, topicFamilies: 9, uniqueTopicTexts: 44,
  extendedPlacements: Object.values(counts).reduce((a,b) => a+b,0), counts,
  clinicalSelfCheckPlacements: 82, distinctSelfChecks: 12, renderedTopics: renders, pendingTopicStates: pending,
  rejectedMutations: rejections, originalCoreTeachingPreserved: true, geometryAndNavigationUnchanged: true,
  sourceSha256: hraDigest(await readFile('content/hra-renal-clinical.ts')),
  clinicalOrDeviceApproval: false, realImaging: false,
};
await writeFile('docs/hra-renal-teaching-validation.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
