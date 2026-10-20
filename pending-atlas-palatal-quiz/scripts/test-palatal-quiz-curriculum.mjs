// Integration candidate: copy alongside the helper into the Atlas tree, then run in main's lane.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { build } from './workspace-test-build.mjs';

const compiled = await build({ stdin: {
  contents: "export {palatalQuizLesson} from './lib/palatal-quiz-curriculum';" +
    "export {bodyLesson} from './app/body-content';",
  resolveDir: process.cwd(), loader: 'ts',
}, bundle: true, write: false, platform: 'node', format: 'esm' });
const { palatalQuizLesson, bodyLesson } = await import('data:text/javascript;base64,' +
  Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const catalog = JSON.parse(readFileSync('public/models/bodyparts3d/full-body/catalog.json', 'utf8'));
const expected = new Map([
  ['FMA46729', ['left', 'levator', 'FJ2741']],
  ['FMA46728', ['right', 'levator', 'FJ2753']],
  ['FMA46732', ['left', 'tensor', 'FJ2748']],
  ['FMA46731', ['right', 'tensor', 'FJ2760']],
]);
const selected = catalog.structures.filter(s => expected.has(s.fmaId));
assert.equal(selected.length, 4);
for (const s of selected) {
  const [side, family, file] = expected.get(s.fmaId);
  assert.equal(s.laterality, side);
  assert.equal(s.sources.length, 1);
  assert.equal(s.sources[0].file, file);
  const q = palatalQuizLesson(s, 'quiz');
  assert.equal(q?.readiness, 'draft');
  assert.equal(q?.bullets.length, 4);
  assert.equal(q.bullets.filter(choice => choice === q.correctAnswer).length, 1);
  assert.deepEqual(q.citations, ['https://anatomy.ttuhscep.edu/schemes/swallowing_tables.html']);
  assert.match(q.note, /radiologist review pending/);
  assert.equal(bodyLesson(s, 'quiz').correctAnswer, q.correctAnswer,
    `${side} ${family}: shared dispatch must select authored question`);
  assert.equal(palatalQuizLesson(s, 'function'), undefined);
  assert.equal(palatalQuizLesson({ ...s, sources: [{ ...s.sources[0], sha256: '0'.repeat(64) }] }, 'quiz'), undefined);
  assert.equal(palatalQuizLesson({ ...s, fmaId: 'FMA0' }, 'quiz'), undefined);
  assert.equal(palatalQuizLesson({ ...s, laterality: side === 'left' ? 'right' : 'left' }, 'quiz'), undefined);
}
assert.equal(new Set(selected.map(s => s.id)).size, 4);
const unrelated = catalog.structures.find(s => s.fmaId === 'FMA46293');
assert(unrelated, 'Retained unrelated head-neck record');
assert.equal(palatalQuizLesson(unrelated, 'quiz'), undefined);
const held = catalog.structures.find(s => s.id.endsWith(':superficial-perineal-muscle'));
assert(held, 'Retained held superficial-perineal record');
assert.equal(palatalQuizLesson(held, 'quiz'), undefined);
console.log('Palatal Quiz candidate: four exact sides, two families, negative selection, shared dispatch.');
