import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Group, Mesh, MeshStandardMaterial, Matrix4, Vector3 } from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import {
  mergeVertices,
  mergeGeometries,
} from 'three/addons/utils/BufferGeometryUtils.js';
import { loadSourceHolds } from './load-source-holds.mjs';
import { cache } from './bodyparts-archive.mjs';
import { sourceObjShape } from './source-surface-audit.mjs';
import { sourceTopology } from './source-topology.mjs';
import { cardiacComponents } from './cardiac-components.mjs';

const hash = (b) => createHash('sha256').update(b).digest('hex');
const { catalog, records, policy, evidence } = await loadSourceHolds();
const parent = catalog.structures.find((s) => s.fmaId === 'FMA7088');
assert.equal(parent.sourceTree, 'partof');
assert.equal(parent.sources.length, 56);
const matrix = new Matrix4().fromArray(
  catalog.coordinateSystem.sourceToSceneColumnMajor,
);
const group = new Group(),
  structures = [],
  sourceReports = [];
for (const definition of cardiacComponents) {
  const { fmaId, name, file, side } = definition;
  const sourceDefinition = records.find(
    (r) => r.tree === 'partof' && r.id === fmaId,
  );
  assert.equal(sourceDefinition.name, name);
  assert.deepEqual(sourceDefinition.files, [file]);
  policy.assertNoKnownHolds([sourceDefinition]);
  const source = parent.sources.find((s) => s.file === file);
  assert(source);
  // A distinct single-file PART-OF label is required for every admitted component.
  assert.deepEqual(
    records
      .filter(
        (r) =>
          r.tree === 'partof' && r.files.length === 1 && r.files[0] === file,
      )
      .map((r) => r.id),
    [fmaId],
  );
  const raw = await readFile(`${cache}/partof/${file}.obj`);
  assert.equal(hash(raw), source.sha256);
  const shape = sourceObjShape(raw),
    topology = sourceTopology(shape);
  assert.equal(topology.components.length, 1);
  for (const key of [
    'duplicateFaces',
    'collapsedFaces',
    'degenerateFaces',
    'boundaryEdges',
    'nonManifoldEdges',
    'nonManifoldVertices',
    'inconsistentWindingEdges',
  ])
    assert.equal(topology[key], 0, `${file}: ${key}`);
  sourceReports.push({
    file,
    sha256: source.sha256,
    min: shape.min,
    max: shape.max,
    topology,
  });
  const parts = [];
  new OBJLoader().parse(raw.toString()).traverse((mesh) => {
    if (!mesh.isMesh) return;
    let geometry = mesh.geometry.clone();
    geometry.deleteAttribute('normal');
    geometry.deleteAttribute('uv');
    geometry = mergeVertices(geometry, 0.000001);
    geometry.computeVertexNormals();
    geometry.applyMatrix4(matrix);
    parts.push(geometry);
  });
  const geometry = mergeGeometries(parts);
  geometry.computeBoundingBox();
  const box = geometry.boundingBox,
    center = box.getCenter(new Vector3());
  assert([...box.min.toArray(), ...box.max.toArray()].every(Number.isFinite));
  let anchor = center.clone(),
    distance = Infinity;
  const positions = geometry.getAttribute('position');
  for (let i = 0; i < positions.count; i++) {
    const point = new Vector3().fromBufferAttribute(positions, i),
      d = point.distanceToSquared(center);
    if (d < distance) {
      anchor = point;
      distance = d;
    }
  }
  const id = `vm:anatomy:body:thorax:${side}:organ:${name.replaceAll(' ', '-')}`;
  const mesh = new Mesh(geometry, new MeshStandardMaterial());
  mesh.name = fmaId;
  mesh.userData = { structureId: id, fmaId, parentId: parent.id };
  group.add(mesh);
  structures.push({
    id,
    fmaId,
    name: name[0].toUpperCase() + name.slice(1),
    sourceName: name,
    system: 'organs',
    category: 'organ',
    laterality: side,
    region: 'thorax',
    regions: ['thorax'],
    bundle: 'cardiac',
    nodeName: fmaId,
    bounds: { min: box.min.toArray(), max: box.max.toArray() },
    center: center.toArray(),
    anchor: anchor.toArray(),
    sourceTree: 'partof',
    sources: [source],
    parentId: parent.id,
    ...(definition.chamber ? { chamber: definition.chamber } : {}),
    coverageNote: definition.context
      ? 'Original atrial-wall reference surface; nonselectable context, not a complete heart wall.'
      : 'Source cavity shape, not myocardium, a measured blood volume or a cardiac-phase scan.',
    provenance: {
      method: 'licensed-source-mesh',
      license: catalog.license,
      sourceVersion: '4.0',
      recovered: false,
    },
    validation: { status: 'unvalidated', anatomicalReview: false },
  });
}
assert.equal(
  new Set(structures.flatMap((s) => s.sources.map((f) => f.file))).size,
  6,
);
// Record observed conflicts without silently choosing a preferred interpretation.
const definitionFor = (id) =>
  records.find((r) => r.tree === 'partof' && r.id === id);
const conflicts = [
  [
    'FMA9533',
    'FMA7259',
    'The ventricular-wall and papillary-muscle compounds have identical source memberships.',
  ],
  [
    'FMA7235',
    'FMA7236',
    'The mitral and aortic valve compounds share two cusp files.',
  ],
  [
    'FMA7243',
    'FMA9561',
    'Posterior mitral leaflet and inferior left-ventricular wall share a single-file definition.',
  ],
].map(([a, b, reason]) => {
  const first = definitionFor(a),
    second = definitionFor(b);
  const sharedFiles = first.files.filter((f) => second.files.includes(f));
  assert(sharedFiles.length > 0);
  assert(
    sharedFiles.every((f) => !cardiacComponents.some((c) => c.file === f)),
  );
  return {
    definitions: [first, second],
    sharedFiles,
    reason,
    decision:
      'Not admitted to cardiac study; requires source identity and geometry adjudication.',
  };
});
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((result) => {
      this.result = result;
      this.onloadend?.();
    });
  }
};
const bytes = Buffer.from(
  await new GLTFExporter().parseAsync(group, { binary: true }),
);
const output = 'public/models/bodyparts3d/cardiac';
await mkdir(output, { recursive: true });
await writeFile(`${output}/cardiac.glb`, bytes);
const manifest = {
  version: 1,
  sourceVersion: '4.0',
  license: catalog.license,
  credit: catalog.credit,
  coordinateSystem: catalog.coordinateSystem,
  evidence,
  parent,
  regions: [
    {
      id: 'thorax',
      name: 'Cardiac chamber spaces',
      description:
        'Existing cavity shapes and atrial-wall context; clinical validation pending.',
    },
  ],
  structures,
  selectableIds: structures.slice(0, 4).map((s) => s.id),
  contextIds: structures.slice(4).map((s) => s.id),
  bundles: [
    {
      id: 'cardiac',
      url: `/models/bodyparts3d/cardiac/cardiac.glb?v=${hash(bytes)}`,
      bytes: bytes.length,
      sha256: hash(bytes),
      structures: 6,
    },
  ],
  coverage: {
    nerves: 'No conduction-system geometry.',
    organs:
      'Four cavity shapes and two atrial-wall references, not complete cardiac dissection.',
  },
  excluded: [],
  sourceReports,
  sourceConflicts: conflicts,
};
await writeFile(
  `${output}/catalog.json`,
  JSON.stringify(manifest, null, 2) + '\n',
);
console.log(
  JSON.stringify({
    selectable: 4,
    context: 2,
    files: 6,
    bytes: bytes.length,
    sha256: hash(bytes),
    triangles: sourceReports.reduce((n, r) => n + r.topology.triangles, 0),
    conflicts: conflicts.length,
  }),
);
