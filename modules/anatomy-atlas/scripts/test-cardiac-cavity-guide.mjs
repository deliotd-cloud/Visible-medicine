import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { readFile } from 'node:fs/promises';

const entry = "export { cardiacCavityGuide, cardiacCavityGuideReferences } from './lib/cardiac-cavity-guide'; export { cardiacCatalog } from './lib/cardiac';";
async function loadWithPins(mutate) {
  const compiled = await build({
    stdin: { contents: entry, resolveDir: process.cwd(), loader: 'ts' },
    bundle: true, platform: 'node', format: 'esm', write: false,
    plugins: [{ name: 'shared-source-pins', setup(build) {
      build.onLoad({ filter: /nested-teaching-bindings\.v1\.json$/ }, async ({ path }) => {
        const pins = JSON.parse(await readFile(path, 'utf8'));
        mutate?.(pins);
        return { contents: JSON.stringify(pins), loader: 'json' };
      });
    } }],
  });
  return import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
}

const api = await loadWithPins();
const catalog = api.cardiacCatalog;
const parent = catalog.parent;
const cavityIds = [
  'vm:anatomy:body:thorax:right:organ:cavity-of-right-atrium',
  'vm:anatomy:body:thorax:left:organ:cavity-of-left-atrium',
  'vm:anatomy:body:thorax:right:organ:cavity-of-right-ventricle',
  'vm:anatomy:body:thorax:left:organ:cavity-of-left-ventricle',
];
const wallIds = [
  'vm:anatomy:body:thorax:right:organ:wall-of-right-atrium',
  'vm:anatomy:body:thorax:left:organ:wall-of-left-atrium',
];
const sourceHash = '64d93898db3b6cb4dbea452508799c98cbe65b361eba2f17658ecae532a01f67';
const expectedStops = [
  ['overview', 'all', cavityIds[0], 'anterior', cavityIds],
  ['right-atrium', 'right', cavityIds[0], 'right', [cavityIds[0], cavityIds[2]]],
  ['right-ventricle', 'right', cavityIds[2], 'anterior', [cavityIds[0], cavityIds[2]]],
  ['left-atrium', 'left', cavityIds[1], 'posterior', [cavityIds[1], cavityIds[3]]],
  ['left-ventricle', 'left', cavityIds[3], 'left', [cavityIds[1], cavityIds[3]]],
  ['return-overview', 'all', cavityIds[0], 'anterior', cavityIds],
];

assert.equal(parent.id, 'vm:anatomy:body:thorax:unpaired:organ:heart');
assert.deepEqual(catalog.selectableIds, cavityIds);
assert.equal(catalog.structures.length, 6);
assert.deepEqual(catalog.structures.map(s => s.id), [...cavityIds, ...wallIds]);
assert.deepEqual(catalog.structures.slice(0, 4).map(s => [s.fmaId, s.category, s.laterality]), [
  ['FMA11359', 'organ', 'right'], ['FMA9465', 'organ', 'left'],
  ['FMA9291', 'organ', 'right'], ['FMA9466', 'organ', 'left'],
]);
assert.deepEqual(catalog.bundles.filter(b => b.id === 'cardiac'), [{
  id: 'cardiac',
  url: `/models/bodyparts3d/cardiac/cardiac.glb?v=${sourceHash}`,
  bytes: 587588,
  sha256: sourceHash,
  structures: 6,
}]);

const guide = api.cardiacCavityGuide(parent);
assert.ok(guide, 'exact pinned heart parent admits the complete cavity guide');
assert.deepEqual(Object.keys(guide).sort(), ['id', 'title', 'status', 'parentId', 'study',
  'transitionMs', 'fadeOthers', 'limitation', 'steps'].sort());
assert.deepEqual([guide.id, guide.status, guide.parentId, guide.study, guide.transitionMs, guide.fadeOthers],
  [`cardiac-cavity-guide:${parent.id}`, 'draft', parent.id, 'cardiac', 1800, true]);
assert.ok(guide.title && guide.steps.length === 6);
assert.equal(api.cardiacCavityGuideReferences.length, 2);
assert.ok(api.cardiacCavityGuideReferences.some(r => /nhlbi\.nih\.gov\/health\/heart/i.test(r.url)));
assert.ok(api.cardiacCavityGuideReferences.some(r => /vhlab\.umn\.edu\/atlas\/physiology-tutorial\/the-human-heart/i.test(r.url)));
for (const reference of api.cardiacCavityGuideReferences)
  assert.ok(reference.title && reference.url.startsWith('https://'));
for (const [index, [id, preset, selectedId, view, ids]] of expectedStops.entries()) {
  const step = guide.steps[index];
  assert.deepEqual(Object.keys(step).sort(), ['id', 'title', 'caption', 'preset', 'selectedId',
    'view', 'ids', 'references'].sort(), `${id}: exact schema`);
  assert.deepEqual([step.id, step.preset, step.selectedId, step.view], [id, preset, selectedId, view]);
  assert.deepEqual(step.ids, ids, `${id}: only admitted source cavities in the chosen side`);
  assert.ok(step.ids.includes(step.selectedId), `${id}: focus stays visible`);
  assert.deepEqual(step.references, api.cardiacCavityGuideReferences.map(r => r.url));
  assert.ok(step.title && step.caption.length > 30, `${id}: explanatory caption`);
}
for (const pattern of [/cavit/iu, /wall|myocardium/iu, /valve/iu, /flow/iu, /registration/iu, /radiologist review/iu])
  assert.match(guide.limitation, pattern);
assert.doesNotMatch(JSON.stringify(guide.steps), /patient-specific|measured flow|simulated flow|segmented valve/iu);

assert.equal(api.cardiacCavityGuide(null), null, 'missing parent refuses guide');
assert.equal(api.cardiacCavityGuide({ ...parent, id: 'foreign' }), null, 'foreign parent refuses guide');
for (const changed of [
  { ...parent, name: 'Changed heart' },
  { ...parent, bounds: { ...parent.bounds, min: [0, ...parent.bounds.min.slice(1)] } },
  { ...parent, sources: [] },
  { ...parent, sources: parent.sources.map((source, i) => i === 0 ? { ...source, sha256: 'foreign' } : source) },
]) assert.equal(api.cardiacCavityGuide(changed), null, 'stale or incomplete full parent refuses guide');

const originalStructures = [...catalog.structures];
const originalStructuresValue = structuredClone(catalog.structures);
try {
  for (const id of cavityIds) {
    const index = catalog.structures.findIndex(s => s.id === id);
    const child = catalog.structures[index];
    catalog.structures[index] = { ...child, name: 'Changed source structure' };
    assert.equal(api.cardiacCavityGuide(parent), null, `${id}: stale source structure refuses guide`);
    catalog.structures[index] = { ...child, parentId: 'foreign' };
    assert.equal(api.cardiacCavityGuide(parent), null, `${id}: foreign child owner refuses guide`);
    catalog.structures[index] = child;
  }
  const first = catalog.structures[0];
  catalog.structures.shift();
  assert.equal(api.cardiacCavityGuide(parent), null, 'missing cavity refuses guide');
  catalog.structures.unshift(first);
  catalog.structures.push(structuredClone(first));
  assert.equal(api.cardiacCavityGuide(parent), null, 'duplicate cavity refuses guide');
} finally {
  catalog.structures.splice(0, catalog.structures.length, ...originalStructures);
}

const originalSelectableIds = [...catalog.selectableIds];
try {
  catalog.selectableIds.splice(0, catalog.selectableIds.length, ...cavityIds.slice(1));
  assert.equal(api.cardiacCavityGuide(parent), null, 'missing selectable cavity refuses guide');
  catalog.selectableIds.splice(0, catalog.selectableIds.length, ...cavityIds, wallIds[0]);
  assert.equal(api.cardiacCavityGuide(parent), null, 'wall promoted to selectable refuses guide');
  catalog.selectableIds.splice(0, catalog.selectableIds.length, ...cavityIds.toReversed());
  assert.equal(api.cardiacCavityGuide(parent), null, 'changed selectable order refuses guide');
} finally {
  catalog.selectableIds.splice(0, catalog.selectableIds.length, ...originalSelectableIds);
}

const bundle = catalog.bundles.find(b => b.id === 'cardiac');
const originalBundle = structuredClone(bundle);
let addedDuplicateBundle = false;
try {
  for (const [field, value] of [['sha256', 'foreign'], ['structures', 4], ['url', '/foreign.glb'], ['bytes', 1]]) {
    bundle[field] = value;
    assert.equal(api.cardiacCavityGuide(parent), null, `changed source bundle ${field} refuses guide`);
    bundle[field] = originalBundle[field];
  }
  catalog.bundles.push(structuredClone(bundle));
  addedDuplicateBundle = true;
  assert.equal(api.cardiacCavityGuide(parent), null, 'duplicate source bundle refuses guide');
} finally {
  Object.assign(bundle, originalBundle);
  if (addedDuplicateBundle) catalog.bundles.pop();
}

for (const id of cavityIds) {
  const changedPin = await loadWithPins(pins => {
    pins.bindings.find(b => b.study === 'cardiac' && b.structure.id === id).sourceHash = 'foreign';
  });
  assert.equal(changedPin.cardiacCavityGuide(changedPin.cardiacCatalog.parent), null,
    `${id}: changed source pin refuses guide`);
}
const missingPin = await loadWithPins(pins => {
  pins.bindings.splice(pins.bindings.findIndex(b => b.study === 'cardiac' && b.structure.id === cavityIds[0]), 1);
});
assert.equal(missingPin.cardiacCavityGuide(missingPin.cardiacCatalog.parent), null,
  'missing source pin refuses guide');
const duplicatePin = await loadWithPins(pins => {
  const binding = pins.bindings.find(b => b.study === 'cardiac' && b.structure.id === cavityIds[0]);
  pins.bindings.push(structuredClone(binding));
});
assert.equal(duplicatePin.cardiacCavityGuide(duplicatePin.cardiacCatalog.parent), null,
  'duplicate source pin refuses guide');
const changedParentPin = await loadWithPins(pins => {
  pins.parents.find(p => p.id === parent.id).name = 'Changed pinned heart';
});
assert.equal(changedParentPin.cardiacCavityGuide(changedParentPin.cardiacCatalog.parent), null,
  'changed pinned parent refuses guide');
const duplicateParentPin = await loadWithPins(pins => {
  pins.parents.push(structuredClone(pins.parents.find(p => p.id === parent.id)));
});
assert.equal(duplicateParentPin.cardiacCavityGuide(duplicateParentPin.cardiacCatalog.parent), null,
  'duplicate pinned parent refuses guide');

const before = structuredClone(api.cardiacCavityGuide(parent));
guide.steps[0].ids.length = 0;
guide.steps[0].references.length = 0;
guide.steps[0].caption = 'changed';
assert.deepEqual(api.cardiacCavityGuide(parent), before, 'guide arrays and captions are detached');
assert.deepEqual(catalog.selectableIds, originalSelectableIds, 'factory did not mutate selectable source state');
assert.deepEqual(catalog.structures, originalStructuresValue, 'factory did not mutate catalog structures');
console.log('Cardiac cavity guide: six exact draft stops; full six-structure parent, child, bundle and pin refusals; detached output.');
