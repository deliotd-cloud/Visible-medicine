import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';

const baseline = 'd3d7ef2b22ed5bfe872aa6fa4b54fb69d8747cda';
const old = path => execFileSync('git', ['show', `${baseline}:${path}`], { maxBuffer: 32e6, windowsHide: true });
// Preserve the complete authored 31-tour epoch, including all application
// modules and review metadata. The new thoracic suite independently checks
// current 32-tour material and all 1,104 current review packets.
const authored = 'c52c9c690d790e4e921bde7ed5a943ef30a95001';
const [api, before] = await Promise.all([
  exactSourceHistoryApi(authored, 'regional-tour-security'),
  exactSourceHistoryApi(baseline, 'regional-tour-security'),
]);
const tour = api.coronaryArterialTour;
assert(tour, 'Register and export coronaryArterialTour');
const pins = JSON.parse(readFileSync('content/coronary-arterial-study-pins.json', 'utf8'));
const expectedFmas = ['FMA3802', 'FMA3855', 'FMA3862', 'FMA3895', 'FMA7088'];
assert.deepEqual(pins.entries.map(s => s.fmaId), expectedFmas);
assert.deepEqual(pins, JSON.parse(old('content/coronary-arterial-study-pins.json')));
const targetIds = pins.entries.slice(0, 4).map(s => s.id);
const heartId = pins.entries[4].id;
const participants = [...targetIds, heartId];
assert.equal(tour.id, 'coronary-arterial-orientation');
assert.equal(tour.revision, 'coronary-arterial-orientation-v1');
assert.equal(tour.region, 'thorax');
assert.equal(tour.status, 'draft');
assert.deepEqual(tour.contextIds, [heartId]);
assert.deepEqual(tour.steps.map(s => s.selectedId), [targetIds[0], targetIds[1], targetIds[2], targetIds[3], targetIds[3], targetIds[0]]);
assert.equal(new Set(tour.steps.map(s => s.id)).size, 6);
assert.deepEqual(tour.requiredDisplayBundles, Object.fromEntries(pins.entries.map(s => [s.id, s.bundle])));
assert.equal(before.regionalTours.length, 30);
assert.equal(before.regionalTours.reduce((n, t) => n + t.steps.length, 0), 177);
assert.equal(api.regionalTours.length, 31);
assert.equal(api.regionalTours.reduce((n, t) => n + t.steps.length, 0), 183);
assert.deepEqual(api.regionalTours.filter(t => t.id !== tour.id), before.regionalTours);
assert.deepEqual(api.regionalToursFor('thorax').filter(t => t.id === tour.id), [tour]);
for (const region of api.catalog.regions)
  assert.equal(api.regionalTourFor(region.id)?.id, before.regionalTourFor(region.id)?.id);

const catalogPath = 'public/models/bodyparts3d/full-body/catalog.json';
assert.deepEqual(readFileSync(catalogPath), old(catalogPath));
assert.equal(api.catalog.structures.length, 1104);
assert.deepEqual(api.catalog, before.catalog);
const selected = api.regionalTourStructures(api.catalog, tour);
const selectedPins = [pins.entries[4], ...pins.entries.slice(0, 4)];
assert.deepEqual(selected.map(s => s.id), selectedPins.map(s => s.id));
assert.deepEqual(selected.map(s => s.fmaId), selectedPins.map(s => s.fmaId));
assert.deepEqual(selected, selectedPins);
assert(selected.every(s => s.regions.length === 1 && s.regions[0] === 'thorax' && !s.validation.anatomicalReview));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
for (const pin of pins.bundles) {
  const bundle = api.catalog.bundles.find(b => b.id === pin.id);
  assert.deepEqual(bundle, pin);
  const path = 'public' + bundle.url.split('?')[0];
  const bytes = readFileSync(path);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(sha256(bytes), bundle.sha256);
  assert.deepEqual(bytes, old(path));
}
let sourceRefusals = 0;
const refuseSource = catalog => {
  assert.throws(() => api.regionalTourStructures(catalog, tour));
  sourceRefusals++;
};
for (const pin of pins.entries) {
  const s = api.catalog.structures.find(x => x.id === pin.id);
  refuseSource({ ...api.catalog, structures: api.catalog.structures.filter(x => x.id !== s.id) });
  refuseSource({ ...api.catalog, structures: [...api.catalog.structures, s] });
  for (const patch of [
    { fmaId: 'FMA0' }, { regions: ['abdomen'] }, { bundle: 'foreign' },
    { sources: [...s.sources, s.sources[0]] },
    { sources: s.sources.map((source, i) => i ? source : { ...source, sha256: '0'.repeat(64) }) },
    { provenance: { ...s.provenance, license: 'unlicensed' } },
  ]) refuseSource({ ...api.catalog, structures: api.catalog.structures.map(x => x.id === s.id ? { ...x, ...patch } : x) });
}
for (const pin of pins.bundles) {
  const bundle = api.catalog.bundles.find(b => b.id === pin.id);
  refuseSource({ ...api.catalog, bundles: api.catalog.bundles.filter(b => b.id !== pin.id) });
  refuseSource({ ...api.catalog, bundles: [...api.catalog.bundles, bundle] });
  refuseSource({ ...api.catalog, bundles: api.catalog.bundles.map(b => b.id === pin.id ? { ...b, sha256: '0'.repeat(64) } : b) });
}
for (const patch of [
  { sourceVersion: 'other' }, { license: 'other' },
  { coordinateSystem: { ...api.catalog.coordinateSystem, unitsPerMillimetre: 1 } },
]) refuseSource({ ...api.catalog, ...patch });
for (const mutate of [
  t => { t.steps[0].caption += ' forged'; },
  t => { t.steps.reverse(); },
  t => { t.revision += '-forged'; },
  t => { t.requiredDisplayBundles[heartId] = 'foreign'; },
  t => { t.steps[0].frameIds = [targetIds[1]]; },
]) {
  const altered = structuredClone(tour);
  mutate(altered);
  assert.throws(() => api.regionalTourStructures(api.catalog, altered));
  sourceRefusals++;
}
// Even a mutation of the exported registry object cannot redefine admission.
const originalCaption = tour.steps[0].caption;
tour.steps[0].caption += ' registry drift';
assert.throws(() => api.regionalTourStructures(api.catalog, tour));
sourceRefusals++;
tour.steps[0].caption = originalCaption;

const frames = api.regionalTourStepFrames(api.catalog, tour);
assert.equal(frames.length, 6);
for (const [i, step] of tour.steps.entries()) {
  assert(Number.isSafeInteger(step.durationMs) && step.durationMs > 0);
  assert.equal(step.fadeOthers, true);
  assert(step.references.length > 0);
  assert(step.frameIds.length > 0 && step.frameIds.includes(step.selectedId));
  assert.equal(new Set(step.frameIds).size, step.frameIds.length);
  assert(step.frameIds.every(id => participants.includes(id)));
  assert.deepEqual(api.regionalTourFrame(api.catalog, tour, i), frames[i]);
  for (const id of step.frameIds) {
    const bounds = selected.find(s => s.id === id).bounds;
    assert(bounds.min.every((v, axis) => v >= frames[i].min[axis] && bounds.max[axis] <= frames[i].max[axis]));
  }
}
assert.match(tour.limitations, /revision-bound radiologist (review|sign-off)/);

let topics = 0, changed = 0, unchanged = 0, packetRefusals = 0, stale = 0;
const storage = { prepare() { throw Error('Stale synthetic teaching decision reached storage'); } };
for (const s of api.catalog.structures) {
  const now = await api.bodyReviewMaterial(s.id);
  const prior = await before.bodyReviewMaterial(s.id);
  assert.deepEqual(now.source, prior.source);
  assert.deepEqual(now.topics, prior.topics);
  assert.deepEqual(now.reasoning, prior.reasoning);
  topics += now.topics.length;
  assert.equal(now.approval, false);
  assert(await api.parseBodyReviewResponse(now, s.id), 'Every current transport packet is accepted');
  assert.deepEqual(now.guidedTours.filter(e => e.tour.id !== tour.id), prior.guidedTours);
  const participant = participants.includes(s.id);
  assert.equal(now.guidedTours.length, prior.guidedTours.length + Number(participant));
  const current = await api.bodyReviewContext(s.id);
  const previous = await before.bodyReviewContext(s.id);
  assert.equal(current.sourceHash, previous.sourceHash);
  assert.equal(current.revisions.imaging, null);
  if (!participant) {
    assert.deepEqual(now, prior, 'Entire unrelated worksheet packet remains exact');
    assert.equal(current.teachingHash, previous.teachingHash);
    assert.equal(current.revisions.teaching, previous.revisions.teaching);
    unchanged++;
    continue;
  }
  changed++;
  assert.notEqual(current.teachingHash, previous.teachingHash);
  assert.notEqual(current.revisions.teaching, previous.revisions.teaching);
  assert(await api.parseBodyReviewResponse(now, s.id));
  const index = now.guidedTours.findIndex(e => e.tour.id === tour.id);
  const evidence = now.guidedTours[index];
  assert.deepEqual(evidence.tour, tour);
  assert.deepEqual(evidence.structures, selected);
  assert.deepEqual(Object.fromEntries(evidence.bundles.map(b => [b.id, b])),
    Object.fromEntries(pins.bundles.map(b => [b.id, b])));
  assert.equal(evidence.stepFrames.length, 6);
  assert.equal(evidence.transitionMs, 1800);
  assert.equal(evidence.transition, 'quintic-orbit');
  assert.equal(evidence.separation, 0);
  for (const mutate of [
    p => p.guidedTours.splice(index, 1),
    p => p.guidedTours.push(structuredClone(evidence)),
    p => p.guidedTours[index].tour.steps.reverse(),
    p => { p.guidedTours[index].tour.steps[0].caption += ' forged'; },
    p => { p.guidedTours[index].tour.revision += '-forged'; },
    p => { p.guidedTours[index].tour.steps[0].frameIds = [targetIds[1]]; },
    p => { p.guidedTours[index].structures[0].sources[0].sha256 = '0'.repeat(64); },
    p => { p.guidedTours[index].stepFrames[0].min[0] -= 1; },
    p => { p.guidedTours[index].transition = 'linear'; },
    p => { p.guidedTours[index].transitionMs = 0; },
    p => { p.guidedTours[index].separation = 1; },
  ]) {
    const forged = structuredClone(now);
    mutate(forged);
    assert.equal(await api.parseBodyReviewResponse(forged, s.id), null);
    packetRefusals++;
  }
  const payload = {
    catalogScope: current.catalogScope, structureId: s.id, track: 'teaching', expectedVersion: 0,
    materialHash: current.materialHash, revisionHash: previous.revisions.teaching,
    checklistVersion: current.checklistVersion, draft: api.blankBodyReview(current, 'teaching'),
  };
  const response = await api.postBodyDecision(new Request('https://atlas.test/api/body-decisions', {
    method: 'POST', headers: { origin: 'https://atlas.test', 'content-type': 'application/json',
      'oai-authenticated-user-id': 'SYNTHETIC_CORONARY_TOUR_TEST' }, body: JSON.stringify(payload),
  }), storage);
  assert.equal(response.status, 409);
  stale++;
}
assert.deepEqual({ topics, changed, unchanged, stale }, { topics: 9936, changed: 5, unchanged: 1099, stale: 5 });
console.log(JSON.stringify({ tour: tour.id, tours: 31, stops: 183, participants: 5,
  unchangedTopics: topics, unchangedWorksheets: unchanged, sourceRefusals,
  packetRefusals, staleTeachingRefusedBeforeStorage: stale, clinicalApproval: false }));
