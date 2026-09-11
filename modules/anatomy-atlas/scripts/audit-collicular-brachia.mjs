import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
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
import { collicularBrachiaSources } from './collicular-brachia-sources.mjs';

const hash = (b) => createHash('sha256').update(b).digest('hex');
const h = await loadSourceHolds(),
  check = process.argv.includes('--check');
const brainBytes = await readFile(
  'public/models/bodyparts3d/brainstem/catalog.json',
);
const brain = JSON.parse(brainBytes),
  shapes = new Map(),
  groups = [];
assert.equal(
  h.catalog.coordinateSystem.source,
  'mm, X left / Y posterior / Z superior',
);
const directory = 'content/sources/collicular-brachia';
if (!check) await mkdir(directory, { recursive: true });
for (const candidate of collicularBrachiaSources) {
  const bytes = await readFile(
    check
      ? `${directory}/${candidate.file}.obj`
      : `../work/bodyparts3d/isa/${candidate.file}.obj`,
  );
  assert.equal(hash(bytes), candidate.sha256);
  const archived = h.inventory.assets.find(
    (a) => a.tree === 'isa' && a.file === candidate.file,
  );
  assert.equal(bytes.length, archived.bytes);
  const definition = h.records.find(
    (r) => r.tree === 'isa' && r.id === candidate.id,
  );
  assert.equal(definition.name, candidate.name);
  assert.deepEqual(definition.files, [candidate.file]);
  h.policy.assertNoKnownHolds([definition]);
  const shape = sourceObjShape(bytes),
    topology = sourceTopology(shape);
  assert(topology.closedOrientedManifold && topology.components.length === 1);
  const coordinateSide =
    shape.min[0] > 0 ? 'left' : shape.max[0] < 0 ? 'right' : 'crosses-midline';
  assert.equal(
    coordinateSide === candidate.side,
    candidate.status === 'candidate',
  );
  const fingerprint = geometryFingerprint(bytes);
  const exactOwners = h.inventory.assets
    .filter((a) => a.geometrySha256 === fingerprint && a.representedBy.length)
    .map((a) => ({
      tree: a.tree,
      file: a.file,
      representedBy: a.representedBy,
    }));
  assert.equal(exactOwners.length, 0);
  const directOwners = [...h.catalog.structures, ...brain.structures]
    .filter((s) => s.sources.some((f) => f.file === candidate.file))
    .map((s) => s.id);
  assert.equal(directOwners.length, 0);
  groups.push({
    ...candidate,
    definition,
    bytes: bytes.length,
    geometrySha256: fingerprint,
    coordinateSide,
    sourceBounds: { min: shape.min, max: shape.max },
    topology,
    directOwners,
    exactOwners,
    clinicalApproval: false,
  });
  shapes.set(candidate.id, shape);
  if (!check) {
    try {
      assert.deepEqual(
        await readFile(`${directory}/${candidate.file}.obj`),
        bytes,
      );
    } catch (e) {
      if (e.code !== 'ENOENT') throw e;
      await writeFile(`${directory}/${candidate.file}.obj`, bytes, {
        flag: 'wx',
      });
    }
  }
}
const inverse = new Matrix4()
  .fromArray(h.catalog.coordinateSystem.sourceToSceneColumnMajor)
  .invert();
const owners = [
  ...h.catalog.structures.filter((s) => s.system === 'nerves'),
  ...brain.structures,
];
const screened = [],
  comparisons = [];
const samples = (shape) => {
  const points = uniqueSourceVertices(shape),
    stride = Math.max(1, Math.ceil(points.length / 128));
  return points.filter((_, i) => i % stride === 0);
};
const indexes = new Map(
  [...shapes].map(([id, s]) => [id, spatialDistanceIndex(s)]),
);
for (const owner of owners) {
  const box = new Box3(
    new Vector3(...owner.bounds.min),
    new Vector3(...owner.bounds.max),
  ).applyMatrix4(inverse);
  const nearby = groups.filter((g) =>
    sourceBoundsNear(
      shapes.get(g.id),
      { min: box.min.toArray(), max: box.max.toArray() },
      2,
    ),
  );
  screened.push({
    id: owner.id,
    recordSha256: hash(JSON.stringify(owner)),
    nearby: nearby.map((g) => g.id),
  });
  if (!nearby.length) continue;
  const parts = [];
  for (const source of owner.sources) {
    const bytes = await readFile(
      `../work/bodyparts3d/${owner.sourceTree}/${source.file}.obj`,
    );
    assert.equal(hash(bytes), source.sha256);
    parts.push(sourceObjShape(bytes));
  }
  const shape = mergeSourceShapes(parts),
    index = spatialDistanceIndex(shape),
    triangles = sourceTriangleSet(shape);
  for (const g of nearby)
    comparisons.push({
      candidate: g.id,
      reference: owner.fmaId,
      referenceId: owner.id,
      referenceSources: owner.sources,
      exactSharedTriangles: [...sourceTriangleSet(shapes.get(g.id))].filter(
        (t) => triangles.has(t),
      ).length,
      toReference: distanceSummary(samples(shapes.get(g.id)), index),
      fromReference: distanceSummary(samples(shape), indexes.get(g.id)),
    });
}
assert(
  comparisons.every((c) => c.exactSharedTriangles === 0),
  'Do not duplicate existing source triangles',
);
for (const candidate of groups.filter((g) => g.status === 'candidate'))
  assert(
    comparisons.some(
      (c) => c.candidate === candidate.id && c.reference === 'FMA61993',
    ),
    'Midbrain relationship must be screened',
  );
const result = {
  schemaVersion: 1,
  scope:
    'Four source-labelled collicular brachia: laterality, topology and existing neural-surface relationships. No repair, clinical approval or tractography.',
  evidence: h.evidence,
  brainstemCatalogSha256: hash(brainBytes),
  groups,
  screened,
  comparisons,
  limitations: [
    'Small source surfaces are coarse anatomical envelopes, not fibres or validated terminal connections.',
    'Bounds/distance and combinatorial topology are diagnostics, not clinical shape/attachment validation or proof against self-intersections.',
    'Superior pair is held for contradictory labels versus original source X coordinates; no automatic label swap, reflection or admission.',
    'Brain and midbrain are whole context compounds; surface distances do not establish patient registration or physiological continuity.',
  ],
};
const out = JSON.stringify(result, null, 2) + '\n',
  path = 'docs/collicular-brachia-source-audit.json';
if (check)
  assert.equal(
    (await readFile(path, 'utf8')).replace(/\r\n/g, '\n'),
    out,
    'Brachia source audit is stale',
  );
else await writeFile(path, out);
console.log(
  JSON.stringify(
    {
      mode: check ? 'checked' : 'generated',
      groups: groups.map((g) => ({
        id: g.id,
        status: g.status,
        sourceSide: g.side,
        coordinateSide: g.coordinateSide,
        triangles: g.topology.triangles,
      })),
      neuralRecordsScreened: screened.length,
      comparisons: comparisons.length,
      noExactSharedTriangles: true,
      clinicalApproval: false,
    },
    null,
    2,
  ),
);
