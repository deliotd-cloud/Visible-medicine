import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {atlasExactGitApi} from './atlas-exact-git-api.mjs';
import {checkedAtlasHistoryRepo} from './atlas-source-repo.mjs';

const websiteBaseline = '7eacbbacc76f4e98288552614ce47e8e823d45a9';
const sourceBaseline = 'cdc6ad23ad5c3c13a2f6588019a057d0a063818f';
const sourceRevision = '90191b8b236bfed00db7c424dbacde915920460d';
const handWebsiteEpoch = '0ffdb0ad6e0b729a4161f3a282389cc1daef1ce8';
const atlasSource = checkedAtlasHistoryRepo(sourceRevision);
const hash = value => createHash('sha256').update(typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value)).digest('hex');
const old = path => execFileSync('git', ['show', `${websiteBaseline}:${path}`], {maxBuffer: 32e6, windowsHide: true, env: {...process.env, GIT_NO_REPLACE_OBJECTS: '1'}});
const admitted = path => execFileSync('git', ['show', `${handWebsiteEpoch}:${path}`], {maxBuffer: 32e6, windowsHide: true, env: {...process.env, GIT_NO_REPLACE_OBJECTS: '1'}});
const sourceAt = path => execFileSync('git', ['show', `${sourceRevision}:${path}`], {cwd: atlasSource, maxBuffer: 32e6, windowsHide: true, env: {...process.env, GIT_NO_REPLACE_OBJECTS: '1'}});
const common = "export {bodyLesson,bodyContent} from './atlas-review/app/body-content';export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';export {contentTabs} from './atlas-review/lib/content-types';export {structures} from './atlas-review/app/anatomy-data';export {dissectionProfiles} from './atlas-review/app/dissection-data';export {regionalTours} from './atlas-review/lib/regional-tours';export {reasoningConcepts} from './atlas-review/lib/reasoning-questions';export * from './atlas-review/lib/body-review-material';export * from './atlas-review/lib/body-review-context';export * from './atlas-review/lib/body-review-response';export * from './atlas-review/lib/body-review-api';export * from './atlas-review/lib/body-review-decisions';";
const before = await atlasExactGitApi(websiteBaseline, common);
const now = await atlasExactGitApi(handWebsiteEpoch, common + "export * from './atlas-review/lib/hand-bone-ultrasound';export * from './atlas-review/content/hand-bone-ultrasound';");
const pins = JSON.parse(admitted('atlas-review/content/hand-bone-ultrasound-pins.json'));
const transition = JSON.parse(sourceAt('content/hand-bone-ultrasound.transition.json'));
assert.equal(hash(pins), '58673652a31c3a58f26c538901b52b883f544d6ef71be775ae703ed3e2ec96a9');
assert.equal(hash(transition), '927670e57058bd96b35e0341bd9182e7774e070496aff0f5b89e082d41035c90');
assert.equal(pins.baseline, sourceBaseline);
assert.equal(transition.baseline, sourceBaseline);
assert.equal(transition.sourcePinsHash, hash(pins));
assert.deepEqual(admitted('atlas-review/content/hand-bone-ultrasound-pins.json'), sourceAt('content/hand-bone-ultrasound-pins.json'));
assert.equal(pins.entries.length, 46);
assert.equal(transition.entries.length, 46);
const entries = new Map(pins.entries.map(entry => [entry.identity.id, entry]));
const transitions = new Map(transition.entries.map(entry => [`${entry.id}:${entry.tab}`, entry]));
assert.equal(entries.size, 46);
assert.equal(transitions.size, 46);
assert.deepEqual(pins.entries.reduce((counts, entry) => (counts[entry.family] = (counts[entry.family] || 0) + 1, counts), {}), {
  metacarpal: 8, thumbMetacarpal: 2, proximal: 8, thumbProximal: 2, middle: 8,
  distal: 8, thumbDistal: 2, capitate: 2, trapezium: 2, trapezoid: 2, triquetral: 2,
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
assert.deepEqual(pins.bundles, sourceCatalog.bundles.filter(bundle => bundle.id === 'hand-skeleton'));
const snapshot = api => ({catalog, body: catalog.structures.map(structure => ({id: structure.id, topics: Object.fromEntries(api.contentTabs.map(tab => [tab, api.bodyLesson(structure, tab)]))})), shoulder: api.structures, recipes: api.dissectionProfiles});
assert.equal(hash(snapshot(before)), pins.beforeAllTeachingSnapshotHash);
const recovered = snapshot(now);
let changed = 0, preserved = 0, identityRefusals = 0, malformed = 0, stale = 0, storageCalls = 0, worksheets = 0;
for (const row of recovered.body) {
  const structure = catalog.structures.find(item => item.id === row.id);
  const entry = entries.get(row.id);
  for (const tab of now.contentTabs) {
    const previous = before.bodyLesson(structure, tab);
    if (entry && tab === 'ultrasound') {
      assert.deepEqual(previous, entry.previous.ultrasound);
      assert.equal(previous.readiness, 'pending');
      const lesson = now.bodyLesson(structure, tab);
      assert.deepEqual(lesson, now.handBoneUltrasoundLesson(entry.identity, tab));
      assert.equal(lesson.readiness, 'draft');
      const recorded = transitions.get(`${row.id}:${tab}`);
      assert(recorded);
      assert.equal(recorded.fmaId, structure.fmaId);
      assert.equal(hash(lesson), recorded.draftHash);
      const {readiness, ...display} = lesson;
      assert.deepEqual(now.bodyContent(structure, tab), display);
      row.topics[tab] = previous;
      changed++;
    } else {
      assert.deepEqual(row.topics[tab], previous, `${row.id}:${tab}`);
      preserved++;
    }
  }
}
assert.equal(changed, 46);
assert.equal(preserved, 9890);
assert.equal(hash(recovered), pins.beforeAllTeachingSnapshotHash);
const pathsWhere = (value, predicate, path = []) => [
  ...(predicate(value) ? [path] : []),
  ...(value && typeof value === 'object' ? Object.entries(value).flatMap(([key, part]) => pathsWhere(part, predicate, [...path, key])) : []),
];
const at = (value, path) => path.reduce((part, key) => part[key], value);
for (const {identity, previous, family} of pins.entries) {
  assert.deepEqual(catalog.structures.find(structure => structure.id === identity.id), identity);
  assert.deepEqual(Object.keys(previous), ['ultrasound']);
  const lesson = now.handBoneUltrasoundLesson(identity, 'ultrasound');
  assert.equal(lesson.readiness, 'draft');
  assert.match(lesson.title, /evidence & limits.*draft/i);
  assert.match(lesson.note, /revision-bound radiologist/i);
  assert.match(lesson.note, /independent/i);
  assert.equal(lesson.body, now.handBoneUltrasoundTeaching[family].ultrasound.body);
  assert.deepEqual(lesson.bullets, [...now.handBoneUltrasoundTeaching[family].ultrasound.bullets]);
  assert.deepEqual(lesson.citations, now.handBoneUltrasoundTeaching[family].ultrasound.citations.map(key => now.handBoneUltrasoundReferences[key].url));
  for (const citation of lesson.citations) assert.equal(new URL(citation).protocol, 'https:');
  const original = structuredClone(lesson);
  lesson.bullets.push('foreign');
  lesson.citations.push('https://foreign.example');
  assert.deepEqual(now.handBoneUltrasoundLesson(identity, 'ultrasound'), original);
  for (const path of pathsWhere(identity, value => value === null || typeof value !== 'object')) {
    const foreign = structuredClone(identity), parent = at(foreign, path.slice(0, -1)), key = path.at(-1), value = parent[key];
    parent[key] = typeof value === 'string' ? `${value}-foreign` : typeof value === 'number' ? value + 0.01 : value === null ? 'foreign' : !value;
    assert.equal(now.handBoneUltrasoundLesson(foreign, 'ultrasound'), undefined, `${identity.id}:${path.join('.')}`);
    identityRefusals++;
  }
  for (const path of pathsWhere(identity, Array.isArray)) {
    const foreign = structuredClone(identity);
    at(foreign, path).push('foreign');
    assert.equal(now.handBoneUltrasoundLesson(foreign, 'ultrasound'), undefined, `${identity.id}:${path.join('.')}`);
    identityRefusals++;
  }
  const extra = {...structuredClone(identity), unexpected: true};
  assert.equal(now.handBoneUltrasoundLesson(extra, 'ultrasound'), undefined);
  identityRefusals++;
  for (const tab of now.contentTabs.filter(tab => tab !== 'ultrasound')) assert.equal(now.handBoneUltrasoundLesson(identity, tab), undefined);
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
    const response = await now.postBodyDecision(new Request('https://atlas.test/api/body-decisions', {method: 'POST', headers: {origin: 'https://atlas.test', 'content-type': 'application/json', 'oai-authenticated-user-id': 'SYNTHETIC_HAND_BONE_US_DRAFT'}, body: JSON.stringify({...packet, ...delta})}), {prepare() {storageCalls++; throw Error('Stale decision reached storage');}});
    assert.equal(response.status, 409);
    stale++;
  }
}
assert.equal(identityRefusals, 1840);
assert.equal(malformed, 230);
assert.equal(stale, 138);
assert.equal(storageCalls, 0);
assert.equal(now.handBoneUltrasoundLesson({id: 'foreign'}, 'ultrasound'), undefined);
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
    assert.equal(now.handBoneUltrasoundLesson(structure, 'ultrasound'), undefined);
  }
}
assert.equal(worksheets, 46);
for (const [family, lessons] of Object.entries(now.handBoneUltrasoundTeaching)) {
  const words = Object.values(lessons).flatMap(lesson => [lesson.body, ...lesson.bullets]).join(' ').split(/\s+/).length;
  assert(words <= 180, family);
}
for (const ref of Object.values(now.handBoneUltrasoundReferences)) assert.equal(ref.licence, 'CC BY 4.0');
for (const bundle of catalog.bundles) {
  const path = `public/atlas-runtime/head-neck${bundle.url.split('?')[0]}`, bytes = admitted(path);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(hash(bytes), bundle.sha256);
  assert.deepEqual(bytes, old(path));
}
for (const path of ['package-lock.json', 'atlas-review/app/body-explorer.tsx', 'atlas-review/lib/imaging-sync.ts', 'atlas-review/lib/didanix-atlas-adapter.ts', 'atlas-review/lib/independent-study-links.ts'])
  assert.equal(admitted(path).toString().replaceAll('\r\n', '\n'), old(path).toString().replaceAll('\r\n', '\n'), path);
export {now as admission, pins, common, hash, handWebsiteEpoch, sourceRevision};
console.log(JSON.stringify({websiteBaseline, handWebsiteEpoch, sourceRevision, changed, preserved, identityRefusals, malformedPacketsRefused: malformed, staleRefusalsBeforeStorage: stale, storageCalls, changedTeachingWorksheets: worksheets, clinicalApproval: false, browserAcceptance: false}));
