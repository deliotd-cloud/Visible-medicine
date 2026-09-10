import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { sourceObjShape } from './source-surface-audit.mjs';
import { sourceTopology } from './source-topology.mjs';
import { prepareShape } from './vessel-shape-math.mjs';
import { removeReviewedOppositeFaceIslands } from './reviewed-face-islands.mjs';
import { cricothyroidCandidates } from './cricothyroid-candidates.mjs';
import { loadSourceHolds } from './load-source-holds.mjs';

let checks = 0,
  rejected = 0;
const equal = (a, b, reason) => {
  checks++;
  assert.deepEqual(a, b, reason);
};
const reject = (fn) => {
  checks++;
  rejected++;
  assert.throws(fn);
};
const hash = (b) => createHash('sha256').update(b).digest('hex');
const directory = 'content/prototypes/cricothyroid';
const manifest = JSON.parse(await readFile(`${directory}/catalog.json`));
const auditBytes = await readFile('docs/cricothyroid-source-audit.json');
const audit = JSON.parse(auditBytes);
const { catalog, records, policy, evidence } = await loadSourceHolds();
equal(manifest.auditSha256, hash(auditBytes));
equal(manifest.evidence, evidence);
equal(manifest.prototypeOnly, true);
equal(manifest.admitted, false);
equal(catalog.structures.length, 1022);
equal(catalog.bundles.length, 86);
equal(
  hash(await readFile('public/models/bodyparts3d/full-body/catalog.json')),
  '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7',
);
equal(
  hash(await readFile(`${directory}/${manifest.artifact.file}`)),
  manifest.artifact.sha256,
);
equal(manifest.artifact.triangles, 17636);
equal(manifest.artifact.meshes, 4);
equal(manifest.artifact.maxPositionErrorMm < 0.0001, true);
equal(new Set(manifest.structures.map((s) => s.id)).size, 4);
equal(audit.rootEnvelopeScreen.length, 1022);
equal(audit.comparisons.length, 78);
equal(audit.candidatePairs.length, 6);
equal(audit.comparisons.filter((c) => c.cartilageContact).length, 8);
equal(
  audit.comparisons.some(
    (c) => c.rawExactSharedTriangles || c.derivativeExactSharedTriangles,
  ),
  false,
);
let triangles = 0,
  removed = 0;
for (const candidate of cricothyroidCandidates) {
  const raw = await readFile(`${directory}/source/${candidate.file}.obj`);
  equal(hash(raw), candidate.sha256);
  const altered = Buffer.concat([
    raw,
    Buffer.from('\n# unreviewed change\n'),
  ]);
  equal(hash(altered) === candidate.sha256, false);
  const definition = records.find(
    (r) => r.tree === candidate.tree && r.id === candidate.id,
  );
  policy.assertNoKnownHolds([definition]);
  const group = audit.groups.find((g) => g.id === candidate.id);
  equal(group.definition, definition);
  equal(group.directOwners, []);
  equal(group.exactInventoryMatches, []);
  equal(group.sameFilenameOtherTree, []);
  equal(
    catalog.structures.some((s) => s.fmaId === candidate.id),
    false,
  );
  const shape = sourceObjShape(raw),
    before = JSON.stringify({ vertices: shape.vertices, faces: shape.faces });
  const derivative = removeReviewedOppositeFaceIslands(
    shape,
    candidate.oppositeFaceIslands,
  );
  equal(
    JSON.stringify({ vertices: shape.vertices, faces: shape.faces }),
    before,
    'Input must not be mutated',
  );
  equal(derivative.topology.closedOrientedManifold, true);
  equal(derivative.topology.components.length, 1);
  equal(derivative.shape.faces.length, candidate.retainedTriangles);
  equal(derivative.topology, group.derivative.topology);
  equal(derivative.islands, group.derivative.removedIslands);
  for (const [faceId, face] of derivative.shape.faces.entries()) {
    equal(
      face.map((i) => derivative.shape.vertices[i]),
      shape.faces[derivative.retainedSourceFaceIndices[faceId]].map(
        (i) => shape.vertices[i],
      ),
      'Every retained source triangle and winding is unchanged',
    );
    triangles++;
  }
  for (const point of derivative.shape.vertices)
    equal(candidate.side === 'right' ? point[0] < 0 : point[0] > 0, true);
  for (const pair of candidate.oppositeFaceIslands) {
    equal(
      pair.every((id) => !derivative.retainedSourceFaceIndices.includes(id)),
      true,
    );
    removed += pair.length;
  }
  if (candidate.oppositeFaceIslands.length) {
    reject(() => removeReviewedOppositeFaceIslands(shape, []));
    reject(() =>
      removeReviewedOppositeFaceIslands(
        shape,
        candidate.oppositeFaceIslands.slice(1),
      ),
    );
  }
  const exported = manifest.structures.find((s) => s.fmaId === candidate.id);
  equal(exported.laterality, candidate.side);
  equal(exported.sources, [
    { file: candidate.file, sha256: candidate.sha256 },
  ]);
  equal(exported.validation, {
    status: 'unvalidated',
    anatomicalReview: false,
  });
  equal(
    exported.derivative.removedSourceFaces,
    candidate.oppositeFaceIslands.flat().sort((a, b) => a - b),
  );
  const rawMain = sourceTopology(shape).components[0];
  equal(
    derivative.topology.components[0].bounds,
    rawMain.bounds,
    'Main anatomical component is not moved or reshaped',
  );
}
equal(triangles, 17636);
equal(removed, 12);
// Adversarial fixtures: never use size, area or being disconnected alone as a
// reason to delete geometry. Exact reversed pairs + full disconnection required.
const vertices = [
  [0, 0, 0],
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
  [3, 0, 0],
  [4, 0, 0],
  [3, 1, 0],
];
const tetra = [
  [0, 2, 1],
  [0, 1, 3],
  [0, 3, 2],
  [1, 2, 3],
];
const fixture = prepareShape(vertices, [...tetra, [4, 5, 6], [6, 5, 4]]);
equal(
  removeReviewedOppositeFaceIslands(fixture, [[4, 5]]).shape.faces,
  tetra,
);
reject(() => removeReviewedOppositeFaceIslands(fixture, [[4, 4]]));
reject(() =>
  removeReviewedOppositeFaceIslands(fixture, [
    [4, 5],
    [4, 5],
  ]),
);
reject(() => removeReviewedOppositeFaceIslands(fixture, [[4, 6]]));
reject(() => removeReviewedOppositeFaceIslands(fixture, [[4, -1]]));
reject(() => removeReviewedOppositeFaceIslands(fixture, [[4, 5.1]]));
reject(() => removeReviewedOppositeFaceIslands(fixture, [[0, 1]]));
reject(() =>
  removeReviewedOppositeFaceIslands(
    prepareShape(vertices, [...tetra, [4, 5, 6], [4, 5, 6]]),
    [[4, 5]],
  ),
);
const touching = vertices.map((v) => [...v]);
touching[4] = [...vertices[0]];
reject(() =>
  removeReviewedOppositeFaceIslands(
    prepareShape(touching, [...tetra, [4, 5, 6], [6, 5, 4]]),
    [[4, 5]],
  ),
);
const collinear = vertices.map((v) => [...v]);
collinear[6] = [5, 0, 0];
reject(() =>
  removeReviewedOppositeFaceIslands(
    prepareShape(collinear, [...tetra, [4, 5, 6], [6, 5, 4]]),
    [[4, 5]],
  ),
);
reject(() =>
  removeReviewedOppositeFaceIslands(
    prepareShape(vertices, [...tetra, [4, 5, 6], [6, 5, 4], [4, 5, 6]]),
    [[4, 5]],
  ),
);
// No source hold is relaxed by introducing this narrow derivative helper.
for (const id of [
  'FMA55251',
  'FMA55252',
  'FMA46604',
  'FMA46605',
  'FMA55619',
  'FMA55620',
]) {
  reject(() =>
    policy.assertNoKnownHolds([
      records.find((r) => r.tree === 'isa' && r.id === id),
    ]),
  );
}
checks++;
await assert.rejects(
  access('public/models/bodyparts3d/cricothyroid/cricothyroid-prototype.glb'),
);
console.log(
  JSON.stringify({
    checks,
    rejected,
    sourceTrianglesCompared: triangles,
    removedSourceFaces: removed,
    publicAtlasUnchanged: true,
    admitted: false,
  }),
);
