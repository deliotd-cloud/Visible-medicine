import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {build} from 'esbuild';
import {atlasExactGitApi} from './atlas-exact-git-api.mjs';
import {createGitObjectReader} from './git-object-reader.mjs';
import {openGitSnapshot} from './git-snapshot-reader.mjs';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
import {currentAtlasDeliveryRoot,CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const websiteAdmission = '8d59be96ab199918a45b423e384743077fb88f09';
const websiteBaseline = 'e8e8ea2bd813d940c0a33d3e666cf3e1e6ee77a4';
const sourceRevision = 'd6f25010210fd14aa2172605b78fa8cbc1875fb1';
const sourceBaseline = 'fae8cf6abbfffe304d5190e44f53affa883a96a3';
const atlasSource = currentAtlasDeliveryRoot();
const hash = value => createHash('sha256').update(typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value)).digest('hex');
const gitOptions = {maxBuffer: 32e6, windowsHide: true, env: {...process.env, GIT_NO_REPLACE_OBJECTS: '1'}};
const old = path => execFileSync('git', ['show', `${websiteBaseline}:${path}`], gitOptions);
const admitted = path => execFileSync('git', ['show', `${websiteAdmission}:${path}`], gitOptions);
const sourceAt = path => execFileSync('git', ['show', `${sourceRevision}:${path}`], {...gitOptions, cwd: atlasSource});
const json = path => JSON.parse(admitted(path));
const liveJson = path => JSON.parse(readFileSync(path));
const common = "export {bodyLesson,bodyContent} from './atlas-review/app/body-content';export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';export {contentTabs} from './atlas-review/lib/content-types';export {structures} from './atlas-review/app/anatomy-data';export {dissectionProfiles} from './atlas-review/app/dissection-data';export {regionalTours} from './atlas-review/lib/regional-tours';export {reasoningConcepts} from './atlas-review/lib/reasoning-questions';export * from './atlas-review/lib/body-review-material';export * from './atlas-review/lib/body-review-context';export * from './atlas-review/lib/body-review-response';export * from './atlas-review/lib/body-review-api';export * from './atlas-review/lib/body-review-decisions';";
const before = await atlasExactGitApi(websiteBaseline, common);
const now = await atlasExactGitApi(websiteAdmission, common + "export * from './atlas-review/lib/thoracoabdominal-organ-quiz';export * from './atlas-review/content/thoracoabdominal-organ-quiz';");
const pins = JSON.parse(sourceAt('content/thoracoabdominal-organ-quiz-pins.json'));
const transition = JSON.parse(sourceAt('content/thoracoabdominal-organ-quiz.transition.json'));
assert.equal(pins.baseline, sourceBaseline);
assert.equal(transition.baseline, sourceBaseline);
assert.equal(transition.pinsHash, hash(pins));
assert.equal(pins.entries.length, 8);
assert.equal(transition.entries.length, 8);
assert.deepEqual(admitted('atlas-review/content/thoracoabdominal-organ-quiz-pins.json'), sourceAt('content/thoracoabdominal-organ-quiz-pins.json'));

const expected = {heart: 'FMA7088', esophagus: 'FMA7131', thymus: 'FMA9607', stomach: 'FMA7148', smallIntestine: 'FMA7200', largeIntestine: 'FMA7201', appendix: 'FMA14542', ileocecalJunction: 'FMA11338'};
const entries = new Map(pins.entries.map(entry => [entry.identity.id, entry]));
assert.equal(entries.size, 8);
assert.deepEqual(Object.keys(now.thoracoabdominalOrganQuizQuestions).sort(), Object.keys(expected).sort());
assert.deepEqual(Object.fromEntries(pins.entries.map(entry => [entry.group, entry.identity.fmaId])), expected);
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

let changed = 0, preserved = 0, forged = 0, stale = 0, storageCalls = 0;
for (const structure of catalog.structures) {
  const entry = entries.get(structure.id);
  for (const tab of now.contentTabs) {
    const previous = before.bodyLesson(structure, tab);
    const current = now.bodyLesson(structure, tab);
    if (entry && tab === 'quiz') {
      assert.deepEqual(structure, entry.identity);
      assert.deepEqual(entry.previous.quiz, previous);
      assert.equal(previous.readiness, 'generated-identification');
      assert.deepEqual(current, now.thoracoabdominalOrganQuizLesson(entry.identity, tab));
      assert.equal(current.readiness, 'draft');
      const {readiness, ...display} = current;
      assert.deepEqual(now.bodyContent(structure, tab), display);
      const question = now.thoracoabdominalOrganQuizQuestions[entry.group];
      assert.equal(current.body, question.body);
      assert.deepEqual(current.bullets, [...question.choices]);
      assert.equal(current.correctAnswer, question.correctAnswer);
      assert.equal(current.explanation, question.explanation);
      assert.deepEqual(current.citations, [question.reference]);
      assert.equal(current.bullets.length, 4);
      assert.equal(new Set(current.bullets).size, 4);
      assert.equal(current.bullets.filter(choice => choice === current.correctAnswer).length, 1);
      assert.equal(new URL(question.reference).protocol, 'https:');
      assert.match(current.note, /radiologist review pending/i);
      assert.match(current.note, /independent/i);
      changed++;
    } else {
      assert.deepEqual(current, previous, `${structure.id}:${tab}:unchanged`);
      preserved++;
    }
  }
}
assert.equal(changed, 8);
assert.equal(preserved, 9928);

const pathsWhere = (value, predicate, path = []) => [
  ...(predicate(value) ? [path] : []),
  ...(value && typeof value === 'object' ? Object.entries(value).flatMap(([key, part]) => pathsWhere(part, predicate, [...path, key])) : []),
];
const at = (value, path) => path.reduce((part, key) => part[key], value);
for (const {identity} of pins.entries) {
  const lesson = now.thoracoabdominalOrganQuizLesson(identity, 'quiz');
  const original = structuredClone(lesson);
  lesson.bullets.push('foreign');
  lesson.citations.push('https://foreign.example');
  assert.deepEqual(now.thoracoabdominalOrganQuizLesson(identity, 'quiz'), original);
  for (const path of pathsWhere(identity, value => value === null || typeof value !== 'object')) {
    const foreign = structuredClone(identity), parent = at(foreign, path.slice(0, -1)), key = path.at(-1), value = parent[key];
    parent[key] = typeof value === 'string' ? `${value}-foreign` : typeof value === 'number' ? value + 0.01 : value === null ? 'foreign' : !value;
    assert.equal(now.thoracoabdominalOrganQuizLesson(foreign, 'quiz'), undefined, `${identity.id}:${path.join('.')}`);
  }
  for (const path of pathsWhere(identity, Array.isArray)) {
    const foreign = structuredClone(identity);
    at(foreign, path).push('foreign');
    assert.equal(now.thoracoabdominalOrganQuizLesson(foreign, 'quiz'), undefined, `${identity.id}:${path.join('.')}`);
  }
  assert.equal(now.thoracoabdominalOrganQuizLesson({...structuredClone(identity), unexpected: true}, 'quiz'), undefined);
  for (const tab of now.contentTabs.filter(tab => tab !== 'quiz')) assert.equal(now.thoracoabdominalOrganQuizLesson(identity, tab), undefined);
  const material = await now.bodyReviewMaterial(identity.id), priorMaterial = await before.bodyReviewMaterial(identity.id);
  assert.equal(material.approval, false);
  assert(await now.parseBodyReviewResponse(material, identity.id));
  for (const key of ['source', 'reasoning', 'guidedTours']) assert.deepEqual(material[key], priorMaterial[key]);
  assert.deepEqual(material.topics.find(topic => topic.tab === 'quiz'), {tab: 'quiz', ...original});
  for (const edit of [
    value => {value.topics.find(topic => topic.tab === 'quiz').body += ' foreign';},
    value => {value.topics.find(topic => topic.tab === 'quiz').readiness = 'approved';},
    value => {value.topics.find(topic => topic.tab === 'quiz').citations = ['https://foreign.example'];},
    value => {value.source.structure.sources = [];},
    value => {value.topics = value.topics.filter(topic => topic.tab !== 'quiz');},
  ]) {
    const foreign = structuredClone(material);
    edit(foreign);
    assert.equal(await now.parseBodyReviewResponse(foreign, identity.id), null);
    forged++;
  }
  const priorContext = await before.bodyReviewContext(identity.id), context = await now.bodyReviewContext(identity.id);
  assert.equal(context.sourceHash, priorContext.sourceHash);
  assert.notEqual(context.revisions.teaching, priorContext.revisions.teaching);
  assert.equal(context.revisions.imaging, null);
  const packet = {catalogScope: context.catalogScope, structureId: identity.id, track: 'teaching', expectedVersion: 0, materialHash: context.materialHash, revisionHash: context.revisions.teaching, checklistVersion: context.checklistVersion, draft: now.blankBodyReview(context, 'teaching')};
  for (const delta of [
    {materialHash: priorContext.materialHash, revisionHash: priorContext.revisions.teaching},
    {materialHash: priorContext.materialHash},
    {revisionHash: priorContext.revisions.teaching},
  ]) {
    const response = await now.postBodyDecision(new Request('https://atlas.test/api/body-decisions', {method: 'POST', headers: {origin: 'https://atlas.test', 'content-type': 'application/json', 'oai-authenticated-user-id': 'SYNTHETIC_THORACOABDOMINAL_QUIZ'}, body: JSON.stringify({...packet, ...delta})}), {prepare() {storageCalls++; throw Error('Stale decision reached storage');}});
    assert.equal(response.status, 409);
    stale++;
  }
}
assert.equal(forged, 40);
assert.equal(stale, 24);
assert.equal(storageCalls, 0);
assert.equal(now.thoracoabdominalOrganQuizLesson({id: 'foreign'}, 'quiz'), undefined);

let changedReview = 0;
for (const structure of catalog.structures) {
  const previous = await before.bodyReviewMaterial(structure.id), current = await now.bodyReviewMaterial(structure.id);
  for (const key of ['source', 'reasoning', 'guidedTours']) assert.deepEqual(current[key], previous[key]);
  assert.equal(current.approval, false);
  if (entries.has(structure.id)) {
    assert.notEqual(current.fingerprints.teaching, previous.fingerprints.teaching);
    changedReview++;
  } else {
    assert.deepEqual(current.topics, previous.topics);
    assert.equal(current.fingerprints.teaching, previous.fingerprints.teaching);
  }
}
assert.equal(changedReview, 8);

const review = json('atlas-review/manifest.json');
assert.equal(review.revision, sourceRevision);
const admissionSnapshot = await openGitSnapshot({cwd:process.cwd(),commit:websiteAdmission,
  createBlobReader:createGitObjectReader,maxMetadataBytes:64_000_000,maxObjectBytes:8_000_000,
  maxEntries:250_000,maxBlobBytes:32_000_000});
try {
for (const file of review.files) assert.equal(hash(await admissionSnapshot.read(`atlas-review/${file.path}`)), file.importedSha256, file.path);
const addedPaths = ['content/thoracoabdominal-organ-quiz-pins.json', 'content/thoracoabdominal-organ-quiz.ts', 'lib/thoracoabdominal-organ-quiz.ts'];
const previousReview = JSON.parse(old('atlas-review/manifest.json'));
assert.equal(review.files.length, previousReview.files.length + 3);
assert.equal(previousReview.files.length, 1050);
for (const previous of previousReview.files) assert(review.files.some(file => file.path === previous.path), `Retain prior Review input: ${previous.path}`);
assert.deepEqual(review.files.filter(file => !previousReview.files.some(prior => prior.path === file.path)).map(file => file.path).sort(), [...addedPaths].sort());
const changedInputs = ['app/body-content.ts', 'content/body-renderer-revision.json', 'content/body-review-display-pins.json'];
assert.deepEqual(review.files.filter(file => previousReview.files.some(prior => prior.path === file.path && prior.sourceSha256 !== file.sourceSha256)).map(file => file.path).sort(), changedInputs);
for (const path of changedInputs) assert.equal(review.files.find(file => file.path === path)?.sourceSha256, hash(sourceAt(path)), `Exact changed saved source: ${path}`);
for (const path of addedPaths) {
  const file = review.files.find(item => item.path === path);
  assert(file, path);
  assert.equal(file.sourceSha256, hash(sourceAt(path)));
}
assert(!review.files.some(file => file.path === 'content/thoracoabdominal-organ-quiz.transition.json'));
for (const file of previousReview.files.filter(file => /^content\/.*-pins\.json$/.test(file.path) && file.path !== 'content/body-review-display-pins.json'))
  assert.deepEqual(admitted(`atlas-review/${file.path}`), old(`atlas-review/${file.path}`), `No immutable pin repin: ${file.path}`);

for (const name of ['head-neck', 'shoulder', 'female-pelvis', 'lower-limb']) {
  const base = `public/atlas-runtime/${name}/`, manifest = json(`${base}manifest.json`);
  assert.equal(manifest.sourceCommit, sourceRevision);
  assert.equal(manifest.patientDataIncluded, false);
  assert.equal(manifest.clinicalApproved, false);
  const previous = JSON.parse(old(`${base}manifest.json`));
  assert.deepEqual(manifest.files.filter(file => file.path.startsWith('models/')), previous.files.filter(file => file.path.startsWith('models/')));
  for (const file of manifest.files) assert.equal(hash(await admissionSnapshot.read(base + file.path)), file.sha256, `${name}:${file.path}`);
  const inputs = json(`${base}source-inputs.json`);
  const previousInputs = JSON.parse(old(`${base}source-inputs.json`));
  for (const previous of previousInputs) assert(inputs.some(file => file.path === previous.path), `${name}: retained source input: ${previous.path}`);
  const dispatcher = inputs.find(file => file.path === 'app/body-content.ts');
  if (dispatcher) assert.equal(dispatcher.sha256, hash(sourceAt('app/body-content.ts')), `${name}: exact changed teaching dispatch`);
  for (const path of addedPaths) {
    const imported = review.files.find(file => file.path === path), actual = inputs.find(file => file.path === path);
    assert.equal(Boolean(actual), name === 'head-neck' || name === 'shoulder', `${name}:${path}`);
    if (actual) assert.equal(actual.sha256, imported.sourceSha256);
  }
  assert(!inputs.some(file => file.path === 'content/thoracoabdominal-organ-quiz.transition.json'));
  if (name === 'head-neck') {
    const emitted = emittedTeaching(base, manifest.files, false, admitted);
    for (const entry of pins.entries) {
      const lesson = now.thoracoabdominalOrganQuizLesson(entry.identity, 'quiz');
      for (const value of [entry.identity.id, lesson.body, ...lesson.bullets, lesson.note, ...lesson.citations])
        assert(emitted.includes(value) || emitted.includes(JSON.stringify(value).slice(1, -1)), `learner:${entry.identity.id}:${value.slice(0, 40)}`);
    }
  }
}
const reviewBase = 'public/atlas-review-viewer/', reviewManifest = json(`${reviewBase}manifest.json`);
assert.equal(reviewManifest.sourceCommit, sourceRevision);
assert.equal(reviewManifest.personalRecordsIncluded, false);
assert.equal(reviewManifest.websiteIntegrationSha256, review.websiteIntegrationSha256);
for (const file of reviewManifest.files) assert.equal(hash(await admissionSnapshot.read(reviewBase + file.path)), file.sha256, `review:${file.path}`);
const emittedReview = emittedTeaching(reviewBase, reviewManifest.files, true, admitted);
for (const entry of pins.entries) {
  const lesson = now.thoracoabdominalOrganQuizLesson(entry.identity, 'quiz');
  for (const value of [entry.identity.id, lesson.body, ...lesson.bullets, lesson.note, ...lesson.citations])
    assert(emittedReview.includes(value) || emittedReview.includes(JSON.stringify(value).slice(1, -1)), `review:${entry.identity.id}:${value.slice(0, 40)}`);
}

// Current delivery is a separate epoch: retain the exact admitted quiz source and behavior.
currentAtlasDeliveryRoot();
const currentPin = validateCurrentAtlasDelivery();
const currentReview = liveJson('atlas-review/manifest.json');
assert.equal(currentReview.revision, CURRENT_ATLAS_REVISION);
assert.equal(currentPin.source, CURRENT_ATLAS_REVISION);
for (const path of addedPaths) {
  const file = currentReview.files.find(item => item.path === path);
  assert(file, path);
  const source = execFileSync('git', ['show', `${CURRENT_ATLAS_REVISION}:${path}`], {...gitOptions, cwd: atlasSource});
  assert.deepEqual(source, sourceAt(path), `Quiz source retained: ${path}`);
  assert.equal(file.sourceSha256, hash(source), `Current source: ${path}`);
  assert.equal(file.importedSha256, hash(readFileSync(`atlas-review/${path}`)), `Current import: ${path}`);
  assert.deepEqual(readFileSync(`atlas-review/${path}`), admitted(`atlas-review/${path}`), `Quiz import retained: ${path}`);
}
const currentCompiled = await build({stdin: {contents: common + "export * from './atlas-review/lib/thoracoabdominal-organ-quiz';export * from './atlas-review/content/thoracoabdominal-organ-quiz';", resolveDir: process.cwd(), loader: 'ts'}, bundle: true, write: false, platform: 'node', format: 'esm'});
const current = await import('data:text/javascript;base64,' + Buffer.from(currentCompiled.outputFiles[0].text).toString('base64'));
for (const {identity} of pins.entries) {
  const admittedLesson = now.bodyLesson(identity, 'quiz');
  assert.deepEqual(current.bodyLesson(identity, 'quiz'), admittedLesson, `Current quiz lesson: ${identity.id}`);
  const material = await current.bodyReviewMaterial(identity.id);
  assert.equal(material.approval, false);
  assert.deepEqual(material.topics.find(topic => topic.tab === 'quiz'), {tab: 'quiz', ...admittedLesson});
  assert(await current.parseBodyReviewResponse(material, identity.id));
}
for (const name of ['head-neck', 'shoulder']) {
  const base = `public/atlas-runtime/${name}/`, manifest = liveJson(`${base}manifest.json`);
  const runtimeSource = currentPin.runtimeSources[name];
  assert.equal(manifest.sourceCommit, runtimeSource);
  const inventorySource = liveJson('lib/atlas-model-inventory.json').sources.find(row => row.module === name);
  assert(inventorySource, `Current inventory missing ${name}`);
  assert.equal(inventorySource.sourceCommit, runtimeSource, `${name} inventory source`);
  assert.equal(inventorySource.manifestSha256, hash(readFileSync(`${base}manifest.json`)), `${name} inventory manifest`);
  const inputs = liveJson(`${base}source-inputs.json`);
  for (const path of addedPaths) {
    const input = inputs.find(file => file.path === path);
    assert(input, `${name}: missing ${path}`);
    const source = execFileSync('git', ['show', `${runtimeSource}:${path}`], {...gitOptions, cwd: atlasSource});
    assert.equal(input.sha256, hash(source), `${name}: family source ${path}`);
    assert.equal(input.sha256, currentReview.files.find(file => file.path === path).sourceSha256, `${name}: retained Review source ${path}`);
  }
  const bodyPath = 'app/body-content.ts', bodyInput = inputs.find(file => file.path === bodyPath);
  assert(bodyInput, `${name}: missing ${bodyPath}`);
  const bodySource = execFileSync('git', ['show', `${runtimeSource}:${bodyPath}`], {...gitOptions, cwd: atlasSource});
  assert.equal(bodyInput.sha256, hash(bodySource), `${name}: family body source`);
  const reviewBodySource = currentReview.files.find(file => file.path === bodyPath)?.sourceSha256;
  assert(reviewBodySource, `Current Review missing ${bodyPath}`);
  const reviewBody = execFileSync('git', ['show', `${CURRENT_ATLAS_REVISION}:${bodyPath}`], {...gitOptions, cwd: atlasSource});
  assert.equal(reviewBodySource, hash(reviewBody), `${name}: Review body source`);
  if (runtimeSource === CURRENT_ATLAS_REVISION) assert.equal(bodyInput.sha256, reviewBodySource, `${name}: shared body source`);
  for (const file of manifest.files.filter(file => /(?:^|\/)(?:LICENSE(?:S)?(?:\/|$)|[^/]*NOTICE[^/]*)/i.test(file.path)))
    assert.equal(hash(readFileSync(base + file.path)), file.sha256, `${name}:${file.path} notice`);
  if (name === 'head-neck') {
    const emitted = emittedTeaching(base, manifest.files);
    for (const {identity} of pins.entries) {
      const lesson = current.bodyLesson(identity, 'quiz');
      for (const value of [identity.id, lesson.body, ...lesson.bullets, lesson.note, ...lesson.citations])
        assert(emitted.includes(value) || emitted.includes(JSON.stringify(value).slice(1, -1)), `Current learner:${identity.id}:${value.slice(0, 40)}`);
    }
  }
}
const currentReviewBase = 'public/atlas-review-viewer/', currentReviewManifest = liveJson(`${currentReviewBase}manifest.json`);
assert.equal(currentReviewManifest.sourceCommit, CURRENT_ATLAS_REVISION);
const currentEmittedReview = emittedTeaching(currentReviewBase, currentReviewManifest.files, true);
for (const {identity} of pins.entries) {
  const lesson = current.bodyLesson(identity, 'quiz');
  for (const value of [identity.id, lesson.body, ...lesson.bullets, lesson.note, ...lesson.citations])
    assert(currentEmittedReview.includes(value) || currentEmittedReview.includes(JSON.stringify(value).slice(1, -1)), `Current review:${identity.id}:${value.slice(0, 40)}`);
}
console.log(JSON.stringify({websiteBaseline, websiteAdmission, sourceRevision, currentRevision: CURRENT_ATLAS_REVISION, changed, preserved, forgedMaterialRefusals: forged, staleRefusalsBeforeStorage: stale, storageCalls, changedReviewWorksheets: changedReview, emittedRuntimes: 4, clinicalApproval: false}));
} finally { await admissionSnapshot.close(); }
