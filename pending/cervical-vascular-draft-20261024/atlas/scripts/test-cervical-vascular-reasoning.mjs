import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { build } from './workspace-component-test-build.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = path => JSON.parse(fs.readFileSync(root + path, 'utf8'));
const pins = read('content/cervical-vascular-reasoning-pins.json');
const raw = read('public/models/bodyparts3d/full-body/catalog.json');
const require = createRequire(new URL('../package.json', import.meta.url));
const compiled = await build({
  stdin: {
    contents: "export * from './lib/reasoning-questions';export * from './lib/cervical-vascular-reasoning';export * from './lib/atlas-practice';export {bodyDisplayCatalog} from './lib/body-display-catalog';",
    resolveDir: root, loader: 'ts',
  },
  bundle: true, write: false, format: 'cjs', platform: 'node', packages: 'external',
});
const module = { exports: {} };
runInNewContext(compiled.outputFiles[0].text, {
  module, exports: module.exports, require, crypto, TextEncoder, TextDecoder,
  Request, Response, structuredClone, URL, URLSearchParams,
});
const api = module.exports;
const catalog = api.bodyDisplayCatalog(raw);
const loaded = catalog.bundles.map(bundle => bundle.id);
const slugs = [
  'common-carotid-artery', 'internal-carotid-artery',
  'vertebral-artery', 'internal-jugular-vein',
];
const keys = slugs.map(slug => 'cervical-vascular-' + slug);
const same = (a, b) => assert.deepEqual(structuredClone(a), structuredClone(b));
const leaves = (value, path = []) => value === null || typeof value !== 'object'
  ? [path] : Object.entries(value).flatMap(([key, child]) => leaves(child, [...path, key]));

test('only four paired source identities are pinned, and existing reasoning remains intact', () => {
  assert.equal(pins.parentSource, '7659453d7d99da78742b06ee6e6665a467e5d972');
  assert.equal(pins.entries.length, 8);
  same(api.cervicalVascularReasoningConcepts.map(concept => concept.key), keys);
  same(api.reasoningConcepts.slice(-4), api.cervicalVascularReasoningConcepts);
  assert(!catalog.structures.some(s => /external (carotid artery|jugular vein)/i.test(s.name)));
  for (const s of catalog.structures.filter(s => !pins.entries.some(e => e.identity.id === s.id)))
    assert(!keys.includes(api.reasoningConceptFor(s)?.key), s.id);
});

test('source matching requires the entire pinned structure and the correct key', () => {
  for (const { key, identity } of pins.entries) {
    const live = catalog.structures.find(s => s.id === identity.id);
    same(live, identity);
    assert(api.cervicalVascularReasoningSourceMatches(live, key));
    assert.equal(api.reasoningConceptFor(live)?.key, key);
    assert.equal(api.reasoningConceptFor(live)?.readiness, 'draft');
    for (const path of leaves(identity)) {
      const bad = structuredClone(identity);
      let node = bad;
      for (const part of path.slice(0, -1)) node = node[part];
      const leaf = path.at(-1);
      node[leaf] = typeof node[leaf] === 'number' ? node[leaf] + .01
        : typeof node[leaf] === 'boolean' ? !node[leaf] : String(node[leaf]) + '-altered';
      assert.equal(api.cervicalVascularReasoningSourceMatches(bad, key), false, path.join('.'));
      assert.notEqual(api.reasoningConceptFor(bad)?.key, key, path.join('.'));
    }
    for (const other of keys.filter(other => other !== key))
      assert.equal(api.cervicalVascularReasoningSourceMatches(live, other), false);
    assert.equal(api.cervicalVascularReasoningSourceMatches({ ...live, extra: true }, key), false);
  }
});

test('same-side, loaded regional choices permit answer and skip but reject isolated targets', () => {
  for (const { key, identity } of pins.entries) {
    for (const region of ['head-neck', 'thorax']) {
      const scope = catalog.structures.filter(s => s.regions.includes(region));
      const options = { id: 1, mode: 'reason', sampling: 'all', count: 1, retryIds: [identity.id] };
      const session = api.createPracticeSession(scope, loaded, options, () => .5);
      assert(session, `${key}:${region}`);
      const question = session.questions[0];
      assert.equal(question.target, identity.id);
      assert.equal(question.reasoning.key, key);
      for (const id of question.choices) {
        const choice = scope.find(s => s.id === id);
        assert(choice && choice.laterality === identity.laterality);
        assert(loaded.includes(choice.bundle));
      }
      const action = { sessionId: session.id, index: 0 };
      assert.equal(api.practiceScore(api.practiceReducer(session, { type: 'answer', ...action, chosen: identity.id })), 1);
      assert.equal(api.practiceScore(api.practiceReducer(session, { type: 'answer', ...action, chosen: null })), 0);
      assert.equal(api.createPracticeSession([identity], loaded, options), null);
      assert.equal(api.createPracticeSession(scope, loaded.filter(b => b !== identity.bundle), options), null);
    }
  }
});
