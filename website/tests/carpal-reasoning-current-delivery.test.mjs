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

const sourceRoot = 'F:/VisibleMedicine/staging/20261023-carpal-reasoning/atlas';
const source = '5f278c3d0c26c5a0899b54f2cfa2a0accb02ecf7';
const sourceTree = '12ebdf5d221220c4b6819abdcdeb04231048bf17';
const previousCurrentSource = '66ac064579ee23c5739d0907e8378e0e2d57d7bd';
const previousCurrentTree = '0730550af7e5f8cc1d763d7326ca0a0c05458ca7';
const currentSource = '2ab63cbbc1c5e18a4d7b3a65f799e863f5be0491';
const currentSourceTree = 'c625d8b1a55aabd8e6497169856e9d67b85ea0f3';
// The 2ab epoch is the authenticated historical successor of the carpal introduction.
// Current delivery is checked separately against the clean canonical Atlas tree.
const deliveredSource = 'c32bc81cf0fd7ec22fa83e8b1365019297f9a0b3';
const deliveredTree = 'd7ead7f3673ddf5c4b68db755b559b08b921eec6';
const deliveredRoot = 'F:/VisibleMedicine/atlas';
const currentSourceRoot = 'F:/VisibleMedicine/staging/20261023-midfoot-reasoning/atlas';
const currentReceiptPath = 'F:/VisibleMedicine/staging/20261023-midfoot-reasoning/SOURCE_BOUND.json';
const currentReceiptSha = 'feba2ee6e0127ff34a9b23eaf01b3fe9ed83b8ced45d0803c66feaacd9b3d7fc';
const previousReceiptPath = 'F:/VisibleMedicine/staging/20261023-review-parser-context/SOURCE_BOUND.json';
const previousReceiptSha = 'a32919b11982957ef10eece8526ac6767d5c5a16499ff51cf2e50c2fc912a5f4';
const priorSource = 'be9b53d96c37f1ea973e60f5981ad80db0893177';
const sourceReceiptPath = 'F:/VisibleMedicine/staging/20261023-carpal-reasoning/SOURCE_BOUND.json';
const sourceReceiptSha = 'b60beb3c9c6436031a269c28138f0688fbbe0c6098394e50d37a938bf072af25';
const parentRoot = 'F:/VisibleMedicine/staging/20261023-structure-guides/website/';
const parentReceiptPath = 'F:/VisibleMedicine/staging/20261023-structure-guides/SOURCE_BOUND.json';
const parentReceiptSha = 'af5814a282bedac3cb20ba7477a34696f4f0783f90a6bee310997b527c7f1bcc';
const paths = ['content/carpal-relationships-reasoning-pins.json', 'lib/carpal-relationships-reasoning.ts', 'lib/reasoning-questions.ts'];
const keys = ['scaphoid', 'lunate', 'triquetrum', 'pisiform'].map(slug => `carpal-relationships-${slug}`);
const pairs = [
  [keys[0], ['FMA24435', 'FJ3383'], ['FMA24436', 'FJ3278']],
  [keys[1], ['FMA24437', 'FJ3374'], ['FMA24438', 'FJ3268']],
  [keys[2], ['FMA24439', 'FJ3390'], ['FMA24440', 'FJ3285']],
  [keys[3], ['FMA24441', 'FJ3382'], ['FMA24442', 'FJ3276']],
];
const limitation = ' These are reference-anatomy relationships, not patient-specific measurements or validated joint motion. Named meshes do not establish cartilage, tendon continuity or scan visibility. Revision-bound radiologist review remains pending.';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const json = path => JSON.parse(readFileSync(path));
const wire = value => JSON.parse(JSON.stringify(value));
const canonical = value => Array.isArray(value) ? `[${value.map(canonical).join(',')}]`
  : value && typeof value === 'object' ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`
  : JSON.stringify(value);
const reviewHash = value => sha(canonical(wire(value)));
const sourceReceiptBytes = readFileSync(sourceReceiptPath);
assert.equal(sha(sourceReceiptBytes), sourceReceiptSha, 'Exact Atlas source receipt');
const sourceReceipt = JSON.parse(sourceReceiptBytes);
const currentReceiptBytes = readFileSync(currentReceiptPath);
assert.equal(sha(currentReceiptBytes), currentReceiptSha);
const currentSourceReceipt = JSON.parse(currentReceiptBytes);
assert.equal(currentSourceReceipt.head, currentSource);
assert.equal(currentSourceReceipt.tree, currentSourceTree);
assert.equal(currentSourceReceipt.parent, previousCurrentSource);
assert.equal(currentSourceReceipt.parentTree, previousCurrentTree);
const previousReceiptBytes = readFileSync(previousReceiptPath);
assert.equal(sha(previousReceiptBytes), previousReceiptSha);
const previousCurrentReceipt = JSON.parse(previousReceiptBytes);
assert.equal(previousCurrentReceipt.head, previousCurrentSource);
assert.equal(previousCurrentReceipt.tree, previousCurrentTree);
const readerReceiptBytes = readFileSync('F:/VisibleMedicine/staging/20261023-tour-reading/SOURCE_BOUND.json');
assert.equal(sha(readerReceiptBytes), '2d2a76bb1fae54be189ff2e4a02636c8352a37bb6ca59d13a52050c10c8f3cdb');
const readerReceipt = JSON.parse(readerReceiptBytes);
assert.equal(readerReceipt.head, '9eac0806a7869cfae435010b013ae611d748c0c9');
assert.equal(readerReceipt.parent, source);
assert.equal(previousCurrentReceipt.parent, readerReceipt.head);
const currentGit = path => execFileSync('git', ['show', currentSource + ':' + path], {
  cwd: currentSourceRoot, windowsHide: true, maxBuffer: 32e6,
  env: {...process.env, GIT_NO_REPLACE_OBJECTS: '1'},
});
const deliveredGit = path => execFileSync('git', ['show', deliveredSource + ':' + path], {
  cwd: deliveredRoot, windowsHide: true, maxBuffer: 32e6,
  env: {...process.env, GIT_NO_REPLACE_OBJECTS: '1'},
});
// Resolve the intermediate parent from its descendant checkout, not from
// the earlier carpal introduction repository which cannot contain that commit.
const previousCurrentGit = path => execFileSync('git', ['show', previousCurrentSource + ':' + path], {
  cwd: currentSourceRoot, windowsHide: true, maxBuffer: 32e6,
  env: {...process.env, GIT_NO_REPLACE_OBJECTS: '1'},
});
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

test('model inventory and parent structure-guides UI retain their exact source set and private policy', () => {
  const inventory = json('lib/atlas-model-inventory.json');
  const prior = JSON.parse(parentRead('lib/atlas-model-inventory.json'));
  assert.deepEqual(inventory.models, prior.models);
  assert.deepEqual({...inventory, sources: prior.sources}, prior);
  const oldHash = sha(parentRead('lib/atlas-model-inventory.json'));
  const newHash = sha(readFileSync('lib/atlas-model-inventory.json'));
  assert.notEqual(newHash, oldHash);
  const policyText = readFileSync('lib/atlas-delivery-policy.ts', 'utf8');
  assert.equal(policyText.split(newHash).length, 2);
  assert.equal(policyText.replace(newHash, oldHash), parentRead('lib/atlas-delivery-policy.ts').toString());
  const oldPolicy = {...ATLAS_DELIVERY_POLICY, manifestRevision: oldHash};
  assert.equal(verifyPrivateAtlasDeliveryPolicy(inventory, ATLAS_DELIVERY_POLICY).userAuthorized, false);
  assert.equal(verifyPrivateAtlasDeliveryPolicy(prior, oldPolicy).userAuthorized, false);
  assert.throws(() => verifyPrivateAtlasDeliveryPolicy(inventory, oldPolicy));
  assert.throws(() => verifyPrivateAtlasDeliveryPolicy(prior, ATLAS_DELIVERY_POLICY));
  assert.throws(() => verifyPrivateAtlasDeliveryPolicy(inventory, {...ATLAS_DELIVERY_POLICY, audience: 'learners'}));
  assert.throws(() => verifyPrivateAtlasDeliveryPolicy(inventory, {...ATLAS_DELIVERY_POLICY, clinicalApproval: true}));
  for (const path of [
    'app/atlas/head-neck-3d/page.tsx', 'app/atlas/shoulder-3d/page.tsx',
    'app/learn/related-anatomy/related-anatomy.css',
    'lib/head-structure-guides.ts', 'tests/head-structure-guides.test.mjs',
    'app/workspace/atlas-review/page.tsx', 'atlas-review/lib/independent-study-links.ts',
    'package-lock.json',
  ]) assert.deepEqual(readFileSync(path), parentRead(path), `Parent UI and access unchanged: ${path}`);
  const relatedPath = 'app/learn/related-anatomy/page.tsx';
  let related = parentRead(relatedPath).toString();
  // Each later edit is visible copy. Exact reconstruction guards the links,
  // access checks, source binding and every untouched byte of the parent UI.
  for (const [before, after] of [
    ['Explore the existing anatomical Atlas.', 'Explore this structure in the 3D Atlas.'],
    ['Choose an anatomy view, then learn more with lectures included in your current access.', 'Choose an anatomy view, then open lecture slides you can access.'],
    ['These are reference views of the same concept, not aligned scans or a transfer of access.', 'These views show the same anatomical concept. CT and MRI show different subjects and are not aligned. The 3D view is not an image match.'],
    ['Open a related tour at this structure, then use its playback controls. Each view checks availability and access separately; these links do not record progress or align scans.', 'Choose a view to open a draft tour at this step. Each view checks availability and access separately. These links do not record progress or align scans.'],
    ['Only published, explicitly linked slides included in your current course access appear.', 'Only published, linked slides from courses you can access appear.'],
    ['No accessible linked slides in this group.', 'No lecture slides to show in this group.'],
    ['Other allocated lectures may have matching slides. Continue to the next group.', 'There may be more linked slides in the next group.'],
    ['Only published, explicitly linked slides with current access are shown. An educator can add a structure link in Studio and publish it through the existing review process.', 'There are no published slides linked to this structure that you can open here.'],
    ['More allocated lectures', 'Next group'],
    ['Atlas, case and paid lecture permissions remain independent. No draft slides or unavailable lecture details are listed.', 'Atlas, case and paid lecture permissions remain independent. Tour views check availability and access separately; opening a tour link does not record progress. No draft slides or unavailable lecture details are listed.'],
  ]) {
    assert.equal(related.split(before).length, 2, `One reviewable copy transition: ${before}`);
    related = related.replace(before, after);
  }
  assert.equal(readFileSync(relatedPath, 'utf8'), related, 'Current related-anatomy UI differs only by the admitted copy changes');
});

test('eight source-pinned carpal bones reach shared practice and protected Review, outside shoulder curriculum', async () => {
  const pin = validateCurrentAtlasDelivery();
  assert.equal(pin.source, deliveredSource);
  assert.equal(pin.sourceTree, deliveredTree);
  for (const module of ['head-neck', 'shoulder', 'lower-limb', 'female-pelvis'])
    assert.equal(pin.runtimeSources[module], deliveredSource);
  assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], {cwd: deliveredRoot, encoding: 'utf8', windowsHide: true}).trim(), deliveredSource);
  assert.equal(execFileSync('git', ['rev-parse', 'HEAD^{tree}'], {cwd: deliveredRoot, encoding: 'utf8', windowsHide: true}).trim(), deliveredTree);
  assert.equal(execFileSync('git', ['status', '--porcelain'], {cwd: deliveredRoot, encoding: 'utf8', windowsHide: true}).trim(), '');
  assert.equal(sourceReceipt.head, source);
  assert.equal(sourceReceipt.tree, sourceTree);
  assert.equal(sourceReceipt.parent, priorSource);
  assert.equal(execFileSync('git', ['rev-parse', `${source}^{tree}`], {cwd: sourceRoot, encoding: 'utf8', windowsHide: true,
    env: {...process.env, GIT_NO_REPLACE_OBJECTS: '1'}}).trim(), sourceTree);
  const review = json('atlas-review/manifest.json');
  const viewer = json('public/atlas-review-viewer/manifest.json');
  assert.equal(review.revision, deliveredSource);
  assert.equal(viewer.sourceCommit, deliveredSource);
  assert.equal(viewer.websiteIntegrationSha256, pin.reviewIntegration);
  assert.equal(viewer.personalRecordsIncluded, false);
  const learners = ['head-neck', 'shoulder'].map(module => {
    const base = `public/atlas-runtime/${module}/`;
    const manifest = json(base + 'manifest.json');
    assert.equal(manifest.sourceCommit, deliveredSource);
    assert.equal(manifest.patientDataIncluded, false);
    assert.equal(manifest.clinicalApproved, false);
    return {module, base, manifest, inputs: json(base + 'source-inputs.json')};
  });
  const shared = learners.find(row => row.module === 'head-neck');
  const shoulder = learners.find(row => row.module === 'shoulder');
  const emitted = emittedTeachingSearch(shared.base, shared.manifest.files);
  const reviewDisplay = emittedTeachingSearch('public/atlas-review-viewer/', viewer.files);
  assert(shoulder.inputs.length > 0);
  const reviewSourceRows = new Map(review.files.map(row => [row.path, row]));
  for (const input of shoulder.inputs) {
    assert(!paths.includes(input.path), `No carpal curriculum input in shoulder: ${input.path}`);
    const sourceRow = reviewSourceRows.get(input.path);
    assert.equal(input.sha256, sourceRow ? sourceRow.sourceSha256 : sha(deliveredGit(input.path)),
      `Shoulder input in exact current Atlas source: ${input.path}`);
  }
  for (const path of paths) {
    const historical = currentGit(path);
    const authored = deliveredGit(path);
    if (path === 'lib/reasoning-questions.ts')
      assert.deepEqual(previousCurrentGit(path), git(source, path),
        'The complete carpal registry was byte-exact from introduction through the 66ac parent');
    else
      assert.deepEqual(historical, git(source, path), 'Carpal pins and library remain byte-exact to introduction');
    if (path !== 'lib/reasoning-questions.ts')
      assert.deepEqual(authored, historical, 'Current carpal source remains byte-exact to its authenticated epoch');
    const reviewEntry = review.files.find(row => row.path === path);
    assert(reviewEntry, `Review source: ${path}`);
    assert.equal(reviewEntry.sourceSha256, sha(authored));
    assert.equal(reviewEntry.importedSha256, sha(readFileSync('atlas-review/' + path)));
    assert.equal(readFileSync('atlas-review/' + path, 'utf8').replaceAll('\r\n', '\n'), authored.toString().replaceAll('\r\n', '\n'));
    const input = shared.inputs.find(row => row.path === path);
    assert(input, `Shared regional learner input: ${path}`);
    assert.equal(input.sha256, sha(authored));
  }
  const pins = json('atlas-review/content/carpal-relationships-reasoning-pins.json');
  assert.equal(pins.parentSource, priorSource);
  assert.equal(pins.entries.length, 8);
  assert.deepEqual([...new Set(pins.entries.map(row => row.key))], keys);
  const compiled = await build({stdin: {contents: [
    "export * from './atlas-review/lib/reasoning-questions';",
    "export * from './atlas-review/lib/carpal-relationships-reasoning';",
    "export * from './atlas-review/lib/atlas-practice';",
    "export * from './atlas-review/lib/body-review-material';",
    "export * from './atlas-review/lib/body-review-context';",
    "export * from './atlas-review/lib/body-review-response';",
    "export * from './atlas-review/lib/body-reasoning-review';",
    "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
  ].join('\n'), resolveDir: process.cwd(), loader: 'ts'}, bundle: true, write: false, platform: 'node', format: 'esm'});
  const api = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
  const historicalBundle = await build({stdin: {contents:
    "export {reasoningConcepts, reasoningConceptFor} from './lib/reasoning-questions'; export {bodyDisplayCatalog} from './lib/body-display-catalog';",
    resolveDir: currentSourceRoot, loader: 'ts'}, bundle: true, write: false, platform: 'node', format: 'esm'});
  const historicalApi = await import('data:text/javascript;base64,' + Buffer.from(historicalBundle.outputFiles[0].text).toString('base64'));
  const parentBundle = await build({stdin: {contents: [
    "export * from './atlas-review/lib/reasoning-questions';",
    "export * from './atlas-review/lib/atlas-practice';",
    "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
  ].join('\n'), resolveDir: 'F:/VisibleMedicine/staging/20261023-native-workspace-disclosures/website', loader: 'ts'},
  bundle: true, write: false, platform: 'node', format: 'esm'});
  const parentApi = await import('data:text/javascript;base64,' + Buffer.from(parentBundle.outputFiles[0].text).toString('base64'));
  assert.deepEqual(readFileSync('atlas-review/public/models/bodyparts3d/full-body/catalog.json'),
    parentRead('atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
  const catalog = api.bodyDisplayCatalog(json('atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
  assert.equal(catalog.structures.length, 1104);
  const loaded = catalog.bundles.map(bundle => bundle.id);
  assert.equal(historicalApi.reasoningConcepts.length, 210, 'Exact authenticated 2ab concept set');
  assert.equal(api.reasoningConcepts.length, 236, 'Exact current c32 concept set');
  assert.equal(parentApi.reasoningConcepts.length, 204);
  assert.deepEqual(wire(api.reasoningConcepts.slice(0, 204)), wire(parentApi.reasoningConcepts), 'Exact prior concept prefix');
  assert.deepEqual(api.reasoningConcepts.slice(200, 204).map(concept => concept.key), keys);
  assert.deepEqual(wire(api.reasoningConcepts.slice(0, 210)), wire(historicalApi.reasoningConcepts),
    'Every concept in the authenticated carpal successor remains identical');
  const historicalCatalog = historicalApi.bodyDisplayCatalog(json('atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
  assert.equal(historicalCatalog.structures.filter(historicalApi.reasoningConceptFor).length, 380,
    'Exact historical 2ab source dispatch across the full catalog');
  assert.equal(catalog.structures.filter(api.reasoningConceptFor).length, 432,
    'Exact current c32 source dispatch across the full catalog');
  assert.equal(catalog.structures.filter(parentApi.reasoningConceptFor).length, 368);
  for (const identity of catalog.structures.filter(parentApi.reasoningConceptFor)) {
    assert.deepEqual(wire(api.reasoningConceptFor(identity)), wire(parentApi.reasoningConceptFor(identity)),
      `Prior source binding: ${identity.id}`);
    const options = {id: 1, mode: 'reason', sampling: 'all', count: 1, retryIds: [identity.id]};
    assert.deepEqual(wire(api.createPracticeSession(catalog.structures, loaded, options, () => 0.314159)?.questions),
      wire(parentApi.createPracticeSession(catalog.structures, loaded, options, () => 0.314159)?.questions),
      `Prior question unchanged: ${identity.id}`);
  }
  for (const [key, right, left] of pairs) {
    const concept = api.reasoningConcepts.find(row => row.key === key);
    const entries = pins.entries.filter(row => row.key === key);
    assert.deepEqual(entries.map(row => [row.identity.fmaId, row.identity.sources[0].file]), [right, left]);
    assert.deepEqual(entries.map(row => row.identity.laterality), ['right', 'left']);
    assert.equal(concept.readiness, 'draft');
    assert.equal(concept.revision, 1);
    assert.equal(concept.region, 'hand');
    assert.equal(concept.sourceTissue, 'bone');
    assert.equal(concept.sourceTree, 'isa');
    assert.deepEqual(concept.sourceRegions, ['hand']);
    assert.deepEqual(concept.bindings, entries.map(({identity}) => ({fma: identity.fmaId, side: identity.laterality, file: identity.sources[0].file})));
    assert(concept.explanation.endsWith(limitation));
    const explanationBody = concept.explanation.slice(0, -limitation.length);
    for (const {identity} of entries) {
      assert.deepEqual(catalog.structures.find(row => row.id === identity.id), identity);
      assert.equal(identity.region, 'hand');
      assert.deepEqual(identity.regions, ['hand']);
      assert.equal(identity.category, 'bone');
      assert.equal(identity.sourceTree, 'isa');
      assert.equal(api.carpalRelationshipsReasoningSourceMatches(identity, key), true);
      assert.equal(api.reasoningConceptFor(identity)?.key, key);
      for (const changed of [
        {...identity, name: identity.name + ' foreign'},
        {...identity, sources: [{...identity.sources[0], sha256: '0'.repeat(64)}]},
      ]) {
        assert.equal(api.carpalRelationshipsReasoningSourceMatches(changed, key), false);
        assert.equal(api.reasoningConceptFor(changed), undefined);
      }
      const scope = catalog.structures.filter(row => row.regions.includes('hand'));
      const session = api.createPracticeSession(scope, loaded,
        {id: 1, mode: 'reason', sampling: 'all', count: 1, retryIds: [identity.id]}, () => 0.314159);
      const question = session?.questions[0];
      assert.equal(question?.target, identity.id, `${key} hand practice`);
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
      assert.equal(api.reasoningFeedback(incorrect)?.key, key);
      const done = api.practiceReducer(incorrect, {type: 'next', ...action});
      const retryIds = api.missedPracticeIds(done.responses);
      assert.deepEqual(retryIds, [identity.id]);
      assert.equal(api.createPracticeSession(scope, loaded,
        {id: 2, mode: 'reason', sampling: 'all', count: 1, retryIds}, () => 0.314159)?.questions[0].target, identity.id);
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
      for (const code of [emitted, reviewDisplay]) {
        const contains = value => code.includes(value) || code.includes(JSON.stringify(value).slice(1, -1));
        for (const value of [key, identity.fmaId, identity.id, identity.sources[0].file,
          concept.prompt, explanationBody, limitation])
          assert(contains(value), `${key}: missing reachable emitted value ${value}`);
        for (const ref of concept.references)
          for (const value of [ref.title, ref.url])
            assert(contains(value), `${key}: missing emitted reference ${value}`);
      }
    }
  }
});

test('all 200 prior concepts and the exact source dispatch transition remain intact', () => {
  const pin = validateCurrentAtlasDelivery();
  assert.throws(() => validateCurrentAtlasDelivery({pin: {...pin, source: priorSource}}));
  const previous = git(priorSource, 'lib/reasoning-questions.ts').toString().replaceAll('\r\n', '\n');
  let current = git(source, 'lib/reasoning-questions.ts').toString().replaceAll('\r\n', '\n');
  for (const seam of [
    "import { carpalRelationshipsReasoningConcepts, carpalRelationshipsReasoningSourceMatches } from './carpal-relationships-reasoning';\n",
    '  ...carpalRelationshipsReasoningConcepts,\n',
    ' || carpalRelationshipsReasoningSourceMatches(s, c.key)',
  ]) {
    assert.equal(current.split(seam).length, 2, 'One exact authored insertion');
    current = current.replace(seam, '');
  }
  assert.equal(current, previous, 'Every prior question definition and source filter is unchanged');
  const parentQuestions = currentGit('lib/reasoning-questions.ts').toString().replaceAll('\r\n', '\n');
  let withoutMidfoot = parentQuestions;
  for (const seam of [
    "import { midfootRelationshipsReasoningConcepts, midfootRelationshipsReasoningSourceMatches } from './midfoot-relationships-reasoning';\n",
    '  ...midfootRelationshipsReasoningConcepts,\n',
    ' || midfootRelationshipsReasoningSourceMatches(s, c.key)',
  ]) {
    assert.equal(withoutMidfoot.split(seam).length, 2, 'One reversible midfoot dispatch insertion');
    withoutMidfoot = withoutMidfoot.replace(seam, '');
  }
  assert.equal(withoutMidfoot, previousCurrentGit('lib/reasoning-questions.ts').toString().replaceAll('\r\n', '\n'),
    'The exact 204-concept parent registry and dispatch survive the new append');
  assert.equal(execFileSync('git', ['merge-base', currentSource, deliveredSource], {
    cwd: deliveredRoot, encoding: 'utf8', windowsHide: true,
  }).trim(), currentSource, 'The delivered Atlas descends from the authenticated carpal successor');
  let deliveredQuestions = deliveredGit('lib/reasoning-questions.ts').toString().replaceAll('\r\n', '\n');
  for (const seam of [
    ...['forearm-mechanics', 'lower-arterial', 'upper-vascular', 'cervical-vascular'].map(name =>
      `import { ${name.replace(/-([a-z])/g, (_, c) => c.toUpperCase())}ReasoningConcepts, ${name.replace(/-([a-z])/g, (_, c) => c.toUpperCase())}ReasoningSourceMatches } from './${name}-reasoning';\n`),
    ...['forearmMechanics', 'lowerArterial', 'upperVascular', 'cervicalVascular'].map(name =>
      `  ...${name}ReasoningConcepts,\n`),
    ' || lowerArterialReasoningSourceMatches(s, c.key) || upperVascularReasoningSourceMatches(s, c.key) || cervicalVascularReasoningSourceMatches(s, c.key)',
    "      (!c.key.startsWith('forearm-mechanics-') || forearmMechanicsReasoningSourceMatches(s, c.key)) &&\n",
  ]) {
    assert.equal(deliveredQuestions.split(seam).length, 2, `One authenticated later registry addition: ${seam}`);
    deliveredQuestions = deliveredQuestions.replace(seam, '');
  }
  assert.equal(deliveredQuestions, parentQuestions, 'Current registry preserves the complete carpal successor and all earlier dispatch');
  const changed = execFileSync('git', ['diff', '--name-only', priorSource, source], {
    cwd: sourceRoot, encoding: 'utf8', windowsHide: true,
    env: {...process.env, GIT_NO_REPLACE_OBJECTS: '1'},
  }).trim().split(/\r?\n/).filter(Boolean).sort();
  assert.deepEqual(changed, [...sourceReceipt.changed, ...sourceReceipt.added].sort());
  const priorInputs = JSON.parse(parentRead('atlas-review/integration-inputs.json'));
  assert.equal(priorInputs.sourceCommit, priorSource);
  assert.notEqual(pin.reviewIntegration, priorInputs.sha256);
  const inventory = json('lib/atlas-model-inventory.json');
  for (const row of inventory.sources) {
    assert.equal(row.sourceCommit, pin.runtimeSources[row.module]);
    assert.equal(row.manifestSha256, sha(readFileSync(`public/atlas-runtime/${row.module}/manifest.json`)));
  }
  assert.throws(() => validateCurrentAtlasDelivery({pin: JSON.parse(parentRead('tests/fixtures/current-atlas-delivery.json'))}));
});
