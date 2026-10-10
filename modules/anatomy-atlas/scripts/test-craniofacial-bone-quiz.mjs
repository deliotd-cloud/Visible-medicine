import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { contentContext } from './content-contract-tools.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';
import { build } from './workspace-test-build.mjs';
import { build as componentBuild } from './workspace-component-test-build.mjs';
import pins from '../content/craniofacial-bone-quiz-pins.json' with { type: 'json' };
import { craniofacialBoneQuizQuestions } from '../content/craniofacial-bone-quiz.ts';

const sourceOnly = process.argv.length === 3 && process.argv[2] === '--source-only';
assert(sourceOnly || process.argv.length === 2, 'Only --source-only is accepted');
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
assert.equal(pins.parentCommit, '115f02e297f1f35827daf2837792857f36946df8');
assert.equal(hash(pins), '3fba082c9180a367db2fa4738d98c85446a5f3bd3382aefe0b94e9271be11ed9');
assert.equal(pins.entries.length, 15);
assert.equal(new Set(pins.entries.map(e => e.identity.id)).size, 15);
assert.equal(new Set(pins.entries.map(e => e.identity.fmaId)).size, 15);
assert.deepEqual(new Set(pins.entries.map(e => e.group)), new Set(Object.keys(craniofacialBoneQuizQuestions)));
for (const [group, count] of [['hyoid', 1], ['inferiorConcha', 2], ['lacrimal', 2], ['maxilla', 2], ['nasal', 2], ['palatine', 2], ['zygomatic', 2], ['mandible', 1], ['vomer', 1]]) assert.equal(pins.entries.filter(e => e.group === group).length, count);
const { api, catalog } = await contentContext();
const before = await exactSourceHistoryApi(pins.parentCommit, 'display-review');
const display = api.bodyDisplayCatalog(catalog);
assert.equal(hash(display), pins.catalogHash);
assert.deepEqual(display, before.bodyDisplayCatalog(catalog));
assert.deepEqual(display.coordinateSystem, pins.coordinateSystem);
for (const name of ['structures', 'dissectionProfiles']) assert.deepEqual(api[name], before[name], `${name} unchanged`);
const targets = new Map(pins.entries.map(e => [e.identity.id, e]));
assert.deepEqual(display.structures.filter(s => targets.has(s.id)), pins.entries.map(e => e.identity));
const eligible = display.structures.filter(s => s.region === 'head-neck' && s.system === 'skeleton' && s.category === 'bone' && before.bodyLesson(s, 'quiz')?.readiness === 'generated-identification');
assert.deepEqual(eligible.map(s => s.id), pins.entries.map(e => e.identity.id));
assert.equal(pins.bundles.length, 1);
for (const bundle of pins.bundles) {
  assert.deepEqual(display.bundles.find(candidate => candidate.id === bundle.id), bundle);
  const bytes = await readFile('public' + bundle.url.split('?')[0]);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256);
}
const ttuhsc = 'https://anatomy.ttuhscep.edu/anatomytables/bones_head_neck.html';
const openstax = 'https://openstax.org/books/anatomy-and-physiology-2e/pages/7-2-the-skull';
const wordsByPage = { [ttuhsc]: 0, [openstax]: 0 }, positions = [0, 0, 0, 0];
for (const [group, q] of Object.entries(craniofacialBoneQuizQuestions)) {
  assert.equal(q.choices.length, 4, group);
  assert.equal(new Set(q.choices).size, 4, group);
  assert.equal(q.choices.filter(choice => choice === q.correctAnswer).length, 1, group);
  assert.equal(q.references.length, 1, group);
  assert(Object.hasOwn(wordsByPage, q.references[0]), group);
  positions[q.choices.indexOf(q.correctAnswer)]++;
  wordsByPage[q.references[0]] += [q.body, ...q.choices, q.explanation].join(' ').trim().split(/\s+/).length;
}
assert.equal(new Set(Object.values(craniofacialBoneQuizQuestions).map(q => q.body)).size, 9);
assert.deepEqual(positions, [3, 2, 2, 2]);
for (const [page, count] of Object.entries(wordsByPage)) assert(count < 180, `${page}: ${count} derived words`);
const built = await build({ stdin: { contents: "export {craniofacialBoneQuizLesson} from './lib/craniofacial-bone-quiz';export {parseBodyReviewResponse} from './lib/body-review-response';", resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, platform: 'node', format: 'esm' });
const { craniofacialBoneQuizLesson, parseBodyReviewResponse } = await import('data:text/javascript;base64,' + Buffer.from(built.outputFiles[0].text).toString('base64'));
let changed = 0, preserved = 0, refused = 0;
for (const structure of display.structures) for (const tab of api.contentTabs) {
  const old = before.bodyLesson(structure, tab), current = api.bodyLesson(structure, tab);
  const entry = targets.get(structure.id), draft = craniofacialBoneQuizLesson(structure, tab);
  if (entry && tab === 'quiz') {
    assert.deepEqual(structure, entry.identity);
    assert.deepEqual(old, entry.previous);
    assert.equal(old.readiness, 'generated-identification');
    assert.equal(old.correctAnswer, undefined);
    assert.equal(draft.readiness, 'draft');
    assert.deepEqual(draft.bullets, [...craniofacialBoneQuizQuestions[entry.group].choices]);
    assert.equal(draft.correctAnswer, craniofacialBoneQuizQuestions[entry.group].correctAnswer);
    assert.deepEqual(draft.citations, [...craniofacialBoneQuizQuestions[entry.group].references]);
    assert.match(draft.note, /revision-bound radiologist review pending/i);
    assert.match(draft.note, /does not validate completeness, boundaries, bone relationships, or registration/i);
    assert.match(draft.note, /patient-specific interpretation/i);
    if (!sourceOnly) {
      assert.deepEqual(current, draft, 'Actual bodyLesson must route to craniofacial bone quiz');
      const { readiness, ...shown } = draft;
      assert.deepEqual(api.bodyContent(structure, tab), shown);
    }
    changed++;
  } else {
    if (!sourceOnly) assert.deepEqual(current, old, `${structure.id}:${tab}`);
    assert.equal(draft, undefined);
    preserved++;
  }
}
assert.equal(changed, 15);
assert.equal(preserved, 9921);
for (const { identity } of pins.entries) {
  const original = structuredClone(craniofacialBoneQuizLesson(identity, 'quiz'));
  const modified = craniofacialBoneQuizLesson(identity, 'quiz');
  modified.bullets.push('foreign'); modified.citations.push('foreign');
  assert.deepEqual(craniofacialBoneQuizLesson(identity, 'quiz'), original);
  for (let index = 0; index < identity.sources.length; index++) {
    const invalid = structuredClone(identity); invalid.sources[index].sha256 = '0'.repeat(64);
    assert.equal(craniofacialBoneQuizLesson(invalid, 'quiz'), undefined);
    refused++;
  }
  for (const mutation of [
    s => { s.sources = []; }, s => { s.bundle = 'foreign'; },
    s => { s.fmaId = 'foreign'; }, s => { s.laterality = 'foreign'; },
    s => { s.id = 'foreign'; }, s => { s.system = 'foreign'; },
    s => { s.category = 'foreign'; }, s => { s.region = 'foreign'; },
    s => { s.nodeName = 'foreign'; }, s => { s.validation.anatomicalReview = true; },
    s => { s.unexpected = true; },
  ]) {
    const invalid = structuredClone(identity); mutation(invalid);
    assert.equal(craniofacialBoneQuizLesson(invalid, 'quiz'), undefined);
    refused++;
  }
  if (!sourceOnly) {
    const packet = await api.bodyReviewMaterial(identity.id);
    const oldPacket = await before.bodyReviewMaterial(identity.id);
    assert.equal(packet.approval, false);
    assert.deepEqual(packet.source, oldPacket.source);
    assert.deepEqual(packet.reasoning, oldPacket.reasoning);
    assert.deepEqual(packet.guidedTours, oldPacket.guidedTours);
    assert.notEqual(packet.fingerprints.teaching, oldPacket.fingerprints.teaching);
    assert.deepEqual(packet.topics.find(topic => topic.tab === 'quiz'), { tab: 'quiz', ...original });
    assert.deepEqual(await parseBodyReviewResponse(packet, identity.id), packet);
    assert.equal(await parseBodyReviewResponse(oldPacket, identity.id), null);
    const altered = structuredClone(packet);
    altered.topics.find(topic => topic.tab === 'quiz').correctAnswer = 'foreign';
    assert.equal(await parseBodyReviewResponse(altered, identity.id), null);
    const sourceAltered = structuredClone(packet);
    sourceAltered.source.structure.sources.at(-1).sha256 = '0'.repeat(64);
    assert.equal(await parseBodyReviewResponse(sourceAltered, identity.id), null);
  }
}
const require = createRequire(import.meta.url), React = require('react');
const render = require('react-dom/server').renderToStaticMarkup;
const component = await componentBuild({ stdin: { contents: "export {StructureQuickCheck} from './app/structure-quick-check';export {QuizNotes,AtlasWorkspace} from './app/atlas-workspace';", resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, platform: 'node', format: 'cjs', write: false });
let states = [], refs = [], cursor = 0, refCursor = 0, active = false;
const focus = { target: null };
const shim = { ...React,
  useContext: () => ({ exam: false }),
  useId: () => active ? 'craniofacial-bone-check' : React.useId(),
  useState(initial) { if (!active) return React.useState(initial); const index = cursor++; if (!(index in states)) states[index] = initial; return [states[index], value => { states[index] = value; }]; },
  useRef(initial) { if (!active) return React.useRef(initial); const index = refCursor++; return refs[index] ?? (refs[index] = { current: initial }); },
};
const load = react => {
  const scope = { exports: {} };
  runInNewContext(component.outputFiles[0].text, { module: scope, exports: scope.exports, structuredClone, require: id => id === 'react' ? react : id === 'next/link' ? () => { throw Error('Unrelated Next Link must not render'); } : require(id), console });
  return scope.exports;
};
const actual = load(React), events = load(shim);
const walk = (node, found = []) => { if (React.isValidElement(node)) { found.push(node); React.Children.forEach(node.props.children, child => walk(child, found)); } return found; };
const nodeText = node => typeof node === 'string' ? node : !node ? '' : Array.isArray(node) ? node.map(nodeText).join('') : nodeText(node.props?.children);
let interacted = 0;
for (const [group, q] of Object.entries(craniofacialBoneQuizQuestions)) {
  const identity = pins.entries.find(entry => entry.group === group).identity;
  const props = { question: q.body, choices: [...q.choices], correctAnswer: q.correctAnswer, explanation: q.explanation };
  const html = render(React.createElement(actual.StructureQuickCheck, props));
  assert.equal((html.match(/type="radio"/g) || []).length, 4);
  assert.match(html, /<button[^>]*disabled=""[^>]*>Check answer/);
  assert(!html.includes('Correct answer:'));
  assert(!html.includes(q.explanation));
  if (!sourceOnly) {
    states = []; refs = []; cursor = 0; refCursor = 0; active = true;
    let note = events.QuizNotes({ structure: identity }); active = false;
    assert.equal(note.type, 'details');
    note.props.onToggle({ currentTarget: { open: true } });
    cursor = 0; refCursor = 0; active = true; note = events.QuizNotes({ structure: identity }); active = false;
    const lazy = walk(note).find(node => typeof node.type === 'function' && node.type.name === 'LazyBodyTeaching');
    assert(lazy.props.enabled);
    const loaded = lazy.props.children({ bodyContent: api.bodyContent });
    const quiz = walk(loaded).find(node => typeof node.type === 'function' && node.type.name === 'StructureQuickCheck');
    assert.deepEqual(JSON.parse(JSON.stringify(quiz.props)), props);
    assert.deepEqual(walk(loaded).filter(node => node.type === 'a').map(node => node.props.href), q.references);
    const exam = render(React.createElement(actual.AtlasWorkspace, { exam: true }, React.createElement(actual.QuizNotes, { structure: identity })));
    assert(!exam.includes('atlas-quiz-notes')); assert(!exam.includes('type="radio"'));
  }
  const attempt = events.StructureQuickCheck(props);
  states = []; refs = [];
  let tree;
  const redraw = () => {
    cursor = 0; refCursor = 0; active = true; tree = attempt.type(attempt.props); active = false;
    for (const node of walk(tree)) if (node.props.ref) node.props.ref.current = { focus(options) { assert.equal(options.preventScroll, true); focus.target = node.type === 'input' ? 'first-radio' : 'feedback'; } };
  };
  const radios = () => walk(tree).filter(node => node.type === 'input');
  const button = label => walk(tree).find(node => node.type === 'button' && nodeText(node) === label);
  const answer = index => { radios()[index].props.onChange(); redraw(); button('Check answer').props.onClick(); redraw(); };
  redraw(); assert.equal(button('Check answer').props.disabled, true);
  const correct = props.choices.indexOf(props.correctAnswer);
  answer(correct); assert(nodeText(tree).includes('Correct. Correct answer: ' + props.correctAnswer), group);
  assert(nodeText(tree).includes(props.explanation), group); assert.equal(focus.target, 'feedback');
  button('Practise again').props.onClick(); redraw();
  assert.equal(focus.target, 'first-radio'); assert(radios().every(node => !node.props.checked));
  assert.equal(button('Check answer').props.disabled, true);
  answer((correct + 1) % 4); assert(nodeText(tree).includes('Incorrect. Correct answer: ' + props.correctAnswer), group);
  assert.equal(focus.target, 'feedback');
  button('Try again').props.onClick(); redraw();
  assert.equal(focus.target, 'first-radio'); assert(radios().every(node => !node.props.checked));
  assert.equal(button('Check answer').props.disabled, true);
  interacted++;
}
assert.equal(interacted, 9);
console.log(JSON.stringify({ passed: true, sourceOnly, changed, preserved, sourceRefusals: refused, interacted, positions, wordsByPage, pinsHash: hash(pins), clinicalApproval: false }));
