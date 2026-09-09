import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Group, Mesh, MeshStandardMaterial, Matrix4, Vector3 } from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import {
  mergeVertices,
  mergeGeometries,
} from 'three/addons/utils/BufferGeometryUtils.js';
import { loadSourceHolds } from './load-source-holds.mjs';
import { cache } from './bodyparts-archive.mjs';
import { sourceObjShape } from './source-surface-audit.mjs';
import { sourceTopology } from './source-topology.mjs';

const definitions = [
  [
    'FMA61993',
    'midbrain',
    ['FJ1738', 'FJ1762', 'FJ1770', 'FJ1779', 'FJ1810', 'FJ1817', 'FJ1826'],
  ],
  ['FMA67943', 'pons', ['FJ1775', 'FJ1822']],
  ['FMA62004', 'medulla oblongata', ['FJ1769', 'FJ1831']],
  ['FMA67944', 'cerebellum', ['FJ1781', 'FJ1830']],
];
const hash = (b) => createHash('sha256').update(b).digest('hex');
const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const { catalog, records, policy, evidence } = await loadSourceHolds();
const parent = catalog.structures.find((s) => s.fmaId === 'FMA50801');
assert.equal(parent.sourceTree, 'partof');
assert.equal(parent.sources.length, 59);
const matrix = new Matrix4().fromArray(
  catalog.coordinateSystem.sourceToSceneColumnMajor,
);
const group = new Group(),
  structures = [],
  sourceReports = [];
for (const [fmaId, name, files] of definitions) {
  const definition = records.find((r) => r.tree === 'partof' && r.id === fmaId);
  assert.equal(definition.name, name);
  assert.deepEqual(
    definition.files,
    files,
    'Require complete official compound, not one hemisphere',
  );
  policy.assertNoKnownHolds([definition]);
  const sources = files.map((file) =>
    parent.sources.find((s) => s.file === file),
  );
  assert(sources.every(Boolean));
  const parts = [];
  for (const source of sources) {
    const raw = await readFile(`${cache}/partof/${source.file}.obj`);
    assert.equal(hash(raw), source.sha256);
    const topology = sourceTopology(sourceObjShape(raw));
    // Preserve the original pons remnants; do not silently repair or claim manifold quality.
    assert.equal(
      topology.components.length,
      source.file === 'FJ1775' ? 2 : source.file === 'FJ1822' ? 3 : 1,
    );
    assert.equal(topology.duplicateFaces, source.file === 'FJ1822' ? 2 : 0);
    for (const key of [
      'collapsedFaces',
      'degenerateFaces',
      'boundaryEdges',
      'nonManifoldEdges',
      'nonManifoldVertices',
      'inconsistentWindingEdges',
    ])
      assert.equal(topology[key], 0);
    sourceReports.push({ file: source.file, sha256: source.sha256, topology });
    new OBJLoader().parse(raw.toString()).traverse((mesh) => {
      if (!mesh.isMesh) return;
      let geometry = mesh.geometry.clone();
      geometry.deleteAttribute('normal');
      geometry.deleteAttribute('uv');
      geometry = mergeVertices(geometry, 0.000001);
      geometry.computeVertexNormals();
      geometry.applyMatrix4(matrix);
      parts.push(geometry);
    });
  }
  const geometry = mergeGeometries(parts);
  geometry.computeBoundingBox();
  const box = geometry.boundingBox,
    center = box.getCenter(new Vector3());
  assert([...box.min.toArray(), ...box.max.toArray()].every(Number.isFinite));
  let anchor = center.clone(),
    distance = Infinity;
  const positions = geometry.getAttribute('position');
  for (let i = 0; i < positions.count; i++) {
    const p = new Vector3().fromBufferAttribute(positions, i),
      d = p.distanceToSquared(center);
    if (d < distance) {
      anchor = p;
      distance = d;
    }
  }
  const id = `vm:anatomy:body:head-neck:midline:organ:${name.replaceAll(' ', '-')}`;
  const mesh = new Mesh(geometry, new MeshStandardMaterial());
  mesh.name = fmaId;
  mesh.userData = { structureId: id, fmaId, parentId: parent.id };
  group.add(mesh);
  structures.push({
    id,
    fmaId,
    name: name[0].toUpperCase() + name.slice(1),
    sourceName: name,
    system: 'nerves',
    category: 'organ',
    laterality: 'midline',
    region: 'head-neck',
    regions: ['head-neck'],
    bundle: 'brainstem',
    nodeName: fmaId,
    bounds: { min: box.min.toArray(), max: box.max.toArray() },
    center: center.toArray(),
    anchor: anchor.toArray(),
    sourceTree: 'partof',
    sources,
    parentId: parent.id,
    coverageNote:
      'Complete source-table compound from the existing brain, not proof of anatomical completeness. Internal nuclei, pathways and cerebellar lobules are not separately selectable. Original pons source remnants are retained.',
    provenance: {
      method: 'licensed-source-mesh',
      license: catalog.license,
      sourceVersion: '4.0',
      recovered: false,
    },
    validation: { status: 'unvalidated', anatomicalReview: false },
  });
}
const brainstem = records.find(
  (r) => r.tree === 'partof' && r.id === 'FMA79876',
);
assert.deepEqual(
  structures
    .slice(0, 3)
    .flatMap((s) => s.sources.map((f) => f.file))
    .sort(compare),
  [...brainstem.files].sort(compare),
);
assert.equal(
  new Set(structures.flatMap((s) => s.sources.map((f) => f.file))).size,
  13,
);
const ventricular = JSON.parse(
  await readFile('public/models/bodyparts3d/ventricles/catalog.json'),
);
assert.deepEqual(ventricular.parent, parent);
const context = ventricular.structures.filter((s) => s.fmaId === 'FMA78469');
assert.equal(context.length, 1);
assert(
  context.every((s) =>
    s.sources.every(
      (f) => !structures.some((p) => p.sources.some((v) => v.file === f.file)),
    ),
  ),
);
const contextBundle = ventricular.bundles.find((b) => b.id === 'ventricles');
assert.equal(
  hash(
    await readFile(
      'public' + new URL(contextBundle.url, 'https://local.invalid').pathname,
    ),
  ),
  contextBundle.sha256,
);
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((result) => {
      this.result = result;
      this.onloadend?.();
    });
  }
};
const bytes = Buffer.from(
  await new GLTFExporter().parseAsync(group, { binary: true }),
);
const output = 'public/models/bodyparts3d/brainstem';
await mkdir(output, { recursive: true });
await writeFile(`${output}/brainstem.glb`, bytes);
const manifest = {
  version: 1,
  sourceVersion: '4.0',
  license: catalog.license,
  credit: catalog.credit,
  coordinateSystem: catalog.coordinateSystem,
  evidence,
  parent,
  regions: [
    {
      id: 'head-neck',
      name: 'Brainstem and cerebellum',
      description: 'Existing source compounds; clinical validation pending.',
    },
  ],
  structures: [...structures, ...context],
  selectableIds: structures.map((s) => s.id),
  contextIds: context.map((s) => s.id),
  bundles: [
    {
      id: 'brainstem',
      url: `/models/bodyparts3d/brainstem/brainstem.glb?v=${hash(bytes)}`,
      bytes: bytes.length,
      sha256: hash(bytes),
      structures: 4,
    },
    contextBundle,
  ],
  coverage: {
    nerves:
      'Three brainstem divisions and the cerebellum, with optional fourth ventricular space. Not the whole brain or complete internal anatomy.',
    organs: 'No additional organs.',
  },
  excluded: [],
  sourceReports,
};
await writeFile(
  `${output}/catalog.json`,
  JSON.stringify(manifest, null, 2) + '\n',
);
console.log(
  JSON.stringify({
    structures: 4,
    files: 13,
    context: 1,
    bytes: bytes.length,
    sha256: hash(bytes),
    triangles: sourceReports.reduce((n, r) => n + r.topology.triangles, 0),
  }),
);
