import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {contentContext} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {build} from './workspace-test-build.mjs';
import {build as componentBuild} from './workspace-component-test-build.mjs';
import pins from '../content/regional-muscle-completion-quiz-pins.json' with {type: 'json'};
import {regionalMuscleCompletionQuizQuestions as questions} from '../content/regional-muscle-completion-quiz.ts';

const sourceOnly = process.argv.length === 3 && process.argv[2] === '--source-only';
assert(sourceOnly || process.argv.length === 2, 'Only --source-only is accepted');
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
assert.equal(pins.parentCommit, 'e7608c0719fbf77b0f1a350d648dd695be23be6b');
assert.equal(hash(pins), '8ce87e14430874ecf7ccb44545770f9da18545fcb7f31f649d03f47c239ba567');
assert.equal(pins.entries.length, 12);
assert.equal(new Set(pins.entries.map(e => e.identity.id)).size, 12);
assert.equal(new Set(pins.entries.map(e => e.identity.fmaId)).size, 12);
assert(!pins.entries.some(e => e.identity.fmaId === 'FMA19728'));
assert.deepEqual(Object.keys(questions).sort(), [...new Set(pins.entries.map(e => e.group))].sort());
const expectedFma = {longus: ['FMA46309', 'FMA46310'], anterior: ['FMA46313', 'FMA46314'], lateralis: ['FMA46317', 'FMA46318'], coccygeus: ['FMA46443', 'FMA46444'], oblique: ['FMA46018', 'FMA46019'], transverse: ['FMA46020', 'FMA46021']};
for (const [group, ids] of Object.entries(expectedFma)) {
  assert.deepEqual(pins.entries.filter(e => e.group === group).map(e => e.identity.fmaId).sort(), ids, group);
}
const {api, catalog} = await contentContext();
const before = await exactSourceHistoryApi(pins.parentCommit, 'display-review');
const display = api.bodyDisplayCatalog(catalog);
assert.equal(hash(display), pins.catalogHash);
assert.deepEqual(display, before.bodyDisplayCatalog(catalog));
assert.deepEqual(display.coordinateSystem, pins.coordinateSystem);
for (const name of ['structures', 'dissectionProfiles']) assert.deepEqual(api[name], before[name], `${name} unchanged`);
const targets = new Map(pins.entries.map(e => [e.identity.id, e]));
assert.deepEqual(display.structures.filter(s => targets.has(s.id)), pins.entries.map(e => e.identity));
assert.deepEqual(new Set(pins.bundles.map(b => b.id)), new Set(pins.entries.map(e => e.identity.bundle)));
for (const bundle of pins.bundles) {
  assert.deepEqual(display.bundles.find(candidate => candidate.id === bundle.id), bundle);
  const bytes = await readFile('public' + bundle.url.split('?')[0]);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256);
}
const references = new Set([
  'https://anatomy.ttuhscep.edu/anatomytables/muscles_head_neck.html',
  'https://anatomy.ttuhscep.edu/reproductive_system/pelvicwall_tables.html',
  'https://anatomy.ttuhscep.edu/anatomytables/muscles_lowerlimb.html',
  'https://www.elsevier.com/resources/anatomy/muscular-system/muscles-of-lower-limb/transverse-head-of-adductor-hallucis/22943',
]);
const wordsByPage = {}, positions = [0, 0, 0, 0];
for (const [group, q] of Object.entries(questions)) {
  assert.equal(q.choices.length, 4, group);
  assert.equal(new Set(q.choices).size, 4, group);
  assert.equal(q.choices.filter(choice => choice === q.correctAnswer).length, 1, group);
  assert(q.references.length >= 1, group);
  for (const ref of q.references) assert(references.has(ref), ref);
  assert.equal(pins.entries.filter(e => e.group === group).length, 2, group);
  positions[q.choices.indexOf(q.correctAnswer)]++;
  for (const ref of q.references) wordsByPage[ref] = (wordsByPage[ref] ?? 0) + [q.body, ...q.choices, q.explanation].join(' ').trim().split(/\s+/).length;
}
assert.equal(new Set(Object.values(questions).map(q => q.body)).size, 6);
assert(positions.every(count => count >= 1 && count <= 2), `Answer positions: ${positions}`);
for (const [page, count] of Object.entries(wordsByPage)) assert(count <= 180, `${page}: ${count} attributed words`);
const built = await build({stdin: {contents: "export {regionalMuscleCompletionQuizLesson} from './lib/regional-muscle-completion-quiz';export {parseBodyReviewResponse} from './lib/body-review-response';", resolveDir: process.cwd(), loader: 'ts'}, bundle: true, write: false, platform: 'node', format: 'esm'});
const {regionalMuscleCompletionQuizLesson: lesson, parseBodyReviewResponse} = await import('data:text/javascript;base64,' + Buffer.from(built.outputFiles[0].text).toString('base64'));
let changed = 0, preserved = 0, refused = 0;
for (const structure of display.structures) for (const tab of api.contentTabs) {
  const old = before.bodyLesson(structure, tab), current = api.bodyLesson(structure, tab);
  const entry = targets.get(structure.id), draft = lesson(structure, tab);
  if (entry && tab === 'quiz') {
    assert.deepEqual(structure, entry.identity);
    assert.deepEqual(old, entry.previous);
    assert.equal(old.readiness, 'generated-identification');
    assert.equal(old.correctAnswer, undefined);
    assert.equal(draft.readiness, 'draft');
    assert.deepEqual(draft.bullets, [...questions[entry.group].choices]);
    assert.equal(draft.correctAnswer, questions[entry.group].correctAnswer);
    assert.deepEqual(draft.citations, [...questions[entry.group].references]);
    assert.match(draft.note, /revision-bound radiologist review pending/i);
    assert.match(draft.note, /does not validate complete anatomy, muscle attachments or action, patient registration/i);
    if (!sourceOnly) {
      assert.deepEqual(current, draft, 'Actual bodyLesson must route to regional-muscle quiz');
      const {readiness, ...shown} = draft;
      assert.deepEqual(api.bodyContent(structure, tab), shown);
    }
    changed++;
  } else {
    if (!sourceOnly) assert.deepEqual(current, old, `${structure.id}:${tab}`);
    assert.equal(draft, undefined);
    preserved++;
  }
}
assert.equal(changed, 12);
assert.equal(preserved, 9924);
for (const {identity} of pins.entries) {
  const original = structuredClone(lesson(identity, 'quiz'));
  const modified = lesson(identity, 'quiz');
  modified.bullets.push('foreign'); modified.citations.push('foreign');
  assert.deepEqual(lesson(identity, 'quiz'), original);
  for (const mutation of [
    s => { s.sources[0].sha256 = '0'.repeat(64); }, s => { s.sources = []; },
    s => { s.bundle = 'foreign'; }, s => { s.fmaId = 'foreign'; },
    s => { s.laterality = 'foreign'; }, s => { s.id = 'foreign'; },
    s => { s.system = 'foreign'; }, s => { s.category = 'foreign'; },
    s => { s.region = 'foreign'; }, s => { s.nodeName = 'foreign'; },
    s => { s.validation.anatomicalReview = true; }, s => { s.unexpected = true; },
  ]) {
    const invalid = structuredClone(identity); mutation(invalid);
    assert.equal(lesson(invalid, 'quiz'), undefined);
    refused++;
  }
  if (identity.fmaId === 'FMA46444') {
    assert.equal(identity.sources.length, 2, 'retained left coccygeus composite');
    const invalidSecondSource = structuredClone(identity);
    invalidSecondSource.sources[1].sha256 = '0'.repeat(64);
    assert.equal(lesson(invalidSecondSource, 'quiz'), undefined);
    const reversedSources = structuredClone(identity);
    reversedSources.sources.reverse();
    assert.equal(lesson(reversedSources, 'quiz'), undefined);
  }
  if (!sourceOnly) {
    const packet = await api.bodyReviewMaterial(identity.id);
    const oldPacket = await before.bodyReviewMaterial(identity.id);
    assert.equal(packet.approval, false);
    assert.deepEqual(packet.source, oldPacket.source);
    assert.deepEqual(packet.reasoning, oldPacket.reasoning);
    assert.deepEqual(packet.guidedTours, oldPacket.guidedTours);
    assert.notEqual(packet.fingerprints.teaching, oldPacket.fingerprints.teaching);
    assert.deepEqual(packet.topics.find(topic => topic.tab === 'quiz'), {tab: 'quiz', ...original});
    assert.deepEqual(await parseBodyReviewResponse(packet, identity.id), packet);
    assert.equal(await parseBodyReviewResponse(oldPacket, identity.id), null);
    const altered = structuredClone(packet);
    altered.topics.find(topic => topic.tab === 'quiz').correctAnswer = 'foreign';
    assert.equal(await parseBodyReviewResponse(altered, identity.id), null);
  }
}
assert.equal(refused, 144);
const require = createRequire(import.meta.url), React = require('react');
const render = require('react-dom/server').renderToStaticMarkup;
const component = await componentBuild({stdin: {contents: "export {StructureQuickCheck} from './app/structure-quick-check';", resolveDir: process.cwd(), loader: 'tsx'}, bundle: true, platform: 'node', format: 'cjs', write: false});
let states = [], refs = [], cursor = 0, refCursor = 0, active = false;
const focus = {target: null};
const shim = {...React,
  useId: () => active ? 'regional-muscle-completion-check' : React.useId(),
  useState(initial) {if (!active) return React.useState(initial); const index = cursor++; if (!(index in states)) states[index] = initial; return [states[index], value => {states[index] = value;}];},
  useRef(initial) {if (!active) return React.useRef(initial); const index = refCursor++; return refs[index] ?? (refs[index] = {current: initial});},
};
const load = react => {
  const scope = {exports: {}};
  runInNewContext(component.outputFiles[0].text, {module: scope, exports: scope.exports, require: id => id === 'react' ? react : require(id), console});
  return scope.exports;
};
const actual = load(React), events = load(shim);
const walk = (node, found = []) => {if (React.isValidElement(node)) {found.push(node); React.Children.forEach(node.props.children, child => walk(child, found));} return found;};
const nodeText = node => typeof node === 'string' ? node : !node ? '' : Array.isArray(node) ? node.map(nodeText).join('') : nodeText(node.props?.children);
let interacted = 0;
for (const q of Object.values(questions)) {
  const props = {question: q.body, choices: [...q.choices], correctAnswer: q.correctAnswer, explanation: q.explanation};
  const html = render(React.createElement(actual.StructureQuickCheck, props));
  assert.equal((html.match(/type="radio"/g) || []).length, 4);
  assert.match(html, /<button[^>]*disabled=""[^>]*>Check answer/);
  assert(!html.includes('Correct answer:'));
  assert(!html.includes(q.explanation));
  const attempt = events.StructureQuickCheck(props);
  states = []; refs = [];
  let tree;
  const redraw = () => {
    cursor = 0; refCursor = 0; active = true; tree = attempt.type(attempt.props); active = false;
    for (const node of walk(tree)) if (node.props.ref) node.props.ref.current = {focus(options) {assert.equal(options.preventScroll, true); focus.target = node.type === 'input' ? 'first-radio' : 'feedback';}};
  };
  const radios = () => walk(tree).filter(node => node.type === 'input');
  const button = label => walk(tree).find(node => node.type === 'button' && nodeText(node) === label);
  const answer = index => {radios()[index].props.onChange(); redraw(); button('Check answer').props.onClick(); redraw();};
  redraw(); assert.equal(button('Check answer').props.disabled, true);
  const correct = props.choices.indexOf(props.correctAnswer);
  answer(correct);
  assert(nodeText(tree).includes('Correct. Correct answer: ' + props.correctAnswer));
  assert(nodeText(tree).includes(props.explanation));
  assert.equal(focus.target, 'feedback');
  button('Practise again').props.onClick(); redraw();
  assert.equal(focus.target, 'first-radio');
  assert(radios().every(node => !node.props.checked));
  assert.equal(button('Check answer').props.disabled, true);
  answer((correct + 1) % 4);
  assert(nodeText(tree).includes('Incorrect. Correct answer: ' + props.correctAnswer));
  assert.equal(focus.target, 'feedback');
  button('Try again').props.onClick(); redraw();
  assert.equal(focus.target, 'first-radio');
  assert(radios().every(node => !node.props.checked));
  assert.equal(button('Check answer').props.disabled, true);
  interacted++;
}
assert.equal(interacted, 6);
console.log(JSON.stringify({passed: true, sourceOnly, changed, preserved, sourceRefusals: refused, interacted, positions, wordsByPage, clinicalApproval: false}));
