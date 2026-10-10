import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

const baseline = 'bbe33ea6ffff3503ae9cdabc0dd41350cece28cd';
const REQUIRED_PIN_HASH = '2edc421ca9a85878625dc607e990d1136fbb4be63609c62ba565161ffa09e56d';
const REQUIRED_TRANSITION_HASH = 'f8718d1d4428a8301a83bc0332c7e007c646dc579ea98354969c987d5eafd20f';
const hash = value => createHash('sha256').update(
  typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value),
).digest('hex');
const pins = JSON.parse(readFileSync('content/shoulder-girdle-arterial-ultrasound-pins.json'));
assert.equal(hash(pins), REQUIRED_PIN_HASH);
assert.equal(pins.baseline, baseline);
assert.match(REQUIRED_TRANSITION_HASH, /^[a-f0-9]{64}$/, 'Main must pin the completed transition hash');
const transition = JSON.parse(readFileSync('content/shoulder-girdle-arterial-ultrasound.transition.json'));
assert.equal(hash(transition), REQUIRED_TRANSITION_HASH);
assert.equal(transition.baseline, baseline);
assert.equal(transition.sourcePinsHash, REQUIRED_PIN_HASH);

const before = await exactSourceHistoryApi(baseline, 'review-security');
const compiled = await build({
  stdin: {contents: `export * from './lib/shoulder-girdle-arterial-ultrasound';
export * from './content/shoulder-girdle-arterial-ultrasound';
export {bodyLesson,bodyContent} from './app/body-content';
export {bodyDisplayCatalog} from './lib/body-display-catalog';
export {contentTabs} from './lib/content-types';
export {structures} from './app/anatomy-data';
export {dissectionProfiles} from './app/dissection-data';
export {regionalTours} from './lib/regional-tours';
export * from './lib/body-review-material';
export * from './lib/body-review-context';
export * from './lib/body-review-response';
export * from './lib/body-review-api';
export * from './lib/body-review-decisions';`, resolveDir: process.cwd(), loader: 'ts'},
  bundle: true, write: false, platform: 'node', format: 'esm',
});
const now = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const old = path => execFileSync('git', ['show', `${baseline}:${path}`], {windowsHide: true, maxBuffer: 32e6});
const rawCatalog = JSON.parse(readFileSync('public/models/bodyparts3d/full-body/catalog.json'));
assert.equal(rawCatalog.sourceVersion, pins.sourceVersion);
assert.equal(rawCatalog.license, pins.license);
assert.deepEqual(rawCatalog.coordinateSystem, pins.coordinateSystem);
for (const bundle of pins.bundles) assert.deepEqual(rawCatalog.bundles.find(b => b.id === bundle.id), bundle);
const catalog = now.bodyDisplayCatalog(rawCatalog);
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
assert.equal(pins.beforeAllTeachingSnapshotHash, 'f17a4121f7c9f0dad8e0715a308c39ec1ccfd36263d3f220d1367226ea16aaaf');
const reconstructed = snapshot(now);
const entries = new Map(pins.entries.map(entry => [entry.identity.id, entry]));
assert.equal(pins.entries.length, 10);
assert.equal(entries.size, 10);
assert.equal(transition.entries.length, 10);
const familyCounts = {posteriorCircumflexHumeral: 2, circumflexScapular: 2,
  thyrocervical: 2, costocervical: 2, dorsalScapular: 2};
assert.deepEqual([...new Set(pins.entries.map(e => e.family))].sort(), Object.keys(familyCounts).sort());
for (const [family, count] of Object.entries(familyCounts)) assert.equal(pins.entries.filter(e => e.family === family).length, count);
for (const family of Object.keys(familyCounts))
  assert.deepEqual(new Set(pins.entries.filter(e => e.family === family).map(e => e.identity.laterality)), new Set(['left', 'right']));

let changed = 0, preserved = 0;
const byId = new Map(catalog.structures.map(s => [s.id, s]));
for (const row of reconstructed.body) for (const tab of now.contentTabs) {
  const structure = byId.get(row.id);
  const entry = entries.get(row.id);
  const prior = before.bodyLesson(structure, tab);
  const current = now.bodyLesson(structure, tab);
  if (entry && tab === 'ultrasound') {
    assert.deepEqual(prior, entry.previous);
    assert.equal(prior.readiness, 'pending');
    assert.equal(current.readiness, 'draft');
    assert.deepEqual(current, now.shoulderGirdleArterialUltrasoundLesson(structure, tab));
    const recorded = transition.entries.find(e => e.id === structure.id);
    assert(recorded, `Missing transition ${structure.id}:${tab}`);
    assert.equal(recorded.fmaId, structure.fmaId);
    assert.equal(hash(current), recorded.draftHash);
    const {readiness, ...shown} = current;
    assert.deepEqual(now.bodyContent(structure, tab), shown);
    row.topics[tab] = prior;
    changed++;
  } else {
    assert.deepEqual(current, prior, `${structure.id}:${tab}`);
    preserved++;
  }
}
assert.equal(changed, 10);
assert.equal(preserved, 9926);
assert.equal(hash(reconstructed), pins.beforeAllTeachingSnapshotHash, 'Entire previous teaching snapshot must reconstruct exactly');

const pathsWhere = (value, predicate, path = []) => [
  ...(predicate(value) ? [path] : []),
  ...(value && typeof value === 'object'
    ? Object.entries(value).flatMap(([key, child]) => pathsWhere(child, predicate, [...path, key])) : []),
];
const at = (value, path) => path.reduce((part, key) => part[key], value);
let identityRefusals = 0, malformed = 0, stale = 0, storageCalls = 0, worksheets = 0;
for (const {identity} of pins.entries) {
  assert.deepEqual(byId.get(identity.id), identity);
  const clean = now.shoulderGirdleArterialUltrasoundLesson(identity, 'ultrasound');
  assert.equal(clean.readiness, 'draft');
  clean.bullets.push('foreign');
  clean.citations.push('foreign');
  assert.deepEqual(now.shoulderGirdleArterialUltrasoundLesson(identity, 'ultrasound'), now.bodyLesson(identity, 'ultrasound'), 'Fresh lesson arrays');
  for (const path of pathsWhere(identity, value => value === null || typeof value !== 'object')) {
    const foreign = structuredClone(identity);
    const parent = at(foreign, path.slice(0, -1));
    const key = path.at(-1);
    const original = parent[key];
    parent[key] = typeof original === 'string' ? `${original}-foreign`
      : typeof original === 'number' ? original + 0.01
        : original === null ? 'foreign' : !original;
    assert.equal(now.shoulderGirdleArterialUltrasoundLesson(foreign, 'ultrasound'), undefined, path.join('.'));
    identityRefusals++;
  }
  for (const path of pathsWhere(identity, Array.isArray)) {
    const foreign = structuredClone(identity);
    at(foreign, path).push('foreign');
    assert.equal(now.shoulderGirdleArterialUltrasoundLesson(foreign, 'ultrasound'), undefined, path.join('.'));
    identityRefusals++;
  }
  if (identity.sources.length > 1) {
    const reordered = structuredClone(identity);
    reordered.sources.reverse();
    assert.equal(now.shoulderGirdleArterialUltrasoundLesson(reordered, 'ultrasound'), undefined, 'Ordered source identity');
    identityRefusals++;
  }
  const foreign = structuredClone(identity);
  foreign.unexpected = true;
  assert.equal(now.shoulderGirdleArterialUltrasoundLesson(foreign, 'ultrasound'), undefined);
  identityRefusals++;
  for (const tab of now.contentTabs.filter(tab => tab !== 'ultrasound'))
    assert.equal(now.shoulderGirdleArterialUltrasoundLesson(identity, tab), undefined);

  const material = await now.bodyReviewMaterial(identity.id);
  assert.equal(material.approval, false);
  assert(await now.parseBodyReviewResponse(material, identity.id));
  assert.deepEqual(material.topics.find(t => t.tab === 'ultrasound'), {tab: 'ultrasound', ...now.bodyLesson(identity, 'ultrasound')});
  for (const mutate of [
    value => { value.topics.find(t => t.tab === 'ultrasound').body += ' foreign'; },
    value => { value.topics.find(t => t.tab === 'ultrasound').readiness = 'approved'; },
    value => { value.topics.find(t => t.tab === 'ultrasound').citations = ['https://foreign.example']; },
    value => { value.source.structure.sources = []; },
    value => { value.topics = value.topics.filter(t => t.tab !== 'ultrasound'); },
  ]) {
    const forged = structuredClone(material);
    mutate(forged);
    assert.equal(await now.parseBodyReviewResponse(forged, identity.id), null);
    malformed++;
  }
  const prior = await before.bodyReviewContext(identity.id);
  const current = await now.bodyReviewContext(identity.id);
  assert.equal(current.sourceHash, prior.sourceHash);
  assert.notEqual(current.revisions.teaching, prior.revisions.teaching);
  assert.equal(current.revisions.imaging, null);
  const packet = {catalogScope: current.catalogScope, structureId: identity.id, track: 'teaching', expectedVersion: 0,
    materialHash: current.materialHash, revisionHash: current.revisions.teaching,
    checklistVersion: current.checklistVersion, draft: now.blankBodyReview(current, 'teaching')};
  for (const oldHashes of [
    {materialHash: prior.materialHash, revisionHash: prior.revisions.teaching},
    {materialHash: prior.materialHash}, {revisionHash: prior.revisions.teaching},
  ]) {
    const response = await now.postBodyDecision(new Request('https://atlas.test/api/body-decisions', {
      method: 'POST', headers: {origin: 'https://atlas.test', 'content-type': 'application/json',
        'oai-authenticated-user-id': 'SYNTHETIC_SHOULDER_GIRDLE_ARTERIAL_US'}, body: JSON.stringify({...packet, ...oldHashes}),
    }), {prepare() { storageCalls++; throw Error('Stale decision reached storage'); }});
    assert.equal(response.status, 409);
    stale++;
  }
}
assert(identityRefusals > 300);
assert.equal(malformed, 50);
assert.equal(stale, 30);
assert.equal(storageCalls, 0);
assert.equal(now.shoulderGirdleArterialUltrasoundLesson({id: 'foreign'}, 'ultrasound'), undefined);
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
    assert.equal(now.shoulderGirdleArterialUltrasoundLesson(structure, 'ultrasound'), undefined);
  }
}
assert.equal(worksheets, 10);
assert.equal(catalog.bundles.length, 109);
for (const bundle of catalog.bundles) {
  const path = `public${bundle.url.split('?')[0]}`;
  const bytes = readFileSync(path);
  assert.equal(hash(bytes), bundle.sha256);
  assert.deepEqual(bytes, old(path));
}
for (const path of [
  'package-lock.json', 'LICENSES/dependency-license-audit.json', 'LICENSES/BODYPARTS3D_FULL_BODY.md',
  'app/body-explorer.tsx', 'lib/imaging-sync.ts', 'lib/didanix-atlas-adapter.ts',
  'lib/independent-study-links.ts', 'lib/body-review-context.ts', 'lib/body-review-api.ts',
]) assert.equal(readFileSync(path, 'utf8').replaceAll('\r\n', '\n'), old(path).toString().replaceAll('\r\n', '\n'), path);
console.log(JSON.stringify({changed, preserved, worksheets, identityRefusals, malformed, stale, storageCalls,
  bundlesUnchanged: catalog.bundles.length, clinicalApproval: false, websiteIntegrated: false}));
