import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Vector3 } from 'three';
import { prepareShape } from './vessel-shape-math.mjs';
import { mergeSourceShapes } from './source-surface-audit.mjs';
import {
  sourceTopology,
  sourceDistanceIndex,
  fullSourceContact,
} from './source-topology.mjs';
import { supportingTopologyReport } from './supporting-topology-report.mjs';

let checks = 0;
const same = (a, b, message) => {
  assert.deepEqual(a, b, message);
  checks++;
};
const check = (value, message) => {
  assert.ok(value, message);
  checks++;
};
const near = (a, b, message) => check(Math.abs(a - b) < 1e-8, message);
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const tetraVertices = [
  [0, 0, 0],
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];
const tetraFaces = [
  [0, 2, 1],
  [0, 1, 3],
  [0, 3, 2],
  [1, 2, 3],
];
const tetra = prepareShape(tetraVertices, tetraFaces),
  original = JSON.stringify(tetra);
const closed = sourceTopology(tetra);
same(
  [
    closed.boundaryEdges,
    closed.nonManifoldEdges,
    closed.nonManifoldVertices,
    closed.inconsistentWindingEdges,
  ],
  [0, 0, 0, 0],
);
same(closed.closedOrientedManifold, true);
same(closed.eulerCharacteristic, 2);
same(closed.components.length, 1);
near(
  closed.components[0].algebraicVolumeMm3,
  1 / 6,
  'Closed oriented tetrahedron algebraic volume',
);
const seamVertices = tetraFaces.flatMap((face) =>
  face.map((i) => tetraVertices[i]),
);
const seamFaces = tetraFaces.map((_, i) => [3 * i, 3 * i + 1, 3 * i + 2]);
const seams = sourceTopology(prepareShape(seamVertices, seamFaces));
same(
  seams.exactUniqueVertices,
  4,
  'Repeated OBJ seam positions merge in analysis only',
);
same(seams.closedOrientedManifold, true);
same(seams.components.length, 1);
const open = sourceTopology(
  prepareShape(tetraVertices, tetraFaces.slice(0, 3)),
);
same(open.boundaryEdges, 3);
same(open.closedOrientedManifold, false);
const flipped = sourceTopology(
  prepareShape(
    tetraVertices,
    tetraFaces.map((face, i) => (i === 0 ? [...face].reverse() : face)),
  ),
);
same(flipped.inconsistentWindingEdges, 3);
same(flipped.closedOrientedManifold, false);
const reversed = sourceTopology(
  prepareShape(
    tetraVertices,
    tetraFaces.map((face) => [...face].reverse()),
  ),
);
near(
  reversed.components[0].algebraicVolumeMm3,
  -1 / 6,
  'Orientation is not silently repaired',
);
const duplicate = sourceTopology(
  prepareShape(tetraVertices, [...tetraFaces, tetraFaces[0]]),
);
same(duplicate.duplicateFaces, 1);
same(duplicate.nonManifoldEdges, 3);
same(duplicate.closedOrientedManifold, false);
const sheet = sourceTopology(
  prepareShape(tetraVertices.slice(0, 3), [
    [0, 1, 2],
    [2, 1, 0],
  ]),
);
same(sheet.boundaryEdges, 0);
same(sheet.duplicateFaces, 1);
same(
  sheet.closedOrientedManifold,
  false,
  'Opposite duplicate facets do not establish an enclosed anatomical surface',
);
const translated = prepareShape(
  tetraVertices.map((v) => v.map((n, i) => n + [7, 10, -20][i])),
  tetraFaces,
);
const disjoint = sourceTopology(mergeSourceShapes([tetra, translated]));
same(disjoint.components.length, 2);
same(disjoint.closedOrientedManifold, true);
const touch = sourceTopology(
  mergeSourceShapes([
    tetra,
    prepareShape(
      tetraVertices.map((v) => v.map((n) => -n)),
      tetraFaces.map((f) => [...f].reverse()),
    ),
  ]),
);
same(touch.nonManifoldEdges, 0);
same(
  touch.nonManifoldVertices,
  1,
  'Two closed fans touching at a vertex are not one manifold',
);
same(touch.closedOrientedManifold, false);
const displacedSeamVertices = seamVertices.map((v, i) =>
  v.map((n, k) => n + (i === 0 && k === 0 ? 1e-6 : 0)),
);
same(
  sourceTopology(prepareShape(displacedSeamVertices, seamFaces))
    .closedOrientedManifold,
  false,
  'No tolerance welding masks cracks',
);
near(
  sourceTopology(translated).components[0].algebraicVolumeMm3,
  1 / 6,
  'Volume calculation uses a local reference for stability',
);
same(
  JSON.stringify(tetra),
  original,
  'Source coordinates and topology never change',
);

// Compare the accelerated queries against independent exhaustive Three triangle queries.
let seed = 79421;
const random = () => (seed = (1664525 * seed + 1013904223) >>> 0) / 2 ** 32;
const vertices = Array.from({ length: 270 }, () =>
  Array.from({ length: 3 }, () => random() * 20 - 10),
);
const soup = prepareShape(
  vertices,
  Array.from({ length: 90 }, (_, i) => [i * 3, i * 3 + 1, i * 3 + 2]),
);
for (const target of [tetra, translated, soup]) {
  const nearest = sourceDistanceIndex(target),
    closest = new Vector3();
  for (let i = 0; i < 1000; i++) {
    const point = new Vector3(
      random() * 40 - 20,
      random() * 40 - 20,
      random() * 40 - 20,
    );
    const brute = Math.min(
      ...target.triangles.map(({ triangle }) =>
        point.distanceTo(triangle.closestPointToPoint(point, closest)),
      ),
    );
    near(
      nearest(point),
      brute,
      'Bounding-volume pruning matches exhaustive nearest-triangle search',
    );
  }
}
const own = fullSourceContact(tetra, tetra);
same(own.vertices.samples, 4);
same(own.triangleCentroids.samples, 4);
near(own.vertices.maxMm, 0);
near(own.triangleCentroids.maxMm, 0);
for (const row of own.triangleCentroids.thresholds)
  near(
    row.weightedFraction,
    1,
    'Identical surfaces have all quadrature points near',
  );
const flat = prepareShape(
  [
    [0, 0, 0],
    [1, 0, 0],
    [0, 1, 0],
  ],
  [[0, 1, 2]],
);
const raised = prepareShape(
  [
    [0, 0, 0.2],
    [1, 0, 0.2],
    [0, 1, 0.2],
  ],
  [[0, 1, 2]],
);
const offsetContact = fullSourceContact(flat, raised);
near(offsetContact.vertices.medianMm, 0.2);
near(offsetContact.triangleCentroids.maxMm, 0.2);
same(
  offsetContact.vertices.thresholds.map((x) => x.count),
  [0, 3, 3],
);
const degenerate = prepareShape(
  [
    [0, 0, 0],
    [1, 0, 0],
    [2, 0, 0],
  ],
  [[0, 1, 2]],
);
assert.throws(() => sourceDistanceIndex(degenerate));
checks++;
assert.throws(() => fullSourceContact(degenerate, tetra));
checks++;

const report = JSON.parse(
  await fs.readFile('content/supporting-topology-audit.json'),
);
const priorRaw = await fs.readFile('content/supporting-geometry-audit.json');
const prior = JSON.parse(priorRaw);
const catalogRaw = await fs.readFile(
  'public/models/bodyparts3d/full-body/catalog.json',
);
const catalog = JSON.parse(catalogRaw);
same(report.priorAuditSha256, hash(priorRaw));
same(report.catalogSha256, hash(catalogRaw));
same(
  report.algorithmSha256,
  hash(
    (await fs.readFile('scripts/source-topology.mjs', 'utf8')).replaceAll(
      '\r\n',
      '\n',
    ),
  ),
);
same(report.sourceVersion, '4.0');
same(report.license, 'CC-BY-4.0');
same(report.credit, prior.credit);
same(report.sources.length, 12);
same(report.contacts.length, 8);
same(report.admitted, []);
same(report.sourceGeometryChanged, false);
same(report.clinicalValidation, false);
const expected = {
  FMA54159: [1, 0],
  FMA258850: [2, 1],
  FMA65198: [15, 11],
  FMA65199: [15, 11],
  FMA37389: [12, 11],
  FMA37388: [12, 11],
  FMA49048: [2, 1],
  FMA59091: [1, 0],
  FMA37390: [18, 17],
  FMA37391: [18, 17],
  FMA40120: [1, 0],
  FMA40121: [1, 0],
};
for (const source of report.sources) {
  const candidate = prior.results.find((item) => item.fmaId === source.id);
  const existing = catalog.structures.find((item) => item.fmaId === source.id);
  same(
    source.files,
    candidate
      ? [{ file: candidate.file, sha256: candidate.sha256 }]
      : existing.sources,
  );
  same(source.role, candidate?.role ?? 'existing-context');
  if (candidate)
    check(
      !catalog.structures.some((item) =>
        item.sources.some((part) => part.file === candidate.file),
      ),
      'No silent candidate admission',
    );
  same(
    [source.topology.components.length, source.topology.duplicateFaces],
    expected[source.id],
  );
  same(source.topology.boundaryEdges, 0);
  same(source.topology.nonManifoldEdges, 0);
  same(source.topology.nonManifoldVertices, 0);
  same(source.topology.inconsistentWindingEdges, 0);
  same(
    source.topology.components.reduce(
      (sum, component) => sum + component.triangles,
      0,
    ),
    source.topology.triangles,
  );
  same(
    source.topology.closedOrientedManifold,
    source.topology.duplicateFaces === 0,
  );
}
const expectedPairs = prior.comparisons
  .filter(
    (pair) =>
      pair.flagged ||
      (pair.a === 'FMA65198' && pair.b === 'FMA37389') ||
      (pair.a === 'FMA65199' && pair.b === 'FMA37388'),
  )
  .map(({ a, b }) => [a, b]);
same(
  report.contacts.map(({ a, b }) => [a, b]),
  expectedPairs,
);
for (const pair of report.contacts)
  for (const [id, direction] of [
    [pair.a, pair.aToB],
    [pair.b, pair.bToA],
  ]) {
    const source = report.sources.find((item) => item.id === id);
    same(direction.vertices.samples, source.topology.exactUniqueVertices);
    same(direction.triangleCentroids.samples, source.topology.triangles);
    for (const sample of [direction.vertices, direction.triangleCentroids]) {
      check(
        Number.isFinite(sample.maxMm) &&
          sample.maxMm >= sample.medianMm &&
          sample.medianMm >= 0,
      );
      same(
        sample.thresholds.map((t) => t.mm),
        [0.1, 0.25, 1],
      );
      let count = 0,
        fraction = 0;
      for (const threshold of sample.thresholds) {
        check(
          Number.isInteger(threshold.count) &&
            threshold.count >= count &&
            threshold.count <= sample.samples,
        );
        check(
          threshold.weightedFraction >= fraction &&
            threshold.weightedFraction <= 1,
        );
        count = threshold.count;
        fraction = threshold.weightedFraction;
      }
    }
  }
const relationship = JSON.parse(
  await fs.readFile('content/supporting-source-relationships.json'),
);
same(relationship.relation, 'is-a');
same(relationship.rawDocumentSha256, null);
same(relationship.establishesAttachment, false);
same(relationship.establishesParentMuscleComponent, false);
same(relationship.rows.length, 4);
const inventory = JSON.parse(
  await fs.readFile('content/source-inventory.json'),
);
for (const row of relationship.rows)
  for (const [id, name] of [
    [row.parent, row.parentName],
    [row.child, row.childName],
  ])
    same(
      inventory.records.find((item) => item.tree === 'isa' && item.id === id)
        ?.name,
      name,
      'Observed relationship endpoint matches the pinned source identity',
    );
if (process.argv.includes('--raw-source'))
  same(
    await supportingTopologyReport(),
    report,
    'Every raw source, component and full-point contact reproduces',
  );
console.log(
  JSON.stringify(
    {
      passed: true,
      checks,
      rawSourceReproduction: process.argv.includes('--raw-source'),
      sources: report.sources.length,
      contactPairs: report.contacts.length,
      sourceGeometryChanged: false,
      clinicalValidation: false,
    },
    null,
    2,
  ),
);
