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
import { sourceObjShape, mergeSourceShapes } from './source-surface-audit.mjs';
import { cranialArterySources } from './cranial-artery-sources.mjs';
import { loadSourceHolds } from './load-source-holds.mjs';
import { preflightCurrentSourceHolds } from './current-source-holds.mjs';
const included = cranialArterySources.filter((s) => s.status === 'proposed');
assert.equal(included.length, 5);
await preflightCurrentSourceHolds(
  included.map((s) => ({
    tree: s.tree,
    id: s.id,
    name: s.name,
    files: s.files.map((f) => f.file),
  })),
);
const hash = (b) => createHash('sha256').update(b).digest('hex');
const auditBytes = await readFile('docs/cranial-artery-source-audit.json');
assert.equal(
  hash(auditBytes),
  '6af13b26ae304a52b20915ba2990fe1497d30f089944836dce712c279272cd9a',
);
const audit = JSON.parse(auditBytes),
  { catalog, evidence } = await loadSourceHolds();
assert.deepEqual(audit.evidence, evidence);
assert.deepEqual(audit.conflicts, []);
assert.deepEqual(audit.overlaps, []);
assert(
  audit.pairChecks.every(
    (p) => !p.sharedTriangles && !p.translatedDiagnostic?.similar,
  ),
);
const scene = new Scene(),
  matrix = new Matrix4().fromArray(
    catalog.coordinateSystem.sourceToSceneColumnMajor,
  ),
  structures = [],
  expected = new Map(),
  retained = [];
for (const candidate of included) {
  const parts = [];
  for (const source of candidate.files) {
    const bytes = await readFile(
      `../work/bodyparts3d/${candidate.tree}/${source.file}.obj`,
    );
    assert.equal(hash(bytes), source.sha256);
    retained.push({ tree: candidate.tree, file: source.file, bytes });
    parts.push(sourceObjShape(bytes));
  }
  const shape = mergeSourceShapes(parts),
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
    id = `vm:anatomy:body:head-neck:${candidate.side}:vessel:${candidate.name.replaceAll(' ', '-')}`;
  const mesh = new Mesh(
    geometry,
    new MeshStandardMaterial({ color: '#be6157', roughness: 0.65 }),
  );
  mesh.name = candidate.id;
  mesh.userData = {
    structureId: id,
    fmaId: candidate.id,
    sourceTree: candidate.tree,
    sourceComponents: candidate.files,
    anatomicalReview: false,
  };
  scene.add(mesh);
  const positions = Array.from(geometry.attributes.position.array);
  expected.set(candidate.id, {
    positions,
    indices: faces.flat(),
    userData: mesh.userData,
  });
  const stored = Array.from({ length: positions.length / 3 }, (_, i) =>
    positions.slice(i * 3, i * 3 + 3),
  );
  const anchor = stored.reduce(
    (best, p) =>
      new Vector3(...p).distanceToSquared(center) <
      new Vector3(...best).distanceToSquared(center)
        ? p
        : best,
    stored[0],
  );
  const detail =
    candidate.id === 'FMA50082'
      ? 'Three original PART-OF files form six components; no matching left MCA definition is supplied. Not a complete MCA tree or separate M1/M2 segment model.'
      : candidate.files.length === 13
        ? 'Thirteen original IS-A files form fourteen components. Disconnected source pieces are retained without inventing a continuous lumen or complete territory.'
        : 'Original IS-A superior cerebellar surface. A small proximal portion crosses the source midline; source laterality is preserved without reflection or fitting.';
  structures.push({
    id,
    fmaId: candidate.id,
    name: candidate.name[0].toUpperCase() + candidate.name.slice(1),
    sourceName: candidate.name,
    system: 'vessels',
    category: 'vessel',
    laterality: candidate.side,
    region: 'head-neck',
    regions: ['head-neck'],
    bundle: 'cranial-arteries',
    nodeName: candidate.id,
    sourceTree: candidate.tree,
    sources: candidate.files,
    bounds: {
      min: geometry.boundingBox.min.toArray(),
      max: geometry.boundingBox.max.toArray(),
    },
    center: center.toArray(),
    anchor,
    coverageNote:
      detail +
      ' Source coordinates and faces retained; radiologist review pending. No patent junction, flow or patient correspondence is established.',
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
assert.equal(count, 5);
const contextFmas = ['FMA3949', 'FMA4062', 'FMA3958', 'FMA4066', 'FMA50542'];
const contextRecords = catalog.structures.filter((s) =>
  contextFmas.includes(s.fmaId),
);
assert.equal(contextRecords.length, 5);
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
      id: 'cranial-arteries',
      url: `/models/bodyparts3d/cranial-arteries/cranial-arteries.glb?v=${hash(bytes)}`,
      bytes: bytes.length,
      sha256: hash(bytes),
      structures: 5,
    },
  ],
  modification:
    'Exact-coordinate indexing and Float32 GLB storage; every source face and winding retained in original component order. No smoothing, fitting, bridging, reflection or missing-side generation.',
  clinicalApproval: false,
};
const path = 'public/models/bodyparts3d/cranial-arteries',
  sourcePath = 'content/sources/cranial-arteries',
  text = JSON.stringify(result, null, 2) + '\n';
if (process.argv.includes('--check')) {
  assert.equal(
    hash(await readFile(`${path}/cranial-arteries.glb`)),
    hash(bytes),
  );
  assert.equal(
    (await readFile(`${path}/catalog.json`, 'utf8')).replace(/\r\n/g, '\n'),
    text,
  );
  for (const source of retained)
    assert.equal(
      hash(await readFile(`${sourcePath}/${source.tree}/${source.file}.obj`)),
      hash(source.bytes),
    );
} else {
  await mkdir(path);
  await mkdir(sourcePath);
  for (const tree of [...new Set(retained.map((s) => s.tree))])
    await mkdir(`${sourcePath}/${tree}`);
  await writeFile(`${path}/cranial-arteries.glb`, bytes, { flag: 'wx' });
  await writeFile(`${path}/catalog.json`, text, { flag: 'wx' });
  for (const source of retained)
    await writeFile(
      `${sourcePath}/${source.tree}/${source.file}.obj`,
      source.bytes,
      { flag: 'wx' },
    );
}
console.log(
  JSON.stringify({
    selections: 5,
    sourceFiles: retained.length,
    triangles: included.reduce((n, s) => n + s.triangles, 0),
    components: included.reduce((n, s) => n + s.components, 0),
    ...result.bundles[0],
    clinicalApproval: false,
  }),
);
