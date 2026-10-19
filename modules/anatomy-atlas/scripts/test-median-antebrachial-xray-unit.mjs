import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

assert.equal(process.argv.length, 2, 'No source or test-mode overrides are accepted');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const atlas = existsSync(resolve(root, 'package.json')) ? root : resolve(root, '../../atlas');
const require = createRequire(resolve(atlas, 'package.json'));
const { buildSync } = require('esbuild');
const compiled = buildSync({
  stdin: { contents: "export * from './lib/median-antebrachial-xray';export * from './content/median-antebrachial-xray';", resolveDir: root, loader: 'ts' },
  bundle: true, write: false, format: 'esm', platform: 'node',
});
const api = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const pins = JSON.parse(readFileSync(resolve(root, 'content/median-antebrachial-xray-pins.json')));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const sourceBytes = readFileSync(resolve(atlas, pins.sourcePath));
const source = JSON.parse(sourceBytes);
const topics = ['anatomy', 'function', 'ct', 'mri', 'xray', 'ultrasound', 'pathology', 'clinical', 'quiz'];

test('two exact original-side source identities retain the complete pinned source record', () => {
  assert.equal(sha(JSON.stringify(pins)), '77a0e9f37d22a6a49f84f73a98deb15bb70c29914f35e657fff0356ef4126e89');
  assert.equal(pins.baselineCommit, '3dcdf94a46db44202e72641be9fbcf1274ce5364');
  assert.equal(sha(sourceBytes), pins.sourceSha256);
  assert.equal(pins.license, 'CC-BY-4.0'); assert.equal(source.license, pins.license);
  assert.deepEqual(pins.coordinateSystem, source.coordinateSystem);
  assert.deepEqual(pins.bundles, source.bundles);
  assert.deepEqual(pins.entries.map(entry => [entry.identity.laterality, entry.identity.fmaId]), [['right', 'FMA22968'], ['left', 'FMA22969']]);
  for (const entry of pins.entries) {
    const matching = source.structures.filter(s => s.id === entry.identity.id);
    assert.equal(matching.length, 1); assert.deepEqual(matching[0], entry.identity);
    assert.equal(entry.previousReadiness, 'pending'); assert.equal(entry.identity.validation.anatomicalReview, false);
  }
});

test('only the two exact X-ray selections get a draft; other tabs and median cubital sources fall through', () => {
  let authored = 0;
  for (const structure of source.structures) for (const topic of topics) {
    const lesson = api.medianAntebrachialXrayLesson(structure, topic);
    const expected = topic === 'xray' && pins.entries.some(entry => entry.identity.id === structure.id);
    assert.equal(Boolean(lesson), expected, `${structure.id}/${topic}`);
    if (lesson) {
      authored++; assert.equal(lesson.readiness, 'draft'); assert.match(lesson.title, /draft$/);
      assert(lesson.title.startsWith(structure.name));
    }
  }
  assert.equal(authored, 2);
});

test('every nested identity leaf and top-level field is required, without name/FMA fallback', () => {
  let refused = 0;
  function leaves(value, path = []) {
    if (value && typeof value === 'object') return Object.entries(value).flatMap(([key, item]) => leaves(item, [...path, key]));
    return [{ path, value }];
  }
  for (const { identity } of pins.entries) {
    for (const { path, value } of leaves(identity)) {
      const changed = structuredClone(identity); let target = changed;
      for (const key of path.slice(0, -1)) target = target[key];
      target[path.at(-1)] = typeof value === 'number' ? value + 1 : typeof value === 'boolean' ? !value : String(value) + '-changed';
      assert.equal(api.medianAntebrachialXrayLesson(changed, 'xray'), undefined, path.join('.')); refused++;
    }
    for (const key of Object.keys(identity)) {
      const changed = structuredClone(identity); delete changed[key];
      assert.equal(api.medianAntebrachialXrayLesson(changed, 'xray'), undefined, `missing ${key}`); refused++;
    }
    assert.equal(api.medianAntebrachialXrayLesson({ ...identity, foreign: true }, 'xray'), undefined); refused++;
  }
  assert(refused > 100);
});

test('returned arrays are detached and callers cannot mutate the source or future teaching', () => {
  for (const { identity } of pins.entries) {
    const original = JSON.stringify(identity), first = api.medianAntebrachialXrayLesson(identity, 'xray');
    const expected = structuredClone(first);
    first.bullets.push('outside edit'); first.citations[0] = 'https://example.invalid/unrelated';
    assert.deepEqual(api.medianAntebrachialXrayLesson(identity, 'xray'), expected);
    assert.equal(JSON.stringify(identity), original);
  }
});

test('original factual notes preserve research-method, variation, access and registration limits', () => {
  assert.deepEqual(api.medianAntebrachialXrayReferences, {
    injectedCadaver: 'https://pubmed.ncbi.nlm.nih.gov/11083557/',
    surfaceVariation: 'https://pubmed.ncbi.nlm.nih.gov/23377482/',
    medianCubitalAccess: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12338226/',
  });
  const lesson = api.medianAntebrachialXrayLesson(pins.entries[0].identity, 'xray');
  assert.match(lesson.body, /Imanishi/); assert.match(lesson.body, /15 fresh cadavers/);
  assert.match(lesson.body, /not evidence/); assert.match(lesson.title, /not routine plain-film visibility/);
  assert.match(lesson.bullets.join(' '), /median antebrachial and median cubital veins distinct/);
  assert.match(lesson.bullets.join(' '), /not X-rays/);
  assert.match(lesson.bullets.join(' '), /No acquired radiograph/);
  assert.match(lesson.note, /revision-bound radiologist review/);
  assert.match(lesson.note, /Atlas, imaging-case and paid-lecture access remain independent/);
  assert.equal('approval' in lesson, false); assert.equal('registration' in lesson, false);
  assert(lesson.citations.every(url => /^https:\/\/(?:pubmed|pmc)\.ncbi\.nlm\.nih\.gov\//.test(url)));
});
