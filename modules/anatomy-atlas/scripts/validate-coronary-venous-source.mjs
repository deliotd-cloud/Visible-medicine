import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { Matrix4, Vector3 } from 'three';
import { loadCurrentSourceHolds } from './current-source-holds.mjs';
import { sourceObjShape } from './source-surface-audit.mjs';
import { sourceTopology } from './source-topology.mjs';

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const definitions = [
  {
    id: 'FMA4706', name: 'coronary sinus',
    files: [{ file: 'FJ2655', sha256: '6cc76de968f59ae4244f5990fc00023a1ad137e500eea7e3ab02740a9505e030', triangles: 624 }],
  },
  {
    id: 'FMA4714', name: 'small cardiac vein',
    files: [
      { file: 'FJ2724', sha256: '419e6a37e1fd0b0e7468654b6b58e561229a94f9641f5b04506271659017b2d4', triangles: 570 },
      { file: 'FJ2731', sha256: 'ac26ffa55a72b44913d761c6b922f6c000f9a229f29740ab765e5ef5fe43f9c5', triangles: 892 },
    ],
  },
];

// OBJ vertex and face ordering differs between trees. Compare exact triangle
// multiplicity by source coordinates; this does not imply clinical equivalence.
function triangleBag(shape) {
  const bag = shape.faces.map((face) =>
    face.map((index) => shape.vertices[index].join(',')).sort().join('|'));
  return bag.sort();
}

const current = await loadCurrentSourceHolds();
const parent = current.catalog.structures.find((s) => s.fmaId === 'FMA7088');
assert(parent && parent.sourceTree === 'partof');
const cardiac = JSON.parse(await readFile('public/models/bodyparts3d/cardiac/catalog.json'));
assert.deepEqual(cardiac.parent, parent, 'Nested cardiac parent changed');
assert.deepEqual(cardiac.evidence, current.evidence, 'Pinned source evidence changed');
assert.equal(current.catalog.license, 'CC-BY-4.0');
const matrix = new Matrix4().fromArray(current.catalog.coordinateSystem.sourceToSceneColumnMajor);
const fileReports = [];

for (const definition of definitions) {
  const partof = current.records.find((r) => r.tree === 'partof' && r.id === definition.id);
  const isa = current.records.find((r) => r.tree === 'isa' && r.id === definition.id);
  assert(partof && isa, `Missing source rows for ${definition.id}`);
  for (const row of [partof, isa]) {
    assert.equal(row.name, definition.name);
    assert.deepEqual(row.files, definition.files.map((s) => s.file));
  }
  current.policy.assertNoKnownHolds([partof, isa]);
  for (const source of definition.files) {
    const ownership = current.catalog.structures.filter((s) =>
      s.sources?.some((f) => f.file === source.file));
    assert.deepEqual(ownership.map((s) => s.id), [parent.id], `${source.file}: unexpected root owner`);
    assert.equal(parent.sources.find((f) => f.file === source.file)?.sha256, source.sha256);
    const partofBytes = await readFile(`../work/bodyparts3d/partof/${source.file}.obj`);
    const isaBytes = await readFile(`../work/bodyparts3d/isa/${source.file}.obj`);
    assert.equal(hash(partofBytes), source.sha256, `${source.file}: PART-OF bytes changed`);
    const shape = sourceObjShape(partofBytes);
    const isaShape = sourceObjShape(isaBytes);
    assert(shape.faces.every((face) => face.length === 3));
    assert.equal(shape.faces.length, source.triangles);
    assert.deepEqual(triangleBag(shape), triangleBag(isaShape), `${source.file}: ISA geometry changed`);
    const topology = sourceTopology(shape);
    assert(topology.closedOrientedManifold);
    assert.equal(topology.components.length, 1);
    for (const key of ['duplicateFaces', 'collapsedFaces', 'degenerateFaces', 'boundaryEdges', 'nonManifoldEdges', 'nonManifoldVertices', 'inconsistentWindingEdges'])
      assert.equal(topology[key], 0, `${source.file}: ${key}`);
    const transformed = shape.vertices.map((v) => new Vector3(...v).applyMatrix4(matrix).toArray());
    assert(transformed.every((v) => v.every(Number.isFinite)));
    for (const v of transformed)
      for (let axis = 0; axis < 3; axis++)
        assert(v[axis] >= parent.bounds.min[axis] - 1e-4 && v[axis] <= parent.bounds.max[axis] + 1e-4,
          `${source.file}: transformed vertex outside heart bounds`);
    fileReports.push({ file: source.file, partofSha256: source.sha256, isaSha256: hash(isaBytes), triangles: shape.faces.length, topology: 'closed single component', withinHeartBounds: true });
  }
}

assert.equal(cardiac.selectableIds.length, 4);
assert(cardiac.structures.every((s) => !definitions.some((d) => d.id === s.fmaId)));
console.log(JSON.stringify({
  status: 'root-source-audited',
  parent: parent.id,
  conceptIds: definitions.map((d) => d.id),
  files: fileReports,
  nestedAdmissionRequires: 'The nested viewer must hide FMA7088 whenever these files render and preserve one visible owner per file through Undo/reassembly; the integration validator checks this separately.',
  rootSelectableAdded: 0,
  clinicalApproval: false,
}));
