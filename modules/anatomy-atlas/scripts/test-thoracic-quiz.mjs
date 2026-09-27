import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { contentContext, contentValidator } from './content-contract-tools.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';
import { build as componentBuild } from './workspace-component-test-build.mjs';
import { build } from './workspace-test-build.mjs';
import pins from '../content/thoracic-quiz-pins.json' with { type: 'json' };
import { thoracicQuizGroups, thoracicQuizQuestions } from '../content/thoracic-quiz.ts';

const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const snapshot = (api, display) => ({ body: display.structures.map(s => ({ id: s.id, sections: Object.fromEntries(api.contentTabs.map(t => [t, api.bodyLesson(s, t)])) })), shoulder: api.structures, recipes: api.dissectionProfiles });

const { api, catalog, registry } = await contentContext();
const display = api.bodyDisplayCatalog(catalog), parent = await exactSourceHistoryApi(pins.parentCommit);
const built = await build({ stdin: { contents: "export {thoracicQuizLesson} from './lib/thoracic-quiz';", resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, platform: 'node', format: 'esm' });
const { thoracicQuizLesson } = await import('data:text/javascript;base64,' + Buffer.from(built.outputFiles[0].text).toString('base64'));
assert.equal(pins.parentCommit, '0c319d5ed92cfae5eb95a5486bfe312a3a63fed6');
assert.equal(hash(pins), '1efb766a72f1484aaa2b403c0a7d8f25382d5d2f45cd0ecbfb6eab5848e344aa');
assert.deepEqual(display, parent.bodyDisplayCatalog(catalog));
assert.deepEqual(display.coordinateSystem, pins.coordinateSystem);
assert.equal(hash(snapshot(parent, display)), pins.previousAllLessonsAndRecipesHash);
assert.deepEqual(api.structures, parent.structures); assert.deepEqual(api.dissectionProfiles, parent.dissectionProfiles);
assert.deepEqual(pins.entries.map(e => e.identity.fmaId), Object.values(thoracicQuizGroups).flat());
for (const bundle of pins.bundles) {
  assert.deepEqual(display.bundles.find(b => b.id === bundle.id), bundle);
  const bytes = await readFile('public' + bundle.url.split('?')[0]);
  assert.equal(bytes.length, bundle.bytes); assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256);
}
const targets = new Map(pins.entries.map(e => [e.identity.id, e]));
const records = api.bodyContentRecords(display), validate = await contentValidator(registry);
let changed = 0, unchanged = 0, rejected = 0;
const entries = [];
for (const s of display.structures) for (const tab of api.contentTabs) {
  const before = parent.bodyLesson(s, tab), now = api.bodyLesson(s, tab), target = targets.get(s.id);
  if (!target || tab !== 'quiz') {
    assert.deepEqual(now, before, s.id + '|' + tab); assert.equal(thoracicQuizLesson(s, tab), undefined); unchanged++; continue;
  }
  assert.deepEqual(s, target.identity); assert.deepEqual(target.topics, ['quiz']);
  assert.deepEqual(before, target.previous.quiz); assert.notDeepEqual(now, before);
  assert.deepEqual(now, thoracicQuizLesson(s, tab)); assert.equal(now.readiness, 'draft');
  assert.equal(now.bullets.length, 4); assert.equal(new Set(now.bullets).size, 4);
  assert.equal(now.bullets.filter(c => c === now.correctAnswer).length, 1); assert(now.explanation.trim());
  assert.match(now.note, /Radiologist review pending/); assert.match(now.note, /surfaces do not demonstrate lumen, patency or physiological displacement/);
  assert.deepEqual(now.citations, [thoracicQuizQuestions[target.group].reference]);
  const { readiness: _readiness, ...shown } = now; assert.deepEqual(api.bodyContent(s, tab), shown);
  const record = records.find(r => r.id === s.id); assert(validate(record)); assert.deepEqual(record.content.quiz, now);
  assert.equal(record.validation.clinicalApproval, 'not-included');
  const packet = await api.bodyReviewMaterial(s.id); assert.equal(packet.approval, false);
  const { tab: _tab, ...topic } = packet.topics.find(t => t.tab === 'quiz'); assert.deepEqual(topic, now);
  const copy = structuredClone(now); now.bullets.push('foreign'); now.citations.length = 0;
  assert.deepEqual(thoracicQuizLesson(s, tab), copy);
  entries.push({ id: s.id, tab, previousHash: hash(before), currentHash: hash(copy) }); changed++;
}
assert.equal(changed, 7); assert.equal(unchanged, 9929);
const leaves = (v, path = []) => v === null || typeof v !== 'object' ? [path] : Object.entries(v).flatMap(([k, c]) => leaves(c, [...path, k]));
for (const { identity } of pins.entries) for (const path of leaves(identity)) {
  const bad = structuredClone(identity); let obj = bad;
  for (const key of path.slice(0, -1)) obj = obj[key];
  const key = path.at(-1), old = obj[key]; obj[key] = typeof old === 'number' ? old + .01 : typeof old === 'boolean' ? !old : String(old) + '-foreign';
  assert.equal(thoracicQuizLesson(bad, 'quiz'), undefined); rejected++;
}
assert.equal(thoracicQuizLesson({ ...pins.entries[0].identity, id: 'unknown' }, 'quiz'), undefined);
for (const { identity } of pins.entries) {
  assert.equal(thoracicQuizLesson({ ...identity, unexpectedSourceField: true }, 'quiz'), undefined); rejected++;
  const missing = structuredClone(identity); assert(Object.hasOwn(missing, 'coverageNote'));
  delete missing.coverageNote; assert.equal(thoracicQuizLesson(missing, 'quiz'), undefined); rejected++;
}
const words = groups => groups.map(g => { const q = thoracicQuizQuestions[g]; return [q.body, ...q.choices, q.correctAnswer, q.explanation].join(' '); }).join(' ').split(/\s+/).length;
assert(words(['rightLung', 'leftLung', 'rightMainBronchus', 'leftMainBronchus']) <= 195); assert(words(['trachea', 'rightPulmonaryArtery', 'leftPulmonaryArtery']) <= 195);
assert.deepEqual(Object.values(thoracicQuizQuestions).map(q => q.choices.indexOf(q.correctAnswer)), [0, 1, 2, 3, 0, 1, 2]);

// Actual QuizNotes, workspace provider and native radio controls. Next Link is
// unavailable in this Vite checkout and must never render in this narrow harness.
const require = createRequire(import.meta.url), React = require('react'), render = require('react-dom/server').renderToStaticMarkup;
const component = await componentBuild({ stdin: { contents: "export {QuizNotes,AtlasWorkspace} from './app/atlas-workspace';", resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, platform: 'node', format: 'cjs', write: false });
const scope = { exports: {} }; runInNewContext(component.outputFiles[0].text, { module: scope, exports: scope.exports,
  require: id => id === 'next/link' ? () => { throw Error('Unrelated Next Link must not render'); } : require(id), console });
const escaped = value => render(React.createElement('span', null, value)).slice(6, -7);
let rendered = 0;
for (const { identity } of pins.entries) {
  const question = api.bodyLesson(identity, 'quiz');
  const html = render(React.createElement(scope.exports.AtlasWorkspace, { exam: false }, React.createElement(scope.exports.QuizNotes, { structure: identity })));
  assert.equal((html.match(/type="radio"/g) || []).length, 4); assert(html.includes('<fieldset'));
  assert.match(html, /<button[^>]*disabled=""[^>]*>Check answer/);
  assert(!html.includes('Correct answer:')); assert(!html.includes(escaped(question.explanation)));
  assert(html.includes(escaped(question.body))); assert(html.includes(question.citations[0]));
  for (const choice of question.bullets) assert(html.includes(escaped(choice)));
  const examHtml = render(React.createElement(scope.exports.AtlasWorkspace, { exam: true }, React.createElement(scope.exports.QuizNotes, { structure: identity })));
  assert(!examHtml.includes('type="radio"')); assert(!examHtml.includes(escaped(question.body))); assert(!examHtml.includes(question.citations[0])); rendered++;
}
// Exercise the actual QuizNotes child with the existing component event harness.
let states = [], refs = [], cursor = 0, refCursor = 0, active = false;
const focus = { target: null };
const shim = { ...React, useContext: () => ({ exam: false }),
  useId: () => active ? 'thoracic-check' : React.useId(),
  useState(initial) {
    if (!active) return React.useState(initial);
    const index = cursor++;
    if (!(index in states)) states[index] = initial;
    return [states[index], value => { states[index] = value; }];
  },
  useRef(initial) {
    if (!active) return React.useRef(initial);
    const index = refCursor++;
    return refs[index] ?? (refs[index] = { current: initial });
  },
};
const eventScope = { exports: {} };
runInNewContext(component.outputFiles[0].text, { module: eventScope, exports: eventScope.exports,
  require: id => id === 'react' ? shim : id === 'next/link' ? () => { throw Error('Unrelated Next Link must not render'); } : require(id), console });
function walk(node, found = []) {
  if (React.isValidElement(node)) {
    found.push(node); React.Children.forEach(node.props.children, child => walk(child, found));
  }
  return found;
}
const nodeText = node => typeof node === 'string' ? node : !node ? ''
  : Array.isArray(node) ? node.map(nodeText).join('') : nodeText(node.props?.children);
let interacted = 0;
for (const { identity } of pins.entries) {
  const lesson = api.bodyLesson(identity, 'quiz');
  const child = walk(eventScope.exports.QuizNotes({ structure: identity })).find(node => typeof node.type === 'function' && node.type.name === 'StructureQuickCheck');
  assert(child); assert.equal(child.key, identity.id);
  assert.equal(child.props.correctAnswer, lesson.correctAnswer); assert.equal(child.props.explanation, lesson.explanation);
  const attempt = child.type(child.props); states = []; refs = [];
  let tree;
  const redraw = () => {
    cursor = 0; refCursor = 0; active = true;
    tree = attempt.type(attempt.props); active = false;
    for (const node of walk(tree)) if (node.props.ref) node.props.ref.current = { focus(options) {
      assert.equal(options.preventScroll, true); focus.target = node.type === 'input' ? 'first-radio' : 'feedback';
    } };
  };
  const radios = () => walk(tree).filter(node => node.type === 'input');
  const button = label => walk(tree).find(node => node.type === 'button' && nodeText(node) === label);
  const answer = index => { radios()[index].props.onChange(); redraw(); button('Check answer').props.onClick(); redraw(); };
  redraw(); assert.equal(button('Check answer').props.disabled, true);
  const correct = lesson.bullets.indexOf(lesson.correctAnswer);
  answer(correct); assert(nodeText(tree).includes('Correct. Correct answer: ' + lesson.correctAnswer));
  assert(nodeText(tree).includes(lesson.explanation)); assert.equal(focus.target, 'feedback');
  button('Try again').props.onClick(); redraw(); assert.equal(focus.target, 'first-radio');
  assert(radios().every(node => !node.props.checked)); assert.equal(button('Try again'), undefined);
  answer((correct + 1) % 4); assert(nodeText(tree).includes('Incorrect. Correct answer: ' + lesson.correctAnswer));
  assert(nodeText(tree).includes(lesson.explanation));
  radios()[correct].props.onChange(); redraw(); assert(!nodeText(tree).includes('Correct answer:'));
  assert(!nodeText(tree).includes(lesson.explanation)); interacted++;
}
assert.equal(interacted, 7);
const transition = { parentCommit: pins.parentCommit, pinsHash: hash(pins), previousAllLessonsAndRecipesHash: pins.previousAllLessonsAndRecipesHash,
  currentAllLessonsAndRecipesHash: hash(snapshot(api, display)), entries };
if (process.argv.includes('--record')) await writeFile('content/thoracic-quiz-transition.json', JSON.stringify(transition, null, 2) + '\n', { flag: 'wx' });
else assert.deepEqual(JSON.parse(await readFile('content/thoracic-quiz-transition.json')), transition);
console.log(JSON.stringify({ changed, unchanged, rejected, rendered, interacted, visceraWords: words(['rightLung', 'leftLung', 'rightMainBronchus', 'leftMainBronchus']), mediastinumWords: words(['trachea', 'rightPulmonaryArtery', 'leftPulmonaryArtery']), transitionHash: hash(transition), clinicalApproval: false }));
