import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { build } from './workspace-test-build.mjs';

const result = await build({ stdin: {
  contents: `export { orbitalTour } from './lib/orbital-tour'; export { regionalTourStructures, regionalTourFrame } from './lib/regional-tours'; import raw from './public/models/bodyparts3d/full-body/catalog.json'; import { bodyDisplayCatalog } from './lib/body-display-catalog'; export { bodyDisplayCatalog }; export const catalog=bodyDisplayCatalog(raw as any);`,
  resolveDir: process.cwd(), loader: 'ts',
}, bundle: true, write: false, platform: 'node', format: 'esm' });
const { orbitalTour: tour, catalog, bodyDisplayCatalog, regionalTourStructures, regionalTourFrame } = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
const raw = JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json', 'utf8'));
const baselineFile = path => JSON.parse(execFileSync('git', ['show', `d3d3a750:${path}`], { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 }));
const baseline = baselineFile('public/models/bodyparts3d/full-body/catalog.json');
const correction = JSON.parse(await readFile('public/models/bodyparts3d/eye-layers/display-correction.json', 'utf8'));
assert.deepEqual(correction, baselineFile('public/models/bodyparts3d/eye-layers/display-correction.json'));
const muscle = name => `vm:anatomy:body:head-neck:right:muscle:right-${name}`;
const expected = ['medial-rectus', 'lateral-rectus', 'superior-rectus', 'inferior-rectus', 'superior-oblique', 'inferior-oblique'].map(muscle);
const globe = 'vm:anatomy:body:head-neck:right:organ:right-eyeball';
assert.equal(tour.id, 'right-orbital-muscle-orientation');
assert.equal(tour.revision, 'right-orbital-muscle-orientation-v1');
assert.equal(tour.status, 'draft');
assert.equal(tour.region, 'head-neck');
assert.deepEqual(tour.steps.map(s => s.selectedId), expected);
assert.deepEqual(tour.contextIds, [globe]);
assert.deepEqual(tour.steps.map(s => s.view), ['left', 'right', 'superior', 'inferior', 'superior', 'inferior']);
assert.equal(new Set(tour.steps.map(s => s.id)).size, 6);
const structures = regionalTourStructures(catalog, tour);
assert.equal(structures.length, 7);
assert.deepEqual(structures.map(s => s.id).sort(), [...expected, globe].sort());
const assertExactSource = candidate => {
  assert.deepEqual(candidate.coordinateSystem, baseline.coordinateSystem);
  assert.equal(candidate.sourceVersion, baseline.sourceVersion);
  for (const s of regionalTourStructures(candidate, tour)) {
    assert.deepEqual(s, s.id === globe ? correction.replacement : baseline.structures.find(v => v.id === s.id), 'Full current display identity must match its existing source pin');
  }
};
assertExactSource(catalog);
for (const s of structures) {
  assert.equal(s.laterality, 'right');
  assert(s.regions.includes('head-neck'));
  assert.deepEqual(raw.structures.find(v => v.id === s.id), baseline.structures.find(v => v.id === s.id), 'Archived source unchanged');
  assert.equal(s.validation.anatomicalReview, false);
  assert.equal(s.validation.status, 'unvalidated');
  assert.equal(s.bundle, tour.requiredDisplayBundles[s.id]);
  assert.throws(() => regionalTourStructures({ ...catalog, structures: catalog.structures.filter(v => v.id !== s.id) }, tour));
  const duplicate = { ...catalog, structures: [...catalog.structures, s] };
  assert.throws(() => regionalTourStructures(duplicate, tour));
  for (const [field, value] of [['regions', ['abdomen']], ['bundle', 'head-neck-organs-recovery']]) {
    const altered = structuredClone(catalog); altered.structures.find(v => v.id === s.id)[field] = value;
    assert.throws(() => regionalTourStructures(altered, tour));
  }
  for (const mutate of [v => { v.sources[0].sha256 = '0'.repeat(64); }, v => { v.bounds.min[0] += 0.01; }, v => { v.laterality = 'left'; }, v => { v.validation.anatomicalReview = true; }]) {
    const altered = structuredClone(catalog); mutate(altered.structures.find(v => v.id === s.id));
    assert.throws(() => assertExactSource(altered), 'Pinned source comparison rejects altered source/geometry/laterality/review');
  }
}
assert.throws(() => regionalTourStructures(raw, tour), 'Raw compound globe cannot substitute for corrected current display');
assert.deepEqual(raw.structures.find(s => s.id === globe), correction.original);
for (const mutate of [v => { v.sources[0].sha256 = '0'.repeat(64); }, v => { v.bounds.max[0] += 0.01; }]) {
  const altered = structuredClone(raw); mutate(altered.structures.find(s => s.id === globe));
  assert.throws(() => bodyDisplayCatalog(altered), 'Display pipeline refuses mutated archived globe');
}
for (const [index, step] of tour.steps.entries()) {
  assert.equal(step.durationMs, 14000);
  assert.equal(step.fadeOthers, true);
  assert.deepEqual(step.references, ['https://anatomy.ttuhscep.edu/nervous_system/eye_tables.html']);
  assert.deepEqual(step.frameIds, [step.selectedId, globe]);
  const frame = regionalTourFrame(catalog, tour, index);
  assert(frame.min.every((n, axis) => Number.isFinite(n) && n < frame.max[axis]));
  for (const id of step.frameIds) {
    const bounds = structures.find(s => s.id === id).bounds;
    assert(bounds.min.every((n, axis) => n >= frame.min[axis] && bounds.max[axis] <= frame.max[axis]), 'Each close-up includes target and globe');
  }
  for (const frameIds of [[], ['missing'], [globe], [step.selectedId, step.selectedId]]) {
    const altered = structuredClone(tour); altered.steps[index].frameIds = frameIds;
    assert.throws(() => regionalTourFrame(catalog, altered, index));
  }
}
const bundlePins = {
  'head-neck-muscles': 'ad355b54f865461f5433bd1062bb206bde1967f6d4dc003840e7788800a69adb',
  'eye-corrected-parent': 'f5759ee53e5d8bd893830e767783cbc49f50e18e84d1eb216229fe5acdae9ac7',
};
for (const [id, sha] of Object.entries(bundlePins)) {
  const bundles = catalog.bundles.filter(b => b.id === id);
  assert.equal(bundles.length, 1);
  assert.deepEqual(bundles[0], id === correction.bundle.id ? correction.bundle : baseline.bundles.find(b => b.id === id));
  assert.equal(bundles[0].sha256, sha);
  const bytes = await readFile('public' + bundles[0].url.split('?')[0]);
  assert.equal(bytes.length, bundles[0].bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), sha, 'Existing model bytes unchanged');
  assert.throws(() => regionalTourStructures({ ...catalog, bundles: catalog.bundles.filter(b => b.id !== id) }, tour));
}
assert.deepEqual(Object.keys(tour).sort(), ['id', 'title', 'region', 'revision', 'status', 'description', 'limitations', 'contextIds', 'requiredDisplayBundles', 'steps'].sort(), 'No new assets, patient, entitlement, imaging or approval scope');
assert(structures.every(s => ['muscle', 'organ'].includes(s.category)), 'No inferred nerves or pulley surfaces');
assert.match(tour.limitations, /Gaze, muscle forces, diagnosis, acquired imaging and patient registration are not modeled/);
assert.match(tour.limitations, /revision-bound radiologist review; no clinical approval/);
const captionWords = tour.steps.map(s => s.caption).join(' ').trim().split(/\s+/).length;
assert(captionWords <= 180, `Original source-derived captions limited to 180 words (${captionWords})`);
const teachingWords = [tour.title, tour.description, ...tour.steps.flatMap(s => [s.title, s.caption])].join(' ').trim().split(/\s+/).length;
assert(teachingWords <= 190, `Source-derived tour teaching limited to 190 words (${teachingWords})`);
console.log(`Orbital draft: 6 exact targets, corrected globe context, local frames/negative cases and 2 existing model hashes pass; ${captionWords} caption words, ${teachingWords} teaching words.`);
