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
const baseline = '456e6d7358e0648b8d7bc8f0f706a4c74f14c5bd';
// Replay the completed brain-connections transition without treating later,
// independently checked teaching batches as part of that original milestone.
const completedEpoch = 'c3485ce80f2db471e0a12c678a9632f8ad7d3607';
const read = path => readFile(new URL(path, new URL('../', import.meta.url)), 'utf8');
const old = path => execFileSync('git', ['show', `${baseline}:${path}`], { cwd: root, encoding: 'utf8', maxBuffer: 32e6 });
const same = (actual, expected, message) => assert.deepEqual(structuredClone(actual), structuredClone(expected), message);
const entrypoint = `export * from './lib/reasoning-questions';
export * from './lib/atlas-practice';
export * from './lib/body-review-material';
export * from './lib/body-review-context';
export * from './lib/body-review-decisions';
export * from './lib/body-review-response';
export * from './lib/body-review-api';
export * from './lib/brain-connections-reasoning';
export { bodyDisplayCatalog } from './lib/body-display-catalog';
export { ReasoningFeedback } from './app/reasoning-feedback';`;
async function load(previous = false) {
  const revision = previous ? baseline : completedEpoch;
  const contents = previous ? entrypoint.replace("export * from './lib/brain-connections-reasoning';", '') : entrypoint;
  const result = await build({
    stdin: { contents, resolveDir: root, loader: 'ts' },
    bundle: true, write: false, format: 'cjs', platform: 'node', packages: 'external', jsx: 'automatic',
    plugins: [{ name: 'immutable-brain-connections-epoch', setup(api) {
      api.onLoad({ filter: /\.(?:ts|tsx|json)$/ }, args => {
        const path = relative(root, args.path).replaceAll('\\', '/');
        return { contents: execFileSync('git', ['show', `${revision}:${path}`], { cwd: root, encoding: 'utf8', maxBuffer: 32e6 }), loader: path.endsWith('.json') ? 'json' : path.endsWith('.tsx') ? 'tsx' : 'ts', resolveDir: dirname(args.path) };
      });
    } }],
  });
  const module = { exports: {} }, require = createRequire(new URL('../package.json', import.meta.url));
  runInNewContext(result.outputFiles[0].text, { module, exports: module.exports, require, crypto, TextEncoder, TextDecoder, Request, Response, structuredClone, URL, URLSearchParams });
  return module.exports;
}

const previous = await load(true), current = await load();
const raw = JSON.parse(await read('public/models/bodyparts3d/full-body/catalog.json'));
const catalog = current.bodyDisplayCatalog(raw);
const pins = JSON.parse(await read('content/brain-connections-reasoning-pins.json'));
const expected = [
  ['brain-connections-amygdala', [['FMA72832', 'right', 'FJ1829'], ['FMA72833', 'left', 'FJ1753']]],
  ['brain-connections-fornix', [['FMA72924', 'right', 'FJ1804'], ['FMA72925', 'left', 'FJ1756']]],
  ['brain-connections-anterior-commissure', [['FMA61961', 'midline', 'FJ1734']]],
  ['brain-connections-corpus-callosum', [['FMA86464', 'midline', 'FJ1742']]],
];
assert.equal(pins.parentCommit, baseline);
assert.equal(previous.reasoningConcepts.length, 182);
assert.equal(catalog.structures.filter(previous.reasoningConceptFor).length, 331);
same(current.reasoningConcepts.slice(0, 182), previous.reasoningConcepts, 'Every prior concept and its order is retained');
same(current.reasoningConcepts.slice(182).map(c => c.key), expected.map(([key]) => key));
assert.equal(current.reasoningConcepts.length, 186);
assert.equal(catalog.structures.filter(current.reasoningConceptFor).length, 337);
assert.equal(pins.entries.length, 6);
same(catalog.coordinateSystem, pins.coordinateSystem);
assert.equal(catalog.sourceVersion, pins.sourceVersion);
same(pins.entries.map(e => [e.key, e.identity.fmaId, e.identity.laterality, e.identity.sources.map(s => s.file)]),
  expected.flatMap(([key, bindings]) => bindings.map(([fma, side, file]) => [key, fma, side, [file]])));
assert.equal(new Set(pins.entries.map(e => e.identity.id)).size, 6);

for (const path of [
  'public/models/bodyparts3d/full-body/catalog.json', 'lib/atlas-practice.ts', 'lib/anatomy-practice.ts',
  'app/reasoning-feedback.tsx', 'package-lock.json',
]) assert.equal(await read(path), old(path), `Geometry/engine/feedback/dependencies unchanged: ${path}`);
for (const bundle of pins.bundles) {
  const assetPath = new URL(bundle.url, 'https://atlas.example').pathname;
  assert(assetPath.startsWith('/models/bodyparts3d/'));
  const bytes = await readFile(new URL(`public${assetPath}`, new URL('../', import.meta.url)));
  assert.equal(bytes.length, bundle.bytes, `Model byte count: ${bundle.id}`);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256, `Model hash: ${bundle.id}`);
  same(catalog.bundles.find(b => b.id === bundle.id), bundle, `Display bundle: ${bundle.id}`);
}

const concepts = current.reasoningConcepts.slice(182);
for (const [key, bindings] of expected) {
  const concept = concepts.find(c => c.key === key);
  assert(concept);
  same(concept.bindings.map(b => [b.fma, b.side, b.file]), bindings, `${key}: exact authored bindings`);
  assert.equal(concept.sourceTissue, 'neural-organ');
  assert.equal(concept.region, 'head-neck');
  assert.equal(concept.readiness, 'draft');
  assert.equal(concept.revision, 1);
  assert(concept.prompt.trim() && concept.explanation.trim());
  assert.equal(new Set(concept.distractors).size, concept.distractors.length);
  assert(!concept.distractors.includes(key));
  same(concept.distractors, key.endsWith('amygdala') || key.endsWith('fornix')
    ? [key.endsWith('amygdala') ? 'brain-connections-fornix' : 'brain-connections-amygdala', 'deep-brain-caudate', 'deep-brain-thalamus']
    : [key.endsWith('anterior-commissure') ? 'brain-connections-corpus-callosum' : 'brain-connections-anterior-commissure']);
  for (const ref of concept.references) {
    const url = new URL(ref.url);
    assert.equal(url.protocol, 'https:');
    assert(url.hostname && !url.username && !url.password);
  }
}
const referenceWords = new Map();
for (const concept of concepts) for (const reference of concept.references)
  referenceWords.set(reference.url, (referenceWords.get(reference.url) ?? 0) + `${concept.prompt} ${concept.explanation}`.trim().split(/\s+/).length);
for (const [url, count] of referenceWords) assert(count <= 200, `Original wording budget for ${url}: ${count}`);

const isa = (await read('LICENSES/bodyparts3d-v4-index/isa_element_parts.txt')).trim().split(/\r?\n/).map(line => line.split('\t'));
const loaded = catalog.bundles.map(bundle => bundle.id);
const create = (items, target, bundles = loaded, options = {}, random = () => 0.314159) =>
  current.createPracticeSession(items, bundles, { id: 1, mode: 'reason', sampling: 'all', count: 1, retryIds: [target], ...options }, random);
const require = createRequire(new URL('../package.json', import.meta.url));
const { createElement } = require('react'), { renderToStaticMarkup } = require('react-dom/server');
const render = session => renderToStaticMarkup(createElement(current.ReasoningFeedback, { session }));
const targets = new Set(pins.entries.map(entry => entry.identity.id));
const leaves = (value, path = []) => value === null || typeof value !== 'object'
  ? [path] : Object.entries(value).flatMap(([key, child]) => leaves(child, [...path, key]));
let sourceMutations = 0, answerCases = 0, tamperedPackets = 0, changed = 0, unchanged = 0, oldQuestions = 0, topicPlacements = 0;
for (const entry of pins.entries) {
  const target = catalog.structures.find(s => s.id === entry.identity.id);
  assert(target, `Missing target ${entry.key}`);
  same(target, entry.identity, `Complete pinned display identity: ${entry.key}`);
  same(isa.filter(row => row[0] === target.fmaId).map(row => row[2]), target.sources.map(s => s.file), `Official ordered OBJ membership: ${entry.key}`);
  assert.equal(target.system, 'nerves');
  assert.equal(target.category, 'organ');
  assert.equal(target.region, 'head-neck');
  same(target.regions, ['head-neck']);
  assert.equal(target.sourceTree, 'isa');
  assert.equal(current.brainConnectionsReasoningSourceMatches(target, entry.key), true);
  const concept = current.reasoningConceptFor(target);
  assert.equal(concept?.key, entry.key);
  for (const path of leaves(target)) {
    const bad = structuredClone(target);
    let object = bad;
    for (const step of path.slice(0, -1)) object = object[step];
    const field = path.at(-1), value = object[field];
    object[field] = typeof value === 'number' ? value + 0.01 : typeof value === 'boolean' ? !value : `${value}-foreign`;
    assert.equal(current.brainConnectionsReasoningSourceMatches(bad, entry.key), false, `${entry.key}: rejects ${path.join('.')}`);
    assert.equal(current.reasoningConceptFor(bad), undefined, `${entry.key}: resolver rejects ${path.join('.')}`);
    sourceMutations++;
  }
  for (const bad of [{ ...target, unexpectedSourceField: true }, (() => { const x = structuredClone(target); delete x.coverageNote; return x; })()]) {
    assert.equal(current.brainConnectionsReasoningSourceMatches(bad, entry.key), false);
    assert.equal(current.reasoningConceptFor(bad), undefined);
    sourceMutations++;
  }
  for (const scope of [catalog.structures, catalog.structures.filter(s => s.regions.includes('head-neck'))]) {
    for (const random of [() => 0, () => 0.314159, () => 0.999999]) {
      const session = create(scope, target.id, loaded, {}, random);
      assert(session, `Playable with loaded alternatives: ${entry.key}`);
      const q = session.questions[0];
      assert.equal(q.target, target.id);
      assert.equal(q.reasoning.key, entry.key);
      assert.equal(q.choices.length, target.laterality === 'midline' ? 2 : 4);
      assert.equal(new Set(q.choices).size, q.choices.length);
      for (const id of q.choices) {
        const selected = scope.find(s => s.id === id);
        assert(selected);
        assert.equal(selected.laterality, target.laterality);
        if (id !== target.id) assert(concept.distractors.includes(current.reasoningConceptFor(selected)?.key));
      }
      assert.equal(render(session), '', 'No pre-answer feedback');
      const action = { sessionId: session.id, index: 0 }, wrongId = q.choices.find(id => id !== target.id);
      same(current.practiceReducer(session, { type: 'answer', ...action, chosen: 'foreign-pick' }), session, 'Foreign choice refused');
      same(current.practiceReducer(session, { type: 'answer', ...action, sessionId: 99, chosen: target.id }), session, 'Stale answer refused');
      const correct = current.practiceReducer(session, { type: 'answer', ...action, chosen: target.id });
      assert.equal(current.practiceScore(correct), 1);
      same(current.practiceReducer(correct, { type: 'answer', ...action, chosen: wrongId }), correct, 'Answer once');
      assert(render(correct).includes('Sources &amp; scope'));
      assert(render(correct).includes('review pending'));
      const incorrect = current.practiceReducer(session, { type: 'answer', ...action, chosen: wrongId });
      assert.equal(current.practiceScore(incorrect), 0);
      assert(render(incorrect).includes('Sources &amp; scope'));
      const finished = current.practiceReducer(incorrect, { type: 'next', ...action });
      same(current.missedPracticeIds(finished.responses), [target.id]);
      assert.equal(create(scope, target.id, loaded, { retryIds: current.missedPracticeIds(finished.responses) })?.questions[0].target, target.id);
      answerCases++;
    }
  }
  assert.equal(create(catalog.structures.filter(s => s.id !== target.id), target.id), null, 'Hidden target refused');
  assert.equal(create(catalog.structures, target.id, loaded.filter(id => id !== target.bundle)), null, 'Unloaded target refused');
  assert.equal(create([target], target.id), null, 'Target alone has no authored alternative');
  const session = create(catalog.structures, target.id);
  assert.equal(create(catalog.structures, target.id, loaded, { sampling: 'focus', focusIds: session.questions[0].choices })?.questions[0].target, target.id);
  assert.equal(create(catalog.structures, target.id, loaded, { sampling: 'focus', focusIds: [target.id] }), null);
  const material = await current.bodyReviewMaterial(target.id);
  assert(material?.reasoning);
  assert(await current.parseBodyReviewResponse(material, target.id));
  for (const edit of [
    p => { delete p.reasoning; }, p => { p.reasoning.readiness = 'approved'; }, p => { p.reasoning.revision = 0; },
    p => { p.reasoning.references[0].url = 'javascript:alert(1)'; },
    p => { p.reasoning.choices.push(p.reasoning.choices[0]); },
    p => { p.reasoning.choices.find(c => c.id === target.id).sources[0].sha256 = '0'.repeat(64); },
    p => { p.reasoning.choices.find(c => c.id === target.id).name += ' changed'; },
    p => { p.reasoning.answerId = p.reasoning.choices.find(c => c.id !== target.id).id; },
  ]) {
    const copy = structuredClone(material); edit(copy);
    assert.equal(await current.parseBodyReviewResponse(copy, target.id), null, 'Tampered review packet refused');
    tamperedPackets++;
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
  assert.equal(response.status, 409);
  assert.equal(storageCalls, 0);
}

for (const structure of catalog.structures) {
  const before = await previous.bodyReviewMaterial(structure.id), after = await current.bodyReviewMaterial(structure.id);
  same(after.source, before.source, `${structure.id}: source preserved`);
  same(after.topics, before.topics, `${structure.id}: nine topics preserved`);
  topicPlacements += after.topics.length;
  same(after.guidedTours, before.guidedTours);
  same(after.fingerprints.source, before.fingerprints.source);
  assert.equal(after.approval, false);
  assert.equal(after.status, 'worksheet-not-submitted');
  if (targets.has(structure.id)) {
    assert.equal(before.reasoning, null);
    assert(after.reasoning);
    assert.notEqual(after.fingerprints.teaching, before.fingerprints.teaching);
    changed++;
  } else {
    same(after.reasoning, before.reasoning, `${structure.id}: prior question preserved`);
    same(after.fingerprints.teaching, before.fingerprints.teaching, `${structure.id}: teaching fingerprint preserved`);
    unchanged++;
  }
  if (previous.reasoningConceptFor(structure)) {
    same(create(catalog.structures, structure.id), previous.createPracticeSession(catalog.structures, loaded,
      { id: 1, mode: 'reason', sampling: 'all', count: 1, retryIds: [structure.id] }, () => 0.314159),
    `${structure.id}: prior actual session unchanged`);
    oldQuestions++;
  }
}
assert.equal(changed, 6);
assert.equal(unchanged, 1098);
assert.equal(topicPlacements, 9936);
assert.equal(oldQuestions, 331);
console.log(JSON.stringify({ baseline, completedEpoch, scope: 'immutable historical transition; current additions checked separately', baselineConceptsSha256: createHash('sha256').update(JSON.stringify(previous.reasoningConcepts)).digest('hex'),
  concepts: current.reasoningConcepts.length, boundRepresentations: 337,
  newConcepts: 4, newRootTargets: changed, priorQuestionsPreserved: oldQuestions,
  unchangedRootTeaching: unchanged, unchangedTopicPlacements: topicPlacements,
  referenceWords: Object.fromEntries(referenceWords), sourceMutations, answerCases, tamperedPackets,
  clinicalApproval: false, browserAcceptance: false }));
