import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { readFile } from 'node:fs/promises';

const entry = "export { ventricularGuide, ventricularGuideReferences } from './lib/ventricular-guide'; export { ventricleCatalog } from './lib/ventricles';";
async function loadWithPins(mutate) {
const compiled = await build({
  stdin: {
    contents: entry,
    resolveDir: process.cwd(), loader: 'ts',
  }, bundle: true, platform: 'node', format: 'esm', write: false,
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
const parent = api.ventricleCatalog.parent;
const childIds = [
  'vm:anatomy:body:head-neck:left:space:left-lateral-ventricle',
  'vm:anatomy:body:head-neck:right:space:right-lateral-ventricle',
  'vm:anatomy:body:head-neck:midline:space:third-ventricle',
  'vm:anatomy:body:head-neck:midline:space:fourth-ventricle',
];
const expected = [
  ['overview', 'all', childIds[0], 'anterior', childIds],
  ['paired-lateral', 'lateral', childIds[1], 'anterior', childIds.slice(0, 2)],
  ['third', 'midline', childIds[2], 'left', childIds.slice(2)],
  ['fourth', 'midline', childIds[3], 'posterior', childIds.slice(2)],
  ['return-overview', 'all', childIds[0], 'anterior', childIds],
];
const guide = api.ventricularGuide(parent);
assert.ok(guide, 'exact source-bound brain parent admits a complete guide');
assert.deepEqual(Object.keys(guide).sort(), ['id', 'title', 'status', 'parentId', 'study',
  'transitionMs', 'continuousPlayback', 'fadeOthers', 'limitation', 'steps'].sort());
assert.deepEqual(guide.continuousPlayback,{version:1,start:'explicit-play-full-tour',transition:'quintic-orbit',transitionMs:8000,minimumStepMs:24000,captionWordsPerMinute:180,stepDurationsMs:guide.steps.map(s=>Math.max(24000,8000+Math.ceil(s.caption.trim().split(/\s+/u).filter(Boolean).length*60000/180))),final:'hold',reducedMotion:'no-camera-sweep'});
assert.deepEqual([guide.id, guide.status, guide.parentId, guide.study, guide.transitionMs, guide.fadeOthers],
  [`ventricular-guide:${parent.id}`, 'draft', parent.id, 'ventricles', 1800, true]);
assert.equal(guide.steps.length, 5);
assert.deepEqual(api.ventricleCatalog.ventricularIds, childIds);
assert.deepEqual(api.ventricleCatalog.structures.filter(s => childIds.includes(s.id)).map(s => s.fmaId),
  ['FMA78450', 'FMA78449', 'FMA78454', 'FMA78469']);
for (const [index, [id, preset, selectedId, view, ids]] of expected.entries()) {
  const step = guide.steps[index];
  assert.deepEqual(Object.keys(step).sort(), ['id', 'title', 'caption', 'preset', 'selectedId',
    'view', 'ids', 'references'].sort(), `${id}: exact schema`);
  assert.deepEqual([step.id, step.preset, step.selectedId, step.view], [id, preset, selectedId, view]);
  assert.deepEqual(step.ids, ids, `${id}: only the four admitted source child spaces`);
  assert.ok(step.ids.includes(step.selectedId), `${id}: focus stays visible`);
  assert.deepEqual(step.references, api.ventricularGuideReferences.map(reference => reference.url));
  assert.ok(step.title && step.caption.length > 30, `${id}: original explanatory caption`);
}
for (const pattern of [/foramina/iu, /aqueduct/iu, /outlets/iu, /choroid/iu,
  /fluid flow/iu, /registration/iu, /radiologist review/iu])
  assert.match(guide.limitation, pattern);
assert.doesNotMatch(JSON.stringify(guide.steps), /patient-specific|measured flow|simulated flow|segmented aqueduct/iu);
assert.equal(api.ventricularGuide({ ...parent, id: 'foreign' }), null);
assert.equal(api.ventricularGuide({ ...parent, name: 'changed' }), null);
assert.equal(api.ventricularGuide({ ...parent, sources: [] }), null);
assert.equal(api.ventricularGuide({ ...parent, bounds: { ...parent.bounds, min: [0, ...parent.bounds.min.slice(1)] } }), null);

const childIndex = api.ventricleCatalog.structures.findIndex(s => s.id === childIds[0]);
const child = api.ventricleCatalog.structures[childIndex];
const originalStructures = [...api.ventricleCatalog.structures];
try {
  api.ventricleCatalog.structures[childIndex] = { ...child, name: 'changed' };
  assert.equal(api.ventricularGuide(parent), null, 'changed child refuses entire guide');
  api.ventricleCatalog.structures[childIndex] = { ...child, parentId: 'foreign' };
  assert.equal(api.ventricularGuide(parent), null, 'foreign child owner refuses entire guide');
  api.ventricleCatalog.structures[childIndex] = child;
  api.ventricleCatalog.structures.splice(childIndex, 1);
  assert.equal(api.ventricularGuide(parent), null, 'missing child refuses entire guide');
  api.ventricleCatalog.structures.splice(childIndex, 0, child);
  api.ventricleCatalog.structures.splice(childIndex, 0, structuredClone(child));
  assert.equal(api.ventricularGuide(parent), null, 'duplicate child refuses entire guide');
} finally {
  api.ventricleCatalog.structures.splice(0, api.ventricleCatalog.structures.length, ...originalStructures);
}
const bundle = api.ventricleCatalog.bundles.find(b => b.id === 'ventricles');
const hash = bundle.sha256;
try {
  bundle.sha256 = 'foreign';
  assert.equal(api.ventricularGuide(parent), null, 'changed bundle refuses guide');
} finally { bundle.sha256 = hash; }
api.ventricleCatalog.bundles.push(structuredClone(bundle));
try { assert.equal(api.ventricularGuide(parent), null, 'duplicate source bundle refuses guide'); }
finally { api.ventricleCatalog.bundles.pop(); }
const changedPin = await loadWithPins(pins => {
  pins.bindings.find(b => b.study === 'ventricles' && b.structure.id === childIds[0]).sourceHash = 'foreign';
});
assert.equal(changedPin.ventricularGuide(parent), null, 'changed pin source refuses guide');
const duplicatePin = await loadWithPins(pins => {
  const binding = pins.bindings.find(b => b.study === 'ventricles' && b.structure.id === childIds[0]);
  pins.bindings.push(structuredClone(binding));
});
assert.equal(duplicatePin.ventricularGuide(parent), null, 'duplicate source pin refuses guide');
const duplicateParent = await loadWithPins(pins => {
  pins.parents.push(structuredClone(pins.parents.find(p => p.id === parent.id)));
});
assert.equal(duplicateParent.ventricularGuide(parent), null, 'duplicate pinned parent refuses guide');
const saved = structuredClone(api.ventricularGuide(parent));
guide.steps[0].ids.length = 0;
guide.steps[0].references.length = 0;
guide.steps[0].caption = 'changed';
assert.deepEqual(api.ventricularGuide(parent), saved, 'guide arrays and captions are detached');
console.log('Ventricular guide: five exact draft stops; parent, child, duplicate, bundle and source-pin refusals; detached output.');
