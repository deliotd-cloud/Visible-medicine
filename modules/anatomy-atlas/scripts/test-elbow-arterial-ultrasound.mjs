import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

const baseline = '4897aacb28b4d99d34b893493b8706ede54db970';
// Replace these only with independently reviewed, fixed values from the completed pins/transition.
const REQUIRED_PIN_HASH = '2fd05a7c5574f9f2b844de936d84142fbb2c92a34da92898732d1e218f0d4ab4';
const REQUIRED_TRANSITION_HASH = 'ee305ee40a823221b5833a230decaa5548b33c25d797dd7c78710083eca1fa47';
const REQUIRED_BEFORE_SNAPSHOT_HASH = '32ac5060801b9976880cb9e1b476a6aa306fc7ef1e698d2125a5b445aeaf37a6';
const hash = value => createHash('sha256').update(
  typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value),
).digest('hex');
const pins = JSON.parse(readFileSync('content/elbow-arterial-ultrasound-pins.json'));
assert.match(REQUIRED_PIN_HASH, /^[a-f0-9]{64}$/, 'Pin the completed source pins hash');
assert.equal(hash(pins), REQUIRED_PIN_HASH);
assert.equal(pins.baseline, baseline);
assert.match(REQUIRED_TRANSITION_HASH, /^[a-f0-9]{64}$/, 'Pin the completed transition hash');
const transition = JSON.parse(readFileSync('content/elbow-arterial-ultrasound.transition.json'));
assert.equal(hash(transition), REQUIRED_TRANSITION_HASH);
assert.equal(transition.baseline, baseline);
assert.equal(transition.sourcePinsHash, REQUIRED_PIN_HASH);
assert.match(REQUIRED_BEFORE_SNAPSHOT_HASH, /^[a-f0-9]{64}$/, 'Pin the historical teaching snapshot hash');

const before = await exactSourceHistoryApi(baseline, 'review-security');
const completed = await exactSourceHistoryApi('c4aa4ed6a2d4831e51e8c877fbcfa0d66d265bf6', 'review-security');
const compiled = await build({
  stdin: {contents: `export * from './lib/elbow-arterial-ultrasound';
export * from './content/elbow-arterial-ultrasound';
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
const catalog = now.bodyDisplayCatalog(rawCatalog);
for (const bundle of pins.bundles) assert.deepEqual(catalog.bundles.find(b => b.id === bundle.id), bundle);
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
assert.equal(pins.beforeAllTeachingSnapshotHash, REQUIRED_BEFORE_SNAPSHOT_HASH);
assert.equal(hash(snapshot(before)), REQUIRED_BEFORE_SNAPSHOT_HASH);
const reconstructed = snapshot(completed);
const entries = new Map(pins.entries.map(entry => [entry.identity.id, entry]));
const families = {
  superiorUlnarCollateral: ['FMA22707', 'FMA22708'],
  inferiorUlnarCollateral: ['FMA22712', 'FMA22713'],
  posteriorUlnarRecurrent: ['FMA22804', 'FMA22805'],
  radialRecurrent: ['FMA22764', 'FMA22766'],
};
assert.equal(pins.entries.length, 8);
assert.equal(entries.size, 8);
assert.equal(transition.entries.length, 8);
const previousDisplayPins = JSON.parse(old('content/body-review-display-pins.json'));
const currentDisplayPins = JSON.parse(execFileSync('git', ['show', 'c4aa4ed6a2d4831e51e8c877fbcfa0d66d265bf6:content/body-review-display-pins.json'], {windowsHide: true}));
assert.equal(currentDisplayPins.pins.length, previousDisplayPins.pins.length);
const priorById = new Map(previousDisplayPins.pins.map(p => [p.structureId, p]));
let changedPins = 0;
for (const pin of currentDisplayPins.pins) {
  const prior = priorById.get(pin.structureId);
  assert(prior);
  if (entries.has(pin.structureId)) {
    assert.notEqual(pin.sha256, prior.sha256);
    changedPins++;
  } else assert.deepEqual(pin, prior);
}
assert.equal(changedPins, 8);
assert.deepEqual([...new Set(pins.entries.map(e => e.family))].sort(), Object.keys(families).sort());
for (const [family, fmaIds] of Object.entries(families)) {
  const members = pins.entries.filter(e => e.family === family);
  assert.deepEqual(members.map(e => e.identity.fmaId).sort(), [...fmaIds].sort());
  assert.deepEqual(new Set(members.map(e => e.identity.laterality)), new Set(['left', 'right']));
}
assert.deepEqual(transition.entries.map(e => e.id).sort(), [...entries.keys()].sort());

let changed = 0, preserved = 0;
const byId = new Map(catalog.structures.map(s => [s.id, s]));
for (const row of reconstructed.body) for (const tab of now.contentTabs) {
  const structure = byId.get(row.id);
  const entry = entries.get(row.id);
  const prior = before.bodyLesson(structure, tab);
  const current = completed.bodyLesson(structure, tab);
  if (entry && tab === 'ultrasound') {
    assert.deepEqual(prior, entry.previous);
    assert.equal(prior.readiness, 'pending');
    assert.equal(current.readiness, 'draft');
    assert.deepEqual(current, now.elbowArterialUltrasoundLesson(structure, tab));
    assert.deepEqual(now.bodyLesson(structure, tab), current, 'Current elbow lesson remains completed');
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
assert.equal(changed, 8);
assert.equal(preserved, 9928);
assert.equal(changed + preserved, 9936);
assert.equal(hash(reconstructed), REQUIRED_BEFORE_SNAPSHOT_HASH, 'Entire previous teaching snapshot must reconstruct exactly');

const pathsWhere = (value, predicate, path = []) => [
  ...(predicate(value) ? [path] : []),
  ...(value && typeof value === 'object'
    ? Object.entries(value).flatMap(([key, child]) => pathsWhere(child, predicate, [...path, key])) : []),
];
const at = (value, path) => path.reduce((part, key) => part[key], value);
let identityRefusals = 0, malformed = 0, stale = 0, storageCalls = 0, worksheets = 0;
for (const {identity} of pins.entries) {
  assert.deepEqual(byId.get(identity.id), identity);
  const clean = now.elbowArterialUltrasoundLesson(identity, 'ultrasound');
  assert.equal(clean.readiness, 'draft');
  clean.bullets.push('foreign');
  clean.citations.push('foreign');
  assert.deepEqual(now.elbowArterialUltrasoundLesson(identity, 'ultrasound'), now.bodyLesson(identity, 'ultrasound'), 'Fresh lesson arrays');
  for (const path of pathsWhere(identity, value => value === null || typeof value !== 'object')) {
    const foreign = structuredClone(identity);
    const parent = at(foreign, path.slice(0, -1));
    const key = path.at(-1);
    const original = parent[key];
    parent[key] = typeof original === 'string' ? `${original}-foreign`
      : typeof original === 'number' ? original + 0.01
        : original === null ? 'foreign' : !original;
    assert.equal(now.elbowArterialUltrasoundLesson(foreign, 'ultrasound'), undefined, path.join('.'));
    identityRefusals++;
  }
  for (const path of pathsWhere(identity, Array.isArray)) {
    const foreign = structuredClone(identity);
    at(foreign, path).push('foreign');
    assert.equal(now.elbowArterialUltrasoundLesson(foreign, 'ultrasound'), undefined, path.join('.'));
    identityRefusals++;
  }
  if (identity.sources.length > 1) {
    const reordered = structuredClone(identity);
    reordered.sources.reverse();
    assert.equal(now.elbowArterialUltrasoundLesson(reordered, 'ultrasound'), undefined, 'Ordered source identity');
    identityRefusals++;
  }
  const foreign = structuredClone(identity);
  foreign.unexpected = true;
  assert.equal(now.elbowArterialUltrasoundLesson(foreign, 'ultrasound'), undefined);
  identityRefusals++;
  for (const tab of now.contentTabs.filter(tab => tab !== 'ultrasound'))
    assert.equal(now.elbowArterialUltrasoundLesson(identity, tab), undefined);

  const material = await now.bodyReviewMaterial(identity.id);
  const completedMaterial = await completed.bodyReviewMaterial(identity.id);
  for (const field of ['source', 'reasoning', 'guidedTours', 'topics'])
    assert.deepEqual(material[field], completedMaterial[field], `Current elbow ${field} remains completed`);
  assert.equal(material.fingerprints.teaching, completedMaterial.fingerprints.teaching);
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
        'oai-authenticated-user-id': 'SYNTHETIC_ELBOW_ARTERIAL_US'}, body: JSON.stringify({...packet, ...oldHashes}),
    }), {prepare() { storageCalls++; throw Error('Stale decision reached storage'); }});
    assert.equal(response.status, 409);
    stale++;
  }
}
assert(identityRefusals > 200);
assert.equal(malformed, 40);
assert.equal(stale, 24);
assert.equal(storageCalls, 0);
assert.equal(now.elbowArterialUltrasoundLesson({id: 'foreign'}, 'ultrasound'), undefined);
for (const structure of catalog.structures) {
  const prior = await before.bodyReviewMaterial(structure.id);
  const current = await completed.bodyReviewMaterial(structure.id);
  for (const key of ['source', 'reasoning', 'guidedTours']) assert.deepEqual(current[key], prior[key]);
  assert.equal(current.approval, false);
  if (entries.has(structure.id)) {
    assert.notEqual(current.fingerprints.teaching, prior.fingerprints.teaching);
    worksheets++;
  } else {
    assert.deepEqual(current.topics, prior.topics);
    assert.equal(current.fingerprints.teaching, prior.fingerprints.teaching);
    assert.equal(now.elbowArterialUltrasoundLesson(structure, 'ultrasound'), undefined);
  }
}
assert.equal(worksheets, 8);
assert.equal(catalog.structures.length - worksheets, 1096);
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
