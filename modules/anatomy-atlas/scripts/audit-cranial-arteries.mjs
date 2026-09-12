import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Box3, Matrix4, Vector3 } from 'three';
import { loadCurrentSourceHolds } from './current-source-holds.mjs';
import { geometryFingerprint } from './anatomy-inventory.mjs';
import {
  sourceObjShape,
  mergeSourceShapes,
  sourceBoundsNear,
  sourceTriangleSet,
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
import { cranialArterySources } from './cranial-artery-sources.mjs';
import { build } from './workspace-test-build.mjs';
const hash = (b) => createHash('sha256').update(b).digest('hex');
const {
  catalog: raw,
  inventory,
  records,
  policy,
  evidence,
  supplementalEvidence,
} = await loadCurrentSourceHolds();
const compiled = await build({
  stdin: {
    contents: "export {bodyDisplayCatalog} from './lib/body-display-catalog'",
    resolveDir: process.cwd(),
    loader: 'ts',
  },
  bundle: true,
  write: false,
  platform: 'node',
  format: 'esm',
});
const { bodyDisplayCatalog } = await import(
  'data:text/javascript;base64,' +
    Buffer.from(compiled.outputFiles[0].text).toString('base64')
);
const display = bodyDisplayCatalog(raw);
// Preserve this admission's pre-extension source scope when replayed later.
const catalog = {
  ...display,
  structures: display.structures.filter((s) => !['cranial-arteries', 'elbow-arteries'].includes(s.bundle)),
  bundles: display.bundles.filter((b) => !['cranial-arteries', 'elbow-arteries'].includes(b.id)),
};
assert.equal(catalog.structures.length, 1082);
const shapeCache = new Map();
async function shape(tree, file, sha) {
  const key = tree + '/' + file;
  if (!shapeCache.has(key)) {
    const bytes = await readFile(`../work/bodyparts3d/${tree}/${file}.obj`);
    assert.equal(hash(bytes), sha);
    shapeCache.set(key, sourceObjShape(bytes));
  }
  return shapeCache.get(key);
}
const shapes = new Map(),
  groups = [];
for (const candidate of cranialArterySources) {
  const definition = records.find(
    (r) => r.tree === candidate.tree && r.id === candidate.id,
  );
  assert.equal(definition.name, candidate.name);
  assert.deepEqual(
    definition.files,
    candidate.files.map((f) => f.file),
  );
  policy.assertNoKnownHolds([definition]);
  const parts = await Promise.all(
    candidate.files.map((f) => shape(candidate.tree, f.file, f.sha256)),
  );
  const merged = mergeSourceShapes(parts),
    topology = sourceTopology(merged);
  assert(topology.closedOrientedManifold);
  assert.equal(topology.components.length, candidate.components);
  assert.equal(topology.triangles, candidate.triangles);
  shapes.set(candidate.id, merged);
  const sourceFingerprints = await Promise.all(
    candidate.files.map(async (f) =>
      geometryFingerprint(
        await readFile(`../work/bodyparts3d/${candidate.tree}/${f.file}.obj`),
      ),
    ),
  );
  groups.push({
    ...candidate,
    definition,
    topology,
    bounds: { min: merged.min, max: merged.max },
    sideEvidence: {
      negativeXVertices: merged.vertices.filter((p) => p[0] < 0).length,
      positiveXVertices: merged.vertices.filter((p) => p[0] > 0).length,
      midlineVertices: merged.vertices.filter((p) => p[0] === 0).length,
    },
    directOwners: catalog.structures
      .filter(
        (s) =>
          s.sourceTree === candidate.tree &&
          s.sources.some((f) => candidate.files.some((c) => c.file === f.file)),
      )
      .map((s) => s.id),
    exactInventoryMatches: inventory.assets.filter(
      (a) =>
        sourceFingerprints.includes(a.geometrySha256) && a.representedBy.length,
    ),
    holdScreen: policy.inspect(definition),
  });
}
const inverse = new Matrix4()
  .fromArray(catalog.coordinateSystem.sourceToSceneColumnMajor)
  .invert();
const screened = [],
  comparisons = [];
const indexes = new Map(
  [...shapes].map(([id, s]) => [id, spatialDistanceIndex(s)]),
);
const samples = (s) => {
  const p = uniqueSourceVertices(s),
    stride = Math.max(1, Math.ceil(p.length / 128));
  return p.filter((_, i) => i % stride === 0);
};
for (const owner of catalog.structures) {
  const box = new Box3(
    new Vector3(...owner.bounds.min),
    new Vector3(...owner.bounds.max),
  ).applyMatrix4(inverse);
  const bounds = {
    min: box.min.toArray(),
    max: box.max.toArray(),
    extent: box.getSize(new Vector3()).toArray(),
  };
  const candidates = groups.filter(
    (g) =>
      sourceBoundsNear(shapes.get(g.id), bounds, 1.01) ||
      (owner.system === 'vessels' && shapeCandidate(shapes.get(g.id), bounds)),
  );
  screened.push({
    id: owner.id,
    recordSha256: hash(JSON.stringify(owner)),
    candidateIds: candidates.map((g) => g.id),
  });
  if (!candidates.length) continue;
  const ref = mergeSourceShapes(
    await Promise.all(
      owner.sources.map((f) => shape(owner.sourceTree, f.file, f.sha256)),
    ),
  );
  const refIndex = spatialDistanceIndex(ref),
    triangles = sourceTriangleSet(ref);
  for (const g of candidates) {
    const s = shapes.get(g.id);
    comparisons.push({
      candidate: g.id,
      reference: owner.id,
      referenceFma: owner.fmaId,
      exactSharedTriangles: [...sourceTriangleSet(s)].filter((t) =>
        triangles.has(t),
      ).length,
      candidateToReference: distanceSummary(samples(s), refIndex),
      referenceToCandidate: distanceSummary(samples(ref), indexes.get(g.id)),
      translatedDiagnostic:
        owner.system === 'vessels' && shapeCandidate(s, ref)
          ? compareTranslatedShape(s, ref)
          : null,
    });
  }
}
const pairChecks = [];
for (let i = 0; i < groups.length; i++)
  for (let j = i + 1; j < groups.length; j++) {
    const a = shapes.get(groups[i].id),
      b = shapes.get(groups[j].id),
      triangles = sourceTriangleSet(b);
    pairChecks.push({
      a: groups[i].id,
      b: groups[j].id,
      sharedTriangles: [...sourceTriangleSet(a)].filter((t) => triangles.has(t))
        .length,
      aToB: distanceSummary(samples(a), indexes.get(groups[j].id)),
      bToA: distanceSummary(samples(b), indexes.get(groups[i].id)),
      translatedDiagnostic: shapeCandidate(a, b)
        ? compareTranslatedShape(a, b)
        : null,
    });
  }
const conflicts = groups
  .filter((g) => g.directOwners.length || g.exactInventoryMatches.length)
  .map((g) => g.id);
const overlaps = comparisons.filter(
  (c) => c.exactSharedTriangles || c.translatedDiagnostic?.similar,
);
const result = {
  schemaVersion: 1,
  sourceCommit: 'be55e151f88af644ac6e51ac8430281146e9557d',
  evidence,
  supplementalEvidence,
  license: catalog.license,
  credit: catalog.credit,
  coordinateSystem: catalog.coordinateSystem,
  archives: inventory.archives,
  licenseUrl: 'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html',
  groups,
  screened,
  comparisons,
  pairChecks,
  conflicts,
  overlaps,
  geometryModified: false,
  clinicalApproval: false,
  limitations: [
    'PICA sources have thirteen files and fourteen components each; right MCA has three files and six components. These are not continuous lumens or complete arterial territories.',
    'Superior cerebellar source names determine laterality; a small proximal part crosses source X=0. No mesh is reflected or moved to enforce a side.',
    'AICA has a bilateral parent-only definition; retained offline until side-aware source-part identity is supported without inventing distinct FMA labels.',
    'No matching left MCA definition is provided by the pinned source tables. No mirrored counterpart is generated.',
    'Topology, sampled distances and translated-shape screens do not prove self-intersection freedom, anatomical accuracy, patent junctions or clinical validity.',
  ],
};
const output = JSON.stringify(result, null, 2) + '\n',
  path = 'docs/cranial-artery-source-audit.json';
if (process.argv.includes('--check'))
  assert.equal((await readFile(path, 'utf8')).replace(/\r\n/g, '\n'), output);
else await writeFile(path, output, { flag: 'wx' });
console.log(
  JSON.stringify({
    groups: groups.length,
    rootEnvelopes: screened.length,
    comparisons: comparisons.length,
    pairChecks: pairChecks.length,
    conflicts,
    overlaps,
    closest: comparisons
      .filter((c) =>
        [
          'FMA50542',
          'FMA3958',
          'FMA4066',
          'FMA3949',
          'FMA4062',
          'FMA50584',
          'FMA50585',
        ].includes(c.referenceFma),
      )
      .map((c) => ({
        candidate: c.candidate,
        to: c.referenceFma,
        min: c.candidateToReference.minMm,
        median: c.candidateToReference.medianMm,
      })),
    auditSha256: hash(output),
    clinicalApproval: false,
  }),
);
