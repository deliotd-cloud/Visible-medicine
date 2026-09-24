import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { build } from './workspace-test-build.mjs';

const compiled = await build({ stdin: { contents: `
export * from './content/popliteal-vessel-study';
export * from './lib/popliteal-vessel-study';
export * from './lib/body-display-catalog';
export * from './lib/study-links';
export * from './lib/study-library';
export * from './app/dissection-data';
export * from './lib/close-up-labels';
export * from './lib/limb-vascular-studies';
`, resolveDir: process.cwd(), loader: 'ts' },
bundle: true, write: false, platform: 'node', format: 'esm' });
const a = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const raw = JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json'));
const catalog = a.bodyDisplayCatalog(raw);
const before = JSON.stringify(catalog);
const pins = JSON.parse(await readFile('content/popliteal-vessel-study-pins.json'));
const hash = (value) => createHash('sha256').update(value).digest('hex');
const lexical = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const ids = (items) => items.map((item) => item.id).sort(lexical);
const id = 'knee-popliteal-vessel-pair';
const expected = ['FMA77380', 'FMA77381', 'FMA44328', 'FMA44329',
  'FMA24474', 'FMA24475', 'FMA24477', 'FMA24478', 'FMA24480',
  'FMA24481', 'FMA24486', 'FMA24487', 'FMA22591', 'FMA22592'];
assert.equal(pins.sourceCommit, '8bb434cdb42eac4925dc60a4fe9841ad6a62f211');
assert.equal(pins.sourceVersion, catalog.sourceVersion);
assert.equal(pins.license, 'CC-BY-4.0');
assert.deepEqual(pins.coordinateSystem, catalog.coordinateSystem);
assert.deepEqual([...a.poplitealVesselSourceIds].sort(lexical), [...expected].sort(lexical));
assert.deepEqual(a.poplitealVesselStudy.regions, ['leg', 'whole-body']);
assert.equal(a.poplitealVesselStudy.view, 'posterior');
assert.deepEqual(pins.entries.map((entry) => entry.fmaId), expected);
assert.deepEqual([...new Set(pins.entries.map((entry) => entry.bundle))].sort(lexical), pins.bundles.map((bundle) => bundle.id).sort(lexical));
for (const pin of pins.entries) {
  const matches = catalog.structures.filter((structure) => structure.id === pin.id || structure.fmaId === pin.fmaId);
  assert.equal(matches.length, 1);
  assert.deepEqual(matches[0], pin);
  assert.equal(pin.provenance.license, 'CC-BY-4.0');
  assert.equal(pin.validation.anatomicalReview, false);
}
assert.deepEqual(a.poplitealVesselBindings, pins.entries.map((entry) => ({
  id: entry.id, fmaId: entry.fmaId, laterality: entry.laterality,
  bundle: entry.bundle, nodeName: entry.nodeName, sources: entry.sources,
})));
assert.equal(a.poplitealVesselStudyReady(catalog, 'leg', id), true);
assert.equal(a.poplitealVesselStudyReady(null, 'leg', id), false);
assert.equal(a.poplitealVesselStudyReady(catalog, 'thigh', id), false);
assert.equal(a.poplitealVesselStudyReady(null, 'leg', 'another-recipe'), true);
for (const region of ['leg', 'whole-body']) {
  const focus = a.dissectionProfiles[region].focuses.filter((candidate) => candidate.id === id);
  assert.equal(focus.length, 1, `Main profile wiring missing: ${region}`);
  assert.equal(focus[0].includeSkeleton, false);
  assert.equal(focus[0].sideFilteredSourceBindings, true);
  assert.deepEqual(focus[0].requiredSourceBindings, a.poplitealVesselBindings);
  for (const reference of a.poplitealVesselReferences)
    assert(a.dissectionProfiles[region].references.includes(reference));
}
for (const region of Object.keys(a.dissectionProfiles).filter((name) => !['leg', 'whole-body'].includes(name)))
  assert(!a.dissectionProfiles[region].focuses.some((focus) => focus.id === id));
for (const term of ['0%', 'fixed vessel order', 'compression', 'patency', 'flow',
  'popliteal-fossa', 'nerve', 'fascia', 'patient registration', 'radiologist review'])
  assert(a.poplitealVesselStudy.inspect.includes(term));

const scenes = new Map();
for (const bundle of pins.bundles) {
  assert.deepEqual(catalog.bundles.filter((candidate) => candidate.id === bundle.id), [bundle]);
  const bytes = await readFile('public' + bundle.url.split('?')[0]);
  assert.equal(hash(bytes), bundle.sha256);
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  scenes.set(bundle.id, (await new GLTFLoader().parseAsync(buffer, '')).scene);
}

let scopes = 0, links = 0, labels = 0, rejections = 0;
for (const region of ['leg', 'whole-body']) for (const side of ['both', 'left', 'right']) {
  scopes++;
  const scope = a.bodyStudyScope(catalog, region, side);
  const profile = a.dissectionProfiles[region];
  const state = a.dissectionReducer(a.initialDissection, { type: 'focus', id });
  const visible = a.resolveDissection(scope, profile, state).visible;
  assert.equal(visible.length, side === 'both' ? 14 : 7);
  assert.deepEqual(ids(visible), ids(scope.filter((structure) => expected.includes(structure.fmaId))));
  assert.deepEqual(ids(a.stageStructures(scope, profile, 'assembled', id)), ids(visible));
  const card = a.studyLibrary(scope, profile).find((candidate) => candidate.key === 'focus:' + id);
  assert(card);
  assert.equal(card.recipes.length, 1);
  assert.equal(card.recipes[0].targets.length, side === 'both' ? 4 : 2);
  assert.equal(a.filterStudyLibrary([card], 'popliteal artery vein', 'vessels', 'focus').length, 1);
  assert.deepEqual(a.studyLibraryAction(scope, profile, card.key, false), { kind: 'focus', id });
  assert.equal(a.studyLibraryAction(scope, profile, card.key, true), null);
  const preview = a.studyRecipePreview(card.recipes[0], scope, ids(scope), pins.bundles.map((bundle) => bundle.id), []);
  assert.deepEqual(ids(preview.keep), ids(visible));
  assert.equal(preview.restore.length, 0);
  assert.equal(preview.hide.length, scope.length - visible.length);
  assert.deepEqual(ids(preview.loaded), ids(visible));
  const input = { catalog, region, recipeId: id, structures: scope, visibleIds: ids(visible), enabled: true };
  const roi = a.poplitealVesselStudyBounds(input);
  assert(roi);
  const inside = (point) => point.every((value, axis) => value >= roi.min[axis] && value <= roi.max[axis]);
  for (const structure of visible) {
    if (structure.system !== 'skeleton')
      assert(inside(structure.bounds.min) && inside(structure.bounds.max), 'Whole non-bone envelope fits ROI');
    const mesh = scenes.get(structure.bundle).getObjectByName(structure.nodeName);
    assert(mesh?.geometry, `Missing actual mesh ${structure.nodeName}`);
    const anchor = a.closeUpLabelAnchor(mesh.geometry, structure.anchor, roi);
    assert(anchor && inside(anchor), `${structure.name} has an in-frame source-backed anchor`);
    if (!inside(structure.anchor)) {
      const positions = mesh.geometry.getAttribute('position');
      let found = false;
      for (let index = 0; index < positions.count; index++)
        if ([positions.getX(index), positions.getY(index), positions.getZ(index)]
          .every((value, axis) => value === anchor[axis])) { found = true; break; }
      assert(found, 'No clamped or fabricated label anchor');
    }
    labels++;
    const url = a.makeStudyLink(catalog, region, structure.id, side, id);
    assert(url);
    const link = a.parseStudyLink(Object.fromEntries(new URL(url, 'https://atlas.invalid').searchParams));
    const resolved = a.resolveStudyLink(catalog, region, link);
    assert.equal(resolved.status, 'ready');
    assert.deepEqual([...resolved.visibleIds].sort(lexical), ids(visible));
    if (side !== 'both')
      assert.equal(a.makeStudyLink(catalog, region, structure.id, side === 'left' ? 'right' : 'left', id), null);
    links++;
  }
  const removable = visible.find((structure) => structure.system === 'muscles');
  const removed = a.dissectionReducer(state, { type: 'remove', id: removable.id });
  const after = a.resolveDissection(scope, profile, removed).visible;
  assert(!after.includes(removable));
  assert.deepEqual(a.poplitealVesselStudyBounds({ ...input, visibleIds: ids(after) }), roi, 'ROI stays steady after removal');
  assert.deepEqual(ids(a.resolveDissection(scope, profile, a.dissectionReducer(removed, { type: 'undo' })).visible), ids(visible));
  assert.deepEqual(ids(a.resolveDissection(scope, profile,
    a.dissectionReducer(a.dissectionReducer(removed, { type: 'undo' }), { type: 'redo' })).visible), ids(after));
  for (const patch of [{ enabled: false }, { visibleIds: [] },
    { visibleIds: [...input.visibleIds, input.visibleIds[0]] },
    { recipeId: 'assembled' }, { visibleIds: [...input.visibleIds, 'unknown'] },
    { visibleIds: [...input.visibleIds, scope.find((structure) => !expected.includes(structure.fmaId)).id] }])
    assert.equal(a.poplitealVesselStudyBounds({ ...input, ...patch }), null);
}

const selected = pins.entries.find((entry) => entry.fmaId === 'FMA77380');
const link = a.parseStudyLink(Object.fromEntries(new URL(
  a.makeStudyLink(catalog, 'leg', selected.id, 'right', id), 'https://atlas.invalid').searchParams));
const reject = (mutate) => {
  const altered = structuredClone(catalog);
  mutate(altered);
  assert.equal(a.poplitealVesselStudyReady(altered, 'leg', id), false);
  assert.equal(a.limbVascularStudyReady(altered, 'leg', id), false);
  assert.equal(a.resolveStudyLink(altered, 'leg', link).status, 'rejected');
  rejections++;
};
for (const pin of pins.entries) {
  reject((altered) => { altered.structures = altered.structures.filter((structure) => structure.id !== pin.id); });
  reject((altered) => altered.structures.push({ ...structuredClone(pin), id: pin.id + '-alias' }));
  for (const change of [
    (structure) => { structure.anchor[0] += 0.01; },
    (structure) => { structure.laterality = 'wrong'; },
    (structure) => { structure.sources.at(-1).sha256 = '0'.repeat(64); },
    (structure) => { structure.sources.at(-1).file = 'wrong'; },
    (structure) => { structure.nodeName = 'wrong'; },
    (structure) => { structure.bundle = 'wrong'; },
  ]) reject((altered) => change(altered.structures.find((structure) => structure.id === pin.id)));
  for (const change of [
    (structure) => { structure.sources[0].sha256 = '0'.repeat(64); },
    (structure) => { structure.bundle = 'wrong'; },
    (structure) => { structure.fmaId = 'wrong'; },
  ]) {
    const alteredScope = a.bodyStudyScope(catalog, 'leg', 'both').map((structure) =>
      structure.id === pin.id ? structuredClone(structure) : structure);
    change(alteredScope.find((structure) => structure.id === pin.id));
    assert.deepEqual(a.stageStructures(alteredScope, a.dissectionProfiles.leg, 'assembled', id), []);
  }
  const completeScope = a.bodyStudyScope(catalog, 'leg', 'both');
  assert.deepEqual(a.stageStructures(completeScope.filter((structure) => structure.id !== pin.id),
    a.dissectionProfiles.leg, 'assembled', id), [], 'Missing bound source hides the whole focus');
  assert.deepEqual(a.stageStructures([...completeScope, structuredClone(completeScope.find((structure) => structure.id === pin.id))],
    a.dissectionProfiles.leg, 'assembled', id), [], 'Duplicate bound source hides the whole focus');
}
for (const pin of pins.bundles) {
  reject((altered) => { altered.bundles = altered.bundles.filter((bundle) => bundle.id !== pin.id); });
  reject((altered) => { altered.bundles.find((bundle) => bundle.id === pin.id).sha256 = 'changed'; });
  reject((altered) => altered.bundles.push({ ...structuredClone(pin), id: pin.id + '-alias', url: pin.url.split('?')[0] + '?alias=1' }));
}
for (const field of ['license', 'sourceVersion', 'coordinateSystem'])
  reject((altered) => { altered[field] = 'changed'; });
const explorerSource = await readFile('app/body-explorer.tsx', 'utf8');
assert(explorerSource.includes('poplitealVesselStudyBounds({ ...input, catalog })'), 'Main camera ROI wiring missing');
assert(explorerSource.includes('poplitealVesselStudy.id === cameraRecipeId'), 'Main dedicated camera guard missing');
assert.equal(JSON.stringify(catalog), before);
console.log(JSON.stringify({ passed: true, scopes, sourceSelections: pins.entries.length,
  links, realLabelAnchors: labels, rejections, exactPinHash: hash(JSON.stringify(pins)),
  geometryChanged: false, browserTesting: false, clinicalApproval: false }));
