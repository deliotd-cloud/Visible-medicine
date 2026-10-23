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

const sourceRoot = 'F:/VisibleMedicine/staging/20261023-hip-reasoning/atlas';
const source = 'be9b53d96c37f1ea973e60f5981ad80db0893177';
const sourceTree = 'f94d89f76d1b29f2aeb5d66d23dd5b0cf5a55ff6';
const priorSource = '39dbb747a44feb0f4bc83e757310c5e3d1b49580';
const sourceReceiptPath = 'F:/VisibleMedicine/staging/20261023-hip-reasoning/SOURCE_BOUND.json';
const sourceReceiptSha = '5aaae85bd8efef3ffdb439ae1e88b2f3dc5b660031232507be296f76e4eca919';
const parentRoot = 'F:/VisibleMedicine/staging/20261023-regional-tour-website/website/';
const parentReceiptPath = 'F:/VisibleMedicine/staging/20261023-regional-tour-website/SOURCE_BOUND.json';
const parentReceiptSha = 'ce7ce83661f3c21ca09e9116250c58ea6c57502d36e99766c163c1eb0f98d6fe';
const paths = ['content/hip-relationships-reasoning-pins.json', 'lib/hip-relationships-reasoning.ts', 'lib/reasoning-questions.ts'];
const keys = ['obturator-externus', 'gluteus-minimus', 'tensor-fasciae-latae'].map(slug => `hip-relationships-${slug}`);
const expectedPairs = [
  [keys[0], ['FMA22326', 'FJ1425'], ['FMA22327', 'FJ1425M']],
  [keys[1], ['FMA22332', 'FJ1420'], ['FMA22333', 'FJ1420M']],
  [keys[2], ['FMA22425', 'FJ1438'], ['FMA22426', 'FJ1438M']],
];
const limitation = ' These source meshes identify named structures, but do not establish their attachments, route, or function in an individual; dynamic motion is not represented. Revision-bound radiologist review is pending.';
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

test('model inventory remains the parent model set with one private source-policy rebinding', () => {
  const inventory = json('lib/atlas-model-inventory.json');
  const prior = JSON.parse(parentRead('lib/atlas-model-inventory.json'));
  assert.deepEqual(inventory.models, prior.models);
  assert.deepEqual({...inventory, sources: prior.sources}, prior);
  const oldHash = sha(parentRead('lib/atlas-model-inventory.json'));
  const newHash = sha(readFileSync('lib/atlas-model-inventory.json'));
  assert.notEqual(newHash, oldHash);
  const policyText = readFileSync('lib/atlas-delivery-policy.ts', 'utf8');
  assert.equal(policyText.split(newHash).length, 2, 'One current inventory hash');
  assert.equal(policyText.replace(newHash, oldHash), parentRead('lib/atlas-delivery-policy.ts').toString());
  const oldPolicy = {...ATLAS_DELIVERY_POLICY, manifestRevision: oldHash};
  assert.equal(verifyPrivateAtlasDeliveryPolicy(inventory, ATLAS_DELIVERY_POLICY).userAuthorized, false);
  assert.equal(verifyPrivateAtlasDeliveryPolicy(prior, oldPolicy).userAuthorized, false);
  assert.throws(() => verifyPrivateAtlasDeliveryPolicy(inventory, oldPolicy));
  assert.throws(() => verifyPrivateAtlasDeliveryPolicy(prior, ATLAS_DELIVERY_POLICY));
  assert.throws(() => verifyPrivateAtlasDeliveryPolicy(inventory, {...ATLAS_DELIVERY_POLICY, audience: 'learners'}));
  assert.throws(() => verifyPrivateAtlasDeliveryPolicy(inventory, {...ATLAS_DELIVERY_POLICY, clinicalApproval: true}));
});

test('hip source reaches shared regional learner practice and protected Review; shoulder remains its own curriculum', async () => {
  const pin = validateCurrentAtlasDelivery();
  assert.equal(pin.source, source);
  assert.equal(pin.sourceTree, sourceTree);
  for (const module of ['head-neck', 'shoulder']) assert.equal(pin.runtimeSources[module], source);
  assert.equal(sourceReceipt.head, source);
  assert.equal(sourceReceipt.tree, sourceTree);
  assert.equal(sourceReceipt.parent, priorSource);
  assert.equal(execFileSync('git', ['rev-parse', `${source}^{tree}`], {cwd: sourceRoot, encoding: 'utf8', windowsHide: true, env: {...process.env, GIT_NO_REPLACE_OBJECTS: '1'}}).trim(), sourceTree);
  const review = json('atlas-review/manifest.json');
  const viewer = json('public/atlas-review-viewer/manifest.json');
  assert.equal(review.revision, source);
  assert.equal(viewer.sourceCommit, source);
  assert.equal(viewer.websiteIntegrationSha256, pin.reviewIntegration);
  assert.equal(viewer.personalRecordsIncluded, false);
  const learners = ['head-neck', 'shoulder'].map(module => {
    const base = `public/atlas-runtime/${module}/`;
    const manifest = json(base + 'manifest.json');
    assert.equal(manifest.sourceCommit, source);
    assert.equal(manifest.patientDataIncluded, false);
    assert.equal(manifest.clinicalApproved, false);
    return {module, base, manifest, inputs: json(base + 'source-inputs.json')};
  });
  const sharedLearner = learners.find(learner => learner.module === 'head-neck');
  const shoulder = learners.find(learner => learner.module === 'shoulder');
  const sharedEmitted = emittedTeachingSearch(sharedLearner.base, sharedLearner.manifest.files);
  const reviewDisplay = emittedTeachingSearch('public/atlas-review-viewer/', viewer.files);
  assert(shoulder.inputs.length > 0);
  for (const input of shoulder.inputs) {
    assert(!paths.includes(input.path), `No hip curriculum input in shoulder: ${input.path}`);
    const sourceRow = sourceReceipt.sourceRows.find(row => row.path === input.path);
    assert(sourceRow, `Shoulder input registered in exact Git source receipt: ${input.path}`);
    assert.equal(input.sha256, sourceRow.sha256);
  }
  for (const path of paths) {
    const authored = git(source, path);
    const reviewEntry = review.files.find(row => row.path === path);
    assert(reviewEntry, `Review source: ${path}`);
    assert.equal(reviewEntry.sourceSha256, sha(authored));
    assert.equal(reviewEntry.importedSha256, sha(readFileSync('atlas-review/' + path)));
    assert.equal(readFileSync('atlas-review/' + path, 'utf8').replaceAll('\r\n', '\n'), authored.toString().replaceAll('\r\n', '\n'));
    const input = sharedLearner.inputs.find(row => row.path === path);
    assert(input, `Shared regional learner input: ${path}`);
    assert.equal(input.sha256, sha(authored));
  }
  const pins = json('atlas-review/content/hip-relationships-reasoning-pins.json');
  assert.equal(pins.parentSource, priorSource);
  assert.equal(pins.entries.length, 6);
  assert.deepEqual([...new Set(pins.entries.map(row => row.key))], keys);
  const compiled = await build({stdin: {contents: [
    "export * from './atlas-review/lib/reasoning-questions';",
    "export * from './atlas-review/lib/hip-relationships-reasoning';",
    "export * from './atlas-review/lib/atlas-practice';",
    "export * from './atlas-review/lib/body-review-material';",
    "export * from './atlas-review/lib/body-review-context';",
    "export * from './atlas-review/lib/body-review-response';",
    "export * from './atlas-review/lib/body-reasoning-review';",
    "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
  ].join('\n'), resolveDir: process.cwd(), loader: 'ts'}, bundle: true, write: false, platform: 'node', format: 'esm'});
  const api = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
  assert.deepEqual(readFileSync('atlas-review/public/models/bodyparts3d/full-body/catalog.json'),
    parentRead('atlas-review/public/models/bodyparts3d/full-body/catalog.json'), 'Source catalogue unchanged');
  const catalog = api.bodyDisplayCatalog(json('atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
  assert.equal(catalog.structures.length, 1104);
  const loaded = catalog.bundles.map(bundle => bundle.id);
  assert.equal(api.reasoningConcepts.length, 200);
  assert.deepEqual(api.reasoningConcepts.slice(-3).map(concept => concept.key), keys);
  assert.equal(catalog.structures.filter(api.reasoningConceptFor).length, 360);
  for (const [key, right, left] of expectedPairs) {
    const concept = api.reasoningConcepts.find(row => row.key === key);
    const entries = pins.entries.filter(row => row.key === key);
    assert.deepEqual(entries.map(row => [row.identity.fmaId, row.identity.sources[0].file]), [right, left]);
    assert.deepEqual(entries.map(row => row.identity.laterality), ['right', 'left']);
    assert.equal(concept.readiness, 'draft');
    assert.equal(concept.revision, 1);
    assert.equal(concept.region, 'thigh');
    assert.deepEqual(concept.sourceRegions, key === keys[2] ? ['thigh'] : ['thigh', 'pelvis']);
    assert.deepEqual(concept.bindings, entries.map(({identity}) => ({fma: identity.fmaId, side: identity.laterality, file: identity.sources[0].file})));
    assert(concept.explanation.endsWith(limitation));
    const explanationBody = concept.explanation.slice(0, -limitation.length);
    for (const {identity} of entries) {
      assert.deepEqual(catalog.structures.find(row => row.id === identity.id), identity);
      assert.equal(api.hipRelationshipsReasoningSourceMatches(identity, key), true);
      assert.equal(api.reasoningConceptFor(identity)?.key, key);
      for (const changed of [
        {...identity, name: identity.name + ' foreign'},
        {...identity, sources: [{...identity.sources[0], sha256: '0'.repeat(64)}]},
      ]) {
        assert.equal(api.hipRelationshipsReasoningSourceMatches(changed, key), false);
        assert.equal(api.reasoningConceptFor(changed), undefined);
      }
      for (const region of concept.sourceRegions) {
        const scope = catalog.structures.filter(row => row.regions.includes(region));
        const session = api.createPracticeSession(scope, loaded,
          {id: 1, mode: 'reason', sampling: 'all', count: 1, retryIds: [identity.id]}, () => 0.314159);
        const question = session?.questions[0];
        assert.equal(question?.target, identity.id, `${key} ${region} practice`);
        assert.equal(question.reasoning.key, key);
        assert.equal(question.reasoning.prompt, concept.prompt);
        assert.equal(question.reasoning.explanation, explanationBody + limitation);
        assert.deepEqual(question.reasoning.references, concept.references);
        assert.equal(api.reasoningFeedback(session), undefined);
        const wrong = question.choices.find(id => id !== identity.id);
        assert(wrong, 'Visible alternative');
        const action = {sessionId: session.id, index: 0};
        const correct = api.practiceReducer(session, {type: 'answer', ...action, chosen: identity.id});
        assert.equal(api.practiceScore(correct), 1);
        assert.equal(api.reasoningFeedback(correct)?.key, key);
        const incorrect = api.practiceReducer(session, {type: 'answer', ...action, chosen: wrong});
        assert.equal(api.practiceScore(incorrect), 0);
        const done = api.practiceReducer(incorrect, {type: 'next', ...action});
        const retryIds = api.missedPracticeIds(done.responses);
        assert.deepEqual(retryIds, [identity.id]);
        assert.equal(api.createPracticeSession(scope, loaded,
          {id: 2, mode: 'reason', sampling: 'all', count: 1, retryIds}, () => 0.314159)?.questions[0].target, identity.id);
      }
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
        copy => {copy.reasoning.answerId = copy.reasoning.choices.find(choice => choice.id !== identity.id).id;},
        copy => {copy.reasoning.explanation += ' foreign';},
        copy => {copy.reasoning.references[0].url = 'https://foreign.example';},
        copy => {copy.source.structure.sources[0].sha256 = '0'.repeat(64);},
      ]) {
        const altered = wire(packet); mutate(altered);
        assert.equal(await api.parseBodyReviewResponse(altered, identity.id), null, `${key}: altered packet refused`);
      }
      for (const code of [sharedEmitted, reviewDisplay]) {
        const contains = value => code.includes(value) || code.includes(JSON.stringify(value).slice(1, -1));
        for (const value of [key, identity.fmaId, identity.id, identity.sources[0].file,
          concept.prompt, explanationBody, limitation])
          assert(contains(value), `${key}: missing reachable emitted value ${value}`);
        for (const ref of concept.references) {
          if (ref.url.startsWith('https://rad.uw.edu/muscle-atlas/')) {
            assert(ref.title.startsWith('University of Washington Radiology · '));
            for (const part of ['University of Washington Radiology', ref.title.slice('University of Washington Radiology · '.length),
              'https://rad.uw.edu/muscle-atlas/', new URL(ref.url).pathname.split('/').at(-1)])
              assert(contains(part), `${key}: missing emitted UW reference part ${part}`);
          } else {
            for (const value of [ref.title, ref.url])
              assert(contains(value), `${key}: missing emitted reference ${value}`);
          }
        }
      }
    }
  }
});

test('all 197 prior questions and the precise source-only transition remain intact', () => {
  const pin = validateCurrentAtlasDelivery();
  assert.throws(() => validateCurrentAtlasDelivery({pin: {...pin, source: priorSource}}));
  const previous = git(priorSource, 'lib/reasoning-questions.ts').toString().replaceAll('\r\n', '\n');
  let current = git(source, 'lib/reasoning-questions.ts').toString().replaceAll('\r\n', '\n');
  for (const seam of [
    "import { hipRelationshipsReasoningConcepts, hipRelationshipsReasoningSourceMatches } from './hip-relationships-reasoning';\n",
    '  ...hipRelationshipsReasoningConcepts,\n',
    "      (!c.key.startsWith('hip-relationships-') || hipRelationshipsReasoningSourceMatches(s, c.key)) &&\n",
  ]) {
    assert.equal(current.split(seam).length, 2, 'One exact authored insertion');
    current = current.replace(seam, '');
  }
  assert.equal(current, previous, 'Every prior question definition and filter is unchanged');
  const changed = execFileSync('git', ['diff', '--name-only', priorSource, source], {
    cwd: sourceRoot, encoding: 'utf8', windowsHide: true,
    env: {...process.env, GIT_NO_REPLACE_OBJECTS: '1'},
  }).trim().split(/\r?\n/).filter(Boolean).sort();
  assert.deepEqual(changed, [...sourceReceipt.changed, ...sourceReceipt.added].sort());
  const priorInputs = JSON.parse(parentRead('atlas-review/integration-inputs.json'));
  assert.equal(priorInputs.sourceCommit, priorSource);
  assert.notEqual(pin.reviewIntegration, priorInputs.sha256);
  for (const path of ['package-lock.json', 'atlas-review/lib/independent-study-links.ts'])
    assert.deepEqual(readFileSync(path), parentRead(path));
  const inventory = json('lib/atlas-model-inventory.json');
  for (const row of inventory.sources) {
    assert.equal(row.sourceCommit, pin.runtimeSources[row.module]);
    assert.equal(row.manifestSha256, sha(readFileSync(`public/atlas-runtime/${row.module}/manifest.json`)));
  }
  assert.throws(() => validateCurrentAtlasDelivery({pin: JSON.parse(parentRead('tests/fixtures/current-atlas-delivery.json'))}));
});
