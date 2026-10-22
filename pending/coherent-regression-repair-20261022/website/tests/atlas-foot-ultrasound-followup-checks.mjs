import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {build} from 'esbuild';
import {atlasExactGitApi} from './atlas-exact-git-api.mjs';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
import {checkedAtlasHistoryRepo} from './atlas-source-repo.mjs';
import {deliveryRevision,verifyCurrentFootDelivery} from './atlas-foot-ultrasound-followup-current.mjs';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const websiteBaseline = 'f71eaf068279f36c7b63c0ceb6435651a4c58ef6';
const followupWebsiteEpoch = 'a67c16de99f7a4bd8e55d66c34d432e0946ba634';
const sourceRevision = '537838f028f15e62a6642e7eb360cbaeea31fa20';
const sourceBaseline = 'ae787ef86b6cf7e662ddff5af8a1e8ff19ae97bb';
const atlasSource = checkedAtlasHistoryRepo(sourceRevision);
const hash = value => createHash('sha256').update(typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value)).digest('hex');
const gitOptions = {maxBuffer: 32e6, windowsHide: true, env: {...process.env, GIT_NO_REPLACE_OBJECTS: '1'}};
const old = path => execFileSync('git', ['show', `${websiteBaseline}:${path}`], gitOptions);
const admitted = path => execFileSync('git', ['show', `${followupWebsiteEpoch}:${path}`], gitOptions);
const sourceAt = path => execFileSync('git', ['show', `${sourceRevision}:${path}`], {...gitOptions, cwd: atlasSource});
const common = "export {bodyLesson,bodyContent} from './atlas-review/app/body-content';export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';export {contentTabs} from './atlas-review/lib/content-types';export {structures} from './atlas-review/app/anatomy-data';export {dissectionProfiles} from './atlas-review/app/dissection-data';export {regionalTours} from './atlas-review/lib/regional-tours';export {reasoningConcepts} from './atlas-review/lib/reasoning-questions';export * from './atlas-review/lib/body-review-material';export * from './atlas-review/lib/body-review-context';export * from './atlas-review/lib/body-review-response';export * from './atlas-review/lib/body-review-api';export * from './atlas-review/lib/body-review-decisions';";
const before = await atlasExactGitApi(websiteBaseline, common);
// Re-run the completed admission against one whole immutable website epoch.
// Current delivery is verified separately below, never as a hybrid old API.
const now = await atlasExactGitApi(followupWebsiteEpoch, common + "export * from './atlas-review/lib/foot-ultrasound-followup';export * from './atlas-review/content/foot-ultrasound-followup';");
const pins = JSON.parse(sourceAt('content/foot-ultrasound-followup-pins.json'));
const transition = JSON.parse(sourceAt('content/foot-ultrasound-followup.transition.json'));
assert.equal(hash(pins), '87df5b06e49b9f5fa28dcaf226fd582fa5e9f7eb8b80a40301190906a811a48d');
assert.equal(hash(transition), 'f0bf6ae655f55e959dd0a4ff38269232dccc7a6c32d0cbbc2369f9cdd88fe193');
assert.equal(pins.baseline, sourceBaseline);
assert.equal(transition.baseline, sourceBaseline);
assert.equal(transition.sourcePinsHash, hash(pins));
assert.deepEqual(admitted('atlas-review/content/foot-ultrasound-followup-pins.json'), sourceAt('content/foot-ultrasound-followup-pins.json'));
assert.equal(pins.entries.length, 12);
assert.equal(transition.entries.length, 12);
const entries = new Map(pins.entries.map(entry => [entry.identity.id, entry]));
const transitions = new Map(transition.entries.map(entry => [`${entry.id}:${entry.tab}`, entry]));
assert.equal(entries.size, 12);
assert.equal(transitions.size, 12);
assert.deepEqual(pins.entries.reduce((counts, entry) => (counts[entry.family] = (counts[entry.family] || 0) + 1, counts), {}), {
  halluxNote: 4, cuboid: 2, intermediateCuneiform: 2, lateralCuneiform: 2, medialCuneiform: 2,
});

const sourceCatalog = JSON.parse(admitted('atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
const catalog = now.bodyDisplayCatalog(sourceCatalog);
assert.equal(catalog.structures.length, 1104);
assert.equal(catalog.bundles.length, 109);
assert.deepEqual(catalog, before.bodyDisplayCatalog(JSON.parse(old('atlas-review/public/models/bodyparts3d/full-body/catalog.json'))));
for (const key of ['structures', 'dissectionProfiles', 'regionalTours', 'reasoningConcepts', 'contentTabs']) assert.deepEqual(now[key], before[key], key);
assert.equal(now.contentTabs.length, 9);
assert.equal(pins.sourceVersion, sourceCatalog.sourceVersion);
assert.equal(pins.license, sourceCatalog.license);
assert.deepEqual(pins.coordinateSystem, sourceCatalog.coordinateSystem);
assert.deepEqual(pins.bundles, sourceCatalog.bundles.filter(bundle => bundle.id === 'foot-skeleton'));
const snapshot = api => ({catalog, body: catalog.structures.map(structure => ({id: structure.id, topics: Object.fromEntries(api.contentTabs.map(tab => [tab, api.bodyLesson(structure, tab)]))})), shoulder: api.structures, recipes: api.dissectionProfiles});
assert.equal(hash(snapshot(before)), pins.beforeAllTeachingSnapshotHash);
const recovered = snapshot(now);
let changed = 0, preserved = 0, identityRefusals = 0, malformed = 0, stale = 0, storageCalls = 0, worksheets = 0;
for (const row of recovered.body) {
  const structure = catalog.structures.find(item => item.id === row.id), entry = entries.get(row.id);
  for (const tab of now.contentTabs) {
    const prior = before.bodyLesson(structure, tab);
    if (entry && tab === 'ultrasound') {
      const lesson = now.bodyLesson(structure, tab), recorded = transitions.get(`${row.id}:${tab}`);
      assert.deepEqual(prior, entry.previous.ultrasound);
      assert.deepEqual(lesson, now.footUltrasoundFollowupLesson(entry.identity, tab));
      assert(recorded);
      assert.equal(recorded.fmaId, structure.fmaId);
      assert.equal(hash(lesson), recorded.draftHash);
      assert.equal(lesson.readiness, 'draft');
      const {readiness, ...display} = lesson;
      assert.deepEqual(now.bodyContent(structure, tab), display);
      if (entry.family === 'halluxNote') {
        assert.equal(prior.readiness, 'draft');
        const {note: oldNote, ...oldBody} = prior, {note: newNote, ...newBody} = lesson;
        assert.deepEqual(newBody, oldBody, `${row.id}:hallux note only`);
        assert.notEqual(newNote, oldNote);
        assert.match(newNote, /hallux.*(?:IP|interphalangeal)|(?:IP|interphalangeal).*hallux/i);
        assert.match(newNote, /no middle phalanx|without a middle phalanx/i);
        assert.doesNotMatch(newNote, /three.phalangeal|biphalangeal|fifth.toe/i);
      } else assert.equal(prior.readiness, 'pending');
      row.topics[tab] = prior;
      changed++;
    } else {
      assert.deepEqual(row.topics[tab], prior, `${row.id}:${tab}:unchanged`);
      preserved++;
    }
  }
}
assert.equal(changed, 12);
assert.equal(preserved, 9924);
assert.equal(hash(recovered), pins.beforeAllTeachingSnapshotHash);
const footBones = catalog.structures.filter(item => item.region === 'foot' && item.bundle === 'foot-skeleton' && item.system === 'skeleton' && item.category === 'bone');
assert.equal(footBones.length, 54);
for (const structure of footBones) assert.equal(now.bodyLesson(structure, 'ultrasound').readiness, 'draft');
const sesamoids = footBones.filter(item => ['FMA45097', 'FMA45098'].includes(item.fmaId));
assert.equal(sesamoids.length, 2);
for (const structure of sesamoids) {
  assert.equal(structure.sources.length, 2);
  assert.deepEqual(now.bodyLesson(structure, 'ultrasound'), before.bodyLesson(structure, 'ultrasound'));
  assert.equal(now.footUltrasoundFollowupLesson(structure, 'ultrasound'), undefined);
}
const pathsWhere = (value, predicate, path = []) => [
  ...(predicate(value) ? [path] : []),
  ...(value && typeof value === 'object' ? Object.entries(value).flatMap(([key, part]) => pathsWhere(part, predicate, [...path, key])) : []),
];
const at = (value, path) => path.reduce((part, key) => part[key], value);
for (const {identity, previous, family} of pins.entries) {
  assert.deepEqual(catalog.structures.find(structure => structure.id === identity.id), identity);
  assert.deepEqual(Object.keys(previous), ['ultrasound']);
  assert.equal(identity.sources.length, 1);
  assert.match(identity.sources[0].file, /^FJ\d+[A-Z]?$/);
  assert.match(identity.fmaId, /^FMA\d+$/);
  const lesson = now.footUltrasoundFollowupLesson(identity, 'ultrasound');
  assert.equal(lesson.readiness, 'draft');
  assert.match(lesson.title, /evidence & limits.*draft/i);
  assert.match(lesson.note, /revision-bound radiologist/i);
  assert.match(lesson.note, /independent/i);
  if (family !== 'halluxNote') {
    assert.equal(lesson.body, now.footUltrasoundFollowupTeaching[family].ultrasound.body);
    assert.deepEqual(lesson.bullets, [...now.footUltrasoundFollowupTeaching[family].ultrasound.bullets]);
    assert.deepEqual(lesson.citations, now.footUltrasoundFollowupTeaching[family].ultrasound.citations.map(key => now.footUltrasoundFollowupReferences[key].url));
  }
  for (const citation of lesson.citations) assert.equal(new URL(citation).protocol, 'https:');
  const original = structuredClone(lesson);
  lesson.bullets.push('foreign');
  lesson.citations.push('https://foreign.example');
  assert.deepEqual(now.footUltrasoundFollowupLesson(identity, 'ultrasound'), original);
  for (const path of pathsWhere(identity, value => value === null || typeof value !== 'object')) {
    const foreign = structuredClone(identity), parent = at(foreign, path.slice(0, -1)), key = path.at(-1), value = parent[key];
    parent[key] = typeof value === 'string' ? `${value}-foreign` : typeof value === 'number' ? value + 0.01 : value === null ? 'foreign' : !value;
    assert.equal(now.footUltrasoundFollowupLesson(foreign, 'ultrasound'), undefined, `${identity.id}:${path.join('.')}`);
    identityRefusals++;
  }
  for (const path of pathsWhere(identity, Array.isArray)) {
    const foreign = structuredClone(identity);
    at(foreign, path).push('foreign');
    assert.equal(now.footUltrasoundFollowupLesson(foreign, 'ultrasound'), undefined, `${identity.id}:${path.join('.')}`);
    identityRefusals++;
  }
  assert.equal(now.footUltrasoundFollowupLesson({...structuredClone(identity), unexpected: true}, 'ultrasound'), undefined);
  identityRefusals++;
  for (const tab of now.contentTabs.filter(tab => tab !== 'ultrasound')) assert.equal(now.footUltrasoundFollowupLesson(identity, tab), undefined);
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
    const response = await now.postBodyDecision(new Request('https://atlas.test/api/body-decisions', {method: 'POST', headers: {origin: 'https://atlas.test', 'content-type': 'application/json', 'oai-authenticated-user-id': 'SYNTHETIC_FOOT_US_FOLLOWUP'}, body: JSON.stringify({...packet, ...delta})}), {prepare() {storageCalls++; throw Error('Stale decision reached storage');}});
    assert.equal(response.status, 409);
    stale++;
  }
}
assert.equal(identityRefusals, 480);
assert.equal(malformed, 60);
assert.equal(stale, 36);
assert.equal(storageCalls, 0);
assert.equal(now.footUltrasoundFollowupLesson({id: 'foreign'}, 'ultrasound'), undefined);
for (const structure of catalog.structures.filter(item => item.region === 'foot' && !entries.has(item.id)))
  assert.equal(now.footUltrasoundFollowupLesson(structure, 'ultrasound'), undefined);
for (const structure of catalog.structures) {
  const prior = await before.bodyReviewMaterial(structure.id), current = await now.bodyReviewMaterial(structure.id);
  for (const key of ['source', 'reasoning', 'guidedTours']) assert.deepEqual(current[key], prior[key]);
  assert.equal(current.approval, false);
  if (entries.has(structure.id)) {
    assert.notEqual(current.fingerprints.teaching, prior.fingerprints.teaching);
    worksheets++;
  } else {
    assert.deepEqual(current.topics, prior.topics);
    assert.equal(current.fingerprints.teaching, prior.fingerprints.teaching);
  }
}
assert.equal(worksheets, 12);
for (const ref of Object.values(now.footUltrasoundFollowupReferences)) assert.match(ref.licence, /^CC BY(?: 4\.0)?$/);
for (const bundle of catalog.bundles) {
  const path = `public/atlas-runtime/head-neck${bundle.url.split('?')[0]}`, bytes = admitted(path);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(hash(bytes), bundle.sha256);
  assert.deepEqual(bytes, old(path));
}
for (const path of ['package-lock.json', 'atlas-review/app/body-explorer.tsx', 'atlas-review/lib/imaging-sync.ts', 'atlas-review/lib/didanix-atlas-adapter.ts', 'atlas-review/lib/independent-study-links.ts'])
  assert.equal(admitted(path).toString().replaceAll('\r\n', '\n'), old(path).toString().replaceAll('\r\n', '\n'), path);
const review = JSON.parse(admitted('atlas-review/manifest.json'));
assert.equal(review.revision, sourceRevision);
for (const file of review.files) assert.equal(hash(admitted(`atlas-review/${file.path}`)), file.importedSha256, file.path);
for (const path of ['lib/foot-ultrasound-followup.ts', 'content/foot-ultrasound-followup.ts', 'content/foot-ultrasound-followup-pins.json']) {
  const file = review.files.find(item => item.path === path);
  assert(file, path);
  assert.equal(file.sourceSha256, hash(sourceAt(path)));
}
assert(!review.files.some(file => file.path === 'content/foot-ultrasound-followup.transition.json'));
for (const name of ['head-neck', 'shoulder', 'female-pelvis', 'lower-limb']) {
  const base = `public/atlas-runtime/${name}/`, manifest = JSON.parse(admitted(`${base}manifest.json`));
  assert.equal(manifest.sourceCommit, sourceRevision);
  assert.equal(manifest.patientDataIncluded, false);
  assert.equal(manifest.clinicalApproved, false);
  for (const file of manifest.files) {
    const bytes = admitted(base + file.path);
    assert.equal(bytes.length, file.bytes);
    assert.equal(hash(bytes), file.sha256);
  }
  const previous = JSON.parse(old(`${base}manifest.json`));
  assert.deepEqual(manifest.files.filter(file => file.path.startsWith('models/')), previous.files.filter(file => file.path.startsWith('models/')));
  const inputs = JSON.parse(admitted(`${base}source-inputs.json`));
  for (const path of ['content/foot-ultrasound-followup-pins.json', 'content/foot-ultrasound-followup.ts', 'lib/foot-ultrasound-followup.ts']) {
    const actual = inputs.find(file => file.path === path), imported = review.files.find(file => file.path === path);
    assert.equal(Boolean(actual), name === 'head-neck' || name === 'shoulder', `${name}:${path}`);
    if (actual) assert.equal(actual.sha256, imported.sourceSha256);
  }
  assert(!inputs.some(file => file.path === 'content/foot-ultrasound-followup.transition.json'));
  if (name === 'head-neck') {
    const emitted = emittedTeaching(base, manifest.files, false, admitted);
    for (const entry of pins.entries) {
      const lesson = now.footUltrasoundFollowupLesson(entry.identity, 'ultrasound');
      for (const value of [entry.identity.id, lesson.body, ...lesson.bullets, lesson.note, ...lesson.citations])
        assert(emitted.includes(value) || emitted.includes(JSON.stringify(value).slice(1, -1)), `learner:${entry.identity.id}:${value.slice(0, 40)}`);
    }
  }
}
const reviewBase = 'public/atlas-review-viewer/', reviewManifest = JSON.parse(admitted(`${reviewBase}manifest.json`));
assert.equal(reviewManifest.sourceCommit, sourceRevision);
assert.equal(reviewManifest.personalRecordsIncluded, false);
assert.equal(reviewManifest.mode, 'production');
assert.equal(reviewManifest.websiteIntegrationSha256, review.websiteIntegrationSha256);
for (const file of reviewManifest.files) assert.equal(hash(admitted(reviewBase + file.path)), file.sha256, `review:${file.path}`);
const emittedReview = emittedTeaching(reviewBase, reviewManifest.files, true, admitted);
for (const entry of pins.entries) {
  const lesson = now.footUltrasoundFollowupLesson(entry.identity, 'ultrasound');
  for (const value of [entry.identity.id, lesson.body, ...lesson.bullets, lesson.note, ...lesson.citations])
    assert(emittedReview.includes(value) || emittedReview.includes(JSON.stringify(value).slice(1, -1)), `review:${entry.identity.id}:${value.slice(0, 40)}`);
}
// Preserve every immutable admission assertion above. Current delivery is a
// separate committed-source/import proof, not a relabelled historical epoch.
verifyCurrentFootDelivery();
const compiled = await build({stdin: {contents: common + "export * from './atlas-review/lib/foot-ultrasound-followup';", resolveDir: process.cwd(), loader: 'ts'}, bundle: true, write: false, platform: 'node', format: 'esm'});
const delivery = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
assert.deepEqual(readFileSync('atlas-review/content/foot-ultrasound-followup-pins.json'), admitted('atlas-review/content/foot-ultrasound-followup-pins.json'));
assert.equal(JSON.parse(readFileSync('atlas-review/manifest.json')).revision, deliveryRevision);
for (const {identity} of pins.entries)
  assert.deepEqual(delivery.bodyLesson(identity, 'ultrasound'), now.bodyLesson(identity, 'ultrasound'), `${identity.id}: current foot lesson preserved`);
const currentPin = validateCurrentAtlasDelivery();
for (const name of ['head-neck', 'shoulder', 'female-pelvis', 'lower-limb', 'review']) {
  const base = name === 'review' ? reviewBase : `public/atlas-runtime/${name}/`;
  const manifest = JSON.parse(readFileSync(base + 'manifest.json'));
  assert.equal(manifest.sourceCommit, name === 'review' ? deliveryRevision : currentPin.runtimeSources[name]);
  if (name === 'review') assert.equal(manifest.personalRecordsIncluded, false);
  else { assert.equal(manifest.patientDataIncluded, false); assert.equal(manifest.clinicalApproved, false); }
  for (const file of manifest.files) assert.equal(hash(readFileSync(base + file.path)), file.sha256, `current:${name}:${file.path}`);
  if (name === 'head-neck' || name === 'review') {
    const emitted = emittedTeaching(base, manifest.files, name === 'review');
    for (const {identity} of pins.entries) {
      const lesson = delivery.bodyLesson(identity, 'ultrasound');
      for (const value of [identity.id, lesson.body, ...lesson.bullets, lesson.note, ...lesson.citations])
        assert(emitted.includes(value) || emitted.includes(JSON.stringify(value).slice(1, -1)), `current:${name}:${identity.id}:${value.slice(0, 40)}`);
    }
  }
}
console.log(JSON.stringify({websiteBaseline, followupWebsiteEpoch, sourceRevision, deliveryRevision, changed, preserved, identityRefusals, malformedPacketsRefused: malformed, staleRefusalsBeforeStorage: stale, storageCalls, changedTeachingWorksheets: worksheets, currentFootLessonsPreserved: 12, footSkeletonUltrasoundDrafts: 54, verifiedRuntimes: 4, clinicalApproval: false, browserAcceptance: false}));
