import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Box3, Matrix4, Vector3 } from 'three';
import { loadSourceHolds } from './load-source-holds.mjs';
import { geometryFingerprint } from './anatomy-inventory.mjs';
import {
  sourceObjShape,
  sourceBoundsNear,
  sourceTriangleSet,
  mergeSourceShapes,
} from './source-surface-audit.mjs';
import {
  spatialDistanceIndex,
  distanceSummary,
  uniqueSourceVertices,
  candidateContact,
} from './source-spatial-math.mjs';
import {
  shapeCandidate,
  compareTranslatedShape,
} from './vessel-shape-math.mjs';
import { sourceTopology } from './source-topology.mjs';
import { cache, archiveReader } from './bodyparts-archive.mjs';
import { cricothyroidCandidates } from './cricothyroid-candidates.mjs';
import { removeReviewedOppositeFaceIslands } from './reviewed-face-islands.mjs';

const hash = (b) => createHash('sha256').update(b).digest('hex');
const { catalog, records, inventory, policy, evidence } =
  await loadSourceHolds();
if (process.argv.includes('--download')) {
  const archive = await archiveReader('isa');
  for (const candidate of cricothyroidCandidates)
    await archive.get(candidate.file);
}
const sourceCache = new Map();
async function loadShape(tree, file, expected) {
  const key = `${tree}/${file}`;
  if (!sourceCache.has(key)) {
    const bytes = await readFile(`${cache}/${key}.obj`);
    sourceCache.set(key, {
      bytes,
      sha256: hash(bytes),
      shape: sourceObjShape(bytes),
    });
  }
  const result = sourceCache.get(key);
  if (expected)
    assert.equal(result.sha256, expected, `Changed source ${key}`);
  return result;
}
const shapes = new Map();
const groups = [];
for (const candidate of cricothyroidCandidates) {
  const definition = records.find(
    (r) => r.tree === candidate.tree && r.id === candidate.id,
  );
  assert.equal(definition?.name, candidate.name);
  assert.deepEqual(definition.files, [candidate.file]);
  policy.assertNoKnownHolds([definition]);
  const { bytes, shape } = await loadShape(
    candidate.tree,
    candidate.file,
    candidate.sha256,
  );
  const derivative = removeReviewedOppositeFaceIslands(
    shape,
    candidate.oppositeFaceIslands,
  );
  assert.equal(derivative.shape.faces.length, candidate.retainedTriangles);
  const fingerprint = geometryFingerprint(bytes);
  shapes.set(candidate.id, { raw: shape, derivative: derivative.shape });
  groups.push({
    ...candidate,
    definition,
    bytes: bytes.length,
    geometrySha256: fingerprint,
    aliases: records
      .filter(
        (r) => r.tree === candidate.tree && r.files.includes(candidate.file),
      )
      .map((r) => ({
        id: r.id,
        name: r.name,
        sourceFileCount: r.files.length,
        definitionSha256: hash(JSON.stringify(r)),
      })),
    directOwners: catalog.structures
      .filter(
        (s) =>
          s.sourceTree === candidate.tree &&
          s.sources.some((f) => f.file === candidate.file),
      )
      .map((s) => s.id),
    sameFilenameOtherTree: catalog.structures
      .filter(
        (s) =>
          s.sourceTree !== candidate.tree &&
          s.sources.some((f) => f.file === candidate.file),
      )
      .map((s) => s.id),
    exactInventoryMatches: inventory.assets.filter(
      (a) => a.geometrySha256 === fingerprint && a.representedBy.length,
    ),
    rawTopology: sourceTopology(shape),
    holdScreen: policy.inspect(definition),
    derivative: {
      topology: derivative.topology,
      removedIslands: derivative.islands,
      retainedFaceIndicesSha256: hash(
        JSON.stringify(derivative.retainedSourceFaceIndices),
      ),
      retainedVertexIndicesSha256: hash(
        JSON.stringify(derivative.retainedSourceVertexIndices),
      ),
      orderedSourceTrianglesSha256: hash(
        JSON.stringify(
          derivative.shape.faces.map((f) =>
            f.map((i) => derivative.shape.vertices[i]),
          ),
        ),
      ),
      verticesCrossingMidline: derivative.shape.vertices.filter((v) =>
        candidate.side === 'right' ? v[0] >= 0 : v[0] <= 0,
      ).length,
    },
    admitted: false,
  });
}
const inverse = new Matrix4()
  .fromArray(catalog.coordinateSystem.sourceToSceneColumnMajor)
  .invert();
const rootEnvelopeScreen = catalog.structures.map((s) => {
  const box = new Box3(
    new Vector3(...s.bounds.min),
    new Vector3(...s.bounds.max),
  ).applyMatrix4(inverse);
  return {
    id: s.id,
    fmaId: s.fmaId,
    recordSha256: hash(JSON.stringify(s)),
    bounds: {
      min: box.min.toArray(),
      max: box.max.toArray(),
      extent: box.getSize(new Vector3()).toArray(),
    },
  };
});
const nearestCache = new WeakMap();
const nearest = (shape) => {
  if (!nearestCache.has(shape))
    nearestCache.set(shape, spatialDistanceIndex(shape));
  return nearestCache.get(shape);
};
function distance(a, b) {
  const points = uniqueSourceVertices(a),
    stride = Math.max(1, Math.ceil(points.length / 128));
  return {
    totalVertices: points.length,
    stride,
    summary: distanceSummary(
      points.filter((_, i) => i % stride === 0),
      nearest(b),
    ),
  };
}
const shared = (a, b) => {
  const triangles = sourceTriangleSet(b);
  return [...sourceTriangleSet(a)].filter((t) => triangles.has(t)).length;
};
const comparisons = [];
for (const envelope of rootEnvelopeScreen) {
  const owner = catalog.structures.find((s) => s.id === envelope.id);
  // Screen every root envelope. Equal-sized muscles anywhere also receive a
  // translation-only duplicate diagnostic; they are never relocated for display.
  const candidates = groups.filter(
    (g) =>
      sourceBoundsNear(shapes.get(g.id).raw, envelope.bounds, 1.01) ||
      (owner.system === 'muscles' &&
        shapeCandidate(shapes.get(g.id).derivative, envelope.bounds)),
  );
  if (!candidates.length) continue;
  const reference = mergeSourceShapes(
    await Promise.all(
      owner.sources.map(
        async (f) =>
          (await loadShape(owner.sourceTree, f.file, f.sha256)).shape,
      ),
    ),
  );
  for (const group of candidates) {
    const { raw, derivative } = shapes.get(group.id);
    comparisons.push({
      candidate: group.id,
      reference: owner.id,
      referenceFmaId: owner.fmaId,
      referenceRecordSha256: envelope.recordSha256,
      referenceSources: owner.sources,
      rawBoundsNear: sourceBoundsNear(raw, reference, 1.01),
      derivativeBoundsNear: sourceBoundsNear(derivative, reference, 1.01),
      rawExactSharedTriangles: shared(raw, reference),
      derivativeExactSharedTriangles: shared(derivative, reference),
      candidateToReference: distance(derivative, reference),
      referenceToCandidate: distance(reference, derivative),
      cartilageContact: ['FMA55099', 'FMA9615'].includes(owner.fmaId)
        ? candidateContact(derivative, reference, nearest(reference))
        : null,
      translatedDiagnostic:
        owner.system === 'muscles' && shapeCandidate(derivative, reference)
          ? compareTranslatedShape(derivative, reference)
          : null,
    });
  }
}
const candidatePairs = [];
for (let a = 0; a < groups.length; a++)
  for (let b = a + 1; b < groups.length; b++) {
    const x = shapes.get(groups[a].id).derivative,
      y = shapes.get(groups[b].id).derivative;
    candidatePairs.push({
      a: groups[a].id,
      b: groups[b].id,
      exactSharedTriangles: shared(x, y),
      aToB: distance(x, y),
      bToA: distance(y, x),
    });
  }
const result = {
  schemaVersion: 1,
  prototypeOnly: true,
  admitted: false,
  evidence,
  license: catalog.license,
  credit: catalog.credit,
  sourceArchives: catalog.sources,
  coordinateSystem: catalog.coordinateSystem,
  groups,
  rootEnvelopeScreen,
  comparisons,
  candidatePairs,
  limitations: [
    'Source labels, side signs and combinatorial topology are not specialist validation, self-intersection tests or proof of attachment footprints.',
    'Twelve source faces forming six disconnected, exactly reversed, zero-algebraic-volume pairs are omitted only from the proposed display derivative. Their coordinates and original zero-based OBJ face indices remain recorded; raw originals are unchanged.',
    'No smoothing, tolerant welding, bridging, tissue reconstruction, attachment relocation or new anatomy is introduced.',
    'Bidirectional source-coordinate samples are bounded diagnostics, not continuous intersection or joint-motion proofs. Close normal anatomical attachments are not automatically duplicates.',
    'Four source-defined straight/oblique parts do not establish a complete muscle, all described bellies or individual anatomical variation. There is no new gland, nerve, airway, patient scan registration or paid lecture entitlement.',
  ],
};
const destination = 'docs/cricothyroid-source-audit.json';
const output = JSON.stringify(result, null, 2) + '\n';
let existing = null;
try {
  existing = await readFile(destination, 'utf8');
} catch (e) {
  if (e.code !== 'ENOENT') throw e;
}
if (existing !== null || process.argv.includes('--check'))
  assert.equal(
    existing,
    output,
    'Reviewed audit changed; investigate explicitly rather than overwrite',
  );
else await writeFile(destination, output, { flag: 'wx' });
console.log(
  JSON.stringify({
    groups: groups.length,
    rootEnvelopes: rootEnvelopeScreen.length,
    comparisons: comparisons.length,
    candidatePairs: candidatePairs.length,
    rawTriangles: groups.reduce((n, g) => n + g.rawTopology.triangles, 0),
    derivativeTriangles: groups.reduce((n, g) => n + g.retainedTriangles, 0),
    auditSha256: hash(output),
    admitted: false,
  }),
);
