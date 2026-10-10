import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { build } from './workspace-test-build.mjs';

const baseline = 'de82626457fb60c3b92b4e4d87a0016b6c3c09ce';
const old = path => execFileSync('git', ['show', `${baseline}:${path}`], { maxBuffer: 32e6, windowsHide: true });
const entry = `export * from './lib/regional-tours';
export * from './lib/body-review-material';export * from './lib/body-review-context';
export * from './lib/body-review-response';export * from './lib/body-review-decisions';
export * from './lib/body-review-api';
import raw from './public/models/bodyparts3d/full-body/catalog.json';
import {bodyDisplayCatalog} from './lib/body-display-catalog';
export const catalog=bodyDisplayCatalog(raw as any);`;
async function load(previous = false) {
  const result = await build({
    stdin: { contents: entry, resolveDir: process.cwd(), loader: 'ts' },
    bundle: true, write: false, platform: 'node', format: 'esm',
    plugins: previous ? [{ name: 'pre-thoracic-spine-tour', setup(builder) {
      builder.onLoad({ filter: /regional-tours\.ts$/, namespace: 'workspace-test' }, args => ({
        contents: old('lib/regional-tours.ts').toString('utf8'), loader: 'ts', resolveDir: dirname(args.path),
      }));
    } }] : [],
  });
  return import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
}

const [api, before] = await Promise.all([load(), load(true)]);
const tour = api.thoracicSpineTour;
assert(tour, 'Register and export thoracicSpineTour');
const pins = JSON.parse(readFileSync('content/thoracic-spine-tour-pins.json', 'utf8'));
assert.equal(pins.baseline, baseline);
assert.equal(pins.schemaVersion, 1);
assert.deepEqual(pins.entries.map(s => s.fmaId),
  ['FMA9165', 'FMA9187', 'FMA9922', 'FMA9945', 'FMA9991', 'FMA10014',
    'FMA10059', 'FMA10081', 'FMA10458', 'FMA13502', 'FMA13505']);
assert.deepEqual(pins.bundles.map(b => b.id), ['spine-skeleton', 'spine-connective-gaps']);
const ids = pins.entries.map(s => s.id);
const bones = ids.slice(0, 8);
const discs = ids.slice(8);
const selectedIds = [bones[0], discs[0], discs[1], discs[2], bones[6], bones[7]];
const frameIds = [
  [bones[0], bones[1], discs[0]],
  [bones[0], bones[1], discs[0]],
  [bones[2], bones[3], discs[1]],
  [bones[4], bones[5], discs[2]],
  [bones[6], bones[7]],
  [bones[6], bones[7]],
];
assert.equal(tour.id, 'thoracic-spine-discs-orientation');
assert.equal(tour.revision, 'thoracic-spine-discs-orientation-v1');
assert.equal(tour.region, 'spine');
assert.equal(tour.status, 'draft');
assert.deepEqual(tour.contextIds, bones);
assert.deepEqual(tour.steps.map(s => s.selectedId), selectedIds);
assert.deepEqual(tour.steps.map(s => s.frameIds), frameIds);
assert.equal(new Set(tour.steps.map(s => s.id)).size, 6);
assert.deepEqual(tour.requiredDisplayBundles, Object.fromEntries(pins.entries.map(s => [s.id, s.bundle])));
assert.equal(before.regionalTours.length, 31);
assert.equal(before.regionalTours.reduce((n, t) => n + t.steps.length, 0), 183);
assert.equal(api.regionalTours.length, 32);
assert.equal(api.regionalTours.reduce((n, t) => n + t.steps.length, 0), 189);
assert.deepEqual(api.regionalTours.filter(t => t.id !== tour.id), before.regionalTours);
assert.deepEqual(api.regionalToursFor('spine').filter(t => t.id === tour.id), [tour]);
for (const region of api.catalog.regions)
  assert.equal(api.regionalTourFor(region.id)?.id, before.regionalTourFor(region.id)?.id);

const catalogPath = 'public/models/bodyparts3d/full-body/catalog.json';
assert.deepEqual(readFileSync(catalogPath), old(catalogPath));
assert.equal(api.catalog.structures.length, 1104);
assert.deepEqual(api.catalog, before.catalog);
const selected = api.regionalTourStructures(api.catalog, tour);
assert.deepEqual(selected.map(s => s.id), ids);
assert.deepEqual(selected, pins.entries);
assert(selected.every(s => s.regions.includes('spine') && !s.validation.anatomicalReview));
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
  t => { t.requiredDisplayBundles[bones[0]] = 'foreign'; },
  t => { t.steps[0].frameIds = [bones[0]]; },
]) {
  const altered = structuredClone(tour);
  mutate(altered);
  assert.throws(() => api.regionalTourStructures(api.catalog, altered));
  sourceRefusals++;
}
const originalCaption = tour.steps[0].caption;
tour.steps[0].caption += ' registry drift';
assert.throws(() => api.regionalTourStructures(api.catalog, tour));
sourceRefusals++;
tour.steps[0].caption = originalCaption;

const frames = api.regionalTourStepFrames(api.catalog, tour);
assert.equal(frames.length, 6);
for (const [i, step] of tour.steps.entries()) {
  assert.equal(step.durationMs, 14000);
  assert.equal(step.fadeOthers, true);
  assert(step.references.length > 0);
  assert.deepEqual(step.frameIds, frameIds[i]);
  assert.deepEqual(api.regionalTourFrame(api.catalog, tour, i), frames[i]);
  for (const id of step.frameIds) {
    const bounds = selected.find(s => s.id === id).bounds;
    assert(bounds.min.every((v, axis) => v >= frames[i].min[axis] && bounds.max[axis] <= frames[i].max[axis]));
  }
}
assert.match(tour.limitations, /source vertebral labels|named.level|named level/i);
assert.match(tour.limitations, /whole discs?|full.disc|complete disc/i);
assert.match(tour.limitations, /radiologist (review|sign.off)/i);
assert.match(tour.limitations, /registration/i);

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
  const participant = ids.includes(s.id);
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
  const index = now.guidedTours.findIndex(e => e.tour.id === tour.id);
  const evidence = now.guidedTours[index];
  assert.deepEqual(evidence.tour, tour);
  assert.deepEqual(evidence.structures, selected);
  assert.deepEqual(Object.fromEntries(evidence.bundles.map(b => [b.id, b])),
    Object.fromEntries(pins.bundles.map(b => [b.id, b])));
  assert.deepEqual(evidence.stepFrames, frames);
  assert.equal(evidence.transitionMs, 1800);
  assert.equal(evidence.transition, 'quintic-orbit');
  assert.equal(evidence.separation, 0);
  for (const mutate of [
    p => p.guidedTours.splice(index, 1),
    p => p.guidedTours.push(structuredClone(evidence)),
    p => p.guidedTours[index].tour.steps.reverse(),
    p => { p.guidedTours[index].tour.steps[0].caption += ' forged'; },
    p => { p.guidedTours[index].tour.revision += '-forged'; },
    p => { p.guidedTours[index].tour.steps[0].frameIds = [bones[0]]; },
    p => { p.guidedTours[index].structures[0].sources[0].sha256 = '0'.repeat(64); },
    p => { p.guidedTours[index].stepFrames[0].min[0] -= 1; },
    p => { p.guidedTours[index].bundles[0].sha256 = '0'.repeat(64); },
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
      'oai-authenticated-user-id': 'SYNTHETIC_THORACIC_TOUR_TEST' }, body: JSON.stringify(payload),
  }), storage);
  assert.equal(response.status, 409);
  stale++;
}
assert.deepEqual({ topics, changed, unchanged, stale }, { topics: 9936, changed: 11, unchanged: 1093, stale: 11 });
console.log(JSON.stringify({ tour: tour.id, tours: 32, stops: 189, participants: 11,
  unchangedTopics: topics, unchangedWorksheets: unchanged, sourceRefusals,
  packetRefusals, staleTeachingRefusedBeforeStorage: stale, clinicalApproval: false }));
