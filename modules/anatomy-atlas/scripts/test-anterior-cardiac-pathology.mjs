import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {build} from './workspace-test-build.mjs';

const root = new URL('../', import.meta.url);
const source = JSON.parse(await readFile(new URL('public/models/bodyparts3d/anterior-cardiac-vein/catalog.json', root), 'utf8'));
const compiled = await build({
  stdin: {contents: "export * from './lib/anterior-cardiac-pathology.ts'; export * from './content/anterior-cardiac-pathology.ts';", resolveDir: fileURLToPath(root), loader: 'ts'},
  format: 'esm', platform: 'node', write: false, bundle: true,
});
const api = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const structure = source.structures[0];
assert.equal(source.structures.length, 1);
assert.equal(structure.fmaId, 'FMA76767');
assert.equal(structure.bundle, 'anterior-cardiac-vein');
const lesson = api.anteriorCardiacPathologyLesson(structure, 'pathology');
assert.equal(lesson.readiness, 'draft');
assert.match(lesson.body, /one heart/);
assert.match(lesson.body, /proposed/);
assert.match(lesson.note, /pending revision-bound radiologist sign-off/);
assert.deepEqual(lesson.citations, ['https://pubmed.ncbi.nlm.nih.gov/3190963/']);
assert.ok(lesson.bullets.some(value => /lumen, drainage ostium or accessory conduction pathway/.test(value)));
const words = [api.anteriorCardiacPathologyTopic.title, api.anteriorCardiacPathologyTopic.body, ...api.anteriorCardiacPathologyTopic.bullets, api.anteriorCardiacPathologyTopic.credit].join(' ').split(/\s+/);
assert.ok(words.length <= 150, `Summary exceeds 150 words: ${words.length}`);
for (const tab of ['anatomy', 'function', 'imaging', 'clinical', 'dissection']) {
  assert.equal(api.anteriorCardiacPathologyLesson(structure, tab), undefined);
}
for (const mutate of [
  s => {s.id += '-changed';}, s => {s.fmaId = 'FMA4707';},
  s => {s.bundle = 'thorax-vessels-recovery';}, s => {s.laterality = 'right';},
  s => {s.sourceName += ' changed';}, s => {s.sourceTree = 'partof';},
  s => {s.sources[0].file = 'FJ0000';}, s => {s.sources[0].sha256 = '0'.repeat(64);},
  s => {s.sources.reverse();}, s => {s.coverageNote += ' changed';},
  s => {s.provenance.sourceVersion = 'changed';}, s => {s.validation.anatomicalReview = true;},
]) {
  const changed = structuredClone(structure);
  mutate(changed);
  assert.equal(api.anteriorCardiacPathologyLesson(changed, 'pathology'), undefined);
}
for (const context of source.contextRecords) assert.equal(api.anteriorCardiacPathologyLesson(context, 'pathology'), undefined);
lesson.bullets.push('mutation'); lesson.citations.push('mutation');
const fresh = api.anteriorCardiacPathologyLesson(structuredClone(structure), 'pathology');
assert.ok(!fresh.bullets.includes('mutation'));
assert.deepEqual(fresh.citations, ['https://pubmed.ncbi.nlm.nih.gov/3190963/']);
console.log(`Anterior cardiac pathology: exact source guard, tab scope, detached arrays and ${words.length}-word summary passed.`);
