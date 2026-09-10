import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
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
import { cache } from './bodyparts-archive.mjs';
import { sourceObjShape } from './source-surface-audit.mjs';
import { cricothyroidCandidates } from './cricothyroid-candidates.mjs';
import { removeReviewedOppositeFaceIslands } from './reviewed-face-islands.mjs';

// Non-public, reproducible staging artifact. This never edits the root catalogue,
// teaching, renderer, public assets or previous admission/hold decisions.
const destination = 'content/prototypes/cricothyroid';
const check = process.argv.includes('--check');
const hash = (b) => createHash('sha256').update(b).digest('hex');
const auditBytes = await readFile('docs/cricothyroid-source-audit.json');
assert.equal(
  hash(auditBytes),
  '40f002378ede46ffc325a67078c7f71bd3433c32c659cd5c39e003c45850469f',
  'Explicitly reviewed audit changed',
);
const audit = JSON.parse(auditBytes);
const { catalog, records, policy, evidence } = await loadSourceHolds();
assert.deepEqual(evidence, audit.evidence);
assert.equal(audit.prototypeOnly, true);
assert.equal(audit.admitted, false);
assert(
  audit.comparisons.every(
    (c) => !c.rawExactSharedTriangles && !c.derivativeExactSharedTriangles,
  ),
);
const matrix = new Matrix4().fromArray(
  catalog.coordinateSystem.sourceToSceneColumnMajor,
);
const scene = new Group(),
  structures = [],
  rawFiles = [],
  expected = new Map();
for (const candidate of cricothyroidCandidates) {
  const group = audit.groups.find((g) => g.id === candidate.id);
  const definition = records.find(
    (r) => r.tree === candidate.tree && r.id === candidate.id,
  );
  assert.deepEqual(definition, group.definition);
  policy.assertNoKnownHolds([definition]);
  for (const field of [
    'directOwners',
    'sameFilenameOtherTree',
    'exactInventoryMatches',
  ])
    assert.equal(group[field].length, 0);
  const raw = await readFile(
    check
      ? `${destination}/source/${candidate.file}.obj`
      : `${cache}/${candidate.tree}/${candidate.file}.obj`,
  );
  assert.equal(hash(raw), candidate.sha256, 'Pinned original changed');
  assert.equal(raw.length, group.bytes);
  rawFiles.push({ file: candidate.file, bytes: raw });
  const derivative = removeReviewedOppositeFaceIslands(
    sourceObjShape(raw),
    candidate.oppositeFaceIslands,
  );
  assert.deepEqual(derivative.topology, group.derivative.topology);
  assert.deepEqual(derivative.islands, group.derivative.removedIslands);
  assert.equal(
    hash(JSON.stringify(derivative.retainedSourceFaceIndices)),
    group.derivative.retainedFaceIndicesSha256,
  );
  assert.equal(
    hash(JSON.stringify(derivative.retainedSourceVertexIndices)),
    group.derivative.retainedVertexIndicesSha256,
  );
  assert.equal(
    hash(
      JSON.stringify(
        derivative.shape.faces.map((f) =>
          f.map((i) => derivative.shape.vertices[i]),
        ),
      ),
    ),
    group.derivative.orderedSourceTrianglesSha256,
  );
  // Exact-coordinate welding affects normals/indices only; no tolerance or
  // position change. Original ordered triangle coordinates remain recoverable.
  const points = [],
    lookup = new Map();
  const remap = derivative.shape.vertices.map((p) => {
    const key = p.join(',');
    if (!lookup.has(key)) {
      lookup.set(key, points.length);
      points.push(p);
    }
    return lookup.get(key);
  });
  const faces = derivative.shape.faces.map((f) => f.map((i) => remap[i]));
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
  const center = geometry.boundingBox.getCenter(new Vector3());
  const structureId = `vm:anatomy:component:laryngeal:${candidate.side}:muscle:cricothyroid-${candidate.part}`;
  const mesh = new Mesh(
    geometry,
    new MeshStandardMaterial({
      color: candidate.part === 'straight' ? '#bc6760' : '#9b5350',
      roughness: 0.72,
    }),
  );
  mesh.name = candidate.id;
  mesh.userData = {
    fmaId: candidate.id,
    structureId,
    sourceTree: candidate.tree,
    sourceSha256: candidate.sha256,
    prototypeOnly: true,
    anatomicalReview: false,
  };
  scene.add(mesh);
  expected.set(candidate.id, { transformed, faces, userData: mesh.userData });
  structures.push({
    id: structureId,
    fmaId: candidate.id,
    sourceName: candidate.name,
    name: candidate.name[0].toUpperCase() + candidate.name.slice(1),
    laterality: candidate.side,
    part: candidate.part,
    system: 'muscles',
    category: 'muscle',
    region: 'head-neck',
    nodeName: candidate.id,
    sourceTree: candidate.tree,
    sources: [{ file: candidate.file, sha256: candidate.sha256 }],
    bounds: {
      min: geometry.boundingBox.min.toArray(),
      max: geometry.boundingBox.max.toArray(),
    },
    center: center.toArray(),
    anchor: transformed.reduce(
      (best, p) =>
        new Vector3(...p).distanceToSquared(center) <
        new Vector3(...best).distanceToSquared(center)
          ? p
          : best,
      transformed[0],
    ),
    triangles: faces.length,
    derivative: {
      method: 'explicit-detached-opposite-face-pair-removal',
      removedSourceFaces: candidate.oppositeFaceIslands
        .flat()
        .sort((a, b) => a - b),
      orderedSourceTrianglesSha256:
        group.derivative.orderedSourceTrianglesSha256,
    },
    validation: { status: 'unvalidated', anatomicalReview: false },
    coverageNote:
      'One source-defined muscle part, not a complete cricothyroid muscle or validated attachment map. Original coordinates retained; detached opposite-face islands omitted only as documented in the derivative manifest.',
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
loaded.scene.updateMatrixWorld(true);
const seen = new Set();
let triangles = 0,
  maxPositionErrorMm = 0;
loaded.scene.traverse((mesh) => {
  if (!mesh.isMesh) return;
  const reference = expected.get(mesh.name);
  assert(reference && !seen.has(mesh.name));
  seen.add(mesh.name);
  assert.deepEqual(mesh.userData, { name: mesh.name, ...reference.userData });
  assert.deepEqual(
    Array.from(mesh.geometry.index.array),
    reference.faces.flat(),
    'Retained triangle order or winding changed',
  );
  const p = mesh.geometry.getAttribute('position'),
    n = mesh.geometry.getAttribute('normal');
  assert.equal(p.count, reference.transformed.length);
  assert.equal(n.count, p.count);
  for (let i = 0; i < p.count; i++) {
    const point = new Vector3()
      .fromBufferAttribute(p, i)
      .applyMatrix4(mesh.matrixWorld);
    const error =
      point.distanceTo(new Vector3(...reference.transformed[i])) /
      catalog.coordinateSystem.unitsPerMillimetre;
    assert(Number.isFinite(error) && error < 0.0001);
    maxPositionErrorMm = Math.max(maxPositionErrorMm, error);
    assert([n.getX(i), n.getY(i), n.getZ(i)].every(Number.isFinite));
  }
  triangles += reference.faces.length;
});
assert.equal(seen.size, 4);
assert.equal(triangles, 17636);
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
  sourceOriginals: cricothyroidCandidates.map((c) => ({
    tree: c.tree,
    file: `source/${c.file}.obj`,
    sha256: c.sha256,
    bytes: rawFiles.find((f) => f.file === c.file).bytes.length,
  })),
  structures,
  artifact: {
    file: 'cricothyroid-prototype.glb',
    sha256: hash(bytes),
    bytes: bytes.length,
    meshes: seen.size,
    triangles,
    maxPositionErrorMm,
  },
  pending: [
    'Source-defined part admission and thyroid/cricoid-bound compact dissection integration; this prototype is not on the public atlas.',
    'Specialist review of laterality, attachment footprints, tissue intersections and which named muscle bellies are represented.',
    'Selection, label sides, source-origin explode guides, hiding/undo and mobile/keyboard interaction acceptance.',
    'Exact-ID, referenced teaching and independent imaging/lecture authorization; no new access entitlement or patient scan registration.',
  ],
};
const manifestBytes = JSON.stringify(manifest, null, 2) + '\n';
if (check) {
  assert.equal(
    hash(await readFile(`${destination}/${manifest.artifact.file}`)),
    hash(bytes),
  );
  assert.equal(
    await readFile(`${destination}/catalog.json`, 'utf8'),
    manifestBytes,
  );
} else {
  await mkdir(destination);
  await mkdir(`${destination}/source`);
  for (const raw of rawFiles)
    await writeFile(`${destination}/source/${raw.file}.obj`, raw.bytes, {
      flag: 'wx',
    });
  await writeFile(`${destination}/${manifest.artifact.file}`, bytes, {
    flag: 'wx',
  });
  await writeFile(`${destination}/catalog.json`, manifestBytes, {
    flag: 'wx',
  });
}
console.log(
  JSON.stringify({
    ...manifest.artifact,
    originals: rawFiles.length,
    removedSourceFaces: 12,
    admitted: false,
    check,
  }),
);
