import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { contentContext, contentValidator } from './content-contract-tools.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';
import { build as componentBuild } from './workspace-component-test-build.mjs';
import { build } from './workspace-test-build.mjs';
import pins from '../content/cervical-quiz-pins.json' with { type: 'json' };
import { cervicalQuizGroups, cervicalQuizQuestions } from '../content/cervical-quiz.ts';

const integrated = process.argv.includes('--integrated');
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const snapshot = (api, display) => ({ body: display.structures.map(s => ({ id: s.id, sections: Object.fromEntries(api.contentTabs.map(t => [t, api.bodyLesson(s, t)])) })), shoulder: api.structures, recipes: api.dissectionProfiles });
const { api, catalog, registry } = await contentContext();
const display = api.bodyDisplayCatalog(catalog), parent = await exactSourceHistoryApi(pins.parentCommit);
const built = await build({ stdin: { contents: "export {cervicalQuizLesson} from './lib/cervical-quiz';", resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, platform: 'node', format: 'esm' });
const { cervicalQuizLesson } = await import('data:text/javascript;base64,' + Buffer.from(built.outputFiles[0].text).toString('base64'));
assert.equal(pins.parentCommit, '77244671eaf419095f681bb284737c01ecfbf6bb');
assert.equal(hash(pins), 'b931deadc7e703bb738f8283ca9241ce30bb31d8943a512acf93fd5173bea18b');
assert.deepEqual(display, parent.bodyDisplayCatalog(catalog));
assert.deepEqual(display.coordinateSystem, pins.coordinateSystem);
assert.equal(hash(snapshot(parent, display)), pins.previousAllLessonsAndRecipesHash);
assert.deepEqual(api.structures, parent.structures); assert.deepEqual(api.dissectionProfiles, parent.dissectionProfiles);
assert.deepEqual(pins.entries.map(entry => entry.identity.fmaId), Object.values(cervicalQuizGroups).flat());
assert.equal(new Set(pins.entries.map(entry => entry.identity.id)).size, 5);
for (const bundle of pins.bundles) {
  assert.deepEqual(display.bundles.find(candidate => candidate.id === bundle.id), bundle);
  const bytes = await readFile('public' + bundle.url.split('?')[0]);
  assert.equal(bytes.length, bundle.bytes); assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256);
}
const targets = new Map(pins.entries.map(entry => [entry.identity.id, entry]));
const records = integrated ? api.bodyContentRecords(display) : [], validate = integrated ? await contentValidator(registry) : undefined;
let resolved = 0, changed = 0, unchanged = 0, rejected = 0;
for (const structure of display.structures) for (const tab of api.contentTabs) {
  const before = parent.bodyLesson(structure, tab), now = api.bodyLesson(structure, tab), target = targets.get(structure.id);
  const direct = cervicalQuizLesson(structure, tab);
  if (!target || tab !== 'quiz') {
    assert.equal(direct, undefined); assert.deepEqual(now, before, structure.id + '|' + tab); unchanged++; continue;
  }
  assert.deepEqual(structure, target.identity); assert.deepEqual(target.topics, ['quiz']);
  assert.deepEqual(before, target.previous.quiz); assert(direct); assert.notDeepEqual(direct, before);
  assert.equal(direct.readiness, 'draft'); assert.equal(direct.bullets.length, 4);
  assert.equal(new Set(direct.bullets.map(choice => choice.trim())).size, 4);
  assert(direct.bullets.every(choice => choice.trim().length));
  assert.equal(direct.bullets.filter(choice => choice === direct.correctAnswer).length, 1);
  assert(direct.explanation.trim()); assert.match(direct.note, /Radiologist review pending/);
  assert.match(direct.note, /not patient imaging or confirmation of vertebral numbering/);
  assert.deepEqual(direct.citations, [cervicalQuizQuestions[target.group].reference]);
  if (integrated) {
    assert.deepEqual(now, direct); assert.notDeepEqual(now, before);
    const { readiness: _readiness, ...shown } = direct; assert.deepEqual(api.bodyContent(structure, tab), shown);
    const record = records.find(candidate => candidate.id === structure.id);
    assert(validate(record)); assert.deepEqual(record.content.quiz, direct);
    assert.equal(record.validation.clinicalApproval, 'not-included');
    const packet = await api.bodyReviewMaterial(structure.id); assert.equal(packet.approval, false);
    const { tab: _tab, ...topic } = packet.topics.find(candidate => candidate.tab === 'quiz'); assert.deepEqual(topic, direct);
    changed++;
  }
  const copy = structuredClone(direct); direct.bullets.push('foreign'); direct.citations.length = 0;
  assert.deepEqual(cervicalQuizLesson(structure, tab), copy); resolved++;
}
assert.equal(resolved, 5); assert.equal(unchanged, display.structures.length * api.contentTabs.length - 5);
if (integrated) assert.equal(changed, 5);
const leaves = (value, path = []) => value === null || typeof value !== 'object' ? [path] : Object.entries(value).flatMap(([key, child]) => leaves(child, [...path, key]));
for (const { identity } of pins.entries) for (const path of leaves(identity)) {
  const bad = structuredClone(identity); let object = bad;
  for (const key of path.slice(0, -1)) object = object[key];
  const key = path.at(-1), old = object[key];
  object[key] = typeof old === 'number' ? old + .01 : typeof old === 'boolean' ? !old : String(old) + '-foreign';
  assert.equal(cervicalQuizLesson(bad, 'quiz'), undefined); rejected++;
}
assert.equal(cervicalQuizLesson({ ...pins.entries[0].identity, id: 'unknown' }, 'quiz'), undefined); rejected++;
for (const { identity } of pins.entries) {
  assert.equal(cervicalQuizLesson({ ...identity, unexpectedSourceField: true }, 'quiz'), undefined); rejected++;
  const missing = structuredClone(identity); assert(Object.hasOwn(missing, 'coverageNote'));
  delete missing.coverageNote; assert.equal(cervicalQuizLesson(missing, 'quiz'), undefined); rejected++;
}
const questions = Object.values(cervicalQuizQuestions);
const referenceWords = Object.fromEntries([...new Set(questions.map(question => question.reference))].map(reference => [reference,
  questions.filter(question => question.reference === reference).map(question => [question.body, ...question.choices, question.correctAnswer, question.explanation].join(' ')).join(' ').split(/\s+/).length]));
for (const count of Object.values(referenceWords)) assert(count < 200);
assert.deepEqual(questions.map(question => question.choices.indexOf(question.correctAnswer)), [0, 1, 2, 3, 0]);

// Exercise the shipped quick-check component, including its complete-props key.
const require = createRequire(import.meta.url), React = require('react'), render = require('react-dom/server').renderToStaticMarkup;
const component = await componentBuild({ stdin: { contents: "export {StructureQuickCheck} from './app/structure-quick-check'; export {QuizNotes,AtlasWorkspace} from './app/atlas-workspace';", resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, platform: 'node', format: 'cjs', write: false });
const load = react => {
  const scope = { exports: {} };
  runInNewContext(component.outputFiles[0].text, { module: scope, exports: scope.exports,
    require: id => id === 'react' ? react : id === 'next/link' ? () => { throw Error('Unrelated Next Link must not render'); } : require(id), console });
  return scope.exports;
};
const actual = load(React);
const escaped = value => render(React.createElement('span', null, value)).slice(6, -7);
let states = [], refs = [], cursor = 0, refCursor = 0, active = false;
const focus = { target: null };
const shim = { ...React, useContext: () => ({ exam: false }), useId: () => active ? 'cervical-check' : React.useId(),
  useState(initial) { if (!active) return React.useState(initial); const index = cursor++; if (!(index in states)) states[index] = initial; return [states[index], value => { states[index] = value; }]; },
  useRef(initial) { if (!active) return React.useRef(initial); const index = refCursor++; return refs[index] ?? (refs[index] = { current: initial }); },
};
const events = load(shim);
function walk(node, found = []) {
  if (React.isValidElement(node)) { found.push(node); React.Children.forEach(node.props.children, child => walk(child, found)); }
  return found;
}
const nodeText = node => typeof node === 'string' ? node : !node ? '' : Array.isArray(node) ? node.map(nodeText).join('') : nodeText(node.props?.children);
const keys = new Set(); let rendered = 0, interacted = 0;
for (const { identity } of pins.entries) {
  const lesson = cervicalQuizLesson(identity, 'quiz');
  const props = { question: lesson.body, choices: lesson.bullets, correctAnswer: lesson.correctAnswer, explanation: lesson.explanation };
  const attempt = events.StructureQuickCheck(props);
  assert.equal(attempt.key, JSON.stringify(props)); assert(!keys.has(attempt.key)); keys.add(attempt.key);
  assert.notEqual(events.StructureQuickCheck({ ...props, explanation: props.explanation + ' revised' }).key, attempt.key);
  if (integrated) {
    const child = walk(events.QuizNotes({ structure: identity })).find(node => typeof node.type === 'function' && node.type.name === 'StructureQuickCheck');
    assert(child); assert.equal(child.key, identity.id); assert.deepEqual(JSON.parse(JSON.stringify(child.props)), props);
    const html = render(React.createElement(actual.AtlasWorkspace, { exam: false }, React.createElement(actual.QuizNotes, { structure: identity })));
    assert.equal((html.match(/type="radio"/g) || []).length, 4); assert(html.includes('<fieldset'));
    assert.match(html, /<button[^>]*disabled=""[^>]*>Check answer/); assert(!html.includes('Correct answer:'));
    assert(!html.includes('answer key is missing')); assert(!html.includes(escaped(lesson.explanation)));
    assert(html.includes(escaped(lesson.body))); assert(html.includes(lesson.citations[0]));
    for (const choice of lesson.bullets) assert(html.includes(escaped(choice)));
    const examHtml = render(React.createElement(actual.AtlasWorkspace, { exam: true }, React.createElement(actual.QuizNotes, { structure: identity })));
    assert(!examHtml.includes('type="radio"')); assert(!examHtml.includes(escaped(lesson.body))); rendered++;
  }
  states = []; refs = []; let tree;
  const redraw = () => {
    cursor = 0; refCursor = 0; active = true; tree = attempt.type(attempt.props); active = false;
    for (const node of walk(tree)) if (node.props.ref) node.props.ref.current = { focus(options) {
      assert.equal(options.preventScroll, true); focus.target = node.type === 'input' ? 'first-radio' : 'feedback';
    } };
  };
  const radios = () => walk(tree).filter(node => node.type === 'input');
  const button = label => walk(tree).find(node => node.type === 'button' && nodeText(node) === label);
  const answer = index => { radios()[index].props.onChange(); redraw(); button('Check answer').props.onClick(); redraw(); };
  redraw(); assert.equal(button('Check answer').props.disabled, true); assert(!nodeText(tree).includes('answer key is missing'));
  const correct = props.choices.indexOf(props.correctAnswer);
  answer(correct); assert(nodeText(tree).includes('Correct. Correct answer: ' + props.correctAnswer));
  assert(nodeText(tree).includes(props.explanation)); assert.equal(focus.target, 'feedback');
  button('Practise again').props.onClick(); redraw(); assert.equal(focus.target, 'first-radio');
  assert(radios().every(node => !node.props.checked));
  answer((correct + 1) % 4); assert(nodeText(tree).includes('Incorrect. Correct answer: ' + props.correctAnswer));
  assert(nodeText(tree).includes(props.explanation));
  button('Try again').props.onClick(); redraw(); assert.equal(focus.target, 'first-radio');
  assert(radios().every(node => !node.props.checked));
  answer((correct + 1) % 4); radios()[correct].props.onChange(); redraw();
  assert(!nodeText(tree).includes('Correct answer:')); assert(!nodeText(tree).includes(props.explanation)); interacted++;
}
assert.equal(keys.size, 5); assert.equal(interacted, 5);
const missingKeyHtml = render(React.createElement(actual.StructureQuickCheck, { question: 'Missing key fixture', choices: ['A', 'B', 'C', 'D'], correctAnswer: null }));
assert(missingKeyHtml.includes('answer key is missing')); assert(!missingKeyHtml.includes('Check answer'));
console.log(JSON.stringify({ integrated, resolved, changed, unchanged, rejected, rendered, interacted, referenceWords, clinicalApproval: false }));
