import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Group, Mesh, MeshStandardMaterial, Matrix4, Vector3 } from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import {
  mergeVertices,
  mergeGeometries,
} from 'three/addons/utils/BufferGeometryUtils.js';
import { loadSourceHolds } from './load-source-holds.mjs';
import { sourceObjShape } from './source-surface-audit.mjs';
import { sourceTopology } from './source-topology.mjs';
import { cache } from './bodyparts-archive.mjs';

const hash = (b) => createHash('sha256').update(b).digest('hex');
const { catalog, records, policy, evidence } = await loadSourceHolds();
const correction = JSON.parse(
  await readFile('public/models/bodyparts3d/pancreas/display-correction.json'),
);
const auditBytes = await readFile('docs/pancreatic-source-audit.json');
assert.equal(hash(auditBytes), correction.auditSha256);
assert.deepEqual(JSON.parse(auditBytes).evidence, evidence);
assert.deepEqual(
  correction.original,
  catalog.structures.find((s) => s.fmaId === 'FMA7198'),
);
const parent = correction.replacement;
assert.deepEqual(
  parent.sources.map((s) => s.file),
  ['FJ1895', 'FJ1896', 'FJ2630'],
);
const definitions = [
  {
    fmaId: 'FMA10419',
    sourceName: 'pancreatic duct',
    name: 'Pancreatic duct',
    file: 'FJ1896',
    tree: 'partof',
    role: 'duct',
  },
  {
    fmaId: 'FMA63103',
    sourceName: 'pancreatic duct tree',
    name: 'Pancreatic duct-tree source',
    file: 'FJ2630',
    tree: 'isa',
    role: 'tree',
  },
  {
    fmaId: 'FMA7198',
    sourceName: 'pancreas',
    name: 'Pancreatic envelope · reference',
    file: 'FJ1895',
    tree: 'isa',
    role: 'context',
  },
];
const matrix = new Matrix4().fromArray(
  catalog.coordinateSystem.sourceToSceneColumnMajor,
);
const group = new Group(),
  structures = [],
  sourceEvidence = [];
for (const d of definitions) {
  const record = records.find((r) => r.tree === d.tree && r.id === d.fmaId);
  assert.equal(record?.name, d.sourceName);
  assert.deepEqual(record.files, [d.file]);
  policy.assertNoKnownHolds([record]);
  const inherited = parent.sources.find((s) => s.file === d.file);
  assert(inherited);
  const parentBytes = await readFile(`${cache}/partof/${d.file}.obj`);
  assert.equal(hash(parentBytes), inherited.sha256);
  const bytes = await readFile(`${cache}/${d.tree}/${d.file}.obj`);
  const a = sourceObjShape(bytes),
    b = sourceObjShape(parentBytes);
  // IS-A and PART-OF OBJ headers differ. Verify geometry, not filename equivalence.
  assert.deepEqual(a.vertices, b.vertices);
  assert.deepEqual(a.faces, b.faces);
  const topology = sourceTopology(a);
  assert(topology.closedOrientedManifold);
  assert.equal(topology.components.length, 1);
  const geometries = [];
  new OBJLoader().parse(bytes.toString()).traverse((mesh) => {
    if (!mesh.isMesh) return;
    let g = mesh.geometry.clone();
    g.deleteAttribute('normal');
    g.deleteAttribute('uv');
    g = mergeVertices(g, 0.000001);
    g.computeVertexNormals();
    g.applyMatrix4(matrix);
    geometries.push(g);
  });
  const geometry = mergeGeometries(geometries);
  geometry.computeBoundingBox();
  const box = geometry.boundingBox,
    center = box.getCenter(new Vector3()),
    p = geometry.attributes.position;
  let anchor = center.clone(),
    distance = Infinity;
  for (let i = 0; i < p.count; i++) {
    const point = new Vector3().fromBufferAttribute(p, i),
      n = point.distanceToSquared(center);
    if (n < distance) {
      distance = n;
      anchor = point;
    }
  }
  const id = `vm:anatomy:body:abdomen:unpaired:organ:pancreatic-${d.role}-source`;
  const mesh = new Mesh(geometry, new MeshStandardMaterial());
  mesh.name = d.fmaId;
  mesh.userData = {
    structureId: id,
    fmaId: d.fmaId,
    parentId: parent.id,
    sourceTree: d.tree,
    anatomicalReview: false,
  };
  group.add(mesh);
  structures.push({
    id,
    fmaId: d.fmaId,
    name: d.name,
    sourceName: d.sourceName,
    system: 'organs',
    category: 'organ',
    laterality: 'unpaired',
    region: 'abdomen',
    regions: ['abdomen'],
    bundle: 'pancreatic-components',
    nodeName: d.fmaId,
    bounds: { min: box.min.toArray(), max: box.max.toArray() },
    center: center.toArray(),
    anchor: anchor.toArray(),
    sourceTree: d.tree,
    sources: [{ file: d.file, sha256: hash(bytes) }],
    parentId: parent.id,
    role: d.role,
    coverageNote:
      d.role === 'context'
        ? 'One source envelope only; the nearly coincident parenchymal alternative is not rendered. Not a validated tissue layer.'
        : d.role === 'tree'
          ? 'Exact IS-A duct-tree source component. The PART-OF tree includes this and the separately selected pancreatic duct. Not an accessory duct, separate complete drainage tree or validated lumen.'
          : 'Exact source-labelled pancreatic duct surface, without verified lumen, junctions, papilla or functional drainage.',
    provenance: {
      method: 'licensed-source-mesh',
      license: 'CC-BY-4.0',
      sourceVersion: '4.0',
      recovered: false,
    },
    validation: { status: 'unvalidated', anatomicalReview: false },
  });
  sourceEvidence.push({
    definition: record,
    sha256: hash(bytes),
    parentSource: inherited,
    geometryEqualsParentSource: true,
    triangles: geometry.index.count / 3,
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
  await new GLTFExporter().parseAsync(group, { binary: true }),
);
const output = 'public/models/bodyparts3d/pancreatic';
const result = {
  version: 1,
  sourceVersion: '4.0',
  license: 'CC-BY-4.0',
  credit: correction.licence.credit,
  coordinateSystem: catalog.coordinateSystem,
  parent,
  structures,
  selectableIds: structures
    .filter((s) => s.role !== 'context')
    .map((s) => s.id),
  contextIds: structures.filter((s) => s.role === 'context').map((s) => s.id),
  bundles: [
    {
      id: 'pancreatic-components',
      url: '/models/bodyparts3d/pancreatic/pancreatic.glb?v=' + hash(bytes),
      bytes: bytes.length,
      sha256: hash(bytes),
      structures: 3,
    },
  ],
  evidence,
  auditSha256: hash(auditBytes),
  sourceEvidence,
  excluded: [
    {
      file: 'FJ2629',
      reason: 'Near-coincident envelope alternative; not a second layer.',
    },
  ],
  coverage: {
    organs:
      'Two source-labelled duct selections and one optional envelope reference. No extra complete duct tree, accessory duct, microscopic tissue, validated connections or clinical approval.',
  },
};
if (process.argv.includes('--check')) {
  assert.deepEqual(await readFile(`${output}/pancreatic.glb`), bytes);
  assert.deepEqual(
    JSON.parse(await readFile(`${output}/catalog.json`)),
    result,
  );
} else {
  await mkdir(output, { recursive: true });
  await writeFile(`${output}/pancreatic.glb`, bytes);
  await writeFile(
    `${output}/catalog.json`,
    JSON.stringify(result, null, 2) + '\n',
  );
}
console.log({
  selections: 2,
  context: 1,
  triangles: sourceEvidence.reduce((n, s) => n + s.triangles, 0),
  bytes: bytes.length,
  sha256: hash(bytes),
});
