import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { build } from './workspace-test-build.mjs';
import { build as componentBuild } from './workspace-component-test-build.mjs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
const hash = (b) => createHash('sha256').update(b).digest('hex');
const json = async (p) => JSON.parse(await readFile(p));
const catalog = await json('public/models/um-limb/catalog.json'), audit = await json('content/um-limb-source-audit.json');
let checks = 0, faces = 0;
const same = (a, b, message) => { checks++; assert.deepEqual(a, b, message); };
same(hash(await readFile('public/models/bodyparts3d/full-body/catalog.json')), '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7');
same(hash(await readFile('public/models/um-knee/catalog.json')), catalog.companionKneeCatalogSha256);
same(hash(await readFile('public/models/um-knee/knee.glb')), 'cf61571a8c80f463805b1362bb81b3d9eec3c62a1780c7288355e4a20fa8515b');
same(catalog.structures.length, 52); same(catalog.registeredToBodyParts3D, false); same(catalog.imagingRegistration, null);
same(audit.clinicalApproval, false); same(audit.dicomDownloaded, false);
same(audit.sourceTriangles - audit.displayTriangles, 282);
const meshes = new Map();
for (const bundle of catalog.bundles) {
  const bytes = await readFile('public' + bundle.url);
  same(hash(bytes), bundle.sha256); same(bytes.length, bundle.bytes); same(bytes.length < 25 * 1024 * 1024, true);
  const gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
  let count = 0;
  gltf.scene.traverse((m) => { if (m.isMesh) { assert(!meshes.has(m.name)); meshes.set(m.name, m); count++; } });
  same(count, bundle.structures);
}
for (const s of catalog.structures) {
  const record = audit.structures.find((r) => r.id === s.id), m = meshes.get(s.nodeName);
  assert(record && m);
  same(s.fmaId, null); same(s.validation.anatomicalReview, false);
  same(m.userData.structureId, s.id); same(m.userData.sourceLicense, 'CC0-1.0');
  same(m.userData.registeredToBodyParts3D, false);
  const raw = await readFile('content/sources/um-limb/' + record.sourceFile);
  same(hash(raw), record.sourceSha256); same(raw.length, record.sourceBytes);
  const p = m.geometry.getAttribute('position'), normals = m.geometry.getAttribute('normal'), index = m.geometry.index;
  m.geometry.computeBoundingBox(); same(m.geometry.boundingBox.min.toArray(), s.bounds.min); same(m.geometry.boundingBox.max.toArray(), s.bounds.max);
  let cursor = 0, foundAnchor = false, error = 0; const omitted = [];
  for (let f = 0; f < raw.readUInt32LE(80); f++) {
    faces++;
    const source = [0, 1, 2].map((v) => [0, 1, 2].map((k) => raw.readFloatLE(84 + f * 50 + 12 + 12 * v + 4 * k)));
    const [a, b, c] = source;
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    if (uy * vz - uz * vy === 0 && uz * vx - ux * vz === 0 && ux * vy - uy * vx === 0) { omitted.push(f); continue; }
    for (const original of source) {
      const n = index.getX(cursor++), point = [p.getX(n), p.getY(n), p.getZ(n)];
      const expected = [Math.fround(original[0] * .01), Math.fround(original[2] * .01), Math.fround(-original[1] * .01)];
      assert(point.every((v, k) => v === expected[k]), `${s.slug}: changed triangle ${f}`);
      const reverse = [point[0] / .01, -point[2] / .01, point[1] / .01];
      error = Math.max(error, ...reverse.map((v, k) => Math.abs(v - original[k])));
    }
  }
  same(cursor, index.count); same(omitted, record.omittedSourceFaces); same(omitted, s.omittedSourceFaces);
  same(error < .0001, true);
  for (let i = 0; i < p.count; i++) {
    if ([p.getX(i), p.getY(i), p.getZ(i)].every((v, k) => v === s.anchor[k])) foundAnchor = true;
    assert(Math.abs(Math.hypot(normals.getX(i), normals.getY(i), normals.getZ(i)) - 1) < 1e-5, 'Finite unit display normals');
  }
  same(foundAnchor, true);
}
same(meshes.size, 52); same(faces, 2263968);
const result = await build({ stdin: { contents: "export * from './lib/um-limb-studies.ts'; export * from './lib/independent-specimen.ts'; export * from './lib/body-arrangement.ts';", resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, format: 'esm', platform: 'node' });
const api = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
const { limbDefinitions, initialSpecimen, reduceSpecimen, specimenAction, activeSpecimenStudy, filterSpecimen } = api;
same(Object.keys(limbDefinitions), ['knee', 'hip-thigh', 'calf', 'foot', 'whole']);
same(limbDefinitions.whole.surfaces.length, 67);
same(new Set(limbDefinitions.whole.surfaces.map((s) => s.id)).size, 67);
same(limbDefinitions.knee.surfaces.length, 15);
const defaultBundleCounts = {};
for (const [key, definition] of Object.entries(limbDefinitions)) {
  const initial = initialSpecimen(definition);
  same(initial.history.length, 0); same(activeSpecimenStudy(definition, initial.hidden).id, definition.initialStudy);
  const visible = definition.surfaces.filter((s) => !initial.hidden.includes(s.id));
  defaultBundleCounts[key] = new Set(visible.map((s) => s.bundle)).size;
  for (const study of definition.studies) {
    const state = reduceSpecimen(definition, initial, specimenAction(definition, study.id));
    same(definition.surfaces.filter((s) => !state.hidden.includes(s.id)).map((s) => s.id).sort(), [...study.ids].sort());
    same(activeSpecimenStudy(definition, state.hidden).id, study.id);
    same(state.selectedId, study.selectedId);
    const removed = reduceSpecimen(definition, state, { type: 'visibility', id: study.selectedId, visible: false });
    same(removed.selectedId, null);
    const restored = reduceSpecimen(definition, removed, { type: 'undo' });
    same(restored.hidden, state.hidden); same(restored.selectedId, state.selectedId);
    same(reduceSpecimen(definition, restored, { type: 'redo' }).hidden, removed.hidden);
    same(reduceSpecimen(definition, removed, { type: 'select', id: study.selectedId }).hidden.includes(study.selectedId), false);
  }
  let state = initial;
  for (const tissue of new Set(definition.surfaces.map((s) => s.tissue))) state = reduceSpecimen(definition, state, { type: 'group', tissue, visible: false });
  same(state.hidden.length, definition.surfaces.length); same(state.selectedId, null);
  same(reduceSpecimen(definition, state, specimenAction(definition, 'all')).hidden, []);
  same(reduceSpecimen(definition, state, { type: 'select', id: 'FMA24474' }), state);
  const foreign = limbDefinitions.whole.surfaces.find((s) => !definition.surfaces.some((r) => r.id === s.id));
  if (foreign) same(reduceSpecimen(definition, state, { type: 'select', id: foreign.id }), state);
  same(filterSpecimen(definition, 'not-a-source-part').length, 0);
  same(specimenAction(definition, '__proto__'), null);
}
same(defaultBundleCounts.knee, 1); same(defaultBundleCounts.foot, 1);
same(defaultBundleCounts['hip-thigh'], 2); same(defaultBundleCounts.whole, 5);
same(limbDefinitions.foot.surfaces.find((s) => s.slug === 'foot-bone-group').grouped, true);
same(limbDefinitions['hip-thigh'].surfaces.find((s) => s.slug === 'pelvis-group').grouped, true);
const defaultFoot = initialSpecimen(limbDefinitions.foot);
same(limbDefinitions.foot.surfaces.filter((s) => !defaultFoot.hidden.includes(s.id)).length, 8);
const component = await componentBuild({ entryPoints: ['app/um-knee-study.tsx'], bundle: true, write: false, format: 'cjs', platform: 'node', plugins: [{ name: 'scene-boundary', setup(api) {
  api.onLoad({ filter: /body-scene\.tsx$/ }, () => ({ loader: 'js', contents: 'export function BodyScene(props) { globalThis.sceneProps = props; return null; } export function retryBodyAssets() {}' }));
} }] });
const require = createRequire(import.meta.url), React = require('react'), mod = { exports: {} };
const context = { module: mod, exports: mod.exports, require, console, process: { env: { NODE_ENV: 'test' } } };
runInNewContext(component.outputFiles[0].text, context);
for (const definition of Object.values(limbDefinitions)) {
  const html = require('react-dom/server').renderToStaticMarkup(React.createElement(mod.exports.KneeSpecimenView, { specimen: definition }));
  same(html.includes(`Search ${definition.label.toLowerCase().replaceAll('&', '&amp;')} specimen structures`), true);
  const props = context.sceneProps, initial = initialSpecimen(definition);
  same(props.catalog.sourceVersion, definition.key);
  same(props.structures.length, definition.surfaces.length);
  same(JSON.stringify(props.hiddenIds), JSON.stringify(initial.hidden));
  same(props.selectedId, initial.selectedId);
  same(props.explode, 0);
  same(props.view, definition.studies.find((s) => s.id === definition.initialStudy).view);
  same(JSON.stringify(props.cameraBounds), JSON.stringify(definition.closeUp));
}
console.log(JSON.stringify({ checks, originalFacesChecked: faces, newSourceSurfaces: 52, totalUniqueLimbSurfaces: 67, studies: Object.values(limbDefinitions).reduce((n, s) => n + s.studies.length, 0), defaultBundleCounts, actualControlMarkupCases: 5, clinicalOrBrowserAcceptance: false }));
