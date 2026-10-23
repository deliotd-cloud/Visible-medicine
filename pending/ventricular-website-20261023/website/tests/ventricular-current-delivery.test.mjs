import assert from 'node:assert/strict';
import test from 'node:test';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {build} from 'esbuild';
import {emittedTeachingSearch} from './atlas-emitted-teaching.ts';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {verifyPrivateAtlasDeliveryPolicy} from '../scripts/verify-atlas-delivery-policy.mjs';
import {ATLAS_DELIVERY_POLICY} from '../lib/atlas-delivery-policy.ts';

const sourceRoot = 'F:/VisibleMedicine/staging/20261023-ventricular-landmark-reasoning/atlas';
const source = '0327b6360e18b62563265d115df2b779c9397792';
const sourceTree = 'ec951ffcf6095d7ae7c1f6255206eb449f44f75e';
const priorSource = 'ed3c8cc0e99f6cf850a915d7a08de2e6489c1b6f';
const parentRoot = 'F:/VisibleMedicine/staging/20261023-image-tools-bound/website/';
const parentReceiptPath = 'F:/VisibleMedicine/staging/20261023-image-tools-bound/SOURCE_BOUND.json';
const parentReceiptSha = '6059dd5edbe38965889b7d4866805804bf8e4685751596a1702541538a3f067f';
const paths = [
  'content/ventricular-landmark-reasoning-pins.json',
  'lib/ventricular-landmark-reasoning.ts',
  'lib/reasoning-questions.ts',
];
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const json = path => JSON.parse(readFileSync(path));
const wire = value => JSON.parse(JSON.stringify(value));
const canonical = value => Array.isArray(value) ? `[${value.map(canonical).join(',')}]`
  : value && typeof value === 'object' ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`
  : JSON.stringify(value);
const reviewHash = value => sha(canonical(wire(value)));
const parentReceiptBytes = readFileSync(parentReceiptPath);
assert.equal(sha(parentReceiptBytes), parentReceiptSha, 'Immutable parent SOURCE_BOUND receipt');
const parentReceipt = JSON.parse(parentReceiptBytes);
assert.equal(parentReceipt.website.replaceAll('\\', '/') + '/', parentRoot);
assert.equal(parentReceipt.atlasHead, priorSource);
const parentRead = path => {
  const row = parentReceipt.sourceRows.find(item => item.path === path);
  assert(row, `Parent receipt row: ${path}`);
  const bytes = readFileSync(parentRoot + path);
  assert.equal(bytes.length, row.bytes, `Parent receipt bytes: ${path}`);
  assert.equal(sha(bytes), row.sha256, `Parent receipt hash: ${path}`);
  return bytes;
};
const git = (revision, path) => execFileSync('git', ['show', `${revision}:${path}`], {
  cwd: sourceRoot, windowsHide: true, maxBuffer: 32e6,
  env: {...process.env, GIT_NO_REPLACE_OBJECTS: '1'},
});

test('three exact authored concepts reach the emitted learner, current Review and source-bound practice', async () => {
  const pin = validateCurrentAtlasDelivery();
  assert.equal(pin.source, source);
  assert.equal(pin.sourceTree, sourceTree);
  assert.equal(pin.runtimeSources['head-neck'], source);
  assert.equal(execFileSync('git', ['rev-parse', `${source}^{tree}`], {cwd: sourceRoot, encoding: 'utf8', windowsHide: true}).trim(), sourceTree);
  const review = json('atlas-review/manifest.json');
  const inputs = json('public/atlas-runtime/head-neck/source-inputs.json');
  const learnerBase = 'public/atlas-runtime/head-neck/';
  const learner = json(learnerBase + 'manifest.json');
  const viewer = json('public/atlas-review-viewer/manifest.json');
  assert.equal(review.revision, source);
  assert.equal(learner.sourceCommit, source);
  assert.equal(viewer.sourceCommit, source);
  assert.equal(viewer.websiteIntegrationSha256, pin.reviewIntegration);
  assert.equal(viewer.personalRecordsIncluded, false);
  assert.equal(learner.patientDataIncluded, false);
  assert.equal(learner.clinicalApproved, false);
  for (const path of paths) {
    const authored = git(source, path);
    const entry = review.files.find(row => row.path === path);
    const input = inputs.find(row => row.path === path);
    assert(entry && input, path);
    assert.equal(entry.sourceSha256, sha(authored), `${path}: exact authored Git source`);
    assert.equal(entry.importedSha256, sha(readFileSync('atlas-review/' + path)), `${path}: imported Review source`);
    assert.equal(input.sha256, sha(authored), `${path}: learner source`);
    assert.equal(readFileSync('atlas-review/' + path, 'utf8').replaceAll('\r\n', '\n'), authored.toString().replaceAll('\r\n', '\n'));
  }
  const pins = json('atlas-review/content/ventricular-landmark-reasoning-pins.json');
  assert.equal(pins.parentCommit, priorSource);
  assert.deepEqual(pins.entries.map(row => [row.key, row.identity.fmaId, row.identity.sources.map(part => part.file)]), [
    ['ventricular-landmark-choroid-plexus', 'FMA61934', ['FJ1755', 'FJ1803']],
    ['ventricular-landmark-mammillary-body', 'FMA74877', ['FJ1768', 'FJ1815']],
    ['ventricular-landmark-lamina-terminalis', 'FMA61975', ['FJ1764', 'FJ1812']],
  ]);
  const compiled = await build({stdin: {contents: [
    "export * from './atlas-review/lib/reasoning-questions';",
    "export * from './atlas-review/lib/ventricular-landmark-reasoning';",
    "export * from './atlas-review/lib/atlas-practice';",
    "export * from './atlas-review/lib/body-review-material';",
    "export * from './atlas-review/lib/body-review-context';",
    "export * from './atlas-review/lib/body-review-response';",
    "export * from './atlas-review/lib/body-reasoning-review';",
    "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
  ].join('\n'), resolveDir: process.cwd(), loader: 'ts'}, bundle: true, write: false, platform: 'node', format: 'esm'});
  const api = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
  const catalog = api.bodyDisplayCatalog(json('atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
  assert.equal(api.reasoningConcepts.length, 193);
  assert.deepEqual(api.reasoningConcepts.slice(-3).map(concept => concept.key), pins.entries.map(entry => entry.key));
  assert.equal(catalog.structures.filter(api.reasoningConceptFor).length, 346);
  assert.equal(catalog.structures.length, 1104);
  assert.deepEqual(pins.coordinateSystem, catalog.coordinateSystem);
  for (const bundle of pins.bundles) assert.deepEqual(catalog.bundles.find(row => row.id === bundle.id), bundle);
  const emitted = emittedTeachingSearch(learnerBase, learner.files);
  const reviewDisplay = emittedTeachingSearch('public/atlas-review-viewer/', viewer.files);
  const allBundles = catalog.bundles.map(bundle => bundle.id);
  for (const {key, identity} of pins.entries) {
    assert.deepEqual(catalog.structures.find(row => row.id === identity.id), identity);
    const concept = api.reasoningConceptFor(identity);
    assert.equal(concept?.key, key);
    assert.equal(concept.readiness, 'draft');
    assert.equal(concept.revision, 1);
    assert.deepEqual(concept.bindings, [{fma: identity.fmaId, side: 'midline', files: identity.sources.map(part => part.file)}]);
    assert.equal(api.ventricularLandmarkReasoningSourceMatches(identity, key), true);
    const sharedSuffix = ' Draft for radiologist review; no scan registration or patient-specific function is established.';
    assert(concept.explanation.endsWith(sharedSuffix));
    for (const code of [emitted, reviewDisplay])
      for (const value of [key, identity.fmaId, identity.id, ...identity.sources.flatMap(part => [part.file, part.sha256]), concept.prompt, concept.explanation.slice(0, -sharedSuffix.length), sharedSuffix, ...concept.references.flatMap(ref => [ref.title, ref.url])])
        assert(code.includes(value) || code.includes(JSON.stringify(value).slice(1, -1)), `${key}: missing emitted learner/Review value ${value}`);
    const session = api.createPracticeSession(catalog.structures, allBundles,
      {id: 1, mode: 'reason', sampling: 'all', count: 1, retryIds: [identity.id]}, () => 0.314159);
    const question = session?.questions[0];
    assert.equal(question?.target, identity.id);
    assert.deepEqual(question.reasoning.references, concept.references);
    assert.equal(question.reasoning.prompt, concept.prompt);
    assert.equal(question.reasoning.explanation, concept.explanation);
    assert.equal(question.reasoning.key, key);
    const packet = wire(await api.bodyReviewMaterial(identity.id));
    assert.deepEqual(api.bodyReviewSnapshot(identity.id)?.reasoning, packet.reasoning);
    assert.deepEqual(packet.source.structure, identity);
    assert.deepEqual(packet.reasoning, api.bodyReasoningReview(catalog, identity.id));
    assert.equal(packet.reasoning.answerId, identity.id);
    assert.equal(packet.reasoning.readiness, 'draft');
    assert.equal(packet.reasoning.prompt, concept.prompt);
    assert.deepEqual(packet.reasoning.references, concept.references);
    assert.equal(packet.approval, false);
    assert.equal(packet.status, 'worksheet-not-submitted');
    const context = await api.bodyReviewContext(identity.id);
    assert.equal(context.teachingHash, packet.fingerprints.teaching);
    assert.equal(context.materialHash, packet.materialHash);
    assert.equal(context.revisions.imaging, null);
    assert.equal(context.revisions.teaching, sha(JSON.stringify({
      catalogScope: context.catalogScope, structureId: identity.id,
      checklistVersion: context.checklistVersion, source: packet.fingerprints.source,
      teaching: packet.fingerprints.teaching, checks: context.checklists.teaching,
    })));
    assert.equal(packet.materialHash, reviewHash({scope: {
      schema: packet.schema, kind: packet.kind, structureId: identity.id,
    }, fingerprints: packet.fingerprints}));
    assert.deepEqual(await api.parseBodyReviewResponse(packet, identity.id), packet);
    for (const mutate of [
      copy => {copy.reasoning.prompt += ' foreign';},
      copy => {copy.reasoning.references[0].url = 'https://foreign.example';},
      copy => {copy.source.structure.sources[0].sha256 = '0'.repeat(64);},
    ]) {
      const altered = wire(packet); mutate(altered);
      assert.equal(await api.parseBodyReviewResponse(altered, identity.id), null, `${key}: altered packet refused`);
    }
    for (const changed of [
      {...identity, name: identity.name + ' foreign'},
      {...identity, sources: identity.sources.map((part, index) => index ? part : {...part, sha256: '0'.repeat(64)})},
    ]) {
      assert.equal(api.ventricularLandmarkReasoningSourceMatches(changed, key), false);
      assert.equal(api.reasoningConceptFor(changed), undefined);
    }
  }
});

test('the prior 190 concepts and current source admission cannot be relabelled', () => {
  const pin = validateCurrentAtlasDelivery();
  const priorPin = {...pin, source: priorSource, sourceTree: '0305c15be5fb58ea7729a3849bbbdb6e1e40649d'};
  assert.throws(() => validateCurrentAtlasDelivery({pin: priorPin}));
  const priorInputs = JSON.parse(parentRead('atlas-review/integration-inputs.json'));
  assert.equal(priorInputs.sourceCommit, priorSource);
  assert.notEqual(pin.reviewIntegration, priorInputs.sha256);
  const previous = git(priorSource, 'lib/reasoning-questions.ts').toString().replaceAll('\r\n', '\n');
  let current = git(source, 'lib/reasoning-questions.ts').toString().replaceAll('\r\n', '\n');
  for (const seam of [
    "import { ventricularLandmarkReasoningConcepts, ventricularLandmarkReasoningSourceMatches } from './ventricular-landmark-reasoning';\n",
    '  ...ventricularLandmarkReasoningConcepts,\n',
    "      (!c.key.startsWith('ventricular-landmark-') || ventricularLandmarkReasoningSourceMatches(s, c.key)) &&\n",
  ]) {
    assert.equal(current.split(seam).length, 2, 'One exact authored insertion');
    current = current.replace(seam, '');
  }
  assert.equal(current, previous, 'All prior concept definitions and source filters remain exact');
  for (const path of ['package-lock.json', 'atlas-review/lib/independent-study-links.ts'])
    assert.deepEqual(readFileSync(path), parentRead(path), `${path}: dependencies and separate access survive`);
  const beforeInventory = JSON.parse(parentRead('lib/atlas-model-inventory.json'));
  const inventory = json('lib/atlas-model-inventory.json');
  assert.deepEqual(inventory.models, beforeInventory.models, 'Every model identity, path and byte count survives');
  assert.equal(inventory.models.length, 137);
  assert.equal(inventory.models.flatMap(model => model.paths).length, 144);
  assert.equal(inventory.models.reduce((n, model) => n + model.bytes, 0), 199072480);
  assert.deepEqual({...inventory, sources: beforeInventory.sources}, beforeInventory);
  assert.deepEqual(inventory.sources.map(row => [row.module, row.modelPaths]), beforeInventory.sources.map(row => [row.module, row.modelPaths]));
  for (const row of inventory.sources) {
    const manifestPath = `public/atlas-runtime/${row.module}/manifest.json`;
    assert.equal(row.sourceCommit, pin.runtimeSources[row.module]);
    assert.equal(row.manifestSha256, sha(readFileSync(manifestPath)));
  }
});

test('every original current-delivery case and negative survives the five declared evidence-line updates', () => {
  const before = parentRead('tests/current-atlas-delivery.test.mjs');
  const current = readFileSync('tests/current-atlas-delivery.test.mjs');
  const pairs = [
    [priorSource, source, 3],
    ['0305c15be5fb58ea7729a3849bbbdb6e1e40649d', sourceTree, 1],
    ['assert.equal(sourceFiles,1569);assert.equal(inputs,1737);', 'assert.equal(sourceFiles,1571);assert.equal(inputs,1739);', 1],
  ];
  let inverse = current.toString();
  for (const [oldText, newText, count] of pairs) {
    assert.equal(inverse.split(newText).length - 1, count);
    inverse = inverse.split(newText).join(oldText);
  }
  assert.deepEqual(Buffer.from(inverse), before, 'Complete authentic predecessor, not a replaced or filtered case subset');
  for (const [oldText, newText, count] of pairs) {
    assert.equal(inverse.split(oldText).length - 1, count);
    inverse = inverse.split(oldText).join(newText);
  }
  assert.deepEqual(Buffer.from(inverse), current, 'Whole-file forward replay');
  assert.throws(() => validateCurrentAtlasDelivery({pin: JSON.parse(parentRead('tests/fixtures/current-atlas-delivery.json'))}));
});

test('the existing administrator-only policy binds the actual new inventory and refuses wider or stale policy', () => {
  const inventory = json('lib/atlas-model-inventory.json');
  const expected = sha(JSON.stringify(inventory, null, 2) + '\n');
  assert.equal(ATLAS_DELIVERY_POLICY.manifestRevision, expected);
  assert.equal(ATLAS_DELIVERY_POLICY.audience, 'administrator-review');
  const before = parentRead('lib/atlas-delivery-policy.ts').toString();
  const actual = readFileSync('lib/atlas-delivery-policy.ts', 'utf8');
  assert.equal(actual.split(expected).length, 2);
  const oldRevision = sha(parentRead('lib/atlas-model-inventory.json'));
  assert.equal(actual.replace(expected, oldRevision), before, 'Only the verified inventory identity changes; every access-policy byte survives');
  assert.equal(verifyPrivateAtlasDeliveryPolicy(inventory, ATLAS_DELIVERY_POLICY).userAuthorized, false);
  for (const policy of [
    {...ATLAS_DELIVERY_POLICY, manifestRevision: oldRevision},
    {...ATLAS_DELIVERY_POLICY, audience: 'learner'},
    {...ATLAS_DELIVERY_POLICY, approved: true},
  ]) assert.throws(() => verifyPrivateAtlasDeliveryPolicy(inventory, policy));
});
