import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { build } from './workspace-test-build.mjs';
import { build as componentBuild } from './workspace-component-test-build.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';
import { nasalCartilageQuizQuestions } from '../content/nasal-cartilage-quiz.ts';
import { commissuralLandmarkQuizQuestions } from '../content/commissural-landmark-quiz.ts';

assert.equal(process.argv.length, 2, 'No test-mode arguments are accepted');
const baseline = 'dc8212978d4929c26c514bb08f9ed8e5f6df8cef';
const fmaIds = new Set(['FMA59503', 'FMA59505', 'FMA59506', 'FMA59512', 'FMA59513', 'FMA61970', 'FMA62072']);
const answers = {
  septal: 'The anterior cartilaginous part',
  alar: 'Each curves around a nostril, with medial and lateral crura',
  lateral: 'They meet the septal cartilage at the dorsum and lie above the major alar cartilages',
  forniceal: 'Delicate fibres can be present histologically without being reconstructed by tractography',
  posterior: 'Above the rostral cerebral aqueduct in the pineal region',
};
const specs = [
  { path: 'content/nasal-cartilage-quiz-pins.json', questions: nasalCartilageQuizQuestions,
    groups: ['alar', 'lateral', 'septal'], helper: 'nasalCartilageQuizLesson' },
  { path: 'content/commissural-landmark-quiz-pins.json', questions: commissuralLandmarkQuizQuestions,
    groups: ['forniceal', 'posterior'], helper: 'commissuralLandmarkQuizLesson' },
];
const selected = specs.flatMap(spec => {
  const pins = JSON.parse(readFileSync(spec.path, 'utf8'));
  assert.deepEqual(Object.keys(spec.questions).sort(), spec.groups);
  assert(pins.entries.length > 0, spec.path);
  for (const entry of pins.entries) {
    assert(fmaIds.has(entry.identity.fmaId), entry.identity.fmaId);
    assert(spec.groups.includes(entry.group), entry.group);
    const question = spec.questions[entry.group];
    assert.equal(typeof question.body, 'string');
    assert(question.body.trim().length > 0, entry.group);
    assert.equal(question.choices.length, 4, entry.group);
    assert(question.choices.every(choice => typeof choice === 'string' && choice.trim()), entry.group);
    assert.equal(new Set(question.choices.map(choice => choice.trim())).size, 4, entry.group);
    assert.equal(question.choices.filter(choice => choice === question.correctAnswer).length, 1, entry.group);
    assert.equal(question.correctAnswer, answers[entry.group], entry.group);
    assert(question.explanation.trim().length > 0, entry.group);
    assert(question.references.length > 0, entry.group);
    assert(question.references.every(url => /^https:\/\/[^\s]+$/i.test(url)), entry.group);
  }
  return pins.entries.map(entry => ({ ...entry, spec, pins }));
});
assert.equal(selected.length, 7);
assert.deepEqual(new Set(selected.map(entry => entry.identity.fmaId)), fmaIds);
assert.equal(new Set(selected.map(entry => entry.identity.id)).size, 7);
const byId = new Map(selected.map(entry => [entry.identity.id, entry]));
const fromBaseline = path => execFileSync('git', ['show', `${baseline}:${path}`], {
  windowsHide: true, maxBuffer: 32e6,
});
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

const previous = await exactSourceHistoryApi(baseline, 'review-security');
const compiled = await build({
  stdin: {
    contents: `export {nasalCartilageQuizLesson} from './lib/nasal-cartilage-quiz';
export {commissuralLandmarkQuizLesson} from './lib/commissural-landmark-quiz';
export {bodyLesson,bodyContent} from './app/body-content';
export {bodyDisplayCatalog} from './lib/body-display-catalog';
export {contentTabs} from './lib/content-types';
export {structures} from './app/anatomy-data';
export {dissectionProfiles} from './app/dissection-data';
export {regionalTours} from './lib/regional-tours';
export * from './lib/body-review-material';
export * from './lib/body-review-context';
export * from './lib/body-review-response';
export * from './lib/body-review-api';
export * from './lib/body-review-decisions';`,
    resolveDir: process.cwd(), loader: 'ts',
  },
  bundle: true, write: false, platform: 'node', format: 'esm',
});
const now = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const catalogPath = 'public/models/bodyparts3d/full-body/catalog.json';
const raw = JSON.parse(readFileSync(catalogPath, 'utf8'));
assert.deepEqual(raw, JSON.parse(fromBaseline(catalogPath)));
const catalog = now.bodyDisplayCatalog(raw);
assert.deepEqual(catalog, previous.bodyDisplayCatalog(JSON.parse(fromBaseline(catalogPath))));
assert.deepEqual(now.structures, previous.structures);
assert.deepEqual(now.dissectionProfiles, previous.dissectionProfiles);
assert.deepEqual(now.regionalTours, previous.regionalTours);
assert.deepEqual(now.contentTabs, previous.contentTabs);
assert.equal(now.contentTabs.length * catalog.structures.length, 9936);
assert.equal(catalog.bundles.length, 109);
for (const entry of selected) {
  assert.equal(entry.identity.nodeName, entry.identity.fmaId);
  assert.equal(entry.identity.validation.anatomicalReview, false);
  assert.equal(entry.identity.validation.status, 'unvalidated');
  assert.deepEqual(catalog.coordinateSystem, entry.pins.coordinateSystem);
  assert.deepEqual(catalog.structures.find(row => row.id === entry.identity.id), entry.identity);
}

let changed = 0, preserved = 0, changedWorksheets = 0, preservedWorksheets = 0;
let malformed = 0, stale = 0, storageCalls = 0;
for (const structure of catalog.structures) {
  for (const tab of now.contentTabs) {
    const oldLesson = previous.bodyLesson(structure, tab);
    const lesson = now.bodyLesson(structure, tab);
    const entry = byId.get(structure.id);
    if (entry && tab === 'quiz') {
      const question = entry.spec.questions[entry.group];
      assert.equal(oldLesson.readiness, 'generated-identification', structure.id);
      assert.deepEqual(lesson, now[entry.spec.helper](structure, tab));
      assert.equal(lesson.readiness, 'draft');
      assert.equal(lesson.body, question.body);
      assert.deepEqual(lesson.bullets, [...question.choices]);
      assert.equal(lesson.correctAnswer, question.correctAnswer);
      assert.equal(lesson.explanation, question.explanation);
      assert.deepEqual(lesson.citations, [...question.references]);
      assert.match(lesson.note, /revision-bound radiologist review pending/i);
      const { readiness, ...shown } = lesson;
      assert.deepEqual(now.bodyContent(structure, tab), shown);
      changed++;
    } else {
      assert.deepEqual(lesson, oldLesson, `${structure.id}:${tab}`);
      for (const spec of specs) assert.equal(now[spec.helper](structure, tab), undefined);
      preserved++;
    }
  }
  const oldPacket = await previous.bodyReviewMaterial(structure.id);
  const packet = await now.bodyReviewMaterial(structure.id);
  assert.equal(packet.approval, false);
  if (byId.has(structure.id)) {
    for (const key of ['source', 'reasoning', 'guidedTours', 'checklist', 'atlasLink', 'limits'])
      assert.deepEqual(packet[key], oldPacket[key], `${structure.id}:${key}`);
    assert.equal(packet.fingerprints.source, oldPacket.fingerprints.source);
    assert.notEqual(packet.fingerprints.teaching, oldPacket.fingerprints.teaching);
    assert.notEqual(packet.materialHash, oldPacket.materialHash);
    assert.deepEqual(packet.topics.find(topic => topic.tab === 'quiz'), {
      tab: 'quiz', ...now.bodyLesson(structure, 'quiz'),
    });
    assert.deepEqual(await now.parseBodyReviewResponse(packet, structure.id), packet);
    assert.equal(await now.parseBodyReviewResponse(oldPacket, structure.id), null);
    for (const edit of [
      value => { value.topics.find(topic => topic.tab === 'quiz').body += ' foreign'; },
      value => { value.topics.find(topic => topic.tab === 'quiz').bullets[0] += ' foreign'; },
      value => { value.topics.find(topic => topic.tab === 'quiz').correctAnswer += ' foreign'; },
      value => { value.topics.find(topic => topic.tab === 'quiz').explanation += ' foreign'; },
      value => { value.topics.find(topic => topic.tab === 'quiz').citations = ['https://foreign.example']; },
      value => { value.topics.find(topic => topic.tab === 'quiz').readiness = 'approved'; },
      value => { value.topics.splice(value.topics.findIndex(topic => topic.tab === 'quiz'), 1); },
    ]) {
      const forged = structuredClone(packet);
      edit(forged);
      assert.equal(await now.parseBodyReviewResponse(forged, structure.id), null);
      malformed++;
    }
    const oldContext = await previous.bodyReviewContext(structure.id);
    const context = await now.bodyReviewContext(structure.id);
    assert.equal(context.sourceHash, oldContext.sourceHash);
    assert.notEqual(context.revisions.teaching, oldContext.revisions.teaching);
    const decision = {
      catalogScope: context.catalogScope, structureId: structure.id, track: 'teaching',
      expectedVersion: 0, materialHash: context.materialHash,
      revisionHash: context.revisions.teaching, checklistVersion: context.checklistVersion,
      draft: now.blankBodyReview(context, 'teaching'),
    };
    for (const staleHashes of [
      { materialHash: oldContext.materialHash, revisionHash: oldContext.revisions.teaching },
      { materialHash: oldContext.materialHash },
      { revisionHash: oldContext.revisions.teaching },
    ]) {
      const response = await now.postBodyDecision(new Request('https://atlas.test/api/body-decisions', {
        method: 'POST', headers: { origin: 'https://atlas.test', 'content-type': 'application/json',
          'oai-authenticated-user-id': 'SYNTHETIC_CRANIAL_LANDMARK_QUIZ' },
        body: JSON.stringify({ ...decision, ...staleHashes }),
      }), { prepare() { storageCalls++; throw Error('Stale decision reached storage'); } });
      assert.equal(response.status, 409);
      stale++;
    }
    changedWorksheets++;
  } else {
    assert.deepEqual(packet, oldPacket, `${structure.id}: review packet`);
    preservedWorksheets++;
  }
}
assert.equal(changed, 7);
assert.equal(preserved, 9929);
assert.equal(changedWorksheets, 7);
assert.equal(preservedWorksheets, 1097);
assert.equal(malformed, 49);
assert.equal(stale, 21);
assert.equal(storageCalls, 0);

const pathsWhere = (value, predicate, path = []) => [
  ...(predicate(value) ? [path] : []),
  ...(value && typeof value === 'object'
    ? Object.entries(value).flatMap(([key, child]) => pathsWhere(child, predicate, [...path, key])) : []),
];
const at = (value, path) => path.reduce((part, key) => part[key], value);
let refusedIdentities = 0;
for (const { identity, spec } of selected) {
  const lesson = now[spec.helper](identity, 'quiz');
  const clean = structuredClone(lesson);
  lesson.bullets.push('foreign');
  lesson.citations.push('https://foreign.example');
  assert.deepEqual(now[spec.helper](identity, 'quiz'), clean, 'Fresh lesson arrays');
  for (const path of pathsWhere(identity, value => value === null || typeof value !== 'object')) {
    const invalid = structuredClone(identity);
    const parent = at(invalid, path.slice(0, -1));
    const key = path.at(-1), original = parent[key];
    parent[key] = typeof original === 'string' ? `${original}-foreign`
      : typeof original === 'number' ? original + 0.01
        : original === null ? 'foreign' : !original;
    assert.equal(now[spec.helper](invalid, 'quiz'), undefined, path.join('.'));
    refusedIdentities++;
  }
  for (const path of pathsWhere(identity, Array.isArray)) {
    const invalid = structuredClone(identity);
    at(invalid, path).push('foreign');
    assert.equal(now[spec.helper](invalid, 'quiz'), undefined, path.join('.'));
    refusedIdentities++;
  }
  for (const path of pathsWhere(identity, value => value && typeof value === 'object' && !Array.isArray(value))) {
    const invalid = structuredClone(identity);
    at(invalid, path).unexpected = true;
    assert.equal(now[spec.helper](invalid, 'quiz'), undefined, path.join('.') || '<root>');
    refusedIdentities++;
  }
}

for (const bundle of catalog.bundles) {
  const path = `public${bundle.url.split('?')[0]}`;
  const bytes = readFileSync(path);
  assert.equal(sha256(bytes), bundle.sha256, path);
  assert.deepEqual(bytes, fromBaseline(path), `${path} remains unchanged`);
}

// Exercise the shipped learner component and the QuizNotes lazy-load callback.
const require = createRequire(import.meta.url);
const React = require('react');
const render = require('react-dom/server').renderToStaticMarkup;
const component = await componentBuild({ stdin: { contents: "export {StructureQuickCheck} from './app/structure-quick-check';export {QuizNotes,AtlasWorkspace} from './app/atlas-workspace';", resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, platform: 'node', format: 'cjs', write: false });
const load = react => {
  const scope = { exports: {} };
  runInNewContext(component.outputFiles[0].text, { module: scope, exports: scope.exports, structuredClone,
    require: id => id === 'react' ? react : id === 'next/link' ? () => { throw Error('Unrelated Next Link must not render'); } : require(id), console });
  return scope.exports;
};
const actual = load(React);
const walk = (node, found = []) => {
  if (React.isValidElement(node)) { found.push(node); React.Children.forEach(node.props.children, child => walk(child, found)); }
  return found;
};
const nodeText = node => typeof node === 'string' ? node : !node ? '' : Array.isArray(node) ? node.map(nodeText).join('') : nodeText(node.props?.children);
let states = [], refs = [], cursor = 0, refCursor = 0, active = false;
const focus = { target: null };
const shim = { ...React, useContext: () => ({ exam: false }), useId: () => active ? 'cranial-landmark-check' : React.useId(),
  useState(initial) { if (!active) return React.useState(initial); const index = cursor++; if (!(index in states)) states[index] = initial; return [states[index], value => { states[index] = value; }]; },
  useRef(initial) { if (!active) return React.useRef(initial); const index = refCursor++; return refs[index] ?? (refs[index] = { current: initial }); },
};
const events = load(shim);
let rendered = 0, interacted = 0;
for (const { identity } of selected) {
  const lesson = now.bodyLesson(identity, 'quiz');
  const props = { question: lesson.body, choices: lesson.bullets, correctAnswer: lesson.correctAnswer, explanation: lesson.explanation };
  const directHtml = render(React.createElement(actual.StructureQuickCheck, props));
  assert.equal((directHtml.match(/type="radio"/g) || []).length, 4);
  assert(directHtml.includes('<fieldset'));
  assert.match(directHtml, /<button[^>]*disabled=""[^>]*>Check answer/);
  assert(!directHtml.includes('Correct answer:'));
  assert(!directHtml.includes('answer key is missing'));
  const attempt = events.StructureQuickCheck(props);
  assert.equal(attempt.key, JSON.stringify(props));
  assert.notEqual(events.StructureQuickCheck({ ...props, explanation: props.explanation + ' revised' }).key, attempt.key);
  states = []; refs = []; cursor = 0; active = true;
  let note = events.QuizNotes({ structure: identity }); active = false;
  assert.equal(note.type, 'details');
  note.props.onToggle({ currentTarget: { open: true } });
  cursor = 0; active = true; note = events.QuizNotes({ structure: identity }); active = false;
  const lazy = walk(note).find(node => typeof node.type === 'function' && node.type.name === 'LazyBodyTeaching');
  assert(lazy?.props.enabled);
  const loaded = lazy.props.children({ bodyContent: now.bodyContent });
  const child = walk(loaded).find(node => typeof node.type === 'function' && node.type.name === 'StructureQuickCheck');
  assert(child); assert.equal(child.key, identity.id);
  assert.deepEqual(JSON.parse(JSON.stringify(child.props)), props);
  assert.deepEqual(walk(loaded).filter(node => node.type === 'a').map(node => node.props.href), lesson.citations);
  const html = render(React.createElement(actual.AtlasWorkspace, { exam: false }, React.createElement(actual.QuizNotes, { structure: identity })));
  assert(html.includes('atlas-quiz-notes'));
  const examHtml = render(React.createElement(actual.AtlasWorkspace, { exam: true }, React.createElement(actual.QuizNotes, { structure: identity })));
  assert(!examHtml.includes('atlas-quiz-notes')); rendered++;
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
  redraw(); assert.equal(button('Check answer').props.disabled, true);
  const correct = props.choices.indexOf(props.correctAnswer);
  answer(correct); assert(nodeText(tree).includes('Correct. Correct answer: ' + props.correctAnswer));
  assert(nodeText(tree).includes(props.explanation)); assert.equal(focus.target, 'feedback');
  button('Practise again').props.onClick(); redraw(); assert.equal(focus.target, 'first-radio');
  assert(radios().every(node => !node.props.checked));
  answer((correct + 1) % 4); assert(nodeText(tree).includes('Incorrect. Correct answer: ' + props.correctAnswer));
  button('Try again').props.onClick(); redraw(); assert.equal(focus.target, 'first-radio');
  assert(radios().every(node => !node.props.checked)); interacted++;
}
assert.equal(rendered, 7);
assert.equal(interacted, 7);
console.log(JSON.stringify({ baseline, changed, preserved, changedWorksheets, preservedWorksheets, refusedIdentities,
  malformedPacketsRefused: malformed, staleRefusalsBeforeStorage: stale, storageCalls,
  sourceBundlesUnchanged: catalog.bundles.length, rendered, interacted, clinicalApproval: false }));
