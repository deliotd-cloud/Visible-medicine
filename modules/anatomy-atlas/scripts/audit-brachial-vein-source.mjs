import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Box3, Matrix4, Vector3 } from 'three';
import { loadSourceHolds } from './load-source-holds.mjs';
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
import { brachialVeinSources } from './brachial-vein-sources.mjs';
const hash = (b) => createHash('sha256').update(b).digest('hex');
const { catalog, inventory, records, policy, evidence } =
  await loadSourceHolds();
async function shape(tree, file, sha) {
  const bytes = await readFile(`../work/bodyparts3d/${tree}/${file}.obj`);
  assert.equal(hash(bytes), sha);
  return sourceObjShape(bytes);
}
const shapes = new Map(),
  groups = [];
for (const candidate of brachialVeinSources) {
  const definition = records.find(
    (r) => r.tree === 'isa' && r.id === candidate.id,
  );
  assert.equal(definition.name, candidate.name);
  assert.deepEqual(definition.files, [candidate.file]);
  policy.assertNoKnownHolds([definition]);
  const bytes = await readFile(`../work/bodyparts3d/isa/${candidate.file}.obj`);
  assert.equal(hash(bytes), candidate.sha256);
  const s = sourceObjShape(bytes),
    topology = sourceTopology(s),
    fingerprint = geometryFingerprint(bytes);
  assert(topology.closedOrientedManifold);
  assert.equal(topology.components.length, 1);
  assert(
    s.vertices.every((p) => (candidate.side === 'right' ? p[0] < 0 : p[0] > 0)),
  );
  shapes.set(candidate.id, s);
  groups.push({
    ...candidate,
    tree: 'isa',
    bytes: bytes.length,
    definition,
    geometrySha256: fingerprint,
    topology,
    directOwners: catalog.structures
      .filter(
        (s) =>
          s.sourceTree === 'isa' &&
          s.sources.some((f) => f.file === candidate.file),
      )
      .map((s) => s.id),
    exactInventoryMatches: inventory.assets.filter(
      (a) => a.geometrySha256 === fingerprint && a.representedBy.length,
    ),
    holdScreen: policy.inspect(definition),
  });
}
const inverse = new Matrix4()
  .fromArray(catalog.coordinateSystem.sourceToSceneColumnMajor)
  .invert();
const screened = [],
  comparisons = [];
const nearest = new Map(
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
  const reference = mergeSourceShapes(
    await Promise.all(
      owner.sources.map((f) => shape(owner.sourceTree, f.file, f.sha256)),
    ),
  );
  const refNearest = spatialDistanceIndex(reference),
    refTriangles = sourceTriangleSet(reference);
  for (const g of candidates) {
    const candidate = shapes.get(g.id);
    comparisons.push({
      candidate: g.id,
      reference: owner.id,
      referenceFma: owner.fmaId,
      referenceSources: owner.sources,
      exactSharedTriangles: [...sourceTriangleSet(candidate)].filter((t) =>
        refTriangles.has(t),
      ).length,
      candidateToReference: distanceSummary(samples(candidate), refNearest),
      referenceToCandidate: distanceSummary(
        samples(reference),
        nearest.get(g.id),
      ),
      translatedDiagnostic:
        owner.system === 'vessels' && shapeCandidate(candidate, reference)
          ? compareTranslatedShape(candidate, reference)
          : null,
    });
  }
}
assert(
  groups.every(
    (g) => !g.directOwners.length && !g.exactInventoryMatches.length,
  ),
);
assert(
  comparisons.every(
    (c) => !c.exactSharedTriangles && !c.translatedDiagnostic?.similar,
  ),
);
const result = {
  schemaVersion: 1,
  sourceCommit: '9b1de740f5091efc4b4a6c6240d516499cd8d4ee',
  evidence,
  license: catalog.license,
  credit: catalog.credit,
  coordinateSystem: catalog.coordinateSystem,
  sourceArchive:
    'https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/isa_BP3D_4.0_obj_99.zip',
  licenseUrl: 'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html',
  groups,
  screened,
  comparisons,
  geometryModified: false,
  clinicalApproval: false,
  limitations: [
    'Two source-labelled medial veins, not all brachial companion veins or a measured lumen.',
    'Topology and bounded distances do not prove absence of self-intersection or clinical correctness. No donor junction or vessel centreline inferred.',
    'No fitting, mirroring, smoothing, bridge or face removal. Archive CRC and size checked on retrieval; exact source hashes retained.',
  ],
};
const output = JSON.stringify(result, null, 2) + '\n',
  path = 'docs/brachial-vein-source-audit.json';
if (process.argv.includes('--check'))
  assert.equal((await readFile(path, 'utf8')).replace(/\r\n/g, '\n'), output);
else await writeFile(path, output, { flag: 'wx' });
console.log(
  JSON.stringify({
    groups: groups.length,
    rootEnvelopes: screened.length,
    comparisons: comparisons.length,
    triangles: groups.reduce((n, g) => n + g.topology.triangles, 0),
    closest: comparisons
      .filter((c) =>
        /FMA2269[12]|FMA1333[01]|FMA229(09|10)|FMA2313[01]/.test(
          c.referenceFma,
        ),
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
