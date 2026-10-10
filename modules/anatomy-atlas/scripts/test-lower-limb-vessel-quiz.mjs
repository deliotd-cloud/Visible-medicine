import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { contentContext } from './content-contract-tools.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';
import { build } from './workspace-test-build.mjs';
import { build as componentBuild } from './workspace-component-test-build.mjs';
import pins from '../content/lower-limb-vessel-quiz-pins.json' with { type: 'json' };
import { lowerLimbVesselQuizQuestions } from '../content/lower-limb-vessel-quiz.ts';

assert.equal(process.argv.length, 2, 'No test-mode arguments are accepted');
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
assert.equal(pins.parentCommit, 'ed74d3e7c96501f21434f76e136c12a11493c020');
assert.equal(hash(pins), 'a233ef4e81b60aa8ae07848487a9e9254f625054f3bfb982d678316247827eb3');
const { api, catalog } = await contentContext();
const before = await exactSourceHistoryApi(pins.parentCommit, 'display-review');
// Keep the completed transition's non-target comparison at its original epoch.
// The forearm vessel suite independently compares all current non-target topics.
const completed = await exactSourceHistoryApi('59c40bbb213627c3fc423a0b826f6f3063ea605d', 'display-review');
const display = api.bodyDisplayCatalog(catalog);
assert.equal(hash(display), pins.catalogHash);
assert.deepEqual(display, before.bodyDisplayCatalog(catalog));
assert.deepEqual(display.coordinateSystem, pins.coordinateSystem);
for (const name of ['structures', 'dissectionProfiles']) assert.deepEqual(api[name], before[name], `${name} unchanged`);
const counts = {"femoralArtery":2,"deepFemoralArtery":2,"femoralVein":2,"greatSaphenous":2,"poplitealArtery":2,"anteriorTibialArtery":2,"posteriorTibialArtery":2,"poplitealVein":2,"smallSaphenous":2,"dorsalisPedis":2,"lateralPlantar":2,"superficialMedialPlantar":2,"anteriorTibialVein":2,"posteriorTibialVein":2,"deepFemoralVein":2};
assert.equal(pins.entries.length, 30);
assert.equal(new Set(pins.entries.map(e => e.identity.id)).size, 30);
assert.deepEqual(Object.keys(lowerLimbVesselQuizQuestions).sort(), Object.keys(counts).sort());
assert.deepEqual(Object.fromEntries(Object.keys(counts).map(group => [group, pins.entries.filter(e => e.group === group).length])), counts);
const eligible = display.structures.filter(s => ['thigh','leg','foot'].includes(s.region) && s.system === 'vessels' && before.bodyLesson(s, 'quiz')?.readiness === 'generated-identification');
assert.deepEqual(pins.entries.map(e => e.identity.id).sort(), eligible.map(s => s.id).sort());

const references = new Set(["https://anatomy.ttuhscep.edu/anatomytables/arteries_lowerlimb.html","https://anatomy.ttuhscep.edu/anatomytables/veins_lowerlimb.html","https://pmc.ncbi.nlm.nih.gov/articles/PMC3036282/","https://pmc.ncbi.nlm.nih.gov/articles/PMC4974293/","https://pmc.ncbi.nlm.nih.gov/articles/PMC8411774/","https://pmc.ncbi.nlm.nih.gov/articles/PMC11764913/","https://pubmed.ncbi.nlm.nih.gov/38718967/"]);
const wordsByPage = {}, positions = [0, 0, 0, 0];
for (const [group, q] of Object.entries(lowerLimbVesselQuizQuestions)) {
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

const built = await build({ stdin: { contents: "export {lowerLimbVesselQuizLesson} from './lib/lower-limb-vessel-quiz';export {parseBodyReviewResponse} from './lib/body-review-response';", resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, platform: 'node', format: 'esm' });
const { lowerLimbVesselQuizLesson, parseBodyReviewResponse } = await import('data:text/javascript;base64,' + Buffer.from(built.outputFiles[0].text).toString('base64'));
const targets = new Map(pins.entries.map(e => [e.identity.id, e]));
let changed = 0, preserved = 0, refused = 0;
for (const structure of display.structures) for (const tab of api.contentTabs) {
  const old = before.bodyLesson(structure, tab), current = api.bodyLesson(structure, tab), entry = targets.get(structure.id);
  if (entry && tab === 'quiz') {
    assert.deepEqual(structure, entry.identity);
    assert.deepEqual(old, entry.previous);
    assert.equal(old.readiness, 'generated-identification');
    assert.equal(old.correctAnswer, undefined);
    const draft = lowerLimbVesselQuizLesson(structure, tab);
    assert.equal(draft.readiness, 'draft');
    assert.deepEqual(draft.bullets, [...lowerLimbVesselQuizQuestions[entry.group].choices]);
    assert.equal(draft.correctAnswer, lowerLimbVesselQuizQuestions[entry.group].correctAnswer);
    assert.match(draft.title, /Lower-limb vessel quick check · draft/);
    assert.match(draft.note, /revision-bound radiologist review pending/i);
    assert.match(draft.note, /does not validate completeness, boundaries, branching, course, or flow/i);
    assert.deepEqual(draft.citations, [...lowerLimbVesselQuizQuestions[entry.group].references]);
    assert.deepEqual(current, draft, 'Actual bodyLesson must route to lower-limb vessel quiz');
    const { readiness, ...shown } = draft;
    assert.deepEqual(api.bodyContent(structure, tab), shown);
    changed++;
  } else {
    assert.deepEqual(completed.bodyLesson(structure, tab), old, `${structure.id}:${tab}`);
    assert.equal(lowerLimbVesselQuizLesson(structure, tab), undefined);
    preserved++;
  }
}
assert.equal(changed, 30);
assert.equal(preserved, 9906);
for (const { identity } of pins.entries) {
  const direct = lowerLimbVesselQuizLesson(identity, 'quiz');
  const original = structuredClone(direct);
  direct.bullets.push('foreign'); direct.citations.push('foreign');
  assert.deepEqual(lowerLimbVesselQuizLesson(identity, 'quiz'), original, 'Fresh lesson arrays');
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
    assert.equal(lowerLimbVesselQuizLesson(invalid, 'quiz'), undefined);
    refused++;
  }
  for (const tab of api.contentTabs.filter(tab => tab !== 'quiz')) assert.equal(lowerLimbVesselQuizLesson(identity, tab), undefined);
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
  useId: () => active ? 'lower-limb-vessel-check' : React.useId(),
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
for (const [group, q] of Object.entries(lowerLimbVesselQuizQuestions)) {
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
