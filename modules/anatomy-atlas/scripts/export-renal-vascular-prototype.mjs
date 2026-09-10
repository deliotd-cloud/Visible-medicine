import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import {
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Vector3,
} from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { loadSourceHolds } from './load-source-holds.mjs';
import { sourceObjShape } from './source-surface-audit.mjs';
import { cache } from './bodyparts-archive.mjs';

// Staging only: this script never writes into public/ or changes the root atlas.
const destination = resolve('../work/renal-vascular-prototype');
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const { catalog, records, policy, evidence } = await loadSourceHolds();
const auditBytes = await readFile('docs/renal-vascular-source-audit.json');
assert.equal(
  hash(auditBytes),
  '276282aca048255f421856c0fa7f2332e8c19e71501664e4b43a2d208d9eb262',
  'Explicitly reviewed source audit changed',
);
const audit = JSON.parse(auditBytes);
assert.deepEqual(audit.evidence, evidence);
const selected = [
  'FMA70492',
  'FMA70493',
  'FMA69265',
  'FMA14335',
  'FMA14336',
  'FMA14343',
  'FMA14349',
];
const exclusions = [
  {
    id: 'FMA66363',
    reason:
      'Alternative right renal trunk occupies the existing artery course; do not double-render it.',
  },
  {
    id: 'FMA66364',
    reason:
      'Near-coincident left renal trunk is an alternative surface, not extra anatomy.',
  },
  {
    id: 'FMA69266',
    reason:
      'Left inferior suprarenal artery includes an isolated two-face zero-volume duplicate component. Retained in raw evidence; not repaired or exported.',
  },
];
assert.equal(
  new Set([...selected, ...exclusions.map((s) => s.id)]).size,
  audit.groups.length,
);
const matrix = new Matrix4().fromArray(
  catalog.coordinateSystem.sourceToSceneColumnMajor,
);
const scene = new Group();
const structures = [],
  expectedById = new Map();
for (const id of selected) {
  const group = audit.groups.find((s) => s.id === id);
  const definition = records.find((r) => r.tree === group.tree && r.id === id);
  assert.deepEqual(definition, group.definition);
  policy.assertNoKnownHolds([definition]);
  assert(
    group.sources.every(
      (s) =>
        s.topology.closedOrientedManifold &&
        !s.directOwners.length &&
        !s.exactInventoryMatches.length,
    ),
  );
  const points = [],
    faces = [],
    lookup = new Map();
  for (const source of group.sources) {
    const raw = await readFile(`${cache}/${group.tree}/${source.file}.obj`);
    assert.equal(hash(raw), source.sha256);
    const shape = sourceObjShape(raw);
    // Weld only identical source coordinates to support continuous normals.
    // No tolerance welding, face removal, smoothing or repositioning.
    const remap = shape.vertices.map((p) => {
      const key = p.join(',');
      if (!lookup.has(key)) {
        lookup.set(key, points.length);
        points.push(p);
      }
      return lookup.get(key);
    });
    faces.push(...shape.faces.map((face) => face.map((i) => remap[i])));
  }
  const transformed = points.map((p) =>
    new Vector3(...p).applyMatrix4(matrix).toArray(),
  );
  const geometry = new BufferGeometry();
  geometry.setAttribute(
    'position',
    new Float32BufferAttribute(transformed.flat(), 3),
  );
  geometry.setIndex(faces.flat());
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  const centre = geometry.boundingBox.getCenter(new Vector3());
  const anchor = transformed.reduce(
    (best, p) =>
      new Vector3(...p).distanceToSquared(centre) <
      new Vector3(...best).distanceToSquared(centre)
        ? p
        : best,
    transformed[0],
  );
  const structureId = `vm:anatomy:body:abdomen:${group.side}:vessel:${group.name.replaceAll(' ', '-')}`;
  const venous = group.role.endsWith('vein');
  const mesh = new Mesh(
    geometry,
    new MeshStandardMaterial({
      color: venous ? '#657fb0' : '#c86059',
      roughness: 0.7,
    }),
  );
  mesh.name = id;
  mesh.userData = {
    structureId,
    fmaId: id,
    sourceTree: group.tree,
    prototypeOnly: true,
  };
  scene.add(mesh);
  structures.push({
    id: structureId,
    fmaId: id,
    name: group.name[0].toUpperCase() + group.name.slice(1),
    sourceName: group.name,
    system: 'vessels',
    category: 'vessel',
    laterality: group.side,
    region: 'abdomen',
    regions: ['abdomen'],
    bundle: 'renal-vascular-prototype',
    nodeName: id,
    bounds: {
      min: geometry.boundingBox.min.toArray(),
      max: geometry.boundingBox.max.toArray(),
    },
    center: centre.toArray(),
    anchor,
    sourceTree: group.tree,
    sources: group.sources.map(({ file, sha256 }) => ({ file, sha256 })),
    role: group.role,
    provenance: {
      method: 'licensed-source-mesh',
      license: catalog.license,
      sourceVersion: '4.0',
      recovered: false,
    },
    validation: { status: 'unvalidated', anatomicalReview: false },
    coverageNote:
      'Staged source-labelled vascular group. Multiple components retain one source identity; terminal attachment, lumen continuity, tissue territories and clinical accuracy are not validated.',
  });
  expectedById.set(id, { transformed, faces });
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
let meshes = 0,
  triangles = 0,
  maxPositionErrorMm = 0;
const seen = new Set();
loaded.scene.updateMatrixWorld(true);
loaded.scene.traverse((mesh) => {
  if (!mesh.isMesh) return;
  meshes++;
  const expected = expectedById.get(mesh.name);
  assert(expected && !seen.has(mesh.name));
  seen.add(mesh.name);
  const positions = mesh.geometry.getAttribute('position');
  assert.equal(positions.count, expected.transformed.length);
  assert.deepEqual(
    Array.from(mesh.geometry.index.array),
    expected.faces.flat(),
    'Every source triangle is retained in order',
  );
  assert.equal(mesh.userData.fmaId, mesh.name);
  assert.equal(mesh.userData.prototypeOnly, true);
  assert.equal(
    mesh.userData.structureId,
    structures.find((s) => s.fmaId === mesh.name).id,
  );
  for (let i = 0; i < positions.count; i++) {
    const point = new Vector3()
      .fromBufferAttribute(positions, i)
      .applyMatrix4(mesh.matrixWorld);
    const errorMm =
      point.distanceTo(new Vector3(...expected.transformed[i])) /
      catalog.coordinateSystem.unitsPerMillimetre;
    assert(
      Number.isFinite(errorMm) && errorMm < 0.0001,
      'Export displaced original anatomy',
    );
    maxPositionErrorMm = Math.max(maxPositionErrorMm, errorMm);
  }
  triangles += expected.faces.length;
});
assert.equal(meshes, 7);
assert.equal(triangles, 14332);
const manifest = {
  schemaVersion: 1,
  prototypeOnly: true,
  admitted: false,
  auditSha256: hash(auditBytes),
  evidence,
  license: catalog.license,
  credit: catalog.credit,
  sourceArchives: catalog.sources,
  coordinateSystem: catalog.coordinateSystem,
  structures,
  exclusions,
  artifact: {
    file: 'renal-vascular-prototype.glb',
    sha256: hash(bytes),
    bytes: bytes.length,
    meshes,
    triangles,
    maxPositionErrorMm,
  },
  pending: [
    'Kidney-bound study integration and same-side context',
    'Selection, labels, removal/restore, cutaway, separation and history tests',
    'Exact-ID teaching and licence notices in the published bundle',
    'Specialist anatomical validation and source junction review',
    'Browser/device acceptance; no scan registration or paid-resource access implied',
  ],
};
const manifestBytes = JSON.stringify(manifest, null, 2) + '\n';
if (process.argv.includes('--check') || process.argv.includes('--record')) {
  assert.equal(
    hash(await readFile(`${destination}/renal-vascular-prototype.glb`)),
    hash(bytes),
  );
  assert.equal(
    await readFile(`${destination}/catalog.json`, 'utf8'),
    manifestBytes,
  );
} else {
  // Fail rather than overwrite a reviewed prototype from an earlier run.
  await mkdir(destination);
  await writeFile(`${destination}/renal-vascular-prototype.glb`, bytes, {
    flag: 'wx',
  });
  await writeFile(`${destination}/catalog.json`, manifestBytes, { flag: 'wx' });
}
if (process.argv.includes('--record')) {
  const report = {
    prototypeOnly: true,
    admitted: false,
    auditSha256: manifest.auditSha256,
    evidence,
    sourceGroups: structures.map(
      ({ id, fmaId, sourceTree, sources, role }) => ({
        id,
        fmaId,
        sourceTree,
        sources,
        role,
      }),
    ),
    exclusions,
    artifact: manifest.artifact,
    pending: manifest.pending,
  };
  await writeFile(
    'docs/renal-vascular-prototype-validation.json',
    JSON.stringify(report, null, 2) + '\n',
  );
}
console.log(
  JSON.stringify({
    ...manifest.artifact,
    prototypeOnly: true,
    admitted: false,
  }),
);
