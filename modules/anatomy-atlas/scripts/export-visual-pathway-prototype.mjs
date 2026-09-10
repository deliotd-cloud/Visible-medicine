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
// Keep the audited derivative in source storage, outside public delivery.
const destination = resolve('content/prototypes/visual-pathway');
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const { catalog, records, policy, evidence } = await loadSourceHolds();
const auditBytes = await readFile('docs/visual-pathway-source-audit.json');
assert.equal(
  hash(auditBytes),
  '5b1a018edcc3b4d271eeb5ae0fe81aef1b92161e1c179585573602ffd57184f6',
  'Explicitly reviewed source audit changed',
);
const audit = JSON.parse(auditBytes);
assert.deepEqual(audit.evidence, evidence);
const selected = ['FMA62045', 'FMA62382', 'FMA67936'];
const exclusions = [];
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
        !s.nestedOwners.length &&
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
  const structureId = `vm:anatomy:body:head-neck:${group.side}:organ:${group.name.replaceAll(' ', '-')}`;
  const mesh = new Mesh(
    geometry,
    new MeshStandardMaterial({
      color: group.side === 'midline' ? '#edd1a0' : '#e2bd74',
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
    system: 'nerves',
    category: 'organ',
    laterality: group.side,
    region: 'head-neck',
    regions: ['head-neck'],
    bundle: 'visual-pathway-prototype',
    nodeName: id,
    bounds: {
      min: geometry.boundingBox.min.toArray(),
      max: geometry.boundingBox.max.toArray(),
    },
    center: centre.toArray(),
    anchor,
    sourceTree: group.tree,
    sources: group.sources.map(({ file, sha256 }) => ({ file, sha256 })),
    provenance: {
      method: 'licensed-source-mesh',
      license: catalog.license,
      sourceVersion: '4.0',
      recovered: false,
    },
    validation: { status: 'unvalidated', anatomicalReview: false },
    coverageNote:
      'Staged source-labelled neural surface. Both chiasm components retain one identity and their original seam; no crossing fibres, optic radiations, functional pathway continuity or clinical accuracy are validated.',
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
assert.equal(meshes, 3);
assert.equal(triangles, 6456);
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
    file: 'visual-pathway-prototype.glb',
    sha256: hash(bytes),
    bytes: bytes.length,
    meshes,
    triangles,
    maxPositionErrorMm,
  },
  pending: [
    'Brain-bound visual-pathway study integration without simultaneous brain aggregate rendering',
    'Selection, labels, removal/restore, cutaway, separation and history tests',
    'Exact-ID teaching and licence notices in the published bundle',
    'Specialist anatomical validation, two-half chiasm seam and geniculate-boundary review',
    'Browser/device acceptance; no scan registration or paid-resource access implied',
  ],
};
const manifestBytes = JSON.stringify(manifest, null, 2) + '\n';
if (process.argv.includes('--check') || process.argv.includes('--record')) {
  assert.equal(
    hash(await readFile(`${destination}/visual-pathway-prototype.glb`)),
    hash(bytes),
  );
  assert.equal(
    await readFile(`${destination}/catalog.json`, 'utf8'),
    manifestBytes,
  );
} else {
  // Fail rather than overwrite a reviewed prototype from an earlier run.
  await mkdir(resolve('content/prototypes'), { recursive: true });
  await mkdir(destination);
  await writeFile(`${destination}/visual-pathway-prototype.glb`, bytes, {
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
    sourceGroups: structures.map(({ id, fmaId, sourceTree, sources }) => ({
      id,
      fmaId,
      sourceTree,
      sources,
    })),
    exclusions,
    artifact: manifest.artifact,
    pending: manifest.pending,
  };
  await writeFile(
    'docs/visual-pathway-prototype-validation.json',
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
