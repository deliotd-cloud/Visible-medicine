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
import { brachialVeinSources } from './brachial-vein-sources.mjs';
import { loadSourceHolds } from './load-source-holds.mjs';
const hash = (b) => createHash('sha256').update(b).digest('hex');
const auditBytes = await readFile('docs/brachial-vein-source-audit.json');
assert.equal(
  hash(auditBytes),
  '65fb096048215c4be56504a4401cb766ca3885ba8655f440c9c82a952982de7f',
);
const audit = JSON.parse(auditBytes),
  { catalog, evidence } = await loadSourceHolds();
assert.deepEqual(audit.evidence, evidence);
const scene = new Scene(),
  matrix = new Matrix4().fromArray(
    catalog.coordinateSystem.sourceToSceneColumnMajor,
  ),
  structures = [],
  expected = new Map();
const retained = [];
for (const candidate of brachialVeinSources) {
  const bytes = await readFile(`../work/bodyparts3d/isa/${candidate.file}.obj`);
  assert.equal(hash(bytes), candidate.sha256);
  retained.push({ file: candidate.file, bytes });
  const shape = sourceObjShape(bytes),
    points = [],
    lookup = new Map();
  const remap = shape.vertices.map((p) => {
    const k = p.join(',');
    if (!lookup.has(k)) {
      lookup.set(k, points.length);
      points.push(p);
    }
    return lookup.get(k);
  });
  const transformed = points.map((p) =>
      new Vector3(...p).applyMatrix4(matrix).toArray(),
    ),
    faces = shape.faces.map((f) => f.map((i) => remap[i]));
  const geometry = new BufferGeometry();
  geometry.setAttribute(
    'position',
    new Float32BufferAttribute(transformed.flat(), 3),
  );
  geometry.setIndex(faces.flat());
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  const center = geometry.boundingBox.getCenter(new Vector3()),
    id = `vm:anatomy:body:shoulder-arm:${candidate.side}:vessel:${candidate.side}-medial-brachial-vein`;
  const mesh = new Mesh(
    geometry,
    new MeshStandardMaterial({ color: '#638bac', roughness: 0.65 }),
  );
  mesh.name = candidate.id;
  mesh.userData = {
    structureId: id,
    fmaId: candidate.id,
    sourceTree: 'isa',
    sourceSha256: candidate.sha256,
    anatomicalReview: false,
  };
  scene.add(mesh);
  // Float32 storage only. Ordered source faces, coordinates and winding are retained.
  const stored = Array.from(geometry.attributes.position.array);
  expected.set(candidate.id, {
    positions: stored,
    indices: faces.flat(),
    userData: mesh.userData,
  });
  const pointsStored = Array.from({ length: stored.length / 3 }, (_, i) =>
    stored.slice(i * 3, i * 3 + 3),
  );
  const anchor = pointsStored.reduce(
    (best, p) =>
      new Vector3(...p).distanceToSquared(center) <
      new Vector3(...best).distanceToSquared(center)
        ? p
        : best,
    pointsStored[0],
  );
  structures.push({
    id,
    fmaId: candidate.id,
    name: candidate.name[0].toUpperCase() + candidate.name.slice(1),
    sourceName: candidate.name,
    system: 'vessels',
    category: 'vessel',
    laterality: candidate.side,
    region: 'shoulder-arm',
    regions: ['shoulder-arm', 'forearm'],
    bundle: 'brachial-veins',
    nodeName: candidate.id,
    sourceTree: 'isa',
    sources: [{ file: candidate.file, sha256: candidate.sha256 }],
    bounds: {
      min: geometry.boundingBox.min.toArray(),
      max: geometry.boundingBox.max.toArray(),
    },
    center: center.toArray(),
    anchor,
    coverageNote:
      'One source-labelled medial brachial vein. Other companion veins, valves, lumen and exact junctions are not supplied. Original coordinates and faces retained; clinical review pending.',
    provenance: {
      method: 'licensed-source-mesh',
      license: catalog.license,
      sourceVersion: catalog.sourceVersion,
      recovered: false,
    },
    validation: { status: 'unvalidated', anatomicalReview: false },
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
const loaded = await new GLTFLoader().parseAsync(
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  '',
);
let count = 0;
loaded.scene.traverse((mesh) => {
  if (!mesh.isMesh) return;
  const before = expected.get(mesh.name);
  assert(before);
  assert.deepEqual(
    Array.from(mesh.geometry.attributes.position.array),
    before.positions,
  );
  assert.deepEqual(Array.from(mesh.geometry.index.array), before.indices);
  assert.deepEqual(mesh.userData, { name: mesh.name, ...before.userData });
  count++;
});
assert.equal(count, 2);
const contextFmas = [
  'FMA23130',
  'FMA23131',
  'FMA22691',
  'FMA22692',
  'FMA22909',
  'FMA22910',
  'FMA13330',
  'FMA13331',
];
const contextRecords = catalog.structures.filter((s) =>
  contextFmas.includes(s.fmaId),
);
assert.equal(contextRecords.length, 8);
const result = {
  version: 1,
  sourceVersion: catalog.sourceVersion,
  license: catalog.license,
  credit: catalog.credit,
  coordinateSystem: catalog.coordinateSystem,
  evidence,
  auditSha256: hash(auditBytes),
  structures,
  contextRecords,
  contextBundles: catalog.bundles.filter((b) =>
    contextRecords.some((s) => s.bundle === b.id),
  ),
  bundles: [
    {
      id: 'brachial-veins',
      url: `/models/bodyparts3d/brachial-veins/brachial-veins.glb?v=${hash(bytes)}`,
      bytes: bytes.length,
      sha256: hash(bytes),
      structures: 2,
    },
  ],
  modification:
    'Exact-coordinate welding for indexed normals plus Float32 GLB storage. Every original triangle is retained in order; no smoothing, fitting, mirroring, bridging or face removal.',
  clinicalApproval: false,
};
const path = 'public/models/bodyparts3d/brachial-veins',
  sourcePath = 'content/sources/brachial-veins',
  text = JSON.stringify(result, null, 2) + '\n';
if (process.argv.includes('--check')) {
  assert.equal(hash(await readFile(`${path}/brachial-veins.glb`)), hash(bytes));
  assert.equal(
    (await readFile(`${path}/catalog.json`, 'utf8')).replace(/\r\n/g, '\n'),
    text,
  );
  for (const source of retained)
    assert.equal(
      hash(await readFile(`${sourcePath}/${source.file}.obj`)),
      hash(source.bytes),
    );
} else {
  await mkdir(path);
  await mkdir(sourcePath);
  await writeFile(`${path}/brachial-veins.glb`, bytes, { flag: 'wx' });
  await writeFile(`${path}/catalog.json`, text, { flag: 'wx' });
  for (const source of retained)
    await writeFile(`${sourcePath}/${source.file}.obj`, source.bytes, {
      flag: 'wx',
    });
}
console.log(
  JSON.stringify({
    selections: 2,
    triangles: 5422,
    ...result.bundles[0],
    clinicalApproval: false,
  }),
);
