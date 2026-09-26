import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { runInNewContext } from 'node:vm';
import { build } from './workspace-component-test-build.mjs';

const require = createRequire(import.meta.url);
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const baseline = process.argv.includes('--baseline');
let exam = false, fixture;
const shim = { ...React, useContext: () => ({ exam }) };
async function load(fixtures = false) {
  const built = await build({
    stdin: { contents: "export {QuizNotes} from './app/atlas-workspace'; export {bodyContent} from './app/body-content'; export {bodyDisplayCatalog} from './lib/body-display-catalog';", loader: 'tsx', resolveDir: process.cwd() },
    bundle: true, platform: 'node', format: 'cjs', write: false,
    plugins: [{ name: 'quiz-test-inputs', setup(api) {
      if (baseline) api.onLoad({ filter: /[\\/]app[\\/]atlas-workspace\.tsx$/ }, () => ({
        contents: execFileSync('git', ['show', 'f46b48c:app/atlas-workspace.tsx'], { encoding: 'utf8' }),
        loader: 'tsx', resolveDir: process.cwd() + '/app',
      }));
      // Inject only malformed/legacy lesson inputs; the two UI components remain real.
      if (fixtures) api.onLoad({ filter: /[\\/]app[\\/]body-content\.ts$/ }, () => ({
        contents: 'export const bodyContent = () => testLesson();', loader: 'ts',
      }));
    } }],
  });
  const scope = { exports: {} };
  runInNewContext(built.outputFiles[0].text, { module: scope, exports: scope.exports,
    require: id => id === 'react' ? shim : id === 'next/link'
      ? () => { throw Error('Unrelated Next Link must not render in this focused harness'); }
      : require(id), console, testLesson: () => fixture });
  return scope.exports;
}
const api = await load();
const raw = JSON.parse(await readFile(new URL('../public/models/bodyparts3d/full-body/catalog.json', import.meta.url), 'utf8'));
const catalog = api.bodyDisplayCatalog(raw);
const keyed = [], legacy = [];
for (const structure of catalog.structures) {
  const lesson = api.bodyContent(structure, 'quiz');
  (lesson.correctAnswer === undefined ? legacy : keyed).push({ structure, lesson });
}
assert(keyed.length > 0, 'discover actual explicitly keyed body lessons');
assert(legacy.length > 0, 'discover actual legacy lessons');
const htmlFor = (component, structure) => renderToStaticMarkup(React.createElement(component, { structure }));
const escaped = value => renderToStaticMarkup(React.createElement('span', null, value)).slice(6, -7);
for (const { structure, lesson } of keyed) {
  const html = htmlFor(api.QuizNotes, structure);
  assert.equal((html.match(/type="radio"/g) || []).length, lesson.bullets.length, structure.id + ': native choices');
  assert.match(html, />Check answer<\/button>/, structure.id + ': connected check');
  assert.match(html, /<button[^>]*disabled=""[^>]*>Check answer/, structure.id + ': no initial guess');
  assert(!html.includes('Correct answer:'), structure.id + ': feedback initially hidden');
  if (lesson.explanation) assert(!html.includes(escaped(lesson.explanation)), structure.id + ': explanation initially hidden');
  if (lesson.note) assert(html.includes(escaped(lesson.note)), structure.id + ': source note preserved');
  for (const citation of lesson.citations || []) assert(html.includes(escaped(citation)), structure.id + ': citation preserved');
}
function legacyMarkup(structure, lesson) {
  return renderToStaticMarkup(React.createElement('details', { className: 'atlas-quiz-notes' },
    React.createElement('summary', null, 'Quiz notes · ', structure.name),
    React.createElement('p', null, lesson.body),
    lesson.bullets && React.createElement('ul', null, lesson.bullets.map(bullet => React.createElement('li', { key: bullet }, bullet))),
    lesson.note && React.createElement('p', { className: 'body-content-note' }, lesson.note),
    lesson.citations?.map((url, i) => React.createElement('a', { key: url, href: url, target: '_blank', rel: 'noreferrer' }, `Reference ${i + 1} ↗`))));
}
for (const { structure, lesson } of legacy) {
  assert.equal(htmlFor(api.QuizNotes, structure), legacyMarkup(structure, lesson), structure.id + ': legacy notes unchanged');
}
exam = true;
for (const { structure } of [...keyed, ...legacy]) assert.equal(htmlFor(api.QuizNotes, structure), '', structure.id + ': exam suppression');
exam = false;
const fixtureApi = await load(true);
const original = keyed[0];
fixture = { ...original.lesson, correctAnswer: 'Not an available answer (test input)' };
const invalid = htmlFor(fixtureApi.QuizNotes, original.structure);
assert.match(invalid, /cannot be marked/);
assert(!invalid.includes('Check answer'), 'invalid explicit answer cannot be checked');
assert(!invalid.includes('Correct answer:'), 'invalid explicit answer cannot reveal a guessed score');
fixture = { ...original.lesson };
delete fixture.correctAnswer;
assert.equal(htmlFor(fixtureApi.QuizNotes, original.structure), legacyMarkup(original.structure, fixture), 'absent key retains legacy body, bullets, note and citations');
fixture = original.lesson;
function findQuickCheck(node) {
  if (!React.isValidElement(node)) return;
  if (typeof node.type === 'function' && node.type.name === 'StructureQuickCheck') return node;
  for (const child of React.Children.toArray(node.props.children)) {
    const found = findQuickCheck(child);
    if (found) return found;
  }
}
const attempt = structure => findQuickCheck(fixtureApi.QuizNotes({ structure }));
const first = attempt(original.structure);
assert(first && first.key !== null, 'selection-bound quick check must have an explicit key');
assert.equal(first.props.question, original.lesson.body);
assert.deepEqual(first.props.choices, original.lesson.bullets);
assert.equal(first.props.correctAnswer, original.lesson.correctAnswer);
assert.equal(first.props.explanation, original.lesson.explanation);
const changed = [
  { ...original.structure, id: original.structure.id + '-test-selection' },
  keyed[1].structure,
];
for (const structure of changed) assert.notEqual(attempt(structure).key, first.key, 'different source selection starts a distinct React attempt despite identical lesson');
console.log(`Regional quick check: ${keyed.length} actual keyed and ${legacy.length} legacy body lessons; native SSR controls, hidden initial explanations, preserved legacy/citations, invalid-key fail-closed, source-bound attempts and exam suppression pass. Component/SSR harness; no browser or clinical claim.`);
