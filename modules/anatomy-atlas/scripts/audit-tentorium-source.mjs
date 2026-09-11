import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Box3, Matrix4, Vector3 } from 'three';
import { loadSourceHolds } from './load-source-holds.mjs';
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
import { geometryFingerprint } from './anatomy-inventory.mjs';
const hash = (b) => createHash('sha256').update(b).digest('hex');
const { catalog, inventory, records, policy, evidence } =
  await loadSourceHolds();
const definition = records.find((r) => r.tree === 'isa' && r.id === 'FMA83966');
assert.equal(definition.name, 'tentorium cerebelli');
assert.deepEqual(definition.files, ['FJ1843']);
policy.assertNoKnownHolds([definition]);
const bytes = await readFile('../work/bodyparts3d/isa/FJ1843.obj');
assert.equal(
  hash(bytes),
  'bd212fe0b2800bcb8c3ea350099f5bc563d438d8efd5409761fff47e8b150533',
);
const candidate = sourceObjShape(bytes),
  topology = sourceTopology(candidate),
  fingerprint = geometryFingerprint(bytes);
assert(topology.closedOrientedManifold);
assert.equal(topology.components.length, 1);
assert.equal(topology.triangles, 21924);
// Important extent finding: this is not a bilateral representation of the entire fold.
assert(candidate.vertices.every((p) => p[0] < 0));
const copies = inventory.assets.filter(
  (a) => a.geometrySha256 === fingerprint && a.representedBy.length,
);
assert.equal(copies.length, 0);
const additions = JSON.parse(
  await readFile('public/models/bodyparts3d/brachial-veins/catalog.json'),
);
const owners = [...catalog.structures, ...additions.structures];
assert(!owners.some((s) => s.sources.some((f) => f.file === 'FJ1843')));
const inverse = new Matrix4()
  .fromArray(catalog.coordinateSystem.sourceToSceneColumnMajor)
  .invert();
const samples = (s) => {
  const p = uniqueSourceVertices(s),
    step = Math.max(1, Math.ceil(p.length / 128));
  return p.filter((_, i) => i % step === 0);
};
const candidateSamples = samples(candidate),
  candidateIndex = spatialDistanceIndex(candidate),
  triangles = sourceTriangleSet(candidate);
const cache = new Map();
async function load(s) {
  return mergeSourceShapes(
    await Promise.all(
      s.sources.map(async (f) => {
        const key = s.sourceTree + ':' + f.file;
        if (!cache.has(key)) {
          const b = await readFile(
            `../work/bodyparts3d/${s.sourceTree}/${f.file}.obj`,
          );
          assert.equal(hash(b), f.sha256);
          cache.set(key, sourceObjShape(b));
        }
        return cache.get(key);
      }),
    ),
  );
}
const screened = [],
  comparisons = [];
for (const owner of owners) {
  const box = new Box3(
    new Vector3(...owner.bounds.min),
    new Vector3(...owner.bounds.max),
  ).applyMatrix4(inverse);
  const near = sourceBoundsNear(
    candidate,
    { min: box.min.toArray(), max: box.max.toArray() },
    1.01,
  );
  screened.push({
    id: owner.id,
    recordSha256: hash(JSON.stringify(owner)),
    near,
  });
  if (!near) continue;
  const reference = await load(owner),
    set = sourceTriangleSet(reference);
  const row = {
    id: owner.id,
    fmaId: owner.fmaId,
    sources: owner.sources,
    exactSharedTriangles: [...triangles].filter((t) => set.has(t)).length,
    candidateToReference: distanceSummary(
      candidateSamples,
      spatialDistanceIndex(reference),
    ),
    referenceToCandidate: distanceSummary(samples(reference), candidateIndex),
  };
  assert.equal(row.exactSharedTriangles, 0);
  comparisons.push(row);
}
const detailedBrain = [];
for (const file of ['brainstem', 'cerebral']) {
  const data = JSON.parse(
    await readFile(`public/models/bodyparts3d/${file}/catalog.json`),
  );
  for (const s of data.structures) {
    const reference = await load(s);
    if (!sourceBoundsNear(candidate, reference, 1.01)) continue;
    detailedBrain.push({
      study: file,
      id: s.id,
      name: s.name,
      sources: s.sources,
      candidateToReference: distanceSummary(
        candidateSamples,
        spatialDistanceIndex(reference),
      ),
      referenceToCandidate: distanceSummary(samples(reference), candidateIndex),
    });
  }
}
const report = {
  schemaVersion: 1,
  sourceCommit: '813d307edd2c8efc1acfc839030a7897942fc68b',
  evidence,
  definition,
  aliases: records.filter(
    (r) => r.files.length === 1 && r.files[0] === 'FJ1843',
  ),
  holdScreen: policy.inspect(definition),
  source: {
    file: 'FJ1843.obj',
    bytes: bytes.length,
    sha256: hash(bytes),
    geometrySha256: fingerprint,
    archive:
      'https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/isa_BP3D_4.0_obj_99.zip',
  },
  license: catalog.license,
  credit: catalog.credit,
  topology,
  extent: {
    min: candidate.min,
    max: candidate.max,
    side: 'right-only geometry in the documented source frame',
    completeTentorium: false,
  },
  screened,
  comparisons,
  detailedBrain,
  clinicalApproval: false,
  geometryModified: false,
  limits: [
    'The official label names the tentorium, but all vertices are right of the source midline. This file cannot represent the complete bilateral tentorium.',
    'No mirror, source relabelling, fitted counterpart, sinus lumen, notch boundary or patient registration has been generated.',
    'Closure and sampled distances are engineering diagnostics, not proof of self-intersection freedom, clinical accuracy, tissue contact or dissection safety.',
  ],
};
const path = 'docs/tentorium-source-audit.json',
  output = JSON.stringify(report, null, 2) + '\n';
if (process.argv.includes('--check'))
  assert.equal((await readFile(path, 'utf8')).replace(/\r\n/g, '\n'), output);
else await writeFile(path, output, { flag: 'wx' });
console.log(
  JSON.stringify({
    sha256: hash(output),
    triangles: topology.triangles,
    extent: report.extent,
    rootScreens: screened.length,
    comparisons: comparisons.map((r) => ({
      fma: r.fmaId,
      min: r.candidateToReference.minMm,
      median: r.candidateToReference.medianMm,
    })),
    detailedBrain: detailedBrain.map((r) => ({
      name: r.name,
      min: r.candidateToReference.minMm,
      median: r.candidateToReference.medianMm,
    })),
  }),
);
