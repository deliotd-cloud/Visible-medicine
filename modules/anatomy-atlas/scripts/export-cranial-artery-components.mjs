import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import {
  BufferGeometry,
  Float32BufferAttribute,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Scene,
  Vector3,
} from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { sourceObjShape } from './source-surface-audit.mjs';
import { sourceTopology } from './source-topology.mjs';
import { preflightCurrentSourceHolds } from './current-source-holds.mjs';

const hash = (value) => createHash('sha256').update(value).digest('hex');
const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
const source = await readJson(
  'public/models/bodyparts3d/cranial-arteries/catalog.json',
);
const root = await readJson('public/models/bodyparts3d/full-body/catalog.json');
const parents = source.structures.filter((s) => s.sources.length > 1);
assert.deepEqual(
  parents.map((p) => p.fmaId),
  ['FMA50519', 'FMA50520', 'FMA50082'],
);
const parentBundles = source.bundles;
assert.equal(parentBundles.length, 1);
assert.equal(
  parentBundles[0].sha256,
  '3f01816840abb5b0fffe52c4139215a26d41b602d843cda548358bb6319c127b',
);
await preflightCurrentSourceHolds(
  parents.map((p) => ({
    tree: p.sourceTree,
    id: p.fmaId,
    name: p.sourceName,
    files: p.sources.map((s) => s.file),
  })),
);
const parentBytes = await readFile(
  'public/models/bodyparts3d/cranial-arteries/cranial-arteries.glb',
);
assert.equal(hash(parentBytes), parentBundles[0].sha256);
const parse = async (bytes) =>
  (
    await new GLTFLoader().parseAsync(
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
      '',
    )
  ).scene;
const parentScene = await parse(parentBytes),
  scene = new Scene();
const matrix = new Matrix4().fromArray(
  source.coordinateSystem.sourceToSceneColumnMajor,
);
// Ordered corner keys include normals. Sorting only the list of triangles
// preserves winding, coincident faces and multiplicity during the partition proof.
const triangles = (mesh) => {
  const { position: p, normal: n } = mesh.geometry.attributes,
    idx = mesh.geometry.index;
  return Array.from({ length: idx.count / 3 }, (_, f) =>
    [0, 1, 2]
      .map((c) => {
        const i = idx.getX(f * 3 + c);
        return [
          p.getX(i),
          p.getY(i),
          p.getZ(i),
          n.getX(i),
          n.getY(i),
          n.getZ(i),
        ].join(',');
      })
      .join('|'),
  );
};
const structures = [],
  proofs = [];
for (const parent of parents) {
  const original = parentScene.getObjectByName(parent.nodeName);
  assert(original?.isMesh);
  const originalNormals = new Map(),
    p = original.geometry.attributes.position,
    n = original.geometry.attributes.normal;
  for (let i = 0; i < p.count; i++) {
    const key = [p.getX(i), p.getY(i), p.getZ(i)].join(','),
      value = [n.getX(i), n.getY(i), n.getZ(i)];
    if (originalNormals.has(key))
      assert.deepEqual(
        value,
        originalNormals.get(key),
        'Ambiguous root normals',
      );
    originalNormals.set(key, value);
  }
  const partition = [],
    parts = [];
  for (let order = 0; order < parent.sources.length; order++) {
    const entry = parent.sources[order];
    const bytes = await readFile(
      `content/sources/cranial-arteries/${parent.sourceTree}/${entry.file}.obj`,
    );
    assert.equal(hash(bytes), entry.sha256);
    const shape = sourceObjShape(bytes),
      topology = sourceTopology(shape);
    assert(topology.closedOrientedManifold);
    const points = [],
      lookup = new Map();
    const remap = shape.vertices.map((point) => {
      const key = point.join(',');
      if (!lookup.has(key)) {
        lookup.set(key, points.length);
        points.push(point);
      }
      return lookup.get(key);
    });
    const positions = points.map((point) =>
      new Vector3(...point).applyMatrix4(matrix).toArray().map(Math.fround),
    );
    const normals = positions.map((point) => {
      const value = originalNormals.get(point.join(','));
      assert(value);
      return value;
    });
    const geometry = new BufferGeometry();
    geometry.setAttribute(
      'position',
      new Float32BufferAttribute(positions.flat(), 3),
    );
    geometry.setAttribute(
      'normal',
      new Float32BufferAttribute(normals.flat(), 3),
    );
    geometry.setIndex(shape.faces.flatMap((face) => face.map((i) => remap[i])));
    geometry.computeBoundingBox();
    const center = geometry.boundingBox.getCenter(new Vector3());
    const anchor = positions.reduce(
      (best, point) =>
        new Vector3(...point).distanceToSquared(center) <
        new Vector3(...best).distanceToSquared(center)
          ? point
          : best,
      positions[0],
    );
    const id = `vm:anatomy:body:head-neck:${parent.laterality}:source-component:${parent.fmaId.toLowerCase()}-${entry.file.toLowerCase()}`;
    const mesh = new Mesh(
      geometry,
      new MeshStandardMaterial({
        color: order % 2 ? '#975349' : '#be6157',
        roughness: 0.65,
      }),
    );
    mesh.name = `${parent.fmaId}_${entry.file}`;
    mesh.userData = {
      structureId: id,
      parentId: parent.id,
      parentFmaId: parent.fmaId,
      sourceTree: parent.sourceTree,
      sourceSha256: entry.sha256,
      anatomicalReview: false,
    };
    scene.add(mesh);
    const faces = triangles(mesh);
    partition.push(...faces);
    const label = `Source part ${String(order + 1).padStart(2, '0')} · ${entry.file}`;
    structures.push({
      ...parent,
      id,
      name: label,
      sourceName: `${parent.sourceName} / ${entry.file} (source part)`,
      bundle: 'cranial-artery-components',
      nodeName: mesh.name,
      sources: [entry],
      bounds: {
        min: geometry.boundingBox.min.toArray(),
        max: geometry.boundingBox.max.toArray(),
      },
      center: center.toArray(),
      anchor,
      parentId: parent.id,
      parentFmaId: parent.fmaId,
      role: 'source-part',
      sourceOrder: order + 1,
      sourcePartCount: parent.sources.length,
      coverageNote:
        'Original source-file partition of ' +
        parent.name.toLowerCase() +
        '. Part numbering follows archive membership, not branch order or clinical segments. A source file may contain disconnected pieces. The FMA identifier belongs to the parent artery, not this unnamed part. Junctions, lumen continuity and anatomical extent remain unverified.',
      validation: { status: 'unvalidated', anatomicalReview: false },
    });
    parts.push({
      id,
      source: entry,
      sourceOrder: order + 1,
      triangles: shape.faces.length,
      topology,
    });
  }
  const baseline = triangles(original).sort(),
    divided = partition.sort();
  assert.deepEqual(
    divided,
    baseline,
    'Every root triangle corner and normal must be preserved exactly',
  );
  proofs.push({
    parentId: parent.id,
    parentFmaId: parent.fmaId,
    parts,
    triangles: baseline.length,
    partitionSha256: hash(baseline.join('\n')),
    exactRenderedFaceAndNormalPartition: true,
  });
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
  await new GLTFExporter().parseAsync(scene, { binary: true }),
);
const roundtrip = await parse(bytes);
for (const mesh of scene.children) {
  const after = roundtrip.getObjectByName(mesh.name);
  assert.deepEqual(triangles(after), triangles(mesh));
  assert.deepEqual(after.userData, { name: mesh.name, ...mesh.userData });
}
assert.equal(structures.length, 29);
const bundle = {
  id: 'cranial-artery-components',
  url: `/models/bodyparts3d/cranial-artery-components/cranial-artery-components.glb?v=${hash(bytes)}`,
  bytes: bytes.length,
  sha256: hash(bytes),
  structures: structures.length,
};
const catalog = {
  version: 1,
  sourceVersion: source.sourceVersion,
  license: source.license,
  credit: source.credit,
  coordinateSystem: source.coordinateSystem,
  parents,
  parentBundles,
  structures,
  bundles: [bundle],
  regions: root.regions.filter((r) => r.id === 'head-neck'),
  coverage: {
    nerves: 'Not included',
    organs: 'Not included',
    vessels:
      'Original grouped artery source-file partitions only; no new anatomical concepts',
  },
  excluded: [],
  clinicalApproval: false,
};
const audit = {
  schemaVersion: 1,
  sourceCommit: '8385c1642baee2a3a363ba6e248a1c3f85335d9b',
  parentBundle: parentBundles[0],
  proofs,
  artifact: bundle,
  modification:
    'Exact partition of existing root triangles including winding, multiplicity and vertex normals. Original source files reused unchanged. No added anatomy, interpolation, smoothing, bridging, mirroring or source-coordinate movement.',
  clinicalApproval: false,
};
const out = 'public/models/bodyparts3d/cranial-artery-components';
const outputs = [
  [`${out}/catalog.json`, JSON.stringify(catalog, null, 2) + '\n'],
  [`${out}/cranial-artery-components.glb`, bytes],
  [
    'docs/cranial-artery-component-audit.json',
    JSON.stringify(audit, null, 2) + '\n',
  ],
];
if (process.argv.includes('--check')) {
  for (const [path, value] of outputs)
    assert.equal(hash(await readFile(path)), hash(value));
} else {
  await mkdir(out);
  for (const [path, value] of outputs)
    await writeFile(path, value, { flag: 'wx' });
}
console.log(
  JSON.stringify({
    parents: parents.length,
    parts: structures.length,
    triangles: proofs.reduce((sum, p) => sum + p.triangles, 0),
    exactRenderedFaceAndNormalPartition: true,
    ...bundle,
  }),
);
