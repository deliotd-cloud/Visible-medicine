import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { build } from './workspace-test-build.mjs';

assert.equal(process.argv.length, 2, 'No test-mode arguments are accepted');
const pins = JSON.parse(readFileSync('content/deep-plantar-ultrasound-pins.json', 'utf8'));
const rawCatalog = JSON.parse(readFileSync('public/models/bodyparts3d/full-body/catalog.json', 'utf8'));
const expected = new Map([
  ['FMA69514', ['right', 'vm:anatomy:body:foot:right:vessel:right-deep-plantar-artery', 'FJ2136']],
  ['FMA69515', ['left', 'vm:anatomy:body:foot:left:vessel:left-deep-plantar-artery', 'FJ2068']],
]);
assert.equal(pins.entries.length, 2, 'exactly two source pins');
assert.deepEqual(new Set(pins.entries.map(e => e.identity.fmaId)), new Set(expected.keys()));

const compiled = await build({
  stdin: {
    contents: [
      "export {deepPlantarUltrasoundLesson} from './lib/deep-plantar-ultrasound';",
      "export {deepPlantarUltrasoundTopic,deepPlantarUltrasoundReference} from './content/deep-plantar-ultrasound';",
      "export {sourceCanonical} from './lib/body-source-additions';",
      "export {contentTabs} from './lib/content-types';",
    ].join(''),
    resolveDir: process.cwd(), loader: 'ts',
  },
  bundle: true, write: false, platform: 'node', format: 'esm',
});
const api = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const reference = 'https://doi.org/10.1016/S1078-5884(98)80086-5';
assert.equal(api.deepPlantarUltrasoundReference, reference);
assert.deepEqual([...api.deepPlantarUltrasoundTopic.citations], [reference]);
const commonWords = [api.deepPlantarUltrasoundTopic.body,
  ...api.deepPlantarUltrasoundTopic.bullets, api.deepPlantarUltrasoundTopic.note]
  .join(' ').trim().split(/\s+/);
assert(commonWords.length <= 130, `common authored prose has ${commonWords.length} words`);

function* alteredLeaves(value, path = []) {
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      yield* alteredLeaves(value[key], [...path, key]);
    }
  } else {
    const clone = structuredClone(value);
    yield { path, changed: typeof clone === 'number' ? clone + 1
      : typeof clone === 'boolean' ? !clone : `${clone} changed` };
  }
}
function changeAt(copy, path, value) {
  let cursor = copy;
  for (const key of path.slice(0, -1)) cursor = cursor[key];
  cursor[path.at(-1)] = value;
}

for (const entry of pins.entries) {
  const identity = entry.identity;
  const [side, id, sourceFile] = expected.get(identity.fmaId);
  assert.equal(identity.id, id);
  assert.equal(identity.laterality, side);
  assert.equal(identity.nodeName, identity.fmaId);
  assert.equal(identity.bundle, 'foot-vessels-foot-vascular');
  assert.equal(identity.system, 'vessels');
  assert.equal(identity.category, 'vessel');
  assert.deepEqual(identity.sources.map(source => source.file), [sourceFile]);
  assert.equal(entry.previous?.readiness, 'pending');
  assert.equal(entry.previous?.title, 'Ultrasound content pending');
  assert.match(entry.reviewFingerprint?.materialHash ?? '', /^[a-f0-9]{64}$/);
  for (const value of Object.values(entry.reviewFingerprint?.fingerprints ?? {}))
    assert.match(value, /^[a-f0-9]{64}$/);
  const catalogIdentity = rawCatalog.structures.find(s => s.id === id);
  assert(catalogIdentity, `${id}: present in catalog`);
  assert.equal(api.sourceCanonical(identity), api.sourceCanonical(catalogIdentity));

  const lesson = api.deepPlantarUltrasoundLesson(identity, 'ultrasound');
  assert(lesson);
  assert.equal(lesson.readiness, 'draft');
  assert.equal(lesson.title, `${identity.name} · Ultrasound evidence and limits · draft`);
  assert.equal(lesson.body, api.deepPlantarUltrasoundTopic.body);
  assert.deepEqual(lesson.bullets, [...api.deepPlantarUltrasoundTopic.bullets]);
  assert.deepEqual(lesson.citations, [reference]);
  assert.equal(lesson.note, api.deepPlantarUltrasoundTopic.note);
  const prose = [lesson.body, ...lesson.bullets, lesson.note].join(' ');
  for (const phrase of ['symptomatic', 'distal bypass', 'anterior tibial', 'dorsalis pedis',
    'deep plantar', 'medial', 'lateral', 'superficial', 'did not examine',
    'bilateral', 'healthy-foot', 'general scan protocol', 'diagnostic accuracy',
    'perfusion', 'patient registration', 'radiologist review', 'pending',
    'No acquired ultrasound image']) assert(prose.toLowerCase().includes(phrase.toLowerCase()), `${id}: missing ${phrase}`);
  for (const tab of api.contentTabs.filter(tab => tab !== 'ultrasound'))
    assert.equal(api.deepPlantarUltrasoundLesson(identity, tab), undefined, `${id}: ${tab} rejected`);
  assert.equal(api.deepPlantarUltrasoundLesson(structuredClone(identity), 'ultrasound')?.body, lesson.body);

  for (const { path, changed } of alteredLeaves(identity)) {
    const copy = structuredClone(identity);
    changeAt(copy, path, changed);
    assert.equal(api.deepPlantarUltrasoundLesson(copy, 'ultrasound'), undefined,
      `${id}: source leaf ${path.join('.')} rejected`);
  }

  lesson.bullets.push('injected');
  lesson.citations.push('https://example.invalid/');
  const again = api.deepPlantarUltrasoundLesson(identity, 'ultrasound');
  assert.deepEqual(again.bullets, [...api.deepPlantarUltrasoundTopic.bullets]);
  assert.deepEqual(again.citations, [reference]);
  assert.notEqual(again.bullets, lesson.bullets);
  assert.notEqual(again.citations, lesson.citations);
}
for (const fmaId of ['FMA43929', 'FMA43930', 'FMA43931', 'FMA43932',
  'FMA43937', 'FMA43938', 'FMA43943', 'FMA43944']) {
  const adjacent = rawCatalog.structures.find(s => s.fmaId === fmaId);
  assert(adjacent, `${fmaId}: adjacent source found`);
  assert.equal(api.deepPlantarUltrasoundLesson(adjacent, 'ultrasound'), undefined);
}
assert.equal(api.deepPlantarUltrasoundLesson({ id: 'unknown' }, 'ultrasound'), undefined);
console.log('deep plantar ultrasound unit: two exact source pins, exclusions, prose and isolation passed');
