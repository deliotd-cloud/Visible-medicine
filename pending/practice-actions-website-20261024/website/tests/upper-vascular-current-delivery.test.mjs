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

const site = 'F:/VisibleMedicine/staging/20261024-upper-vascular-website/website';
const historicalReceipt='F:/VisibleMedicine/staging/20261024-upper-vascular-website/SOURCE_BOUND.json';
assert.equal(createHash('sha256').update(readFileSync(historicalReceipt)).digest('hex'),'40fd40cba3b6f75253e0f3b825bd02d6a94e876e6d8aafedb5e8a043ce1ed8e2');
const historicalPin=JSON.parse(readFileSync(resolve(site,'tests/fixtures/current-atlas-delivery.json')));
const validateCurrentAtlasDelivery=(options={})=>validateDelivery({root:site,pin:historicalPin,...options});
const parent = 'F:/VisibleMedicine/staging/20261024-tour-focus-website/website';
const parentReceipt = 'F:/VisibleMedicine/staging/20261024-tour-focus-website/SOURCE_BOUND.json';
const atlas = 'F:/VisibleMedicine/staging/20261024-upper-vascular-reasoning/atlas';
const nativeReceipt = 'F:/VisibleMedicine/staging/20261024-upper-vascular-reasoning/SOURCE_BOUND.json';
const source = '5f3c0a9518b03ae23f3992129a09c4b6edeeda2b';
const tree = '9263c23e98b24068a8b4b4f0c4635bdd133c2fa5';
const predecessor = 'cf9b5091db90219981929f6a9cbfdf1056bac9d6';
const modules = ['head-neck', 'shoulder', 'lower-limb', 'female-pelvis'];
const slugs = ['axillary-artery', 'brachial-artery', 'deep-brachial-artery', 'radial-artery',
  'ulnar-artery', 'common-interosseous-artery', 'anterior-interosseous-artery',
  'axillary-vein', 'cephalic-vein', 'basilic-vein'];
const keys = slugs.map(slug => `upper-vascular-${slug}`);
const newPaths = ['content/upper-vascular-reasoning-pins.json', 'lib/upper-vascular-reasoning.ts'];
const sourcePaths = [...newPaths, 'lib/reasoning-questions.ts', 'lib/body-review-material.ts'];
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const json = path => JSON.parse(readFileSync(path));
const wire = value => JSON.parse(JSON.stringify(value));
const require = createRequire(resolve(site, 'package.json'));
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
const native = path => execFileSync('git', ['show', `${source}:${path}`], {
  cwd: atlas, windowsHide: true, maxBuffer: 32e6,
  env: {...process.env, GIT_NO_REPLACE_OBJECTS: '1'},
});
const entry = [
  "export * from './lib/reasoning-questions';",
  "export * from './lib/upper-vascular-reasoning';",
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
async function actual(base, old = false) {
  const contents = old ? entry.replace("export * from './lib/upper-vascular-reasoning';", '') : entry;
  const result = await build({stdin: {contents, resolveDir: resolve(base, 'atlas-review'), loader: 'ts'},
    bundle: true, write: false, format: 'cjs', platform: 'node', packages: 'external', jsx: 'automatic'});
  const module = {exports: {}};
  runInNewContext(result.outputFiles[0].text, {module, exports: module.exports, require,
    crypto, TextEncoder, TextDecoder, Request, Response, structuredClone, URL, URLSearchParams});
  return module.exports;
}

test('sealed upper vascular source reaches current Review and four original runtime deliveries', () => {
  assert.equal(sha(readFileSync(parentReceipt)), '8603c4cf03014055a2ca5c13670ca00e25bae723a4938c8093a8d8ffe1f513f4');
  assert.equal(sha(readFileSync(nativeReceipt)), '1f2625d80c17a6d43d12bb538bc397facd3db1b5ac23c20d0b55aab4080db03c');
  const baseline = json(parentReceipt), receipt = json(nativeReceipt);
  assert.equal(baseline.atlasHead, predecessor);
  assert.equal(receipt.atlasHead, source);
  assert.equal(receipt.atlasTree, tree);
  assert.equal(receipt.parentHead, predecessor);
  assert.equal(receipt.native.oldConcepts, 222);
  assert.equal(receipt.native.concepts, 232);
  assert.equal(receipt.native.oldTargets, 404);
  assert.equal(receipt.native.targets, 424);
  assert.equal(receipt.native.newConcepts, 10);
  assert.equal(receipt.native.newTargets, 20);
  assert.equal(receipt.native.lessonsPreserved, 9936);
  assert.equal(receipt.native.clinicalApproval, false);
  assert.equal(receipt.native.patientSpaceRegistration, false);
  assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], {cwd: atlas, encoding: 'utf8', windowsHide: true}).trim(), source);
  assert.equal(execFileSync('git', ['rev-parse', 'HEAD^{tree}'], {cwd: atlas, encoding: 'utf8', windowsHide: true}).trim(), tree);
  assert.equal(execFileSync('git', ['status', '--porcelain'], {cwd: atlas, encoding: 'utf8', windowsHide: true}).trim(), '');
  const pin = validateCurrentAtlasDelivery();
  assert.equal(pin.source, source);
  assert.equal(pin.sourceTree, tree);
  const oldPin = json(resolve(parent, 'tests/fixtures/current-atlas-delivery.json'));
  assert.equal(oldPin.source, predecessor);
  assert.throws(() => validateCurrentAtlasDelivery({pin: oldPin, root: site}));
  const review = json(resolve(site, 'atlas-review/manifest.json'));
  const binding = json(resolve(site, 'atlas-review/integration-inputs.json'));
  const viewer = json(resolve(site, 'public/atlas-review-viewer/manifest.json'));
  assert.equal(review.revision, source);
  assert.equal(binding.sourceCommit, source);
  assert.equal(review.websiteIntegrationSha256, binding.sha256);
  assert.equal(viewer.sourceCommit, source);
  assert.equal(viewer.websiteIntegrationSha256, binding.sha256);
  assert.equal(viewer.personalRecordsIncluded, false);
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
    assert.equal(pin.runtimeSources[name], source, name);
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
  const importedConcepts = json(resolve(site, 'atlas-review/content/upper-vascular-reasoning-pins.json'));
  for (const key of keys) {
    assert(emitted.includes(key), `Root learner omitted ${key}`);
    assert(protectedCode.includes(key), `Protected Review omitted ${key}`);
  }
  const snapshotPath=resolve(atlas,'../candidate-snapshot.json');
  assert.equal(sha(readFileSync(snapshotPath)),receipt.evidence.find(row=>row.path==='candidate-snapshot.json')?.sha256);
  for(const concept of json(snapshotPath).concepts.filter(row=>keys.includes(row.key))){
    assert(emitted.includes(concept.prompt),`Root learner omitted original prompt: ${concept.key}`);
    assert(protectedCode.includes(concept.prompt),`Protected Review omitted original prompt: ${concept.key}`);
  }
  for(const path of ['app/body-explorer.tsx','app/tour-explore-attention.tsx']){
    assert.deepEqual(readFileSync(resolve(site,'atlas-review',path)),readFileSync(resolve(parent,'atlas-review',path)),`Prior focus behavior preserved: ${path}`);
    assert.equal(headInputs.find(row=>row.path===path)?.sha256,sha(native(path)),`Root focus source: ${path}`);
  }
  for(const marker of ['data-structure-study-heading','visibilitychange']){
    assert(emitted.includes(marker),`Root learner omitted focus marker: ${marker}`);
    assert(protectedCode.includes(marker),`Protected Review omitted focus marker: ${marker}`);
  }
  assert.equal(importedConcepts.entries.length, 20);
});

test('imported engine retains all 222 previous concepts and 404 exact targets, then adds 20 source-pinned prompts', async () => {
  const [api, old] = await Promise.all([actual(site), actual(parent, true)]);
  const pins = json(resolve(site, 'atlas-review/content/upper-vascular-reasoning-pins.json'));
  const catalogBytes = readFileSync(resolve(site, 'atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
  assert.deepEqual(catalogBytes, readFileSync(resolve(parent, 'atlas-review/public/models/bodyparts3d/full-body/catalog.json')));
  const catalog = api.bodyDisplayCatalog(JSON.parse(catalogBytes));
  const bundles = catalog.bundles.map(row => row.id);
  assert.equal(pins.parentSource, predecessor);
  assert.deepEqual([...new Set(pins.entries.map(row => row.key))], keys);
  assert.equal(old.reasoningConcepts.length, 222);
  assert.equal(api.reasoningConcepts.length, 232);
  assert.deepEqual(wire(api.reasoningConcepts.slice(0, 222)), wire(old.reasoningConcepts));
  assert.deepEqual(wire(api.reasoningConcepts.slice(222)), wire(api.upperVascularReasoningConcepts));
  const prior = catalog.structures.filter(old.reasoningConceptFor);
  assert.equal(prior.length, 404);
  assert.equal(catalog.structures.filter(api.reasoningConceptFor).length, 424);
  const options = id => ({id: 1, mode: 'reason', sampling: 'all', count: 1, retryIds: [id]});
  for (const structure of prior) {
    assert.deepEqual(wire(api.reasoningConceptFor(structure)), wire(old.reasoningConceptFor(structure)), structure.id);
    assert.deepEqual(wire(api.createPracticeSession(catalog.structures, bundles, options(structure.id), () => .314159)?.questions),
      wire(old.createPracticeSession(catalog.structures, bundles, options(structure.id), () => .314159)?.questions), structure.id);
  }
  for (const key of keys) {
    const concept = api.upperVascularReasoningConcepts.find(row => row.key === key);
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
      assert.equal(api.upperVascularReasoningSourceMatches(target, key), true);
      for (const changed of [
        {...target, name: target.name + ' foreign'},
        {...target, regions: [...target.regions].reverse()},
        {...target, sources: [...target.sources].reverse()},
        {...target, sources: target.sources.map((row, index) => index ? row : {...row, sha256: '0'.repeat(64)})},
      ]) if (JSON.stringify(changed) !== JSON.stringify(target)) {
        assert.equal(api.upperVascularReasoningSourceMatches(changed, key), false);
        assert.equal(api.reasoningConceptFor(changed), undefined);
      }
      const session = api.createPracticeSession(catalog.structures, bundles, options(target.id), () => .314159);
      const question = session?.questions[0];
      assert.equal(question?.target, target.id);
      assert.equal(question.reasoning.key, key);
      assert.equal(question.reasoning.prompt, concept.prompt);
      assert.equal(new Set(question.choices).size, 4);
      assert(question.choices.every(id => catalog.structures.find(row => row.id === id)?.laterality === target.laterality));
      assert.equal(api.reasoningFeedback(session), undefined);
      assert.equal(renderToStaticMarkup(React.createElement(api.ReasoningFeedback, {session})), '');
      assert.equal(api.createPracticeSession(catalog.structures, [], options(target.id), () => .314159), null);
      assert.equal(api.createPracticeSession(catalog.structures, bundles,
        {...options(target.id), sampling: 'focus', focusIds: [target.id]}, () => .314159), null);
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

test('new Review packets reject edited reasoning and stale revision decisions before storage', async () => {
  const [api, old] = await Promise.all([actual(site), actual(parent, true)]);
  const pins = json(resolve(site, 'atlas-review/content/upper-vascular-reasoning-pins.json'));
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
    }), {prepare() { storageCalls++; throw Error('Stale decision touched storage'); }});
    assert.equal(response.status, 409);
    assert.equal(storageCalls, 0);
  }
});

test('source, manifest, clearance and licensed model identity tampering is refused', () => {
  const pin = validateCurrentAtlasDelivery();
  assert.throws(() => validateCurrentAtlasDelivery({pin: {...pin, source: predecessor}}));
  assert.equal(pin.sourceTree, tree);
  assert.throws(() => validateCurrentAtlasDelivery({pin: {...pin, runtimeSources: {...pin.runtimeSources, shoulder: predecessor}}}));
  const target = 'public/atlas-runtime/head-neck/manifest.json';
  for (const [key, value] of [['patientDataIncluded', true], ['clinicalApproved', true], ['sourceCommit', predecessor]]) {
    const forged = json(resolve(site, target)); forged[key] = value;
    const bytes = Buffer.from(JSON.stringify(forged));
    const read = path => path === target ? bytes : readFileSync(resolve(site, path));
    assert.throws(() => validateCurrentAtlasDelivery({pin, read}), `Tampered ${key} hash`);
    assert.throws(() => validateCurrentAtlasDelivery({pin: {...pin, documents: {...pin.documents, [target]: sha(bytes)}}, read}),
      `Rehashed ${key} claim`);
  }
  const inventory = json(resolve(site, 'lib/atlas-model-inventory.json'));
  const prior = json(resolve(parent, 'lib/atlas-model-inventory.json'));
  assert.deepEqual(inventory.models, prior.models);
  assert.equal(inventory.models.length, 137);
  assert.equal(inventory.models.flatMap(row => row.paths).length, 144);
  assert.equal(inventory.models.reduce((sum, row) => sum + row.bytes, 0), 199072480);
});
