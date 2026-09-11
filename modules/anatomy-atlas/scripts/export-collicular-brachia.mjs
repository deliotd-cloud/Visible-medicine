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
import { loadSourceHolds } from './load-source-holds.mjs';
import { collicularBrachiaSources } from './collicular-brachia-sources.mjs';
const hash = (b) => createHash('sha256').update(b).digest('hex');
const { catalog, evidence, records, policy } = await loadSourceHolds();
const auditBytes = await readFile('docs/collicular-brachia-source-audit.json'),
  audit = JSON.parse(auditBytes);
assert.deepEqual(audit.evidence, evidence);
const scene = new Scene(),
  matrix = new Matrix4().fromArray(
    catalog.coordinateSystem.sourceToSceneColumnMajor,
  ),
  structures = [],
  expected = new Map();
const parent = catalog.structures.find((s) => s.fmaId === 'FMA50801');
for (const candidate of collicularBrachiaSources.filter(
  (c) => c.status === 'candidate',
)) {
  const audited = audit.groups.find((g) => g.id === candidate.id);
  assert.equal(audited.coordinateSide, candidate.side);
  assert.equal(audited.status, 'candidate');
  const definition = records.find(
    (r) => r.tree === 'isa' && r.id === candidate.id,
  );
  assert.equal(definition.name, candidate.name);
  assert.deepEqual(definition.files, [candidate.file]);
  policy.assertNoKnownHolds([definition]);
  const source = await readFile(
    `content/sources/collicular-brachia/${candidate.file}.obj`,
  );
  assert.equal(hash(source), candidate.sha256);
  assert.equal(hash(source), audited.sha256);
  const shape = sourceObjShape(source),
    points = [],
    lookup = new Map();
  const remap = shape.vertices.map((p) => {
    const key = p.join(',');
    if (!lookup.has(key)) {
      lookup.set(key, points.length);
      points.push(p);
    }
    return lookup.get(key);
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
    id = `vm:anatomy:body:head-neck:${candidate.side}:organ:brachium-of-${candidate.side}-inferior-colliculus`;
  const sources = [{ file: candidate.file, sha256: candidate.sha256 }];
  const mesh = new Mesh(
    geometry,
    new MeshStandardMaterial({ color: '#e3c990', roughness: 0.92 }),
  );
  mesh.name = candidate.id;
  mesh.userData = {
    structureId: id,
    fmaId: candidate.id,
    sourceTree: 'isa',
    sourceFiles: sources,
    anatomicalReview: false,
  };
  scene.add(mesh);
  const stored = Array.from(geometry.attributes.position.array),
    pointsStored = Array.from({ length: stored.length / 3 }, (_, i) =>
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
  expected.set(candidate.id, {
    positions: stored,
    indices: faces.flat(),
    userData: mesh.userData,
  });
  structures.push({
    id,
    fmaId: candidate.id,
    name: candidate.name[0].toUpperCase() + candidate.name.slice(1),
    sourceName: candidate.name,
    system: 'nerves',
    category: 'organ',
    laterality: candidate.side,
    region: 'head-neck',
    regions: ['head-neck'],
    bundle: 'collicular-brachia',
    nodeName: candidate.id,
    sourceTree: 'isa',
    sources,
    bounds: {
      min: geometry.boundingBox.min.toArray(),
      max: geometry.boundingBox.max.toArray(),
    },
    center: center.toArray(),
    anchor,
    studyParentId: parent.id,
    sourceRelationship: 'additional-source-part',
    coverageNote:
      'Coarse whole source-labelled inferior collicular brachium. Original coordinates and every source face retained. This is not a fibre bundle reconstruction, validated attachment, tractography or complete auditory pathway. Superior brachia remain withheld for source laterality conflict.',
    provenance: {
      method: 'licensed-source-mesh',
      license: catalog.license,
      sourceVersion: '4.0',
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
const result = {
  version: 1,
  sourceVersion: '4.0',
  license: catalog.license,
  credit: catalog.credit,
  coordinateSystem: catalog.coordinateSystem,
  evidence,
  auditSha256: hash(auditBytes),
  parent,
  structures,
  selectableIds: structures.map((s) => s.id),
  contextIds: [],
  bundles: [
    {
      id: 'collicular-brachia',
      url: `/models/bodyparts3d/collicular-brachia/collicular-brachia.glb?v=${hash(bytes)}`,
      bytes: bytes.length,
      sha256: hash(bytes),
      structures: 2,
    },
  ],
  modification:
    'Exact-coordinate welding for indexed normals, established source-to-scene transform and Float32 GLB storage only; every ordered original face retained. No smoothing, fitting, mirroring, bridging, cropping or label repair.',
  clinicalApproval: false,
};
const path = 'public/models/bodyparts3d/collicular-brachia',
  text = JSON.stringify(result, null, 2) + '\n';
if (process.argv.includes('--check')) {
  assert.equal(
    hash(await readFile(`${path}/collicular-brachia.glb`)),
    hash(bytes),
  );
  assert.equal(
    (await readFile(`${path}/catalog.json`, 'utf8')).replace(/\r\n/g, '\n'),
    text,
  );
} else {
  await mkdir(path);
  await writeFile(`${path}/collicular-brachia.glb`, bytes, { flag: 'wx' });
  await writeFile(`${path}/catalog.json`, text, { flag: 'wx' });
}
console.log(
  JSON.stringify({
    selections: 2,
    triangles: 568,
    ...result.bundles[0],
    clinicalApproval: false,
  }),
);
