import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import {
  Box3,
  BufferAttribute,
  BufferGeometry,
  Line3,
  Matrix4,
} from 'three';
import { MeshBVH } from 'three-mesh-bvh';
import { loadCurrentSourceHolds } from './current-source-holds.mjs';
import { sourceObjShape } from './source-surface-audit.mjs';

const INPUT_AUDIT = 'docs/thoracolumbar-vessel-source-audit.json';
const INPUT_AUDIT_SHA256 =
  '961c6a06487ac66016e6a244989db6dfa44e5a69209c53579ca9a55e8059109d';
const OUTPUT = 'docs/subcostal-intersection-audit.json';
const CANDIDATE_IDS = ['FMA4634', 'FMA4654', 'FMA4844', 'FMA4951'];
const CONTEXT_IDS = [
  'FMA8533',
  'FMA8534',
  'FMA13295',
  'FMA87217',
  'FMA3789',
  'FMA4838',
  'FMA4944',
];
const identity = new Matrix4();
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

function geometryFor(shape) {
  const geometry = new BufferGeometry();
  geometry.setAttribute(
    'position',
    new BufferAttribute(new Float64Array(shape.vertices.flat()), 3),
  );
  const flatFaces = shape.faces.flat();
  const largestIndex = flatFaces.reduce((maximum, index) => Math.max(maximum, index), 0);
  const IndexArray = largestIndex > 65535 ? Uint32Array : Uint16Array;
  const originalIndex = new IndexArray(flatFaces);
  geometry.setIndex(new BufferAttribute(originalIndex.slice(), 1));
  const bvh = new MeshBVH(geometry, { indirect: true, verbose: false });
  assert.deepEqual(
    Array.from(geometry.index.array),
    Array.from(originalIndex),
    'Indirect BVH changed the source index order',
  );
  assert.equal(bvh.indirect, true);
  return { geometry, bvh, originalIndex };
}

function coordinateKeys(shape) {
  return shape.faces.map(
    (face) => new Set(face.map((index) => shape.vertices[index].join(','))),
  );
}

function intersects(a, b, { self = false } = {}) {
  const rows = [];
  const bounds = new Box3();
  let validBounds = false;
  const aKeys = self ? coordinateKeys(a.shape) : null;
  a.bvh.bvhcast(b.bvh, identity, {
    intersectsTriangles(triangleA, triangleB, bvhFaceA, bvhFaceB) {
      const faceA = a.bvh.resolveTriangleIndex(bvhFaceA);
      const faceB = b.bvh.resolveTriangleIndex(bvhFaceB);
      if (self) {
        if (faceA >= faceB) return false;
        if ([...aKeys[faceA]].some((key) => aKeys[faceB].has(key)))
          return false;
      }
      const line = new Line3();
      if (!triangleA.intersectsTriangle(triangleB, line, true)) return false;
      const normalsParallel =
        Math.abs(triangleA.plane.normal.dot(triangleB.plane.normal)) >
        1 - 1e-10;
      let kind;
      let intersectionSegment = null;
      if (normalsParallel) {
        kind = 'coplanar-overlap-or-touch';
      } else {
        intersectionSegment = [line.start.toArray(), line.end.toArray()];
        bounds.expandByPoint(line.start);
        bounds.expandByPoint(line.end);
        validBounds = true;
        kind = line.start.equals(line.end)
          ? 'noncoplanar-point-or-tangent-touch'
          : 'noncoplanar-segment-crossing-or-touch';
      }
      rows.push({ faceA, faceB, kind, intersectionSegment });
      return false;
    },
  });
  rows.sort(
    (x, y) =>
      x.faceA - y.faceA || x.faceB - y.faceB || x.kind.localeCompare(y.kind),
  );
  return {
    count: rows.length,
    classifications: Object.fromEntries(
      [...new Set(rows.map((row) => row.kind))]
        .sort()
        .map((kind) => [kind, rows.filter((row) => row.kind === kind).length]),
    ),
    intersectionBounds:
      validBounds && !bounds.isEmpty()
        ? { min: bounds.min.toArray(), max: bounds.max.toArray() }
        : null,
    intersectionBoundsValidFor:
      'noncoplanar predicate results with a returned segment only',
    facePairs: rows,
  };
}

function syntheticShape(vertices, faces) {
  const shape = {
    vertices,
    faces,
  };
  return { shape, ...geometryFor(shape) };
}

function tetra(vertices) {
  return syntheticShape(vertices, [
    [0, 2, 1],
    [0, 1, 3],
    [0, 3, 2],
    [1, 2, 3],
  ]);
}

function shifted(points, offset) {
  return points.map((point) => point.map((value, axis) => value + offset[axis]));
}

function syntheticChecks() {
  const base = [
    [0, 0, 0],
    [2, 0, 0],
    [0, 2, 0],
    [0, 0, 2],
  ];
  const outer = tetra(base);
  const crossing = intersects(outer, tetra(shifted(base, [1, 0.2, 0.2])));
  const separated = intersects(outer, tetra(shifted(base, [5, 0, 0])));
  const adjacent = intersects(
    outer,
    tetra([
      [0, 0, 0],
      [2, 0, 0],
      [0, 2, 0],
      [0, 0, -2],
    ]),
  );
  const contained = intersects(
    outer,
    tetra([
      [0.25, 0.25, 0.25],
      [0.5, 0.25, 0.25],
      [0.25, 0.5, 0.25],
      [0.25, 0.25, 0.5],
    ]),
  );
  const self = intersects(outer, outer, { self: true });
  const selfCrossing = syntheticShape(
    [
      [-2, -2, 0],
      [2, -2, 0],
      [0, 2, 0],
      [0, -1, -1],
      [0, -1, 1],
      [0, 1, 0],
    ],
    [
      [0, 1, 2],
      [3, 4, 5],
    ],
  );
  const positiveSelf = intersects(selfCrossing, selfCrossing, { self: true });
  const reorderedVertices = [];
  const reorderedFaces = [];
  for (let originalFace = 0; originalFace < 24; originalFace++) {
    const x = (23 - originalFace) * 3;
    const start = reorderedVertices.length;
    reorderedVertices.push([x, 0, 0], [x + 1, 0, 0], [x, 1, 0]);
    reorderedFaces.push([start, start + 1, start + 2]);
  }
  const reordered = syntheticShape(reorderedVertices, reorderedFaces);
  const bvhStorageToOriginal = reorderedFaces.map((_, index) =>
    reordered.bvh.resolveTriangleIndex(index),
  );
  const targetOriginalFace = 17;
  const targetVertices = reorderedFaces[targetOriginalFace].map(
    (index) => reorderedVertices[index],
  );
  const reorderedHit = intersects(
    reordered,
    syntheticShape(targetVertices, [[0, 1, 2]]),
  );
  assert(crossing.count > 0, 'Crossing tetrahedra were not detected');
  assert.equal(separated.count, 0, 'Separated tetrahedra intersect');
  assert(adjacent.count > 0, 'Adjacent tetrahedra contact was not detected');
  assert.equal(contained.count, 0, 'Containment must not imply surface crossing');
  assert.equal(self.count, 0, 'Valid tetrahedron has a non-adjacent self-hit');
  assert.equal(positiveSelf.count, 1, 'Non-adjacent self-crossing was missed');
  assert.deepEqual(
    positiveSelf.facePairs.map((row) => [row.faceA, row.faceB]),
    [[0, 1]],
    'Positive self-crossing lost original face IDs',
  );
  assert.notDeepEqual(
    bvhStorageToOriginal,
    reorderedFaces.map((_, index) => index),
    'Indirect fixture did not reorder BVH triangle storage',
  );
  assert.deepEqual(
    [...new Set(reorderedHit.facePairs.map((row) => row.faceA))],
    [targetOriginalFace],
    'Indirect callback index was not resolved to the original face ID',
  );
  return {
    crossing: { expected: 'surface intersection', count: crossing.count },
    separated: { expected: 'no surface intersection', count: separated.count },
    adjacent: {
      expected: 'reported contact; not distinguishable from penetration by boolean alone',
      count: adjacent.count,
      classifications: adjacent.classifications,
    },
    contained: {
      expected: 'zero: surface predicate does not detect strict containment',
      count: contained.count,
    },
    self: {
      expected: 'zero after excluding identical/shared-coordinate-vertex pairs',
      count: self.count,
    },
    positiveSelfCrossing: {
      expected:
        'one intersection between non-adjacent triangles with original face IDs 0 and 1',
      count: positiveSelf.count,
      originalFacePairs: positiveSelf.facePairs.map((row) => [
        row.faceA,
        row.faceB,
      ]),
    },
    indirectFaceIdentity: {
      triangles: reorderedFaces.length,
      exceedsDefaultLeafSize: true,
      bvhStorageActuallyReordered: true,
      targetOriginalFace,
      reportedOriginalFaces: [
        ...new Set(reorderedHit.facePairs.map((row) => row.faceA)),
      ],
      bvhStorageToOriginal,
    },
  };
}

const inputBytes = await readFile(INPUT_AUDIT);
assert.equal(sha256(inputBytes), INPUT_AUDIT_SHA256, 'Changed source audit');
const input = JSON.parse(inputBytes);
const installedBvhPackage = JSON.parse(
  await readFile('node_modules/three-mesh-bvh/package.json', 'utf8'),
);
assert.equal(installedBvhPackage.version, '0.8.3', 'Changed BVH predicate version');
assert.deepEqual(
  input.groups
    .filter((group) => group.status === 'candidate-source-review')
    .map((group) => group.id),
  CANDIDATE_IDS,
  'Candidate set/order changed',
);
const loaded = await loadCurrentSourceHolds();
const sources = new Map();

async function loadSource({ id, name, tree, file, expectedSha256, kind }) {
  assert(['isa', 'partof'].includes(tree));
  const path = `../work/bodyparts3d/${tree}/${file}.obj`;
  const bytes = await readFile(path);
  assert.equal(sha256(bytes), expectedSha256, `Changed source ${tree}/${file}`);
  const shape = sourceObjShape(bytes);
  assert(shape.triangles.every((entry) => !entry.degenerate));
  const built = geometryFor(shape);
  const source = {
    id,
    name,
    kind,
    tree,
    file,
    sha256: expectedSha256,
    bytes: bytes.length,
    vertices: shape.vertices.length,
    triangles: shape.faces.length,
    positionStorage: built.geometry.attributes.position.array.constructor.name,
    indexStorage: built.geometry.index.array.constructor.name,
    sourceIndexRetained: true,
    shape,
    ...built,
  };
  sources.set(id, source);
  return source;
}

for (const id of CANDIDATE_IDS) {
  const group = input.groups.find((row) => row.id === id);
  assert(group && group.status === 'candidate-source-review');
  await loadSource({
    id,
    name: group.name,
    kind: 'candidate',
    tree: 'isa',
    file: group.file,
    expectedSha256: group.sha256,
  });
}
for (const id of CONTEXT_IDS) {
  const matches = loaded.catalog.structures.filter((row) => row.fmaId === id);
  assert.equal(matches.length, 1, `Missing or ambiguous context ${id}`);
  const row = matches[0];
  assert.equal(row.sources.length, 1, `Compound context ${id}`);
  const source = row.sources[0];
  assert(/^[a-f0-9]{64}$/.test(source.sha256), `Unpinned context ${id}`);
  await loadSource({
    id,
    name: row.name,
    kind: 'context',
    tree: row.sourceTree,
    file: source.file,
    expectedSha256: source.sha256,
  });
}

const selfIntersections = CANDIDATE_IDS.map((id) => ({
  candidate: id,
  ...intersects(sources.get(id), sources.get(id), { self: true }),
}));
const candidatePairs = [];
for (let i = 0; i < CANDIDATE_IDS.length; i++)
  for (let j = i + 1; j < CANDIDATE_IDS.length; j++)
    candidatePairs.push({
      candidateA: CANDIDATE_IDS[i],
      candidateB: CANDIDATE_IDS[j],
      ...intersects(
        sources.get(CANDIDATE_IDS[i]),
        sources.get(CANDIDATE_IDS[j]),
      ),
    });
const contextPairs = CANDIDATE_IDS.flatMap((candidate) =>
  CONTEXT_IDS.map((context) => ({
    candidate,
    context,
    ...intersects(sources.get(candidate), sources.get(context)),
  })),
);

const result = {
  schemaVersion: 1,
  sourceAudit: { path: INPUT_AUDIT, sha256: INPUT_AUDIT_SHA256 },
  engine: {
    package: 'three-mesh-bvh',
    version: installedBvhPackage.version,
    mode: 'MeshBVH.bvhcast intersectsTriangles',
    indirect: true,
    coordinates: 'unaltered BodyParts3D source millimetres',
    positionStorage: 'Float64Array',
    boundsStorage:
      'MeshBVH node bounds use the library padded Float32 representation.',
    arithmetic: 'floating-point predicate; not exact arithmetic',
    faceIdentity:
      'Callback BVH indices are mapped with resolveTriangleIndex() to original zero-based OBJ face order.',
  },
  sources: [...sources.values()].map(
    ({ shape, geometry, bvh, originalIndex, ...row }) => row,
  ),
  coverage: {
    selfPairs: selfIntersections.length,
    candidatePairs: candidatePairs.length,
    contextPairs: contextPairs.length,
    expected: { selfPairs: 4, candidatePairs: 6, contextPairs: 28 },
  },
  syntheticChecks: syntheticChecks(),
  selfIntersections,
  candidatePairs,
  contextPairs,
  geometryModified: false,
  admissionApproved: false,
  clinicalApproval: false,
  limitations: [
    'The BVH prunes bounds, but every surviving triangle pair is evaluated with the library floating-point triangle predicate; this is not exact arithmetic.',
    'Source positions remain Float64, while MeshBVH acceleration bounds are conservatively padded Float32 values; BVH pruning is therefore not a Float64 exact-arithmetic proof.',
    'Self tests exclude identical pairs and any pair sharing an exact coordinate vertex. This removes ordinary adjacent faces but can also hide a pathological fold or overlap incident at a shared vertex.',
    'Coplanar overlap and boundary touch are not separated reliably. Noncoplanar returned segments distinguish point-like from segment-like results only at the predicate output level, not as anatomical contact versus penetration.',
    'Surface intersection cannot detect strict containment without surface crossing; the contained tetrahedron check records this limitation.',
    'Zero intersections do not establish anatomical attachment, continuous lumen, clearance, donor identity or clinical validity. Positive intersections require visual and anatomical disposition.',
    'No source vertices, faces, labels or runtime anatomy are modified or admitted.',
  ],
};
assert.deepEqual(result.coverage, {
  selfPairs: 4,
  candidatePairs: 6,
  contextPairs: 28,
  expected: { selfPairs: 4, candidatePairs: 6, contextPairs: 28 },
});
const text = JSON.stringify(result, null, 2) + '\n';
if (process.argv.includes('--check')) {
  assert.equal(
    (await readFile(OUTPUT, 'utf8')).replace(/\r\n/g, '\n'),
    text,
    'Intersection audit is stale',
  );
} else {
  await writeFile(OUTPUT, text, { flag: 'wx' });
}
console.log(
  JSON.stringify({
    auditSha256: sha256(text),
    coverage: result.coverage,
    syntheticChecks: result.syntheticChecks,
    selfHits: selfIntersections.map((row) => [row.candidate, row.count]),
    candidateHits: candidatePairs
      .filter((row) => row.count)
      .map((row) => [row.candidateA, row.candidateB, row.count]),
    contextHits: contextPairs
      .filter((row) => row.count)
      .map((row) => [row.candidate, row.context, row.count]),
  }),
);
