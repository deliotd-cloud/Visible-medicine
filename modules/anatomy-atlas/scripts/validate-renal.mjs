import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {
  renalCatalog,
  renalFor,
  renalViewCatalog,
  renalPresets,
  renalColour,
  renalNotes,
} from '../lib/renal.ts';
import { renalVascularCandidates } from './renal-vascular-candidates.mjs';

let checks = 0;
const same = (a, b, message) => {
  checks++;
  assert.deepEqual(a, b, message);
};
const check = (v, message) => {
  checks++;
  assert(v, message);
};
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const digest = (value) => hash(JSON.stringify(value));
const rootBytes = await readFile(
  'public/models/bodyparts3d/full-body/catalog.json',
);
same(
  hash(rootBytes),
  '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7',
);
const root = JSON.parse(rootBytes);
const initial = JSON.stringify({ root, renalCatalog });
const expectedIds = [
  'FMA70492',
  'FMA70493',
  'FMA69265',
  'FMA14335',
  'FMA14336',
  'FMA14343',
  'FMA14349',
];
same(
  renalCatalog.structures.map((s) => s.fmaId),
  expectedIds,
);
same(renalCatalog.parents.length, 2);
same(renalCatalog.contextRecords.length, 10);
same(renalCatalog.clinicalApproval, false);
same(renalCatalog.license, root.license);
same(renalCatalog.credit, root.credit);
same(renalCatalog.coordinateSystem, root.coordinateSystem);
same(
  hash(await readFile('docs/renal-vascular-source-audit.json')),
  renalCatalog.auditSha256,
);
same(
  renalCatalog.auditSha256,
  '276282aca048255f421856c0fa7f2332e8c19e71501664e4b43a2d208d9eb262',
);
same(
  renalCatalog.structures.reduce((n, s) => n + s.sources.length, 0),
  10,
);
for (const s of renalCatalog.structures) {
  const definition = renalVascularCandidates.find((d) => d.id === s.fmaId);
  same(s.sourceTree, definition.tree);
  same(s.sourceName, definition.name);
  same(
    s.sources.map((f) => f.file),
    definition.files,
  );
  same(s.laterality, definition.side);
  same(s.role, definition.role);
  check(
    !root.structures.some((r) => r.fmaId === s.fmaId),
    'New nested identity, not duplicate root entry',
  );
  check(renalNotes[s.fmaId]);
  check(
    !s.sources.some((f) => ['FJ3467', 'FJ3476', 'FJ3576'].includes(f.file)),
  );
  for (const source of s.sources) check(/^[a-f0-9]{64}$/.test(source.sha256));
}
for (const parent of renalCatalog.parents) {
  same(
    parent,
    root.structures.find((s) => s.id === parent.id),
  );
  const layers = renalFor(parent);
  same(layers.length, parent.laterality === 'right' ? 4 : 3);
  check(
    layers.every(
      (s) => s.laterality === parent.laterality && s.parentId === parent.id,
    ),
  );
  const presets = renalPresets(layers);
  same(Object.keys(presets), ['all', 'arteries', 'veins', 'adrenal']);
  same(presets.veins.length, 2);
  same(presets.arteries.length, parent.laterality === 'right' ? 2 : 1);
  same(presets.adrenal.length, parent.laterality === 'right' ? 2 : 1);
  same(renalViewCatalog(parent).structures, layers);
  const view = renalViewCatalog(parent, true);
  same(view.contextIds.length, 6);
  same(
    view.selectableIds,
    layers.map((s) => s.id),
  );
  check(view.contextIds.includes(parent.id));
  for (const id of view.contextIds) {
    const s = view.structures.find((s) => s.id === id);
    same(
      s,
      root.structures.find((s) => s.id === id),
    );
    check(
      s.laterality === parent.laterality ||
        ['midline', 'unpaired', 'unspecified'].includes(s.laterality),
    );
    check(!view.selectableIds.includes(id));
  }
  same(new Set(view.bundles.map((b) => b.id)).size, view.bundles.length);
  for (const s of view.structures)
    check(view.bundles.some((b) => b.id === s.bundle));
  for (const s of layers)
    same(renalColour(s), s.role.endsWith('vein') ? '#657fb0' : '#c86059');
  for (const field of [
    'id',
    'name',
    'fmaId',
    'laterality',
    'bundle',
    'nodeName',
    'file',
  ]) {
    const invalid = { ...parent, [field]: 'changed' };
    same(renalFor(invalid), []);
    same(renalViewCatalog(invalid, true).structures, []);
  }
  const changed = structuredClone(parent);
  changed.sources[0].sha256 = '0'.repeat(64);
  same(renalFor(changed), []);
  changed.center[0] += 0.001;
  same(renalFor(changed), []);
}
same(renalFor(null), []);
same(renalViewCatalog(null, true).bundles, []);
const pins = JSON.parse(
  await readFile('content/nested-teaching-bindings.v1.json'),
);
const parentIds = renalCatalog.parents.map((p) => p.id);
same(pins.parents.length, 9);
same(pins.bindings.length, 60);
// Full v111 arrays, in original order: the extension must not silently rebind old lessons.
same(
  digest(pins.parents.filter((p) => !parentIds.includes(p.id))),
  '8fcc57f9abb2be6e17abffede258ad400c4e1f52c01bdea77cf3761bb548cd37',
);
same(
  digest(pins.bindings.filter((b) => b.study !== 'renal')),
  'b8d77e23bb282aea65637acc3214e389799a683d4a850dd534bb204baf9e45b4',
);
same(pins.bindings.filter((b) => b.study === 'renal').length, 7);
const bundle = renalCatalog.bundles[0];
const bytes = await readFile('public' + bundle.url.split('?')[0]);
same(bytes.length, 266784);
same(
  hash(bytes),
  '410fb0c4179785c91d018e549cd0ffbdd48c8e9919620dc0f32cdac3559c6a3e',
);
same(hash(bytes), bundle.sha256);
const gltf = await new GLTFLoader().parseAsync(
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  '',
);
let meshes = 0,
  triangles = 0;
gltf.scene.traverse((mesh) => {
  if (!mesh.isMesh) return;
  meshes++;
  const s = renalCatalog.structures.find((s) => s.nodeName === mesh.name);
  check(s);
  same(mesh.userData.structureId, s.id);
  same(mesh.userData.anatomicalReview, false);
  check(!mesh.userData.prototype);
  check(!mesh.material.map, 'No texture dependency');
  check(
    Array.from(mesh.geometry.attributes.position.array).every(Number.isFinite),
  );
  triangles += mesh.geometry.index.count / 3;
});
same(meshes, 7);
same(triangles, 14332);
same(JSON.stringify({ root, renalCatalog }), initial, 'Read-only validation');
const report = {
  passed: true,
  checks,
  meshes,
  triangles,
  sourceFiles: 10,
  parentViews: 2,
  contextPerSide: 6,
  legacyTeachingBindingsUnchanged: 53,
  clinicalApproval: false,
  browserAcceptance: false,
  internalKidneyTissueAdded: false,
  limits:
    'Source geometry and identities, not clinical topology, complete circulation, device or imaging acceptance. Shared callback/navigation/access suites cover integration.',
};
await writeFile(
  'docs/renal-validation.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(report);
