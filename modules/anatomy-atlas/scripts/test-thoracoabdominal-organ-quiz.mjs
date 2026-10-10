import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { contentContext } from './content-contract-tools.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';
import { build as componentBuild } from './workspace-component-test-build.mjs';
import { build } from './workspace-test-build.mjs';
import pins from '../content/thoracoabdominal-organ-quiz-pins.json' with { type: 'json' };
import { thoracoabdominalOrganQuizGroups, thoracoabdominalOrganQuizQuestions } from '../content/thoracoabdominal-organ-quiz.ts';

const integrated = process.argv.includes('--integrated');
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const snapshot = (api, display) => ({
  body: display.structures.map(s => ({ id: s.id, sections: Object.fromEntries(api.contentTabs.map(t => [t, api.bodyLesson(s, t)])) })),
  shoulder: api.structures, recipes: api.dissectionProfiles,
});
assert.equal(pins.baseline, 'fae8cf6abbfffe304d5190e44f53affa883a96a3');
const { api, catalog } = await contentContext();
const display = api.bodyDisplayCatalog(catalog);
const parent = await exactSourceHistoryApi(pins.baseline, 'display-content');
assert.deepEqual(display, parent.bodyDisplayCatalog(catalog));
assert.equal(hash(snapshot(parent, display)), pins.previousAllLessonsAndRecipesHash);
assert.deepEqual(api.structures, parent.structures);
assert.deepEqual(api.dissectionProfiles, parent.dissectionProfiles);
const compiled = await build({ stdin: { contents: "export {thoracoabdominalOrganQuizLesson} from './lib/thoracoabdominal-organ-quiz';", resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, platform: 'node', format: 'esm' });
const { thoracoabdominalOrganQuizLesson: lessonFor } = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));

const groups = Object.keys(thoracoabdominalOrganQuizGroups);
assert.deepEqual(groups, ['heart', 'esophagus', 'thymus', 'stomach', 'smallIntestine', 'largeIntestine', 'appendix', 'ileocecalJunction']);
assert.equal(pins.entries.length, 8);
assert.deepEqual(pins.entries.map(e => e.group), groups);
assert.deepEqual(pins.entries.map(e => e.identity.fmaId), groups.flatMap(g => thoracoabdominalOrganQuizGroups[g]));
const targets = new Map(pins.entries.map(entry => [entry.identity.id, entry]));
assert.equal(targets.size, 8);
let resolved = 0, unchanged = 0, changed = 0, rejected = 0;
for (const structure of display.structures) for (const tab of api.contentTabs) {
  const entry = targets.get(structure.id);
  const old = parent.bodyLesson(structure, tab);
  const current = api.bodyLesson(structure, tab);
  const direct = lessonFor(structure, tab);
  if (!entry || tab !== 'quiz') {
    assert.equal(direct, undefined, structure.id + '|' + tab);
    assert.deepEqual(current, old, structure.id + '|' + tab);
    unchanged++; continue;
  }
  const question = thoracoabdominalOrganQuizQuestions[entry.group];
  assert.deepEqual(structure, entry.identity);
  assert.deepEqual(old, entry.previous.quiz);
  assert.equal(old.correctAnswer, undefined);
  assert(direct); assert.notDeepEqual(direct, old);
  assert.equal(direct.readiness, 'draft');
  assert.equal(direct.body, question.body);
  assert.deepEqual(direct.bullets, [...question.choices]);
  assert.equal(direct.correctAnswer, question.correctAnswer);
  assert.equal(direct.explanation, question.explanation);
  assert.deepEqual(direct.citations, [question.reference]);
  assert.equal(direct.bullets.length, 4);
  assert.equal(new Set(direct.bullets.map(s => s.trim())).size, 4);
  assert(direct.bullets.every(s => s.trim()));
  assert.equal(direct.bullets.filter(s => s === direct.correctAnswer).length, 1);
  assert.match(direct.note, /radiologist review pending/i);
  if (integrated) {
    assert.deepEqual(current, direct);
    const { readiness: _readiness, ...shown } = direct;
    assert.deepEqual(api.bodyContent(structure, tab), shown);
    changed++;
  }
  const copy = structuredClone(direct);
  direct.bullets.push('foreign'); direct.citations.push('foreign');
  assert.deepEqual(lessonFor(structure, tab), copy, 'lesson must return fresh choices and citations');
  resolved++;
}
assert.equal(resolved, 8);
assert.equal(unchanged, display.structures.length * api.contentTabs.length - 8);
if (integrated) assert.equal(changed, 8);
assert(new Set(pins.entries.map(e => thoracoabdominalOrganQuizQuestions[e.group].choices.indexOf(thoracoabdominalOrganQuizQuestions[e.group].correctAnswer))).size > 1);

// Reject every source identity leaf, including source order and cardinality.
const leaves = (value, path = []) => value === null || typeof value !== 'object'
  ? [path] : Object.entries(value).flatMap(([key, child]) => leaves(child, [...path, key]));
for (const { identity } of pins.entries) {
  for (const path of leaves(identity)) {
    const bad = structuredClone(identity); let object = bad;
    for (const key of path.slice(0, -1)) object = object[key];
    const key = path.at(-1), old = object[key];
    object[key] = typeof old === 'number' ? old + .01 : typeof old === 'boolean' ? !old : String(old) + '-foreign';
    assert.equal(lessonFor(bad, 'quiz'), undefined, path.join('.')); rejected++;
  }
  assert.equal(lessonFor({ ...identity, unexpectedSourceField: true }, 'quiz'), undefined); rejected++;
  for (const key of Object.keys(identity)) {
    const bad = structuredClone(identity); delete bad[key];
    assert.equal(lessonFor(bad, 'quiz'), undefined, 'missing ' + key); rejected++;
  }
  if (identity.sources?.length) {
    const missing = structuredClone(identity); missing.sources.pop();
    assert.equal(lessonFor(missing, 'quiz'), undefined); rejected++;
    const extra = structuredClone(identity); extra.sources.push(structuredClone(extra.sources[0]));
    assert.equal(lessonFor(extra, 'quiz'), undefined); rejected++;
    if (identity.sources.length > 1) {
      const reordered = structuredClone(identity); reordered.sources.reverse();
      assert.equal(lessonFor(reordered, 'quiz'), undefined); rejected++;
    }
  }
}
assert.equal(lessonFor({ ...pins.entries[0].identity, id: 'foreign' }, 'quiz'), undefined);

// Exercise the shipped components, provider, radio state and revision key.
const require = createRequire(import.meta.url), React = require('react');
const render = require('react-dom/server').renderToStaticMarkup;
const component = await componentBuild({ stdin: { contents: "export {StructureQuickCheck} from './app/structure-quick-check'; export {QuizNotes,AtlasWorkspace} from './app/atlas-workspace';", resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, platform: 'node', format: 'cjs', write: false });
const load = react => {
  const scope = { exports: {} };
  runInNewContext(component.outputFiles[0].text, { module: scope, exports: scope.exports,
    require: id => id === 'react' ? react : id === 'next/link' ? () => { throw Error('Unrelated Next Link must not render'); } : require(id), console });
  return scope.exports;
};
const actual = load(React);
let states = [], refs = [], cursor = 0, refCursor = 0, active = false;
const focus = { target: null };
const shim = { ...React, useContext: () => ({ exam: false }), useId: () => active ? 'organ-check' : React.useId(),
  useState(initial) { if (!active) return React.useState(initial); const i = cursor++; if (!(i in states)) states[i] = initial; return [states[i], value => { states[i] = value; }]; },
  useRef(initial) { if (!active) return React.useRef(initial); const i = refCursor++; return refs[i] ?? (refs[i] = { current: initial }); },
};
const events = load(shim);
function walk(node, found = []) {
  if (React.isValidElement(node)) { found.push(node); React.Children.forEach(node.props.children, child => walk(child, found)); }
  return found;
}
const textOf = node => typeof node === 'string' ? node : !node ? '' : Array.isArray(node) ? node.map(textOf).join('') : textOf(node.props?.children);
let rendered = 0, interacted = 0;
for (const { identity } of pins.entries) {
  const lesson = lessonFor(identity, 'quiz');
  const props = { question: lesson.body, choices: lesson.bullets, correctAnswer: lesson.correctAnswer, explanation: lesson.explanation };
  const html = render(React.createElement(actual.StructureQuickCheck, props));
  assert.equal((html.match(/type="radio"/g) || []).length, 4);
  assert.match(html, /<button[^>]*disabled=""[^>]*>Check answer/);
  assert(!html.includes('Correct answer:'));
  assert(!html.includes('answer key is missing'));
  const attempt = events.StructureQuickCheck(props);
  assert.equal(attempt.key, JSON.stringify(props));
  for (const field of ['question', 'explanation']) assert.notEqual(events.StructureQuickCheck({ ...props, [field]: props[field] + ' revised' }).key, attempt.key);
  states = []; refs = []; cursor = 0; active = true;
  let note = events.QuizNotes({ structure: identity }); active = false;
  const lazyClosed = walk(note).find(node => typeof node.type === 'function' && node.type.name === 'LazyBodyTeaching');
  assert.equal(lazyClosed.props.enabled, false);
  note.props.onToggle({ currentTarget: { open: true } });
  cursor = 0; active = true; note = events.QuizNotes({ structure: identity }); active = false;
  const lazy = walk(note).find(node => typeof node.type === 'function' && node.type.name === 'LazyBodyTeaching');
  assert(lazy.props.enabled);
  const loaded = lazy.props.children({ bodyContent: api.bodyContent });
  const child = walk(loaded).find(node => typeof node.type === 'function' && node.type.name === 'StructureQuickCheck');
  assert(child); assert.equal(child.key, identity.id);
  assert.deepEqual(JSON.parse(JSON.stringify(child.props)), props);
  assert.deepEqual(walk(loaded).filter(node => node.type === 'a').map(node => node.props.href), lesson.citations);
  const normal = render(React.createElement(actual.AtlasWorkspace, { exam: false }, React.createElement(actual.QuizNotes, { structure: identity })));
  assert(normal.includes('atlas-quiz-notes'));
  const exam = render(React.createElement(actual.AtlasWorkspace, { exam: true }, React.createElement(actual.QuizNotes, { structure: identity })));
  assert(!exam.includes('atlas-quiz-notes')); assert(!exam.includes(lesson.body)); rendered++;

  states = []; refs = []; let tree;
  const redraw = () => {
    cursor = 0; refCursor = 0; active = true; tree = attempt.type(attempt.props); active = false;
    for (const node of walk(tree)) if (node.props.ref) node.props.ref.current = { focus(options) {
      assert.equal(options.preventScroll, true); focus.target = node.type === 'input' ? 'first-radio' : 'feedback';
    } };
  };
  const radios = () => walk(tree).filter(node => node.type === 'input');
  const button = label => walk(tree).find(node => node.type === 'button' && textOf(node) === label);
  const answer = index => { radios()[index].props.onChange(); redraw(); button('Check answer').props.onClick(); redraw(); };
  redraw(); assert.equal(button('Check answer').props.disabled, true);
  const correct = props.choices.indexOf(props.correctAnswer);
  answer(correct);
  assert(textOf(tree).includes('Correct. Correct answer: ' + props.correctAnswer));
  assert(textOf(tree).includes(props.explanation)); assert.equal(focus.target, 'feedback');
  assert.equal(button('Try again'), undefined, 'correct feedback must not suggest failure');
  button('Practise again').props.onClick(); redraw(); assert.equal(focus.target, 'first-radio');
  assert(radios().every(node => !node.props.checked));
  answer((correct + 1) % 4);
  assert(textOf(tree).includes('Incorrect. Correct answer: ' + props.correctAnswer));
  assert(textOf(tree).includes(props.explanation));
  radios()[correct].props.onChange(); redraw();
  assert(!textOf(tree).includes('Correct answer:')); assert(!textOf(tree).includes(props.explanation));
  assert.equal(button('Check answer').props.disabled, false);
  answer((correct + 1) % 4);
  button('Try again').props.onClick(); redraw();
  assert(radios().every(node => !node.props.checked));
  assert(!textOf(tree).includes('Correct answer:')); interacted++;
}
assert.equal(rendered, 8); assert.equal(interacted, 8);
console.log(JSON.stringify({ integrated, resolved, unchanged, changed, rejected, rendered, interacted, clinicalApproval: false }));
