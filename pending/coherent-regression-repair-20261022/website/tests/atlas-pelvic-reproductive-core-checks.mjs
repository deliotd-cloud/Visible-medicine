import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {build} from 'esbuild';
import {atlasExactGitApi} from './atlas-exact-git-api.mjs';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const websiteAdmission = 'eed504734b845c635f23ee607c270abe34ed17a5';
const websiteBaseline = '8d59be96ab199918a45b423e384743077fb88f09';
const sourceRevision = '05a2e8a26325818675c4b98ab1d9b9c246028a5c';
const sourceBaseline = '3d1d0f862d2e7567d298bc89690b11bf38ca3326';
const atlasSource = 'F:/VisibleMedicine/atlas';
const sha = value => createHash('sha256').update(typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value)).digest('hex');
const gitOptions = {maxBuffer: 32e6, windowsHide: true, env: {...process.env, GIT_NO_REPLACE_OBJECTS: '1'}};
const old = path => execFileSync('git', ['show', `${websiteBaseline}:${path}`], gitOptions);
const admitted = path => execFileSync('git', ['show', `${websiteAdmission}:${path}`], gitOptions);
const sourceAt = path => execFileSync('git', ['show', `${sourceRevision}:${path}`], {...gitOptions, cwd: atlasSource});
const json = path => JSON.parse(admitted(path));
const liveJson = path => JSON.parse(readFileSync(path));
const common = "export {bodyLesson,bodyContent} from './atlas-review/app/body-content';export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';export {contentTabs} from './atlas-review/lib/content-types';export {structures} from './atlas-review/app/anatomy-data';export {dissectionProfiles} from './atlas-review/app/dissection-data';export {regionalTours} from './atlas-review/lib/regional-tours';export {reasoningConcepts} from './atlas-review/lib/reasoning-questions';export * from './atlas-review/lib/body-review-material';export * from './atlas-review/lib/body-review-context';export * from './atlas-review/lib/body-review-response';export * from './atlas-review/lib/body-review-api';export * from './atlas-review/lib/body-review-decisions';";
const before = await atlasExactGitApi(websiteBaseline, common);
const now = await atlasExactGitApi(websiteAdmission, common + "export * from './atlas-review/lib/pelvic-reproductive-core';export * from './atlas-review/content/pelvic-reproductive-core';");
const pins = JSON.parse(sourceAt('content/pelvic-reproductive-core-pins.json'));
const transition = JSON.parse(sourceAt('content/pelvic-reproductive-core.transition.json'));
assert.equal(pins.baseline, sourceBaseline);
assert.equal(transition.baseline, sourceBaseline);
assert.equal(transition.pinsHash, sha(pins));
assert.equal(transition.entries.length, 16);
assert.equal(pins.entries.length, 8);
assert.deepEqual(admitted('atlas-review/content/pelvic-reproductive-core-pins.json'), sourceAt('content/pelvic-reproductive-core-pins.json'));
const entries = new Map(pins.entries.map(entry => [entry.identity.id, entry]));
assert.equal(entries.size, 8);
assert.deepEqual(Object.fromEntries(Object.entries(now.pelvicReproductiveCoreGroups).map(([group, ids]) => [group, [...ids]])), {
  prostate: ['FMA9600'], testis: ['FMA7211', 'FMA7212'], seminalVesicle: ['FMA19387', 'FMA19388'], epididymis: ['FMA18256', 'FMA18257'], urethra: ['FMA19667'],
});
for (const entry of pins.entries) assert(now.pelvicReproductiveCoreGroups[entry.group].includes(entry.identity.fmaId));
const sourceCatalog = json('atlas-review/public/models/bodyparts3d/full-body/catalog.json');
const catalog = now.bodyDisplayCatalog(sourceCatalog);
assert.equal(catalog.structures.length, 1104);
assert.equal(catalog.bundles.length, 109);
assert.deepEqual(catalog, before.bodyDisplayCatalog(JSON.parse(old('atlas-review/public/models/bodyparts3d/full-body/catalog.json'))));
for (const key of ['structures', 'dissectionProfiles', 'regionalTours', 'reasoningConcepts', 'contentTabs']) assert.deepEqual(now[key], before[key], key);
assert.equal(now.contentTabs.length, 9);
assert.equal(pins.sourceVersion, sourceCatalog.sourceVersion);
assert.deepEqual(pins.coordinateSystem, sourceCatalog.coordinateSystem);
assert.deepEqual(pins.bundles, catalog.bundles.filter(bundle => pins.bundles.some(pinned => pinned.id === bundle.id)));

let changed = 0, preserved = 0;
for (const structure of catalog.structures) {
  const entry = entries.get(structure.id);
  for (const tab of now.contentTabs) {
    const previous = before.bodyLesson(structure, tab), current = now.bodyLesson(structure, tab);
    if (entry && (tab === 'anatomy' || tab === 'function')) {
      assert.deepEqual(structure, entry.identity);
      assert.deepEqual(entry.previous[tab], previous);
      assert.deepEqual(current, now.pelvicReproductiveCoreLesson(entry.identity, tab));
      assert.equal(current.readiness, 'draft');
      const {readiness, ...display} = current;
      assert.deepEqual(now.bodyContent(structure, tab), display);
      const topic = now.pelvicReproductiveCoreTopics[entry.group], section = topic[tab];
      assert.equal(current.body, section.body);
      assert.deepEqual(current.bullets, [...section.bullets, `Visible source limit: ${topic.limit}${structure.coverageNote ? ' ' + structure.coverageNote : ''}`]);
      assert.deepEqual(current.citations, topic.references.map(key => now.pelvicReproductiveCoreReferences[key]));
      for (const citation of current.citations) assert.equal(new URL(citation).protocol, 'https:');
      assert.match(current.note, /radiologist review pending/i);
      assert.match(current.note, /independent/i);
      const record = transition.entries.find(item => item.id === structure.id && item.tab === tab);
      assert(record);
      assert.equal(record.previousHash, sha(previous));
      assert.equal(record.currentHash, sha(current));
      changed++;
    } else {
      assert.deepEqual(current, previous, `${structure.id}:${tab}:unchanged`);
      preserved++;
    }
  }
}
assert.equal(changed, 16);
assert.equal(preserved, 9920);

const pathsWhere = (value, predicate, path = []) => [
  ...(predicate(value) ? [path] : []),
  ...(value && typeof value === 'object' ? Object.entries(value).flatMap(([key, part]) => pathsWhere(part, predicate, [...path, key])) : []),
];
const at = (value, path) => path.reduce((part, key) => part[key], value);
let forged = 0, stale = 0, storageCalls = 0, changedReview = 0, preservedReview = 0;
for (const {identity} of pins.entries) {
  for (const tab of ['anatomy', 'function']) {
    const original = now.pelvicReproductiveCoreLesson(identity, tab);
    const mutated = now.pelvicReproductiveCoreLesson(identity, tab);
    mutated.bullets.push('foreign');
    mutated.citations.push('https://foreign.example');
    assert.deepEqual(now.pelvicReproductiveCoreLesson(identity, tab), original);
  }
  for (const path of pathsWhere(identity, value => value === null || typeof value !== 'object')) {
    const foreign = structuredClone(identity), parent = at(foreign, path.slice(0, -1)), key = path.at(-1), value = parent[key];
    parent[key] = typeof value === 'string' ? `${value}-foreign` : typeof value === 'number' ? value + 0.01 : value === null ? 'foreign' : !value;
    for (const tab of ['anatomy', 'function']) assert.equal(now.pelvicReproductiveCoreLesson(foreign, tab), undefined, `${identity.id}:${path.join('.')}:${tab}`);
  }
  for (const path of pathsWhere(identity, Array.isArray)) {
    const foreign = structuredClone(identity);
    at(foreign, path).push('foreign');
    for (const tab of ['anatomy', 'function']) assert.equal(now.pelvicReproductiveCoreLesson(foreign, tab), undefined, `${identity.id}:${path.join('.')}:${tab}`);
  }
  for (const tab of ['anatomy', 'function']) assert.equal(now.pelvicReproductiveCoreLesson({...structuredClone(identity), unexpected: true}, tab), undefined);
  for (const tab of now.contentTabs.filter(tab => tab !== 'anatomy' && tab !== 'function')) assert.equal(now.pelvicReproductiveCoreLesson(identity, tab), undefined);
  const material = await now.bodyReviewMaterial(identity.id), priorMaterial = await before.bodyReviewMaterial(identity.id);
  assert.equal(material.approval, false);
  assert(await now.parseBodyReviewResponse(material, identity.id));
  for (const key of ['source', 'reasoning', 'guidedTours']) assert.deepEqual(material[key], priorMaterial[key]);
  for (const tab of ['anatomy', 'function']) assert.deepEqual(material.topics.find(topic => topic.tab === tab), {tab, ...now.pelvicReproductiveCoreLesson(identity, tab)});
  for (const edit of [
    value => {value.topics.find(topic => topic.tab === 'anatomy').body += ' foreign';},
    value => {value.topics.find(topic => topic.tab === 'function').readiness = 'approved';},
    value => {value.topics.find(topic => topic.tab === 'function').citations = ['https://foreign.example'];},
    value => {value.source.structure.sources = [];},
    value => {value.topics = value.topics.filter(topic => topic.tab !== 'anatomy');},
  ]) {
    const foreign = structuredClone(material); edit(foreign);
    assert.equal(await now.parseBodyReviewResponse(foreign, identity.id), null);
    forged++;
  }
  const priorContext = await before.bodyReviewContext(identity.id), context = await now.bodyReviewContext(identity.id);
  assert.equal(context.sourceHash, priorContext.sourceHash);
  assert.notEqual(context.rendererHash, priorContext.rendererHash);
  assert.notEqual(context.revisions.geometry, priorContext.revisions.geometry);
  assert.notEqual(context.revisions.teaching, priorContext.revisions.teaching);
  assert.equal(context.revisions.imaging, null);
  const packet = {catalogScope: context.catalogScope, structureId: identity.id, track: 'teaching', expectedVersion: 0, materialHash: context.materialHash, revisionHash: context.revisions.teaching, checklistVersion: context.checklistVersion, draft: now.blankBodyReview(context, 'teaching')};
  for (const delta of [
    {materialHash: priorContext.materialHash, revisionHash: priorContext.revisions.teaching},
    {materialHash: priorContext.materialHash},
    {revisionHash: priorContext.revisions.teaching},
  ]) {
    const response = await now.postBodyDecision(new Request('https://atlas.test/api/body-decisions', {method: 'POST', headers: {origin: 'https://atlas.test', 'content-type': 'application/json', 'oai-authenticated-user-id': 'SYNTHETIC_PELVIC_REPRODUCTIVE'}, body: JSON.stringify({...packet, ...delta})}), {prepare() {storageCalls++; throw Error('Stale decision reached storage');}});
    assert.equal(response.status, 409);
    stale++;
  }
}
assert.equal(forged, 40);
assert.equal(stale, 24);
assert.equal(storageCalls, 0);
assert.equal(now.pelvicReproductiveCoreLesson({id: 'foreign'}, 'anatomy'), undefined);

for (const structure of catalog.structures) {
  const previous = await before.bodyReviewMaterial(structure.id), current = await now.bodyReviewMaterial(structure.id);
  assert(await now.parseBodyReviewResponse(current, structure.id), structure.id);
  for (const key of ['source', 'reasoning', 'guidedTours']) assert.deepEqual(current[key], previous[key]);
  assert.equal(current.approval, false);
  if (entries.has(structure.id)) {
    assert.notEqual(current.fingerprints.teaching, previous.fingerprints.teaching);
    for (const tab of now.contentTabs.filter(tab => tab !== 'anatomy' && tab !== 'function'))
      assert.deepEqual(current.topics.find(topic => topic.tab === tab), previous.topics.find(topic => topic.tab === tab));
    changedReview++;
  } else {
    assert.deepEqual(current.topics, previous.topics);
    assert.equal(current.fingerprints.teaching, previous.fingerprints.teaching);
    preservedReview++;
  }
}
assert.equal(changedReview, 8);
assert.equal(preservedReview, 1096);
const unaffectedId = catalog.structures.find(structure => !entries.has(structure.id)).id;
const unaffectedBefore = await before.bodyReviewContext(unaffectedId), unaffectedNow = await now.bodyReviewContext(unaffectedId);
assert.equal(unaffectedNow.sourceHash, unaffectedBefore.sourceHash);
assert.equal(unaffectedNow.revisions.teaching, unaffectedBefore.revisions.teaching);
assert.notEqual(unaffectedNow.revisions.geometry, unaffectedBefore.revisions.geometry);

const review = json('atlas-review/manifest.json');
assert.equal(review.revision, sourceRevision);
for (const file of review.files) assert.equal(sha(admitted(`atlas-review/${file.path}`)), file.importedSha256, file.path);
const previousReview = JSON.parse(old('atlas-review/manifest.json'));
const addedPaths = ['content/pelvic-reproductive-core-pins.json', 'content/pelvic-reproductive-core.ts', 'lib/pelvic-reproductive-core.ts'];
assert.equal(previousReview.files.length, 1053);
assert.equal(review.files.length, previousReview.files.length + addedPaths.length);
for (const previous of previousReview.files) assert(review.files.some(file => file.path === previous.path), `Retain prior Review input: ${previous.path}`);
assert.deepEqual(review.files.filter(file => !previousReview.files.some(prior => prior.path === file.path)).map(file => file.path).sort(), [...addedPaths].sort());
const changedInputs = ['app/body-content.ts', 'content/body-renderer-revision.json', 'content/body-review-display-pins.json'];
assert.deepEqual(review.files.filter(file => previousReview.files.some(prior => prior.path === file.path && prior.sourceSha256 !== file.sourceSha256)).map(file => file.path).sort(), changedInputs);
for (const path of [...addedPaths, ...changedInputs]) assert.equal(review.files.find(file => file.path === path)?.sourceSha256, sha(sourceAt(path)), path);
assert(!review.files.some(file => file.path === 'content/pelvic-reproductive-core.transition.json'));
for (const file of previousReview.files.filter(file => /^content\/.*-pins\.json$/.test(file.path) && file.path !== 'content/body-review-display-pins.json'))
  assert.deepEqual(admitted(`atlas-review/${file.path}`), old(`atlas-review/${file.path}`), `No immutable pin repin: ${file.path}`);

for (const name of ['head-neck', 'shoulder', 'female-pelvis', 'lower-limb']) {
  const base = `public/atlas-runtime/${name}/`, manifest = json(`${base}manifest.json`);
  assert.equal(manifest.sourceCommit, sourceRevision);
  assert.equal(manifest.patientDataIncluded, false);
  assert.equal(manifest.clinicalApproved, false);
  const previous = JSON.parse(old(`${base}manifest.json`));
  assert.deepEqual(manifest.files.filter(file => file.path.startsWith('models/')), previous.files.filter(file => file.path.startsWith('models/')));
  for (const file of manifest.files) assert.equal(sha(admitted(base + file.path)), file.sha256, `${name}:${file.path}`);
  const inputs = json(`${base}source-inputs.json`), previousInputs = JSON.parse(old(`${base}source-inputs.json`));
  for (const file of previousInputs) assert(inputs.some(item => item.path === file.path), `${name}: retained source input: ${file.path}`);
  for (const path of addedPaths) {
    const actual = inputs.find(file => file.path === path);
    assert.equal(Boolean(actual), name === 'head-neck' || name === 'shoulder', `${name}:${path}`);
    if (actual) assert.equal(actual.sha256, sha(sourceAt(path)));
  }
  assert(!inputs.some(file => file.path === 'content/pelvic-reproductive-core.transition.json'));
  // Root-body teaching is rendered by the shared regional namespace. The
  // separate shoulder entry renders its nine shoulder structures, not pelvis;
  // its retained source closure/model/notice bytes are verified above.
  if (name === 'head-neck') {
    const emitted = emittedTeaching(base, manifest.files, false, admitted);
    for (const entry of pins.entries) for (const tab of ['anatomy', 'function']) {
      const lesson = now.pelvicReproductiveCoreLesson(entry.identity, tab);
      const topic = now.pelvicReproductiveCoreTopics[entry.group], section = topic[tab];
      // Titles and source-limit bullets are assembled at runtime. Check every
      // exact producer fragment here; resolved values are checked above and
      // sampled in the real desktop panel, not invented as bundle literals.
      for (const value of [entry.identity.id, section.title, lesson.body, ...section.bullets, topic.limit, entry.identity.coverageNote, lesson.note, ...lesson.citations].filter(Boolean))
        assert(emitted.includes(value) || emitted.includes(JSON.stringify(value).slice(1, -1)), `${name}:${entry.identity.id}:${tab}:${value.slice(0, 40)}`);
    }
  }
}
const reviewBase = 'public/atlas-review-viewer/', reviewManifest = json(`${reviewBase}manifest.json`);
assert.equal(reviewManifest.sourceCommit, sourceRevision);
assert.equal(reviewManifest.personalRecordsIncluded, false);
assert.equal(reviewManifest.websiteIntegrationSha256, review.websiteIntegrationSha256);
for (const file of reviewManifest.files) assert.equal(sha(admitted(reviewBase + file.path)), file.sha256, `review:${file.path}`);
const emittedReview = emittedTeaching(reviewBase, reviewManifest.files, true, admitted);
for (const entry of pins.entries) for (const tab of ['anatomy', 'function']) {
  const lesson = now.pelvicReproductiveCoreLesson(entry.identity, tab);
  const topic = now.pelvicReproductiveCoreTopics[entry.group], section = topic[tab];
  for (const value of [entry.identity.id, section.title, lesson.body, ...section.bullets, topic.limit, entry.identity.coverageNote, lesson.note, ...lesson.citations].filter(Boolean))
    assert(emittedReview.includes(value) || emittedReview.includes(JSON.stringify(value).slice(1, -1)), `review:${entry.identity.id}:${tab}:${value.slice(0, 40)}`);
}
console.log(JSON.stringify({websiteBaseline, sourceRevision, changed, preserved, forgedMaterialRefusals: forged, staleRefusalsBeforeStorage: stale, storageCalls, changedReview, preservedReview, clinicalApproval: false}));

// Check the live admission as its own epoch, with the original source bytes retained.
const atlas = currentAtlasDeliveryRoot(), currentPin = validateCurrentAtlasDelivery(), currentReview = liveJson('atlas-review/manifest.json');
assert.equal(currentReview.revision, CURRENT_ATLAS_REVISION);
assert.equal(currentPin.source, CURRENT_ATLAS_REVISION);
for (const path of addedPaths) {
  const source = execFileSync('git', ['show', `${CURRENT_ATLAS_REVISION}:${path}`], {...gitOptions, cwd: atlas});
  const file = currentReview.files.find(item => item.path === path);
  assert(file, path);
  assert.deepEqual(source, sourceAt(path), `Retained pelvic source: ${path}`);
  assert.equal(file.sourceSha256, sha(source), `Current source: ${path}`);
  assert.equal(file.importedSha256, sha(readFileSync(`atlas-review/${path}`)), `Current import: ${path}`);
}
const currentCompiled = await build({stdin: {contents: common + "export * from './atlas-review/lib/pelvic-reproductive-core';export * from './atlas-review/content/pelvic-reproductive-core';", resolveDir: process.cwd(), loader: 'ts'}, bundle: true, write: false, platform: 'node', format: 'esm'});
const current = await import('data:text/javascript;base64,' + Buffer.from(currentCompiled.outputFiles[0].text).toString('base64'));
for (const {identity} of pins.entries) {
  const material = await current.bodyReviewMaterial(identity.id);
  assert.equal(material.approval, false);
  assert(await current.parseBodyReviewResponse(material, identity.id));
  for (const tab of ['anatomy', 'function']) {
    const expected = now.bodyLesson(identity, tab);
    assert.deepEqual(current.bodyLesson(identity, tab), expected, `Current pelvic lesson: ${identity.id}:${tab}`);
    assert.deepEqual(material.topics.find(topic => topic.tab === tab), {tab, ...expected});
    const foreign = structuredClone(identity); foreign.id += '-foreign';
    assert.equal(current.pelvicReproductiveCoreLesson(foreign, tab), undefined, `Current identity refusal: ${identity.id}:${tab}`);
  }
  const forgedMaterial = structuredClone(material);
  forgedMaterial.topics.find(topic => topic.tab === 'anatomy').body += ' foreign';
  assert.equal(await current.parseBodyReviewResponse(forgedMaterial, identity.id), null, `Current forged material refusal: ${identity.id}`);
}
for (const name of ['head-neck', 'shoulder']) {
  const base = `public/atlas-runtime/${name}/`, manifest = liveJson(`${base}manifest.json`);
  const runtimeSource = currentPin.runtimeSources[name];
  assert.equal(manifest.sourceCommit, runtimeSource);
  const inventorySource = liveJson('lib/atlas-model-inventory.json').sources.find(row => row.module === name);
  assert(inventorySource, `Current inventory missing ${name}`);
  assert.equal(inventorySource.sourceCommit, runtimeSource, `${name} inventory source`);
  assert.equal(inventorySource.manifestSha256, sha(readFileSync(`${base}manifest.json`)), `${name} inventory manifest`);
  const inputs = liveJson(`${base}source-inputs.json`);
  for (const path of addedPaths) {
    const input = inputs.find(file => file.path === path);
    assert(input, `${name}: missing ${path}`);
    const runtimeInput = execFileSync('git', ['show', `${runtimeSource}:${path}`], {...gitOptions, cwd: atlas});
    assert.equal(input.sha256, sha(runtimeInput), `${name}: family source ${path}`);
    assert.equal(input.sha256, currentReview.files.find(file => file.path === path)?.sourceSha256, `${name}: retained Review source ${path}`);
  }
  for (const file of manifest.files.filter(file => /(?:^|\/)(?:LICENSE(?:S)?(?:\/|$)|[^/]*NOTICE[^/]*)/i.test(file.path)))
    assert.equal(sha(readFileSync(base + file.path)), file.sha256, `${name}:${file.path} notice`);
  if (name === 'head-neck') {
    const emitted = emittedTeaching(base, manifest.files);
    for (const entry of pins.entries) for (const tab of ['anatomy', 'function']) {
      const lesson = current.pelvicReproductiveCoreLesson(entry.identity, tab);
      const topic = current.pelvicReproductiveCoreTopics[entry.group], section = topic[tab];
      for (const value of [entry.identity.id, section.title, lesson.body, ...section.bullets, topic.limit, entry.identity.coverageNote, lesson.note, ...lesson.citations].filter(Boolean))
        assert(emitted.includes(value) || emitted.includes(JSON.stringify(value).slice(1, -1)), `Current learner:${entry.identity.id}:${tab}:${value.slice(0, 40)}`);
    }
  }
}
const currentReviewBase = 'public/atlas-review-viewer/', currentReviewManifest = liveJson(`${currentReviewBase}manifest.json`);
assert.equal(currentReviewManifest.sourceCommit, CURRENT_ATLAS_REVISION);
const currentEmittedReview = emittedTeaching(currentReviewBase, currentReviewManifest.files, true);
for (const entry of pins.entries) for (const tab of ['anatomy', 'function']) {
  const lesson = current.pelvicReproductiveCoreLesson(entry.identity, tab);
  for (const value of [entry.identity.id, lesson.body, ...lesson.bullets, lesson.note, ...lesson.citations])
    assert(currentEmittedReview.includes(value) || currentEmittedReview.includes(JSON.stringify(value).slice(1, -1)), `Current review:${entry.identity.id}:${tab}:${value.slice(0, 40)}`);
}
console.log(JSON.stringify({websiteAdmission, currentRevision: CURRENT_ATLAS_REVISION, currentPelvicInputs: addedPaths.length, currentIdentityRefusals: 16, currentForgedMaterialRefusals: 8}));
