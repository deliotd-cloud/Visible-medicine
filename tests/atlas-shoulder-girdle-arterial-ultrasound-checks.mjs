import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {resolve, dirname, relative} from 'node:path';
import {parse} from 'acorn';
import {build} from 'esbuild';
import {atlasExactGitApi} from './atlas-exact-git-api.mjs';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
import {validateCurrentAtlasDelivery, currentAtlasDeliveryRoot, CURRENT_ATLAS_REVISION} from './current-atlas-delivery.mjs';

const websiteBaseline = '37e2e9e900ef2cdd1b6b9000fb1a813b69e8495e';
const sourceRevision = 'c5c99ba11e6533d306587e71f5fc2854d882fbd6';
// Keep the completed source epoch fixed; only the current delivery moves.
const deliveryRevision = '12570b5245dc6a253cbdd73ec4e044c58b81a927';
const deliveryWebsite = 'ec85edb86bb34c92c66e2f310da09904f27ea7c4';
const sourceBaseline = 'bbe33ea6ffff3503ae9cdabc0dd41350cece28cd';
const atlasSource = 'F:/VisibleMedicine/atlas';
const hash = value => createHash('sha256').update(typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value)).digest('hex');
const gitOptions = {maxBuffer: 32e6, windowsHide: true, env: {...process.env, GIT_NO_REPLACE_OBJECTS: '1'}};
const old = path => execFileSync('git', ['show', `${websiteBaseline}:${path}`], gitOptions);
const delivered = path => execFileSync('git', ['show', `${deliveryWebsite}:${path}`], gitOptions);
const sourceAt = path => execFileSync('git', ['show', `${sourceRevision}:${path}`], {...gitOptions, cwd: atlasSource});
const quizSourceRevision = 'd6f25010210fd14aa2172605b78fa8cbc1875fb1';
const quizSourceAt = path => execFileSync('git', ['show', `${quizSourceRevision}:${path}`], {...gitOptions, cwd: atlasSource});
const coreSourceRevision = '05a2e8a26325818675c4b98ab1d9b9c246028a5c';
const coreSourceAt = path => execFileSync('git', ['show', `${coreSourceRevision}:${path}`], {...gitOptions, cwd: atlasSource});
const respiratorySourceRevision = '12570b5245dc6a253cbdd73ec4e044c58b81a927';
const respiratorySourceAt = path => execFileSync('git', ['show', `${respiratorySourceRevision}:${path}`], {...gitOptions, cwd: atlasSource});
const common = "export {bodyLesson,bodyContent} from './atlas-review/app/body-content';export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';export {contentTabs} from './atlas-review/lib/content-types';export {structures} from './atlas-review/app/anatomy-data';export {dissectionProfiles} from './atlas-review/app/dissection-data';export {regionalTours} from './atlas-review/lib/regional-tours';export {reasoningConcepts} from './atlas-review/lib/reasoning-questions';export * from './atlas-review/lib/body-review-material';export * from './atlas-review/lib/body-review-context';export * from './atlas-review/lib/body-review-response';export * from './atlas-review/lib/body-review-api';export * from './atlas-review/lib/body-review-decisions';";
const before = await atlasExactGitApi(websiteBaseline, common);
const featureGraph = common + "export * from './atlas-review/lib/shoulder-girdle-arterial-ultrasound';export * from './atlas-review/content/shoulder-girdle-arterial-ultrasound';export * from './atlas-review/lib/pelvic-reproductive-core';export * from './atlas-review/lib/respiratory-core-depth';";
const now = await atlasExactGitApi(deliveryWebsite, featureGraph);
const historicalReview = JSON.parse(delivered('atlas-review/manifest.json'));
const historicalInputs = JSON.parse(delivered('atlas-review/integration-inputs.json'));
assert.equal(historicalReview.revision, deliveryRevision);
assert.equal(historicalInputs.sourceCommit, deliveryRevision);
assert.equal(historicalReview.websiteIntegrationSha256, historicalInputs.sha256);
assert.equal(hash(JSON.stringify(historicalInputs.inputs)), historicalInputs.sha256);
for (const file of historicalReview.files) {
  assert.equal(hash(delivered(`atlas-review/${file.path}`)), file.importedSha256, `historical:${file.path}`);
  assert.equal(hash(execFileSync('git', ['show', `${deliveryRevision}:${file.path}`], {...gitOptions, cwd: atlasSource})), file.sourceSha256, `historical-source:${file.path}`);
}
const pins = JSON.parse(sourceAt('content/shoulder-girdle-arterial-ultrasound-pins.json'));
const transition = JSON.parse(sourceAt('content/shoulder-girdle-arterial-ultrasound.transition.json'));
assert.equal(hash(pins), '2edc421ca9a85878625dc607e990d1136fbb4be63609c62ba565161ffa09e56d');
assert.equal(hash(transition), 'f8718d1d4428a8301a83bc0332c7e007c646dc579ea98354969c987d5eafd20f');
assert.equal(pins.baseline, sourceBaseline);
assert.equal(transition.baseline, sourceBaseline);
assert.equal(transition.sourcePinsHash, hash(pins));
assert.deepEqual(delivered('atlas-review/content/shoulder-girdle-arterial-ultrasound-pins.json'), sourceAt('content/shoulder-girdle-arterial-ultrasound-pins.json'));
const expectedFamilies = {posteriorCircumflexHumeral: 2, circumflexScapular: 2, thyrocervical: 2, costocervical: 2, dorsalScapular: 2};
assert.deepEqual(pins.entries.reduce((counts, entry) => (counts[entry.family] = (counts[entry.family] || 0) + 1, counts), {}), expectedFamilies);
assert.equal(pins.entries.length, 10);
assert.equal(transition.entries.length, 10);
const entries = new Map(pins.entries.map(entry => [entry.identity.id, entry]));
const transitions = new Map(transition.entries.map(entry => [entry.id, entry]));
assert.equal(entries.size, 10);
assert.equal(transitions.size, 10);
// Replay only the eight later Quiz edits when comparing with this frozen arterial epoch.
const quizPins = JSON.parse(quizSourceAt('content/thoracoabdominal-organ-quiz-pins.json'));
const quizTransition = JSON.parse(quizSourceAt('content/thoracoabdominal-organ-quiz.transition.json'));
assert.equal(quizPins.baseline, 'fae8cf6abbfffe304d5190e44f53affa883a96a3');
assert.equal(hash(quizPins), 'cdbf0d312e3c4ba410048e165b145c141cc4ee533dd0903d21b0c8967525bb62');
assert.equal(hash(quizTransition), '5430f82020f772fe00295e872c4e7a2c6355233593785714826be37d7cd5b0ea');
assert.equal(quizTransition.baseline, quizPins.baseline);
assert.equal(quizTransition.pinsHash, hash(quizPins));
assert.equal(quizPins.entries.length, 8);
assert.equal(quizTransition.entries.length, 8);
assert.deepEqual(delivered('atlas-review/content/thoracoabdominal-organ-quiz-pins.json'), quizSourceAt('content/thoracoabdominal-organ-quiz-pins.json'));
const quizEntries = new Map(quizPins.entries.map(entry => [entry.identity.id, entry]));
const quizChanges = new Map(quizTransition.entries.map(entry => [entry.id, entry]));
assert.equal(quizEntries.size, 8);
assert.equal(quizChanges.size, 8);
assert([...quizEntries.keys()].every(id => !entries.has(id)), 'Later Quiz and arterial targets are disjoint');
// Replay the later pelvic Anatomy/Function epoch without changing the arterial author epoch.
const corePins = JSON.parse(coreSourceAt('content/pelvic-reproductive-core-pins.json'));
const coreTransition = JSON.parse(coreSourceAt('content/pelvic-reproductive-core.transition.json'));
assert.equal(corePins.baseline, '3d1d0f862d2e7567d298bc89690b11bf38ca3326');
assert.equal(hash(corePins), 'd343309d262a854581d85b332d74254d69bbecfe16d03efe9fdf021cd2729633');
assert.equal(hash(coreTransition), '3a0be27bf5b89d4d41fb74d80c3b3083b04a451155bb9ce438ff1ed70bc0d2ac');
assert.equal(coreTransition.baseline, corePins.baseline);
assert.equal(coreTransition.pinsHash, hash(corePins));
assert.equal(corePins.entries.length, 8);
assert.equal(coreTransition.entries.length, 16);
assert.deepEqual(delivered('atlas-review/content/pelvic-reproductive-core-pins.json'), coreSourceAt('content/pelvic-reproductive-core-pins.json'));
const coreEntries = new Map(corePins.entries.map(entry => [entry.identity.id, entry]));
const coreChanges = new Map(coreTransition.entries.map(entry => [`${entry.id}|${entry.tab}`, entry]));
assert.equal(coreEntries.size, 8);
assert.equal(coreChanges.size, 16);
assert([...coreEntries.keys()].every(id => !entries.has(id) && !quizEntries.has(id)), 'Later pelvic roots are disjoint from arterial and Quiz targets');
// Replay only the eight later respiratory placements after verifying their saved source epoch.
const respiratoryPins = JSON.parse(respiratorySourceAt('content/respiratory-core-depth-pins.json'));
const respiratoryTransition = JSON.parse(respiratorySourceAt('content/respiratory-core-depth.transition.json'));
assert.equal(respiratoryPins.baseline, 'ae13b8de049671e2cac8dd789a6bfb385f147769');
assert.equal(hash(respiratoryPins), 'c903690d5756f9bee82ce110cb62fd44afacdf960e85e8015fd24af0f68fbd4c');
assert.equal(hash(respiratoryTransition), '65880a32a320f6bb2a867f41519da5cd1d65acc1ee4ea85a20f95df915b9c6e9');
assert.equal(respiratoryTransition.baseline, respiratoryPins.baseline);
assert.equal(respiratoryTransition.pinsHash, hash(respiratoryPins));
assert.equal(respiratoryPins.entries.length, 5);
assert.equal(respiratoryTransition.entries.length, 8);
assert.deepEqual(delivered('atlas-review/content/respiratory-core-depth-pins.json'), respiratorySourceAt('content/respiratory-core-depth-pins.json'));
const respiratoryEntries = new Map(respiratoryPins.entries.map(entry => [entry.identity.id, entry]));
const respiratoryChanges = new Map(respiratoryTransition.entries.map(entry => [`${entry.id}|${entry.tab}`, entry]));
assert.equal(respiratoryEntries.size, 5);
assert.equal(respiratoryChanges.size, 8);
assert([...respiratoryEntries.keys()].every(id => !entries.has(id) && !quizEntries.has(id) && !coreEntries.has(id)), 'Later respiratory roots are disjoint from preceding targets');
assert.deepEqual([...respiratoryEntries.values()].map(entry => Object.keys(entry.previous).sort()).sort(), [['anatomy'], ['anatomy'], ['anatomy', 'function'], ['anatomy', 'function'], ['anatomy', 'function']]);

const sourceCatalog = JSON.parse(delivered('atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
const catalog = now.bodyDisplayCatalog(sourceCatalog);
assert.equal(catalog.structures.length, 1104);
assert.equal(catalog.bundles.length, 109);
assert.deepEqual(catalog, before.bodyDisplayCatalog(JSON.parse(old('atlas-review/public/models/bodyparts3d/full-body/catalog.json'))));
for (const key of ['structures', 'dissectionProfiles', 'regionalTours', 'reasoningConcepts', 'contentTabs']) assert.deepEqual(now[key], before[key], key);
assert.equal(now.contentTabs.length, 9);
assert.equal(pins.sourceVersion, sourceCatalog.sourceVersion);
assert.equal(pins.license, sourceCatalog.license);
assert.deepEqual(pins.coordinateSystem, sourceCatalog.coordinateSystem);
assert.deepEqual(pins.bundles, sourceCatalog.bundles.filter(bundle => ['shoulder-arm-vessels-recovery', 'shoulder-arm-vessels-inventory'].includes(bundle.id)));
const snapshot = api => ({catalog, body: catalog.structures.map(structure => ({id: structure.id, topics: Object.fromEntries(api.contentTabs.map(tab => [tab, api.bodyLesson(structure, tab)]))})), shoulder: api.structures, recipes: api.dissectionProfiles});
assert.equal(hash(snapshot(before)), pins.beforeAllTeachingSnapshotHash);
const recovered = snapshot(now);
let changed = 0, preserved = 0, quizReversed = 0, coreReversed = 0, respiratoryReversed = 0, identityRefusals = 0, malformed = 0, stale = 0, storageCalls = 0, worksheets = 0;
for (const row of recovered.body) {
  const structure = catalog.structures.find(item => item.id === row.id), entry = entries.get(row.id);
  for (const tab of now.contentTabs) {
    const prior = before.bodyLesson(structure, tab);
    if (entry && tab === 'ultrasound') {
      const lesson = now.bodyLesson(structure, tab), recorded = transitions.get(row.id);
      assert.deepEqual(prior, entry.previous);
      assert.deepEqual(lesson, now.shoulderGirdleArterialUltrasoundLesson(entry.identity, tab));
      assert(recorded);
      assert.equal(recorded.fmaId, structure.fmaId);
      assert.equal(hash(lesson), recorded.draftHash);
      assert.equal(prior.readiness, 'pending');
      assert.equal(lesson.readiness, 'draft');
      const {readiness, ...display} = lesson;
      assert.deepEqual(now.bodyContent(structure, tab), display);
      row.topics[tab] = prior;
      changed++;
    } else if (tab === 'quiz' && quizEntries.has(row.id)) {
      const quizEntry = quizEntries.get(row.id), recorded = quizChanges.get(row.id);
      assert(recorded); assert.equal(recorded.tab, 'quiz');
      assert.equal(recorded.fmaId, structure.fmaId);
      assert.deepEqual(structure, quizEntry.identity, `${row.id}:exact Quiz source identity`);
      assert.equal(hash(row.topics[tab]), recorded.currentHash, `${row.id}:saved Quiz draft`);
      assert.equal(hash(prior), recorded.previousHash, `${row.id}:recorded old Quiz`);
      assert.deepEqual(prior, quizEntry.previous.quiz);
      row.topics[tab] = structuredClone(prior);
      quizReversed++;
    } else if (coreEntries.has(row.id) && (tab === 'anatomy' || tab === 'function')) {
      const coreEntry = coreEntries.get(row.id), recorded = coreChanges.get(`${row.id}|${tab}`);
      assert(recorded); assert.equal(recorded.fmaId, structure.fmaId);
      assert.deepEqual(structure, coreEntry.identity, `${row.id}:exact pelvic source identity`);
      assert.deepEqual(prior, coreEntry.previous[tab]);
      assert.equal(hash(prior), recorded.previousHash, `${row.id}:${tab}:recorded old pelvic lesson`);
      assert.equal(hash(row.topics[tab]), recorded.currentHash, `${row.id}:${tab}:saved pelvic draft`);
      assert.deepEqual(row.topics[tab], now.pelvicReproductiveCoreLesson(coreEntry.identity, tab));
      row.topics[tab] = structuredClone(prior);
      coreReversed++;
    } else if (respiratoryChanges.has(`${row.id}|${tab}`)) {
      const respiratoryEntry = respiratoryEntries.get(row.id), recorded = respiratoryChanges.get(`${row.id}|${tab}`);
      assert(respiratoryEntry);
      assert.equal(recorded.fmaId, structure.fmaId);
      assert.deepEqual(structure, respiratoryEntry.identity, `${row.id}:exact respiratory source identity`);
      assert.deepEqual(prior, respiratoryEntry.previous[tab]);
      assert.equal(hash(prior), recorded.previousHash, `${row.id}:${tab}:recorded old respiratory lesson`);
      assert.equal(hash(row.topics[tab]), recorded.currentHash, `${row.id}:${tab}:saved respiratory draft`);
      assert.deepEqual(row.topics[tab], now.respiratoryCoreDepthLesson(respiratoryEntry.identity, tab));
      row.topics[tab] = structuredClone(prior);
      respiratoryReversed++;
    } else {
      assert.deepEqual(row.topics[tab], prior, `${row.id}:${tab}:unchanged`);
      preserved++;
    }
  }
}
assert.equal(changed, 10);
assert.equal(quizReversed, 8);
assert.equal(coreReversed, 16);
assert.equal(respiratoryReversed, 8);
assert.equal(preserved, 9894);
assert.equal(hash(recovered), pins.beforeAllTeachingSnapshotHash);
const pathsWhere = (value, predicate, path = []) => [
  ...(predicate(value) ? [path] : []),
  ...(value && typeof value === 'object' ? Object.entries(value).flatMap(([key, part]) => pathsWhere(part, predicate, [...path, key])) : []),
];
const at = (value, path) => path.reduce((part, key) => part[key], value);
for (const {identity, previous, family} of pins.entries) {
  assert.deepEqual(catalog.structures.find(structure => structure.id === identity.id), identity);
  assert.deepEqual(previous, before.bodyLesson(identity, 'ultrasound'));
  assert.equal(previous.readiness, 'pending');
  assert.match(identity.fmaId, /^FMA\d+$/);
  assert.equal(identity.sources.length, family === 'posteriorCircumflexHumeral' ? 2 : 1);
  for (const source of identity.sources) assert.match(source.file, /^FJ\d+[A-Z]?$/);
  const lesson = now.shoulderGirdleArterialUltrasoundLesson(identity, 'ultrasound');
  assert.equal(lesson.readiness, 'draft');
  assert.match(lesson.note, /revision-bound radiologist/i);
  assert.match(lesson.note, /independent/i);
  assert.equal(lesson.body, now.shoulderGirdleArterialUltrasoundTeaching[family].body);
  assert.deepEqual(lesson.bullets, [...now.shoulderGirdleArterialUltrasoundTeaching[family].bullets]);
  assert.deepEqual(lesson.citations, now.shoulderGirdleArterialUltrasoundTeaching[family].citations.map(key => now.shoulderGirdleArterialUltrasoundReferences[key]));
  for (const citation of lesson.citations) assert.equal(new URL(citation).protocol, 'https:');
  const original = structuredClone(lesson);
  lesson.bullets.push('foreign');
  lesson.citations.push('https://foreign.example');
  assert.deepEqual(now.shoulderGirdleArterialUltrasoundLesson(identity, 'ultrasound'), original);
  for (const path of pathsWhere(identity, value => value === null || typeof value !== 'object')) {
    const foreign = structuredClone(identity), parent = at(foreign, path.slice(0, -1)), key = path.at(-1), value = parent[key];
    parent[key] = typeof value === 'string' ? `${value}-foreign` : typeof value === 'number' ? value + 0.01 : value === null ? 'foreign' : !value;
    assert.equal(now.shoulderGirdleArterialUltrasoundLesson(foreign, 'ultrasound'), undefined, `${identity.id}:${path.join('.')}`);
    identityRefusals++;
  }
  for (const path of pathsWhere(identity, Array.isArray)) {
    const foreign = structuredClone(identity);
    at(foreign, path).push('foreign');
    assert.equal(now.shoulderGirdleArterialUltrasoundLesson(foreign, 'ultrasound'), undefined, `${identity.id}:${path.join('.')}`);
    identityRefusals++;
  }
  if (identity.sources.length > 1) {
    const reordered = structuredClone(identity);
    reordered.sources.reverse();
    assert.equal(now.shoulderGirdleArterialUltrasoundLesson(reordered, 'ultrasound'), undefined, `${identity.id}:ordered-sources`);
    identityRefusals++;
  }
  assert.equal(now.shoulderGirdleArterialUltrasoundLesson({...structuredClone(identity), unexpected: true}, 'ultrasound'), undefined);
  identityRefusals++;
  for (const tab of now.contentTabs.filter(tab => tab !== 'ultrasound')) assert.equal(now.shoulderGirdleArterialUltrasoundLesson(identity, tab), undefined);
  const current = await now.bodyReviewMaterial(identity.id), prior = await before.bodyReviewMaterial(identity.id);
  assert.equal(current.approval, false);
  assert(await now.parseBodyReviewResponse(current, identity.id));
  for (const key of ['source', 'reasoning', 'guidedTours']) assert.deepEqual(current[key], prior[key]);
  assert.deepEqual(current.topics.find(topic => topic.tab === 'ultrasound'), {tab: 'ultrasound', ...original});
  for (const edit of [
    value => {value.topics.find(topic => topic.tab === 'ultrasound').body += ' foreign';},
    value => {value.topics.find(topic => topic.tab === 'ultrasound').readiness = 'approved';},
    value => {value.topics.find(topic => topic.tab === 'ultrasound').citations = ['https://foreign.example'];},
    value => {value.source.structure.sources = [];},
    value => {value.topics = value.topics.filter(topic => topic.tab !== 'ultrasound');},
  ]) {
    const foreign = structuredClone(current);
    edit(foreign);
    assert.equal(await now.parseBodyReviewResponse(foreign, identity.id), null);
    malformed++;
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
    const response = await now.postBodyDecision(new Request('https://atlas.test/api/body-decisions', {method: 'POST', headers: {origin: 'https://atlas.test', 'content-type': 'application/json', 'oai-authenticated-user-id': 'SYNTHETIC_SHOULDER_GIRDLE_US'}, body: JSON.stringify({...packet, ...delta})}), {prepare() {storageCalls++; throw Error('Stale decision reached storage');}});
    assert.equal(response.status, 409);
    stale++;
  }
}
assert.equal(identityRefusals, 416);
assert.equal(malformed, 50);
assert.equal(stale, 30);
assert.equal(storageCalls, 0);
assert.equal(now.shoulderGirdleArterialUltrasoundLesson({id: 'foreign'}, 'ultrasound'), undefined);
const canonical = value => Array.isArray(value) ? `[${value.map(canonical).join(',')}]`
  : value && typeof value === 'object' ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`
  : JSON.stringify(value);
const reviewHash = value => hash(canonical(JSON.parse(JSON.stringify(value))));
let quizWorksheets = 0, coreWorksheets = 0, respiratoryWorksheets = 0;
for (const structure of catalog.structures) {
  const prior = await before.bodyReviewMaterial(structure.id), current = await now.bodyReviewMaterial(structure.id);
  for (const key of ['source', 'reasoning', 'guidedTours']) assert.deepEqual(current[key], prior[key]);
  assert.equal(current.approval, false);
  if (entries.has(structure.id)) {
    assert.notEqual(current.fingerprints.teaching, prior.fingerprints.teaching);
    worksheets++;
  } else if (quizEntries.has(structure.id)) {
    const quizEntry = quizEntries.get(structure.id), recorded = quizChanges.get(structure.id);
    assert(recorded); assert.equal(recorded.tab, 'quiz');
    assert.deepEqual(structure, quizEntry.identity);
    const currentLesson = now.bodyLesson(structure, 'quiz'), priorLesson = before.bodyLesson(structure, 'quiz');
    assert.equal(hash(currentLesson), recorded.currentHash);
    assert.equal(hash(priorLesson), recorded.previousHash);
    assert.deepEqual(priorLesson, quizEntry.previous.quiz);
    assert.deepEqual(current.topics.find(topic => topic.tab === 'quiz'), {tab: 'quiz', ...currentLesson});
    const restored = structuredClone(current.topics);
    const index = restored.findIndex(topic => topic.tab === 'quiz');
    assert(index >= 0);
    restored[index] = {tab: 'quiz', ...structuredClone(priorLesson)};
    assert.deepEqual(restored, prior.topics);
    assert.notEqual(current.fingerprints.teaching, prior.fingerprints.teaching);
    quizWorksheets++;
  } else if (coreEntries.has(structure.id)) {
    const coreEntry = coreEntries.get(structure.id);
    assert.deepEqual(structure, coreEntry.identity);
    assert(await now.parseBodyReviewResponse(current, structure.id));
    const restoredTopics = structuredClone(current.topics);
    for (const tab of ['anatomy', 'function']) {
      const recorded = coreChanges.get(`${structure.id}|${tab}`), currentLesson = now.bodyLesson(structure, tab);
      assert(recorded); assert.equal(recorded.fmaId, structure.fmaId);
      assert.equal(hash(currentLesson), recorded.currentHash);
      assert.equal(hash(coreEntry.previous[tab]), recorded.previousHash);
      assert.deepEqual(current.topics.find(topic => topic.tab === tab), {tab, ...currentLesson});
      const index = restoredTopics.findIndex(topic => topic.tab === tab);
      assert(index >= 0);
      restoredTopics[index] = {tab, ...structuredClone(coreEntry.previous[tab])};
    }
    assert.deepEqual(restoredTopics, prior.topics);
    assert.notEqual(current.fingerprints.teaching, prior.fingerprints.teaching);
    const scope = {schema: current.schema, kind: current.kind, structureId: structure.id};
    const oldTeachingHash = reviewHash({scope: {...scope, schema: 'vm-body-review-worksheet-2'}, topics: restoredTopics, reasoning: current.reasoning, ...(current.guidedTours.length ? {guidedTours: current.guidedTours} : {})});
    assert.equal(oldTeachingHash, prior.fingerprints.teaching);
    const oldFingerprints = {...current.fingerprints, teaching: oldTeachingHash};
    const oldMaterialHash = reviewHash({scope, fingerprints: oldFingerprints});
    assert.equal(oldMaterialHash, prior.materialHash);
    assert.deepEqual({...current, topics: restoredTopics, fingerprints: oldFingerprints, materialHash: oldMaterialHash}, prior);
    coreWorksheets++;
  // Reconstruct only the eight source-pinned respiratory placements in five later worksheets.
  } else if (respiratoryEntries.has(structure.id)) {
    const respiratoryEntry = respiratoryEntries.get(structure.id);
    assert.deepEqual(structure, respiratoryEntry.identity);
    assert(await now.parseBodyReviewResponse(current, structure.id));
    const restoredTopics = structuredClone(current.topics);
    for (const tab of Object.keys(respiratoryEntry.previous)) {
      const recorded = respiratoryChanges.get(`${structure.id}|${tab}`);
      const currentLesson = now.bodyLesson(structure, tab), priorLesson = before.bodyLesson(structure, tab);
      assert(recorded); assert.equal(recorded.fmaId, structure.fmaId);
      assert.deepEqual(priorLesson, respiratoryEntry.previous[tab]);
      assert.equal(hash(priorLesson), recorded.previousHash);
      assert.equal(hash(currentLesson), recorded.currentHash);
      assert.deepEqual(currentLesson, now.respiratoryCoreDepthLesson(respiratoryEntry.identity, tab));
      assert.deepEqual(current.topics.find(topic => topic.tab === tab), {tab, ...currentLesson});
      const index = restoredTopics.findIndex(topic => topic.tab === tab);
      assert(index >= 0);
      restoredTopics[index] = {tab, ...structuredClone(priorLesson)};
    }
    assert.deepEqual(restoredTopics, prior.topics);
    assert.notEqual(current.fingerprints.teaching, prior.fingerprints.teaching);
    const scope = {schema: current.schema, kind: current.kind, structureId: structure.id};
    const oldTeachingHash = reviewHash({scope: {...scope, schema: 'vm-body-review-worksheet-2'}, topics: restoredTopics, reasoning: current.reasoning, ...(current.guidedTours.length ? {guidedTours: current.guidedTours} : {})});
    assert.equal(oldTeachingHash, prior.fingerprints.teaching);
    const oldFingerprints = {...current.fingerprints, teaching: oldTeachingHash};
    const oldMaterialHash = reviewHash({scope, fingerprints: oldFingerprints});
    assert.equal(oldMaterialHash, prior.materialHash);
    assert.deepEqual({...current, topics: restoredTopics, fingerprints: oldFingerprints, materialHash: oldMaterialHash}, prior);
    respiratoryWorksheets++;
  // Frozen unchanged-material expectations resume here.
  } else {
    assert.deepEqual(current.topics, prior.topics);
    assert.equal(current.fingerprints.teaching, prior.fingerprints.teaching);
  }
}
assert.equal(worksheets, 10);
assert.equal(quizWorksheets, 8);
assert.equal(coreWorksheets, 8);
assert.equal(respiratoryWorksheets, 5);
for (const bundle of catalog.bundles) {
  const path = `public/atlas-runtime/head-neck${bundle.url.split('?')[0]}`, bytes = delivered(path);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(hash(bytes), bundle.sha256);
  assert.deepEqual(bytes, old(path));
}
for (const path of ['package-lock.json', 'atlas-review/lib/imaging-sync.ts', 'atlas-review/lib/independent-study-links.ts'])
  assert.equal(delivered(path).toString().replaceAll('\r\n', '\n'), old(path).toString().replaceAll('\r\n', '\n'), path);
// Shared adapter lifecycle can advance independently of this frozen teaching epoch.
// Require the exact current saved source, rather than silently dropping its gate.
const deliveredAdapter = execFileSync('git', ['show', `${deliveryRevision}:lib/didanix-atlas-adapter.ts`], {...gitOptions, cwd: atlasSource});
assert.equal(delivered('atlas-review/lib/didanix-atlas-adapter.ts').toString().replaceAll('\r\n', '\n'), deliveredAdapter.toString());
const review = historicalReview;
assert.equal(review.revision, deliveryRevision);
for (const file of review.files) assert.equal(hash(delivered(`atlas-review/${file.path}`)), file.importedSha256, file.path);
const addedPaths = ['lib/shoulder-girdle-arterial-ultrasound.ts', 'content/shoulder-girdle-arterial-ultrasound.ts', 'content/shoulder-girdle-arterial-ultrasound-pins.json'];
for (const path of addedPaths) {
  const file = review.files.find(item => item.path === path);
  assert(file, path);
  assert.equal(file.sourceSha256, hash(sourceAt(path)));
}
assert(!review.files.some(file => file.path === 'content/shoulder-girdle-arterial-ultrasound.transition.json'));
for (const name of ['head-neck', 'shoulder', 'female-pelvis', 'lower-limb']) {
  const base = `public/atlas-runtime/${name}/`, manifest = JSON.parse(delivered(`${base}manifest.json`));
  assert.equal(manifest.sourceCommit, deliveryRevision);
  assert.equal(manifest.patientDataIncluded, false);
  assert.equal(manifest.clinicalApproved, false);
  for (const file of manifest.files) {
    const bytes = delivered(base + file.path);
    assert.equal(bytes.length, file.bytes);
    assert.equal(hash(bytes), file.sha256);
  }
  const previous = JSON.parse(old(`${base}manifest.json`));
  assert.deepEqual(manifest.files.filter(file => file.path.startsWith('models/')), previous.files.filter(file => file.path.startsWith('models/')));
  const inputs = JSON.parse(delivered(`${base}source-inputs.json`));
  for (const path of addedPaths) {
    const actual = inputs.find(file => file.path === path), imported = review.files.find(file => file.path === path);
    assert.equal(Boolean(actual), name === 'head-neck' || name === 'shoulder', `${name}:${path}`);
    if (actual) assert.equal(actual.sha256, imported.sourceSha256);
  }
  assert(!inputs.some(file => file.path === 'content/shoulder-girdle-arterial-ultrasound.transition.json'));
  if (name === 'head-neck') {
    const emitted = emittedTeaching(base, manifest.files, false, delivered);
    for (const entry of pins.entries) {
      const lesson = now.shoulderGirdleArterialUltrasoundLesson(entry.identity, 'ultrasound');
      for (const value of [entry.identity.id, lesson.body, ...lesson.bullets, lesson.note, ...lesson.citations])
        assert(emitted.includes(value) || emitted.includes(JSON.stringify(value).slice(1, -1)), `learner:${entry.identity.id}:${value.slice(0, 40)}`);
    }
    const teachingFile = manifest.files.find(file => /^assets\/body-content-[^/]+\.js$/.test(file.path));
    assert(teachingFile);
    // The emitted lesson imports the UI entry. Exclude its one pinned mount
    // statement in memory; preserve every lesson and dependency function.
    const teachingBytes = delivered(base + teachingFile.path);
    assert.equal(hash(teachingBytes), teachingFile.sha256);
    const indexImport = teachingBytes.toString().match(/from"\.\/(index-[A-Za-z0-9_-]+\.js)"/g) || [];
    assert.equal(indexImport.length, 1, 'One emitted UI-entry dependency');
    const indexName = /index-[A-Za-z0-9_-]+\.js/.exec(indexImport[0])[0];
    const indexPath = `assets/${indexName}`;
    const indexFile = manifest.files.find(file => file.path === indexPath);
    assert(indexFile, indexPath);
    const indexBytes = delivered(base + indexPath);
    assert.equal(hash(indexBytes), indexFile.sha256, 'Exact emitted UI entry');
    const indexSource = indexBytes.toString('utf8');
    const statements = parse(indexSource, {ecmaVersion: 'latest', sourceType: 'module'}).body.filter(node => {
      if (node.type !== 'ExpressionStatement') return false;
      const render = node.expression, root = render.callee?.object, selector = root?.arguments?.[0];
      const factory = root?.callee?.expressions?.at(-1);
      return render.type === 'CallExpression' && render.callee?.type === 'MemberExpression' && render.callee.property?.name === 'render'
        && root?.type === 'CallExpression' && factory?.type === 'MemberExpression' && factory.property?.name === 'createRoot'
        && selector?.type === 'CallExpression' && selector.callee?.object?.name === 'document'
        && selector.callee?.property?.name === 'getElementById' && selector.arguments?.length === 1
        && selector.arguments[0]?.type === 'TemplateLiteral' && selector.arguments[0].expressions.length === 0
        && selector.arguments[0].quasis[0].value.cooked === 'root';
    });
    assert.equal(statements.length, 1, 'Exactly one top-level root mount');
    const mount = statements[0];
    const startByte = Buffer.byteLength(indexSource.slice(0, mount.start));
    const endByte = Buffer.byteLength(indexSource.slice(0, mount.end));
    assert.equal(hash(indexBytes.subarray(startByte, endByte)), '3f85eccd2ebce4e57d2a94484816504fefe8c114c1eeae365830a1077e872744', 'Pinned complete root-mount statement');
    const isolatedIndex = indexSource.slice(0, mount.start) + ';' + indexSource.slice(mount.end);
    assert.equal(isolatedIndex.slice(0, mount.start), indexSource.slice(0, mount.start));
    assert.equal(isolatedIndex.slice(mount.start + 1), indexSource.slice(mount.end));
    const actualBundle = await build({entryPoints: [resolve(base + teachingFile.path)], bundle: true, write: false, platform: 'node', format: 'cjs', plugins: [{name: 'exact-historical-emitted-runtime', setup(plugin) {
      plugin.onResolve({filter: /.*/}, args => {
        if (args.kind === 'entry-point') return {path: args.path, namespace: 'historical-emitted'};
        if (args.namespace === 'historical-emitted' && args.path.startsWith('.')) return {path: resolve(dirname(args.importer), args.path), namespace: 'historical-emitted'};
      });
      plugin.onLoad({filter: /.*/, namespace: 'historical-emitted'}, args => {
        const path = relative(process.cwd(), args.path).replaceAll('\\', '/');
        assert(path.startsWith(base), `Historical emitted import outside ${base}: ${path}`);
        return {contents: path === base + indexPath ? isolatedIndex : delivered(path), loader: 'js', resolveDir: dirname(args.path)};
      });
    }}]});
    const runtimeModule = {exports: {}};
    const documentProbe = {createElement(tag) {
      assert.equal(tag, 'link', 'Unexpected DOM creation while evaluating emitted teaching');
      return {relList: {supports: relation => relation === 'modulepreload'}};
    }};
    runInNewContext(actualBundle.outputFiles[0].text, {
      module: runtimeModule, exports: runtimeModule.exports, document: documentProbe,
      window: {location: {search: ''}},
      Buffer, process, console, URL, URLSearchParams, Request, Response,
    }, {timeout: 60000, filename: teachingFile.path});
    const runtime = runtimeModule.exports;
    assert.equal(typeof runtime.bodyLesson, 'function');
    for (const structure of catalog.structures) for (const tab of now.contentTabs)
      assert.deepEqual(structuredClone(runtime.bodyLesson(structure, tab)), now.bodyLesson(structure, tab), `emitted:${structure.id}:${tab}`);
  }
}
const reviewBase = 'public/atlas-review-viewer/', reviewManifest = JSON.parse(delivered(`${reviewBase}manifest.json`));
assert.equal(reviewManifest.sourceCommit, deliveryRevision);
assert.equal(reviewManifest.personalRecordsIncluded, false);
assert.equal(reviewManifest.mode, 'production');
assert.equal(reviewManifest.websiteIntegrationSha256, review.websiteIntegrationSha256);
for (const file of reviewManifest.files) assert.equal(hash(delivered(reviewBase + file.path)), file.sha256, `review:${file.path}`);
const emittedReview = emittedTeaching(reviewBase, reviewManifest.files, true, delivered);
for (const entry of pins.entries) {
  const lesson = now.shoulderGirdleArterialUltrasoundLesson(entry.identity, 'ultrasound');
  for (const value of [entry.identity.id, lesson.body, ...lesson.bullets, lesson.note, ...lesson.citations])
    assert(emittedReview.includes(value) || emittedReview.includes(JSON.stringify(value).slice(1, -1)), `review:${entry.identity.id}:${value.slice(0, 40)}`);
}
const currentPin = validateCurrentAtlasDelivery();
assert.equal(currentPin.source, CURRENT_ATLAS_REVISION);
assert.equal(currentPin.reviewIntegration, hash(JSON.parse(readFileSync('atlas-review/integration-inputs.json')).inputs));
const currentAtlas = currentAtlasDeliveryRoot();
const currentReview = JSON.parse(readFileSync('atlas-review/manifest.json'));
for (const path of addedPaths) {
  const file = currentReview.files.find(item => item.path === path);
  assert(file, `current:${path}`);
  const imported = readFileSync(`atlas-review/${path}`);
  assert.equal(hash(imported), file.importedSha256, `current-imported:${path}`);
  assert.equal(hash(execFileSync('git', ['show', `${currentPin.source}:${path}`], {...gitOptions, cwd: currentAtlas})), file.sourceSha256, `current-source:${path}`);
}
const currentApi = await build({stdin: {contents: "export {bodyLesson} from './atlas-review/app/body-content';export {shoulderGirdleArterialUltrasoundLesson} from './atlas-review/lib/shoulder-girdle-arterial-ultrasound';", resolveDir: process.cwd(), loader: 'ts'}, bundle: true, write: false, platform: 'node', format: 'esm'});
const latest = await import('data:text/javascript;base64,' + Buffer.from(currentApi.outputFiles[0].text).toString('base64'));
for (const {identity} of pins.entries) assert.deepEqual(latest.bodyLesson(identity, 'ultrasound'), latest.shoulderGirdleArterialUltrasoundLesson(identity, 'ultrasound'), `current-teaching:${identity.id}`);
console.log(JSON.stringify({websiteBaseline, deliveryWebsite, sourceRevision, currentSource: currentPin.source, changed, preserved, identityRefusals, malformedPacketsRefused: malformed, staleRefusalsBeforeStorage: stale, storageCalls, changedTeachingWorksheets: worksheets, verifiedRuntimes: 4, emittedTopicsCompared: 9936, clinicalApproval: false, browserAcceptance: false}));
