import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

const baseline = 'ae787ef86b6cf7e662ddff5af8a1e8ff19ae97bb';
const REQUIRED_PIN_HASH = '87df5b06e49b9f5fa28dcaf226fd582fa5e9f7eb8b80a40301190906a811a48d';
const REQUIRED_TRANSITION_HASH = 'f0bf6ae655f55e959dd0a4ff38269232dccc7a6c32d0cbbc2369f9cdd88fe193';
const hash = value => createHash('sha256').update(
  typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value),
).digest('hex');
const pins = JSON.parse(readFileSync('content/foot-ultrasound-followup-pins.json'));
const transition = JSON.parse(readFileSync('content/foot-ultrasound-followup.transition.json'));
assert.equal(hash(pins), REQUIRED_PIN_HASH);
assert.equal(hash(transition), REQUIRED_TRANSITION_HASH);
assert.equal(pins.baseline, baseline);
assert.equal(transition.baseline, baseline);
assert.equal(transition.sourcePinsHash, hash(pins));

const before = await exactSourceHistoryApi(baseline, 'review-security');
const compiled = await build({
  stdin: {contents: `export * from './lib/foot-ultrasound-followup';
export * from './content/foot-ultrasound-followup';
export * from './lib/toe-bone-ultrasound';
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
const sourceCatalog = JSON.parse(readFileSync('public/models/bodyparts3d/full-body/catalog.json'));
assert.equal(sourceCatalog.sourceVersion, pins.sourceVersion);
assert.equal(sourceCatalog.license, pins.license);
assert.deepEqual(sourceCatalog.coordinateSystem, pins.coordinateSystem);
assert.deepEqual(sourceCatalog.bundles.filter(bundle => bundle.id === 'foot-skeleton'), pins.bundles);
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
assert.equal(entries.size, 12);
assert.equal(pins.entries.length, 12);
assert.equal(transition.entries.length, 12);
const familyCounts = {cuboid: 2, medialCuneiform: 2, intermediateCuneiform: 2, lateralCuneiform: 2, halluxNote: 4};
assert.deepEqual([...new Set(pins.entries.map(e => e.family))].sort(), Object.keys(familyCounts).sort());
for (const [family, count] of Object.entries(familyCounts)) assert.equal(pins.entries.filter(e => e.family === family).length, count);
assert.deepEqual(new Set(pins.entries.map(e => e.identity.laterality)), new Set(['left', 'right']));
let changed = 0, preserved = 0;
for (const row of reconstructed.body) for (const tab of now.contentTabs) {
  const structure = catalog.structures.find(s => s.id === row.id);
  const entry = entries.get(structure.id);
  const prior = before.bodyLesson(structure, tab);
  const current = now.bodyLesson(structure, tab);
  if (entry && Object.hasOwn(entry.previous, tab)) {
    assert.equal(tab, 'ultrasound');
    assert.deepEqual(prior, entry.previous[tab]);
    assert.deepEqual(current, now.footUltrasoundFollowupLesson(structure, tab));
    const recorded = transition.entries.find(e => e.id === structure.id && e.tab === tab);
    assert(recorded);
    assert.equal(recorded.fmaId, structure.fmaId);
    assert.equal(hash(current), recorded.draftHash);
    const {readiness, ...shown} = current;
    assert.deepEqual(now.bodyContent(structure, tab), shown);
    if (entry.family === 'halluxNote') {
      assert.equal(prior.readiness, 'draft');
      assert.equal(current.readiness, 'draft');
      const {note: oldNote, ...oldOther} = prior;
      const {note: newNote, ...newOther} = current;
      assert.deepEqual(newOther, oldOther, 'Hallux correction changes note only');
      assert.notEqual(newNote, oldNote);
      assert.match(newNote, /hallux.*(?:IP|interphalangeal)|(?:IP|interphalangeal).*hallux/i);
      assert.match(newNote, /no middle phalanx|without a middle phalanx/i);
      assert.doesNotMatch(newNote, /three.phalangeal|biphalangeal|fifth.toe/i);
    } else {
      assert.equal(prior.readiness, 'pending');
      assert.equal(current.readiness, 'draft');
    }
    row.topics[tab] = prior;
    changed++;
  } else {
    assert.deepEqual(current, prior, `${structure.id}:${tab}`);
    preserved++;
  }
}
assert.equal(changed, 12);
assert.equal(preserved, 9924);
assert.equal(hash(reconstructed), pins.beforeAllTeachingSnapshotHash);
for (const s of catalog.structures.filter(s => s.region === 'foot' && s.bundle === 'foot-skeleton' && s.system === 'skeleton' && s.category === 'bone')) {
  assert.equal(now.bodyLesson(s, 'ultrasound').readiness, 'draft');
}
const sesamoids = catalog.structures.filter(s => ['FMA45097', 'FMA45098'].includes(s.fmaId));
assert.equal(sesamoids.length, 2);
for (const s of sesamoids) {
  assert.equal(s.sources.length, 2, 'Grouped component identity remains unresolved');
  assert.deepEqual(now.bodyLesson(s, 'ultrasound'), before.bodyLesson(s, 'ultrasound'));
  assert.equal(now.footUltrasoundFollowupLesson(s, 'ultrasound'), undefined);
}
for (const s of catalog.structures.filter(s => s.region === 'foot' && !entries.has(s.id))) {
  assert.equal(now.footUltrasoundFollowupLesson(s, 'ultrasound'), undefined);
}

const pathsWhere = (value, predicate, path = []) => [
  ...(predicate(value) ? [path] : []),
  ...(value && typeof value === 'object'
    ? Object.entries(value).flatMap(([key, child]) => pathsWhere(child, predicate, [...path, key])) : []),
];
const at = (value, path) => path.reduce((part, key) => part[key], value);
let identityRefusals = 0, expectedRefusals = 0, malformed = 0, stale = 0, storageCalls = 0, worksheets = 0;
for (const {identity, previous} of pins.entries) {
  assert.deepEqual(catalog.structures.find(s => s.id === identity.id), identity);
  assert.deepEqual(Object.keys(previous), ['ultrasound']);
  assert.equal(identity.sources.length, 1);
  assert.match(identity.sources[0].file, /^FJ\d+[A-Z]?$/);
  assert.match(identity.fmaId, /^FMA\d+$/);
  const draft = now.footUltrasoundFollowupLesson(identity, 'ultrasound');
  assert.equal(draft.readiness, 'draft');
  const clean = structuredClone(draft);
  draft.bullets.push('foreign');
  draft.citations.push('foreign');
  assert.deepEqual(now.footUltrasoundFollowupLesson(identity, 'ultrasound'), clean, 'Fresh arrays');
  for (const path of pathsWhere(identity, value => value === null || typeof value !== 'object')) {
    const foreign = structuredClone(identity);
    const parent = at(foreign, path.slice(0, -1));
    const key = path.at(-1);
    const original = parent[key];
    parent[key] = typeof original === 'string' ? `${original}-foreign`
      : typeof original === 'number' ? original + 0.01
        : original === null ? 'foreign' : !original;
    assert.equal(now.footUltrasoundFollowupLesson(foreign, 'ultrasound'), undefined, path.join('.'));
    identityRefusals++;
  }
  for (const path of pathsWhere(identity, Array.isArray)) {
    const foreign = structuredClone(identity);
    at(foreign, path).push('foreign');
    assert.equal(now.footUltrasoundFollowupLesson(foreign, 'ultrasound'), undefined, path.join('.'));
    identityRefusals++;
  }
  const foreign = structuredClone(identity);
  foreign.unexpected = true;
  assert.equal(now.footUltrasoundFollowupLesson(foreign, 'ultrasound'), undefined);
  identityRefusals++;
  expectedRefusals += pathsWhere(identity, value => value === null || typeof value !== 'object').length
    + pathsWhere(identity, Array.isArray).length + 1;
  for (const tab of now.contentTabs.filter(tab => tab !== 'ultrasound')) {
    assert.equal(now.footUltrasoundFollowupLesson(identity, tab), undefined);
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
    const foreignMaterial = structuredClone(material);
    mutate(foreignMaterial);
    assert.equal(await now.parseBodyReviewResponse(foreignMaterial, identity.id), null);
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
      headers: {origin: 'https://atlas.test', 'content-type': 'application/json', 'oai-authenticated-user-id': 'SYNTHETIC_FOOT_US_FOLLOWUP'},
      body: JSON.stringify({...packet, ...hashes}),
    }), {prepare() { storageCalls++; throw Error('Stale decision reached storage'); }});
    assert.equal(response.status, 409);
    stale++;
  }
}
assert.equal(identityRefusals, expectedRefusals);
assert.equal(malformed, 60);
assert.equal(stale, 36);
assert.equal(storageCalls, 0);
assert.equal(now.footUltrasoundFollowupLesson({id: 'foreign'}, 'ultrasound'), undefined);
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
assert.equal(worksheets, 12);
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
]) {
  assert.equal(readFileSync(path, 'utf8').replaceAll('\r\n', '\n'), old(path).toString().replaceAll('\r\n', '\n'), path);
}
for (const reference of Object.values(now.footUltrasoundFollowupReferences)) {
  assert.match(reference.licence, /^CC BY(?: 4\.0)?$/);
}
console.log(JSON.stringify({changed, preserved, worksheets, identityRefusals, malformed, stale, storageCalls,
  bundlesUnchanged: catalog.bundles.length, footSkeletonUltrasoundDrafts: 54, clinicalApproval: false, websiteIntegrated: false}));
