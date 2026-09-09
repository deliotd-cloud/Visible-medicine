import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Line3, Vector3 } from 'three';
import { prepareShape } from './vessel-shape-math.mjs';
import {
  spatialDistanceIndex,
  distanceSummary,
  candidateContact,
  componentEndBands,
} from './source-spatial-math.mjs';
import { candidateSpatialReport } from './candidate-spatial-report.mjs';
import { loadSourceHolds } from './load-source-holds.mjs';
import { sha256 } from './source-geometry-screen.mjs';

let checks = 0;
const same = (a, b) => {
  checks++;
  assert.deepEqual(a, b);
};
const near = (a, b) => {
  checks++;
  assert(Math.abs(a - b) < 1e-10, `${a} differs from ${b}`);
};
const rejects = (fn) => {
  checks++;
  assert.throws(fn);
};
const shape = prepareShape(
  [
    [0, 0, 0],
    [2, 0, 0],
    [0, 2, 0],
    [5, 0, 0],
    [6, 0, 0],
    [7, 0, 0],
    [10, 0, 0],
  ],
  [
    [0, 1, 2],
    [3, 4, 5],
    [6, 6, 6],
  ],
);
const before = JSON.stringify(shape),
  nearest = spatialDistanceIndex(shape);
near(nearest(new Vector3(0.3, 0.3, 2)), 2);
near(nearest(new Vector3(6, 1, 0)), 1);
near(nearest(new Vector3(10, 0, 0)), 0);
function brute(point) {
  const closest = new Vector3();
  return Math.min(
    ...shape.triangles.map(({ triangle: t, degenerate }) =>
      degenerate
        ? Math.min(
            ...[
              [t.a, t.b],
              [t.b, t.c],
              [t.c, t.a],
            ].map(([a, b]) =>
              a.equals(b)
                ? point.distanceTo(a)
                : point.distanceTo(
                    new Line3(a, b).closestPointToPoint(point, true, closest),
                  ),
            ),
          )
        : point.distanceTo(t.closestPointToPoint(point, closest)),
    ),
  );
}
for (let i = 0; i < 100; i++) {
  const p = new Vector3(
    ((i * 17) % 29) / 2 - 1,
    ((i * 7) % 23) / 3 - 2,
    ((i * 11) % 19) / 4 - 1,
  );
  near(nearest(p), brute(p));
}
const degenerate = prepareShape(
  [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ],
  [[0, 1, 2]],
);
near(spatialDistanceIndex(degenerate)(new Vector3(1, 2, 2)), 3);
rejects(() => spatialDistanceIndex({ triangles: [] }));
rejects(() => distanceSummary([], nearest));
rejects(() => distanceSummary([[0, 0, 0]], nearest, [-1]));
same(
  distanceSummary([[0, 0, 0]], nearest, [0]).thresholds.map(
    (t) => t.weightedFraction,
  ),
  [null, null, null, null],
);
const pair = prepareShape(
  [
    [0, 0, 0],
    [1, 0, 0],
    [0, 2, 0],
    [5, 0, 3],
    [6, 0, 3],
    [5, 2, 3],
  ],
  [
    [0, 1, 2],
    [3, 4, 5],
  ],
);
const bands = componentEndBands(pair);
same(
  bands.map((b) => ({
    vertices: b.uniqueVertices,
    axis: b.axis,
    width: b.widthMm,
    low: b.low.length,
    high: b.high.length,
  })),
  [
    { vertices: 3, axis: 1, width: 0.5, low: 2, high: 1 },
    { vertices: 3, axis: 1, width: 0.5, low: 2, high: 1 },
  ],
);
const contact = candidateContact(pair, shape);
same(contact.candidateVertices.samples, 6);
same(contact.candidateTriangleCentroids.samples, 2);
same(contact.targetVertexSamples.samples, 7);
same(JSON.stringify(shape), before);

const raw = await readFile('content/candidate-spatial-audit.json'),
  report = JSON.parse(raw);
same(
  sha256(raw),
  '2094aa23c2d7623a05616c528a68ed54ac87b7aba5684f7a65639b034c6f20be',
);
const context = await loadSourceHolds();
same(report.evidence, context.evidence);
same(
  report.preparationSha256,
  sha256(await readFile('content/source-geometry-screen.json')),
);
same(
  report.algorithmSha256,
  sha256(
    (await readFile('scripts/source-spatial-math.mjs', 'utf8')).replaceAll(
      '\r\n',
      '\n',
    ),
  ),
);
same(report.summary, {
  displayedDefinitionsScreened: 1022,
  candidateFiles: 4,
  heldFilesBoundsScreened: 48,
  loadedControls: 69,
  comparedPairs: 84,
  rawBoundsPrunedPairs: 0,
  endpointProbePairs: 10,
  broadNearContactPairs: 0,
  exactSharedTrianglePairs: 0,
  admissions: 0,
});
same(
  report.allScreened.map((s) => s.id),
  context.catalog.structures.map((s) => s.id),
);
same(report.sourceGeometryChanged, false);
same(report.clinicalValidation, false);
for (const control of report.controls.filter((c) => c.role === 'displayed')) {
  const source = context.catalog.structures.find((s) => s.id === control.key);
  same(control.sources, source.sources);
  same(control.tree, source.sourceTree);
  same(control.name, source.sourceName);
}
for (const comparison of report.comparisons) {
  const summaries = [
    comparison.candidateVertices,
    comparison.candidateTriangleCentroids,
    comparison.targetVertexSamples,
  ];
  for (const s of summaries) {
    same(
      Number.isFinite(s.minMm) &&
        s.minMm >= 0 &&
        s.minMm <= s.medianMm &&
        s.medianMm <= s.maxMm,
      true,
    );
    same(
      s.thresholds.map((t) => t.mm),
      [0.1, 0.25, 1, 2],
    );
    same(
      s.thresholds.every(
        (t, i) =>
          t.count <= s.samples &&
          (i === 0 || t.count >= s.thresholds[i - 1].count),
      ),
      true,
    );
  }
  same(comparison.targetVertexSamples.samples <= 128, true);
  same(
    comparison.broadNearContact,
    summaries.some((s) => s.thresholds[1].weightedFraction >= 0.25),
  );
}
same(
  report.endpointProbes
    .filter((p) => /ciliary ganglion|eyeball/.test(p.name))
    .every(
      (p) =>
        p.components.length === 2 && p.components.every((c) => c.axis === 1),
    ),
  true,
);
same(
  report.endpointProbes
    .filter((p) => p.name.endsWith('anterior choroidal artery'))
    .map((p) => p.components[0].low.minMm < 0.01),
  [true, true],
);
let rawReproduced = false;
if (process.argv.includes('--raw')) {
  same(await candidateSpatialReport(), report);
  rawReproduced = true;
}
console.log(
  JSON.stringify({
    checks,
    comparedPairs: 84,
    endpointProbePairs: 10,
    rawReproduced,
    admissions: 0,
    clinicalValidation: false,
  }),
);
