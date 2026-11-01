import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {runInNewContext} from 'node:vm';
import {build} from 'esbuild';
import {emittedTeachingSearch} from './atlas-emitted-teaching.ts';
import {validateCurrentAtlasDelivery as validateDelivery} from './current-atlas-delivery.mjs';

const site = fileURLToPath(new URL('../', import.meta.url));
const parent = 'F:/VisibleMedicine/staging/20261024-guided-review-navigation/website';
const parentReceipt = 'F:/VisibleMedicine/staging/20261024-guided-review-navigation/SOURCE_BOUND.json';
const nativeRoot = 'F:/VisibleMedicine/staging/20261024-cervical-vascular-draft';
const atlas = resolve(nativeRoot, 'atlas');
const nativeReceipt = resolve(nativeRoot, 'SOURCE_BOUND.json');
const source = 'b79e110d2d28f18993263926ba35aa7a3f478b20';
const tree = '0dd97cc55ef9aff3493b91752309d1d661c0b0c8';
const predecessor = '7659453d7d99da78742b06ee6e6665a467e5d972';
const modules = ['head-neck', 'shoulder', 'lower-limb', 'female-pelvis'];
const slugs = ['common-carotid-artery', 'internal-carotid-artery',
  'vertebral-artery', 'internal-jugular-vein'];
const keys = slugs.map(slug => `cervical-vascular-${slug}`);
const newPaths = ['content/cervical-vascular-reasoning-pins.json', 'lib/cervical-vascular-reasoning.ts'];
const sourcePaths = [...newPaths, 'lib/reasoning-questions.ts', 'lib/body-review-material.ts'];
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const json = path => JSON.parse(readFileSync(path));
const wire = value => JSON.parse(JSON.stringify(value));
const pin = () => json(resolve(site, 'tests/fixtures/current-atlas-delivery.json'));
const validate = (options = {}) => validateDelivery({root: site, pin: pin(), ...options});
const require = createRequire(resolve(site, 'package.json'));
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
const native = path => execFileSync('git', ['show', `${source}:${path}`], {
  cwd: atlas, windowsHide: true, maxBuffer: 32e6,
  env: {...process.env, GIT_NO_REPLACE_OBJECTS: '1'},
});
const entry = [
  "export * from './lib/reasoning-questions';",
  "export * from './lib/cervical-vascular-reasoning';",
  "export * from './lib/atlas-practice';",
  "export * from './lib/body-review-material';",
  "export * from './lib/body-review-context';",
  "export * from './lib/body-review-decisions';",
  "export * from './lib/body-review-response';",
  "export * from './lib/body-reasoning-review';",
  "export * from './lib/body-review-api';",
  "export {bodyDisplayCatalog} from './lib/body-display-catalog';",
  "export {ReasoningFeedback} from './app/reasoning-feedback';",
].join('\n');

const compiledApis = new Map();
async function actual(root, old = false) {
  const cacheKey = root + ':' + old;
  if (compiledApis.has(cacheKey)) return compiledApis.get(cacheKey);
  const contents = old ? entry.replace("export * from './lib/cervical-vascular-reasoning';", '') : entry;
  const result = await build({stdin: {contents, resolveDir: resolve(root, 'atlas-review'), loader: 'ts'},
    absWorkingDir: root, metafile: true,
    bundle: true, write: false, format: 'cjs', platform: 'node', packages: 'external', jsx: 'automatic'});
  const manifest = json(resolve(root, 'atlas-review/manifest.json'));
  const binding = json(resolve(root, 'atlas-review/integration-inputs.json'));
  const sealedParent = json(parentReceipt);
  let actualInputs = 0;
  for (const path of Object.keys(result.metafile.inputs)) {
    if (path === '<stdin>') continue; // Exactly the declared export-only bridge above.
    const relative = path.replaceAll('\\', '/');
    assert(relative.startsWith('atlas-review/') && !relative.includes('..'), relative);
    const bytes = readFileSync(resolve(root, relative));
    assert.equal(manifest.files.find(row => row.path === relative.slice('atlas-review/'.length))?.importedSha256, sha(bytes), relative);
    const bound = binding.inputs.find(row => row.path === relative);
    const revisionPath = relative.slice('atlas-review/'.length);
    if (['content/body-renderer-revision.json', 'content/review-revisions.json'].includes(revisionPath)) {
      // The stock binder excludes exactly these derived rows to avoid a hash
      // cycle. Verify their native preimage and whole declared transformation.
      assert.equal(bound, undefined, relative + ': deliberately derived, not a circular input');
      const originalBytes = execFileSync('git', ['show', `${binding.sourceCommit}:${revisionPath}`], {
        cwd: atlas, windowsHide: true, env: {...process.env, GIT_NO_REPLACE_OBJECTS: '1'},
      });
      assert.equal(manifest.files.find(row => row.path === revisionPath)?.sourceSha256, sha(originalBytes));
      const original = JSON.parse(originalBytes), derived = JSON.parse(bytes), restored = structuredClone(derived);
      assert.equal(derived.websiteIntegrationSha256, binding.sha256);
      if (revisionPath === 'content/body-renderer-revision.json') {
        assert.equal(derived.sourceRendererSha256, original.sha256);
        assert.equal(derived.sha256, sha(JSON.stringify({source: original.sha256, website: binding.sha256})));
        restored.sha256 = original.sha256;
        delete restored.sourceRendererSha256;
      } else {
        assert.deepEqual(derived.sourceRevisions, original.revisions);
        for (const [id, tracks] of Object.entries(original.revisions))
          for (const track of ['geometry', 'teaching'])
            assert.equal(derived.revisions[id][track], tracks[track] === null ? null : sha(JSON.stringify({source: tracks[track], website: binding.sha256})));
        restored.revisions = original.revisions;
        delete restored.sourceRevisions;
      }
      delete restored.websiteIntegrationSha256;
      assert.deepEqual(restored, original, 'Only the complete stock revision derivation differs');
    } else assert.equal(bound?.sha256, sha(bytes), relative);
    if (old) assert.equal(sealedParent.sourceRows.find(row => row.path === relative)?.sha256, sha(bytes), 'Actual genuine765 input: ' + relative);
    actualInputs++;
  }
  assert(actualInputs > 1000, 'Actual complete imported graph, not a substituted engine');
  const module = {exports: {}};
  runInNewContext(result.outputFiles[0].text, {module, exports: module.exports, require,
    crypto, TextEncoder, TextDecoder, Request, Response, structuredClone, URL, URLSearchParams});
  compiledApis.set(cacheKey, module.exports);
  return module.exports;
}

test('sealed cervical vascular source reaches current Review and four original runtime deliveries', () => {
  assert.equal(sha(readFileSync(parentReceipt)), 'c5fceb2bc64d8b0d4464b3da940bd3721111657d9a4d57f2dbf5b8b30fe0b6f3');
  assert.equal(sha(readFileSync(nativeReceipt)), '110b2214968c69a229f8d7c0855b93ab8ebbdc41c101e9103a8620ffcefd7b69');
  const baseline = json(parentReceipt), receipt = json(nativeReceipt);
  assert.equal(baseline.atlasHead, predecessor);
  assert.equal(receipt.atlasHead, source);
  assert.equal(receipt.atlasTree, tree);
  assert.equal(receipt.parentHead, predecessor);
  assert.equal(receipt.practice.concepts, 236);
  assert.equal(receipt.practice.exactRepresentations, 432);
  assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], {cwd: atlas, encoding: 'utf8', windowsHide: true}).trim(), source);
  assert.equal(execFileSync('git', ['rev-parse', 'HEAD^{tree}'], {cwd: atlas, encoding: 'utf8', windowsHide: true}).trim(), tree);
  assert.equal(execFileSync('git', ['status', '--porcelain'], {cwd: atlas, encoding: 'utf8', windowsHide: true}).trim(), '');
  const current = validate();
  assert.equal(current.source, source);
  assert.equal(current.sourceTree, tree);
  assert.equal(current.reviewSourceFiles, 1603);
  const oldPin = json(resolve(parent, 'tests/fixtures/current-atlas-delivery.json'));
  assert.equal(oldPin.source, predecessor);
  assert.throws(() => validate({pin: oldPin}), 'Sealed predecessor cannot validate the new delivery');
  const review = json(resolve(site, 'atlas-review/manifest.json'));
  const binding = json(resolve(site, 'atlas-review/integration-inputs.json'));
  const viewer = json(resolve(site, 'public/atlas-review-viewer/manifest.json'));
  assert.equal(review.revision, source);
  assert.equal(binding.sourceCommit, source);
  assert.equal(review.websiteIntegrationSha256, binding.sha256);
  assert.equal(viewer.sourceCommit, source);
  assert.equal(viewer.websiteIntegrationSha256, binding.sha256);
  assert.equal(viewer.mode, 'production');
  assert.equal(viewer.personalRecordsIncluded, false);
  assert.equal(viewer.files.length, 54);
  assert.equal(viewer.packages.length, 24);
  for (const path of sourcePaths) {
    const bytes = native(path), imported = readFileSync(resolve(site, 'atlas-review', path));
    assert.equal(receipt.sourceRows.find(row => row.path === path)?.sha256, sha(bytes), `Committed source ${path}`);
    assert.equal(review.files.find(row => row.path === path)?.sourceSha256, sha(bytes), `Review source ${path}`);
    assert.equal(review.files.find(row => row.path === path)?.importedSha256, sha(imported), `Review import ${path}`);
    assert.equal(binding.inputs.find(row => row.path === `atlas-review/${path}`)?.sha256, sha(imported), `Bound Review ${path}`);
    assert.equal(imported.toString().replaceAll('\r\n', '\n'), bytes.toString().replaceAll('\r\n', '\n'), path);
  }
  for (const name of modules) {
    const base = resolve(site, 'public/atlas-runtime', name);
    const manifest = json(resolve(base, 'manifest.json'));
    assert.equal(current.runtimeSources[name], source, name);
    assert.equal(manifest.sourceCommit, source, name);
    assert.equal(manifest.patientDataIncluded, false, name);
    assert.notEqual(manifest.clinicalApproved, true, name);
  }
  const headInputs = json(resolve(site, 'public/atlas-runtime/head-neck/source-inputs.json'));
  for (const path of newPaths)
    assert.equal(headInputs.find(row => row.path === path)?.sha256, sha(native(path)), `Root learner: ${path}`);
  const learner = json(resolve(site, 'public/atlas-runtime/head-neck/manifest.json'));
  const emitted = emittedTeachingSearch(resolve(site, 'public/atlas-runtime/head-neck') + '/', learner.files);
  const protectedCode = emittedTeachingSearch(resolve(site, 'public/atlas-review-viewer') + '/', viewer.files);
  const snapshotPath = resolve(nativeRoot, 'candidate-snapshot.json');
  assert.equal(sha(readFileSync(snapshotPath)), receipt.evidence.find(row => row.path === 'candidate-snapshot.json')?.sha256);
  for (const concept of json(snapshotPath).concepts.filter(row => keys.includes(row.key))) {
    assert(emitted.includes(concept.key) && emitted.includes(concept.prompt), `Root learner omitted ${concept.key}`);
    assert(protectedCode.includes(concept.key) && protectedCode.includes(concept.prompt), `Protected Review omitted ${concept.key}`);
  }
  assert.equal(json(resolve(site, 'atlas-review/content/cervical-vascular-reasoning-pins.json')).entries.length, 8);
});

test('imported reasoning preserves 232 previous definitions and 424 exact sessions, adding eight visible same-side targets', async () => {
  const api = await actual(site), old = await actual(parent, true);
  const pins = json(resolve(site, 'atlas-review/content/cervical-vascular-reasoning-pins.json'));
  const catalogBytes = readFileSync(resolve(site, 'atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
  assert.deepEqual(catalogBytes, readFileSync(resolve(parent, 'atlas-review/public/models/bodyparts3d/full-body/catalog.json')));
  const catalog = api.bodyDisplayCatalog(JSON.parse(catalogBytes));
  const bundles = catalog.bundles.map(row => row.id);
  assert.equal(pins.parentSource, predecessor);
  assert.deepEqual([...new Set(pins.entries.map(row => row.key))], keys);
  assert.equal(old.reasoningConcepts.length, 232);
  assert.equal(api.reasoningConcepts.length, 236);
  assert.deepEqual(wire(api.reasoningConcepts.slice(0, 232)), wire(old.reasoningConcepts));
  assert.deepEqual(wire(api.reasoningConcepts.slice(232)), wire(api.cervicalVascularReasoningConcepts));
  const prior = catalog.structures.filter(old.reasoningConceptFor);
  assert.equal(prior.length, 424);
  assert.equal(catalog.structures.filter(api.reasoningConceptFor).length, 432);
  const options = id => ({id: 1, mode: 'reason', sampling: 'all', count: 1, retryIds: [id]});
  for (const structure of prior) {
    assert.deepEqual(wire(api.reasoningConceptFor(structure)), wire(old.reasoningConceptFor(structure)), structure.id);
    assert.deepEqual(wire(api.createPracticeSession(catalog.structures, bundles, options(structure.id), () => .314159)?.questions),
      wire(old.createPracticeSession(catalog.structures, bundles, options(structure.id), () => .314159)?.questions), structure.id);
  }
  for (const key of keys) {
    const concept = api.cervicalVascularReasoningConcepts.find(row => row.key === key);
    const pair = pins.entries.filter(row => row.key === key);
    assert.equal(concept?.readiness, 'draft');
    assert.equal(concept?.revision, 1);
    assert.equal(pair.length, 2);
    assert.deepEqual(pair.map(row => row.identity.laterality), ['right', 'left']);
    for (const {identity} of pair) {
      const target = catalog.structures.find(row => row.id === identity.id);
      assert.deepEqual(wire(target), identity);
      assert.equal(old.reasoningConceptFor(target), undefined);
      assert.equal(api.reasoningConceptFor(target)?.key, key);
      assert.equal(api.cervicalVascularReasoningSourceMatches(target, key), true);
      for (const changed of [
        {...target, name: target.name + ' foreign'},
        {...target, regions: [...target.regions].reverse()},
        {...target, sources: [...target.sources, {...target.sources[0], file: 'foreign'}]},
        {...target, sources: target.sources.map(row => ({...row, sha256: '0'.repeat(64)}))},
      ]) {
        assert.equal(api.cervicalVascularReasoningSourceMatches(changed, key), false);
        assert.equal(api.reasoningConceptFor(changed), undefined);
      }
      const session = api.createPracticeSession(catalog.structures, bundles, options(target.id), () => .314159);
      const question = session?.questions[0];
      assert.equal(question?.target, target.id);
      assert.equal(question.reasoning.key, key);
      assert.equal(question.reasoning.prompt, concept.prompt);
      assert.equal(new Set(question.choices).size, 4);
      assert(question.choices.every(id => {
        const alternative = catalog.structures.find(row => row.id === id);
        return alternative && alternative.laterality === target.laterality &&
          alternative.regions.includes('head-neck') && alternative.regions.includes('thorax') &&
          pins.entries.some(row => row.identity.id === id) && bundles.includes(alternative.bundle);
      }), `Every alternative is source-pinned, loaded and visible on ${target.laterality}`);
      assert.equal(api.reasoningFeedback(session), undefined);
      assert.equal(renderToStaticMarkup(React.createElement(api.ReasoningFeedback, {session})), '');
      assert.equal(api.createPracticeSession(catalog.structures, [], options(target.id), () => .314159), null);
      for (const region of ['head-neck', 'thorax']) {
        const visible = catalog.structures.filter(row => row.regions.includes(region));
        const regional = api.createPracticeSession(visible, bundles, options(target.id), () => .314159);
        assert.equal(regional?.questions[0].target, target.id);
        assert.deepEqual([...regional.questions[0].choices].sort(), [...question.choices].sort(), 'Exact loaded same-side alternatives in ' + region);
      }
      const withoutAlternatives = catalog.structures.filter(row => row.id === target.id || !question.choices.includes(row.id));
      assert.equal(api.createPracticeSession(withoutAlternatives, bundles, options(target.id), () => .314159), null);
      const action = {sessionId: session.id, index: 0};
      for (const chosen of [target.id, question.choices.find(id => id !== target.id), null]) {
        const answered = api.practiceReducer(session, {type: 'answer', ...action, chosen});
        assert.equal(api.practiceScore(answered), chosen === target.id ? 1 : 0);
        assert.equal(api.reasoningFeedback(answered)?.key, key);
        assert.match(renderToStaticMarkup(React.createElement(api.ReasoningFeedback, {session: answered})), /Sources &amp; scope/);
      }
    }
  }
});

test('new Review packets reject edited reasoning and stale revision decisions before persistence', async () => {
  const api = await actual(site), old = await actual(parent, true);
  const pins = json(resolve(site, 'atlas-review/content/cervical-vascular-reasoning-pins.json'));
  for (const {identity} of pins.entries) {
    const packet = wire(await api.bodyReviewMaterial(identity.id));
    const prior = wire(await old.bodyReviewMaterial(identity.id));
    assert.deepEqual(packet.source, prior.source);
    assert.deepEqual(packet.topics, prior.topics);
    assert.deepEqual(packet.guidedTours, prior.guidedTours);
    assert.equal(prior.reasoning, null);
    assert.equal(packet.reasoning.answerId, identity.id);
    assert.equal(packet.reasoning.readiness, 'draft');
    assert.equal(packet.approval, false);
    assert.deepEqual(wire(await api.parseBodyReviewResponse(packet, identity.id)), packet);
    for (const edit of [
      copy => {copy.reasoning.answerId = 'foreign';},
      copy => {copy.reasoning.explanation += ' altered';},
      copy => {copy.reasoning.references[0].url = 'javascript:alert(1)';},
      copy => {copy.reasoning.choices[0].sources[0].sha256 = '0'.repeat(64);},
    ]) {
      const bad = structuredClone(packet); edit(bad);
      assert.equal(await api.parseBodyReviewResponse(bad, identity.id), null);
    }
    const oldContext = await old.bodyReviewContext(identity.id);
    const context = await api.bodyReviewContext(identity.id);
    assert.notEqual(context.revisions.teaching, oldContext.revisions.teaching);
    let storageCalls = 0;
    const stale = {catalogScope: oldContext.catalogScope, structureId: identity.id, track: 'teaching',
      expectedVersion: 0, materialHash: oldContext.materialHash,
      revisionHash: oldContext.revisions.teaching, checklistVersion: oldContext.checklistVersion,
      draft: api.blankBodyReview(oldContext, 'teaching')};
    const response = await api.postBodyDecision(new Request('https://atlas.example/api/body-review/decisions', {
      method: 'POST', headers: {'content-type': 'application/json',
        'oai-authenticated-user-id': 'synthetic-reviewer', origin: 'https://atlas.example'}, body: JSON.stringify(stale),
    }), {prepare() {storageCalls++; throw Error('Stale decision touched storage');}});
    assert.equal(response.status, 409);
    assert.equal(storageCalls, 0);
  }
});

test('source, manifest, clearance and licensed model identity tampering is refused', () => {
  const current = validate();
  assert.throws(() => validate({pin: {...current, source: predecessor}}));
  assert.throws(() => validate({pin: {...current, runtimeSources: {...current.runtimeSources, shoulder: predecessor}}}));
  const target = 'public/atlas-runtime/head-neck/manifest.json';
  for (const [key, value] of [['patientDataIncluded', true], ['clinicalApproved', true], ['sourceCommit', predecessor]]) {
    const forged = json(resolve(site, target)); forged[key] = value;
    const bytes = Buffer.from(JSON.stringify(forged));
    const read = path => path === target ? bytes : readFileSync(resolve(site, path));
    assert.throws(() => validate({pin: current, read}), `Tampered ${key} hash`);
    assert.throws(() => validate({pin: {...current, documents: {...current.documents, [target]: sha(bytes)}}, read}),
      `Rehashed ${key} claim`);
  }
  const inventory = json(resolve(site, 'lib/atlas-model-inventory.json'));
  const prior = json(resolve(parent, 'lib/atlas-model-inventory.json'));
  assert.deepEqual(inventory.models, prior.models);
  assert.equal(inventory.models.length, 137);
  assert.equal(inventory.models.flatMap(row => row.paths).length, 144);
  assert.equal(inventory.models.reduce((sum, row) => sum + row.bytes, 0), 199072480);
});
