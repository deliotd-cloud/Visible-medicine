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
import {validateCurrentAtlasDelivery as validateLiveDelivery,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';
const liveRoot=fileURLToPath(new URL('../',import.meta.url));

const sealedReceipt=readFileSync('F:/VisibleMedicine/staging/20261024-lower-arterial-website/SOURCE_BOUND.json');
const sha0=bytes=>createHash('sha256').update(bytes).digest('hex');
assert.equal(sha0(sealedReceipt),'7c1829a1af5f7d0df175312c6c665516957979b9a48efa917e499fd03ae381dd');
const sealed=JSON.parse(sealedReceipt);
const site = sealed.website;
assert.equal(sealed.atlasHead,'aa13c067197cad87bd0a9b2da5549bc4b33bfdf7');
assert.equal(sealed.reviewBindingSha256,'5216ef1195e37903db9806b5c77d87f4ba1b141b1dbc82b0087651727fc3e429');
assert.equal(sha0(readFileSync(resolve(site,'tests/lower-arterial-current-delivery.test.mjs'))),'73b3e6c05882b7369f4273913d257aede15bc33515259246311025af99db0489');
assert.equal(sha0(readFileSync(resolve(site,'tests/atlas-emitted-teaching.ts'))),'407396ddf4b0e4398efabf691fcdec75e90c79caafea280234f3438645af8cf2');
assert.equal(sha0(readFileSync(resolve(site,'tests/current-atlas-delivery.mjs'))),'02dd815603c922dedbdc5a5fce270fbda736b81220e335d750dcbec1124c833e');
const {emittedTeachingSearch}=await import('file:///F:/VisibleMedicine/staging/20261024-lower-arterial-website/website/tests/atlas-emitted-teaching.ts');
const {validateCurrentAtlasDelivery}=await import('file:///F:/VisibleMedicine/staging/20261024-lower-arterial-website/website/tests/current-atlas-delivery.mjs');
const parent = 'F:/VisibleMedicine/staging/20261024-imaging-desktop-layout/website';
const parentReceipt = 'F:/VisibleMedicine/staging/20261024-imaging-desktop-layout/SOURCE_BOUND.json';
const atlas = 'F:/VisibleMedicine/staging/20261024-lower-arterial-reasoning/atlas';
const nativeReceipt = 'F:/VisibleMedicine/staging/20261024-lower-arterial-reasoning/SOURCE_BOUND.json';
const source = 'aa13c067197cad87bd0a9b2da5549bc4b33bfdf7';
const tree = '1ce3d1dbac28ff05f9aef22502c48e518304d18b';
const predecessor = 'd143c28fb1e5da200712af6629a375c25d17dad7';
const formerBinding = '66fbc8e06fb904de670300fa4418cb297a16950dbc2e7c25ad28a5eab1415f2a';
const keys = ['femoral-artery', 'deep-femoral-artery', 'descending-lateral-circumflex-femoral-artery',
  'popliteal-artery', 'anterior-tibial-artery', 'posterior-tibial-artery'].map(slug => `lower-arterial-${slug}`);
const newPaths = ['content/lower-arterial-reasoning-pins.json', 'lib/lower-arterial-reasoning.ts'];
const sourcePaths = [...newPaths, 'lib/reasoning-questions.ts', 'lib/body-review-material.ts'];
const modules = ['head-neck', 'shoulder', 'lower-limb', 'female-pelvis'];
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const json = path => JSON.parse(readFileSync(path));
const wire = value => JSON.parse(JSON.stringify(value));
const require = createRequire(resolve(liveRoot, 'package.json'));
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
const native = path => execFileSync('git', ['show', `${source}:${path}`], {
  cwd: atlas, windowsHide: true, maxBuffer: 32e6,
  env: {...process.env, GIT_NO_REPLACE_OBJECTS: '1'},
});
const entry = [
  "export * from './lib/reasoning-questions';",
  "export * from './lib/lower-arterial-reasoning';",
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
  const code = old ? entry.replace("export * from './lib/lower-arterial-reasoning';", '') : entry;
  const result = await build({stdin: {contents: code, resolveDir: imported, loader: 'ts'},
    bundle: true, write: false, format: 'cjs', platform: 'node', packages: 'external', jsx: 'automatic'});
  const module = {exports: {}};
  runInNewContext(result.outputFiles[0].text, {module, exports: module.exports, require,
    crypto, TextEncoder, TextDecoder, Request, Response, structuredClone, URL, URLSearchParams});
  return module.exports;
}

test('authenticated committed Atlas bytes reach imported Review and all four current learner runtimes', () => {
  assert.equal(sha(readFileSync(parentReceipt)), '60d396a0aa37cb827fcaaafe6b06de90ded0c8ea39c01c528c718ff4b11f3199');
  assert.equal(sha(readFileSync(nativeReceipt)), '85c73d35ac10e1dd6f010cbf6826cab30441eaf4e6e2cfdd101e4fbc55642746');
  const baseline = json(parentReceipt), receipt = json(nativeReceipt);
  assert.equal(baseline.atlasHead, predecessor);
  assert.equal(baseline.reviewBindingSha256, formerBinding);
  assert.equal(receipt.atlasHead, source);
  assert.equal(receipt.atlasTree, tree);
  assert.equal(receipt.parentHead, predecessor);
  assert.equal(receipt.native.oldConcepts, 216);
  assert.equal(receipt.native.concepts, 222);
  assert.equal(receipt.native.oldTargets, 392);
  assert.equal(receipt.native.targets, 404);
  assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], {cwd: atlas, encoding: 'utf8', windowsHide: true}).trim(), source);
  assert.equal(execFileSync('git', ['rev-parse', 'HEAD^{tree}'], {cwd: atlas, encoding: 'utf8', windowsHide: true}).trim(), tree);
  const pin = validateCurrentAtlasDelivery();
  assert.equal(pin.source, source);
  assert.equal(pin.sourceTree, tree);
  for (const name of modules) assert.equal(pin.runtimeSources[name], source);
  assert.notEqual(pin.reviewIntegration, formerBinding);
  const oldPin = json(resolve(parent, 'tests/fixtures/current-atlas-delivery.json'));
  assert.equal(oldPin.reviewIntegration, formerBinding);
  assert.throws(() => validateCurrentAtlasDelivery({pin: oldPin, root: site}), /Current delivery changed|Expected values to be strictly equal/);
  const review = json(resolve(site, 'atlas-review/manifest.json'));
  const binding = json(resolve(site, 'atlas-review/integration-inputs.json'));
  assert.equal(review.revision, source);
  assert.equal(binding.sourceCommit, source);
  assert.equal(review.websiteIntegrationSha256, binding.sha256);
  for (const path of sourcePaths) {
    const bytes = native(path), imported = readFileSync(resolve(site, 'atlas-review', path));
    const committed = receipt.sourceRows.find(row => row.path === path);
    const record = review.files.find(row => row.path === path);
    assert.equal(committed?.sha256, sha(bytes), `Committed source ${path}`);
    assert.equal(record?.sourceSha256, sha(bytes), `Review source ${path}`);
    assert.equal(record?.importedSha256, sha(imported), `Review import ${path}`);
    assert.equal(imported.toString().replaceAll('\r\n', '\n'), bytes.toString().replaceAll('\r\n', '\n'), path);
    assert.equal(binding.inputs.find(row => row.path === `atlas-review/${path}`)?.sha256, sha(imported), `Bound Review input ${path}`);
  }
  const viewer = json(resolve(site, 'public/atlas-review-viewer/manifest.json'));
  assert.equal(viewer.sourceCommit, source);
  assert.equal(viewer.websiteIntegrationSha256, binding.sha256);
  assert.equal(viewer.mode, 'production');
  assert.equal(viewer.personalRecordsIncluded, false);
  const learner = json(resolve(site, 'public/atlas-runtime/head-neck/manifest.json'));
  const learnerInputs = json(resolve(site, 'public/atlas-runtime/head-neck/source-inputs.json'));
  for (const name of modules) {
    const manifest = json(resolve(site, `public/atlas-runtime/${name}/manifest.json`));
    assert.equal(manifest.sourceCommit, source, name);
    assert.equal(manifest.patientDataIncluded, false, name);
  }
  for (const path of [...newPaths, 'lib/reasoning-questions.ts'])
    assert.equal(learnerInputs.find(row => row.path === path)?.sha256, sha(native(path)), `Learner input ${path}`);
  const emitted = emittedTeachingSearch(resolve(site, 'public/atlas-runtime/head-neck') + '/', learner.files);
  const protectedCode = emittedTeachingSearch(resolve(site, 'public/atlas-review-viewer') + '/', viewer.files);
  for (const key of keys) {
    assert(emitted.includes(key), `Learner omitted ${key}`);
    assert(protectedCode.includes(key), `Review omitted ${key}`);
  }
});

test('the imported engine retains 216 parent definitions and 392 mappings; each new pin is exact', async () => {
  const [api, old] = await Promise.all([actual(site), actual(parent, true)]);
  const pins = json(resolve(site, 'atlas-review/content/lower-arterial-reasoning-pins.json'));
  const catalogBytes = readFileSync(resolve(site, 'atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
  assert.deepEqual(catalogBytes, readFileSync(resolve(parent, 'atlas-review/public/models/bodyparts3d/full-body/catalog.json')));
  const catalog = api.bodyDisplayCatalog(JSON.parse(catalogBytes));
  const bundles = catalog.bundles.map(row => row.id);
  assert.equal(pins.parentSource, predecessor);
  assert.equal(pins.entries.length, 12);
  assert.deepEqual([...new Set(pins.entries.map(row => row.key))], keys);
  assert.equal(old.reasoningConcepts.length, 216);
  assert.equal(api.reasoningConcepts.length, 222);
  assert.deepEqual(wire(api.reasoningConcepts.slice(0, 216)), wire(old.reasoningConcepts));
  assert.deepEqual(wire(api.reasoningConcepts.slice(216)), wire(api.lowerArterialReasoningConcepts));
  const priorRoots = catalog.structures.filter(old.reasoningConceptFor);
  assert.equal(priorRoots.length, 392);
  assert.equal(catalog.structures.filter(api.reasoningConceptFor).length, 404);
  const options = id => ({id: 1, mode: 'reason', sampling: 'all', count: 1, retryIds: [id]});
  for (const structure of priorRoots) {
    assert.deepEqual(wire(api.reasoningConceptFor(structure)), wire(old.reasoningConceptFor(structure)), structure.id);
    assert.deepEqual(wire(api.createPracticeSession(catalog.structures, bundles, options(structure.id), () => .314159)?.questions),
      wire(old.createPracticeSession(catalog.structures, bundles, options(structure.id), () => .314159)?.questions), structure.id);
  }
  for (const key of keys) {
    const concept = api.lowerArterialReasoningConcepts.find(row => row.key === key);
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
      assert.equal(api.lowerArterialReasoningSourceMatches(target, key), true);
      for (const changed of [
        {...target, name: target.name + ' foreign'},
        {...target, regions: [...target.regions].reverse()},
        {...target, sources: [...target.sources].reverse()},
        {...target, sources: target.sources.map((row, index) => index ? row : {...row, sha256: '0'.repeat(64)})},
      ]) if (JSON.stringify(changed) !== JSON.stringify(target)) {
        assert.equal(api.lowerArterialReasoningSourceMatches(changed, key), false);
        assert.equal(api.reasoningConceptFor(changed), undefined);
      }
      const session = api.createPracticeSession(catalog.structures, bundles, options(target.id), () => .314159);
      const question = session?.questions[0];
      assert.equal(question?.target, target.id);
      assert.equal(question.reasoning.key, key);
      assert.equal(new Set(question.choices).size, 4);
      assert(question.choices.every(id => catalog.structures.find(row => row.id === id)?.laterality === target.laterality));
      assert.equal(api.reasoningFeedback(session), undefined);
      assert.equal(renderToStaticMarkup(React.createElement(api.ReasoningFeedback, {session})), '');
      assert.equal(api.createPracticeSession(catalog.structures, [], options(target.id), () => .314159), null);
      assert.equal(api.createPracticeSession(catalog.structures, bundles, {...options(target.id), sampling: 'focus', focusIds: [target.id]}, () => .314159), null);
      const action = {sessionId: session.id, index: 0};
      const correct = api.practiceReducer(session, {type: 'answer', ...action, chosen: target.id});
      assert.equal(api.practiceScore(correct), 1);
      assert.equal(api.reasoningFeedback(correct)?.key, key);
      assert.match(renderToStaticMarkup(React.createElement(api.ReasoningFeedback, {session: correct})), /Sources &amp; scope/);
      const wrong = question.choices.find(id => id !== target.id);
      const incorrect = api.practiceReducer(session, {type: 'answer', ...action, chosen: wrong});
      assert.equal(api.practiceScore(incorrect), 0);
      assert.equal(api.reasoningFeedback(incorrect)?.key, key);
      const skipped = api.practiceReducer(session, {type: 'answer', ...action, chosen: null});
      assert.equal(api.practiceScore(skipped), 0);
      assert.equal(api.reasoningFeedback(skipped)?.key, key);
      const done = api.practiceReducer(incorrect, {type: 'next', ...action});
      assert.deepEqual(wire(api.missedPracticeIds(done.responses)), [target.id]);
      assert.equal(api.createPracticeSession(catalog.structures, bundles,
        {...options(target.id), retryIds: api.missedPracticeIds(done.responses)}, () => .314159)?.questions[0].target, target.id);
    }
  }
});

test('each new Review packet rejects metadata edits and stale decisions before storage', async () => {
  const [api, old] = await Promise.all([actual(site), actual(parent, true)]);
  const pins = json(resolve(site, 'atlas-review/content/lower-arterial-reasoning-pins.json'));
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
    const wrong = packet.reasoning.choices.find(row => row.id !== identity.id)?.id;
    for (const edit of [
      copy => {copy.reasoning.answerId = wrong;},
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

test('baseline Head Atlas controls, model licenses and independent FDA registry remain byte identical', () => {
  assert.equal(sha(readFileSync(parentReceipt)), '60d396a0aa37cb827fcaaafe6b06de90ded0c8ea39c01c528c718ff4b11f3199');
  const baseline = json(parentReceipt);
  const guarded = [
    'components/HeadAtlasViewer.tsx', 'lib/head-practice-navigation.ts',
    'components/AtlasRegionNavigation.tsx', 'components/AtlasWorkspaceNavigation.tsx',
    'components/ImagingAtlasShell.tsx', 'atlas-review/lib/atlas-navigation.ts',
    'atlas-review/lib/atlas-note-navigation.ts', 'atlas-review/lib/review-history-navigation.ts',
    'atlas-review/lib/study-navigation.ts', 'atlas-review/lib/um-limb-navigation.ts',
    'atlas-review/lib/fda-reference-links.ts', 'atlas-review/lib/fda-reference-model-loader.ts',
    'atlas-review/lib/fda-reference-review.ts', 'atlas-review/lib/fda-shoulder-reference.ts',
    'atlas-review/public/models/fda-shoulder-draft/catalog.json',
  ];
  const licensePaths = baseline.sourceRows.filter(row => row.path.startsWith('LICENSES/')).map(row => row.path);
  assert(licensePaths.length >= 6);
  for (const path of [...guarded, ...licensePaths]) {
    const record = baseline.sourceRows.find(row => row.path === path);
    assert(record, `Authenticated baseline path ${path}`);
    assert.equal(sha(readFileSync(resolve(parent, path))), record.sha256, `Baseline changed ${path}`);
    assert.equal(sha(readFileSync(resolve(site, path))), record.sha256, `Current changed ${path}`);
  }
  const inventory = json(resolve(site, 'lib/atlas-model-inventory.json'));
  const parentInventory = readFileSync(resolve(parent, 'lib/atlas-model-inventory.json'));
  const priorInventory = JSON.parse(parentInventory);
  assert.deepEqual(inventory.models, priorInventory.models, 'Every licensed model identity/path/byte count remains exact');
  assert.equal(inventory.purpose, priorInventory.purpose);
  assert.equal(inventory.learnerDelivery, priorInventory.learnerDelivery);
  assert.equal(inventory.schemaVersion, priorInventory.schemaVersion);
  assert.deepEqual(inventory.sources.map(({sourceCommit, manifestSha256, ...row}) => row),
    priorInventory.sources.map(({sourceCommit, manifestSha256, ...row}) => row));
  for (const row of inventory.sources) {
    assert.equal(row.sourceCommit, source, row.module);
    assert.equal(row.manifestSha256, sha(readFileSync(resolve(site, `public/atlas-runtime/${row.module}/manifest.json`))), row.module);
  }
  assert.equal(inventory.models.length, 137);
  assert.equal(inventory.models.flatMap(row => row.paths).length, 144);
  assert.equal(inventory.models.reduce((sum, row) => sum + row.bytes, 0), 199072480);
});


test('current lower-arterial import and refusal behavior follow the candidate source', async () => {
  const live=liveRoot, pin=validateLiveDelivery(), currentAtlas=currentAtlasDeliveryRoot();
  const review=json(resolve(live,'atlas-review/manifest.json'));
  const binding=json(resolve(live,'atlas-review/integration-inputs.json'));
  assert.equal(review.revision,pin.source);
  assert.equal(binding.sourceCommit,pin.source);
  assert.equal(binding.sha256,pin.reviewIntegration);
  const paths=['content/lower-arterial-reasoning-pins.json','lib/lower-arterial-reasoning.ts','lib/reasoning-questions.ts','lib/body-review-material.ts'];
  for(const path of paths){
    const bytes=execFileSync('git',['show',`${pin.source}:${path}`],{cwd:currentAtlas,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
    const imported=readFileSync(resolve(live,'atlas-review',path));
    assert.equal(imported.toString().replaceAll('\r\n','\n'),bytes.toString().replaceAll('\r\n','\n'),path);
    assert.equal(review.files.find(row=>row.path===path)?.sourceSha256,sha(bytes),path);
    assert.equal(review.files.find(row=>row.path===path)?.importedSha256,sha(imported),path);
    assert.equal(binding.inputs.find(row=>row.path===`atlas-review/${path}`)?.sha256,sha(imported),path);
  }
  const api=await actual(live);
  const pins=json(resolve(live,'atlas-review/content/lower-arterial-reasoning-pins.json'));
  assert.equal(pins.entries.length,12);assert.deepEqual([...new Set(pins.entries.map(row=>row.key))],keys);
  for(const {identity} of pins.entries){
    assert.equal(api.lowerArterialReasoningSourceMatches(identity,api.reasoningConceptFor(identity)?.key),true);
    const packet=wire(await api.bodyReviewMaterial(identity.id));
    assert.equal(packet.reasoning.answerId,identity.id);assert.equal(packet.reasoning.readiness,'draft');assert.equal(packet.approval,false);
    assert.deepEqual(wire(await api.parseBodyReviewResponse(packet,identity.id)),packet);
    for(const edit of [
      copy=>{copy.reasoning.answerId=copy.reasoning.choices.find(row=>row.id!==identity.id).id;},
      copy=>{copy.reasoning.explanation+=' altered';},
      copy=>{copy.reasoning.references[0].url='javascript:alert(1)';},
      copy=>{copy.reasoning.choices[0].sources[0].sha256='0'.repeat(64);},
    ]){const bad=structuredClone(packet);edit(bad);assert.equal(await api.parseBodyReviewResponse(bad,identity.id),null);}
  }
});
