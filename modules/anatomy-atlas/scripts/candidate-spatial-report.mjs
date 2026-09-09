import { readFile } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { Box3, Matrix4, Vector3 } from 'three';
import { cache, archiveReader } from './bodyparts-archive.mjs';
import { loadSourceHolds } from './load-source-holds.mjs';
import { sha256, sourceKey } from './source-geometry-screen.mjs';
import {
  sourceObjShape,
  mergeSourceShapes,
  sourceBoundsNear,
  sourceTriangleSet,
} from './source-surface-audit.mjs';
import {
  spatialDistanceIndex,
  candidateContact,
  componentEndBands,
  distanceSummary,
} from './source-spatial-math.mjs';

const parentControls = [
  {
    tree: 'isa',
    id: 'FMA50088',
    name: 'right anterior choroidal artery',
    file: 'FJ1658',
    sha256: '19a51b68f4f0f58bb86302bbf3d8eb39f26158e2f7d5cd752f85b3adf94eddaf',
  },
  {
    tree: 'isa',
    id: 'FMA50089',
    name: 'left anterior choroidal artery',
    file: 'FJ1658M',
    sha256: '14087bbb463ac93b83165ac19c577188f0c4b07f89bed60e42a1197041ca7342',
  },
];
const landmarkIds = {
  FJ1319: ['FMA53550', 'FMA12515', 'FMA82735'],
  FJ1370: ['FMA53549', 'FMA12514', 'FMA82734'],
  FJ1674: ['FMA50088', 'FMA3949'],
  FJ1674M: ['FMA50089', 'FMA4062'],
};

export async function candidateSpatialReport({ fetchSources = false } = {}) {
  const context = await loadSourceHolds(),
    { inventory, catalog, evidence, policy } = context;
  const prepBytes = await readFile('content/source-geometry-screen.json'),
    prep = JSON.parse(prepBytes);
  assert.equal(
    sha256(prepBytes),
    '80a31dc88bc8e85561e5f3702b7697485ea547a4a85c7b3264ceb24291c66cd7',
  );
  assert.deepEqual(prep.evidence, evidence, 'Source preparation is stale');
  const archives = new Map();
  async function sourceBytes(tree, file) {
    if (!fetchSources) return readFile(path.join(cache, tree, file + '.obj'));
    if (!archives.has(tree))
      archives.set(
        tree,
        (async () => {
          const pinned = inventory.archives.find((a) => a.tree === tree);
          const archive = await archiveReader(tree, pinned.url);
          const entries = [...archive.entries]
            .filter(([name]) => name.endsWith('.obj'))
            .sort(([a], [b]) => a.localeCompare(b));
          assert.equal(
            entries.length,
            pinned.entryCount,
            'Archive entry count changed',
          );
          assert.equal(
            sha256(JSON.stringify(entries)),
            pinned.directorySha256,
            'Archive directory changed',
          );
          return archive;
        })(),
      );
    return (await archives.get(tree)).get(file);
  }
  const readShape = async (tree, sources) => {
    const parts = [];
    for (const file of sources) {
      assert(['isa', 'partof'].includes(tree) && /^FJ\d+M?$/.test(file.file));
      const bytes = await sourceBytes(tree, file.file);
      assert.equal(
        sha256(bytes),
        file.sha256,
        'Source bytes changed: ' + tree + '/' + file.file,
      );
      parts.push(sourceObjShape(bytes));
    }
    return mergeSourceShapes(parts);
  };
  const candidates = await Promise.all(
    prep.files
      .filter((f) => f.candidateFor.length)
      .map(async (file) => ({
        file,
        shape: await readShape(file.tree, [file]),
      })),
  );
  const inverse = new Matrix4()
    .fromArray(catalog.coordinateSystem.sourceToSceneColumnMajor)
    .invert();
  const coarseMarginMm = 2.01,
    sourceMarginMm = 2;
  const nearby = [],
    allScreened = [];
  for (const s of catalog.structures) {
    const box = new Box3(
      new Vector3(...s.bounds.min),
      new Vector3(...s.bounds.max),
    ).applyMatrix4(inverse);
    const bounds = { min: box.min.toArray(), max: box.max.toArray() };
    const coarse = candidates
      .filter(
        (c) =>
          sourceBoundsNear(c.file.bounds, bounds, coarseMarginMm) ||
          landmarkIds[c.file.file].includes(s.fmaId),
      )
      .map((c) => c.file.file);
    allScreened.push({ id: s.id, coarseCandidates: coarse });
    if (!coarse.length) continue;
    nearby.push({
      key: s.id,
      fmaId: s.fmaId,
      name: s.sourceName,
      role: 'displayed',
      tree: s.sourceTree,
      sources: s.sources,
      shape: await readShape(s.sourceTree, s.sources),
      coarse,
    });
  }
  for (const f of prep.files.filter((f) => f.heldBy.length)) {
    const coarse = candidates
      .filter((c) => sourceBoundsNear(c.file.bounds, f.bounds, sourceMarginMm))
      .map((c) => c.file.file);
    if (coarse.length)
      nearby.push({
        key: sourceKey(f),
        fmaId: null,
        name: 'Held source component ' + f.file,
        heldBy: f.heldBy,
        role: 'held',
        tree: f.tree,
        sources: [{ file: f.file, sha256: f.sha256 }],
        shape: await readShape(f.tree, [f]),
        coarse,
      });
  }
  for (const parent of parentControls) {
    const definition = inventory.records.find(
      (r) => r.tree === parent.tree && r.id === parent.id,
    );
    assert.equal(definition.name, parent.name);
    assert.deepEqual(definition.files, [parent.file]);
    policy.assertNoKnownHolds([definition]);
    nearby.push({
      key: parent.tree + '/' + parent.id,
      fmaId: parent.id,
      name: parent.name,
      role: 'unadmitted-parent-control',
      tree: parent.tree,
      sources: [{ file: parent.file, sha256: parent.sha256 }],
      shape: await readShape(parent.tree, [parent]),
      coarse: candidates
        .filter((c) => landmarkIds[c.file.file].includes(parent.id))
        .map((c) => c.file.file),
    });
  }
  const comparisons = [],
    pruned = [],
    endpointProbes = [];
  for (const target of nearby) {
    let nearest;
    for (const candidate of candidates.filter((c) =>
      target.coarse.includes(c.file.file),
    )) {
      const landmark = landmarkIds[candidate.file.file].includes(target.fmaId);
      if (
        !landmark &&
        !sourceBoundsNear(candidate.shape, target.shape, sourceMarginMm)
      ) {
        pruned.push({ file: candidate.file.file, target: target.key });
        continue;
      }
      nearest ??= spatialDistanceIndex(target.shape);
      const cSet = sourceTriangleSet(candidate.shape),
        tSet = sourceTriangleSet(target.shape);
      const contact = candidateContact(candidate.shape, target.shape, nearest);
      const exactSharedTriangles = [...cSet].filter((t) => tSet.has(t)).length;
      const broadNearContact = [
        contact.candidateVertices,
        contact.candidateTriangleCentroids,
        contact.targetVertexSamples,
      ].some((d) => d.thresholds[1].weightedFraction >= 0.25);
      comparisons.push({
        file: candidate.file.file,
        target: target.key,
        fmaId: target.fmaId,
        name: target.name,
        role: target.role,
        landmark,
        exactSharedTriangles,
        broadNearContact,
        ...contact,
      });
      if (landmark)
        endpointProbes.push({
          file: candidate.file.file,
          target: target.key,
          fmaId: target.fmaId,
          name: target.name,
          components: componentEndBands(candidate.shape).map(
            ({ low, high, ...component }) => ({
              ...component,
              low: distanceSummary(low, nearest),
              high: distanceSummary(high, nearest),
            }),
          ),
        });
    }
  }
  return {
    schemaVersion: 1,
    evidence,
    preparationSha256: sha256(prepBytes),
    license: prep.license,
    credit: prep.credit,
    licenseUrl: prep.licenseUrl,
    algorithmSha256: sha256(
      (
        await readFile(
          new URL('./source-spatial-math.mjs', import.meta.url),
          'utf8',
        )
      ).replaceAll('\r\n', '\n'),
    ),
    coarseMarginMm,
    sourceMarginMm,
    summary: {
      displayedDefinitionsScreened: catalog.structures.length,
      candidateFiles: candidates.length,
      heldFilesBoundsScreened: prep.files.filter((f) => f.heldBy.length).length,
      loadedControls: nearby.length,
      comparedPairs: comparisons.length,
      rawBoundsPrunedPairs: pruned.length,
      endpointProbePairs: endpointProbes.length,
      broadNearContactPairs: comparisons.filter((c) => c.broadNearContact)
        .length,
      exactSharedTrianglePairs: comparisons.filter(
        (c) => c.exactSharedTriangles,
      ).length,
      admissions: 0,
    },
    candidateSources: candidates.map((c) => ({
      tree: c.file.tree,
      file: c.file.file,
      sha256: c.file.sha256,
    })),
    controls: nearby.map(({ shape, ...target }) => ({
      ...target,
      bounds: { min: shape.min, max: shape.max },
      vertices: shape.vertices.length,
      triangles: shape.faces.length,
      degenerateTriangles: shape.triangles.filter((t) => t.degenerate).length,
    })),
    allScreened,
    pruned,
    comparisons,
    endpointProbes,
    sourceGeometryChanged: false,
    clinicalValidation: false,
    limitations: [
      'All displayed definitions receive conservative transformed-box screening; only boxes within 2.01 mm or explicitly selected landmarks are loaded. Raw boxes then use 2 mm. All 48 held files receive raw-box screening, not distant translated-shape matching.',
      'Every candidate unique vertex and triangle centroid is compared to target triangles. Reverse direction samples at most 128 target vertices. Area-weighted centroids are quadrature, not exact contact area.',
      'Degenerate target triangles contribute their original edges and points; no mesh repair or discarded geometry. Distances are unsigned and cannot distinguish contact, penetration, enclosing tissue, duplication or a surgical plane.',
      'Component end bands are extrema on each component longest source axis, up to 1 mm wide; they are inspection samples, not anatomical terminals. Touching a ganglion/globe/artery does not prove fibre, wall or lumen continuity.',
      'The two anterior choroidal artery controls are licensed source-only context, not admitted atlas geometry. No complete artery, blood-supply territory or patient registration is inferred.',
      'No source surface is moved, split for admission, relabelled or admitted. Expert identity, endpoint, extent and clinical review remain required.',
    ],
  };
}
