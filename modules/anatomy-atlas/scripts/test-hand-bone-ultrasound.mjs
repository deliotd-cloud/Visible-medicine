import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

const baseline = 'cdc6ad23ad5c3c13a2f6588019a057d0a063818f';
const REQUIRED_PIN_HASH = '58673652a31c3a58f26c538901b52b883f544d6ef71be775ae703ed3e2ec96a9';
const REQUIRED_TRANSITION_HASH = '927670e57058bd96b35e0341bd9182e7774e070496aff0f5b89e082d41035c90';
const hash = value => createHash('sha256')
  .update(typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value))
  .digest('hex');
const pins = JSON.parse(readFileSync('content/hand-bone-ultrasound-pins.json'));
const transition = JSON.parse(readFileSync('content/hand-bone-ultrasound.transition.json'));
const footPins = JSON.parse(readFileSync('content/foot-surface-imaging-pins.json'));
assert.equal(hash(pins), REQUIRED_PIN_HASH);
assert.equal(hash(transition), REQUIRED_TRANSITION_HASH);
assert.equal(pins.baseline, baseline);
assert.equal(transition.baseline, baseline);
assert.equal(transition.sourcePinsHash, hash(pins));

const before = await exactSourceHistoryApi(baseline, 'review-security');
// Prove the complete immutable admission epoch, not old pins mixed with later
// wrist teaching. The wrist-correction epoch proves the next admission, and
// the toe-US suite separately checks all current non-toe teaching unchanged.
const now = await exactSourceHistoryApi('90191b8b236bfed00db7c424dbacde915920460d', 'hand-bone-ultrasound');
const old = path => execFileSync('git', ['show', `${baseline}:${path}`], {windowsHide: true, maxBuffer: 32e6});
const sourceCatalog = JSON.parse(readFileSync('public/models/bodyparts3d/full-body/catalog.json'));
assert.equal(sourceCatalog.sourceVersion, pins.sourceVersion);
assert.equal(sourceCatalog.license, pins.license);
assert.deepEqual(sourceCatalog.coordinateSystem, pins.coordinateSystem);
assert.deepEqual(sourceCatalog.bundles.filter(bundle => bundle.id === 'hand-skeleton'), pins.bundles);
const catalog = now.bodyDisplayCatalog(sourceCatalog);
assert.equal(catalog.structures.length, 1104);
assert.deepEqual(catalog, before.bodyDisplayCatalog(JSON.parse(old('public/models/bodyparts3d/full-body/catalog.json'))));
for (const key of ['structures', 'dissectionProfiles', 'regionalTours']) assert.deepEqual(now[key], before[key]);
const snapshot = api => ({
  catalog,
  body: catalog.structures.map(s => ({
    id: s.id,
    topics: Object.fromEntries(api.contentTabs.map(tab => [tab, api.bodyLesson(s, tab)])),
  })),
  shoulder: api.structures,
  recipes: api.dissectionProfiles,
});
assert.equal(hash(snapshot(before)), pins.beforeAllTeachingSnapshotHash);
const reconstructed = snapshot(now);
const entries = new Map(pins.entries.map(entry => [entry.identity.id, entry]));
assert.equal(entries.size, 46);
assert.equal(pins.entries.length, 46);
assert.equal(transition.entries.length, 46);
assert.deepEqual(new Set(pins.entries.map(e => e.family)), new Set([
  'metacarpal', 'thumbMetacarpal', 'proximal', 'thumbProximal', 'middle', 'distal',
  'thumbDistal', 'capitate', 'trapezium', 'trapezoid', 'triquetral',
]));
assert.deepEqual(pins.entries.reduce((counts, e) => (counts[e.family] = (counts[e.family] || 0) + 1, counts), {}), {
  metacarpal: 8, thumbMetacarpal: 2, proximal: 8, thumbProximal: 2, middle: 8,
  distal: 8, thumbDistal: 2, capitate: 2, trapezium: 2, trapezoid: 2,
  triquetral: 2,
});
let changed = 0, preserved = 0, refusals = 0, malformed = 0, stale = 0;
let storageCalls = 0, worksheets = 0;
for (const row of reconstructed.body) for (const tab of now.contentTabs) {
  const structure = catalog.structures.find(s => s.id === row.id);
  const entry = entries.get(structure.id);
  const prior = before.bodyLesson(structure, tab);
  const current = now.bodyLesson(structure, tab);
  if (entry && Object.hasOwn(entry.previous, tab)) {
    assert.equal(tab, 'ultrasound');
    assert.equal(prior.readiness, 'pending');
    assert.equal(current.readiness, 'draft');
    assert.deepEqual(prior, entry.previous[tab]);
    assert.deepEqual(current, now.handBoneUltrasoundLesson(structure, tab));
    const {readiness, ...shown} = current;
    assert.deepEqual(now.bodyContent(structure, tab), shown);
    const recorded = transition.entries.find(e => e.id === structure.id && e.tab === tab);
    assert(recorded);
    assert.equal(recorded.fmaId, structure.fmaId);
    assert.equal(hash(current), recorded.draftHash);
    row.topics[tab] = prior;
    changed++;
  } else {
    assert.deepEqual(current, prior, `${structure.id}:${tab}`);
    preserved++;
  }
}
assert.equal(changed, 46);
assert.equal(preserved, 9890);
assert.equal(hash(reconstructed), pins.beforeAllTeachingSnapshotHash);
assert.equal(footPins.entries.length, 8);
for (const entry of footPins.entries) {
  const structure = catalog.structures.find(s => s.id === entry.identity.id);
  assert.deepEqual(structure, entry.identity);
  assert.deepEqual(now.bodyLesson(structure, 'ultrasound'), before.bodyLesson(structure, 'ultrasound'));
  if (entry.family === 'longPlantar') {
    assert.equal(now.bodyLesson(structure, 'ct').readiness, 'pending');
  }
}

const pathsWhere = (value, predicate, path = []) => [
  ...(predicate(value) ? [path] : []),
  ...(value && typeof value === 'object'
    ? Object.entries(value).flatMap(([key, child]) => pathsWhere(child, predicate, [...path, key]))
    : []),
];
const at = (value, path) => path.reduce((part, key) => part[key], value);
let expectedRefusals = 0;
for (const {identity, previous, family} of pins.entries) {
  assert.deepEqual(catalog.structures.find(s => s.id === identity.id), identity);
  assert.deepEqual(Object.keys(previous), ['ultrasound']);
  const draft = now.handBoneUltrasoundLesson(identity, 'ultrasound');
  assert.equal(draft.readiness, 'draft');
  assert.match(draft.title, /evidence & limits.*draft/i);
  assert.match(draft.note, /revision-bound radiologist/i);
  assert.match(draft.note, /independent/i);
  assert.equal(draft.body, now.handBoneUltrasoundTeaching[family].ultrasound.body);
  const clean = structuredClone(draft);
  draft.bullets.push('foreign');
  draft.citations.push('foreign');
  assert.deepEqual(now.handBoneUltrasoundLesson(identity, 'ultrasound'), clean, 'Fresh arrays');
  for (const path of pathsWhere(identity, value => value === null || typeof value !== 'object')) {
    const foreign = structuredClone(identity);
    const parent = at(foreign, path.slice(0, -1));
    const key = path.at(-1);
    const original = parent[key];
    parent[key] = typeof original === 'string' ? `${original}-foreign`
      : typeof original === 'number' ? original + 0.01
        : original === null ? 'foreign' : !original;
    assert.equal(now.handBoneUltrasoundLesson(foreign, 'ultrasound'), undefined, path.join('.'));
    refusals++;
  }
  for (const path of pathsWhere(identity, Array.isArray)) {
    const foreign = structuredClone(identity);
    at(foreign, path).push('foreign');
    assert.equal(now.handBoneUltrasoundLesson(foreign, 'ultrasound'), undefined, path.join('.'));
    refusals++;
  }
  const foreign = structuredClone(identity);
  foreign.unexpected = true;
  assert.equal(now.handBoneUltrasoundLesson(foreign, 'ultrasound'), undefined);
  refusals++;
  expectedRefusals += pathsWhere(identity, value => value === null || typeof value !== 'object').length
    + pathsWhere(identity, Array.isArray).length + 1;
  for (const tab of now.contentTabs.filter(tab => tab !== 'ultrasound')) {
    assert.equal(now.handBoneUltrasoundLesson(identity, tab), undefined);
  }

  const material = await now.bodyReviewMaterial(identity.id);
  assert.equal(material.approval, false);
  assert(await now.parseBodyReviewResponse(material, identity.id));
  for (const mutate of [
    value => { value.topics.find(topic => topic.tab === 'ultrasound').body += ' foreign'; },
    value => { value.topics.find(topic => topic.tab === 'ultrasound').readiness = 'approved'; },
    value => { value.topics.find(topic => topic.tab === 'ultrasound').citations = ['https://foreign.example']; },
    value => { value.source.structure.sources = []; },
    value => { value.topics = value.topics.filter(topic => topic.tab !== 'ultrasound'); },
  ]) {
    const foreign = structuredClone(material);
    mutate(foreign);
    assert.equal(await now.parseBodyReviewResponse(foreign, identity.id), null);
    malformed++;
  }
  const prior = await before.bodyReviewContext(identity.id);
  const current = await now.bodyReviewContext(identity.id);
  assert.equal(current.sourceHash, prior.sourceHash);
  assert.notEqual(current.revisions.teaching, prior.revisions.teaching);
  assert.equal(current.revisions.imaging, null);
  const packet = {
    catalogScope: current.catalogScope,
    structureId: identity.id,
    track: 'teaching',
    expectedVersion: 0,
    materialHash: current.materialHash,
    revisionHash: current.revisions.teaching,
    checklistVersion: current.checklistVersion,
    draft: now.blankBodyReview(current, 'teaching'),
  };
  for (const hashes of [
    {materialHash: prior.materialHash, revisionHash: prior.revisions.teaching},
    {materialHash: prior.materialHash},
    {revisionHash: prior.revisions.teaching},
  ]) {
    const response = await now.postBodyDecision(new Request('https://atlas.test/api/body-decisions', {
      method: 'POST',
      headers: {
        origin: 'https://atlas.test',
        'content-type': 'application/json',
        'oai-authenticated-user-id': 'SYNTHETIC_HAND_BONE_US_DRAFT',
      },
      body: JSON.stringify({...packet, ...hashes}),
    }), {prepare() { storageCalls++; throw Error('Stale decision reached storage'); }});
    assert.equal(response.status, 409);
    stale++;
  }
}
assert.equal(refusals, expectedRefusals);
assert.equal(malformed, 46 * 5);
assert.equal(stale, 46 * 3);
assert.equal(storageCalls, 0);
assert.equal(now.handBoneUltrasoundLesson({id: 'foreign'}, 'ultrasound'), undefined);
for (const structure of catalog.structures) {
  const prior = await before.bodyReviewMaterial(structure.id);
  const current = await now.bodyReviewMaterial(structure.id);
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
assert.equal(worksheets, 46);
for (const [family, lessons] of Object.entries(now.handBoneUltrasoundTeaching)) {
  const words = Object.values(lessons).flatMap(lesson => [lesson.body, ...lesson.bullets]).join(' ').split(/\s+/).length;
  assert(words <= 180, `${family}: ${words}`);
}
for (const ref of Object.values(now.handBoneUltrasoundReferences)) assert.equal(ref.licence, 'CC BY 4.0');
assert.equal(catalog.bundles.length, 109);
for (const bundle of catalog.bundles) {
  const path = `public${bundle.url.split('?')[0]}`;
  const bytes = readFileSync(path);
  assert.equal(hash(bytes), bundle.sha256);
  assert.deepEqual(bytes, old(path));
}
for (const path of [
  'package-lock.json',
  'LICENSES/dependency-license-audit.json',
  'LICENSES/BODYPARTS3D_FULL_BODY.md',
  'app/body-explorer.tsx',
  'lib/imaging-sync.ts',
  'lib/didanix-atlas-adapter.ts',
  'lib/independent-study-links.ts',
  'lib/body-review-context.ts',
  'lib/body-review-api.ts',
]) {
  assert.equal(readFileSync(path, 'utf8').replaceAll('\r\n', '\n'), old(path).toString().replaceAll('\r\n', '\n'), path);
}
console.log(JSON.stringify({
  changed, preserved, worksheets, identityRefusals: refusals, malformed, stale, storageCalls,
  bundlesUnchanged: catalog.bundles.length, clinicalApproval: false, websiteIntegrated: false,
}));
