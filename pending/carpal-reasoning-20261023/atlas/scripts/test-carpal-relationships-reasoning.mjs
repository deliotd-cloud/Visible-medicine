import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { build } from './workspace-component-test-build.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const head = 'be9b53d96c37f1ea973e60f5981ad80db0893177';
const read = p => readFile(new URL('../' + p, import.meta.url), 'utf8');
const prior = p => execFileSync('git', ['show', `${head}:${p}`], { cwd: root, encoding: 'utf8', maxBuffer: 32e6 });
const same = (a, b, message) => assert.deepEqual(structuredClone(a), structuredClone(b), message);
const require = createRequire(new URL('../package.json', import.meta.url));
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const entry = `export * from './lib/reasoning-questions';export * from './lib/carpal-relationships-reasoning';export * from './lib/atlas-practice';export * from './lib/body-review-material';export * from './lib/body-reasoning-review';export * from './lib/body-review-response';export * from './lib/body-review-context';export * from './lib/body-review-decisions';export * from './lib/body-review-api';export {bodyDisplayCatalog} from './lib/body-display-catalog';export {ReasoningFeedback} from './app/reasoning-feedback';`;

async function load(previous = false) {
  const result = await build({
    stdin: { contents: previous ? entry.replace("export * from './lib/carpal-relationships-reasoning';", '') : entry, resolveDir: root, loader: 'ts' },
    bundle: true, write: false, format: 'cjs', platform: 'node', packages: 'external', jsx: 'automatic',
    plugins: previous ? [{ name: 'exact-predecessor', setup(api) {
      api.onLoad({ filter: /\.(?:ts|tsx|json)$/ }, args => {
        const p = relative(root, args.path).replaceAll('\\', '/');
        return { contents: prior(p), loader: p.endsWith('.json') ? 'json' : p.endsWith('.tsx') ? 'tsx' : 'ts', resolveDir: dirname(args.path) };
      });
    } }] : [],
  });
  const module = { exports: {} };
  runInNewContext(result.outputFiles[0].text, { module, exports: module.exports, require, crypto, TextEncoder, TextDecoder, Request, Response, structuredClone, URL, URLSearchParams });
  return module.exports;
}

const previous = await load(true);
const api = await load();
const catalog = api.bodyDisplayCatalog(JSON.parse(await read('public/models/bodyparts3d/full-body/catalog.json')));
const pins = JSON.parse(await read('content/carpal-relationships-reasoning-pins.json'));
const keys = ['scaphoid', 'lunate', 'triquetrum', 'pisiform'].map(slug => `carpal-relationships-${slug}`);
const keySet = new Set(keys);
const isa = (await read('LICENSES/bodyparts3d-v4-index/isa_element_parts.txt')).trim().split(/\r?\n/).map(s => s.split('\t'));
const leaves = (value, parts = []) => value === null || typeof value !== 'object' ? [parts] : Object.entries(value).flatMap(([k, v]) => leaves(v, [...parts, k]));
const loaded = catalog.bundles.map(b => b.id);
const create = (target, scope = catalog.structures, bundles = loaded, opts = {}, random = () => .314159) => api.createPracticeSession(scope, bundles, { id: 1, mode: 'reason', sampling: 'all', count: 1, retryIds: [target.id], ...opts }, random);
const feedback = session => renderToStaticMarkup(React.createElement(api.ReasoningFeedback, { session }));
const referenceWords = new Map();

assert.equal(pins.parentSource, head);
assert.equal(previous.reasoningConcepts.length, 200);
assert.equal(api.reasoningConcepts.length, 204);
assert.equal(new Set(api.reasoningConcepts.map(c => c.key)).size, 204);
const previousKeys = new Set(previous.reasoningConcepts.map(c => c.key));
for (const old of previous.reasoningConcepts) {
  const current = api.reasoningConcepts.filter(c => c.key === old.key);
  assert.equal(current.length, 1, `Previous definition ${old.key}`);
  same(current[0], old, `Previous definition changed: ${old.key}`);
}
same(new Set(api.reasoningConcepts.map(c => c.key).filter(key => !previousKeys.has(key))), keySet);
same(api.carpalRelationshipsReasoningConcepts.map(c => c.key), keys);
assert.equal(catalog.structures.filter(previous.reasoningConceptFor).length, 360);
assert.equal(catalog.structures.filter(api.reasoningConceptFor).length, 368);
assert.equal(pins.entries.length, 8);
same(new Set(pins.entries.map(e => e.key)), keySet);

// Every previously eligible target must retain its exact concept and actual question.
let oldQuestions = 0, identityNegatives = 0, practicePaths = 0, packetNegatives = 0, stalePosts = 0;
for (const structure of catalog.structures) {
  const old = previous.reasoningConceptFor(structure);
  if (!old) continue;
  same(api.reasoningConceptFor(structure), old, `Old target remapped: ${structure.id}`);
  const options = { id: 1, mode: 'reason', sampling: 'all', count: 1, retryIds: [structure.id] };
  const before = previous.createPracticeSession(catalog.structures, loaded, options, () => .314159);
  const after = api.createPracticeSession(catalog.structures, loaded, options, () => .314159);
  same(after?.questions, before?.questions, `Old question changed: ${structure.id}`);
  oldQuestions++;
}
assert.equal(oldQuestions, 360);

for (const [index, key] of keys.entries()) {
  const concept = api.carpalRelationshipsReasoningConcepts[index];
  const entries = pins.entries.filter(e => e.key === key);
  assert.equal(entries.length, 2);
  same(new Set(entries.map(e => e.identity.laterality)), new Set(['right', 'left']));
  assert.equal(concept.readiness, 'draft');
  assert.equal(concept.revision, 1);
  assert.equal(concept.region, 'hand');
  assert.equal(concept.sourceTissue, 'bone');
  assert.equal(concept.sourceTree, 'isa');
  same(concept.sourceRegions ?? ['hand'], ['hand']);
  same(new Set(concept.distractors), new Set(keys.filter(other => other !== key)));
  assert.equal(concept.distractors.length, 3);
  assert(concept.prompt.length > 40 && concept.explanation.length > 40);
  same(concept.bindings.map(b => [b.fma, b.side, b.files ?? [b.file]]), entries.map(e => [e.identity.fmaId, e.identity.laterality, e.identity.sources.map(s => s.file)]));
  assert(concept.references.length > 0);
  for (const ref of concept.references) {
    assert(ref.title.length > 8);
    assert.equal(new URL(ref.url).protocol, 'https:');
    assert(['anatomy.ttuhscep.edu','anatomy.med.utah.edu'].includes(new URL(ref.url).hostname));
    referenceWords.set(ref.url,(referenceWords.get(ref.url)??0)+(concept.prompt+' '+concept.explanation).split(/\s+/).length);
  }

  for (const { identity } of entries) {
    assert.equal(identity.system, 'skeleton');
    assert.equal(identity.category, 'bone');
    assert.equal(identity.region, 'hand');
    same(identity.regions, ['hand']);
    assert.equal(identity.bundle, 'hand-skeleton');
    assert.equal(identity.sourceTree, 'isa');
    assert.equal(identity.sources.length, 1);
    const matches = catalog.structures.filter(s => s.fmaId === identity.fmaId);
    assert.equal(matches.length, 1);
    const target = matches[0];
    same(target, identity);
    same(isa.filter(row => row[0] === identity.fmaId).map(row => row[2]), identity.sources.map(s => s.file));
    assert.equal(api.carpalRelationshipsReasoningSourceMatches(target, key), true);
    assert.equal(api.reasoningConceptFor(target)?.key, key);
    assert.equal(previous.reasoningConceptFor(target), undefined);
    for (const other of keys.filter(other => other !== key)) assert.equal(api.carpalRelationshipsReasoningSourceMatches(target, other), false);
    for (const parts of leaves(target)) {
      const bad = structuredClone(target);
      let node = bad;
      for (const part of parts.slice(0, -1)) node = node[part];
      const leaf = parts.at(-1), value = node[leaf];
      node[leaf] = typeof value === 'number' ? value + .01 : typeof value === 'boolean' ? !value : String(value) + '-foreign';
      assert.equal(api.carpalRelationshipsReasoningSourceMatches(bad, key), false, parts.join('.'));
      assert.equal(api.reasoningConceptFor(bad), undefined, parts.join('.'));
      identityNegatives++;
    }
    for (const bad of [{ ...target, unexpected: true }, (() => { const b = structuredClone(target); delete b.coverageNote; return b; })()]) {
      assert.equal(api.carpalRelationshipsReasoningSourceMatches(bad, key), false);
      assert.equal(api.reasoningConceptFor(bad), undefined);
      identityNegatives++;
    }

    const scopes = [catalog.structures, catalog.structures.filter(s => s.regions.includes('hand'))];
    for (const scope of scopes) for (const random of [() => 0, () => .314159, () => .999999]) {
      const session = create(target, scope, loaded, {}, random);
      assert(session, `${key} in ${scope.length} roots`);
      const q = session.questions[0];
      assert.equal(q.target, target.id);
      assert.equal(q.reasoning.key, key);
      assert.equal(q.reasoning.revision, 1);
      assert.equal(q.reasoning.prompt, concept.prompt);
      assert.equal(q.reasoning.explanation, concept.explanation);
      same(q.reasoning.references, concept.references);
      assert.equal(q.choices.length, 4);
      assert.equal(new Set(q.choices).size, 4);
      for (const id of q.choices) {
        const choice = scope.find(s => s.id === id);
        assert(choice);
        assert.equal(choice.laterality, target.laterality);
        assert.equal(choice.bundle, target.bundle);
        if (id !== target.id) assert(concept.distractors.includes(api.reasoningConceptFor(choice)?.key));
      }
      assert.equal(feedback(session), '');
      const action = { sessionId: session.id, index: 0 };
      const wrong = q.choices.find(id => id !== target.id);
      const correct = api.practiceReducer(session, { type: 'answer', ...action, chosen: target.id });
      assert.equal(api.practiceScore(correct), 1);
      same(api.reasoningFeedback(correct), q.reasoning);
      same(api.practiceReducer(correct, { type: 'answer', ...action, chosen: wrong }), correct);
      assert(feedback(correct).includes('Sources &amp; scope'));
      const incorrect = api.practiceReducer(session, { type: 'answer', ...action, chosen: wrong });
      assert.equal(api.practiceScore(incorrect), 0);
      assert(feedback(incorrect).includes('Sources &amp; scope'));
      const skipped = api.practiceReducer(session, { type: 'answer', ...action, chosen: null });
      assert.equal(api.practiceScore(skipped), 0);
      assert(feedback(skipped).includes('Sources &amp; scope'));
      for (const answered of [incorrect, skipped]) {
        const done = api.practiceReducer(answered, { type: 'next', ...action });
        same(api.missedPracticeIds(done.responses), [target.id]);
        assert.equal(create(target, scope, loaded, { retryIds: api.missedPracticeIds(done.responses) })?.questions[0].target, target.id);
      }
      practicePaths++;
    }
    assert.equal(create(target, [target]), null);
    const focusedAlternatives = catalog.structures.filter(s =>
      s.laterality === target.laterality && concept.distractors.includes(api.reasoningConceptFor(s)?.key));
    for (const count of [2, 3]) {
      const scope = [target, ...focusedAlternatives.slice(0, count - 1)];
      assert.equal(scope.length, count);
      assert.equal(create(target, scope)?.questions[0].choices.length, count);
    }
    assert.equal(create(target, catalog.structures, loaded.filter(b => b !== target.bundle)), null);
    assert.equal(create(target, catalog.structures.filter(s => s.id !== target.id)), null);

    const material = await api.bodyReviewMaterial(target.id);
    const before = await previous.bodyReviewMaterial(target.id);
    assert(material?.reasoning);
    assert.equal(before.reasoning, null);
    same(material.source, before.source);
    same(material.topics, before.topics);
    same(material.guidedTours, before.guidedTours);
    same(material.checklist, before.checklist);
    assert.equal(material.approval, false);
    assert.equal(material.status, 'worksheet-not-submitted');
    assert.notEqual(material.fingerprints.teaching, before.fingerprints.teaching);
    assert(await api.parseBodyReviewResponse(material, target.id));
    assert.equal(await api.parseBodyReviewResponse(before, target.id), null);
    for (const edit of [
      p => { p.reasoning.answerId = p.reasoning.choices.find(c => c.id !== target.id).id; },
      p => { p.reasoning.explanation += ' altered'; },
      p => { p.reasoning.readiness = 'approved'; },
      p => { p.reasoning.choices[0].sources[0].sha256 = '0'.repeat(64); },
      p => { p.reasoning.references[0].url = 'javascript:alert(1)'; },
    ]) {
      const bad = structuredClone(material);
      edit(bad);
      assert.equal(await api.parseBodyReviewResponse(bad, target.id), null);
      packetNegatives++;
    }
    const oldContext = await previous.bodyReviewContext(target.id);
    const context = await api.bodyReviewContext(target.id);
    assert(oldContext && context);
    assert.notEqual(context.revisions.teaching, oldContext.revisions.teaching);
    let storageCalls = 0;
    const stale = { catalogScope: oldContext.catalogScope, structureId: target.id, track: 'teaching', expectedVersion: 0, materialHash: oldContext.materialHash, revisionHash: oldContext.revisions.teaching, checklistVersion: oldContext.checklistVersion, draft: api.blankBodyReview(oldContext, 'teaching') };
    const response = await api.postBodyDecision(new Request('https://atlas.example/api/body-review/decisions', { method: 'POST', headers: { 'content-type': 'application/json', 'oai-authenticated-user-id': 'synthetic-reviewer', origin: 'https://atlas.example' }, body: JSON.stringify(stale) }), { prepare() { storageCalls++; throw Error('Stale question touched storage'); } });
    assert.equal(response.status, 409);
    assert.equal(storageCalls, 0);
    stalePosts++;
  }
}

for (const [url,words] of referenceWords) assert(words<=200,`Brief original synthesis per reference: ${url} (${words})`);
console.log(JSON.stringify({ concepts: 204, representedRoots: 368, newConcepts: 4, newRoots: 8, oldQuestions, identityNegatives, practicePaths, packetNegatives, stalePosts, clinicalApproval: false, patientSpaceRegistration: false }));
