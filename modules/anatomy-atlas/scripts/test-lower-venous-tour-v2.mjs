import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

assert.equal(process.argv.length, 2, 'No test-mode arguments are accepted');
const baseline = 'c22c42edc7a663be4cce788d882edb0a83b752fd';
const pinsPath = 'content/lower-venous-tour-v2-pins.json';
const catalogPath = 'public/models/bodyparts3d/full-body/catalog.json';
const git = (args, options = {}) => execFileSync('git', args, {
  windowsHide: true, maxBuffer: 64e6, ...options,
});
const committed = (revision, path) => git(['show', `${revision}:${path}`]);
const text = bytes => bytes.toString('utf8').replaceAll('\r\n', '\n');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const rawBytes = readFileSync(catalogPath);
const raw = JSON.parse(rawBytes);
const pins = JSON.parse(readFileSync(pinsPath, 'utf8'));
assert.equal(pins.schemaVersion, 1);
assert.equal(pins.baseline, baseline);
assert.equal(pins.tourRevision, 'right-lower-limb-venous-orientation-v2');
assert.equal(pins.entries.length, 9);
assert.equal(pins.contextEntries.length, 4);
assert.equal(pins.bundles.length, 7);
const veins = pins.entries, bones = pins.contextEntries, records = [...veins, ...bones];
const expectedVeins = [
  ['leg', 'small-saphenous', 'FMA44334', ['FJ2176']],
  ['leg', 'popliteal', 'FMA44328', ['FJ2171']],
  ['leg', 'anterior-tibial', 'FMA44336', ['FJ2132', 'FJ2193']],
  ['leg', 'posterior-tibial', 'FMA44338', ['FJ2173']],
  ['thigh', 'femoral', 'FMA21188', ['FJ2144']],
  ['thigh', 'deep-femoral', 'FMA51042', ['FJ2135']],
  ['thigh', 'great-saphenous', 'FMA21379', ['FJ2145']],
  ['pelvis', 'external-iliac', 'FMA18885', ['FJ3568']],
  ['pelvis', 'common-iliac', 'FMA21387', ['FJ3566']],
];
for (const [index, [region, slug, fma, files]] of expectedVeins.entries()) {
  const entry = veins[index];
  assert.equal(entry.id, `vm:anatomy:body:${region}:right:vessel:right-${slug}-vein`);
  assert.equal(entry.fmaId, fma);
  assert.deepEqual(entry.sources.map(source => source.file), files);
  assert.equal(entry.laterality, 'right');
  assert.equal(entry.validation.anatomicalReview, false);
}
const expectedBones = [['pelvis', 'hip-bone', 'FMA16586'], ['thigh', 'femur', 'FMA24474'],
  ['leg', 'tibia', 'FMA24477'], ['leg', 'fibula', 'FMA24480']];
for (const [index, [region, slug, fma]] of expectedBones.entries()) {
  assert.equal(bones[index].id, `vm:anatomy:body:${region}:right:bone:right-${slug}`);
  assert.equal(bones[index].fmaId, fma);
}
assert.equal(new Set(records.map(entry => entry.id)).size, 13);
assert.deepEqual(new Set(pins.bundles.map(bundle => bundle.id)), new Set([
  'pelvis-skeleton', 'thigh-skeleton', 'leg-skeleton', 'pelvis-vessels-recovery',
  'thigh-vessels-recovery', 'leg-vessels-recovery', 'deep-leg-veins',
]));
for (const bundle of pins.bundles) {
  const path = 'public' + bundle.url.split('?')[0], bytes = readFileSync(path);
  assert.equal(bytes.length, bundle.bytes, path);
  assert.equal(sha256(bytes), bundle.sha256, path);
  assert.deepEqual(bytes, committed(baseline, path), `${path}: original geometry`);
}

const compiled = await build({stdin: {contents:
  "export * from './lib/regional-tours';" +
  "export {lowerVenousTourMatches} from './lib/lower-venous-tour';" +
  "export {bodyDisplayCatalog} from './lib/body-display-catalog';" +
  "export {bodyLesson,bodyContent} from './app/body-content';" +
  "export {structures} from './app/anatomy-data';" +
  "export {dissectionProfiles} from './app/dissection-data';" +
  "export {contentTabs} from './lib/content-types';" +
  "export * from './lib/body-review-material';" +
  "export * from './lib/body-review-context';" +
  "export * from './lib/body-review-response';" +
  "export * from './lib/body-review-api';" +
  "export * from './lib/body-review-decisions';",
  resolveDir: process.cwd(), loader: 'ts'}, bundle: true, write: false,
  platform: 'node', format: 'esm'});
const current = await import('data:text/javascript;base64,' +
  Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const catalog = current.bodyDisplayCatalog(raw);
assert.equal(catalog.sourceVersion, pins.sourceVersion);
assert.deepEqual(catalog.coordinateSystem, pins.coordinateSystem);
assert.equal(catalog.license, pins.license);
for (const entry of records)
  assert.deepEqual(catalog.structures.filter(s => s.id === entry.id), [entry], entry.id);
for (const bundle of pins.bundles)
  assert.deepEqual(catalog.bundles.filter(b => b.id === bundle.id), [bundle], bundle.id);

const tour = current.lowerVenousTour;
assert(tour && typeof current.lowerVenousTourMatches === 'function');
assert.equal(tour.id, 'right-lower-limb-venous-orientation');
assert.equal(tour.region, 'whole-body');
assert.equal(tour.revision, pins.tourRevision);
assert.equal(tour.status, 'draft');
assert.deepEqual(tour.scopeRegions, [...new Set(records.flatMap(entry => entry.regions))]);
assert.deepEqual(tour.contextIds, bones.map(s => s.id));
assert.equal(tour.steps.length, 9);
assert.deepEqual(tour.steps.map(step => step.selectedId), veins.map(s => s.id));
assert.equal(new Set(tour.steps.map(step => step.id)).size, 9);
assert.deepEqual(tour.requiredDisplayBundles,
  Object.fromEntries(records.map(entry => [entry.id, entry.bundle])));
assert.match(tour.limitations, /revision.bound radiologist/i);
assert.match(tour.limitations, /no.{0,120}(?:registration|patient)/i);
assert.match(tour.limitations, /(?:not|no).{0,120}(?:continuous|validated).{0,40}(?:lumen|junction|network)/i);
assert.match(tour.limitations, /companion/i);
for (const step of tour.steps) {
  assert.equal(step.durationMs, 14000);
  assert.equal(step.fadeOthers, true);
  assert(step.title.trim() && step.caption.trim());
  assert(step.references.length > 0 && step.references.every(url => /^https:\/\//.test(url)));
  assert(step.frameIds.includes(step.selectedId));
  assert(step.frameIds.length >= 2, `${step.id}: target and a vein neighbour`);
  assert.equal(new Set(step.frameIds).size, step.frameIds.length);
  assert(step.frameIds.every(id => veins.some(entry => entry.id === id)), step.id);
}
assert.equal(current.lowerVenousTourMatches(catalog, tour), true);

const pathsWhere = (value, predicate, path = []) => [
  ...(predicate(value) ? [path] : []),
  ...(value && typeof value === 'object'
    ? Object.entries(value).flatMap(([key, child]) => pathsWhere(child, predicate, [...path, key])) : []),
];
const at = (value, path) => path.reduce((part, key) => part[key], value);
const replaceLeaf = original => typeof original === 'string' ? original + '-foreign'
  : typeof original === 'number' ? original + 0.01
    : original === null ? 'foreign' : !original;
let sourceRefusals = 0;
const refuse = (badCatalog = catalog, badTour = tour, label = '') => {
  assert.equal(current.lowerVenousTourMatches(badCatalog, badTour), false, label);
  sourceRefusals++;
};
for (const entry of records) {
  refuse({...catalog, structures: catalog.structures.filter(s => s.id !== entry.id)}, tour, `${entry.id}: absent`);
  refuse({...catalog, structures: [...catalog.structures, entry]}, tour, `${entry.id}: duplicate`);
  refuse({...catalog, structures: [...catalog.structures, {...entry, id: entry.id + '-alias'}]}, tour, `${entry.id}: FMA alias`);
  for (const path of pathsWhere(entry, value => value === null || typeof value !== 'object')) {
    const changed = structuredClone(entry), parent = at(changed, path.slice(0, -1));
    parent[path.at(-1)] = replaceLeaf(parent[path.at(-1)]);
    refuse({...catalog, structures: catalog.structures.map(s => s.id === entry.id ? changed : s)}, tour,
      `${entry.id}:${path.join('.')}`);
  }
  for (const path of pathsWhere(entry, Array.isArray)) {
    const changed = structuredClone(entry); at(changed, path).push('foreign');
    refuse({...catalog, structures: catalog.structures.map(s => s.id === entry.id ? changed : s)}, tour,
      `${entry.id}:${path.join('.')}: append`);
  }
  for (const path of pathsWhere(entry, value => value && typeof value === 'object' && !Array.isArray(value))) {
    const changed = structuredClone(entry); at(changed, path).unexpected = true;
    refuse({...catalog, structures: catalog.structures.map(s => s.id === entry.id ? changed : s)}, tour,
      `${entry.id}:${path.join('.')}: extra`);
    for (const key of Object.keys(at(entry, path))) {
      const omitted = structuredClone(entry); delete at(omitted, path)[key];
      refuse({...catalog, structures: catalog.structures.map(s => s.id === entry.id ? omitted : s)}, tour,
        `${entry.id}:${[...path, key].join('.')}: missing`);
    }
  }
}
for (const bundle of pins.bundles) {
  refuse({...catalog, bundles: catalog.bundles.filter(b => b.id !== bundle.id)}, tour, `${bundle.id}: missing`);
  refuse({...catalog, bundles: [...catalog.bundles, bundle]}, tour, `${bundle.id}: duplicate`);
  for (const path of pathsWhere(bundle, value => value === null || typeof value !== 'object')) {
    const changed = structuredClone(bundle), parent = at(changed, path.slice(0, -1));
    parent[path.at(-1)] = replaceLeaf(parent[path.at(-1)]);
    refuse({...catalog, bundles: catalog.bundles.map(b => b.id === bundle.id ? changed : b)}, tour,
      `${bundle.id}:${path.join('.')}`);
  }
  for (const path of pathsWhere(bundle, Array.isArray)) {
    const changed = structuredClone(bundle); at(changed, path).push('foreign');
    refuse({...catalog, bundles: catalog.bundles.map(b => b.id === bundle.id ? changed : b)}, tour,
      `${bundle.id}:${path.join('.')}: append`);
  }
  for (const path of pathsWhere(bundle, value => value && typeof value === 'object' && !Array.isArray(value))) {
    const changed = structuredClone(bundle); at(changed, path).unexpected = true;
    refuse({...catalog, bundles: catalog.bundles.map(b => b.id === bundle.id ? changed : b)}, tour,
      `${bundle.id}:${path.join('.')}: extra`);
    for (const key of Object.keys(at(bundle, path))) {
      const omitted = structuredClone(bundle); delete at(omitted, path)[key];
      refuse({...catalog, bundles: catalog.bundles.map(b => b.id === bundle.id ? omitted : b)}, tour,
        `${bundle.id}:${[...path, key].join('.')}: missing`);
    }
  }
}
for (const patch of [{sourceVersion: 'foreign'}, {license: 'foreign'}, {coordinateSystem: {}}])
  refuse({...catalog, ...patch}, tour, `catalog ${Object.keys(patch)[0]}`);
for (const mutate of [
  t => t.steps.reverse(), t => { t.steps[0].view = t.steps[0].view === 'left' ? 'right' : 'left'; },
  t => { t.steps[0].frameIds = [t.steps[0].selectedId]; },
  t => { t.steps[0].selectedId = bones[0].id; },
  t => { t.steps[0].caption += ' foreign'; },
  t => { t.steps[0].references = ['https://foreign.invalid']; },
  t => { t.steps[0].durationMs = 1; }, t => { t.steps[0].fadeOthers = false; },
  t => { t.contextIds = []; }, t => { t.scopeRegions = ['leg']; },
  t => { t.requiredDisplayBundles[veins[0].id] = 'foreign'; },
  t => { t.revision += '-forged'; }, t => { t.title += ' foreign'; },
]) { const changed = structuredClone(tour); mutate(changed); refuse(catalog, changed, 'tour mutation'); }
for (const path of pathsWhere(tour, value => value === null || typeof value !== 'object')) {
  const changed = structuredClone(tour), parent = at(changed, path.slice(0, -1));
  parent[path.at(-1)] = replaceLeaf(parent[path.at(-1)]);
  refuse(catalog, changed, `tour:${path.join('.')}`);
}
for (const path of pathsWhere(tour, Array.isArray)) {
  const changed = structuredClone(tour); at(changed, path).push('foreign');
  refuse(catalog, changed, `tour:${path.join('.')}: append`);
}
for (const path of pathsWhere(tour, value => value && typeof value === 'object' && !Array.isArray(value))) {
  const changed = structuredClone(tour); at(changed, path).unexpected = true;
  refuse(catalog, changed, `tour:${path.join('.')}: extra`);
  for (const key of Object.keys(at(tour, path))) {
    const omitted = structuredClone(tour); delete at(omitted, path)[key];
    refuse(catalog, omitted, `tour:${[...path, key].join('.')}: missing`);
  }
}

// A later edit to teaching cannot rewrite the historical admission event.
const featureCommit = git(['log', '--diff-filter=A', '-1', '--format=%H', '--', pinsPath],
  {encoding: 'utf8'}).trim();
const old = await exactSourceHistoryApi(baseline, 'regional-tour-review');
const feature = featureCommit
  ? await exactSourceHistoryApi(featureCommit, 'regional-tour-review') : current;
const featureRaw = featureCommit ? JSON.parse(committed(featureCommit, catalogPath)) : raw;
const featureCatalog = feature.bodyDisplayCatalog(featureRaw);
assert.deepEqual(featureRaw, JSON.parse(committed(baseline, catalogPath)));
if (featureCommit) assert.equal(text(committed(featureCommit, pinsPath)), text(readFileSync(pinsPath)));
assert.equal(feature.regionalTours.length, 50);
assert.equal(feature.regionalTours.reduce((n, entry) => n + entry.steps.length, 0), 304);
assert.equal(old.regionalTours.length, 50);
assert.equal(old.regionalTours.reduce((n, entry) => n + entry.steps.length, 0), 301);
assert.deepEqual(feature.regionalTours.filter(t => t.id !== tour.id),
  old.regionalTours.filter(t => t.id !== tour.id));
assert.deepEqual(feature.regionalTours.find(t => t.id === tour.id), tour);
assert.deepEqual(current.regionalTours.find(t => t.id === tour.id), tour);
assert.deepEqual(featureCatalog, old.catalog);
for (const bundle of featureCatalog.bundles) {
  const path = 'public' + bundle.url.split('?')[0];
  const bytes = featureCommit ? committed(featureCommit, path) : readFileSync(path);
  assert.equal(bytes.length, bundle.bytes, path);
  assert.equal(sha256(bytes), bundle.sha256, path);
  assert.deepEqual(bytes, committed(baseline, path), `${path}: admission geometry preserved`);
}
assert.deepEqual(feature.regionalTourStructures(featureCatalog, tour), [...bones, ...veins]);
const frames = feature.regionalTourStepFrames(featureCatalog, tour);
assert.equal(frames.length, 9);
for (const [index, step] of tour.steps.entries()) for (const id of step.frameIds) {
  const entry = veins.find(s => s.id === id); assert(entry, id);
  assert(entry.bounds.min.every((value, axis) => value >= frames[index].min[axis] &&
    entry.bounds.max[axis] <= frames[index].max[axis]), `${step.id}:${id}: frame bounds`);
}

for (const path of ['app/anatomy-data.ts', 'app/dissection-data.ts']) {
  assert.deepEqual(featureCommit ? committed(featureCommit, path) : readFileSync(path),
    committed(baseline, path), `${path}: admission source`);
}
const preservedPaths = git(['ls-tree', '-r', '--name-only', baseline, '--', 'app', 'lib', 'content'],
  {encoding: 'utf8'}).split(/\r?\n/).filter(path => /(?:nested|specimen|dissection|(?:leg|femoral)-venous-xray)/i.test(path));
assert(preservedPaths.length > 0);
for (const path of preservedPaths) {
  const before = committed(baseline, path);
  assert.deepEqual(featureCommit ? committed(featureCommit, path) : readFileSync(path), before,
    `${path}: admission preserved`);
}
assert.deepEqual(feature.structures, old.structures);
assert.deepEqual(feature.dissectionProfiles, old.dissectionProfiles);
assert.deepEqual(feature.contentTabs, old.contentTabs);
assert.equal(featureCatalog.structures.length, 1104);
assert.equal(featureCatalog.structures.length * feature.contentTabs.length, 9936);
const participants = new Set(records.map(s => s.id));
let changed = 0, preserved = 0, topics = 0, malformed = 0;
let stale = 0, forgedSaves = 0, forgedApprovals = 0, storageCalls = 0;
for (const structure of featureCatalog.structures) {
  const id = structure.id;
  const before = await old.bodyReviewMaterial(id), packet = await feature.bodyReviewMaterial(id);
  const oldContext = await old.bodyReviewContext(id), context = await feature.bodyReviewContext(id);
  assert.equal(packet.approval, false);
  assert.deepEqual(packet.source, before.source);
  assert.deepEqual(packet.topics, before.topics);
  assert.deepEqual(packet.reasoning, before.reasoning);
  topics += packet.topics.length;
  assert.deepEqual(packet.guidedTours.filter(row => row.tour.id !== tour.id),
    before.guidedTours.filter(row => row.tour.id !== tour.id));
  assert.equal(context.sourceHash, oldContext.sourceHash);
  if (!participants.has(id)) {
    assert.deepEqual(packet, before, id);
    assert.equal(context.teachingHash, oldContext.teachingHash);
    preserved++; continue;
  }
  changed++;
  assert.notEqual(context.teachingHash, oldContext.teachingHash);
  assert.notEqual(context.revisions.teaching, oldContext.revisions.teaching);
  const matching = packet.guidedTours.filter(row => row.tour.id === tour.id);
  assert.equal(matching.length, 1);
  const evidence = matching[0];
  assert.deepEqual(evidence.tour, tour);
  assert.deepEqual(evidence.structures, [...bones, ...veins]);
  assert.deepEqual(evidence.stepFrames, frames);
  assert.deepEqual(evidence.bundles, pins.bundles);
  assert.equal(evidence.transitionMs, 1800);
  assert.equal(evidence.transition, 'quintic-orbit');
  assert.equal(evidence.separation, 0);
  assert(await feature.parseBodyReviewResponse(packet, id));
  assert.equal(await feature.parseBodyReviewResponse(before, id), null);
  const at = packet.guidedTours.findIndex(row => row.tour.id === tour.id);
  for (const mutate of [
    p => p.guidedTours.splice(at, 1),
    p => p.guidedTours.push(structuredClone(evidence)),
    p => p.guidedTours[at].tour.steps.reverse(),
    p => { p.guidedTours[at].tour.steps[0].caption += ' foreign'; },
    p => { p.guidedTours[at].tour.steps[0].frameIds = [veins[0].id]; },
    p => { p.guidedTours[at].structures[0].sources[0].sha256 = '0'.repeat(64); },
    p => { p.guidedTours[at].bundles[0].sha256 = '0'.repeat(64); },
    p => { p.guidedTours[at].stepFrames[0].min[0] -= 1; },
    p => { p.guidedTours[at].transitionMs = 0; },
  ]) {
    const forged = structuredClone(packet); mutate(forged);
    assert.equal(await feature.parseBodyReviewResponse(forged, id), null);
    malformed++;
  }
  const decision = {catalogScope: context.catalogScope, structureId: id,
    track: 'teaching', expectedVersion: 0, materialHash: context.materialHash,
    revisionHash: context.revisions.teaching, checklistVersion: context.checklistVersion,
    draft: feature.blankBodyReview(context, 'teaching')};
  const save = async input => feature.postBodyDecision(new Request('https://atlas.test/api/body-decisions', {
    method: 'POST', headers: {origin: 'https://atlas.test', 'content-type': 'application/json',
      'oai-authenticated-user-id': 'SYNTHETIC_LOWER_VENOUS_TOUR_V2'}, body: JSON.stringify(input),
  }), {prepare() { storageCalls++; throw Error('Rejected decision reached storage'); }});
  for (const hashes of [
    {materialHash: oldContext.materialHash, revisionHash: oldContext.revisions.teaching},
    {materialHash: oldContext.materialHash},
    {revisionHash: oldContext.revisions.teaching},
  ]) { assert.equal((await save({...decision, ...hashes})).status, 409); stale++; }
  const forged = structuredClone(decision); forged.draft.checks.foreign = true;
  assert.equal((await save(forged)).status, 422); forgedSaves++;
  const approval = structuredClone(decision); approval.draft.status = 'approved';
  assert.equal((await save(approval)).status, 422); forgedApprovals++;
}
assert.deepEqual([changed, preserved, topics], [13, 1091, 9936]);
assert.deepEqual([malformed, stale, forgedSaves, forgedApprovals, storageCalls],
  [117, 39, 13, 13, 0]);
console.log(JSON.stringify({baseline, featureCommit: featureCommit || 'working-tree',
  tours: 50, stops: 304, preservedTours: 49, changedPackets: changed,
  preservedPackets: preserved, unchangedTopics: topics, sourceRefusals,
  preservedBundles: featureCatalog.bundles.length,
  malformedPacketsRefused: malformed, staleRefusalsBeforeStorage: stale,
  forgedSavesRefusedBeforeStorage: forgedSaves,
  forgedApprovalsRefusedBeforeStorage: forgedApprovals, storageCalls,
  clinicalApproval: false}));
