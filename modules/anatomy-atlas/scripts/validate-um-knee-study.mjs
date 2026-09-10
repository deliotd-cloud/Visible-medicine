import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { build } from './workspace-test-build.mjs';
import { build as componentBuild } from './workspace-component-test-build.mjs';

const result = await build({ entryPoints: ['lib/um-knee-study.ts'], bundle: true, write: false, format: 'esm', platform: 'node' });
const m = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
const { kneeSpecimen, kneeStructures, kneeSpecimenStudies, kneeCatalog, kneeJointBounds, kneeStudyAction, reduceKneeStudy, initialKneeStudy, activeKneeStudy, filterKneeStructures } = m;
let checks = 0;
const same = (a, b, message) => { checks++; assert.deepEqual(a, b, message); };
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
same(hash(await readFile('public/models/bodyparts3d/full-body/catalog.json')), '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7');
const original = await readFile('content/prototypes/um-knee/knee.glb'), publicGlb = await readFile('public/models/um-knee/knee.glb');
same(original.subarray(20 + original.readUInt32LE(12)), publicGlb.subarray(20 + publicGlb.readUInt32LE(12)), 'All binary geometry bytes preserved');
same(hash(publicGlb), kneeSpecimen.bundle.sha256);
same(kneeSpecimen.registeredToBodyParts3D, false); same(kneeSpecimen.imagingRegistration, null);
same(kneeSpecimen.structures.length, 15); same(kneeCatalog.bundles.length, 1);
same(kneeSpecimen.structures.reduce((n, s) => n + s.triangles, 0), 293156);
same(kneeSpecimen.structures.reduce((n, s) => n + s.omittedSourceFaces.length, 0), 40);
const scene = await new GLTFLoader().parseAsync(publicGlb.buffer.slice(publicGlb.byteOffset, publicGlb.byteOffset + publicGlb.byteLength), '');
const nodes = new Map(); scene.scene.traverse((n) => { if (n.isMesh) nodes.set(n.name, n); });
for (const structure of kneeSpecimen.structures) {
  same(structure.fmaId, null); same(structure.validation.anatomicalReview, false);
  same(structure.laterality, 'right-source-report');
  const mesh = nodes.get(structure.nodeName); assert(mesh);
  same(mesh.userData.structureId, structure.id); same(mesh.userData.prototypeOnly, false);
  same(mesh.userData.registeredToBodyParts3D, false);
  mesh.geometry.computeBoundingBox();
  same(mesh.geometry.boundingBox.min.toArray(), structure.bounds.min);
  same(mesh.geometry.boundingBox.max.toArray(), structure.bounds.max);
  const p = mesh.geometry.getAttribute('position'); let found = false;
  for (let i = 0; i < p.count; i++) if (p.getX(i) === structure.anchor[0] && p.getY(i) === structure.anchor[1] && p.getZ(i) === structure.anchor[2]) { found = true; break; }
  same(found, true, 'Label anchor is an actual source vertex');
  if (structure.tissue !== 'skeleton') same(structure.bounds.min.every((v, i) => v >= kneeJointBounds.min[i] && structure.bounds.max[i] <= kneeJointBounds.max[i]), true);
}
same(nodes.size, 15);
for (const study of kneeSpecimenStudies) {
  const before = initialKneeStudy(), state = reduceKneeStudy(before, kneeStudyAction(study.id));
  const visible = kneeStructures.filter((s) => !state.hidden.includes(s.id));
  same(visible.map((s) => s.nodeName).sort(), [...study.slugs].sort());
  same(activeKneeStudy(state.hidden).id, study.id);
  const removed = reduceKneeStudy(state, { type: 'visibility', id: state.selectedId, visible: false });
  same(removed.selectedId, null);
  const undo = reduceKneeStudy(removed, { type: 'undo' });
  same(undo.hidden, state.hidden); same(undo.selectedId, state.selectedId);
  same(reduceKneeStudy(undo, { type: 'redo' }).hidden, removed.hidden);
  const selected = reduceKneeStudy(removed, { type: 'select', id: state.selectedId });
  same(selected.hidden.includes(state.selectedId), false, 'Search/select restores a hidden surface');
  same(selected.future.length, 0);
}
let state = initialKneeStudy();
for (const tissue of ['skeleton', 'cartilage', 'ligament', 'meniscus', 'tendon', 'muscle']) {
  const before = state;
  state = reduceKneeStudy(state, { type: 'group', tissue, visible: false });
  same(state.history.length, before.history.length + 1, 'Group toggle is one history step');
  same(reduceKneeStudy(state, { type: 'undo' }).hidden, before.hidden);
}
same(state.hidden.length, 15); same(state.selectedId, null);
same(reduceKneeStudy(state, kneeStudyAction('all')).hidden, []);
same(reduceKneeStudy(state, { type: 'select', id: 'FMA24474' }), state, 'Foreign body ID is rejected');
same(reduceKneeStudy(state, { type: 'group', tissue: 'unknown', visible: true }), state);
same(kneeStudyAction('__proto__'), null);
same(filterKneeStructures('ACL').map((s) => s.slug), ['acl']);
same(filterKneeStructures('  meniscus ').map((s) => s.slug), ['meniscus-group']);
same(filterKneeStructures('nerves').length, 0);

// Render the actual controls with installed React/Base UI. Only the WebGL scene
// is replaced: this verifies markup/scene props, not browser layout or GPU output.
const component = await componentBuild({ entryPoints: ['app/um-knee-study.tsx'], bundle: true, write: false, format: 'cjs', platform: 'node', plugins: [{ name: 'scene-boundary', setup(api) {
  api.onLoad({ filter: /body-scene\.tsx$/ }, () => ({ loader: 'js', contents: 'export function BodyScene(props) { globalThis.sceneProps = props; return null; } export function retryBodyAssets() {}' }));
} }] });
const require = createRequire(import.meta.url), React = require('react'), mod = { exports: {} };
const context = { module: mod, exports: mod.exports, require, console, process: { env: { NODE_ENV: 'test' } } };
runInNewContext(component.outputFiles[0].text, context);
const html = require('react-dom/server').renderToStaticMarkup(React.createElement(mod.exports.KneeSpecimenView));
for (const label of ['Knee dissection study', 'Search knee specimen structures', 'Knee tissue separation', 'Fade others', 'Source &amp; limitations', 'Loading knee specimen']) same(html.includes(label), true, label);
same(context.sceneProps.structures.length, 15); same(context.sceneProps.explode, 0);
same(context.sceneProps.catalog.sourceVersion, kneeCatalog.sourceVersion);
same(JSON.stringify(context.sceneProps.cameraBounds), JSON.stringify(kneeJointBounds));
same(context.sceneProps.originStyle, 'selected-guide');
const launcher = await readFile('app/body-explorer.tsx', 'utf8');
same(launcher.includes("kneeSpecimenOpen && ['leg', 'foot', 'thigh', 'pelvis'].includes(initialRegion) && !exam"), true);
same(launcher.includes('kneeSpecimenLauncher.current?.focus()'), true);
console.log(JSON.stringify({ checks, publicMeshes: nodes.size, studies: kneeSpecimenStudies.length, originalGeometryUnchanged: true, componentMarkup: 'passed', browserOrClinicalAcceptance: false }));
