import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { contentContext, contentValidator, recordKey } from './content-contract-tools.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';
import { build as componentBuild } from './workspace-component-test-build.mjs';
import { build } from './workspace-test-build.mjs';
import pins from '../content/tongue-palate-quiz-pins.json' with { type: 'json' };
import { tonguePalateQuizQuestions } from '../content/tongue-palate-quiz.ts';

const sha256 = value => createHash('sha256').update(value).digest('hex');
const canonical = value => Array.isArray(value)
  ? `[${value.map(canonical).join(',')}]`
  : value && typeof value === 'object'
    ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`
    : JSON.stringify(value);
const snapshot = (api, display) => ({
  body: display.structures.map(structure => ({
    id: structure.id,
    sections: Object.fromEntries(api.contentTabs.map(tab => [tab, api.bodyLesson(structure, tab)])),
  })),
  shoulder: api.structures,
  recipes: api.dissectionProfiles,
});
const leaves = (value, path = []) => value === null || typeof value !== 'object'
  ? [path]
  : Object.entries(value).flatMap(([key, child]) => leaves(child, [...path, key]));
const mutateLeaf = (value, path) => {
  const clone = structuredClone(value);
  let parent = clone;
  for (const key of path.slice(0, -1)) parent = parent[key];
  const key = path.at(-1), old = parent[key];
  parent[key] = typeof old === 'number' ? old + 0.01
    : typeof old === 'boolean' ? !old : String(old) + '-foreign';
  return clone;
};

assert.equal(pins.parentCommit, 'a2475a37201bdd5fdd12f5849fc8ee043412d02f');
assert.equal(sha256(await readFile(new URL('../content/tongue-palate-quiz-pins.json', import.meta.url))),
  '150fae10b5b29dd10659040a820de8ff0a9eeccd7012406b2d0ed0bd9200ab32');
assert.equal(pins.entries.length, 8);
assert.deepEqual([...new Set(pins.entries.map(entry => entry.group))].sort(),
  ['genioglossus', 'hyoglossus', 'levator', 'tensor']);
assert.equal(new Set(pins.entries.map(entry => entry.identity.id)).size, 8);
assert.deepEqual(Object.keys(tonguePalateQuizQuestions).sort(),
  ['genioglossus', 'hyoglossus', 'levator', 'tensor']);

const { api, catalog, registry } = await contentContext();
const display = api.bodyDisplayCatalog(catalog);
const parent = await exactSourceHistoryApi(pins.parentCommit, 'display-content');
const built = await build({
  stdin: {
    contents: "export {tonguePalateQuizLesson} from './lib/tongue-palate-quiz';",
    resolveDir: process.cwd(), loader: 'ts',
  },
  bundle: true, write: false, platform: 'node', format: 'esm',
});
const { tonguePalateQuizLesson } = await import('data:text/javascript;base64,' +
  Buffer.from(built.outputFiles[0].text).toString('base64'));

assert.deepEqual(display, parent.bodyDisplayCatalog(catalog));
assert.deepEqual(display.coordinateSystem, pins.coordinateSystem);
assert.equal(display.sourceVersion, pins.sourceVersion);
assert.equal(display.structures.length, 1104);
assert.equal(api.contentTabs.length, 9);
assert.equal(sha256(JSON.stringify(snapshot(parent, display))), pins.previousAllLessonsAndRecipesSha256);
assert.deepEqual(api.structures, parent.structures);
assert.deepEqual(api.dissectionProfiles, parent.dissectionProfiles);
for (const bundle of pins.bundles) {
  assert.deepEqual(display.bundles.find(candidate => candidate.id === bundle.id), bundle);
  const bytes = await readFile('public' + bundle.url.split('?')[0]);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(sha256(bytes), bundle.sha256);
}

const targets = new Map(pins.entries.map(entry => [entry.identity.id, entry]));
const records = new Map(api.bodyContentRecords(display).map(record => [record.id, record]));
const trusted = new Map(registry);
for (const record of parent.bodyContentRecords(parent.bodyDisplayCatalog(catalog)))
  trusted.set(recordKey(record), record);
const validate = await contentValidator(trusted);
let unchanged = 0, changed = 0, rejected = 0;
let bindingRejected = 0;
const byGroup = new Map();
for (const structure of display.structures) for (const tab of api.contentTabs) {
  const entry = targets.get(structure.id);
  const before = parent.bodyLesson(structure, tab);
  const actual = api.bodyLesson(structure, tab);
  const direct = tonguePalateQuizLesson(structure, tab);
  if (!entry || tab !== 'quiz') {
    assert.equal(direct, undefined, `${structure.id}|${tab}`);
    assert.deepEqual(actual, before, `${structure.id}|${tab}`);
    unchanged++;
    continue;
  }
  assert.deepEqual(structure, entry.identity);
  assert.deepEqual(before, entry.previous);
  assert.equal(before.readiness, 'generated-identification');
  assert.equal(before.correctAnswer, undefined);
  assert(direct);
  assert.deepEqual(actual, direct);
  assert.notDeepEqual(actual, before);
  assert.equal(direct.readiness, 'draft');
  assert.equal(direct.bullets.length, 4);
  assert(direct.bullets.every(choice => typeof choice === 'string' && choice.trim()));
  assert.equal(new Set(direct.bullets.map(choice => choice.trim())).size, 4);
  assert.equal(direct.bullets.filter(choice => choice === direct.correctAnswer).length, 1);
  assert(direct.explanation?.trim());
  assert(direct.body?.trim());
  assert.deepEqual(direct.citations, [tonguePalateQuizQuestions[entry.group].reference]);
  assert.match(direct.note, /Radiologist review pending/i);
  assert.match(direct.note, /independent/i);
  const record = records.get(structure.id);
  assert(record);
  assert(validate(record));
  assert.deepEqual(record.content.quiz, direct);
  assert.equal(record.validation.clinicalApproval, 'not-included');
  assert.deepEqual(record.validation.materialRevisions, { geometry: null, teaching: null, imaging: null });
  for (const mutate of [
    binding => { binding.nodeName += '-foreign'; },
    binding => { binding.assetSha256 = '0'.repeat(64); },
    binding => { binding.sources[0].sha256 = '0'.repeat(64); },
    binding => { binding.sources[0].file += '-foreign'; },
    binding => { binding.sources = []; },
  ]) {
    const bad = structuredClone(record);
    mutate(bad.meshBindings[0]);
    assert.throws(() => validate(bad)); bindingRejected++;
  }
  const missingBinding = structuredClone(record);
  missingBinding.meshBindings = [];
  assert.throws(() => validate(missingBinding)); bindingRejected++;
  const duplicatedBinding = structuredClone(record);
  duplicatedBinding.meshBindings.push(structuredClone(record.meshBindings[0]));
  assert.throws(() => validate(duplicatedBinding)); bindingRejected++;
  assert.deepEqual({
    body: direct.body, bullets: direct.bullets, correctAnswer: direct.correctAnswer,
    explanation: direct.explanation, citations: direct.citations,
  }, {
    body: tonguePalateQuizQuestions[entry.group].body,
    bullets: tonguePalateQuizQuestions[entry.group].choices,
    correctAnswer: tonguePalateQuizQuestions[entry.group].correctAnswer,
    explanation: tonguePalateQuizQuestions[entry.group].explanation,
    citations: [tonguePalateQuizQuestions[entry.group].reference],
  });
  const principle = { body: direct.body, bullets: direct.bullets, correctAnswer: direct.correctAnswer, explanation: direct.explanation };
  if (byGroup.has(entry.group)) assert.deepEqual(principle, byGroup.get(entry.group));
  else byGroup.set(entry.group, structuredClone(principle));
  const packet = await api.bodyReviewMaterial(structure.id);
  assert.equal(packet.approval, false);
  assert.equal(packet.status, 'worksheet-not-submitted');
  assert.deepEqual(packet.topics.find(topic => topic.tab === 'quiz'), { tab: 'quiz', ...direct });
  const scope = { schema: 'vm-body-review-worksheet-2', kind: 'body-display-catalog', structureId: structure.id };
  const teaching = topics => sha256(canonical({ scope, topics, reasoning: packet.reasoning,
    ...(packet.guidedTours.length ? { guidedTours: packet.guidedTours } : {}) }));
  assert.equal(packet.fingerprints.teaching, teaching(packet.topics));
  const oldTopics = structuredClone(packet.topics);
  const quizIndex = oldTopics.findIndex(topic => topic.tab === 'quiz');
  assert(quizIndex >= 0);
  oldTopics[quizIndex] = { tab: 'quiz', ...before };
  assert.notEqual(packet.fingerprints.teaching, teaching(oldTopics));
  const fresh = tonguePalateQuizLesson(structure, 'quiz');
  assert.notStrictEqual(direct.bullets, fresh.bullets);
  const original = structuredClone(direct);
  direct.bullets.push('foreign'); direct.citations.length = 0;
  assert.deepEqual(tonguePalateQuizLesson(structure, 'quiz'), original);
  changed++;
}
assert.equal(changed, 8);
assert.equal(unchanged, 9928);
assert.equal(byGroup.size, 4);
assert.deepEqual(Object.values(tonguePalateQuizQuestions).map(question =>
  question.choices.indexOf(question.correctAnswer)), [0, 1, 2, 3]);
const placedWords = pins.entries.flatMap(entry => {
  const question = tonguePalateQuizQuestions[entry.group];
  return [question.body, ...question.choices, question.correctAnswer, question.explanation];
}).join(' ').split(/\s+/).length;
assert(placedWords <= 200, `Keep this factual reference synthesis bounded: ${placedWords}`);

for (const { identity } of pins.entries) {
  for (const tab of api.contentTabs.filter(tab => tab !== 'quiz')) {
    assert.equal(tonguePalateQuizLesson(identity, tab), undefined); rejected++;
  }
  for (const path of leaves(identity)) {
    assert.equal(tonguePalateQuizLesson(mutateLeaf(identity, path), 'quiz'), undefined,
      `${identity.id} ${path.join('.')}`);
    rejected++;
  }
  assert.equal(tonguePalateQuizLesson({ ...identity, extra: true }, 'quiz'), undefined); rejected++;
  const missing = structuredClone(identity); delete missing.coverageNote;
  assert.equal(tonguePalateQuizLesson(missing, 'quiz'), undefined); rejected++;
}
assert.equal(tonguePalateQuizLesson({ ...pins.entries[0].identity, id: 'unknown' }, 'quiz'), undefined);
const unrelated = display.structures.find(structure => !targets.has(structure.id));
assert(unrelated);
assert.equal(tonguePalateQuizLesson(unrelated, 'quiz'), undefined);

// Render the shipped lesson path and drive the quick-check's real event handlers.
const require = createRequire(import.meta.url);
const React = require('react');
const render = require('react-dom/server').renderToStaticMarkup;
const component = await componentBuild({
  stdin: {
    contents: "export {StructureQuickCheck} from './app/structure-quick-check'; export {QuizNotes,AtlasWorkspace} from './app/atlas-workspace';",
    resolveDir: process.cwd(), loader: 'tsx',
  },
  bundle: true, platform: 'node', format: 'cjs', write: false,
});
const load = react => {
  const scope = { exports: {} };
  runInNewContext(component.outputFiles[0].text, {
    module: scope, exports: scope.exports,
    require: id => id === 'react' ? react
      : id === 'next/link' ? () => { throw Error('Unrelated Next Link must not render'); }
        : require(id),
    console, structuredClone,
  });
  return scope.exports;
};
const actualComponent = load(React);
const escaped = value => render(React.createElement('span', null, value)).slice(6, -7);
let states = [], refs = [], cursor = 0, refCursor = 0, active = false;
const focus = { target: null };
const shim = {
  ...React,
  useContext: () => ({ exam: false }),
  useId: () => active ? 'tongue-palate-check' : React.useId(),
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
const events = load(shim);
function walk(node, found = []) {
  if (React.isValidElement(node)) {
    found.push(node);
    React.Children.forEach(node.props.children, child => walk(child, found));
  }
  return found;
}
const nodeText = node => typeof node === 'string' ? node
  : !node ? '' : Array.isArray(node) ? node.map(nodeText).join('') : nodeText(node.props?.children);
const keys = new Set();
let rendered = 0, interacted = 0, examGuarded = 0;
for (const { identity } of pins.entries) {
  const lesson = tonguePalateQuizLesson(identity, 'quiz');
  const props = {
    question: lesson.body, choices: lesson.bullets,
    correctAnswer: lesson.correctAnswer, explanation: lesson.explanation,
  };
  const directHtml = render(React.createElement(actualComponent.StructureQuickCheck, props));
  assert.equal((directHtml.match(/type="radio"/g) || []).length, 4);
  assert(directHtml.includes('<fieldset'));
  assert.match(directHtml, /<button[^>]*disabled=""[^>]*>Check answer/);
  assert(!directHtml.includes('Correct answer:'));
  assert(!directHtml.includes(escaped(lesson.explanation)));
  assert(directHtml.includes(escaped(lesson.body)));
  for (const choice of lesson.bullets) assert(directHtml.includes(escaped(choice)));

  const attempt = events.StructureQuickCheck(props);
  assert.equal(attempt.key, JSON.stringify(props));
  keys.add(attempt.key);
  assert.notEqual(events.StructureQuickCheck({ ...props, explanation: props.explanation + ' revised' }).key, attempt.key);
  assert.notEqual(events.StructureQuickCheck({ ...props, question: props.question + ' revised' }).key, attempt.key);

  states = []; refs = []; cursor = 0; active = true;
  let note = events.QuizNotes({ structure: identity }); active = false;
  assert.equal(note.type, 'details');
  assert.equal(walk(note).find(node => typeof node.type === 'function' && node.type.name === 'LazyBodyTeaching').props.enabled, false);
  note.props.onToggle({ currentTarget: { open: true } });
  cursor = 0; active = true; note = events.QuizNotes({ structure: identity }); active = false;
  const lazy = walk(note).find(node => typeof node.type === 'function' && node.type.name === 'LazyBodyTeaching');
  assert(lazy.props.enabled);
  const loaded = lazy.props.children({ bodyContent: api.bodyContent });
  const child = walk(loaded).find(node => typeof node.type === 'function' && node.type.name === 'StructureQuickCheck');
  assert(child);
  assert.equal(child.key, identity.id);
  assert.deepEqual(JSON.parse(JSON.stringify(child.props)), props);
  assert.deepEqual(walk(loaded).filter(node => node.type === 'a').map(node => node.props.href), lesson.citations);
  const notesHtml = render(React.createElement(actualComponent.AtlasWorkspace, { exam: false },
    React.createElement(actualComponent.QuizNotes, { structure: identity })));
  assert(notesHtml.includes('atlas-quiz-notes'));
  assert(!notesHtml.includes('type="radio"'));
  const examHtml = render(React.createElement(actualComponent.AtlasWorkspace, { exam: true },
    React.createElement(actualComponent.QuizNotes, { structure: identity })));
  assert(!examHtml.includes('atlas-quiz-notes'));
  assert(!examHtml.includes('type="radio"'));
  assert(!examHtml.includes(escaped(lesson.body)));
  assert(!examHtml.includes(escaped(lesson.correctAnswer)));
  assert(!examHtml.includes(escaped(lesson.explanation)));
  rendered++; examGuarded++;

  states = []; refs = []; let tree;
  const redraw = () => {
    cursor = 0; refCursor = 0; active = true;
    tree = attempt.type(attempt.props);
    active = false;
    for (const node of walk(tree)) if (node.props.ref) node.props.ref.current = {
      focus(options) {
        assert.equal(options.preventScroll, true);
        focus.target = node.type === 'input' ? 'first-radio' : 'feedback';
      },
    };
  };
  const radios = () => walk(tree).filter(node => node.type === 'input');
  const button = label => walk(tree).find(node => node.type === 'button' && nodeText(node) === label);
  const answer = index => {
    radios()[index].props.onChange(); redraw();
    button('Check answer').props.onClick(); redraw();
  };
  redraw();
  assert.equal(button('Check answer').props.disabled, true);
  assert(radios().every(node => !node.props.checked));
  assert(!nodeText(tree).includes('Correct answer:'));
  const correct = props.choices.indexOf(props.correctAnswer);
  answer(correct);
  assert(nodeText(tree).includes('Correct. Correct answer: ' + props.correctAnswer));
  assert(nodeText(tree).includes(props.explanation));
  assert.equal(focus.target, 'feedback');
  button('Practise again').props.onClick(); redraw();
  assert.equal(focus.target, 'first-radio');
  assert(radios().every(node => !node.props.checked));
  answer((correct + 1) % 4);
  assert(nodeText(tree).includes('Incorrect. Correct answer: ' + props.correctAnswer));
  assert(nodeText(tree).includes(props.explanation));
  button('Try again').props.onClick(); redraw();
  assert.equal(focus.target, 'first-radio');
  assert(radios().every(node => !node.props.checked));
  answer((correct + 1) % 4);
  radios()[correct].props.onChange(); redraw();
  assert(!nodeText(tree).includes('Correct answer:'));
  assert(!nodeText(tree).includes(props.explanation));
  interacted++;
}
assert.equal(keys.size, 4);
assert.equal(rendered, 8);
assert.equal(interacted, 8);
assert.equal(examGuarded, 8);
console.log(JSON.stringify({ changed, unchanged, rejected, groups: [...byGroup.keys()],
  bindingRejected, rendered, interacted, examGuarded, clinicalApproval: false }));
