import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {
  visualPathwayCatalog as catalog,
  visualPathwayFor,
  visualPathwayViewCatalog,
  visualPathwayPresets,
  visualPathwayColour,
  visualPathwayNotes,
} from '../lib/visual-pathway.ts';
import { visualPathwayCandidates } from './visual-pathway-candidates.mjs';

let checks = 0;
const same = (a, b, message) => {
  checks++;
  assert.deepEqual(a, b, message);
};
const check = (v, message) => {
  checks++;
  assert(v, message);
};
const hash = (v) => createHash('sha256').update(v).digest('hex');
const read = (p) => readFile(p);
const rootBytes = await read(
  'public/models/bodyparts3d/full-body/catalog.json',
);
same(
  hash(rootBytes),
  '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7',
);
const root = JSON.parse(rootBytes);
const original = JSON.stringify({ root, catalog });
same(
  catalog.parent,
  root.structures.find((s) => s.fmaId === 'FMA50801'),
);
same(catalog.coordinateSystem, root.coordinateSystem);
same(catalog.license, 'CC-BY-4.0');
same(catalog.credit, root.credit);
same(catalog.clinicalApproval, false);
same(
  catalog.auditSha256,
  hash(await read('docs/visual-pathway-source-audit.json')),
);
same(
  catalog.auditSha256,
  '5b1a018edcc3b4d271eeb5ae0fe81aef1b92161e1c179585573602ffd57184f6',
);
const layers = visualPathwayFor(catalog.parent);
same(layers.length, 3);
same(
  layers.map((s) => s.fmaId),
  visualPathwayCandidates.map((s) => s.id),
);
for (const s of layers) {
  const definition = visualPathwayCandidates.find((d) => d.id === s.fmaId);
  same(
    s.sources.map((f) => f.file),
    definition.files,
  );
  same(s.sourceName, definition.name);
  same(s.sourceTree, definition.tree);
  same(s.laterality, definition.side);
  check(visualPathwayNotes[s.fmaId]);
  check(/^#[a-f0-9]{6}$/.test(visualPathwayColour(s)));
  check(!root.structures.some((r) => r.id === s.id || r.fmaId === s.fmaId));
}
same(visualPathwayViewCatalog(catalog.parent).structures, layers);
same(visualPathwayViewCatalog(catalog.parent).contextIds, []);
const view = visualPathwayViewCatalog(catalog.parent, true);
same(view.structures.length, 7);
same(view.contextIds.length, 4);
same(
  view.selectableIds,
  layers.map((s) => s.id),
);
check(
  !view.structures.some((s) => s.id === catalog.parent.id),
  'Suppress enclosing solid brain',
);
for (const id of view.contextIds) {
  same(
    view.structures.find((s) => s.id === id),
    root.structures.find((s) => s.id === id),
  );
  check(!view.selectableIds.includes(id));
}
same(new Set(view.bundles.map((b) => b.id)).size, view.bundles.length);
for (const s of view.structures)
  check(view.bundles.some((b) => b.id === s.bundle));
const presets = visualPathwayPresets(layers);
same(Object.keys(presets), ['all', 'chiasm', 'tracts', 'right', 'left']);
same(presets.chiasm, [layers[0].id]);
same(
  presets.tracts,
  layers.slice(1).map((s) => s.id),
);
same(presets.right, [layers[0].id, layers[1].id]);
same(presets.left, [layers[0].id, layers[2].id]);
for (const field of [
  'id',
  'name',
  'fmaId',
  'laterality',
  'bundle',
  'nodeName',
  'file',
]) {
  const invalid = { ...catalog.parent, [field]: 'changed' };
  same(visualPathwayFor(invalid), []);
  same(visualPathwayViewCatalog(invalid, true).structures, []);
}
for (const mutate of [
  (p) => {
    p.sources[0].sha256 = '0'.repeat(64);
  },
  (p) => {
    p.center[0] += 0.001;
  },
  (p) => {
    p.bounds.min[0] += 0.001;
  },
]) {
  const invalid = structuredClone(catalog.parent);
  mutate(invalid);
  same(visualPathwayFor(invalid), []);
}
same(visualPathwayFor(null), []);
same(visualPathwayViewCatalog(null, true).bundles, []);
const bytes = await read('public' + catalog.bundles[0].url.split('?')[0]);
same(bytes.length, 120068);
same(hash(bytes), catalog.bundles[0].sha256);
same(
  hash(bytes),
  'c9698e52e4678c06a5ed5df8212e3ecb1ce89d9a25d4e1859f0ec5be7d4864bc',
);
const prototype = await read(
  'content/prototypes/visual-pathway/visual-pathway-prototype.glb',
);
same(
  hash(prototype),
  'c85eb132948e1b9ad8d6b618c95f04f6772a36268a9583f892d91b1f3df1598b',
);
const parse = (b) =>
  new GLTFLoader().parseAsync(
    b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength),
    '',
  );
const source = await parse(prototype),
  runtime = await parse(bytes);
let meshes = 0,
  triangles = 0;
runtime.scene.traverse((mesh) => {
  if (!mesh.isMesh) return;
  meshes++;
  const s = layers.find((s) => s.nodeName === mesh.name);
  const raw = source.scene.getObjectByName(mesh.name);
  check(s && raw);
  same(mesh.userData.structureId, s.id);
  same(mesh.userData.anatomicalReview, false);
  check(!mesh.userData.prototype);
  check(!mesh.material.map, 'No new texture');
  same(
    Array.from(mesh.geometry.attributes.position.array),
    Array.from(raw.geometry.attributes.position.array),
  );
  same(
    Array.from(mesh.geometry.index.array),
    Array.from(raw.geometry.index.array),
  );
  triangles += mesh.geometry.index.count / 3;
});
same(meshes, 3);
same(triangles, 6456);
same(JSON.stringify({ root, catalog }), original);
const report = {
  passed: true,
  checks,
  meshes,
  triangles,
  sourceFiles: 4,
  parentViews: 1,
  contextLandmarks: 4,
  unchangedPrototypeGeometry: true,
  solidParentSuppressed: true,
  clinicalApproval: false,
  browserAcceptance: false,
  fibresOrRegistrationAdded: false,
  limits:
    'Three source-labelled surfaces. Source seam, tract boundaries and continuity require anatomical review. Shared navigation/history/cutaway/origin suites exercise UI integration; not device or clinical acceptance.',
};
await writeFile(
  'docs/visual-pathway-validation.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(report);
