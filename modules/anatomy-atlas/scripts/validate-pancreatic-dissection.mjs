import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Matrix4, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { sourceObjShape } from './source-surface-audit.mjs';
import { sourceTopology } from './source-topology.mjs';
import { cache } from './bodyparts-archive.mjs';
import {
  pancreaticCatalog as catalog,
  pancreaticFor,
  pancreaticViewCatalog,
  pancreaticPresets,
  pancreaticColour,
  pancreaticNotes,
} from '../lib/pancreatic.ts';
import {
  bodyDisplayCatalog,
  pancreasDisplayCorrection,
} from '../lib/body-display-catalog.ts';

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
const rawBytes = await readFile(
  'public/models/bodyparts3d/full-body/catalog.json',
);
same(
  hash(rawBytes),
  '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7',
);
const root = JSON.parse(rawBytes),
  parent = catalog.parent;
const snapshot = JSON.stringify({ catalog, root, pancreasDisplayCorrection });
same(parent, pancreasDisplayCorrection.replacement);
same(
  parent,
  bodyDisplayCatalog(root).structures.find((s) => s.id === parent.id),
);
same(catalog.coordinateSystem, root.coordinateSystem);
same(catalog.license, 'CC-BY-4.0');
same(catalog.credit, pancreasDisplayCorrection.licence.credit);
same(
  catalog.auditSha256,
  hash(await readFile('docs/pancreatic-source-audit.json')),
);
same(
  catalog.structures.map((s) => [
    s.fmaId,
    s.sourceTree,
    s.sources.map((f) => f.file),
  ]),
  [
    ['FMA10419', 'partof', ['FJ1896']],
    ['FMA63103', 'isa', ['FJ2630']],
    ['FMA7198', 'isa', ['FJ1895']],
  ],
);
const layers = pancreaticFor(parent);
same(layers.length, 2);
same(pancreaticViewCatalog(parent).structures, layers);
const view = pancreaticViewCatalog(parent, true);
same(view.structures.length, 3);
same(view.contextIds.length, 1);
check(!view.selectableIds.some((id) => view.contextIds.includes(id)));
check(!view.structures.some((s) => s.id === parent.id));
same(
  new Set(view.structures.flatMap((s) => s.sources.map((f) => f.file))).size,
  3,
);
check(!view.structures.some((s) => s.sources.some((f) => f.file === 'FJ2629')));
same(pancreaticPresets(layers), {
  all: layers.map((s) => s.id),
  duct: [layers[0].id],
  tree: [layers[1].id],
});
same(new Set(view.structures.map(pancreaticColour)).size, 3);
for (const s of layers) check(pancreaticNotes[s.fmaId]);
for (const wrong of [
  null,
  pancreasDisplayCorrection.original,
  root.structures[0],
  { ...parent, id: 'foreign' },
  { ...parent, sourceTree: 'isa' },
  { ...parent, center: [0, 0, 0] },
  { ...parent, bounds: { min: [0, 0, 0], max: [1, 1, 1] } },
  { ...parent, sources: parent.sources.slice(1) },
  { ...parent, validation: { status: 'approved', anatomicalReview: true } },
]) {
  same(pancreaticFor(wrong), []);
  same(pancreaticViewCatalog(wrong, true).structures, []);
  same(pancreaticViewCatalog(wrong, true).bundles, []);
}
const matrix = new Matrix4().fromArray(
  catalog.coordinateSystem.sourceToSceneColumnMajor,
);
const parse = async (bytes) =>
  new GLTFLoader().parseAsync(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    '',
  );
const triangles = (g) => {
  const p = g.attributes.position,
    ix = g.index;
  return Array.from({ length: (ix?.count ?? p.count) / 3 }, (_, f) =>
    [0, 1, 2]
      .map((n) => {
        const i = ix ? ix.getX(3 * f + n) : 3 * f + n;
        return [p.getX(i), p.getY(i), p.getZ(i)].join(',');
      })
      .join(';'),
  ).sort();
};
const bundle = catalog.bundles[0];
const bytes = await readFile(
  'public' + new URL(bundle.url, 'https://local.invalid').pathname,
);
same(bytes.length, bundle.bytes);
same(hash(bytes), bundle.sha256);
same(
  hash(bytes),
  'e96b496cb36205d2338204d6d0c6f94cb6e3722f7ff9a7a4e176d435d6de0b1c',
);
const scene = await parse(bytes),
  meshes = [];
scene.scene.traverse((m) => {
  if (m.isMesh) meshes.push(m);
});
same(meshes.length, 3);
let triangleCount = 0;
for (const s of catalog.structures) {
  const source = s.sources[0],
    raw = await readFile(`${cache}/${s.sourceTree}/${source.file}.obj`);
  same(hash(raw), source.sha256);
  const shape = sourceObjShape(raw),
    topology = sourceTopology(shape);
  same(topology.closedOrientedManifold, true);
  same(topology.components.length, 1);
  const positions = shape.vertices.map((v) =>
    Array.from(
      new Float32Array(
        new Vector3(...new Float32Array(v)).applyMatrix4(matrix).toArray(),
      ),
    ),
  );
  const expected = shape.faces
    .map((f) => f.map((i) => positions[i].join(',')).join(';'))
    .sort();
  const mesh = meshes.find((m) => m.name === s.nodeName);
  check(mesh);
  same(mesh.userData.structureId, s.id);
  same(mesh.userData.anatomicalReview, false);
  same(s.validation, { status: 'unvalidated', anatomicalReview: false });
  same(
    triangles(mesh.geometry),
    expected,
    'Every triangle coordinate and winding is preserved',
  );
  triangleCount += expected.length;
  mesh.geometry.computeBoundingBox();
  same(mesh.geometry.boundingBox.min.toArray(), s.bounds.min);
  same(mesh.geometry.boundingBox.max.toArray(), s.bounds.max);
  same(mesh.geometry.boundingBox.getCenter(new Vector3()).toArray(), s.center);
  check(positions.some((p) => p.every((v, i) => v === s.anchor[i])));
}
same(triangleCount, 12690);
const combined = await parse(
  await readFile(
    'public' +
      new URL(pancreasDisplayCorrection.bundle.url, 'https://local.invalid')
        .pathname,
  ),
);
const parentMeshes = [];
combined.scene.traverse((m) => {
  if (m.isMesh) parentMeshes.push(m);
});
same(
  meshes.flatMap((m) => triangles(m.geometry)).sort(),
  parentMeshes.flatMap((m) => triangles(m.geometry)).sort(),
  'The study partitions the corrected parent without changing its surfaces',
);
same(
  JSON.stringify({ catalog, root, pancreasDisplayCorrection }),
  snapshot,
  'Read-only model helpers',
);
const report = {
  passed: true,
  checks,
  selections: layers.length,
  referenceSurfaces: 1,
  sourceFiles: 3,
  triangles: triangleCount,
  bytes: bytes.length,
  sha256: hash(bytes),
  geometryChanged: false,
  clinicalApproval: false,
  imagingRegistration: false,
  browserTesting: false,
};
await writeFile(
  'docs/pancreatic-dissection-validation.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(report);
