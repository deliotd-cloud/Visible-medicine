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

const sourceRoot = 'F:/VisibleMedicine/staging/20261023-upper-cervical-reasoning/atlas';
const source = 'dab0c8ffa6986a57f8456303d47fa675a37055cf';
const sourceTree = '47ff750bbc04bee840915ee5be61f00d8f1506b5';
const priorSource = '0327b6360e18b62563265d115df2b779c9397792';
const sourceReceiptPath = 'F:/VisibleMedicine/staging/20261023-upper-cervical-reasoning/SOURCE_BOUND.json';
const sourceReceiptSha = 'dd50ff58d146382f6b9ba56bbd490f60c05327b0160faad2f602351b7fe10fc5';
const parentRoot = 'F:/VisibleMedicine/staging/20261023-linked-menus-website/website/';
const parentReceiptPath = 'F:/VisibleMedicine/staging/20261023-linked-menus-website/SOURCE_BOUND.json';
const parentReceiptSha = 'd570f3deb2930a5b893f3892063a10292dc7899dafffa51c07f324ac35ff7bbb';
const paths = ['content/upper-cervical-reasoning-pins.json', 'lib/upper-cervical-reasoning.ts', 'lib/reasoning-questions.ts'];
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const json = path => JSON.parse(readFileSync(path));
const wire = value => JSON.parse(JSON.stringify(value));
const canonical = value => Array.isArray(value) ? `[${value.map(canonical).join(',')}]`
  : value && typeof value === 'object' ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`
  : JSON.stringify(value);
const reviewHash = value => sha(canonical(wire(value)));
const receiptBytes = readFileSync(sourceReceiptPath);
assert.equal(sha(receiptBytes), sourceReceiptSha, 'Exact Atlas source receipt');
const sourceReceipt = JSON.parse(receiptBytes);
const parentReceiptBytes = readFileSync(parentReceiptPath);
assert.equal(sha(parentReceiptBytes), parentReceiptSha, 'Exact full Website parent receipt');
const parentReceipt = JSON.parse(parentReceiptBytes);
assert.equal(parentReceipt.website.replaceAll('\\', '/') + '/', parentRoot);
assert.equal(parentReceipt.atlasHead, priorSource);
const parentRead = path => {
  const row = parentReceipt.sourceRows.find(item => item.path === path);
  assert(row, `Parent receipt row: ${path}`);
  const bytes = readFileSync(parentRoot + path);
  assert.equal(bytes.length, row.bytes);
  assert.equal(sha(bytes), row.sha256);
  return bytes;
};
const git = (revision, path) => execFileSync('git', ['show', `${revision}:${path}`], {
  cwd: sourceRoot, windowsHide: true, maxBuffer: 32e6,
  env: {...process.env, GIT_NO_REPLACE_OBJECTS: '1'},
});
const expectedPairs = [
  ['upper-cervical-rectus-capitis-posterior-minor', ['FMA32532', 'FJ1590'], ['FMA32533', 'FJ1568']],
  ['upper-cervical-obliquus-capitis-superior', ['FMA32534', 'FJ1585'], ['FMA32535', 'FJ1564']],
  ['upper-cervical-rectus-capitis-anterior', ['FMA46313', 'FJ1588'], ['FMA46314', 'FJ1566']],
  ['upper-cervical-rectus-capitis-lateralis', ['FMA46317', 'FJ1591'], ['FMA46318', 'FJ1569']],
];

test('source-only inventory rebinding preserves staff-only access and rejects stale or expanded policy', () => {
  const inventory = json('lib/atlas-model-inventory.json');
  const oldInventory = JSON.parse(parentRead('lib/atlas-model-inventory.json'));
  const policyText = readFileSync('lib/atlas-delivery-policy.ts', 'utf8');
  const oldPolicyText = parentRead('lib/atlas-delivery-policy.ts').toString();
  const currentHash = sha(readFileSync('lib/atlas-model-inventory.json'));
  const oldHash = sha(parentRead('lib/atlas-model-inventory.json'));
  assert.notEqual(currentHash, oldHash);
  assert.equal(policyText.split(currentHash).length, 2);
  assert.equal(policyText.replace(currentHash, oldHash), oldPolicyText);
  const oldPolicy = {...ATLAS_DELIVERY_POLICY, manifestRevision: oldHash};
  assert.equal(verifyPrivateAtlasDeliveryPolicy(inventory, ATLAS_DELIVERY_POLICY).userAuthorized, false);
  assert.equal(verifyPrivateAtlasDeliveryPolicy(oldInventory, oldPolicy).userAuthorized, false);
  assert.throws(() => verifyPrivateAtlasDeliveryPolicy(inventory, oldPolicy));
  assert.throws(() => verifyPrivateAtlasDeliveryPolicy(oldInventory, ATLAS_DELIVERY_POLICY));
  assert.throws(() => verifyPrivateAtlasDeliveryPolicy(inventory, {...ATLAS_DELIVERY_POLICY, audience: 'learners'}));
  assert.throws(() => verifyPrivateAtlasDeliveryPolicy(inventory, {...ATLAS_DELIVERY_POLICY, clinicalApproval: true}));
});

test('four paired upper-cervical concepts reach imported practice, protected Review and both emitted entries', async () => {
  const pin = validateCurrentAtlasDelivery();
  assert.equal(pin.source, source);
  assert.equal(pin.sourceTree, sourceTree);
  assert.equal(pin.runtimeSources['head-neck'], source);
  assert.equal(sourceReceipt.head, source);
  assert.equal(sourceReceipt.tree, sourceTree);
  assert.equal(sourceReceipt.parent, priorSource);
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
    assert.equal(entry.sourceSha256, sha(authored), `${path}: exact Git source`);
    assert.equal(entry.importedSha256, sha(readFileSync('atlas-review/' + path)), `${path}: Review import`);
    assert.equal(input.sha256, sha(authored), `${path}: learner input`);
    assert.equal(readFileSync('atlas-review/' + path, 'utf8').replaceAll('\r\n', '\n'), authored.toString().replaceAll('\r\n', '\n'));
  }
  const pins = json('atlas-review/content/upper-cervical-reasoning-pins.json');
  assert.equal(pins.parentSource, priorSource);
  assert.equal(pins.entries.length, 8);
  assert.deepEqual(expectedPairs.map(([key]) => key), [...new Set(pins.entries.map(row => row.key))]);
  for (const [key, right, left] of expectedPairs) {
    const entries = pins.entries.filter(row => row.key === key);
    assert.deepEqual(entries.map(row => [row.identity.fmaId, row.identity.sources[0].file]), [right, left]);
    assert.deepEqual(entries.map(row => row.identity.laterality), ['right', 'left']);
  }
  const compiled = await build({stdin: {contents: [
    "export * from './atlas-review/lib/reasoning-questions';",
    "export * from './atlas-review/lib/upper-cervical-reasoning';",
    "export * from './atlas-review/lib/atlas-practice';",
    "export * from './atlas-review/lib/body-review-material';",
    "export * from './atlas-review/lib/body-review-context';",
    "export * from './atlas-review/lib/body-review-response';",
    "export * from './atlas-review/lib/body-reasoning-review';",
    "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
  ].join('\n'), resolveDir: process.cwd(), loader: 'ts'}, bundle: true, write: false, platform: 'node', format: 'esm'});
  const api = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
  const catalog = api.bodyDisplayCatalog(json('atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
  assert.equal(api.reasoningConcepts.length, 197);
  assert.deepEqual(api.reasoningConcepts.slice(-4).map(concept => concept.key), expectedPairs.map(row => row[0]));
  assert.equal(catalog.structures.filter(api.reasoningConceptFor).length, 354);
  assert.equal(catalog.structures.length, 1104);
  const emitted = emittedTeachingSearch(learnerBase, learner.files);
  const reviewDisplay = emittedTeachingSearch('public/atlas-review-viewer/', viewer.files);
  const allBundles = catalog.bundles.map(bundle => bundle.id);
  const limitation = ' The selected source meshes identify named anatomy; they do not establish dynamic motion or patient-specific function. Radiologist review is pending.';
  for (const [key] of expectedPairs) {
    const concept = api.reasoningConcepts.find(row => row.key === key);
    const entries = pins.entries.filter(row => row.key === key);
    assert(concept);
    assert.equal(concept.readiness, 'draft');
    assert.equal(concept.revision, 1);
    assert.equal(concept.region, 'spine');
    assert.deepEqual(concept.bindings, entries.map(({identity}) => ({fma: identity.fmaId, side: identity.laterality, file: identity.sources[0].file})));
    assert(concept.explanation.endsWith(limitation));
    const explanationBody = concept.explanation.slice(0, -limitation.length);
    for (const {identity} of entries) {
      assert.deepEqual(catalog.structures.find(row => row.id === identity.id), identity);
      assert.equal(api.upperCervicalReasoningSourceMatches(identity, key), true);
      assert.equal(api.reasoningConceptFor(identity)?.key, key);
      for (const changed of [
        {...identity, name: identity.name + ' foreign'},
        {...identity, sources: [{...identity.sources[0], sha256: '0'.repeat(64)}]},
      ]) {
        assert.equal(api.upperCervicalReasoningSourceMatches(changed, key), false);
        assert.equal(api.reasoningConceptFor(changed), undefined);
      }
      const session = api.createPracticeSession(catalog.structures, allBundles,
        {id: 1, mode: 'reason', sampling: 'all', count: 1, retryIds: [identity.id]}, () => 0.314159);
      const question = session?.questions[0];
      assert.equal(question?.target, identity.id);
      assert.equal(question.reasoning.key, key);
      assert.equal(question.reasoning.prompt, concept.prompt);
      assert.equal(question.reasoning.explanation, explanationBody + limitation, 'Actual runtime assembles both emitted components');
      assert.deepEqual(question.reasoning.references, concept.references);
      const packet = wire(await api.bodyReviewMaterial(identity.id));
      assert.deepEqual(api.bodyReviewSnapshot(identity.id)?.reasoning, packet.reasoning);
      assert.deepEqual(packet.source.structure, identity);
      assert.deepEqual(packet.reasoning, api.bodyReasoningReview(catalog, identity.id));
      assert.equal(packet.reasoning.answerId, identity.id);
      assert.equal(packet.reasoning.readiness, 'draft');
      assert.equal(packet.reasoning.prompt, concept.prompt);
      assert.equal(packet.reasoning.explanation, explanationBody + limitation);
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
        copy => {copy.reasoning.explanation += ' foreign';},
        copy => {copy.reasoning.references[0].url = 'https://foreign.example';},
        copy => {copy.source.structure.sources[0].sha256 = '0'.repeat(64);},
      ]) {
        const altered = wire(packet); mutate(altered);
        assert.equal(await api.parseBodyReviewResponse(altered, identity.id), null, `${key}: altered packet refused`);
      }
      for (const code of [emitted, reviewDisplay])
        for (const value of [key, identity.fmaId, identity.id, identity.sources[0].file, identity.sources[0].sha256,
          concept.prompt, explanationBody, limitation, ...concept.references.flatMap(ref => [ref.title, ref.url])])
          assert(code.includes(value) || code.includes(JSON.stringify(value).slice(1, -1)), `${key}: missing reachable emitted value ${value}`);
    }
  }
});

test('prior 193 definitions and current source identity survive without relabelling', () => {
  const pin = validateCurrentAtlasDelivery();
  assert.throws(() => validateCurrentAtlasDelivery({pin: {...pin, source: priorSource, sourceTree: 'ec951ffcf6095d7ae7c1f6255206eb449f44f75e'}}));
  const priorInputs = JSON.parse(parentRead('atlas-review/integration-inputs.json'));
  assert.equal(priorInputs.sourceCommit, priorSource);
  assert.notEqual(pin.reviewIntegration, priorInputs.sha256);
  const previous = git(priorSource, 'lib/reasoning-questions.ts').toString().replaceAll('\r\n', '\n');
  let current = git(source, 'lib/reasoning-questions.ts').toString().replaceAll('\r\n', '\n');
  for (const seam of [
    "import { upperCervicalReasoningConcepts, upperCervicalReasoningSourceMatches } from './upper-cervical-reasoning';\n",
    '  ...upperCervicalReasoningConcepts,\n',
    "      (!c.key.startsWith('upper-cervical-') || upperCervicalReasoningSourceMatches(s, c.key)) &&\n",
  ]) {
    assert.equal(current.split(seam).length, 2, 'One exact authored insertion');
    current = current.replace(seam, '');
  }
  assert.equal(current, previous, 'Every prior definition and filter remains byte-identical');
  const changed = execFileSync('git', ['diff', '--name-only', priorSource, source], {
    cwd: sourceRoot, encoding: 'utf8', windowsHide: true,
    env: {...process.env, GIT_NO_REPLACE_OBJECTS: '1'},
  }).trim().split(/\r?\n/).filter(Boolean).sort();
  assert.deepEqual(changed, [...sourceReceipt.changed, ...sourceReceipt.added].sort(),
    'Source-only diff leaves prior sessions, 9,936 topic placements and other worksheets untouched');
  for (const path of ['package-lock.json', 'atlas-review/lib/independent-study-links.ts'])
    assert.deepEqual(readFileSync(path), parentRead(path));
  const beforeInventory = JSON.parse(parentRead('lib/atlas-model-inventory.json'));
  const inventory = json('lib/atlas-model-inventory.json');
  assert.deepEqual(inventory.models, beforeInventory.models);
  assert.equal(inventory.models.length, 137);
  assert.equal(inventory.models.flatMap(model => model.paths).length, 144);
  assert.equal(inventory.models.reduce((n, model) => n + model.bytes, 0), 199072480);
  assert.deepEqual({...inventory, sources: beforeInventory.sources}, beforeInventory);
  for (const row of inventory.sources) {
    assert.equal(row.sourceCommit, pin.runtimeSources[row.module]);
    assert.equal(row.manifestSha256, sha(readFileSync(`public/atlas-runtime/${row.module}/manifest.json`)));
  }
  assert.throws(() => validateCurrentAtlasDelivery({pin: JSON.parse(parentRead('tests/fixtures/current-atlas-delivery.json'))}));
});
