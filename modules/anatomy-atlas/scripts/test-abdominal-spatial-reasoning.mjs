import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, relative } from 'node:path';
import { runInNewContext } from 'node:vm';
import { fileURLToPath } from 'node:url';
import { build } from './workspace-component-test-build.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const baseline = 'f89b6c01aec40fba4de81e26ec433ef4fe2b5e96';
const completedCommit = '61ff057d5204caaaa4be654bacb371de7de8f038';
const read = path => readFile(new URL(path, new URL('../', import.meta.url)), 'utf8');
const old = path => execFileSync('git', ['show', `${baseline}:${path}`], { cwd: root, encoding: 'utf8', maxBuffer: 32e6 });
const atCommit = (commit, path) => execFileSync('git', ['show', `${commit}:${path}`], { cwd: root, encoding: 'utf8', maxBuffer: 32e6 });
const same = (actual, expected, message) => assert.deepEqual(structuredClone(actual), structuredClone(expected), message);
const entrypoint = `export * from './lib/reasoning-questions';
export * from './lib/abdominal-spatial-reasoning';
export * from './lib/atlas-practice';
export * from './lib/body-review-material';
export * from './lib/body-review-context';
export * from './lib/body-review-decisions';
export * from './lib/body-review-response';
export * from './lib/body-review-api';
export * from './lib/body-review-display-integrity';
export { bodyDisplayCatalog } from './lib/body-display-catalog';
export { ReasoningFeedback } from './app/reasoning-feedback';`;
async function load(epoch = 'current') {
  const contents = epoch === 'baseline' ? entrypoint.replace("export * from './lib/abdominal-spatial-reasoning';", '') : entrypoint;
  const result = await build({
    stdin: { contents, resolveDir: root, loader: 'ts' },
    bundle: true, write: false, format: 'cjs', platform: 'node', packages: 'external', jsx: 'automatic',
    plugins: epoch !== 'current' ? [{ name: 'immutable-abdominal-spatial-closure', setup(api) {
      api.onLoad({ filter: /\.(?:ts|tsx|json)$/ }, args => {
        const path = relative(root, args.path).replaceAll('\\', '/');
        return { contents: atCommit(epoch === 'baseline' ? baseline : completedCommit, path), loader: path.endsWith('.json') ? 'json' : path.endsWith('.tsx') ? 'tsx' : 'ts', resolveDir: dirname(args.path) };
      });
    } }] : [],
  });
  const module = { exports: {} }, require = createRequire(new URL('../package.json', import.meta.url));
  runInNewContext(result.outputFiles[0].text, { module, exports: module.exports, require, crypto, TextEncoder, TextDecoder, Request, Response, structuredClone, URL, URLSearchParams });
  return module.exports;
}

const previous = await load('baseline'), completed = await load('completed'), current = await load();
const catalog = current.bodyDisplayCatalog(JSON.parse(await read('public/models/bodyparts3d/full-body/catalog.json')));
const pins = JSON.parse(await read('content/abdominal-spatial-reasoning-pins.json'));
const expected = [
  ['abdominal-spatial-liver', [['FMA7197', 'unpaired', pins.entries[0].identity.sources.map(s => s.file)]]],
  ['abdominal-spatial-pancreas', [['FMA7198', 'unpaired', ['FJ1895', 'FJ1896', 'FJ2630']]]],
  ['abdominal-spatial-kidney', [['FMA7204', 'right', ['FJ3147']], ['FMA7205', 'left', ['FJ3145']]]],
  ['abdominal-spatial-adrenal', [['FMA15629', 'right', ['FJ3130']], ['FMA15630', 'left', ['FJ3129']]]],
];
assert.equal(pins.parentCommit, baseline);
assert.equal(previous.reasoningConcepts.length, 186);
assert.equal(catalog.structures.filter(previous.reasoningConceptFor).length, 337);
same(current.reasoningConcepts.slice(0, 186), previous.reasoningConcepts, 'All 186 prior concepts and order retained');
same(current.reasoningConcepts.slice(186).map(c => c.key), expected.map(([key]) => key));
same(current.reasoningConcepts.slice(186), completed.reasoningConcepts.slice(186), 'Current abdominal spatial concepts retain the completed transition');
assert.equal(current.reasoningConcepts.length, 190);
assert.equal(catalog.structures.filter(current.reasoningConceptFor).length, 343);
assert.equal(pins.entries.length, 6);
same(catalog.coordinateSystem, pins.coordinateSystem);
assert.equal(catalog.sourceVersion, pins.sourceVersion);
same(pins.entries.map(e => [e.key, e.identity.fmaId, e.identity.laterality, e.identity.sources.map(s => s.file)]),
  expected.flatMap(([key, bindings]) => bindings.map(([fma, side, files]) => [key, fma, side, files])));
assert.equal(new Set(pins.entries.map(e => e.identity.id)).size, 6);
for (const path of [
  'public/models/bodyparts3d/full-body/catalog.json', 'lib/atlas-practice.ts', 'lib/anatomy-practice.ts',
  'app/reasoning-feedback.tsx', 'package-lock.json',
]) assert.equal(await read(path), old(path), `Geometry/engine/feedback/dependencies unchanged: ${path}`);
for (const bundle of pins.bundles) {
  const assetPath = new URL(bundle.url, 'https://atlas.example').pathname;
  assert(assetPath.startsWith('/models/bodyparts3d/'));
  const bytes = await readFile(new URL(`public${assetPath}`, new URL('../', import.meta.url)));
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256);
  same(catalog.bundles.find(b => b.id === bundle.id), bundle);
}
const concepts = current.reasoningConcepts.slice(186);
const distractors = [
  ['abdominal-spatial-pancreas', 'abdominal-stomach', 'abdominal-gallbladder'],
  ['abdominal-spatial-liver', 'abdominal-stomach', 'abdominal-spleen'],
  ['abdominal-spatial-adrenal', 'pelvic-ureter'],
  ['abdominal-spatial-kidney', 'pelvic-ureter'],
];
for (const [index, [key, bindings]] of expected.entries()) {
  const concept = concepts[index];
  same(concept.bindings.map(b => [b.fma, b.side, b.files ?? [b.file]]), bindings);
  assert.equal(concept.key, key); assert.equal(concept.region, 'abdomen');
  assert.equal(concept.sourceTissue, 'organ');
  assert.equal(concept.sourceTree, index < 3 ? 'partof' : 'isa');
  same(concept.sourceRegions, ['abdomen']);
  assert.equal(concept.readiness, 'draft'); assert.equal(concept.revision, 1);
  assert(concept.prompt.trim() && concept.explanation.trim());
  assert(concept.explanation.includes('gross-anatomy groups') && concept.explanation.includes('Radiologist review pending'));
  same(concept.distractors, distractors[index]);
  for (const ref of concept.references) {
    const url = new URL(ref.url);
    assert.equal(url.protocol, 'https:'); assert.equal(url.hostname, 'anatomy.ttuhscep.edu');
  }
}
const referenceWords = new Map();
for (const concept of concepts) for (const reference of concept.references)
  referenceWords.set(reference.url, (referenceWords.get(reference.url) ?? 0) + `${concept.prompt} ${concept.explanation}`.trim().split(/\s+/).length);
for (const [url, count] of referenceWords) assert(count <= 180, `Original wording budget for ${url}: ${count}`);

const loaded = catalog.bundles.map(b => b.id);
const create = (items, target, bundles = loaded, options = {}, random = () => 0.314159) =>
  current.createPracticeSession(items, bundles, { id: 1, mode: 'reason', sampling: 'all', count: 1, retryIds: [target], ...options }, random);
const require = createRequire(new URL('../package.json', import.meta.url));
const { createElement } = require('react'), { renderToStaticMarkup } = require('react-dom/server');
const render = session => renderToStaticMarkup(createElement(current.ReasoningFeedback, { session }));
const targets = new Set(pins.entries.map(e => e.identity.id));
const leaves = (value, path = []) => value === null || typeof value !== 'object'
  ? [path] : Object.entries(value).flatMap(([key, child]) => leaves(child, [...path, key]));
let sourceMutations = 0, answerCases = 0, tamperedPackets = 0, changed = 0, unchanged = 0, oldQuestions = 0, topicPlacements = 0;
for (const entry of pins.entries) {
  const target = catalog.structures.find(s => s.id === entry.identity.id);
  assert(target); same(target, entry.identity, `Pinned complete displayed identity: ${entry.key}`);
  assert.equal(current.abdominalSpatialReasoningSourceMatches(target, entry.key), true);
  assert.equal(current.reasoningConceptFor(target)?.key, entry.key);
  for (const path of leaves(target)) {
    const bad = structuredClone(target); let object = bad;
    for (const step of path.slice(0, -1)) object = object[step];
    const field = path.at(-1), value = object[field];
    object[field] = typeof value === 'number' ? value + 0.01 : typeof value === 'boolean' ? !value : `${value}-foreign`;
    assert.equal(current.abdominalSpatialReasoningSourceMatches(bad, entry.key), false, `Reject ${path.join('.')}`);
    assert.equal(current.reasoningConceptFor(bad), undefined, `Resolver rejects ${path.join('.')}`);
    sourceMutations++;
  }
  for (const bad of [{ ...target, unexpectedSourceField: true }, (() => { const x = structuredClone(target); delete x.coverageNote; return x; })()]) {
    assert.equal(current.abdominalSpatialReasoningSourceMatches(bad, entry.key), false);
    assert.equal(current.reasoningConceptFor(bad), undefined); sourceMutations++;
  }
  for (const scope of [catalog.structures, catalog.structures.filter(s => s.regions.includes('abdomen'))]) {
    for (const random of [() => 0, () => 0.314159, () => 0.999999]) {
      const session = create(scope, target.id, loaded, {}, random);
      assert(session, `Playable: ${entry.key}`);
      const q = session.questions[0];
      assert.equal(q.target, target.id); assert.equal(q.reasoning.key, entry.key);
      assert.equal(q.choices.length, target.laterality === 'unpaired' ? 4 : 3);
      assert.equal(new Set(q.choices).size, q.choices.length);
      for (const id of q.choices) {
        const selected = scope.find(s => s.id === id); assert(selected);
        assert.equal(selected.laterality, target.laterality);
        if (id !== target.id) assert(concepts.find(c => c.key === entry.key).distractors.includes(current.reasoningConceptFor(selected)?.key));
      }
      assert.equal(render(session), '');
      const action = { sessionId: session.id, index: 0 }, wrongId = q.choices.find(id => id !== target.id);
      same(current.practiceReducer(session, { type: 'answer', ...action, chosen: 'foreign-pick' }), session);
      same(current.practiceReducer(session, { type: 'answer', ...action, sessionId: 99, chosen: target.id }), session);
      const correct = current.practiceReducer(session, { type: 'answer', ...action, chosen: target.id });
      assert.equal(current.practiceScore(correct), 1);
      same(current.practiceReducer(correct, { type: 'answer', ...action, chosen: wrongId }), correct);
      assert(render(correct).includes('Sources &amp; scope') && render(correct).includes('review pending'));
      const incorrect = current.practiceReducer(session, { type: 'answer', ...action, chosen: wrongId });
      assert.equal(current.practiceScore(incorrect), 0);
      const finished = current.practiceReducer(incorrect, { type: 'next', ...action });
      same(current.missedPracticeIds(finished.responses), [target.id]);
      assert.equal(create(scope, target.id, loaded, { retryIds: current.missedPracticeIds(finished.responses) })?.questions[0].target, target.id);
      answerCases++;
    }
  }
  assert.equal(create(catalog.structures.filter(s => s.id !== target.id), target.id), null);
  assert.equal(create(catalog.structures, target.id, loaded.filter(id => id !== target.bundle)), null);
  assert.equal(create([target], target.id), null);
  const session = create(catalog.structures, target.id);
  assert.equal(create(catalog.structures, target.id, loaded, { sampling: 'focus', focusIds: session.questions[0].choices })?.questions[0].target, target.id);
  assert.equal(create(catalog.structures, target.id, loaded, { sampling: 'focus', focusIds: [target.id] }), null);
  const material = await current.bodyReviewMaterial(target.id);
  assert(material?.reasoning);
  same(material.reasoning, (await completed.bodyReviewMaterial(target.id)).reasoning,
    `${entry.key}: current reasoning retains completed transition`);
  const parsed = await current.parseBodyReviewResponse(material, target.id);
  if (!parsed) console.error(JSON.stringify({ failedReview: entry.key,
    displayMatches: await current.bodyReviewDisplayMatches(material, target.id),
    choices: material.reasoning.choices.map(c => [c.id, c.laterality, c.regions, c.sources.length]) }));
  assert(parsed);
  for (const edit of [
    p => { delete p.reasoning; }, p => { p.reasoning.readiness = 'approved'; }, p => { p.reasoning.revision = 0; },
    p => { p.reasoning.references[0].url = 'javascript:alert(1)'; },
    p => { p.reasoning.choices.push(p.reasoning.choices[0]); },
    p => { p.reasoning.choices.find(c => c.id === target.id).sources[0].sha256 = '0'.repeat(64); },
    p => { p.reasoning.answerId = p.reasoning.choices.find(c => c.id !== target.id).id; },
  ]) {
    const copy = structuredClone(material); edit(copy);
    assert.equal(await current.parseBodyReviewResponse(copy, target.id), null); tamperedPackets++;
  }
  const before = await previous.bodyReviewContext(target.id), after = await current.bodyReviewContext(target.id);
  assert(current.bodyReviewStale({ catalogScope: before.catalogScope, structureId: target.id, track: 'teaching', revisionHash: before.revisions.teaching, checklistVersion: before.checklistVersion }, after));
  assert.equal(after.revisions.imaging, null);
  let storageCalls = 0;
  const stalePacket = { catalogScope: before.catalogScope, structureId: target.id, track: 'teaching', expectedVersion: 0,
    materialHash: before.materialHash, revisionHash: before.revisions.teaching, checklistVersion: before.checklistVersion,
    draft: current.blankBodyReview(before, 'teaching') };
  const request = new Request('https://atlas.example/api/body-review/decisions', { method: 'POST',
    headers: { 'oai-authenticated-user-id': 'synthetic-reviewer', 'content-type': 'application/json', origin: 'https://atlas.example' },
    body: JSON.stringify(stalePacket) });
  const response = await current.postBodyDecision(request, { prepare() { storageCalls++; throw Error('Stale packet touched storage'); } });
  assert.equal(response.status, 409); assert.equal(storageCalls, 0);
}
for (const structure of catalog.structures) {
  const before = await previous.bodyReviewMaterial(structure.id), after = await completed.bodyReviewMaterial(structure.id);
  same(after.source, before.source); same(after.topics, before.topics); topicPlacements += after.topics.length;
  same(after.guidedTours, before.guidedTours); same(after.fingerprints.source, before.fingerprints.source);
  assert.equal(after.approval, false); assert.equal(after.status, 'worksheet-not-submitted');
  if (targets.has(structure.id)) {
    assert.equal(before.reasoning, null); assert(after.reasoning);
    assert.notEqual(after.fingerprints.teaching, before.fingerprints.teaching); changed++;
  } else {
    same(after.reasoning, before.reasoning, `${structure.id}: prior question preserved`);
    same(after.fingerprints.teaching, before.fingerprints.teaching, `${structure.id}: teaching fingerprint preserved`); unchanged++;
  }
  if (previous.reasoningConceptFor(structure)) {
    const completedSession = completed.createPracticeSession(catalog.structures, loaded,
      { id: 1, mode: 'reason', sampling: 'all', count: 1, retryIds: [structure.id] }, () => 0.314159);
    same(completedSession, previous.createPracticeSession(catalog.structures, loaded,
      { id: 1, mode: 'reason', sampling: 'all', count: 1, retryIds: [structure.id] }, () => 0.314159),
    `${structure.id}: prior actual session unchanged`); oldQuestions++;
    same(create(catalog.structures, structure.id), completedSession,
      `${structure.id}: current prior session unchanged`);
  }
}
assert.equal(changed, 6); assert.equal(unchanged, 1098); assert.equal(topicPlacements, 9936); assert.equal(oldQuestions, 337);
console.log(JSON.stringify({ baseline, completedCommit, fullCountsScope: 'baseline-to-completed', baselineConceptsSha256: createHash('sha256').update(JSON.stringify(previous.reasoningConcepts)).digest('hex'),
  concepts: current.reasoningConcepts.length, boundRepresentations: 343, newConcepts: 4,
  newRootTargets: changed, priorQuestionsPreserved: oldQuestions, unchangedRootTeaching: unchanged,
  unchangedTopicPlacements: topicPlacements, referenceWords: Object.fromEntries(referenceWords),
  sourceMutations, answerCases, tamperedPackets, clinicalApproval: false, browserAcceptance: false }));
