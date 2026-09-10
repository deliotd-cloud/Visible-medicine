import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Box3, Matrix4, Vector3 } from 'three';
import { loadSourceHolds } from './load-source-holds.mjs';
import { geometryFingerprint } from './anatomy-inventory.mjs';
import {
  sourceObjShape,
  mergeSourceShapes,
  sourceTriangleSet,
  sourceBoundsNear,
} from './source-surface-audit.mjs';
import { sourceTopology } from './source-topology.mjs';
import {
  spatialDistanceIndex,
  uniqueSourceVertices,
  distanceSummary,
} from './source-spatial-math.mjs';
import {
  shapeCandidate,
  compareTranslatedShape,
} from './vessel-shape-math.mjs';
import { cache, archiveReader, parallelMap } from './bodyparts-archive.mjs';
import { renalVascularCandidates } from './renal-vascular-candidates.mjs';

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const { catalog, records, inventory, policy, evidence } =
  await loadSourceHolds();
const files = renalVascularCandidates.flatMap((g) =>
  g.files.map((file) => ({ tree: g.tree, file })),
);
assert.equal(files.length, 13);
assert.equal(new Set(files.map((f) => `${f.tree}/${f.file}`)).size, 13);
if (process.argv.includes('--download')) {
  for (const tree of ['isa', 'partof']) {
    const archive = await archiveReader(tree);
    await parallelMap(
      files.filter((f) => f.tree === tree),
      3,
      (f) => archive.get(f.file),
    );
  }
}
const shapes = new Map();
const loadShape = async (tree, file, expectedHash) => {
  const key = `${tree}/${file}`;
  if (!shapes.has(key)) {
    const bytes = await readFile(`${cache}/${key}.obj`);
    shapes.set(key, {
      shape: sourceObjShape(bytes),
      bytes,
      sha256: hash(bytes),
    });
  }
  const found = shapes.get(key);
  if (expectedHash)
    assert.equal(found.sha256, expectedHash, `Changed reference source ${key}`);
  return found;
};
const candidateShapes = new Map();
const groups = [];
for (const candidate of renalVascularCandidates) {
  const definition = records.find(
    (r) => r.tree === candidate.tree && r.id === candidate.id,
  );
  assert.equal(definition?.name, candidate.name);
  assert.deepEqual(definition.files, candidate.files);
  policy.assertNoKnownHolds([definition]);
  const sources = [];
  for (const file of candidate.files) {
    const { shape, bytes, sha256 } = await loadShape(candidate.tree, file);
    const fingerprint = geometryFingerprint(bytes);
    const sourceAliases = records.filter(
      (r) => r.tree === candidate.tree && r.files.includes(file),
    );
    const directOwners = catalog.structures.filter(
      (s) =>
        s.sourceTree === candidate.tree &&
        s.sources.some((f) => f.file === file),
    );
    const sameFilenameOtherTree = catalog.structures.filter(
      (s) =>
        s.sourceTree !== candidate.tree &&
        s.sources.some((f) => f.file === file),
    );
    sources.push({
      file,
      sha256,
      bytes: bytes.length,
      geometrySha256: fingerprint,
      aliases: sourceAliases.map((r) => ({
        id: r.id,
        name: r.name,
        sourceFileCount: r.files.length,
        candidateFile: file,
        definitionSha256: hash(JSON.stringify(r)),
      })),
      directOwners: directOwners.map((s) => s.id),
      sameFilenameOtherTree: sameFilenameOtherTree.map((s) => s.id),
      exactInventoryMatches: inventory.assets
        .filter(
          (a) => a.geometrySha256 === fingerprint && a.representedBy.length,
        )
        .map((a) => ({
          tree: a.tree,
          file: a.file,
          representedBy: a.representedBy,
        })),
      bounds: { min: shape.min, max: shape.max },
      topology: sourceTopology(shape),
    });
  }
  const combined = mergeSourceShapes(
    await Promise.all(
      candidate.files.map(
        async (f) => (await loadShape(candidate.tree, f)).shape,
      ),
    ),
  );
  candidateShapes.set(candidate.id, combined);
  groups.push({
    ...candidate,
    definition,
    sources,
    bounds: { min: combined.min, max: combined.max },
    sideCentrePass:
      candidate.side === 'right'
        ? combined.centre[0] < 0
        : combined.centre[0] > 0,
    verticesCrossingMidline: combined.vertices.filter((v) =>
      candidate.side === 'right' ? v[0] >= 0 : v[0] <= 0,
    ).length,
    holdScreen: policy.inspect(definition),
    admitted: false,
  });
}

const inverse = new Matrix4()
  .fromArray(catalog.coordinateSystem.sourceToSceneColumnMajor)
  .invert();
const envelopes = catalog.structures.map((s) => {
  const b = new Box3(
    new Vector3(...s.bounds.min),
    new Vector3(...s.bounds.max),
  ).applyMatrix4(inverse);
  return {
    id: s.id,
    fmaId: s.fmaId,
    bounds: {
      min: b.min.toArray(),
      max: b.max.toArray(),
      extent: b.getSize(new Vector3()).toArray(),
    },
    recordSha256: hash(JSON.stringify(s)),
  };
});
const samples = (shape) => {
  const points = uniqueSourceVertices(shape),
    stride = Math.max(1, Math.ceil(points.length / 128));
  return {
    points: points.filter((_, i) => i % stride === 0),
    total: points.length,
    stride,
  };
};
const nearestCache = new WeakMap();
const nearest = (shape) => {
  if (!nearestCache.has(shape))
    nearestCache.set(shape, spatialDistanceIndex(shape));
  return nearestCache.get(shape);
};
const distance = (a, b) => {
  const selected = samples(a);
  return {
    totalVertices: selected.total,
    stride: selected.stride,
    summary: distanceSummary(selected.points, nearest(b)),
  };
};
const comparisons = [];
for (const envelope of envelopes) {
  const owner = catalog.structures.find((s) => s.id === envelope.id);
  const near = groups.filter((g) =>
    sourceBoundsNear(candidateShapes.get(g.id), envelope.bounds, 1.01),
  );
  const translated =
    owner.system === 'vessels'
      ? groups.filter(
          (g) =>
            (owner.laterality === g.side ||
              !['left', 'right'].includes(owner.laterality)) &&
            shapeCandidate(candidateShapes.get(g.id), envelope.bounds),
        )
      : [];
  if (!near.length && !translated.length) continue;
  const combined = mergeSourceShapes(
    await Promise.all(
      owner.sources.map(
        async (f) =>
          (await loadShape(owner.sourceTree, f.file, f.sha256)).shape,
      ),
    ),
  );
  const triangles = sourceTriangleSet(combined);
  for (const group of groups.filter(
    (g) => near.includes(g) || translated.includes(g),
  )) {
    const candidate = candidateShapes.get(group.id);
    comparisons.push({
      candidate: group.id,
      reference: owner.id,
      referenceFmaId: owner.fmaId,
      referenceRecordSha256: envelope.recordSha256,
      referenceSources: owner.sources,
      originalBoundsNear: near.includes(group),
      extentScreenMatch: translated.includes(group),
      exactSharedTriangles: [...sourceTriangleSet(candidate)].filter((t) =>
        triangles.has(t),
      ).length,
      candidateToReference: distance(candidate, combined),
      referenceToCandidate: distance(combined, candidate),
      translatedDiagnostic: translated.includes(group)
        ? compareTranslatedShape(candidate, combined)
        : null,
    });
  }
}
// Compare candidate groups with each other, including differently named types.
const candidatePairs = [];
for (let a = 0; a < groups.length; a++)
  for (let b = a + 1; b < groups.length; b++) {
    const x = candidateShapes.get(groups[a].id),
      y = candidateShapes.get(groups[b].id);
    const yTriangles = sourceTriangleSet(y);
    candidatePairs.push({
      a: groups[a].id,
      b: groups[b].id,
      aToB: distance(x, y),
      bToA: distance(y, x),
      exactSharedTriangles: [...sourceTriangleSet(x)].filter((t) =>
        yTriangles.has(t),
      ).length,
    });
  }
const result = {
  schemaVersion: 1,
  evidence,
  license: catalog.license,
  credit: catalog.credit,
  coordinateSystem: catalog.coordinateSystem,
  sourceArchives: catalog.sources,
  groups,
  rootEnvelopeScreen: envelopes,
  comparisons,
  candidatePairs,
  limitations: [
    'A label and a clean manifold are not clinical validation, source acquisition provenance or permission to render a new structure.',
    'Global catalogue bounds are screened; near and extent-compatible references receive original-coordinate bidirectional surface samples. Sampling is not a continuous intersection or endpoint-connectivity proof.',
    'Translated comparisons diagnose duplicate shape only. No source is moved, aligned, repaired, relabelled or exported by this audit.',
    'Midline crossing may be normal for a named side-specific vessel; centre-side and crossing counts are diagnostics, not independent side assignment.',
    'No candidate is admitted. Parent arteries must not be double-rendered with overlapping alternative trunks; internal renal tissue and clinical scan registration remain absent.',
  ],
};
const output = JSON.stringify(result, null, 2) + '\n';
if (process.argv.includes('--check'))
  assert.equal(
    await readFile('docs/renal-vascular-source-audit.json', 'utf8'),
    output,
  );
else await writeFile('docs/renal-vascular-source-audit.json', output);
console.log(
  JSON.stringify({
    groups: groups.length,
    sourceFiles: files.length,
    rootStructuresScreened: envelopes.length,
    spatialComparisons: comparisons.length,
    candidatePairs: candidatePairs.length,
    topologyExceptions: groups.flatMap((g) =>
      g.sources
        .filter((s) => !s.topology.closedOrientedManifold)
        .map((s) => `${g.tree}/${s.file}`),
    ),
    admitted: false,
  }),
);
