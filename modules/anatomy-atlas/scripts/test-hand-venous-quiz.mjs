import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { contentContext } from './content-contract-tools.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';
import { build } from './workspace-test-build.mjs';
import { build as componentBuild } from './workspace-component-test-build.mjs';
import { handVenousAdmissions } from './hand-venous-selections.mjs';
import pins from '../content/hand-venous-quiz-pins.json' with { type: 'json' };
import imagingPins from '../content/hand-venous-imaging-pins.json' with { type: 'json' };
import { handVenousQuizQuestions } from '../content/hand-venous-quiz.ts';

const sourceOnly = process.argv.length === 3 && process.argv[2] === '--source-only';
assert(sourceOnly || process.argv.length === 2, 'Only --source-only is accepted');
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
assert.equal(pins.parentCommit, '49202472cd917b5f52948279ab6cc7d19b2208d1');
assert.equal(hash(pins), 'e305f69bd4d024a979850f0d115727613951399428c96a0a3ed631a31674bf6d');
assert.equal(pins.entries.length, 14);
assert.equal(new Set(pins.entries.map(entry => entry.identity.id)).size, 14);
assert.equal(new Set(pins.entries.map(entry => entry.identity.fmaId)).size, 14);
assert.deepEqual(new Set(pins.entries.map(entry => entry.group)), new Set(Object.keys(handVenousQuizQuestions)));
assert.deepEqual(new Set(pins.entries.map(entry => entry.identity.fmaId)), new Set(handVenousAdmissions));
assert.deepEqual(new Set(pins.entries.map(entry => entry.identity.fmaId)), new Set(imagingPins.entries.map(entry => entry.identity.fmaId)));
for (const entry of pins.entries) assert.deepEqual(entry.identity, imagingPins.entries.find(candidate => candidate.identity.fmaId === entry.identity.fmaId).identity);
assert.deepEqual(Object.fromEntries(Object.keys(handVenousQuizQuestions).map(group => [group, pins.entries.filter(entry => entry.group === group).length])),
  { deepArch: 2, superficialArch: 2, dorsalNetwork: 2, metacarpal: 2, properDigital: 6 });
const { api, catalog } = await contentContext();
const before = await exactSourceHistoryApi(pins.parentCommit, 'display-review');
const display = api.bodyDisplayCatalog(catalog);
assert.equal(hash(display), pins.catalogHash);
assert.deepEqual(display, before.bodyDisplayCatalog(catalog));
assert.deepEqual(display.coordinateSystem, pins.coordinateSystem);
for (const name of ['structures', 'dissectionProfiles']) assert.deepEqual(api[name], before[name], `${name} unchanged`);
const targets = new Map(pins.entries.map(entry => [entry.identity.id, entry]));
assert.deepEqual(pins.entries.map(entry => display.structures.find(s => s.id === entry.identity.id)), pins.entries.map(entry => entry.identity));
assert.deepEqual(pins.bundles, imagingPins.bundles);
for (const bundle of pins.bundles) {
  assert.deepEqual(display.bundles.find(candidate => candidate.id === bundle.id), bundle);
  const bytes = await readFile('public' + bundle.url.split('?')[0]);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256);
}
const palmarReference = 'https://www.ncbi.nlm.nih.gov/sites/books/NBK545377/?report=classic';
const dorsalReference = 'https://anatomy.ttuhscep.edu/anatomytables/veins_upperlimb.html';
const positions = [0, 0, 0, 0], sourceWords = { palmar: 0, dorsal: 0 };
for (const [group, q] of Object.entries(handVenousQuizQuestions)) {
  assert.equal(q.choices.length, 4, group);
  assert.equal(new Set(q.choices).size, 4, group);
  assert.equal(q.choices.filter(choice => choice === q.correctAnswer).length, 1, group);
  assert.deepEqual(q.references, [group === 'dorsalNetwork' ? dorsalReference : palmarReference], group);
  positions[q.choices.indexOf(q.correctAnswer)]++;
  sourceWords[group === 'dorsalNetwork' ? 'dorsal' : 'palmar'] += [q.body, ...q.choices, q.explanation].join(' ').trim().split(/\s+/).length;
}
assert.equal(new Set(Object.values(handVenousQuizQuestions).map(q => q.body)).size, 5);
assert.deepEqual(positions, [2, 1, 1, 1]);
assert(sourceWords.palmar <= 190, `${sourceWords.palmar} StatPearls words`);
assert(sourceWords.dorsal <= 60, `${sourceWords.dorsal} university words`);
const built = await build({ stdin: { contents: "export {handVenousQuizLesson} from './lib/hand-venous-quiz';export {parseBodyReviewResponse} from './lib/body-review-response';", resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, platform: 'node', format: 'esm' });
const { handVenousQuizLesson, parseBodyReviewResponse } = await import('data:text/javascript;base64,' + Buffer.from(built.outputFiles[0].text).toString('base64'));
let changed = 0, preserved = 0, refused = 0;
for (const structure of display.structures) for (const tab of api.contentTabs) {
  const old = before.bodyLesson(structure, tab), current = api.bodyLesson(structure, tab);
  const entry = targets.get(structure.id), draft = handVenousQuizLesson(structure, tab);
  if (entry && tab === 'quiz') {
    assert.deepEqual(structure, entry.identity);
    assert.deepEqual(old, entry.previous);
    assert.equal(old.readiness, 'generated-identification');
    assert.equal(old.correctAnswer, undefined);
    assert.equal(draft.readiness, 'draft');
    assert.deepEqual(draft.bullets, [...handVenousQuizQuestions[entry.group].choices]);
    assert.equal(draft.correctAnswer, handVenousQuizQuestions[entry.group].correctAnswer);
    assert.deepEqual(draft.citations, [...handVenousQuizQuestions[entry.group].references]);
    assert.match(draft.note, /revision-bound radiologist sign-off pending/i);
    assert.match(draft.note, /cannot prove donor-specific drainage, connections, lumen, patency, flow/i);
    assert.match(draft.note, /patient-space registration/i);
    if (!sourceOnly) {
      assert.deepEqual(current, draft, 'Actual bodyLesson must route to hand venous quiz');
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
assert.equal(changed, 14);
assert.equal(preserved, display.structures.length * api.contentTabs.length - 14);
for (const { identity } of pins.entries) {
  const original = structuredClone(handVenousQuizLesson(identity, 'quiz'));
  const detached = handVenousQuizLesson(identity, 'quiz');
  detached.bullets.push('foreign'); detached.citations.push('foreign');
  assert.deepEqual(handVenousQuizLesson(identity, 'quiz'), original);
  for (let index = 0; index < identity.sources.length; index++) for (const mutation of [
    s => { s.sources[index].sha256 = '0'.repeat(64); }, s => { s.sources[index].file = 'foreign'; },
  ]) {
    const invalid = structuredClone(identity); mutation(invalid);
    assert.equal(handVenousQuizLesson(invalid, 'quiz'), undefined); refused++;
  }
  for (const mutation of [
    s => { s.sources = []; }, s => { s.sources.push(structuredClone(s.sources[0])); },
    s => { s.bundle = 'foreign'; }, s => { s.fmaId = 'foreign'; },
    s => { s.laterality = 'foreign'; }, s => { s.id = 'foreign'; }, s => { s.system = 'foreign'; },
    s => { s.category = 'foreign'; }, s => { s.region = 'foreign'; }, s => { s.sourceTree = 'foreign'; },
    s => { s.nodeName = 'foreign'; }, s => { s.provenance.recovered = !s.provenance.recovered; },
    s => { s.provenance.method = 'foreign'; }, s => { s.coverageNote = 'foreign'; },
    s => { s.validation.anatomicalReview = true; }, s => { s.unexpected = true; },
  ]) {
    const invalid = structuredClone(identity); mutation(invalid);
    assert.equal(handVenousQuizLesson(invalid, 'quiz'), undefined); refused++;
  }
  if (!sourceOnly) {
    const packet = await api.bodyReviewMaterial(identity.id), oldPacket = await before.bodyReviewMaterial(identity.id);
    assert.equal(packet.approval, false);
    assert.deepEqual(packet.source, oldPacket.source);
    assert.deepEqual(packet.reasoning, oldPacket.reasoning);
    assert.deepEqual(packet.guidedTours, oldPacket.guidedTours);
    assert.notEqual(packet.fingerprints.teaching, oldPacket.fingerprints.teaching);
    assert.deepEqual(packet.topics.find(topic => topic.tab === 'quiz'), { tab: 'quiz', ...original });
    assert.deepEqual(await parseBodyReviewResponse(packet, identity.id), packet);
    assert.equal(await parseBodyReviewResponse(oldPacket, identity.id), null);
    const altered = structuredClone(packet); altered.topics.find(topic => topic.tab === 'quiz').correctAnswer = 'foreign';
    assert.equal(await parseBodyReviewResponse(altered, identity.id), null);
    const sourceAltered = structuredClone(packet); sourceAltered.source.structure.sources.at(-1).sha256 = '0'.repeat(64);
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
  useId: () => active ? 'hand-venous-check' : React.useId(),
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
for (const [group, q] of Object.entries(handVenousQuizQuestions)) {
  const identity = pins.entries.find(entry => entry.group === group).identity;
  const props = { question: q.body, choices: [...q.choices], correctAnswer: q.correctAnswer, explanation: q.explanation };
  const html = render(React.createElement(actual.StructureQuickCheck, props));
  assert.equal((html.match(/type="radio"/g) || []).length, 4);
  assert.match(html, /<button[^>]*disabled=""[^>]*>Check answer/);
  assert(!html.includes('Correct answer:')); assert(!html.includes(q.explanation));
  if (!sourceOnly) {
    states = []; refs = []; cursor = 0; refCursor = 0; active = true;
    let note = events.QuizNotes({ structure: identity }); active = false;
    assert.equal(note.type, 'details'); note.props.onToggle({ currentTarget: { open: true } });
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
  button('Practise again').props.onClick(); redraw(); assert.equal(focus.target, 'first-radio');
  assert(radios().every(node => !node.props.checked)); assert.equal(button('Check answer').props.disabled, true);
  answer((correct + 1) % 4); assert(nodeText(tree).includes('Incorrect. Correct answer: ' + props.correctAnswer), group);
  assert.equal(focus.target, 'feedback'); button('Try again').props.onClick(); redraw();
  assert.equal(focus.target, 'first-radio'); assert(radios().every(node => !node.props.checked));
  assert.equal(button('Check answer').props.disabled, true); interacted++;
}
assert.equal(interacted, 5);
console.log(JSON.stringify({ passed: true, sourceOnly, changed, [sourceOnly ? 'preservationCandidates' : 'preserved']: preserved, sourceRefusals: refused, interacted, positions, sourceWords, pinsHash: hash(pins), clinicalApproval: false }));
