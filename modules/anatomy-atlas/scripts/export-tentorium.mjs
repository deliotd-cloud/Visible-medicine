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
const hash = (b) => createHash('sha256').update(b).digest('hex');
const auditBytes = await readFile('docs/tentorium-source-audit.json');
assert.equal(
  hash(auditBytes),
  'af827465754ee6b882bbcab1f771117dfa2eb028394405b5d43d297465285c64',
);
const audit = JSON.parse(auditBytes),
  { catalog, evidence } = await loadSourceHolds();
assert.deepEqual(audit.evidence, evidence);
const original = await readFile('../work/bodyparts3d/isa/FJ1843.obj');
assert.equal(hash(original), audit.source.sha256);
const shape = sourceObjShape(original),
  points = [],
  lookup = new Map(),
  matrix = new Matrix4().fromArray(
    catalog.coordinateSystem.sourceToSceneColumnMajor,
  );
const remap = shape.vertices.map((p) => {
  const key = p.join(',');
  if (!lookup.has(key)) {
    lookup.set(key, points.length);
    points.push(p);
  }
  return lookup.get(key);
});
const faces = shape.faces.map((f) => f.map((i) => remap[i]));
const positions = points.flatMap((p) =>
  new Vector3(...p).applyMatrix4(matrix).toArray(),
);
const geometry = new BufferGeometry();
geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
geometry.setIndex(faces.flat());
geometry.computeVertexNormals();
geometry.computeBoundingBox();
const center = geometry.boundingBox.getCenter(new Vector3()),
  stored = Array.from(geometry.attributes.position.array),
  vertices = Array.from({ length: stored.length / 3 }, (_, i) =>
    stored.slice(i * 3, i * 3 + 3),
  );
const anchor = vertices.reduce(
  (best, p) =>
    new Vector3(...p).distanceToSquared(center) <
    new Vector3(...best).distanceToSquared(center)
      ? p
      : best,
  vertices[0],
);
const id =
  'vm:anatomy:body:head-neck:right:connective:tentorium-source-portion';
const mesh = new Mesh(
  geometry,
  new MeshStandardMaterial({ color: '#77a8b6', roughness: 0.72 }),
);
mesh.name = 'FMA83966';
mesh.userData = {
  structureId: id,
  fmaId: 'FMA83966',
  sourceSha256: hash(original),
  coverage: 'partial-right-source',
  anatomicalReview: false,
};
const scene = new Scene();
scene.add(mesh);
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
const loaded = (
  await new GLTFLoader().parseAsync(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    '',
  )
).scene;
const actual = [];
loaded.traverse((o) => {
  if (o.isMesh) actual.push(o);
});
assert.equal(actual.length, 1);
assert.deepEqual(
  Array.from(actual[0].geometry.attributes.position.array),
  stored,
);
assert.deepEqual(Array.from(actual[0].geometry.index.array), faces.flat());
assert.deepEqual(actual[0].userData, { name: mesh.name, ...mesh.userData });
const structure = {
  id,
  fmaId: 'FMA83966',
  name: 'Tentorium cerebelli (right-sided source only)',
  sourceName: 'tentorium cerebelli',
  system: 'connective',
  category: 'membrane',
  laterality: 'right',
  region: 'head-neck',
  regions: ['head-neck'],
  bundle: 'tentorium-partial',
  nodeName: 'FMA83966',
  sourceTree: 'isa',
  sources: [{ file: 'FJ1843', sha256: hash(original) }],
  bounds: {
    min: geometry.boundingBox.min.toArray(),
    max: geometry.boundingBox.max.toArray(),
  },
  center: center.toArray(),
  anchor,
  representation: {
    coverage: 'partial',
    sourceLaterality: 'unspecified',
    displayLaterality: 'right',
    description:
      'The source names the whole tentorium, but all supplied vertices are right of midline. Right is the displayed portion, not a claim that the tentorium is a paired structure.',
  },
  coverageNote:
    'Incomplete right-sided source surface, not the complete bilateral tentorium. The left fold, complete notch boundary, dural venous sinuses and attachment footprints are not supplied. No mirrored counterpart or patient registration.',
  provenance: {
    method: 'licensed-source-mesh',
    license: catalog.license,
    sourceVersion: catalog.sourceVersion,
    recovered: false,
  },
  validation: { status: 'unvalidated', anatomicalReview: false },
};
const contextRecords = catalog.structures.filter((s) =>
  ['FMA50801', 'FMA52735', 'FMA52738', 'FMA52736'].includes(s.fmaId),
);
assert.equal(contextRecords.length, 4);
const result = {
  version: 1,
  sourceVersion: catalog.sourceVersion,
  license: catalog.license,
  credit: catalog.credit,
  coordinateSystem: catalog.coordinateSystem,
  evidence,
  auditSha256: hash(auditBytes),
  structures: [structure],
  contextRecords,
  contextBundles: catalog.bundles.filter((b) =>
    contextRecords.some((s) => s.bundle === b.id),
  ),
  bundles: [
    {
      id: 'tentorium-partial',
      url: `/models/bodyparts3d/tentorium/tentorium.glb?v=${hash(bytes)}`,
      bytes: bytes.length,
      sha256: hash(bytes),
      structures: 1,
    },
  ],
  modification:
    'Exact-coordinate welding for indexed normals and Float32 GLB storage only. All 21,924 source triangles retain order/winding and original spatial coordinates. No fitting, mirroring, bridging, smoothing or face removal. Display name/laterality disclose incomplete right-only extent.',
  clinicalApproval: false,
};
const path = 'public/models/bodyparts3d/tentorium',
  source = 'content/sources/tentorium',
  output = JSON.stringify(result, null, 2) + '\n';
if (process.argv.includes('--check')) {
  assert.equal(hash(await readFile(`${path}/tentorium.glb`)), hash(bytes));
  assert.equal(
    (await readFile(`${path}/catalog.json`, 'utf8')).replace(/\r\n/g, '\n'),
    output,
  );
  assert.equal(hash(await readFile(`${source}/FJ1843.obj`)), hash(original));
} else {
  await mkdir(path);
  await mkdir(source);
  await writeFile(`${path}/tentorium.glb`, bytes, { flag: 'wx' });
  await writeFile(`${path}/catalog.json`, output, { flag: 'wx' });
  await writeFile(`${source}/FJ1843.obj`, original, { flag: 'wx' });
}
console.log(
  JSON.stringify({
    triangles: 21924,
    ...result.bundles[0],
    coverage: 'partial-right-source',
    clinicalApproval: false,
  }),
);
