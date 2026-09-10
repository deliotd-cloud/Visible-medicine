import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { loadSourceHolds } from './load-source-holds.mjs';
import { cache } from './bodyparts-archive.mjs';
import { sourceObjShape, sourceTriangleSet } from './source-surface-audit.mjs';
import { sourceTopology } from './source-topology.mjs';
import { compareTranslatedShape } from './vessel-shape-math.mjs';
import {
  spatialDistanceIndex,
  uniqueSourceVertices,
  distanceSummary,
} from './source-spatial-math.mjs';

// Read existing licensed source only: no downloads, repair, admission or relabelling.
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const { catalog, records, evidence, policy } = await loadSourceHolds();
const parent = catalog.structures.find((s) => s.fmaId === 'FMA7198');
assert(parent && parent.sourceTree === 'partof');
assert.deepEqual(
  parent.sources.map((s) => s.file),
  ['FJ1895', 'FJ1896', 'FJ2629', 'FJ2630'],
);
const definitions = [
  ['isa', 'FMA7198', 'pancreas', ['FJ1895']],
  ['partof', 'FMA10419', 'pancreatic duct', ['FJ1896']],
  ['partof', 'FMA63120', 'parenchyma of pancreas', ['FJ2629']],
  ['partof', 'FMA63103', 'pancreatic duct tree', ['FJ1896', 'FJ2630']],
  ['isa', 'FMA63103', 'pancreatic duct tree', ['FJ2630']],
].map(([tree, id, name, files]) => {
  const matches = records.filter((r) => r.tree === tree && r.id === id);
  assert.equal(matches.length, 1);
  assert.equal(matches[0].name, name);
  assert.deepEqual(matches[0].files, files);
  policy.assertNoKnownHolds(matches);
  return matches[0];
});
const shapes = new Map(),
  sources = [];
for (const source of parent.sources) {
  const bytes = await readFile(`${cache}/partof/${source.file}.obj`);
  assert.equal(hash(bytes), source.sha256);
  const shape = sourceObjShape(bytes);
  assert(shape.vertices.length && shape.faces.length);
  assert(
    shape.vertices.every((p) => p.length === 3 && p.every(Number.isFinite)),
  );
  assert(
    shape.faces.every(
      (f) =>
        f.length === 3 &&
        f.every(
          (i) => Number.isInteger(i) && i >= 0 && i < shape.vertices.length,
        ),
    ),
  );
  shapes.set(source.file, shape);
  sources.push({
    ...source,
    bytes: bytes.length,
    definitions: definitions.filter((d) => d.files.includes(source.file)),
    topology: sourceTopology(shape),
  });
}
const pairs = [];
for (let a = 0; a < sources.length; a++) {
  for (let b = a + 1; b < sources.length; b++) {
    const left = shapes.get(sources[a].file),
      right = shapes.get(sources[b].file);
    const set = sourceTriangleSet(right);
    pairs.push({
      files: [sources[a].file, sources[b].file],
      exactSharedTriangles: [...sourceTriangleSet(left)].filter((t) =>
        set.has(t),
      ).length,
      translationComparison: compareTranslatedShape(left, right),
      firstToSecond: distanceSummary(
        uniqueSourceVertices(left),
        spatialDistanceIndex(right),
      ),
      secondToFirst: distanceSummary(
        uniqueSourceVertices(right),
        spatialDistanceIndex(left),
      ),
    });
  }
}
const report = {
  schemaVersion: 1,
  evidence,
  parent,
  definitions,
  sources,
  pairs,
  licence: {
    id: 'CC-BY-4.0',
    url: 'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html',
    checked: '2026-09-10',
    credit:
      'BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International',
  },
  sourceCoordinatesUnchanged: true,
  automaticallyAdmitted: false,
  clinicalApproval: false,
  limitations:
    'Exact source identities, raw hashes, topology and all-vertex nearest-surface distances. Not a self-intersection, tissue identity, duct continuity/patency, complete pancreas, microscopic layer or clinical validation. PART-OF duct tree contains the named duct; do not duplicate it as an independent full tree.',
};
const path = 'docs/pancreatic-source-audit.json';
if (process.argv.includes('--check'))
  assert.deepEqual(JSON.parse(await readFile(path)), report);
else await writeFile(path, JSON.stringify(report, null, 2) + '\n');
console.log(
  JSON.stringify(
    {
      sources: sources.map(({ file, topology: t }) => ({
        file,
        triangles: t.triangles,
        components: t.components.length,
        manifold: t.closedOrientedManifold,
        componentTriangles: t.components.map((c) => c.triangles),
      })),
      pairs: pairs.map(
        ({
          files,
          exactSharedTriangles,
          firstToSecond: a,
          secondToFirst: b,
        }) => ({
          files,
          exactSharedTriangles,
          medianMm: [a.medianMm, b.medianMm],
          withinQuarterMm: [
            a.thresholds[1].weightedFraction,
            b.thresholds[1].weightedFraction,
          ],
        }),
      ),
    },
    null,
    2,
  ),
);
