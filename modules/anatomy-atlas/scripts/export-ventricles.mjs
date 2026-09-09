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

export const ventricularDefinitions = [
  ['FMA78450', 'left lateral ventricle', 'left', 'FJ1767'],
  ['FMA78449', 'right lateral ventricle', 'right', 'FJ1814'],
  ['FMA78454', 'third ventricle', 'midline', 'FJ1730'],
  ['FMA78469', 'fourth ventricle', 'midline', 'FJ1731'],
];
const hash = (b) => createHash('sha256').update(b).digest('hex');
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
for (const [fmaId, name, side, file] of ventricularDefinitions) {
  const definition = records.find((r) => r.tree === 'partof' && r.id === fmaId);
  assert.equal(definition.name, name);
  assert.deepEqual(definition.files, [file]);
  policy.assertNoKnownHolds([definition]);
  const source = parent.sources.find((s) => s.file === file);
  assert(source);
  const raw = await readFile(`${cache}/partof/${file}.obj`);
  assert.equal(hash(raw), source.sha256);
  const topology = sourceTopology(sourceObjShape(raw));
  assert.equal(
    topology.components.length,
    1,
    'Unexpected disconnected source fragments',
  );
  sourceReports.push({ file, sha256: source.sha256, topology });
  const parts = [];
  new OBJLoader().parse(raw.toString()).traverse((mesh) => {
    if (!mesh.isMesh) return;
    let geometry = mesh.geometry.clone();
    geometry.deleteAttribute('normal');
    geometry.deleteAttribute('uv');
    geometry = mergeVertices(geometry, 0.0001);
    geometry.computeVertexNormals();
    geometry.applyMatrix4(matrix);
    parts.push(geometry);
  });
  const geometry = mergeGeometries(parts);
  geometry.computeBoundingBox();
  const box = geometry.boundingBox,
    center = box.getCenter(new Vector3());
  assert(
    box.min.toArray().every(Number.isFinite) &&
      box.max.toArray().every(Number.isFinite),
  );
  if (side !== 'midline') assert(side === 'left' ? center.x > 0 : center.x < 0);
  const positions = geometry.getAttribute('position');
  let anchor = center.clone(),
    distance = Infinity;
  for (let i = 0; i < positions.count; i++) {
    const p = new Vector3().fromBufferAttribute(positions, i),
      d = p.distanceToSquared(center);
    if (d < distance) {
      anchor = p;
      distance = d;
    }
  }
  const id = `vm:anatomy:body:head-neck:${side}:space:${name.replaceAll(' ', '-')}`;
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
    category: 'space',
    laterality: side,
    region: 'head-neck',
    regions: ['head-neck'],
    bundle: 'ventricles',
    nodeName: fmaId,
    bounds: { min: box.min.toArray(), max: box.max.toArray() },
    center: center.toArray(),
    anchor: anchor.toArray(),
    sourceTree: 'partof',
    sources: [source],
    parentId: parent.id,
    coverageNote:
      'Existing brain source space representation, not solid brain tissue, an acquired scan, or validated patient segmentation. Fine channels and apertures are not independently segmented.',
    provenance: {
      method: 'licensed-source-mesh',
      license: catalog.license,
      sourceVersion: '4.0',
      recovered: false,
    },
    validation: { status: 'unvalidated', anatomicalReview: false },
  });
}
assert.equal(
  new Set(structures.flatMap((s) => s.sources.map((f) => f.file))).size,
  4,
);
const contextFmas = [
  'FMA72826',
  'FMA72827',
  'FMA258714',
  'FMA258716',
  'FMA86464',
];
const context = contextFmas.map((id) =>
  catalog.structures.find((s) => s.fmaId === id),
);
assert(context.every(Boolean));
assert(
  context.every((s) =>
    s.sources.every((f) => !parent.sources.some((p) => p.file === f.file)),
  ),
);
const contextBundles = catalog.bundles.filter((b) =>
  context.some((s) => s.bundle === b.id),
);
for (const b of contextBundles) {
  const bytes = await readFile(
    'public' + new URL(b.url, 'https://local.invalid').pathname,
  );
  assert.equal(hash(bytes), b.sha256);
}
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
const output = 'public/models/bodyparts3d/ventricles';
await mkdir(output, { recursive: true });
await writeFile(`${output}/ventricles.glb`, bytes);
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
      name: 'Ventricular spaces',
      description:
        'Focused source-component dissection; clinical validation pending.',
    },
  ],
  structures: [...structures, ...context],
  ventricularIds: structures.map((s) => s.id),
  contextIds: context.map((s) => s.id),
  bundles: [
    {
      id: 'ventricles',
      url: `/models/bodyparts3d/ventricles/ventricles.glb?v=${hash(bytes)}`,
      bytes: bytes.length,
      sha256: hash(bytes),
      structures: 4,
    },
    ...contextBundles,
  ],
  coverage: {
    nerves:
      'Four ventricular space representations and five existing deep-brain context surfaces; not the complete brain or a fluid simulation.',
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
    context: context.length,
    bytes: bytes.length,
    sha256: hash(bytes),
    triangles: sourceReports.reduce((n, r) => n + r.topology.triangles, 0),
  }),
);
