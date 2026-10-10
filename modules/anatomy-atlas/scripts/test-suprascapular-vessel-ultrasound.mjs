import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
const baseline = 'cbca085f2862f14df28007b32a4f2cd688dd01d5';
const pins = JSON.parse(readFileSync('content/suprascapular-vessel-ultrasound-pins.json'));
const hash = value => createHash('sha256').update(typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value)).digest('hex');
assert.equal(hash(pins), '0ed9e6ba9dabbbad9079639a7ecc23cc203d6c25a78b3b8d11045804498c6389');
const before = await exactSourceHistoryApi(baseline, 'review-security');
// This historical acceptance compares complete immutable before/after trees.
// Current additions are independently tested for exact preservation elsewhere.
const now = await exactSourceHistoryApi('398edc60a43f8d0235d9e6963c1ad56954b3fa98', 'suprascapular-ultrasound');
const old = path => execFileSync('git', ['show', baseline + ':' + path], {windowsHide: true, maxBuffer: 32e6});
const rawCatalog = JSON.parse(readFileSync('public/models/bodyparts3d/full-body/catalog.json'));
const catalog = now.bodyDisplayCatalog(rawCatalog);
assert.equal(catalog.structures.length, 1104);
assert.deepEqual(catalog, before.bodyDisplayCatalog(JSON.parse(old('public/models/bodyparts3d/full-body/catalog.json'))));
assert.deepEqual(now.structures, before.structures);
assert.deepEqual(now.dissectionProfiles, before.dissectionProfiles);
assert.deepEqual(now.regionalTours, before.regionalTours);
const ids = new Set(pins.entries.map(e => e.identity.id));
const snapshot = api => ({catalog, body: catalog.structures.map(s => ({id: s.id, topics: Object.fromEntries(api.contentTabs.map(t => [t, api.bodyLesson(s, t)]))})), shoulder: api.structures, recipes: api.dissectionProfiles});
assert.equal(hash(snapshot(before)), pins.beforeAllTeachingSnapshotHash);
const reconstructed = snapshot(now);
let changed = 0, preserved = 0, malformed = 0, stale = 0, storageCalls = 0, worksheetChanges = 0;
for (const row of reconstructed.body) for (const tab of now.contentTabs) {
  const s = catalog.structures.find(s => s.id === row.id);
  const previous = before.bodyLesson(s, tab), current = now.bodyLesson(s, tab);
  if (ids.has(s.id) && tab === 'ultrasound') {
    assert.equal(previous.readiness, 'pending'); assert.equal(current.readiness, 'draft');
    assert.deepEqual(previous, pins.entries.find(e => e.identity.id === s.id).previous);
    assert.deepEqual(current, now.suprascapularVesselUltrasoundLesson(s, tab));
    const {readiness, ...shown} = current; assert.deepEqual(now.bodyContent(s, tab), shown);
    row.topics[tab] = previous; changed++;
  } else {assert.deepEqual(current, previous, s.id + ':' + tab); preserved++;}
}
assert.equal(changed, 4); assert.equal(preserved, 9932);
assert.equal(hash(reconstructed), pins.beforeAllTeachingSnapshotHash, 'The entire baseline teaching snapshot must reconstruct exactly');
for (const {identity} of pins.entries) {
  assert.deepEqual(catalog.structures.find(s => s.id === identity.id), identity);
  const material = await now.bodyReviewMaterial(identity.id);
  assert(await now.parseBodyReviewResponse(material, identity.id));
  assert.equal(material.approval, false);
  assert.deepEqual(material.topics.find(t => t.tab === 'ultrasound'), {tab: 'ultrasound', ...now.bodyLesson(identity, 'ultrasound')});
  for (const edit of [
    packet => {packet.topics.find(t => t.tab === 'ultrasound').body += ' foreign';},
    packet => {packet.topics.find(t => t.tab === 'ultrasound').readiness = 'approved';},
    packet => {packet.topics.find(t => t.tab === 'ultrasound').citations = ['https://foreign.example'];},
    packet => {packet.source.structure.sources = [];},
    packet => {packet.topics.splice(packet.topics.findIndex(t => t.tab === 'ultrasound'), 1);},
  ]) {const foreign = structuredClone(material); edit(foreign); assert.equal(await now.parseBodyReviewResponse(foreign, identity.id), null); malformed++;}
  const prior = await before.bodyReviewContext(identity.id), current = await now.bodyReviewContext(identity.id);
  assert.equal(current.sourceHash, prior.sourceHash); assert.notEqual(current.revisions.teaching, prior.revisions.teaching);
  assert.equal(current.revisions.imaging, null);
  const packet = {catalogScope: current.catalogScope, structureId: identity.id, track: 'teaching', expectedVersion: 0,
    materialHash: current.materialHash, revisionHash: current.revisions.teaching,
    checklistVersion: current.checklistVersion, draft: now.blankBodyReview(current, 'teaching')};
  // Old material and teaching revision must EACH fail, not merely fail together.
  for (const oldHashes of [
    {materialHash: prior.materialHash, revisionHash: prior.revisions.teaching},
    {materialHash: prior.materialHash}, {revisionHash: prior.revisions.teaching},
  ]) {
    const response = await now.postBodyDecision(new Request('https://atlas.test/api/body-decisions', {
      method: 'POST', headers: {origin: 'https://atlas.test', 'content-type': 'application/json', 'oai-authenticated-user-id': 'SYNTHETIC_SUPRASCAPULAR_ULTRASOUND'}, body: JSON.stringify({...packet, ...oldHashes}),
    }), {prepare() {storageCalls++; throw Error('Stale decision reached storage');}});
    assert.equal(response.status, 409); stale++;
  }
}
for (const s of catalog.structures) {
  const prior = await before.bodyReviewMaterial(s.id), current = await now.bodyReviewMaterial(s.id);
  assert.deepEqual(current.source, prior.source); assert.deepEqual(current.reasoning, prior.reasoning);
  assert.deepEqual(current.guidedTours, prior.guidedTours); assert.equal(current.approval, false);
  if (ids.has(s.id)) {assert.notEqual(current.fingerprints.teaching, prior.fingerprints.teaching); worksheetChanges++;}
  else {assert.deepEqual(current.topics, prior.topics); assert.equal(current.fingerprints.teaching, prior.fingerprints.teaching); assert.equal(now.suprascapularVesselUltrasoundLesson(s, 'ultrasound'), undefined);}
}
assert.equal(worksheetChanges, 4); assert.equal(malformed, 20); assert.equal(stale, 12); assert.equal(storageCalls, 0);
for (const bundle of catalog.bundles) {
  const path = 'public' + bundle.url.split('?')[0], bytes = readFileSync(path);
  assert.equal(hash(bytes), bundle.sha256); assert.deepEqual(bytes, old(path));
}
for (const path of ['package-lock.json', 'LICENSES/dependency-license-audit.json', 'LICENSES/BODYPARTS3D_FULL_BODY.md', 'app/body-explorer.tsx', 'lib/imaging-sync.ts', 'lib/didanix-atlas-adapter.ts', 'lib/independent-study-links.ts', 'lib/body-review-context.ts', 'lib/body-review-api.ts'])
  assert.equal(readFileSync(path, 'utf8').replaceAll('\r\n', '\n'), old(path).toString().replaceAll('\r\n', '\n'), path);
assert.equal(execFileSync('git', ['diff', '--name-only', baseline, '--', 'public/models'], {encoding: 'utf8'}).trim(), '');
console.log(JSON.stringify({baseline, changed, preserved, bundlesUnchanged: catalog.bundles.length, malformedPacketsRefused: malformed, staleFingerprintsIndependentlyRefused: stale, storageCalls, changedTeachingWorksheets: worksheetChanges, clinicalApproval: false, websiteIntegrated: false}));
