import assert from 'node:assert/strict';
import test from 'node:test';
import { build, stop } from 'esbuild';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const result = await build({
  stdin: { contents: `export { paratubalCtLesson } from './lib/paratubal-ct';
    export { bodyLesson, bodyContent } from './app/body-content';
    export { bodyDisplayCatalog } from './lib/body-display-catalog';
    export { paratubalCtTopics } from './content/paratubal-ct';`, resolveDir: root, loader: 'ts' },
  bundle: true, write: false, format: 'esm', platform: 'node', tsconfigRaw: {},
}).finally(stop);
const api = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
const pins = JSON.parse(readFileSync(new URL('../content/pharyngeal-mri-pins.json', import.meta.url)));
const catalog = api.bodyDisplayCatalog(JSON.parse(readFileSync(new URL('../public/models/bodyparts3d/full-body/catalog.json', import.meta.url))));
const expected = new Map([
  ['FMA46729', ['left', 'FJ2741', 'levator']], ['FMA46728', ['right', 'FJ2753', 'levator']],
  ['FMA46732', ['left', 'FJ2748', 'tensor']], ['FMA46731', ['right', 'FJ2760', 'tensor']],
]);

for (const [fma, [side, file, group]] of expected) test(`${fma}: exact source CT draft reaches the learner`, () => {
  const structure = catalog.structures.find(s => s.fmaId === fma);
  assert.deepEqual(structure, pins.entries.find(entry => entry.identity.fmaId === fma).identity);
  assert.equal(structure.laterality, side); assert.equal(structure.sources[0].file, file);
  const lesson = api.paratubalCtLesson(structure, 'ct');
  assert.equal(lesson.readiness, 'draft');
  assert.match(lesson.title, /CT research context/);
  assert.equal(lesson.body, api.paratubalCtTopics[group].body);
  assert.deepEqual(api.bodyLesson(structure, 'ct'), lesson);
  const { readiness, ...content } = lesson;
  assert.deepEqual(api.bodyContent(structure, 'ct'), content);
  const unchanged = structuredClone(lesson);
  lesson.bullets.push('foreign'); lesson.citations.push('foreign');
  assert.deepEqual(api.paratubalCtLesson(structure, 'ct'), unchanged);
  for (const mutate of [
    s => { s.id += '-foreign'; }, s => { s.fmaId = 'FMA00000'; },
    s => { s.laterality = side === 'left' ? 'right' : 'left'; },
    s => { s.bundle = 'wrong'; }, s => { s.name += ' changed'; },
    s => { s.sources[0].file = 'foreign'; }, s => { s.sources[0].sha256 = '0'.repeat(64); },
    s => { s.sources = []; }, s => { s.bounds.max[0] += 1; },
    s => { s.center[0] += 1; }, s => { s.anchor[0] += 1; },
    s => { s.system = 'organs'; }, s => { s.category = 'organ'; },
    s => { s.region = 'abdomen'; }, s => { s.nodeName = 'foreign'; },
    s => { s.validation.anatomicalReview = true; }, s => { s.unexpected = true; },
  ]) {
    const changed = structuredClone(structure); mutate(changed);
    assert.equal(api.paratubalCtLesson(changed, 'ct'), undefined);
  }
  for (const tab of ['anatomy', 'function', 'mri', 'ultrasound', 'xray', 'clinical', 'pathology', 'quiz'])
    assert.equal(api.paratubalCtLesson(structure, tab), undefined);
});

test('other source selections never receive paratubal CT content', () => {
  for (const structure of catalog.structures.filter(s => !expected.has(s.fmaId)))
    assert.equal(api.paratubalCtLesson(structure, 'ct'), undefined);
});

test('primary references and research limits remain visible without approval or registration claims', () => {
  for (const topic of Object.values(api.paratubalCtTopics)) {
    assert.deepEqual(topic.citations, [
      'https://pmc.ncbi.nlm.nih.gov/articles/PMC3679544/',
      'https://pubmed.ncbi.nlm.nih.gov/9290650/',
    ]);
    assert.match(topic.body, /cadaver/i);
    assert.match(topic.bullets.join(' '), /routine.*CT|routine head CT/);
    assert.match(topic.note, /radiologist review pending/);
    assert.match(topic.note, /do not.*patient-space registration/);
    assert.match(topic.note, /access remain independent/);
  }
});
