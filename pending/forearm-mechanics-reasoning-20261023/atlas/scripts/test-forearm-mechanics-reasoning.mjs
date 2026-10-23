import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { build } from './workspace-component-test-build.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const head = 'b0ad9e786f2f26727cd627ec028c0d3894048c72';
const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');
const prior = path => execFileSync('git', ['show', `${head}:${path}`], { cwd: root, encoding: 'utf8', maxBuffer: 32e6 });
const same = (actual, expected, label) => assert.deepEqual(structuredClone(actual), structuredClone(expected), label);
const require = createRequire(new URL('../package.json', import.meta.url));
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const addition = "export * from './lib/forearm-mechanics-reasoning';";
const entry = `export * from './lib/reasoning-questions';${addition}export * from './lib/atlas-practice';export * from './lib/body-review-material';export * from './lib/body-reasoning-review';export * from './lib/body-review-response';export * from './lib/body-review-context';export * from './lib/body-review-decisions';export * from './lib/body-review-api';export {bodyDisplayCatalog} from './lib/body-display-catalog';export {ReasoningFeedback} from './app/reasoning-feedback';`;

async function load(previous = false) {
  const compiled = await build({
    stdin: { contents: previous ? entry.replace(addition, '') : entry, resolveDir: root, loader: 'ts' },
    bundle: true, write: false, format: 'cjs', platform: 'node', packages: 'external', jsx: 'automatic',
    plugins: previous ? [{ name: 'exact-predecessor', setup(api) {
      api.onLoad({ filter: /\.(?:ts|tsx|json)$/ }, args => {
        const path = relative(root, args.path).replaceAll('\\', '/');
        return { contents: prior(path), loader: path.endsWith('.json') ? 'json' : path.endsWith('.tsx') ? 'tsx' : 'ts', resolveDir: dirname(args.path) };
      });
    } }] : [],
  });
  const module = { exports: {} };
  runInNewContext(compiled.outputFiles[0].text, { module, exports: module.exports, require, crypto, TextEncoder, TextDecoder, Request, Response, structuredClone, URL, URLSearchParams });
  return module.exports;
}

const previous = await load(true);
const api = await load();
const catalog = api.bodyDisplayCatalog(JSON.parse(await read('public/models/bodyparts3d/full-body/catalog.json')));
const pins = JSON.parse(await read('content/forearm-mechanics-reasoning-pins.json'));
const keys = ['flexor-digitorum-superficialis', 'flexor-digitorum-profundus', 'extensor-carpi-radialis-brevis',
  'extensor-carpi-ulnaris', 'extensor-digitorum', 'extensor-indicis'].map(slug => `forearm-mechanics-${slug}`);
const loaded = catalog.bundles.map(bundle => bundle.id);
const create = (target, scope = catalog.structures, bundles = loaded, options = {}, random = () => .314159) =>
  api.createPracticeSession(scope, bundles, { id: 1, mode: 'reason', sampling: 'all', count: 1, retryIds: [target.id], ...options }, random);
const feedback = session => renderToStaticMarkup(React.createElement(api.ReasoningFeedback, { session }));
const leaves = (value, parts = []) => value === null || typeof value !== 'object' ? [parts] : Object.entries(value).flatMap(([key, child]) => leaves(child, [...parts, key]));
const isa = (await read('LICENSES/bodyparts3d-v4-index/isa_element_parts.txt')).trim().split(/\r?\n/).map(line => line.split('\t'));

assert.equal(pins.parentSource, head);
assert.equal(previous.reasoningConcepts.length, 210);
assert.equal(api.reasoningConcepts.length, 216);
assert.equal(new Set(api.reasoningConcepts.map(c => c.key)).size, 216);
same(api.reasoningConcepts.slice(0, 210), previous.reasoningConcepts, 'All predecessor definitions and order');
same(api.reasoningConcepts.slice(210), api.forearmMechanicsReasoningConcepts);
same(api.forearmMechanicsReasoningConcepts.map(c => c.key), keys);
assert.equal(pins.entries.length, 12);
same(new Set(pins.entries.map(e => e.key)), new Set(keys));
assert.equal(catalog.structures.filter(previous.reasoningConceptFor).length, 380);
assert.equal(catalog.structures.filter(api.reasoningConceptFor).length, 392);

let oldSelections = 0, identityNegatives = 0, practicePaths = 0, packetNegatives = 0, stalePosts = 0;
for (const structure of catalog.structures) {
  const before = previous.reasoningConceptFor(structure);
  if (!before) continue;
  same(api.reasoningConceptFor(structure), before, `Old target remapped: ${structure.id}`);
  const options = { id: 1, mode: 'reason', sampling: 'all', count: 1, retryIds: [structure.id] };
  same(api.createPracticeSession(catalog.structures, loaded, options, () => .314159)?.questions,
    previous.createPracticeSession(catalog.structures, loaded, options, () => .314159)?.questions,
    `Old selection changed: ${structure.id}`);
  oldSelections++;
}
assert.equal(oldSelections, 380);

for (const [index, key] of keys.entries()) {
  const concept = api.forearmMechanicsReasoningConcepts[index];
  const entries = pins.entries.filter(entry => entry.key === key);
  assert.equal(entries.length, 2);
  same(entries.map(entry => entry.identity.laterality), ['right', 'left']);
  assert.equal(concept.region, 'forearm');
  same(concept.sourceRegions, ['forearm']);
  assert.equal(concept.sourceTree, 'isa');
  assert.equal(concept.sourceTissue, undefined);
  assert.equal(concept.readiness, 'draft');
  assert.equal(concept.revision, 1);
  assert.equal(concept.distractors.length, 3);
  assert.equal(new Set(concept.distractors).size, 3);
  assert(concept.prompt.length > 40 && concept.explanation.length > 40);
  assert.equal(concept.references.length, index === 2 ? 2 : 1);
  assert.equal(concept.references[0].url, `https://rad.uw.edu/muscle-atlas/${key.slice('forearm-mechanics-'.length)}`);
  if (index === 2) assert.equal(concept.references[1].url, 'https://rad.uw.edu/muscle-atlas/extensor-carpi-radialis-longus');
  same(concept.bindings.map(binding => [binding.fma, binding.side, binding.files ?? [binding.file]]),
    entries.map(entry => [entry.identity.fmaId, entry.identity.laterality, entry.identity.sources.map(source => source.file)]));

  for (const { identity } of entries) {
    assert.equal(identity.system, 'muscles');
    assert.equal(identity.category, 'muscle');
    assert.equal(identity.region, 'forearm');
    same(identity.regions, ['forearm']);
    assert.equal(identity.bundle, 'forearm-muscles');
    assert.equal(identity.sourceTree, 'isa');
    assert.equal(identity.sources.length, index === 0 || index === 3 ? 2 : 1);
    const matches = catalog.structures.filter(structure => structure.fmaId === identity.fmaId);
    assert.equal(matches.length, 1);
    const target = matches[0];
    same(target, identity);
    same(isa.filter(row => row[0] === identity.fmaId).map(row => row[2]), identity.sources.map(source => source.file));
    assert.equal(api.forearmMechanicsReasoningSourceMatches(target, key), true);
    assert.equal(api.reasoningConceptFor(target)?.key, key);
    assert.equal(previous.reasoningConceptFor(target), undefined);
    for (const other of keys.filter(other => other !== key)) assert.equal(api.forearmMechanicsReasoningSourceMatches(target, other), false);
    for (const parts of leaves(target)) {
      const bad = structuredClone(target);
      let node = bad;
      for (const part of parts.slice(0, -1)) node = node[part];
      const leaf = parts.at(-1), value = node[leaf];
      node[leaf] = typeof value === 'number' ? value + .01 : typeof value === 'boolean' ? !value : String(value) + '-foreign';
      assert.equal(api.forearmMechanicsReasoningSourceMatches(bad, key), false, parts.join('.'));
      assert.equal(api.reasoningConceptFor(bad), undefined, parts.join('.'));
      identityNegatives++;
    }
    for (const bad of [{ ...target, unexpected: true }, (() => { const copy = structuredClone(target); delete copy.coverageNote; return copy; })()]) {
      assert.equal(api.forearmMechanicsReasoningSourceMatches(bad, key), false);
      assert.equal(api.reasoningConceptFor(bad), undefined);
      identityNegatives++;
    }
    if (identity.sources.length === 2) {
      for (const sources of [identity.sources.slice(0, 1), [...identity.sources].reverse()]) {
        const bad = { ...target, sources };
        assert.equal(api.forearmMechanicsReasoningSourceMatches(bad, key), false);
        assert.equal(api.reasoningConceptFor(bad), undefined);
      }
    }
    const opposite = entries.find(entry => entry.identity.laterality !== target.laterality).identity;
    assert.equal(api.forearmMechanicsReasoningSourceMatches(opposite, key), true);
    assert.equal(api.forearmMechanicsReasoningSourceMatches({ ...target, laterality: opposite.laterality }, key), false);

    for (const scope of [catalog.structures, catalog.structures.filter(structure => structure.regions.includes('forearm'))]) {
      for (const random of [() => 0, () => .314159, () => .999999]) {
        const session = create(target, scope, loaded, {}, random);
        assert(session, `${key} in ${scope.length} roots`);
        const question = session.questions[0];
        assert.equal(question.target, target.id);
        assert.equal(question.reasoning.key, key);
        assert.equal(question.choices.length, 4);
        assert.equal(new Set(question.choices).size, 4);
        for (const id of question.choices) {
          const choice = scope.find(structure => structure.id === id);
          assert(choice);
          assert.equal(choice.laterality, target.laterality);
          assert(loaded.includes(choice.bundle));
          if (id !== target.id) assert(concept.distractors.includes(api.reasoningConceptFor(choice)?.key));
        }
        assert.equal(feedback(session), '');
        const action = { sessionId: session.id, index: 0 };
        const wrong = question.choices.find(id => id !== target.id);
        const correct = api.practiceReducer(session, { type: 'answer', ...action, chosen: target.id });
        assert.equal(api.practiceScore(correct), 1);
        same(api.reasoningFeedback(correct), question.reasoning);
        same(api.practiceReducer(correct, { type: 'answer', ...action, chosen: wrong }), correct);
        assert(feedback(correct).includes('Sources &amp; scope'));
        for (const chosen of [wrong, null]) {
          const answered = api.practiceReducer(session, { type: 'answer', ...action, chosen });
          assert.equal(api.practiceScore(answered), 0);
          assert(feedback(answered).includes('Sources &amp; scope'));
          const done = api.practiceReducer(answered, { type: 'next', ...action });
          same(api.missedPracticeIds(done.responses), [target.id]);
          assert.equal(create(target, scope, loaded, { retryIds: api.missedPracticeIds(done.responses) })?.questions[0].target, target.id);
        }
        practicePaths++;
      }
    }
    assert.equal(create(target, [target]), null);
    const focusedAlternatives = catalog.structures.filter(structure => structure.laterality === target.laterality && concept.distractors.includes(api.reasoningConceptFor(structure)?.key));
    assert.equal(focusedAlternatives.length, 3);
    for (const count of [2, 3]) assert.equal(create(target, [target, ...focusedAlternatives.slice(0, count - 1)])?.questions[0].choices.length, count);
    assert.equal(create(target, catalog.structures, loaded.filter(bundle => bundle !== target.bundle)), null);
    assert.equal(create(target, catalog.structures.filter(structure => structure.id !== target.id)), null);

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
      packet => { packet.reasoning.answerId = packet.reasoning.choices.find(choice => choice.id !== target.id).id; },
      packet => { packet.reasoning.explanation += ' altered'; },
      packet => { packet.reasoning.readiness = 'approved'; },
      packet => { packet.reasoning.choices[0].sources[0].sha256 = '0'.repeat(64); },
      packet => { packet.reasoning.references[0].url = 'javascript:alert(1)'; },
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

for (const old of catalog.structures.filter(previous.reasoningConceptFor).slice(0, 3)) {
  const before = await previous.bodyReviewMaterial(old.id);
  const after = await api.bodyReviewMaterial(old.id);
  same(after, before, `Unchanged Review root: ${old.id}`);
}
const docs = await read('docs/FOREARM_MECHANICS_REASONING.md');
for (const { identity } of pins.entries) {
  assert(docs.includes(identity.id));
  assert(docs.includes(identity.fmaId));
  for (const source of identity.sources) { assert(docs.includes(source.file)); assert(docs.includes(source.sha256)); }
}
console.log(JSON.stringify({ concepts: 216, representedRoots: 392, newConcepts: 6, newRoots: 12, oldSelections, identityNegatives, practicePaths, packetNegatives, stalePosts, clinicalApproval: false, patientSpaceRegistration: false }));
