import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { build } from './workspace-test-build.mjs';

const result = await build({ stdin: {
  contents: `export { chestWallTour } from './lib/chest-wall-tour'; export { regionalTourStructures, regionalTourFrame } from './lib/regional-tours'; import raw from './public/models/bodyparts3d/full-body/catalog.json'; import { bodyDisplayCatalog } from './lib/body-display-catalog'; export const catalog=bodyDisplayCatalog(raw as any);`,
  resolveDir: process.cwd(), loader: 'ts',
}, bundle: true, write: false, platform: 'node', format: 'esm' });
const { chestWallTour: tour, catalog, regionalTourStructures, regionalTourFrame } = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
const raw = JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json', 'utf8'));
const baseline = JSON.parse(execFileSync('git', ['show', '94eae37:public/models/bodyparts3d/full-body/catalog.json'], { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 }));
const muscle = (side, name) => `vm:anatomy:body:thorax:${side}:muscle:${name}`;
const expected = [muscle('midline', 'external-intercostal-muscle'), muscle('midline', 'internal-intercostal-muscle'), muscle('midline', 'innermost-intercostal-muscle'), muscle('right', 'right-transversus-thoracis'), muscle('left', 'left-transversus-thoracis'), muscle('midline', 'diaphragm')];
const sternum = 'vm:anatomy:body:thorax:midline:bone:body-of-sternum';
const context = [sternum, ...['right', 'left'].map(side => `vm:anatomy:body:thorax:${side}:bone:${side}-fourth-rib`)];
assert.equal(tour.id, 'chest-wall-muscle-depth');
assert.equal(tour.revision, 'chest-wall-muscle-depth-v1');
assert.equal(tour.status, 'draft');
assert.equal(tour.region, 'thorax');
assert.deepEqual(tour.steps.map(s => s.selectedId), expected);
assert.deepEqual(tour.contextIds, context);
assert.deepEqual(tour.steps.map(s => s.view), ['right', 'right', 'right', 'posterior', 'posterior', 'superior']);
assert.equal(new Set(tour.steps.map(s => s.id)).size, 6);
const structures = regionalTourStructures(catalog, tour);
assert.equal(structures.length, 9);
assert.deepEqual(structures.map(s => s.id).sort(), [...expected, ...context].sort());
for (const s of structures) {
  assert(s.regions.includes('thorax'));
  assert.deepEqual(s, raw.structures.find(v => v.id === s.id), 'Display uses exact archived source record');
  assert.deepEqual(s, baseline.structures.find(v => v.id === s.id), 'Original IDs, source hashes, coordinates and draft validation retained');
  assert.equal(s.validation.anatomicalReview, false);
  assert.equal(s.validation.status, 'unvalidated');
  assert.equal(s.bundle, tour.requiredDisplayBundles[s.id]);
  const missing = { ...catalog, structures: catalog.structures.filter(v => v.id !== s.id) };
  assert.throws(() => regionalTourStructures(missing, tour));
  const wrongRegion = structuredClone(catalog);
  wrongRegion.structures.find(v => v.id === s.id).regions = ['abdomen'];
  assert.throws(() => regionalTourStructures(wrongRegion, tour));
  const wrongBundle = structuredClone(catalog);
  wrongBundle.structures.find(v => v.id === s.id).bundle = 'thorax-muscles-dissection';
  assert.throws(() => regionalTourStructures(wrongBundle, tour));
}
for (const id of expected.slice(0, 3)) {
  const s = structures.find(v => v.id === id);
  assert.equal(s.laterality, 'midline');
  assert.equal(s.sources.length, 2, 'Grouped bilateral source files remain grouped');
}
for (const [index, step] of tour.steps.entries()) {
  assert.equal(step.durationMs, 14000);
  assert.equal(step.fadeOthers, true);
  assert.deepEqual(step.references, ['https://anatomy.ttuhscep.edu/anatomytables/muscles_thorax.html']);
  assert.deepEqual(step.frameIds, index === 3 || index === 4 ? [step.selectedId, sternum] : [step.selectedId]);
  const frame = regionalTourFrame(catalog, tour, index);
  assert(frame.min.every((n, axis) => Number.isFinite(n) && n < frame.max[axis]));
  for (const frameIds of [[], ['missing'], [sternum], [step.selectedId, step.selectedId]]) {
    const altered = structuredClone(tour); altered.steps[index].frameIds = frameIds;
    assert.throws(() => regionalTourFrame(catalog, altered, index));
  }
}
const bundlePins = {
  'thorax-muscles': '3bbf7759e54e34272175de042ef4e26c24412b9f073a2f8eea3ce4fe79ebb682',
  'thorax-skeleton': '9c45f3aef04a0507414a6280b4866d31eda2a9df50ef61acc3071d5d909d12cd',
  'thorax-skeleton-recovery': '0ff2ab3d8b16b2c3af0b3320bc85b72512c54af5bfedc3f2159dd2316fa5de60',
};
for (const [id, sha] of Object.entries(bundlePins)) {
  const bundles = catalog.bundles.filter(b => b.id === id);
  assert.equal(bundles.length, 1);
  assert.deepEqual(bundles[0], baseline.bundles.find(b => b.id === id));
  assert.equal(bundles[0].sha256, sha);
  const bytes = await readFile('public' + bundles[0].url);
  assert.equal(bytes.length, bundles[0].bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), sha, 'Actual original model bytes unchanged');
  assert.throws(() => regionalTourStructures({ ...catalog, bundles: catalog.bundles.filter(b => b.id !== id) }, tour));
}
assert.deepEqual(Object.keys(tour).sort(), ['id', 'title', 'region', 'revision', 'status', 'description', 'limitations', 'contextIds', 'requiredDisplayBundles', 'steps'].sort(), 'No patient, entitlement, imaging or approval scope fields');
assert(structures.every(s => ['muscle', 'bone'].includes(s.category)), 'No segmented nerves or procedural additions');
assert.match(tour.limitations, /bilateral source groups, not a true unpaired muscle/);
assert.match(tour.limitations, /No segmented intercostal nerves, procedure, disease interpretation, breathing simulation, acquired scan or patient registration/);
assert.match(tour.limitations, /revision-bound radiologist review; no clinical approval/);
const captionWords = tour.steps.map(s => s.caption).join(' ').trim().split(/\s+/).length;
assert(captionWords <= 190, `Original source-derived captions limited to 190 words (${captionWords})`);
console.log(`Chest-wall draft: 6 exact targets, 3 contexts, frames/negative cases and 3 original model hashes pass; ${captionWords} caption words.`);
