import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {build} from 'esbuild';
import {atlasExactGitApi} from './atlas-exact-git-api.mjs';
import {emittedTeaching} from './atlas-emitted-teaching.ts';

const websiteBaseline = 'fdf1a982c2064786f0de8cc01c5ec895f2227d38';
const sourceBaseline = 'a1cb14f05b3070b8553e85e3596f634b2bf36a5d';
const sourceRevision = 'ae787ef86b6cf7e662ddff5af8a1e8ff19ae97bb';
const toeWebsiteEpoch = 'f71eaf068279f36c7b63c0ceb6435651a4c58ef6';
const deliveryRevision = 'c5c99ba11e6533d306587e71f5fc2854d882fbd6';
const atlasSource = 'C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/outputs';
const hash = value => createHash('sha256').update(typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value)).digest('hex');
const old = path => execFileSync('git', ['show', `${websiteBaseline}:${path}`], {maxBuffer: 32e6, windowsHide: true, env: {...process.env, GIT_NO_REPLACE_OBJECTS: '1'}});
const admitted = path => execFileSync('git', ['show', `${toeWebsiteEpoch}:${path}`], {maxBuffer: 32e6, windowsHide: true, env: {...process.env, GIT_NO_REPLACE_OBJECTS: '1'}});
const sourceAt = path => execFileSync('git', ['show', `${sourceRevision}:${path}`], {cwd: atlasSource, maxBuffer: 32e6, windowsHide: true, env: {...process.env, GIT_NO_REPLACE_OBJECTS: '1'}});
const common = "export {bodyLesson,bodyContent} from './atlas-review/app/body-content';export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';export {contentTabs} from './atlas-review/lib/content-types';export {structures} from './atlas-review/app/anatomy-data';export {dissectionProfiles} from './atlas-review/app/dissection-data';export {regionalTours} from './atlas-review/lib/regional-tours';export {reasoningConcepts} from './atlas-review/lib/reasoning-questions';export * from './atlas-review/lib/body-review-material';export * from './atlas-review/lib/body-review-context';export * from './atlas-review/lib/body-review-response';export * from './atlas-review/lib/body-review-api';export * from './atlas-review/lib/body-review-decisions';";
const before = await atlasExactGitApi(websiteBaseline, common);
const now = await atlasExactGitApi(toeWebsiteEpoch, common + "export * from './atlas-review/lib/toe-bone-ultrasound';export * from './atlas-review/content/toe-bone-ultrasound';");
const pins = JSON.parse(admitted('atlas-review/content/toe-bone-ultrasound-pins.json'));
const transition = JSON.parse(sourceAt('content/toe-bone-ultrasound.transition.json'));
assert.equal(hash(pins), '3821c623cf0e31b608ca2ac69f2b124a150beb27312675822e50dee1771f6f5e');
assert.equal(hash(transition), '6907c1135c75364776c5bf18920de3b66d1f546b5bdc0a0e85aa253189fa449b');
assert.equal(pins.baseline, sourceBaseline);
assert.equal(transition.baseline, sourceBaseline);
assert.equal(transition.sourcePinsHash, hash(pins));
assert.deepEqual(admitted('atlas-review/content/toe-bone-ultrasound-pins.json'), sourceAt('content/toe-bone-ultrasound-pins.json'));
assert.equal(pins.entries.length, 28);
assert.equal(transition.entries.length, 28);
const entries = new Map(pins.entries.map(entry => [entry.identity.id, entry]));
const transitions = new Map(transition.entries.map(entry => [`${entry.id}:${entry.tab}`, entry]));
assert.equal(entries.size, 28);
assert.equal(transitions.size, 28);
assert.deepEqual(pins.entries.reduce((counts, entry) => (counts[entry.family] = (counts[entry.family] || 0) + 1, counts), {}), {
  halluxProximal: 2, lesserProximal: 8, middle: 8, halluxDistal: 2, lesserDistal: 8,
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
    const previous = before.bodyLesson(structure, tab);
    if (entry && tab === 'ultrasound') {
      assert.deepEqual(previous, entry.previous.ultrasound);
      assert.equal(previous.readiness, 'pending');
      const lesson = now.bodyLesson(structure, tab), recorded = transitions.get(`${row.id}:${tab}`);
      assert.deepEqual(lesson, now.toeBoneUltrasoundLesson(entry.identity, tab));
      assert.equal(lesson.readiness, 'draft');
      assert(recorded);
      assert.equal(recorded.fmaId, structure.fmaId);
      assert.equal(hash(lesson), recorded.draftHash);
      const {readiness, ...display} = lesson;
      assert.deepEqual(now.bodyContent(structure, tab), display);
      row.topics[tab] = previous;
      changed++;
    } else {
      assert.deepEqual(row.topics[tab], previous, `${row.id}:${tab}:unchanged`);
      preserved++;
    }
  }
}
assert.equal(changed, 28);
assert.equal(preserved, 9908);
assert.equal(hash(recovered), pins.beforeAllTeachingSnapshotHash);
const pathsWhere = (value, predicate, path = []) => [
  ...(predicate(value) ? [path] : []),
  ...(value && typeof value === 'object' ? Object.entries(value).flatMap(([key, part]) => pathsWhere(part, predicate, [...path, key])) : []),
];
const at = (value, path) => path.reduce((part, key) => part[key], value);
for (const {identity, previous, family} of pins.entries) {
  assert.deepEqual(catalog.structures.find(structure => structure.id === identity.id), identity);
  assert.deepEqual(Object.keys(previous), ['ultrasound']);
  assert.equal(identity.region, 'foot');
  assert.equal(identity.system, 'skeleton');
  assert.equal(identity.category, 'bone');
  assert.equal(identity.bundle, 'foot-skeleton');
  const lesson = now.toeBoneUltrasoundLesson(identity, 'ultrasound');
  assert.equal(lesson.readiness, 'draft');
  assert.match(lesson.title, /evidence & limits.*draft/i);
  assert.match(lesson.note, /revision-bound radiologist/i);
  assert.match(lesson.note, /biphalangeal variants/i);
  assert.match(lesson.note, /independent/i);
  assert.equal(lesson.body, now.toeBoneUltrasoundTeaching[family].ultrasound.body);
  assert.deepEqual(lesson.bullets, [...now.toeBoneUltrasoundTeaching[family].ultrasound.bullets]);
  assert.deepEqual(lesson.citations, now.toeBoneUltrasoundTeaching[family].ultrasound.citations.map(key => now.toeBoneUltrasoundReferences[key].url));
  for (const citation of lesson.citations) assert.equal(new URL(citation).protocol, 'https:');
  if (family.startsWith('hallux')) {
    assert.match(identity.name, /big toe/i);
    assert.match(lesson.body, /interphalangeal|\bIP\b/i);
    assert.doesNotMatch(lesson.body, /proximal interphalangeal joint|distal interphalangeal joint|\bPIP\b|\bDIP\b/i);
  } else {
    assert.doesNotMatch(identity.name, /big toe/i);
    assert.match(lesson.body, /interphalangeal/i);
    if (family === 'middle') assert.match(lesson.body, /proximal and distal interphalangeal/i);
  }
  const original = structuredClone(lesson);
  lesson.bullets.push('foreign');
  lesson.citations.push('https://foreign.example');
  assert.deepEqual(now.toeBoneUltrasoundLesson(identity, 'ultrasound'), original);
  for (const path of pathsWhere(identity, value => value === null || typeof value !== 'object')) {
    const foreign = structuredClone(identity), parent = at(foreign, path.slice(0, -1)), key = path.at(-1), value = parent[key];
    parent[key] = typeof value === 'string' ? `${value}-foreign` : typeof value === 'number' ? value + 0.01 : value === null ? 'foreign' : !value;
    assert.equal(now.toeBoneUltrasoundLesson(foreign, 'ultrasound'), undefined, `${identity.id}:${path.join('.')}`);
    identityRefusals++;
  }
  for (const path of pathsWhere(identity, Array.isArray)) {
    const foreign = structuredClone(identity);
    at(foreign, path).push('foreign');
    assert.equal(now.toeBoneUltrasoundLesson(foreign, 'ultrasound'), undefined, `${identity.id}:${path.join('.')}`);
    identityRefusals++;
  }
  assert.equal(now.toeBoneUltrasoundLesson({...structuredClone(identity), unexpected: true}, 'ultrasound'), undefined);
  identityRefusals++;
  for (const tab of now.contentTabs.filter(tab => tab !== 'ultrasound')) assert.equal(now.toeBoneUltrasoundLesson(identity, tab), undefined);
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
    const response = await now.postBodyDecision(new Request('https://atlas.test/api/body-decisions', {method: 'POST', headers: {origin: 'https://atlas.test', 'content-type': 'application/json', 'oai-authenticated-user-id': 'SYNTHETIC_TOE_BONE_US_DRAFT'}, body: JSON.stringify({...packet, ...delta})}), {prepare() {storageCalls++; throw Error('Stale decision reached storage');}});
    assert.equal(response.status, 409);
    stale++;
  }
}
assert.equal(identityRefusals, 1120);
assert.equal(malformed, 140);
assert.equal(stale, 84);
assert.equal(storageCalls, 0);
assert.equal(now.toeBoneUltrasoundLesson({id: 'foreign'}, 'ultrasound'), undefined);
for (const structure of catalog.structures.filter(item => item.region === 'foot' && !entries.has(item.id)))
  assert.equal(now.toeBoneUltrasoundLesson(structure, 'ultrasound'), undefined);
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
assert.equal(worksheets, 28);
for (const [family, lessons] of Object.entries(now.toeBoneUltrasoundTeaching)) {
  const words = Object.values(lessons).flatMap(lesson => [lesson.body, ...lesson.bullets]).join(' ').split(/\s+/).length;
  assert(words <= 180, `${family}: ${words}`);
}
for (const ref of Object.values(now.toeBoneUltrasoundReferences)) assert.equal(ref.licence, 'CC BY 4.0');
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
for (const path of ['lib/toe-bone-ultrasound.ts', 'content/toe-bone-ultrasound.ts', 'content/toe-bone-ultrasound-pins.json']) {
  const file = review.files.find(item => item.path === path);
  assert(file, path);
  assert.equal(file.sourceSha256, hash(sourceAt(path)));
}
assert(!review.files.some(file => file.path === 'content/toe-bone-ultrasound.transition.json'));
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
  for (const path of ['content/toe-bone-ultrasound-pins.json', 'content/toe-bone-ultrasound.ts', 'lib/toe-bone-ultrasound.ts']) {
    const actual = inputs.find(file => file.path === path), imported = review.files.find(file => file.path === path);
    assert.equal(Boolean(actual), name === 'head-neck' || name === 'shoulder', `${name}:${path}`);
    if (actual) assert.equal(actual.sha256, imported.sourceSha256);
  }
  assert(!inputs.some(file => file.path === 'content/toe-bone-ultrasound.transition.json'));
  if (name === 'head-neck') {
    const emitted = emittedTeaching(base, manifest.files, false, admitted);
    for (const entry of pins.entries) {
      const lesson = now.toeBoneUltrasoundLesson(entry.identity, 'ultrasound');
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
  const lesson = now.toeBoneUltrasoundLesson(entry.identity, 'ultrasound');
  for (const value of [entry.identity.id, lesson.body, ...lesson.bullets, lesson.note, ...lesson.citations])
    assert(emittedReview.includes(value) || emittedReview.includes(JSON.stringify(value).slice(1, -1)), `review:${entry.identity.id}:${value.slice(0, 40)}`);
}
// This admission stays at the complete immutable f71 epoch. Inspect current
// delivery separately: 24 lesser-toe lessons remain byte-for-byte equivalent,
// and exactly four hallux lessons change their note alone.
const compiled = await build({stdin: {contents: common + "export * from './atlas-review/lib/toe-bone-ultrasound';export * from './atlas-review/lib/foot-ultrasound-followup';", resolveDir: process.cwd(), loader: 'ts'}, bundle: true, write: false, platform: 'node', format: 'esm'});
const delivery = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const followup = JSON.parse(readFileSync('atlas-review/content/foot-ultrasound-followup-pins.json'));
assert.equal(hash(followup), '87df5b06e49b9f5fa28dcaf226fd582fa5e9f7eb8b80a40301190906a811a48d');
assert.equal(followup.baseline, sourceRevision);
const hallux = new Set(followup.entries.filter(entry => entry.family === 'halluxNote').map(entry => entry.identity.id));
assert.equal(hallux.size, 4);
assert.deepEqual(JSON.parse(readFileSync('atlas-review/content/toe-bone-ultrasound-pins.json')), pins);
let originalToeBodiesRetained = 0, correctedHalluxNotes = 0;
for (const {identity} of pins.entries) {
  const prior = now.bodyLesson(identity, 'ultrasound');
  const current = delivery.bodyLesson(identity, 'ultrasound');
  if (hallux.has(identity.id)) {
    const {note: previousNote, ...previousBody} = prior;
    const {note: currentNote, ...currentBody} = current;
    assert.deepEqual(currentBody, previousBody, identity.id);
    assert.notEqual(currentNote, previousNote, identity.id);
    assert.match(currentNote, /hallux.*(?:IP|interphalangeal)|(?:IP|interphalangeal).*hallux/i);
    assert.doesNotMatch(currentNote, /three.phalangeal|biphalangeal|fifth.toe/i);
    correctedHalluxNotes++;
  } else assert.deepEqual(current, prior, identity.id);
  originalToeBodiesRetained++;
}
assert.equal(originalToeBodiesRetained, 28);
assert.equal(correctedHalluxNotes, 4);
console.log(JSON.stringify({websiteBaseline, toeWebsiteEpoch, sourceRevision, deliveryRevision, changed, preserved, identityRefusals, malformedPacketsRefused: malformed, staleRefusalsBeforeStorage: stale, storageCalls, changedTeachingWorksheets: worksheets, verifiedRuntimes: 4, originalToeBodiesRetained, correctedHalluxNotes, clinicalApproval: false, browserAcceptance: false}));
