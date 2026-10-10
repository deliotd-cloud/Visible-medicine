import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { contentContext } from './content-contract-tools.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';
import { build } from './workspace-test-build.mjs';
import { build as componentBuild } from './workspace-component-test-build.mjs';
import pins from '../content/thigh-deep-muscle-quiz-pins.json' with { type: 'json' };
import { thighDeepMuscleQuizQuestions } from '../content/thigh-deep-muscle-quiz.ts';

assert.equal(process.argv.length, 2, 'No test-mode arguments are accepted');
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
assert.equal(pins.parentCommit, '5363ae64e06cb5629a36469c7d15fddbcfff32b4');
assert.equal(hash(pins), '3c72afab9ea606bf5743e9d1ab5210daed59b6a7790187f9642142564cdef392');
const { api, catalog } = await contentContext();
const before = await exactSourceHistoryApi(pins.parentCommit, 'display-review');
// Preserve this completed transition; the suprascapular CT suite checks all
// current placements against this exact, previously verified source epoch.
const completed = await exactSourceHistoryApi('65f1a9e3e67de052a6a2faa96b606b5be251e7b7', 'display-review');
const display = api.bodyDisplayCatalog(catalog);
assert.equal(hash(display), pins.catalogHash);
assert.deepEqual(display, before.bodyDisplayCatalog(catalog));
assert.deepEqual(display.coordinateSystem, pins.coordinateSystem);
for (const name of ['structures', 'dissectionProfiles']) assert.deepEqual(api[name], before[name], `${name} unchanged`);
const counts = {"brevis":2,"longus":2,"magnus":2,"minimus":2,"inferior":2,"superior":2,"gracilis":2,"iliacus":2,"externus":2,"internus":2,"pectineus":2,"piriformis":2,"quadratus":2,"sartorius":2,"tensor":2};
assert.equal(pins.entries.length, 30);
assert.equal(new Set(pins.entries.map(e => e.identity.id)).size, 30);
assert.deepEqual(Object.keys(thighDeepMuscleQuizQuestions).sort(), Object.keys(counts).sort());
assert.deepEqual(Object.fromEntries(Object.keys(counts).map(group => [group, pins.entries.filter(e => e.group === group).length])), counts);
const eligible = display.structures.filter(s => s.region === 'thigh' && s.system === 'muscles' && before.bodyLesson(s, 'quiz')?.readiness === 'generated-identification');
assert.deepEqual(pins.entries.map(e => e.identity.id).sort(), eligible.map(s => s.id).sort());

const references = new Set(['https://anatomy.ttuhscep.edu/anatomytables/muscles_lowerlimb.html','https://anatomy.ttuhscep.edu/schemes/gluteal_tables.html','https://anatomy.ttuhscep.edu/modules/lower_limb_module/lower_limb_03.html','https://anatomy.ttuhscep.edu/musculoskeletal_system/gluteal.html','https://anatomy.ttuhscep.edu/musculoskeletal_system/thigh.html']);
const wordsByPage = {}, positions = [0, 0, 0, 0];
for (const [group, q] of Object.entries(thighDeepMuscleQuizQuestions)) {
  assert.equal(q.choices.length, 4, group);
  assert.equal(new Set(q.choices).size, 4, group);
  assert.equal(q.choices.filter(choice => choice === q.correctAnswer).length, 1, group);
  positions[q.choices.indexOf(q.correctAnswer)]++;
  assert.equal(q.references.length, 1, group);
  assert(references.has(q.references[0]), group);
  wordsByPage[q.references[0]] = (wordsByPage[q.references[0]] ?? 0) + [q.body, ...q.choices, q.explanation].join(' ').trim().split(/\s+/).length;
}
assert(positions.every(count => count >= 3 && count <= 4), `Unbalanced answer positions: ${positions}`);
for (const [page, words] of Object.entries(wordsByPage)) assert(words <= 200, `${page}: ${words} derived words`);
for (const bundle of pins.bundles) {
  assert.deepEqual(display.bundles.find(candidate => candidate.id === bundle.id), bundle);
  const bytes = await readFile('public' + bundle.url.split('?')[0]);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256);
}

const built = await build({ stdin: { contents: "export {thighDeepMuscleQuizLesson} from './lib/thigh-deep-muscle-quiz';export {parseBodyReviewResponse} from './lib/body-review-response';", resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, platform: 'node', format: 'esm' });
const { thighDeepMuscleQuizLesson, parseBodyReviewResponse } = await import('data:text/javascript;base64,' + Buffer.from(built.outputFiles[0].text).toString('base64'));
const targets = new Map(pins.entries.map(e => [e.identity.id, e]));
let changed = 0, preserved = 0, refused = 0;
for (const structure of display.structures) for (const tab of api.contentTabs) {
  const old = before.bodyLesson(structure, tab), current = api.bodyLesson(structure, tab), entry = targets.get(structure.id);
  if (entry && tab === 'quiz') {
    assert.deepEqual(structure, entry.identity);
    assert.deepEqual(old, entry.previous);
    assert.equal(old.readiness, 'generated-identification');
    assert.equal(old.correctAnswer, undefined);
    const draft = thighDeepMuscleQuizLesson(structure, tab);
    assert.equal(draft.readiness, 'draft');
    assert.deepEqual(draft.bullets, [...thighDeepMuscleQuizQuestions[entry.group].choices]);
    assert.equal(draft.correctAnswer, thighDeepMuscleQuizQuestions[entry.group].correctAnswer);
    assert.match(draft.title, /Hip and thigh quick check · draft/);
    assert.match(draft.note, /revision-bound radiologist review pending/i);
    assert.match(draft.note, /does not validate complete attachments, innervation, movement, or patient anatomy/i);
    assert.deepEqual(draft.citations, [...thighDeepMuscleQuizQuestions[entry.group].references]);
    assert.deepEqual(current, draft, 'Actual bodyLesson must route to hip and thigh quiz');
    const { readiness, ...shown } = draft;
    assert.deepEqual(api.bodyContent(structure, tab), shown);
    changed++;
  } else {
    assert.deepEqual(completed.bodyLesson(structure, tab), old, `${structure.id}:${tab}`);
    assert.equal(thighDeepMuscleQuizLesson(structure, tab), undefined);
    preserved++;
  }
}
assert.equal(changed, 30);
assert.equal(preserved, 9906);
for (const { identity } of pins.entries) {
  const direct = thighDeepMuscleQuizLesson(identity, 'quiz');
  const original = structuredClone(direct);
  direct.bullets.push('foreign'); direct.citations.push('foreign');
  assert.deepEqual(thighDeepMuscleQuizLesson(identity, 'quiz'), original, 'Fresh lesson arrays');
  for (const mutation of [
    s => { s.sources[0].sha256 = '0'.repeat(64); },
    s => { s.sources = []; },
    s => { s.bundle = 'foreign'; },
    s => { s.fmaId = 'foreign'; },
    s => { s.laterality = 'foreign'; },
    s => { s.id = 'foreign'; },
    s => { s.validation.anatomicalReview = true; },
    s => { s.unexpected = true; },
  ]) {
    const invalid = structuredClone(identity); mutation(invalid);
    assert.equal(thighDeepMuscleQuizLesson(invalid, 'quiz'), undefined);
    refused++;
  }
  for (const tab of api.contentTabs.filter(tab => tab !== 'quiz')) assert.equal(thighDeepMuscleQuizLesson(identity, tab), undefined);
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
}

const require = createRequire(import.meta.url), React = require('react');
const render = require('react-dom/server').renderToStaticMarkup;
const component = await componentBuild({ stdin: { contents: "export {StructureQuickCheck} from './app/structure-quick-check';export {QuizNotes,AtlasWorkspace} from './app/atlas-workspace';", resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, platform: 'node', format: 'cjs', write: false });
let states = [], refs = [], cursor = 0, refCursor = 0, active = false;
const focus = { target: null };
const shim = { ...React,
  useContext: () => ({ exam: false }),
  useId: () => active ? 'thigh-muscle-check' : React.useId(),
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
for (const [group, q] of Object.entries(thighDeepMuscleQuizQuestions)) {
  const identity = pins.entries.find(entry => entry.group === group).identity;
  const props = { question: q.body, choices: [...q.choices], correctAnswer: q.correctAnswer, explanation: q.explanation };
  const html = render(React.createElement(actual.StructureQuickCheck, props));
  assert.equal((html.match(/type="radio"/g) || []).length, 4);
  assert.match(html, /<button[^>]*disabled=""[^>]*>Check answer/);
  assert(!html.includes('Correct answer:'));
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
  assert(nodeText(tree).includes(props.explanation), group);
  assert.equal(focus.target, 'feedback');
  button('Practise again').props.onClick(); redraw();
  assert.equal(focus.target, 'first-radio');
  assert(radios().every(node => !node.props.checked));
  assert.equal(button('Check answer').props.disabled, true);
  answer((correct + 1) % 4); assert(nodeText(tree).includes('Incorrect. Correct answer: ' + props.correctAnswer), group);
  assert.equal(focus.target, 'feedback');
  button('Try again').props.onClick(); redraw();
  assert.equal(focus.target, 'first-radio');
  assert(radios().every(node => !node.props.checked));
  assert.equal(button('Check answer').props.disabled, true);
  interacted++;
}
assert.equal(interacted, 15);
console.log(JSON.stringify({ passed: true, changed, preserved, sourceRefusals: refused, interacted, positions, wordsByPage, clinicalApproval: false }));
