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
import { sourceObjShape } from './source-surface-audit.mjs';
import { loadCurrentSourceHolds } from './current-source-holds.mjs';

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const auditBytes = await readFile('docs/elbow-artery-source-audit.json');
assert.equal(
  hash(auditBytes),
  '161f22c01b4667002d197e244ebefdb8eb1287405e354f1eb981a2c9345bba49',
);
const audit = JSON.parse(auditBytes),
  { catalog, evidence, supplementalEvidence, policy } =
    await loadCurrentSourceHolds();
assert.deepEqual(audit.evidence, evidence);
assert.deepEqual(audit.supplementalEvidence, supplementalEvidence);
policy.assertNoKnownHolds(audit.groups.map((g) => g.definition));
assert(
  audit.comparisons.every(
    (c) => !c.exactSharedTriangles && !c.translatedDiagnostic?.similar,
  ),
);
const scene = new Scene(),
  matrix = new Matrix4().fromArray(
    catalog.coordinateSystem.sourceToSceneColumnMajor,
  );
const structures = [],
  originals = [];
for (const candidate of audit.groups) {
  assert(
    candidate.topology.closedOrientedManifold &&
      candidate.topology.components.length === 1,
  );
  assert(
    candidate.lateralityConsistent &&
      !candidate.directOwners.length &&
      !candidate.exactInventoryMatches.length,
  );
  const bytes = await readFile(`../work/bodyparts3d/isa/${candidate.file}.obj`);
  assert.equal(hash(bytes), candidate.sha256);
  originals.push({ file: candidate.file, bytes });
  const shape = sourceObjShape(bytes),
    vertices = [],
    lookup = new Map();
  const remap = shape.vertices.map((p) => {
    const key = p.join(',');
    if (!lookup.has(key)) {
      lookup.set(key, vertices.length);
      vertices.push(p);
    }
    return lookup.get(key);
  });
  const geometry = new BufferGeometry();
  geometry.setAttribute(
    'position',
    new Float32BufferAttribute(
      vertices.flatMap((p) => new Vector3(...p).applyMatrix4(matrix).toArray()),
      3,
    ),
  );
  geometry.setIndex(shape.faces.flatMap((f) => f.map((i) => remap[i])));
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  const center = geometry.boundingBox.getCenter(new Vector3());
  const points = Array.from(
    { length: geometry.attributes.position.count },
    (_, i) =>
      new Vector3()
        .fromBufferAttribute(geometry.attributes.position, i)
        .toArray(),
  );
  const anchor = points.reduce(
    (best, p) =>
      new Vector3(...p).distanceToSquared(center) <
      new Vector3(...best).distanceToSquared(center)
        ? p
        : best,
    points[0],
  );
  const region = /recurrent/.test(candidate.name) ? 'forearm' : 'shoulder-arm';
  const id = `vm:anatomy:body:${region}:${candidate.side}:vessel:${candidate.name.replaceAll(' ', '-')}`;
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
  structures.push({
    id,
    fmaId: candidate.id,
    name: candidate.name[0].toUpperCase() + candidate.name.slice(1),
    sourceName: candidate.name,
    system: 'vessels',
    category: 'vessel',
    laterality: candidate.side,
    region,
    regions: ['shoulder-arm', 'forearm'],
    bundle: 'elbow-arteries',
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
      'Complete original IS-A elbow artery surface. All source faces and coordinates retained apart from the established scene transform and Float32 storage. Typical collateral relationships do not validate donor junctions, continuous lumens, perfusion or a complete elbow network. Anatomical review pending.',
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
const contextIds = [
  'FMA22691',
  'FMA22692',
  'FMA22696',
  'FMA22697',
  'FMA22733',
  'FMA22734',
  'FMA22797',
  'FMA22798',
  'FMA268667',
  'FMA268669',
];
const contextRecords = catalog.structures.filter((s) =>
  contextIds.includes(s.fmaId),
);
assert.equal(contextRecords.length, contextIds.length);
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
      id: 'elbow-arteries',
      url: `/models/bodyparts3d/elbow-arteries/elbow-arteries.glb?v=${hash(bytes)}`,
      bytes: bytes.length,
      sha256: hash(bytes),
      structures: structures.length,
    },
  ],
  modification:
    'Exact-coordinate indexing for normals and Float32 GLB storage under the established source-to-scene transform; every original ordered face retained. No smoothing, fitting, mirroring, bridge or face deletion.',
  clinicalApproval: false,
};
const output = 'public/models/bodyparts3d/elbow-arteries',
  sourcePath = 'content/sources/elbow-arteries';
const text = JSON.stringify(result, null, 2) + '\n';
if (process.argv.includes('--check')) {
  assert.equal(
    hash(await readFile(`${output}/elbow-arteries.glb`)),
    hash(bytes),
  );
  assert.equal(
    (await readFile(`${output}/catalog.json`, 'utf8')).replace(/\r\n/g, '\n'),
    text,
  );
  for (const s of originals)
    assert.equal(
      hash(await readFile(`${sourcePath}/${s.file}.obj`)),
      hash(s.bytes),
    );
} else {
  await mkdir(output);
  await mkdir(sourcePath);
  await writeFile(`${output}/elbow-arteries.glb`, bytes, { flag: 'wx' });
  await writeFile(`${output}/catalog.json`, text, { flag: 'wx' });
  for (const s of originals)
    await writeFile(`${sourcePath}/${s.file}.obj`, s.bytes, { flag: 'wx' });
}
console.log(
  JSON.stringify({
    selections: structures.length,
    triangles: audit.groups.reduce((n, g) => n + g.topology.triangles, 0),
    ...result.bundles[0],
  }),
);
