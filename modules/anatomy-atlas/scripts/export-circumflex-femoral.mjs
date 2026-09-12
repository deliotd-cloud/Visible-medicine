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
import { circumflexFemoralSources } from './circumflex-femoral-sources.mjs';
const descendingSources = circumflexFemoralSources.filter(s => ['FMA21422', 'FMA21423'].includes(s.id));
import { loadSourceHolds } from './load-source-holds.mjs';
import { preflightCurrentSourceHolds } from './current-source-holds.mjs';
await preflightCurrentSourceHolds(
  descendingSources.map((s) => ({
    tree: 'isa',
    id: s.id,
    name: s.name,
    files: [s.file],
  })),
);
const hash = (b) => createHash('sha256').update(b).digest('hex');
const auditBytes = await readFile('docs/circumflex-femoral-source-audit.json');
assert.equal(
  hash(auditBytes),
  '2371bfb1d42d70621ad056059c70d734bba090171d104696e2af6acb05c19678',
);
assert.deepEqual(JSON.parse(auditBytes).groups.filter(g => g.status === 'candidate').map(g => g.id), descendingSources.map(g => g.id));
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
for (const candidate of descendingSources) {
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
    id = `vm:anatomy:body:thigh:${candidate.side}:vessel:${candidate.name.replaceAll(' ', '-')}`;
  const mesh = new Mesh(
    geometry,
    new MeshStandardMaterial({ color: '#be6157', roughness: 0.65 }),
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
    region: 'thigh',
    regions: ['thigh', 'leg'],
    bundle: 'circumflex-femoral',
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
      'Complete IS-A descending-branch surface. The lateral circumflex parent is contained within the existing deep-femoral aggregate, not separately selectable; it is not a direct deep-femoral branch claim. Original coordinates and faces retained; no junction, continuous lumen or complete collateral supply is validated. Radiologist review pending.',
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
const contextFmas = ['FMA20796', 'FMA20797', 'FMA70249', 'FMA70250', 'FMA77380', 'FMA77381'];
const contextRecords = catalog.structures.filter((s) =>
  contextFmas.includes(s.fmaId),
);
assert.equal(contextRecords.length, 6);
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
      id: 'circumflex-femoral',
      url: `/models/bodyparts3d/circumflex-femoral/circumflex-femoral.glb?v=${hash(bytes)}`,
      bytes: bytes.length,
      sha256: hash(bytes),
      structures: 2,
    },
  ],
  modification:
    'Exact-coordinate welding for indexed normals plus Float32 GLB storage. Every original triangle is retained in order; no smoothing, fitting, mirroring, bridging or face removal.',
  clinicalApproval: false,
};
const path = 'public/models/bodyparts3d/circumflex-femoral',
  sourcePath = 'content/sources/circumflex-femoral',
  text = JSON.stringify(result, null, 2) + '\n';
if (process.argv.includes('--check')) {
  assert.equal(
    hash(await readFile(`${path}/circumflex-femoral.glb`)),
    hash(bytes),
  );
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
  await writeFile(`${path}/circumflex-femoral.glb`, bytes, { flag: 'wx' });
  await writeFile(`${path}/catalog.json`, text, { flag: 'wx' });
  for (const source of retained)
    await writeFile(`${sourcePath}/${source.file}.obj`, source.bytes, {
      flag: 'wx',
    });
}
console.log(
  JSON.stringify({
    selections: 2,
    triangles: 10464,
    ...result.bundles[0],
    clinicalApproval: false,
  }),
);
