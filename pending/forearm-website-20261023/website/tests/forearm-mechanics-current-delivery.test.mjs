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
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const site = fileURLToPath(new URL('../', import.meta.url));
const atlas = 'F:/VisibleMedicine/staging/20261023-forearm-mechanics-reasoning/atlas';
const parent = 'F:/VisibleMedicine/staging/20261023-head-separate-comparison/website';
const parentReceiptPath = 'F:/VisibleMedicine/staging/20261023-head-separate-comparison/SOURCE_BOUND.json';
const receiptPath = 'F:/VisibleMedicine/staging/20261023-forearm-mechanics-reasoning/SOURCE_BOUND.json';
const source = 'd143c28fb1e5da200712af6629a375c25d17dad7';
const tree = '486287b25d968117cffdd27bb20009fa46cda6f3';
const predecessor = 'b0ad9e786f2f26727cd627ec028c0d3894048c72';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const json = file => JSON.parse(readFileSync(file));
const wire = value => JSON.parse(JSON.stringify(value));
const require = createRequire(resolve(site, 'package.json'));
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
const native = file => execFileSync('git', ['show', `${source}:${file}`], {
  cwd: atlas, windowsHide: true, maxBuffer: 32e6,
  env: {...process.env, GIT_NO_REPLACE_OBJECTS: '1'},
});
const keys = ['flexor-digitorum-superficialis', 'flexor-digitorum-profundus',
  'extensor-carpi-radialis-brevis', 'extensor-carpi-ulnaris', 'extensor-digitorum',
  'extensor-indicis'].map(slug => `forearm-mechanics-${slug}`);
const newPaths = ['content/forearm-mechanics-reasoning-pins.json', 'lib/forearm-mechanics-reasoning.ts'];
const entry = [
  "export * from './lib/reasoning-questions';",
  "export * from './lib/forearm-mechanics-reasoning';",
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
  const imported = resolve(base, 'atlas-review');
  const code = old ? entry.replace("export * from './lib/forearm-mechanics-reasoning';", '') : entry;
  const result = await build({stdin: {contents: code, resolveDir: imported, loader: 'ts'},
    bundle: true, write: false, format: 'cjs', platform: 'node', packages: 'external', jsx: 'automatic'});
  const module = {exports: {}};
  runInNewContext(result.outputFiles[0].text, {module, exports: module.exports, require,
    crypto, TextEncoder, TextDecoder, Request, Response, structuredClone, URL, URLSearchParams});
  return module.exports;
}

test('committed d143 source, importer, four exporters and Review pin the six new stems', () => {
  assert.equal(sha(readFileSync(receiptPath)), 'dda9ece3575b9b12c5a24e39a628d07cc9f6199cc8e3f4c542b56560cc5e039d');
  const receipt = json(receiptPath);
  assert.equal(receipt.atlasHead, source);
  assert.equal(receipt.atlasTree, tree);
  assert.equal(receipt.parentHead, predecessor);
  assert.equal(sha(readFileSync(parentReceiptPath)), '404a7adbb83443606534ca7d463d33af66a21bd01464d5661e7ee7da7eadab1c');
  assert.equal(json(resolve(parent, 'atlas-review/manifest.json')).revision, predecessor);
  assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], {cwd: atlas, encoding: 'utf8', windowsHide: true}).trim(), source);
  assert.equal(execFileSync('git', ['rev-parse', 'HEAD^{tree}'], {cwd: atlas, encoding: 'utf8', windowsHide: true}).trim(), tree);
  const pin = validateCurrentAtlasDelivery();
  assert.equal(pin.source, source);
  assert.equal(pin.sourceTree, tree);
  const review = json(resolve(site, 'atlas-review/manifest.json'));
  const binding = json(resolve(site, 'atlas-review/integration-inputs.json'));
  assert.equal(review.revision, source);
  assert.equal(binding.sourceCommit, source);
  assert.equal(review.websiteIntegrationSha256, binding.sha256);
  for (const path of [...newPaths, 'lib/reasoning-questions.ts']) {
    const bytes = native(path);
    const imported = readFileSync(resolve(site, 'atlas-review', path));
    const record = review.files.find(row => row.path === path);
    assert(record, `Imported source ${path}`);
    assert.equal(record.sourceSha256, sha(bytes), path);
    assert.equal(record.importedSha256, sha(imported), path);
    assert.equal(imported.toString().replaceAll('\r\n', '\n'), bytes.toString().replaceAll('\r\n', '\n'), path);
    const input = binding.inputs.find(row => row.path === `atlas-review/${path}`);
    assert.equal(input?.sha256, sha(imported), `Bound Review input ${path}`);
  }
  const viewer = json(resolve(site, 'public/atlas-review-viewer/manifest.json'));
  assert.equal(viewer.sourceCommit, source);
  assert.equal(viewer.websiteIntegrationSha256, binding.sha256);
  assert.equal(viewer.personalRecordsIncluded, false);
  assert.equal(viewer.mode, 'production');
  for (const module of ['head-neck', 'shoulder', 'lower-limb', 'female-pelvis']) {
    const base = `public/atlas-runtime/${module}/`;
    const manifest = json(resolve(site, base, 'manifest.json'));
    assert.equal(manifest.sourceCommit, source, module);
    assert.equal(manifest.patientDataIncluded, false, module);
  }
  const learnerInputs = json(resolve(site, 'public/atlas-runtime/head-neck/source-inputs.json'));
  for (const path of [...newPaths, 'lib/reasoning-questions.ts'])
    assert.equal(learnerInputs.find(row => row.path === path)?.sha256, sha(native(path)), `Regional learner ${path}`);
  const learnerManifest = json(resolve(site, 'public/atlas-runtime/head-neck/manifest.json'));
  const emitted = emittedTeachingSearch(resolve(site, 'public/atlas-runtime/head-neck') + '/', learnerManifest.files);
  const protectedCode = emittedTeachingSearch(resolve(site, 'public/atlas-review-viewer') + '/', viewer.files);
  for (const key of keys) {
    assert(emitted.includes(key), `Learner omitted ${key}`);
    assert(protectedCode.includes(key), `Review omitted ${key}`);
  }
});

test('actual imported engine preserves 210 concepts and 380 old mappings while admitting twelve paired roots', async () => {
  const [api, old] = await Promise.all([actual(site), actual(parent, true)]);
  const pins = json(resolve(site, 'atlas-review/content/forearm-mechanics-reasoning-pins.json'));
  const catalogBytes = readFileSync(resolve(site, 'atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
  assert.deepEqual(catalogBytes, readFileSync(resolve(parent, 'atlas-review/public/models/bodyparts3d/full-body/catalog.json')));
  const catalog = api.bodyDisplayCatalog(JSON.parse(catalogBytes));
  const bundles = catalog.bundles.map(row => row.id);
  assert.equal(pins.parentSource, predecessor);
  assert.equal(pins.entries.length, 12);
  assert.deepEqual([...new Set(pins.entries.map(row => row.key))], keys);
  assert.equal(old.reasoningConcepts.length, 210);
  assert.equal(api.reasoningConcepts.length, 216);
  assert.deepEqual(wire(api.reasoningConcepts.slice(0, 210)), wire(old.reasoningConcepts));
  assert.deepEqual(wire(api.reasoningConcepts.slice(210)), wire(api.forearmMechanicsReasoningConcepts));
  const priorRoots = catalog.structures.filter(old.reasoningConceptFor);
  assert.equal(priorRoots.length, 380);
  assert.equal(catalog.structures.filter(api.reasoningConceptFor).length, 392);
  const options = id => ({id: 1, mode: 'reason', sampling: 'all', count: 1, retryIds: [id]});
  for (const structure of priorRoots) {
    assert.deepEqual(wire(api.reasoningConceptFor(structure)), wire(old.reasoningConceptFor(structure)), structure.id);
    assert.deepEqual(wire(api.createPracticeSession(catalog.structures, bundles, options(structure.id), () => .314159)?.questions),
      wire(old.createPracticeSession(catalog.structures, bundles, options(structure.id), () => .314159)?.questions), structure.id);
  }
  for (const key of keys) {
    const concept = api.forearmMechanicsReasoningConcepts.find(row => row.key === key);
    assert(concept);
    assert.equal(concept.readiness, 'draft');
    assert.equal(concept.revision, 1);
    assert.equal(concept.region, 'forearm');
    assert.deepEqual(wire(concept.references.map(row => row.url).slice(0, 1)),
      [`https://rad.uw.edu/muscle-atlas/${key.slice('forearm-mechanics-'.length)}`]);
    const pair = pins.entries.filter(row => row.key === key);
    assert.deepEqual(pair.map(row => row.identity.laterality), ['right', 'left']);
    for (const {identity} of pair) {
      const target = catalog.structures.find(row => row.id === identity.id);
      assert.deepEqual(wire(target), identity);
      assert.equal(old.reasoningConceptFor(target), undefined);
      assert.equal(api.reasoningConceptFor(target)?.key, key);
      assert.equal(api.forearmMechanicsReasoningSourceMatches(target, key), true);
      for (const changed of [
        {...target, name: target.name + ' foreign'},
        {...target, sources: target.sources.slice().reverse()},
        {...target, sources: target.sources.map((row, index) => index ? row : {...row, sha256: '0'.repeat(64)})},
      ]) if (JSON.stringify(changed) !== JSON.stringify(target)) {
        assert.equal(api.forearmMechanicsReasoningSourceMatches(changed, key), false);
        assert.equal(api.reasoningConceptFor(changed), undefined);
      }
      const session = api.createPracticeSession(catalog.structures, bundles, options(target.id), () => .314159);
      const question = session?.questions[0];
      assert.equal(question?.target, target.id);
      assert.equal(question.reasoning.key, key);
      assert.equal(new Set(question.choices).size, 4);
      assert.equal(api.reasoningFeedback(session), undefined);
      assert.equal(renderToStaticMarkup(React.createElement(api.ReasoningFeedback, {session})), '');
      const action = {sessionId: session.id, index: 0};
      const correct = api.practiceReducer(session, {type: 'answer', ...action, chosen: target.id});
      assert.equal(api.practiceScore(correct), 1);
      assert.equal(api.reasoningFeedback(correct)?.key, key);
      assert.match(renderToStaticMarkup(React.createElement(api.ReasoningFeedback, {session: correct})), /Sources &amp; scope/);
      const wrong = question.choices.find(id => id !== target.id);
      const incorrect = api.practiceReducer(session, {type: 'answer', ...action, chosen: wrong});
      assert.equal(api.practiceScore(incorrect), 0);
      assert.equal(api.reasoningFeedback(incorrect)?.key, key);
      const done = api.practiceReducer(incorrect, {type: 'next', ...action});
      assert.deepEqual(wire(api.missedPracticeIds(done.responses)), [target.id]);
      assert.equal(api.createPracticeSession(catalog.structures, bundles,
        {...options(target.id), retryIds: api.missedPracticeIds(done.responses)}, () => .314159)?.questions[0].target, target.id);
      const packet = wire(await api.bodyReviewMaterial(target.id));
      const prior = wire(await old.bodyReviewMaterial(target.id));
      assert.deepEqual(packet.source, prior.source);
      assert.deepEqual(packet.topics, prior.topics);
      assert.deepEqual(packet.guidedTours, prior.guidedTours);
      assert.equal(prior.reasoning, null);
      assert.equal(packet.reasoning.answerId, target.id);
      assert.equal(packet.reasoning.readiness, 'draft');
      assert.equal(packet.approval, false);
      assert.deepEqual(wire(await api.parseBodyReviewResponse(packet, target.id)), packet);
      for (const edit of [
        copy => {copy.reasoning.answerId = wrong;},
        copy => {copy.reasoning.explanation += ' altered';},
        copy => {copy.reasoning.references[0].url = 'javascript:alert(1)';},
        copy => {copy.reasoning.choices[0].sources[0].sha256 = '0'.repeat(64);},
      ]) {
        const bad = structuredClone(packet); edit(bad);
        assert.equal(await api.parseBodyReviewResponse(bad, target.id), null);
      }
      const oldContext = await old.bodyReviewContext(target.id);
      const context = await api.bodyReviewContext(target.id);
      assert.notEqual(context.revisions.teaching, oldContext.revisions.teaching);
      let storageCalls = 0;
      const stale = {catalogScope: oldContext.catalogScope, structureId: target.id, track: 'teaching',
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
  }
});
