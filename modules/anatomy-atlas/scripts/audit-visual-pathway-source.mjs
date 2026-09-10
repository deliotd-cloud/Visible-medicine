import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Box3, Matrix4, Vector3 } from 'three';
import { loadSourceHolds } from './load-source-holds.mjs';
import { geometryFingerprint } from './anatomy-inventory.mjs';
import { cache, archiveReader, parallelMap } from './bodyparts-archive.mjs';
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
import { visualPathwayCandidates } from './visual-pathway-candidates.mjs';

// Read-only geometry investigation. --download only adds verified raw cache files.
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const { catalog, records, inventory, policy, evidence } =
  await loadSourceHolds();
assert.equal(
  catalog.structures.length,
  1022,
  'Review a changed atlas baseline',
);
const sourceFiles = visualPathwayCandidates.flatMap((g) => g.files);
assert.equal(sourceFiles.length, 4);
assert.equal(new Set(sourceFiles).size, 4);
if (process.argv.includes('--download')) {
  const zip = await archiveReader('isa');
  await parallelMap(sourceFiles, 3, (file) => zip.get(file));
}
const loaded = new Map();
async function load(tree, file, expectedHash) {
  const key = `${tree}/${file}`;
  if (!loaded.has(key)) {
    const bytes = await readFile(`${cache}/${key}.obj`);
    loaded.set(key, {
      bytes,
      sha256: hash(bytes),
      shape: sourceObjShape(bytes),
    });
  }
  const item = loaded.get(key);
  if (expectedHash)
    assert.equal(item.sha256, expectedHash, `Reference changed: ${key}`);
  return item;
}
// Include nested sources even when absent from the root aggregate (e.g. cerebral supplements).
const nested = [];
for (const family of [
  'eye-layers',
  'ventricles',
  'brainstem',
  'cerebral',
  'cardiac',
  'pulmonary',
  'hepatic',
  'renal',
]) {
  const path = `public/models/bodyparts3d/${family}/catalog.json`;
  const bytes = await readFile(path);
  const parsed = JSON.parse(bytes);
  nested.push({
    family,
    path,
    sha256: hash(bytes),
    structures: parsed.structures,
  });
}
const shapes = new Map(),
  groups = [];
for (const candidate of visualPathwayCandidates) {
  const definition = records.find(
    (r) => r.tree === candidate.tree && r.id === candidate.id,
  );
  assert.equal(definition?.name, candidate.name);
  assert.deepEqual(definition.files, candidate.files);
  policy.assertNoKnownHolds([definition]);
  const sources = [];
  for (const file of candidate.files) {
    const { bytes, shape, sha256 } = await load(candidate.tree, file);
    const fingerprint = geometryFingerprint(bytes);
    sources.push({
      file,
      bytes: bytes.length,
      sha256,
      geometrySha256: fingerprint,
      aliases: records
        .filter((r) => r.tree === candidate.tree && r.files.includes(file))
        .map((r) => ({
          id: r.id,
          name: r.name,
          fileCount: r.files.length,
          definitionSha256: hash(JSON.stringify(r)),
        })),
      directOwners: catalog.structures
        .filter(
          (s) =>
            s.sourceTree === candidate.tree &&
            s.sources.some((f) => f.file === file),
        )
        .map((s) => s.id),
      nestedOwners: nested.flatMap((n) =>
        n.structures
          .filter(
            (s) =>
              s.sourceTree === candidate.tree &&
              s.sources.some((f) => f.file === file),
          )
          .map((s) => ({ family: n.family, id: s.id })),
      ),
      exactInventoryMatches: inventory.assets
        .filter(
          (a) => a.geometrySha256 === fingerprint && a.representedBy.length,
        )
        .map((a) => ({
          tree: a.tree,
          file: a.file,
          representedBy: a.representedBy,
        })),
      topology: sourceTopology(shape),
      bounds: { min: shape.min, max: shape.max },
    });
  }
  const combined = mergeSourceShapes(
    await Promise.all(
      candidate.files.map(async (f) => (await load(candidate.tree, f)).shape),
    ),
  );
  shapes.set(candidate.id, combined);
  groups.push({
    ...candidate,
    definition,
    sources,
    bounds: { min: combined.min, max: combined.max, centre: combined.centre },
    sideCentrePass:
      candidate.side === 'right'
        ? combined.centre[0] < 0
        : candidate.side === 'left'
          ? combined.centre[0] > 0
          : combined.min[0] < 0 && combined.max[0] > 0,
    verticesOnLeft: combined.vertices.filter((v) => v[0] > 0).length,
    verticesOnRight: combined.vertices.filter((v) => v[0] < 0).length,
    combinedTopology: sourceTopology(combined),
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
const indices = new WeakMap();
function distance(a, b) {
  const points = uniqueSourceVertices(a),
    stride = Math.max(1, Math.ceil(points.length / 128));
  if (!indices.has(b)) indices.set(b, spatialDistanceIndex(b));
  return {
    totalVertices: points.length,
    stride,
    summary: distanceSummary(
      points.filter((_, i) => i % stride === 0),
      indices.get(b),
    ),
  };
}
function compare(a, b) {
  const bTriangles = sourceTriangleSet(b);
  return {
    exactSharedTriangles: [...sourceTriangleSet(a)].filter((t) =>
      bTriangles.has(t),
    ).length,
    aToB: distance(a, b),
    bToA: distance(b, a),
  };
}
const comparisons = [];
for (let i = 0; i < envelopes.length; i++) {
  const envelope = envelopes[i],
    owner = catalog.structures[i];
  const near = groups.filter((g) =>
    sourceBoundsNear(shapes.get(g.id), envelope.bounds, 1.01),
  );
  const compatible =
    owner.system === 'nerves'
      ? groups.filter((g) => shapeCandidate(shapes.get(g.id), envelope.bounds))
      : [];
  if (!near.length && !compatible.length) continue;
  const reference = mergeSourceShapes(
    await Promise.all(
      owner.sources.map(
        async (f) => (await load(owner.sourceTree, f.file, f.sha256)).shape,
      ),
    ),
  );
  for (const group of groups.filter(
    (g) => near.includes(g) || compatible.includes(g),
  )) {
    const candidate = shapes.get(group.id);
    comparisons.push({
      candidate: group.id,
      reference: owner.id,
      referenceFmaId: owner.fmaId,
      referenceSources: owner.sources,
      referenceRecordSha256: envelope.recordSha256,
      originalBoundsNear: near.includes(group),
      extentScreenMatch: compatible.includes(group),
      ...compare(candidate, reference),
      translatedDiagnostic: compatible.includes(group)
        ? compareTranslatedShape(candidate, reference)
        : null,
    });
  }
}
// A separate nested-source comparison catches anatomy added outside root ownership.
const nestedComparisons = [];
const checkedNestedSources = new Map();
for (const family of nested)
  for (const structure of family.structures)
    for (const source of structure.sources) {
      const key = `${structure.sourceTree}/${source.file}`;
      if (checkedNestedSources.has(key)) {
        assert.equal(
          checkedNestedSources.get(key),
          source.sha256,
          'Conflicting nested source hash',
        );
        continue;
      }
      checkedNestedSources.set(key, source.sha256);
      const { shape } = await load(
        structure.sourceTree,
        source.file,
        source.sha256,
      );
      for (const group of groups)
        if (sourceBoundsNear(shapes.get(group.id), shape, 1.01)) {
          nestedComparisons.push({
            candidate: group.id,
            family: family.family,
            referenceSource: key,
            referenceSha256: source.sha256,
            ...compare(shapes.get(group.id), shape),
          });
        }
    }
const candidatePairs = [];
for (let a = 0; a < groups.length; a++)
  for (let b = a + 1; b < groups.length; b++) {
    candidatePairs.push({
      a: groups[a].id,
      b: groups[b].id,
      ...compare(shapes.get(groups[a].id), shapes.get(groups[b].id)),
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
  nestedCatalogues: nested.map(({ family, path, sha256 }) => ({
    family,
    path,
    sha256,
  })),
  nestedSourceFilesScreened: checkedNestedSources.size,
  comparisons,
  nestedComparisons,
  candidatePairs,
  limitations: [
    'Source labels, manifold topology and sampled proximity do not validate anatomy or prove axonal connections.',
    'All root bounds and nested source surfaces are screened. Original-coordinate bidirectional samples are not a continuous intersection, endpoint or tractography analysis.',
    'Translated diagnostics check neural shape duplication only; no candidate is moved, repaired, smoothed or relabelled.',
    'The compound chiasm retains both source files under one identity. No optic-nerve alternative hold is lifted.',
    'No candidate is admitted; optic radiations, individual crossing fibres, functional maps and patient-specific CT/MRI registration remain absent.',
  ],
};
const output = JSON.stringify(result, null, 2) + '\n';
if (process.argv.includes('--check'))
  assert.equal(
    await readFile('docs/visual-pathway-source-audit.json', 'utf8'),
    output,
  );
else await writeFile('docs/visual-pathway-source-audit.json', output);
console.log(
  JSON.stringify({
    groups: groups.length,
    sourceFiles: sourceFiles.length,
    rootStructuresScreened: envelopes.length,
    nestedSourceFilesScreened: checkedNestedSources.size,
    comparisons: comparisons.length,
    nestedComparisons: nestedComparisons.length,
    candidatePairs: candidatePairs.length,
    topologyExceptions: groups.flatMap((g) =>
      g.sources
        .filter((s) => !s.topology.closedOrientedManifold)
        .map((s) => s.file),
    ),
    admitted: false,
  }),
);
