import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { build } from './workspace-test-build.mjs';

const pins = JSON.parse(readFileSync('content/suprascapular-vessel-ultrasound-pins.json', 'utf8'));
assert.equal(pins.baseline, 'cbca085f2862f14df28007b32a4f2cd688dd01d5');
assert.equal(pins.entries.length, 4);
assert.deepEqual(pins.entries.map(entry => entry.family), ['artery', 'artery', 'vein', 'vein']);
assert.equal(new Set(pins.entries.map(entry => entry.identity.id)).size, 4);

const result = await build({
  stdin: {
    contents: "export * from './lib/suprascapular-vessel-ultrasound'; export * from './content/suprascapular-vessel-ultrasound';",
    resolveDir: process.cwd(),
    loader: 'ts',
  },
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
});
const lessonModule = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
const lessonFor = lessonModule.suprascapularVesselUltrasoundLesson;
const source = 'https://doi.org/10.3390/jcm7120491';
assert.equal(lessonModule.suprascapularVesselUltrasoundReferences.notchDopplerStudy, source);

function leaves(value, path = []) {
  return value === null || typeof value !== 'object'
    ? [path]
    : Object.entries(value).flatMap(([key, item]) => leaves(item, [...path, key]));
}
function editAtPath(value, path) {
  const copy = structuredClone(value);
  let parent = copy;
  for (const key of path.slice(0, -1)) parent = parent[key];
  const key = path.at(-1), original = parent[key];
  parent[key] = typeof original === 'string' ? original + '-changed'
    : typeof original === 'number' ? original + 0.01
      : original === null ? 'changed' : !original;
  return copy;
}

let leafRefusals = 0, otherRefusals = 0;
for (const { identity, family } of pins.entries) {
  const actual = lessonFor(identity, 'ultrasound');
  assert.equal(actual.readiness, 'draft');
  assert.equal(actual.body, lessonModule.suprascapularVesselUltrasoundTeaching[family].body);
  assert.deepEqual(actual.citations, [source]);
  assert.match(actual.note, /revision-bound radiologist sign-off pending/i);
  assert.match(actual.note, /actual acquisition/i);
  assert.match(actual.note, /Atlas, case and paid-lecture access remain independent/i);

  for (const path of leaves(identity)) {
    assert.equal(lessonFor(editAtPath(identity, path), 'ultrasound'), undefined, path.join('.'));
    leafRefusals++;
  }
  for (const edit of [
    value => { value.unexpected = true; },
    value => { value.sources.push(structuredClone(value.sources[0])); },
    value => { value.sources[0].sha256 = 'changed'; },
    value => { value.regions.reverse(); },
    value => { value.sources = []; },
  ]) {
    const mutated = structuredClone(identity);
    edit(mutated);
    assert.equal(lessonFor(mutated, 'ultrasound'), undefined);
    otherRefusals++;
  }
  for (const tab of ['ct', 'mri', 'xray', 'anatomy']) {
    assert.equal(lessonFor(identity, tab), undefined);
    otherRefusals++;
  }

  const original = structuredClone(actual);
  actual.bullets.push('foreign');
  actual.citations.push('https://foreign.example');
  assert.deepEqual(lessonFor(identity, 'ultrasound'), original);
  assert.notStrictEqual(lessonFor(identity, 'ultrasound').bullets, lessonFor(identity, 'ultrasound').bullets);
  assert.notStrictEqual(lessonFor(identity, 'ultrasound').citations, lessonFor(identity, 'ultrasound').citations);
}

assert.equal(lessonFor({ ...pins.entries[0].identity, id: 'unlisted-structure' }, 'ultrasound'), undefined);
otherRefusals++;
const words = Object.values(lessonModule.suprascapularVesselUltrasoundTeaching)
  .flatMap(item => [item.body, ...item.bullets])
  .join(' ').trim().split(/\s+/);
assert(words.length <= 190, `Two teaching families use ${words.length} words`);
console.log(JSON.stringify({ entries: pins.entries.length, source, teachingWords: words.length, leafRefusals, otherRefusals, freshArrays: true }));
