import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { kneeStudySets, kneeStudyBounds } from '../lib/knee-studies.ts';
import { closeUpLabelAnchor } from '../lib/close-up-labels.ts';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { BufferGeometry, Float32BufferAttribute } from 'three';
import { build as buildHelpers } from './workspace-test-build.mjs';
import { preKneeStudyRecipeProfiles, spinalLevelProfilesHash, kneeStudyProfilesHash } from './recipe-history.mjs';
import { preElbowRecipeProfiles } from './elbow-study-history.mjs';

// Resolve the real application helper graph with the same confined TS bundler
// as the other regional tests; plain Node cannot resolve its extensionless imports.
const helpers = await buildHelpers({ stdin: { contents: `
export { dissectionProfiles, stageStructures, initialDissection, dissectionReducer, resolveDissection } from './app/dissection-data';
export { studyLibrary, filterStudyLibrary } from './lib/study-library';
export { makeStudyLink, parseStudyLink, resolveStudyLink } from './lib/study-links';
`, resolveDir: process.cwd(), loader: 'ts' }, bundle: true, platform: 'node', format: 'esm', write: false });
const { dissectionProfiles, stageStructures, initialDissection, dissectionReducer, resolveDissection,
  studyLibrary, filterStudyLibrary, makeStudyLink, parseStudyLink, resolveStudyLink } =
  await import('data:text/javascript;base64,' + Buffer.from(helpers.outputFiles[0].text).toString('base64'));

let checks = 0;
const same = (actual, expected, message) => { checks++; assert.deepEqual(actual, expected, message); };
const hash = (value) => createHash('sha256').update(value).digest('hex');
const raw = await readFile('public/models/bodyparts3d/full-body/catalog.json');
same(hash(raw), '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7');
const catalog = JSON.parse(raw), before = JSON.stringify(catalog), profile = dissectionProfiles.leg;
same(hash(JSON.stringify(preElbowRecipeProfiles(dissectionProfiles))), kneeStudyProfilesHash);
same(hash(JSON.stringify(preKneeStudyRecipeProfiles(dissectionProfiles))), spinalLevelProfilesHash);
const expectedNames = {
  'knee-bones': ['femur', 'fibula', 'patella', 'tibia'],
  'knee-patella-off': ['femur', 'fibula', 'tibia'],
  'knee-popliteus': ['femur', 'fibula', 'popliteus', 'tibia'],
};
for (const side of ['both', 'left', 'right']) {
  const scope = catalog.structures.filter((s) => s.regions.includes('leg') && (side === 'both' || s.laterality === side));
  const bases = [];
  for (const study of kneeStudySets) {
    const visible = stageStructures(scope, profile, study.id), visibleIds = visible.map((s) => s.id);
    const names = (side === 'both' ? ['left', 'right'] : [side]).flatMap((s) => expectedNames[study.id].map((name) => `${s} ${name}`));
    same(visible.map((s) => s.sourceName).sort(), names.sort());
    same(stageStructures(scope, profile, 'free', study.id), visible);
    const cards = studyLibrary(scope, profile);
    same(cards.filter((c) => c.recipes.some((r) => r.id === study.id)).length, 1, 'One card, not duplicate focus/window');
    same(filterStudyLibrary(cards, 'knee').some((c) => c.recipes.some((r) => r.id === study.id)), true);
    const state = dissectionReducer(initialDissection, { type: 'focus', id: study.id });
    const removed = dissectionReducer(state, { type: 'remove', id: visibleIds[0] });
    const undo = dissectionReducer(removed, { type: 'undo' });
    same(resolveDissection(scope, profile, removed).visible.map((s) => s.id), visibleIds.slice(1));
    same(resolveDissection(scope, profile, undo).visible.map((s) => s.id), visibleIds);
    same(resolveDissection(scope, profile, dissectionReducer(undo, { type: 'redo' })).visible.map((s) => s.id), visibleIds.slice(1));
    const input = { region: 'leg', recipeId: study.id, structures: scope, visibleIds, enabled: true };
    const bounds = kneeStudyBounds(input);
    same(!!bounds, true);
    bases.push(bounds);
    same(bounds.max[1] - bounds.min[1] < 2.5, true, 'Joint close-up, not whole long bones');
    for (const muscle of visible.filter((s) => s.sourceName.endsWith('popliteus')))
      same(muscle.bounds.min.every((v, i) => v >= bounds.min[i] && muscle.bounds.max[i] <= bounds.max[i]), true, 'All source popliteus within close-up');
    const patellaIds = scope.filter((s) => /patella$/.test(s.sourceName)).map((s) => s.id);
    same(kneeStudyBounds({ ...input, visibleIds: visibleIds.filter((id) => !patellaIds.includes(id)) }), bounds, 'Removing patella does not shift target');
    for (const invalid of [{ enabled: false }, { region: 'thigh' }, { recipeId: 'bones' }, { visibleIds: [] }, { visibleIds: ['missing'] }, { visibleIds: [...visibleIds, scope.find((s) => /soleus/.test(s.sourceName)).id] }])
      same(kneeStudyBounds({ ...input, ...invalid }), null);
    same(kneeStudyBounds({ ...input, structures: scope.filter((s) => !/patella$/.test(s.sourceName)) }), null);
    const malformed = structuredClone(scope);
    malformed.find((s) => /patella$/.test(s.sourceName)).bounds.min[0] = NaN;
    same(kneeStudyBounds({ ...input, structures: malformed }), null);
    for (const selected of visible) {
      const link = makeStudyLink(catalog, 'leg', selected.id, side, study.id);
      const parsed = parseStudyLink(Object.fromEntries(new URL(link, 'https://atlas.invalid').searchParams));
      const resolved = resolveStudyLink(catalog, 'leg', parsed);
      same(resolved.status, 'ready');
      same(resolved.visibleIds, visibleIds);
      same(resolved.selected.id, selected.id);
      same(resolveStudyLink(catalog, 'thigh', parsed).status, 'rejected');
    }
  }
  same(bases[0], bases[1], 'Patella-off retains joint framing');
  same(bases[0], bases[2], 'Posterior study retains same joint region');
}
same(JSON.stringify(catalog), before, 'Source meshes, bounds and identities untouched');

// Run the real shared renderer with controlled hooks; no browser/GPU claim.
const { build } = await import('./workspace-component-test-build.mjs');
const { createRequire } = await import('node:module');
const { runInNewContext } = await import('node:vm');
const require = createRequire(import.meta.url), React = require('react');
const compiled = await build({ stdin: { contents: "export { BodyScene } from './app/body-scene'; export { FittedCamera } from './app/fitted-camera';", resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, platform: 'node', format: 'cjs', write: false });
const module = { exports: {} };
runInNewContext(compiled.outputFiles[0].text, { module, exports: module.exports, require: (id) => id === 'react' ? { ...React, useMemo: (fn) => fn(), useRef: (v) => ({ current: v }), useEffect: () => {} } : require(id) });
const api = module.exports;
const nodes = (n) => !n || typeof n !== 'object' ? [] : Array.isArray(n) ? n.flatMap(nodes) : [n, ...nodes(n.props?.children)];
const structures = stageStructures(catalog.structures.filter((s) => s.regions.includes('leg')), profile, 'knee-bones');
const roi = kneeStudyBounds({ region: 'leg', recipeId: 'knee-bones', structures, visibleIds: structures.map((s) => s.id), enabled: true });
let sourceAnchors = 0;
for (const bundle of catalog.bundles.filter((b) => structures.some((s) => s.bundle === b.id))) {
  const bytes = await readFile(`public${bundle.url}`);
  same(hash(bytes), bundle.sha256);
  const gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
  for (const structure of structures.filter((s) => s.bundle === bundle.id)) {
    const geometry = gltf.scene.getObjectByName(structure.nodeName).geometry;
    const anchor = closeUpLabelAnchor(geometry, structure.anchor, roi);
    same(!!anchor, true, 'Each knee bone has a real in-frame label point');
    same(anchor.every((v, i) => v >= roi.min[i] && v <= roi.max[i]), true);
    if (!structure.anchor.every((v, i) => v >= roi.min[i] && v <= roi.max[i])) {
      const positions = geometry.getAttribute('position');
      let present = false;
      for (let i = 0; i < positions.count; i++)
        if (positions.getX(i) === anchor[0] && positions.getY(i) === anchor[1] && positions.getZ(i) === anchor[2]) { present = true; break; }
      same(present, true, 'New display anchor is a source vertex, never a clamped coordinate');
    }
    same(closeUpLabelAnchor(geometry, structure.anchor), structure.anchor, 'Ordinary label unchanged');
    sourceAnchors++;
  }
}
same(sourceAnchors, 8);
const absent = new BufferGeometry();
same(closeUpLabelAnchor(absent, [999, 999, 999], roi), null);
absent.setAttribute('position', new Float32BufferAttribute([100, 100, 100], 3));
same(closeUpLabelAnchor(absent, [999, 999, 999], roi), null, 'No invented anchor without an in-view vertex');
const props = { catalog, structures, selectedId: null, systems: { skeleton: true }, isolated: false, hiddenIds: [], ghostRemoved: false, illustrated: true, landmarks: [], explode: 0, layout: 'spatial', anchorSkeleton: false, showOrigins: false, labels: true, view: 'anterior', zoom: 1, reset: 0, focus: false, exam: false, inspection: { plane: 'off', position: 50, flipped: false, opacity: {}, keepSelectedSolid: true }, plate: false, onSelect() {}, onLoaded() {}, onFailure() {}, onRendererHealth() {} };
for (const extra of [{ cameraBounds: roi }, { cameraBounds: roi, exam: true }, { cameraBounds: roi, focus: true, selectedId: structures[0].id }, {}]) {
  const scene = api.BodyScene({ ...props, ...extra });
  const camera = nodes(scene.props.children(() => {})).find((n) => n.type === api.FittedCamera);
  same(!!camera, true);
  const closeUp = !!extra.cameraBounds && !extra.exam && !extra.focus;
  same(camera.props.bounds.min.toArray(), closeUp ? roi.min : extra.focus ? structures[0].bounds.min : structures.reduce((a, s) => a.map((v, i) => Math.min(v, s.bounds.min[i])), [Infinity, Infinity, Infinity]));
}
console.log(JSON.stringify({ passed: true, checks, studies: 3, sideScopes: 9, sourceAnchors, geometryAdded: false, browserTesting: false, clinicalValidation: false }));
