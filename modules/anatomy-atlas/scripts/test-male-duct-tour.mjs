import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { build } from './workspace-test-build.mjs';

const parent = '8da967df7f4f419014ea03b323d239732a787be1';
const parentJson = path => JSON.parse(execFileSync('git', ['show', `${parent}:${path}`], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }));
const rawPath = 'public/models/bodyparts3d/full-body/catalog.json';
const additionPath = 'public/models/bodyparts3d/deferent-ducts/catalog.json';
const baseline = parentJson(rawPath), addition = parentJson(additionPath);
const baselineStructures = [...baseline.structures, ...addition.structures];
const baselineBundles = [...baseline.bundles, ...addition.bundles];
const result = await build({ stdin: {
  contents: `export { maleDuctTour } from './lib/male-duct-tour'; export { regionalTourStructures, regionalTourFrame } from './lib/regional-tours'; import raw from './public/models/bodyparts3d/full-body/catalog.json'; import { bodyDisplayCatalog } from './lib/body-display-catalog'; export const catalog=bodyDisplayCatalog(raw as any);`,
  resolveDir: process.cwd(), loader: 'ts',
}, bundle: true, write: false, platform: 'node', format: 'esm' });
const { maleDuctTour: tour, catalog, regionalTourStructures, regionalTourFrame } = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
const pelvic = (side, name) => `vm:anatomy:body:pelvis:${side}:organ:${name}`;
const expected = [
  [pelvic('right', 'right-testis'), 'FMA7211', 'right', 'pelvis-organs-recovery', '1dc84c4d16139902662f08c97bc2581cb698cf8411855bcca5474e154f4ad86e'],
  [pelvic('right', 'right-epididymis'), 'FMA18256', 'right', 'pelvis-organs-gaps', '23469ccd7ac340ef3f4184fb850c7658420e9f7f294d91331f10cb3187824bf5'],
  [pelvic('right', 'right-deferent-duct'), 'FMA19235', 'right', 'deferent-ducts', 'f5fa6eca33541ceffdd87a910e4fb2e804f3bcd4418ee06555dcbb0b60aa581d'],
  [pelvic('right', 'right-seminal-vesicle'), 'FMA19387', 'right', 'pelvis-organs-recovery', '183e4a11e0a75a76dcdaf33f46afb7f5f30430c5e0b1ff19237be1ebef7e72ba'],
  [pelvic('unpaired', 'prostate'), 'FMA9600', 'unpaired', 'pelvis-organs-recovery', 'f20448e74cf6b6096248361bc4f618c1d7f4c1acac77f785abc43e40835b13cb'],
  [pelvic('unpaired', 'urethra'), 'FMA19667', 'unpaired', 'pelvis-organs-gaps', '987ce1b01511f6ea323ba5a7a7438ba3df72d0cdc853985e08ca2965feb63c93'],
  [pelvic('unpaired', 'urinary-bladder'), 'FMA15900', 'unpaired', 'pelvis-organs', 'b49f40d01bf28550094a7d17901e33e7066039f3a0fb8cf44d79fff2472f9926'],
  ['vm:anatomy:body:abdomen:right:organ:right-ureter', 'FMA15571', 'right', 'abdomen-organs-recovery', '780889608ce700962d98be95432f94d58ca121b240099adeb83d8278ca8a779d'],
];
const [testis, epididymis, duct, vesicle, prostate, urethra, bladder, ureter] = expected.map(row => row[0]);
const targets = expected.slice(0, 6).map(row => row[0]), context = [bladder, ureter];
assert.equal(tour.id, 'male-pelvic-duct-landmarks');
assert.equal(tour.revision, 'male-pelvic-duct-landmarks-v1');
assert.equal(tour.region, 'pelvis'); assert.equal(tour.status, 'draft');
assert.deepEqual(tour.steps.map(s => s.selectedId), targets);
assert.deepEqual(tour.contextIds, context);
assert.equal(new Set([...targets, ...context]).size, 8);
assert.equal(new Set(tour.steps.map(s => s.id)).size, 6);
assert.deepEqual(tour.steps.map(s => s.view), ['right', 'posterior', 'right', 'posterior', 'right', 'right']);
assert.deepEqual(Object.keys(tour.requiredDisplayBundles).sort(), [...targets, ...context].sort());
const structures = regionalTourStructures(catalog, tour);
assert.equal(structures.length, 8);
const assertExactSource = candidate => {
  assert.deepEqual(candidate.coordinateSystem, baseline.coordinateSystem);
  assert.equal(candidate.sourceVersion, baseline.sourceVersion);
  assert.equal(candidate.license, baseline.license);
  for (const s of regionalTourStructures(candidate, tour))
    assert.deepEqual(s, baselineStructures.find(v => v.id === s.id), 'Full displayed identity pinned to immutable parent');
};
assertExactSource(catalog);
assert.deepEqual(JSON.parse(await readFile(rawPath, 'utf8')), baseline);
assert.deepEqual(JSON.parse(await readFile(additionPath, 'utf8')), addition);
for (const [id, fma, side, bundle, sourceSha] of expected) {
  const s = structures.find(v => v.id === id);
  assert.equal(s.fmaId, fma); assert.equal(s.nodeName, fma); assert.equal(s.laterality, side);
  assert.equal(s.category, 'organ'); assert.equal(s.bundle, bundle);
  assert.equal(s.bundle, tour.requiredDisplayBundles[id]);
  assert.deepEqual(s.sources.map(v => v.sha256), [sourceSha]);
  assert(s.regions.includes('pelvis'));
  assert.equal(s.validation.anatomicalReview, false); assert.equal(s.validation.status, 'unvalidated');
  assert.throws(() => regionalTourStructures({ ...catalog, structures: catalog.structures.filter(v => v.id !== id) }, tour));
  assert.throws(() => regionalTourStructures({ ...catalog, structures: [...catalog.structures, s] }, tour));
  for (const [field, value] of [['regions', ['abdomen']], ['bundle', 'head-neck-muscles']]) {
    const altered = structuredClone(catalog); altered.structures.find(v => v.id === id)[field] = value;
    assert.throws(() => regionalTourStructures(altered, tour));
  }
  for (const mutate of [v => { v.sources[0].sha256 = '0'.repeat(64); }, v => { v.bounds.min[0] += 0.01; }, v => { v.laterality = 'unspecified'; }, v => { v.validation.anatomicalReview = true; }]) {
    const altered = structuredClone(catalog); mutate(altered.structures.find(v => v.id === id));
    assert.throws(() => assertExactSource(altered));
  }
}
assert.equal(structures.find(s => s.id === ureter).region, 'abdomen');
const frames = [[testis, epididymis], [epididymis, testis], [duct, bladder], [vesicle, bladder, prostate], [prostate, bladder], [urethra, prostate]];
const ductsReference = 'https://training.seer.cancer.gov/anatomy/reproductive/male/duct.html';
const glandsReference = 'https://training.seer.cancer.gov/anatomy/reproductive/male/glands.html';
for (const [index, stop] of tour.steps.entries()) {
  assert.equal(stop.durationMs, 14000); assert.equal(stop.fadeOthers, true);
  assert.deepEqual(stop.references, [index === 3 || index === 4 ? glandsReference : ductsReference]);
  assert.deepEqual(stop.frameIds, frames[index]);
  assert(!stop.frameIds.includes(ureter));
  if (index !== 2) assert(!stop.frameIds.includes(duct));
  const frame = regionalTourFrame(catalog, tour, index);
  assert(frame.min.every((n, axis) => Number.isFinite(n) && Number.isFinite(frame.max[axis]) && n < frame.max[axis]));
  for (const id of stop.frameIds) {
    const bounds = structures.find(s => s.id === id).bounds;
    assert(bounds.min.every((n, axis) => n >= frame.min[axis] && bounds.max[axis] <= frame.max[axis]));
  }
  for (const frameIds of [[], ['missing'], [index === 0 ? bladder : testis], [stop.selectedId, stop.selectedId]]) {
    const altered = structuredClone(tour); altered.steps[index].frameIds = frameIds;
    assert.throws(() => regionalTourFrame(catalog, altered, index));
  }
}
for (const index of [-1, 6, 0.5, NaN]) assert.throws(() => regionalTourFrame(catalog, tour, index));
const bundlePins = {
  'pelvis-organs-recovery': 'd2876cb12fa3f6c71170d18bd6813f96783c47fe12ddf68263bf12e0cae98629',
  'pelvis-organs-gaps': '28a4c4665dacfa483546cc8166dd31698c7a0fdb1e678cf9f22e5a2c63f88abc',
  'deferent-ducts': '53d2cdcb86c04d78671705b34f5b82c0130427735c8c7986553b3a042d8c7544',
  'pelvis-organs': '90baaeb1c521a6b2546e99576bce4b231c6e068b4fa3d48dbd4cb7eb355f93c3',
  'abdomen-organs-recovery': '9ed6f0864a2b37edc4c36ffbb84fdab9cacf34c6069d93455f1ffcb6eee711ab',
};
for (const [id, sha] of Object.entries(bundlePins)) {
  const bundles = catalog.bundles.filter(b => b.id === id); assert.equal(bundles.length, 1);
  assert.deepEqual(bundles[0], baselineBundles.find(b => b.id === id)); assert.equal(bundles[0].sha256, sha);
  const bytes = await readFile('public' + bundles[0].url.split('?')[0]);
  assert.equal(bytes.length, bundles[0].bytes); assert.equal(createHash('sha256').update(bytes).digest('hex'), sha);
  assert.throws(() => regionalTourStructures({ ...catalog, bundles: catalog.bundles.filter(b => b.id !== id) }, tour));
  assert.throws(() => regionalTourStructures({ ...catalog, bundles: [...catalog.bundles, bundles[0]] }, tour));
}
const meshRows = execFileSync('git', ['ls-tree', '-r', parent, '--', 'public/models'], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }).trim().split('\n').filter(row => /\.(glb|gltf|obj|stl|ply|bin)$/i.test(row));
assert(meshRows.length > 0);
for (const row of meshRows) {
  const [metadata, path] = row.split('\t'), sha = metadata.split(' ')[2], bytes = await readFile(path);
  const actual = createHash('sha1').update(Buffer.from(`blob ${bytes.length}\0`)).update(bytes).digest('hex');
  assert.equal(actual, sha, `Immutable parent mesh: ${path}`);
}
assert.deepEqual(Object.keys(tour).sort(), ['id', 'title', 'region', 'revision', 'status', 'description', 'limitations', 'contextIds', 'requiredDisplayBundles', 'steps'].sort());
assert.match(tour.limitations, /Not a continuous sperm-flow simulation/);
assert.match(tour.limitations, /Efferent ducts, ejaculatory ducts, lumen, patency, cord coverings, fertility, operative guidance and scan registration are absent/);
assert.match(tour.limitations, /seminal vesicle is an accessory gland, not a serial sperm transit stop/);
assert.match(tour.limitations, /revision-bound radiologist review; no clinical approval/);
const counts = [ductsReference, glandsReference].map(reference => {
  const words = [tour.title, tour.description, ...tour.steps.filter(s => s.references.includes(reference)).flatMap(s => [s.title, s.caption])].join(' ').trim().split(/\s+/).length;
  assert(words <= 180, `Original teaching per reference limited to 180 words (${words})`);
  return words;
});
console.log(`Male duct draft: 6 exact targets, 2 contexts, local finite frames/negative cases, 5 existing bundle hashes and ${meshRows.length} unchanged parent meshes pass; per-reference teaching words ${counts.join('/')}.`);
