import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { build } from './workspace-test-build.mjs';

const result = await build({ stdin: {
  contents: `export { intrinsicLarynxTour } from './lib/intrinsic-larynx-tour'; export { regionalTourStructures, regionalTourFrame } from './lib/regional-tours'; import raw from './public/models/bodyparts3d/full-body/catalog.json'; import { bodyDisplayCatalog } from './lib/body-display-catalog'; export const catalog=bodyDisplayCatalog(raw as any);`,
  resolveDir: process.cwd(), loader: 'ts',
}, bundle: true, write: false, platform: 'node', format: 'esm' });
const { intrinsicLarynxTour: tour, catalog, regionalTourStructures, regionalTourFrame } = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
const raw = JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json', 'utf8'));
const baseline = JSON.parse(execFileSync('git', ['show', '5a0952d7ff841e0aac20522faf2a4d4cfe030415:public/models/bodyparts3d/full-body/catalog.json'], { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 }));
const neck = (side, kind, name) => `vm:anatomy:body:head-neck:${side}:${kind}:${name}`;
const muscle = (side, name) => neck(side, 'muscle', side === 'midline' ? name : `${side}-${name}`);
const cricoid = neck('midline', 'cartilage', 'cricoid-cartilage');
const arytenoid = side => neck(side, 'cartilage', `${side}-arytenoid-cartilage`);
const expected = [
  ['right', 'posterior-crico-arytenoid', 'FMA46577'], ['left', 'posterior-crico-arytenoid', 'FMA46578'],
  ['right', 'lateral-crico-arytenoid', 'FMA46580'], ['left', 'lateral-crico-arytenoid', 'FMA46581'],
  ['midline', 'transverse-arytenoid', 'FMA46582'], ['right', 'oblique-arytenoid', 'FMA46584'], ['left', 'oblique-arytenoid', 'FMA46585'],
];
const targets = expected.map(([side, name]) => muscle(side, name));
const context = [cricoid, arytenoid('right'), arytenoid('left')];
assert.equal(tour.id, 'intrinsic-larynx-muscle-orientation');
assert.equal(tour.revision, 'intrinsic-larynx-muscle-orientation-v1');
assert.equal(tour.status, 'draft');
assert.equal(tour.region, 'head-neck');
assert.deepEqual(tour.steps.map(s => s.selectedId), targets);
assert.deepEqual(tour.contextIds, context);
assert.equal(new Set([...targets, ...context]).size, 10);
assert.equal(new Set(tour.steps.map(s => s.id)).size, 7);
assert.deepEqual(tour.steps.map(s => s.view), ['posterior', 'posterior', 'right', 'left', 'posterior', 'posterior', 'posterior']);
const structures = regionalTourStructures(catalog, tour);
assert.equal(structures.length, 10);
assert.deepEqual(structures.map(s => s.id).sort(), [...targets, ...context].sort());
const assertExactSource = candidate => {
  assert.deepEqual(candidate.coordinateSystem, baseline.coordinateSystem);
  assert.equal(candidate.sourceVersion, baseline.sourceVersion);
  for (const s of regionalTourStructures(candidate, tour)) assert.deepEqual(s, baseline.structures.find(v => v.id === s.id), 'Full displayed identity remains pinned to existing source');
};
assertExactSource(catalog);
for (const [side, name, fma] of expected) {
  const s = structures.find(v => v.id === muscle(side, name));
  assert.equal(s.fmaId, fma); assert.equal(s.nodeName, fma); assert.equal(s.laterality, side);
  assert.equal(s.category, 'muscle'); assert.equal(s.bundle, 'head-neck-muscles');
}
for (const [id, fma, side] of [[cricoid, 'FMA9615', 'midline'], [arytenoid('right'), 'FMA55113', 'right'], [arytenoid('left'), 'FMA55114', 'left']]) {
  const s = structures.find(v => v.id === id);
  assert.equal(s.fmaId, fma); assert.equal(s.laterality, side); assert.equal(s.category, 'cartilage');
  assert.equal(s.provenance.recovered, true); assert.equal(s.bundle, 'head-neck-connective-recovery');
}
assert.deepEqual(Object.keys(tour.requiredDisplayBundles).sort(), [...targets, ...context].sort());
for (const s of structures) {
  assert(s.regions.includes('head-neck'));
  assert.deepEqual(raw.structures.find(v => v.id === s.id), baseline.structures.find(v => v.id === s.id));
  assert.equal(s.validation.anatomicalReview, false); assert.equal(s.validation.status, 'unvalidated');
  assert.equal(s.bundle, tour.requiredDisplayBundles[s.id]);
  assert.throws(() => regionalTourStructures({ ...catalog, structures: catalog.structures.filter(v => v.id !== s.id) }, tour));
  assert.throws(() => regionalTourStructures({ ...catalog, structures: [...catalog.structures, s] }, tour));
  for (const [field, value] of [['regions', ['abdomen']], ['bundle', 'head-neck-organs-recovery']]) {
    const altered = structuredClone(catalog); altered.structures.find(v => v.id === s.id)[field] = value;
    assert.throws(() => regionalTourStructures(altered, tour));
  }
  for (const mutate of [v => { v.sources[0].sha256 = '0'.repeat(64); }, v => { v.bounds.min[0] += 0.01; }, v => { v.laterality = 'unspecified'; }, v => { v.validation.anatomicalReview = true; }]) {
    const altered = structuredClone(catalog); mutate(altered.structures.find(v => v.id === s.id));
    assert.throws(() => assertExactSource(altered), 'Source pin rejects source, geometry, laterality and review mutation');
  }
}
for (const [index, stop] of tour.steps.entries()) {
  assert.equal(stop.durationMs, 14000); assert.equal(stop.fadeOthers, true);
  assert.deepEqual(stop.references, ['https://anatomy.ttuhscep.edu/schemes/larynx_tables.html']);
  const [side, name] = expected[index];
  assert.deepEqual(stop.frameIds, [stop.selectedId, ...(name.includes('crico-arytenoid') ? [cricoid, arytenoid(side)] : [arytenoid('right'), arytenoid('left')])]);
  const frame = regionalTourFrame(catalog, tour, index);
  assert(frame.min.every((n, axis) => Number.isFinite(n) && Number.isFinite(frame.max[axis]) && n < frame.max[axis]));
  for (const id of stop.frameIds) {
    const bounds = structures.find(s => s.id === id).bounds;
    assert(bounds.min.every((n, axis) => n >= frame.min[axis] && bounds.max[axis] <= frame.max[axis]), 'Frame includes selected muscle and local cartilage landmarks');
  }
  for (const frameIds of [[], ['missing'], [cricoid], [stop.selectedId, stop.selectedId]]) {
    const altered = structuredClone(tour); altered.steps[index].frameIds = frameIds;
    assert.throws(() => regionalTourFrame(catalog, altered, index));
  }
}
for (const index of [-1, 7, 0.5, NaN]) assert.throws(() => regionalTourFrame(catalog, tour, index));
const bundlePins = {
  'head-neck-muscles': 'ad355b54f865461f5433bd1062bb206bde1967f6d4dc003840e7788800a69adb',
  'head-neck-connective-recovery': '2243b05c7b505ee666ac4a36becfe5298735558b0e86b4d8e4476115f372ce05',
};
for (const [id, sha] of Object.entries(bundlePins)) {
  const bundles = catalog.bundles.filter(b => b.id === id); assert.equal(bundles.length, 1);
  assert.deepEqual(bundles[0], baseline.bundles.find(b => b.id === id)); assert.equal(bundles[0].sha256, sha);
  const bytes = await readFile('public' + bundles[0].url.split('?')[0]);
  assert.equal(bytes.length, bundles[0].bytes); assert.equal(createHash('sha256').update(bytes).digest('hex'), sha);
  assert.throws(() => regionalTourStructures({ ...catalog, bundles: catalog.bundles.filter(b => b.id !== id) }, tour));
  assert.throws(() => regionalTourStructures({ ...catalog, bundles: [...catalog.bundles, bundles[0]] }, tour));
}
assert.deepEqual(Object.keys(tour).sort(), ['id', 'title', 'region', 'revision', 'status', 'description', 'limitations', 'contextIds', 'requiredDisplayBundles', 'steps'].sort());
assert.match(tour.limitations, /Vocal-fold movement, mucosa, lumen, airway patency, phonation, endoscopy/);
assert.match(tour.limitations, /patient registration and procedural guidance are not modeled or established/);
assert.match(tour.limitations, /revision-bound radiologist review; no clinical approval/);
const teachingWords = [tour.title, tour.description, ...tour.steps.flatMap(s => [s.title, s.caption])].join(' ').trim().split(/\s+/).length;
assert(teachingWords <= 190, `Original source-derived teaching limited to 190 words (${teachingWords})`);
console.log(`Intrinsic larynx draft: 7 exact targets, 3 cartilage contexts, local finite frames/negative cases and 2 existing model hashes pass; ${teachingWords} teaching words.`);
