import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { build } from './workspace-component-test-build.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const parentCommit = 'ed3c8cc0e99f6cf850a915d7a08de2e6489c1b6f';
const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const parent = path => execFileSync('git', ['show', `${parentCommit}:${path}`], {
  cwd: root, encoding: 'utf8', maxBuffer: 32e6,
});
const same = (actual, expected, message) => assert.deepEqual(structuredClone(actual), structuredClone(expected), message);
const entrypoint = `export * from './lib/reasoning-questions';
export * from './lib/ventricular-landmark-reasoning';
export * from './lib/atlas-practice';
export * from './lib/body-review-material';
export * from './lib/body-reasoning-review';
export * from './lib/body-review-response';
export * from './lib/body-review-context';
export * from './lib/body-review-decisions';
export * from './lib/body-review-api';
export { bodyDisplayCatalog } from './lib/body-display-catalog';
export { ReasoningFeedback } from './app/reasoning-feedback';`;
async function load(previous = false) {
  const result = await build({
    stdin: { contents: previous
      ? entrypoint.replace("export * from './lib/ventricular-landmark-reasoning';", '')
      : entrypoint, resolveDir: root, loader: 'ts' },
    bundle: true, write: false, format: 'cjs', platform: 'node',
    packages: 'external', jsx: 'automatic',
    plugins: previous ? [{ name: 'pinned-parent-source', setup(api) {
      api.onLoad({ filter: /\.(?:ts|tsx|json)$/ }, args => {
        const path = relative(root, args.path).replaceAll('\\', '/');
        return { contents: parent(path), loader: path.endsWith('.json') ? 'json' : path.endsWith('.tsx') ? 'tsx' : 'ts', resolveDir: dirname(args.path) };
      });
    } }] : [],
  });
  const module = { exports: {} };
  const require = createRequire(new URL('../package.json', import.meta.url));
  runInNewContext(result.outputFiles[0].text, {
    module, exports: module.exports, require, crypto, TextEncoder, TextDecoder,
    Request, Response, structuredClone, URL, URLSearchParams,
  });
  return module.exports;
}

const previous = await load(true), current = await load();
const rawCatalog = JSON.parse(await read('public/models/bodyparts3d/full-body/catalog.json'));
const catalog = current.bodyDisplayCatalog(rawCatalog);
const pins = JSON.parse(await read('content/ventricular-landmark-reasoning-pins.json'));
const expected = [
  ['ventricular-landmark-choroid-plexus', 'FMA61934', ['FJ1755', 'FJ1803']],
  ['ventricular-landmark-mammillary-body', 'FMA74877', ['FJ1768', 'FJ1815']],
  ['ventricular-landmark-lamina-terminalis', 'FMA61975', ['FJ1764', 'FJ1812']],
];
same(pins.parentCommit, parentCommit);
same(catalog.coordinateSystem, pins.coordinateSystem);
same(catalog.sourceVersion, pins.sourceVersion);
same(current.reasoningConcepts.slice(0, 190), previous.reasoningConcepts,
  'All 190 predecessor definitions and order remain exact');
same(current.reasoningConcepts.slice(190).map(c => c.key), expected.map(x => x[0]));
same(current.ventricularLandmarkReasoningConcepts, current.reasoningConcepts.slice(190));
assert.equal(previous.reasoningConcepts.length, 190);
assert.equal(current.reasoningConcepts.length, 193);
assert.equal(catalog.structures.filter(previous.reasoningConceptFor).length, 343);
assert.equal(catalog.structures.filter(current.reasoningConceptFor).length, 346);
same(pins.entries.map(e => [e.key, e.identity.fmaId, e.identity.sources.map(s => s.file)]), expected);
assert.equal(pins.entries.length, 3);
assert.equal(new Set(pins.entries.map(e => e.identity.id)).size, 3);

for (const path of [
  'public/models/bodyparts3d/full-body/catalog.json', 'lib/atlas-practice.ts',
  'lib/anatomy-practice.ts', 'app/reasoning-feedback.tsx', 'package-lock.json',
]) assert.equal(await read(path), parent(path), `Unchanged source/engine/dependency: ${path}`);
for (const bundle of pins.bundles) {
  const assetPath = new URL(bundle.url, 'https://atlas.example').pathname;
  assert(assetPath.startsWith('/models/bodyparts3d/'));
  const local = new URL(`../public${assetPath}`, import.meta.url);
  assert.equal((await stat(local)).size, bundle.bytes);
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(local)) hash.update(chunk);
  assert.equal(hash.digest('hex'), bundle.sha256);
  same(catalog.bundles.find(b => b.id === bundle.id), bundle);
}
const isa = (await read('LICENSES/bodyparts3d-v4-index/isa_element_parts.txt'))
  .trim().split(/\r?\n/).map(line => line.split('\t'));
const leaves = (value, path = []) => value === null || typeof value !== 'object'
  ? [path] : Object.entries(value).flatMap(([key, child]) => leaves(child, [...path, key]));
const mutate = (value, path) => {
  const copy = structuredClone(value);
  let node = copy;
  for (const segment of path.slice(0, -1)) node = node[segment];
  const key = path.at(-1), before = node[key];
  node[key] = typeof before === 'number' ? before + 0.01
    : typeof before === 'boolean' ? !before : `${before}-foreign`;
  return copy;
};
const loaded = catalog.bundles.map(b => b.id);
const create = (api, items, target, bundles = loaded, options = {}, random = () => 0.314159) =>
  api.createPracticeSession(items, bundles, {
    id: 1, mode: 'reason', sampling: 'all', count: 1, retryIds: [target], ...options,
  }, random);
const require = createRequire(new URL('../package.json', import.meta.url));
const { createElement } = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const feedback = session => renderToStaticMarkup(createElement(current.ReasoningFeedback, { session }));
let mutations = 0, plays = 0;
for (const [index, [key, fma, files]] of expected.entries()) {
  const concept = current.reasoningConcepts[190 + index];
  same(concept.bindings.map(b => [b.fma, b.side, b.files ?? [b.file]]), [[fma, 'midline', files]]);
  assert.equal(concept.region, 'head-neck');
  assert.equal(concept.sourceTissue, 'neural-organ');
  assert.equal(concept.sourceTree, 'isa');
  same(concept.sourceRegions, ['head-neck']);
  assert.equal(concept.readiness, 'draft');
  assert.equal(concept.revision, 1);
  assert(concept.prompt.trim() && concept.explanation.trim());
  assert(concept.explanation.includes('Draft for radiologist review'));
  assert(concept.references.length > 0);
  for (const reference of concept.references) {
    const url = new URL(reference.url);
    assert.equal(url.protocol, 'https:');
    assert(url.hostname && !url.username && !url.password);
  }
  const target = catalog.structures.find(s => s.id === pins.entries[index].identity.id);
  assert(target, `${key}: pin must resolve to a displayed root`);
  same(target, pins.entries[index].identity, `${key}: complete displayed identity`);
  same(isa.filter(row => row[0] === fma).map(row => row[2]), files, `${key}: official ordered ISA files`);
  assert.equal(target.system, 'nerves');
  assert.equal(target.category, 'organ');
  assert.equal(target.region, 'head-neck');
  same(target.regions, ['head-neck']);
  assert.equal(target.sourceTree, 'isa');
  assert.equal(target.laterality, 'midline');
  assert.equal(current.ventricularLandmarkReasoningSourceMatches(target, key), true);
  assert.equal(current.reasoningConceptFor(target)?.key, key);
  for (const path of leaves(target)) {
    const bad = mutate(target, path);
    assert.equal(current.ventricularLandmarkReasoningSourceMatches(bad, key), false, `${key}: ${path.join('.')}`);
    assert.equal(current.reasoningConceptFor(bad), undefined, `${key}: resolver ${path.join('.')}`);
    mutations++;
  }
  for (const bad of [
    { ...target, unexpectedSourceField: true },
    (() => { const copy = structuredClone(target); delete copy.coverageNote; return copy; })(),
    (() => { const copy = structuredClone(target); copy.sources.reverse(); return copy; })(),
    (() => { const copy = structuredClone(target); copy.sources[0].sha256 = '0'.repeat(64); return copy; })(),
  ]) {
    assert.equal(current.ventricularLandmarkReasoningSourceMatches(bad, key), false);
    assert.equal(current.reasoningConceptFor(bad), undefined);
    mutations++;
  }
  for (const scope of [catalog.structures, catalog.structures.filter(s => s.regions.includes('head-neck'))]) {
    for (const random of [() => 0, () => 0.314159, () => 0.999999]) {
      const session = create(current, scope, target.id, loaded, {}, random);
      assert(session, `${key}: available with eligible midline alternatives`);
      const question = session.questions[0];
      assert.equal(question.target, target.id);
      assert.equal(question.reasoning.key, key);
      assert(question.choices.length >= 2);
      assert.equal(new Set(question.choices).size, question.choices.length);
      for (const id of question.choices) {
        const choice = scope.find(s => s.id === id);
        assert(choice);
        assert.equal(choice.laterality, 'midline');
        assert(loaded.includes(choice.bundle));
        if (id !== target.id) assert(concept.distractors.includes(current.reasoningConceptFor(choice)?.key));
      }
      assert.equal(feedback(session), '');
      const action = { sessionId: session.id, index: 0 };
      const wrong = question.choices.find(id => id !== target.id);
      same(current.practiceReducer(session, { type: 'answer', ...action, chosen: 'foreign' }), session);
      const correct = current.practiceReducer(session, { type: 'answer', ...action, chosen: target.id });
      assert.equal(current.practiceScore(correct), 1);
      same(current.practiceReducer(correct, { type: 'answer', ...action, chosen: wrong }), correct);
      assert(feedback(correct).includes('Sources &amp; scope'));
      const incorrect = current.practiceReducer(session, { type: 'answer', ...action, chosen: wrong });
      assert.equal(current.practiceScore(incorrect), 0);
      const finished = current.practiceReducer(incorrect, { type: 'next', ...action });
      same(current.missedPracticeIds(finished.responses), [target.id]);
      assert.equal(create(current, scope, target.id, loaded,
        { retryIds: current.missedPracticeIds(finished.responses) })?.questions[0].target, target.id);
      plays++;
    }
  }
  assert.equal(create(current, catalog.structures.filter(s => s.id !== target.id), target.id), null);
  assert.equal(create(current, catalog.structures, target.id, loaded.filter(id => id !== target.bundle)), null);
  assert.equal(create(current, [target], target.id), null);
  const session = create(current, catalog.structures, target.id);
  assert.equal(create(current, catalog.structures, target.id, loaded,
    { sampling: 'focus', focusIds: session.questions[0].choices })?.questions[0].target, target.id);
  assert.equal(create(current, catalog.structures, target.id, loaded,
    { sampling: 'focus', focusIds: [target.id] }), null);
  const review = current.bodyReasoningReview(catalog, target.id);
  assert(review);
  assert.equal(review.key, key);
  assert.equal(review.answerId, target.id);
  same(review.choices.map(c => c.id).sort(), session.questions[0].choices.sort());
  const material = await current.bodyReviewMaterial(target.id);
  assert(material?.reasoning);
  same(material.reasoning, review);
  assert.equal(material.approval, false);
  assert.equal(material.status, 'worksheet-not-submitted');
  const before = await previous.bodyReviewMaterial(target.id);
  assert(before, 'The exact source selection already existed before these questions');
  {
    assert.equal(before.reasoning, null);
    same(material.source, before.source);
    same(material.topics, before.topics);
    same(material.fingerprints.source, before.fingerprints.source);
    assert.notEqual(material.fingerprints.teaching, before.fingerprints.teaching);
  }
  assert(await current.parseBodyReviewResponse(material, target.id), 'Actual generated display pins admit the exact new worksheet');
  assert.equal(await current.parseBodyReviewResponse(before, target.id), null, 'Old worksheet cannot silently cover the new question');
  for (const edit of [
    p => { p.reasoning.answerId = p.reasoning.choices.find(c => c.id !== target.id).id; },
    p => { p.reasoning.explanation += ' foreign'; },
    p => { p.reasoning.references[0].url = 'javascript:alert(1)'; },
    p => { p.reasoning.choices[0].sources[0].sha256 = '0'.repeat(64); },
    p => { p.reasoning.readiness = 'approved'; },
  ]) {
    const packet = structuredClone(material); edit(packet);
    assert.equal(await current.parseBodyReviewResponse(packet, target.id), null, 'Foreign question material refused');
  }
  const oldContext = await previous.bodyReviewContext(target.id);
  const newContext = await current.bodyReviewContext(target.id);
  assert(oldContext && newContext);
  assert(current.bodyReviewStale({ catalogScope: oldContext.catalogScope, structureId: target.id, track: 'teaching', revisionHash: oldContext.revisions.teaching, checklistVersion: oldContext.checklistVersion }, newContext));
  let storageCalls = 0;
  const stale = { catalogScope: oldContext.catalogScope, structureId: target.id, track: 'teaching', expectedVersion: 0, materialHash: oldContext.materialHash, revisionHash: oldContext.revisions.teaching, checklistVersion: oldContext.checklistVersion, draft: current.blankBodyReview(oldContext, 'teaching') };
  const response = await current.postBodyDecision(new Request('https://atlas.example/api/body-review/decisions', { method: 'POST', headers: { 'oai-authenticated-user-id': 'synthetic-reviewer', 'content-type': 'application/json', origin: 'https://atlas.example' }, body: JSON.stringify(stale) }), { prepare() { storageCalls++; throw Error('Stale question touched storage'); } });
  assert.equal(response.status, 409);
  assert.equal(storageCalls, 0);
}

let priorSessions = 0;
for (const structure of catalog.structures.filter(previous.reasoningConceptFor)) {
  same(create(current, catalog.structures, structure.id),
    create(previous, catalog.structures, structure.id),
    `${structure.id}: previous playable session remains exact`);
  priorSessions++;
}
assert.equal(priorSessions, 343);
console.log(JSON.stringify({ parentCommit,
  parentConceptsSha256: createHash('sha256').update(JSON.stringify(previous.reasoningConcepts)).digest('hex'),
  concepts: 193, representations: 346, precedingSessionsPreserved: priorSessions,
  sourceMutationsRejected: mutations, practicePaths: plays,
  clinicalApproval: false, browserAcceptance: false }));
