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
import { sourceTopology } from './source-topology.mjs';
import { gingivaCandidates } from './gingiva-candidates.mjs';

// Review artifact only. No public asset, root record, runtime or hold is changed.
const destination = 'content/prototypes/gingiva';
const check = process.argv.includes('--check');
const hash = (b) => createHash('sha256').update(b).digest('hex');
const auditBytes = await readFile('docs/gingiva-source-audit.json');
assert.equal(
  hash(auditBytes),
  '21aec7193cc0879dfc93f5ee62af065a79329757086912e9b5ad20b035637420',
);
const audit = JSON.parse(auditBytes);
const { catalog, records, policy, evidence } = await loadSourceHolds();
assert.deepEqual(audit.evidence, evidence);
assert.equal(audit.admitted, false);
assert(audit.comparisons.every((c) => c.exactSharedTriangles === 0));
const matrix = new Matrix4().fromArray(
  catalog.coordinateSystem.sourceToSceneColumnMajor,
);
const scene = new Group(),
  structures = [],
  originals = [],
  expected = new Map();
for (const c of gingivaCandidates) {
  const inspected = audit.candidates.find((r) => r.id === c.id);
  const definition = records.find((r) => r.tree === c.tree && r.id === c.id);
  assert.deepEqual(definition, inspected.definition);
  policy.assertNoKnownHolds([definition]);
  for (const key of [
    'directOwners',
    'sameFilenameOtherTree',
    'exactInventoryMatches',
  ])
    assert.equal(inspected[key].length, 0);
  const raw = await readFile(
    check
      ? `${destination}/source/${c.file}.obj`
      : `${cache}/${c.tree}/${c.file}.obj`,
  );
  assert.equal(hash(raw), c.sha256);
  assert.equal(raw.length, inspected.bytes);
  originals.push({ file: c.file, bytes: raw });
  const shape = sourceObjShape(raw);
  assert.deepEqual(sourceTopology(shape), inspected.topology);
  // Exact coordinate indexing only. All ordered triangles, including detached
  // components and the upper duplicate, remain. No anatomical cleanup is implied.
  const points = [],
    lookup = new Map();
  const remap = shape.vertices.map((p) => {
    const key = p.join(',');
    if (!lookup.has(key)) {
      lookup.set(key, points.length);
      points.push(p);
    }
    return lookup.get(key);
  });
  const faces = shape.faces.map((f) => f.map((i) => remap[i]));
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
  const structureId = `vm:anatomy:component:oral:unpaired:gingiva:${c.arch}`;
  const mesh = new Mesh(
    geometry,
    new MeshStandardMaterial({
      color: c.arch === 'upper' ? '#b66673' : '#a95e69',
      roughness: 0.76,
    }),
  );
  mesh.name = c.id;
  mesh.userData = {
    structureId,
    fmaId: c.id,
    sourceTree: c.tree,
    sourceSha256: c.sha256,
    prototypeOnly: true,
    anatomicalReview: false,
  };
  scene.add(mesh);
  expected.set(c.id, { transformed, faces, userData: mesh.userData });
  structures.push({
    id: structureId,
    fmaId: c.id,
    sourceName: c.name,
    name: c.name[0].toUpperCase() + c.name.slice(1),
    laterality: 'unpaired',
    arch: c.arch,
    system: 'organs',
    category: 'gingiva',
    region: 'head-neck',
    regions: ['head-neck'],
    nodeName: c.id,
    sourceTree: c.tree,
    sources: [{ file: c.file, sha256: c.sha256 }],
    bounds: {
      min: geometry.boundingBox.min.toArray(),
      max: geometry.boundingBox.max.toArray(),
    },
    center: center.toArray(),
    anchor: transformed.reduce((a, b) =>
      new Vector3(...a).distanceToSquared(center) <=
      new Vector3(...b).distanceToSquared(center)
        ? a
        : b,
    ),
    triangles: faces.length,
    orderedSourceTrianglesSha256: hash(
      JSON.stringify(shape.faces.map((f) => f.map((i) => shape.vertices[i]))),
    ),
    retainedSourceFaceCount: shape.faces.length,
    removedSourceFaces: [],
    validation: { status: 'unvalidated', anatomicalReview: false },
    coverageNote:
      'Source-labelled gingiva envelope, not individually segmented free/attached/interdental gingiva or complete periodontium. Coarse margins and dental relationships require specialist review; no clinical numbering, mucogingival boundary, pocket, disease or scan alignment is supplied.',
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
assert.equal(seen.size, 2);
assert.equal(triangles, 3766);
// Context is pinned by identity and geometry, not copied or silently made into
// selectable children. A future viewer must validate these same original bundles.
const fmaIds = [...new Set(audit.dentalContext.flatMap((g) => g.fmaIds))];
const contextRecords = fmaIds.map((id) => {
  const matches = catalog.structures.filter((s) => s.fmaId === id);
  assert.equal(matches.length, 1);
  return matches[0];
});
const contextBundles = catalog.bundles.filter((b) =>
  contextRecords.some((s) => s.bundle === b.id),
);
for (const b of contextBundles) {
  const raw = await readFile(
    'public' + new URL(b.url, 'https://atlas.invalid').pathname,
  );
  assert.equal(hash(raw), b.sha256);
  assert.equal(raw.length, b.bytes);
}
const manifest = {
  schemaVersion: 1,
  prototypeOnly: true,
  admitted: false,
  clinicalApproval: false,
  auditSha256: hash(auditBytes),
  evidence,
  license: catalog.license,
  credit: catalog.credit,
  sourceArchives: catalog.sources,
  coordinateSystem: catalog.coordinateSystem,
  sourceOriginals: gingivaCandidates.map((c) => ({
    tree: c.tree,
    file: `source/${c.file}.obj`,
    sha256: c.sha256,
    bytes: originals.find((f) => f.file === c.file).bytes.length,
  })),
  structures,
  contextRecords,
  contextBundles,
  artifact: {
    file: 'gingiva-prototype.glb',
    sha256: hash(bytes),
    bytes: bytes.length,
    meshes: seen.size,
    triangles,
    maxPositionErrorMm,
  },
  modification:
    'Exact-coordinate vertex indexing and recomputed display normals; existing root source-to-scene transform and Float32 storage. Every source face and its winding is retained. No smoothing of positions, decimation, bridging, mirroring, relocated attachment or mesh repair.',
  pending: [
    'Assess actual gingival coverage, coarse marginal boundaries and source tooth/jaw intersections. A plausible arch shape and clean topology do not establish correct soft-tissue anatomy.',
    'Adjudicate the upper source detached components, including the duplicate triangle. Preserve source originals and record any future face-specific derivative explicitly.',
    'Choose clinically defensible scope before runtime admission. Neither envelope establishes a periodontal layer, dental pocket, gum thickness or safe operative plane.',
    'Then integrate a compact teeth/jaws study using unchanged source positions, independent visibility, selection, same-side labels, reversible separation and known-context bindings.',
    'Author original, referenced, exact-ID teaching; leave CT/MRI/X-ray/US and paid lecture access pending separate verified mapping and authorization.',
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
  for (const raw of originals)
    await writeFile(`${destination}/source/${raw.file}.obj`, raw.bytes, {
      flag: 'wx',
    });
  await writeFile(`${destination}/${manifest.artifact.file}`, bytes, {
    flag: 'wx',
  });
  await writeFile(`${destination}/catalog.json`, manifestBytes, { flag: 'wx' });
}
console.log(
  JSON.stringify({
    ...manifest.artifact,
    originals: originals.length,
    contextRecords: contextRecords.length,
    contextBundles: contextBundles.length,
    admitted: false,
    check,
  }),
);
