import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { build } from 'esbuild';

const compiled = await build({
  stdin: {
    contents: `export {bodyDisplayCatalog} from './lib/body-display-catalog';
      export {eyeLayerGuide} from './lib/eye-layer-guide';
      export {eyeCatalog,eyeLayersFor,eyePresetHidden,eyeReferences} from './lib/eye-layers';`,
    resolveDir: process.cwd(),
    loader: 'ts',
  },
  bundle: true, platform: 'node', format: 'esm', write: false,
});
const api = await import('data:text/javascript;base64,' +
  Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const raw = JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json'));
const display = api.bodyDisplayCatalog(raw);
const parents = display.structures.filter((structure) => api.eyeLayersFor(structure).length);
assert.equal(parents.length, api.eyeCatalog.parents.length, 'All admitted eye parents are present in current display');

let checks = 1;
const check = (value, message) => { checks++; assert(value, message); };
const equal = (actual, expected, message) => { checks++; assert.deepEqual(actual, expected, message); };
const clone = (value) => structuredClone(value);
const specs = [
  ['anterior', 'anterior', 'cornea', 'anterior', ['cornea', 'iris']],
  ['lens', 'lens', 'lens', 'left', ['lens', 'zonule']],
  ['vitreous', 'all', 'vitreous', 'posterior', ['vitreous']],
  ['wall', 'wall', 'sclera', 'posterior', ['sclera', 'choroid']],
];
for (const parent of parents) {
  const layers = api.eyeLayersFor(parent);
  const guide = api.eyeLayerGuide(parent);
  check(guide !== null, `${parent.id}: complete guide admitted`);
  equal([guide.status, guide.parentId, guide.study, guide.transitionMs],
    ['draft', parent.id, 'eye', 1800], 'Guide metadata');
  equal(guide.steps.length, 4, 'Four stops');
  for (const [index, [id, preset, kind, view, required]] of specs.entries()) {
    const step = guide.steps[index];
    equal([step.id, step.preset, step.view], [id, preset, view], `${id}: route`);
    const hidden = new Set(api.eyePresetHidden(layers, preset));
    equal(step.ids, layers.filter((layer) => !hidden.has(layer.id)).map((layer) => layer.id), `${id}: exact preset members`);
    equal(step.selectedId, layers.find((layer) => layer.kind === kind)?.id, `${id}: selected source child`);
    check(step.ids.includes(step.selectedId), `${id}: selected child visible`);
    for (const requiredKind of required)
      check(step.ids.includes(layers.find((layer) => layer.kind === requiredKind)?.id), `${id}: ${requiredKind} visible`);
    equal(step.references, api.eyeReferences.map((reference) => reference.url), `${id}: existing references only`);
    check(step.caption.length > 0, `${id}: authored caption`);
  }
  equal(new Set(layers.map((layer) => layer.kind)).size, layers.length, 'Unique side-specific kinds');
  if (parent.laterality === 'right') {
    check(!layers.some((layer) => layer.kind === 'chamber'), 'No right chamber substitute');
    check(!guide.steps.some((step) => step.ids.some((id) => id.includes('left-'))), 'No left child in right guide');
  }
  check(/retina|finer layers/i.test(guide.limitation), 'Unsegmented scope disclosed');
  check(/source|cleaned right/i.test(guide.limitation) && /clinical|registration/i.test(guide.limitation), 'Source and approval limits disclosed');
  check(api.eyeLayerGuide({...parent, sources: []}) === null, 'Altered parent source binding rejected');
  check(api.eyeLayerGuide({...parent, name: 'altered'}) === null, 'Altered supplied parent rejected');
  check(api.eyeLayerGuide({...parent, id: 'foreign'}) === null, 'Foreign parent rejected');
  const first = api.eyeCatalog.structures.findIndex((layer) => layer.parentId === parent.id);
  const saved = api.eyeCatalog.structures[first];
  try {
    api.eyeCatalog.structures[first] = {...saved, name: 'altered child'};
    check(api.eyeLayerGuide(parent) === null, 'Altered retained child rejected');
    api.eyeCatalog.structures[first] = {...saved, parentId: 'foreign'};
    check(api.eyeLayerGuide(parent) === null, 'Foreign child ownership rejected');
    api.eyeCatalog.structures[first] = saved;
    api.eyeCatalog.structures.splice(first, 1);
    check(api.eyeLayerGuide(parent) === null, 'Missing child rejects whole guide');
  } finally {
    if (api.eyeCatalog.structures[first]?.id === saved.id)
      api.eyeCatalog.structures[first] = saved;
    else api.eyeCatalog.structures.splice(first, 0, saved);
  }
  const hash = api.eyeCatalog.bundles[0].sha256;
  try {
    api.eyeCatalog.bundles[0].sha256 = 'altered';
    check(api.eyeLayerGuide(parent) === null, 'Changed retained bundle hash rejected');
  } finally {
    api.eyeCatalog.bundles[0].sha256 = hash;
  }
  const original = clone(api.eyeLayerGuide(parent));
  guide.steps[0].ids.length = 0;
  guide.steps[0].references.length = 0;
  guide.steps[0].caption = 'modified';
  equal(api.eyeLayerGuide(parent), original, 'Returns detached guide data');
}
console.log(`Eye-layer guide: ${checks} focused checks passed for ${parents.length} current display parents (${parents.map((parent) => api.eyeLayersFor(parent).length).join('/')} source children).`);
