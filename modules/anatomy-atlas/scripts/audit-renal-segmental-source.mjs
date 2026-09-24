import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { crc32 } from 'node:zlib';
import { build } from 'esbuild';
import { Box3, Matrix4, Vector3 } from 'three';
import { loadCurrentSourceHolds } from './current-source-holds.mjs';
import { geometryFingerprint } from './anatomy-inventory.mjs';
import { sourceObjShape, mergeSourceShapes, sourceBoundsNear, sourceTriangleSet } from './source-surface-audit.mjs';
import { sourceTopology } from './source-topology.mjs';
import { spatialDistanceIndex, uniqueSourceVertices, distanceSummary } from './source-spatial-math.mjs';
import { shapeCandidate, compareTranslatedShape } from './vessel-shape-math.mjs';
import { renalSegmentalCandidates } from './renal-segmental-candidates.mjs';

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const cacheRoot = '../work/bodyparts3d';
const outputPath = 'docs/renal-segmental-source-audit.json';
const { catalog: rawCatalog, records, inventory, policy, evidence, supplementalEvidence } =
  await loadCurrentSourceHolds();
assert.equal(renalSegmentalCandidates.length, 5);
assert.equal(new Set(renalSegmentalCandidates.map((c) => c.id)).size, 5);
const definitions = renalSegmentalCandidates.map((candidate) => {
  const definition = records.find((r) => r.tree === candidate.tree && r.id === candidate.id);
  assert(definition, `Missing exact definition ${candidate.id}`);
  assert.equal(definition.name, candidate.name);
  assert.deepEqual(definition.files, candidate.files, `Changed complete definition ${candidate.id}`);
  return definition;
});
policy.assertNoKnownHolds(definitions);

// Compile the authored display catalogue so the screen includes every current
// root selection, including later additions outside the raw source catalogue.
const compiled = await build({
  stdin: {
    contents: "export {bodyDisplayCatalog} from './lib/body-display-catalog'",
    resolveDir: process.cwd(), loader: 'ts',
  },
  bundle: true, write: false, platform: 'node', format: 'esm',
});
const { bodyDisplayCatalog } = await import(
  'data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64')
);
const rootCatalog = bodyDisplayCatalog(rawCatalog);
const renalCatalogBytes = await readFile('public/models/bodyparts3d/renal/catalog.json');
const renalCatalog = JSON.parse(renalCatalogBytes);
assert.deepEqual(renalCatalog.coordinateSystem, rootCatalog.coordinateSystem);

const shapeCache = new Map();
const missing = new Set();
async function loadShape(tree, file, expectedSha256) {
  const key = `${tree}/${file}`;
  if (!shapeCache.has(key)) {
    let bytes;
    try {
      bytes = await readFile(`${cacheRoot}/${key}.obj`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        missing.add(key);
        return null;
      }
      throw error;
    }
    const pin = inventory.assets.find((a) => a.tree === tree && a.file === file);
    assert(pin?.available, `Missing source inventory pin ${key}`);
    assert.equal(bytes.length, pin.bytes, `Source inventory bytes changed: ${key}`);
    assert.equal(crc32(bytes), pin.crc32, `Source inventory CRC changed: ${key}`);
    shapeCache.set(key, {
      bytes,
      shape: sourceObjShape(bytes),
      sha256: hash(bytes),
      pin,
    });
  }
  const loaded = shapeCache.get(key);
  if (expectedSha256)
    assert.equal(loaded.sha256, expectedSha256, `Raw source SHA-256 changed: ${key}`);
  return loaded;
}
const candidateShapes = new Map();
const groups = [];
for (let i = 0; i < definitions.length; i++) {
  const definition = definitions[i];
  const candidate = renalSegmentalCandidates[i];
  const file = candidate.files[0];
  const source = await loadShape(candidate.tree, file, candidate.sha256);
  if (!source) continue;
  const { bytes, shape, pin } = source;
  const fingerprint = geometryFingerprint(bytes);
  const directOwners = rootCatalog.structures.filter((s) =>
    s.sourceTree === candidate.tree && s.sources.some((f) => f.file === file));
  const nestedOwners = renalCatalog.structures.filter((s) =>
    s.sourceTree === candidate.tree && s.sources.some((f) => f.file === file));
  assert.equal(directOwners.length + nestedOwners.length, 0, `Already owned source ${file}`);
  candidateShapes.set(candidate.id, shape);
  groups.push({
    id: candidate.id,
    name: candidate.name,
    side: candidate.side,
    tree: candidate.tree,
    file,
    files: candidate.files,
    sources: [{ file, sha256: source.sha256, bytes: bytes.length, crc32: crc32(bytes) }],
    sha256: source.sha256,
    bytes: bytes.length,
    crc32: crc32(bytes),
    inventory: { bytes: pin.bytes, crc32: pin.crc32, available: pin.available },
    geometrySha256: fingerprint,
    definition,
    sourceAliases: records.filter((r) => r.tree === candidate.tree && r.files.includes(file))
      .map((r) => ({ id: r.id, name: r.name, sourceFileCount: r.files.length,
        candidateFile: file, definitionSha256: hash(JSON.stringify(r)) })),
    sameFilenameOtherTree: [...rootCatalog.structures, ...renalCatalog.structures]
      .filter((s) => s.sourceTree !== candidate.tree && s.sources.some((f) => f.file === file))
      .map((s) => s.id),
    directOwners: [],
    exactInventoryMatches: inventory.assets.filter((a) =>
      a.geometrySha256 === fingerprint && a.representedBy.length)
      .map((a) => ({ tree: a.tree, file: a.file, representedBy: a.representedBy })),
    topology: sourceTopology(shape),
    bounds: { min: shape.min, max: shape.max, extent: shape.extent },
    sideCentrePass: candidate.side === 'right' ? shape.centre[0] < 0 : shape.centre[0] > 0,
    verticesCrossingMidline: shape.vertices.filter((v) =>
      candidate.side === 'right' ? v[0] >= 0 : v[0] <= 0).length,
    holdScreen: policy.inspect(definition),
    admissionApproved: false,
  });
}
if (missing.size) throw Error(`Missing original source cache; obtain and verify these archive members before audit: ${[...missing].sort().join(', ')}`);
assert.equal(groups.length, 5);

const inverse = new Matrix4()
  .fromArray(rootCatalog.coordinateSystem.sourceToSceneColumnMajor).invert();
function sourceBounds(sceneBounds) {
  const box = new Box3(new Vector3(...sceneBounds.min), new Vector3(...sceneBounds.max))
    .applyMatrix4(inverse);
  return { min: box.min.toArray(), max: box.max.toArray(), extent: box.getSize(new Vector3()).toArray() };
}
const references = [
  ...rootCatalog.structures.map((s) => ({ scope: 'root', owner: s })),
  ...renalCatalog.structures.map((s) => ({ scope: 'nested-renal', owner: s })),
];
const screened = [];
const comparisons = [];
const sample = (shape) => {
  const vertices = uniqueSourceVertices(shape);
  const stride = Math.max(1, Math.ceil(vertices.length / 128));
  return { points: vertices.filter((_, i) => i % stride === 0), totalVertices: vertices.length, stride };
};
const nearestCache = new WeakMap();
const nearest = (shape) => {
  if (!nearestCache.has(shape)) nearestCache.set(shape, spatialDistanceIndex(shape));
  return nearestCache.get(shape);
};
const distance = (a, b) => {
  const selected = sample(a);
  return { totalVertices: selected.totalVertices, stride: selected.stride,
    summary: distanceSummary(selected.points, nearest(b)) };
};
for (const { scope, owner } of references) {
  const bounds = sourceBounds(owner.bounds);
  const matches = groups.map((g) => {
    const shape = candidateShapes.get(g.id);
    const overlap = sourceBoundsNear(shape, bounds, 1.01);
    const extent = owner.system === 'vessels' &&
      (owner.laterality === g.side || !['left', 'right'].includes(owner.laterality)) &&
      shapeCandidate(shape, bounds);
    // The displayed parent renal arteries are required relationship context
    // even when their envelopes stop short of the source-labelled branches.
    const parentRenalArtery = scope === 'root' &&
      owner.fmaId === (g.side === 'right' ? 'FMA14752' : 'FMA14753');
    return { group: g, overlap, extent, parentRenalArtery };
  }).filter((m) => m.overlap || m.extent || m.parentRenalArtery);
  screened.push({ scope, id: owner.id, fmaId: owner.fmaId,
    recordSha256: hash(JSON.stringify(owner)), bounds,
    candidateIds: matches.map((m) => m.group.id) });
  if (!matches.length) continue;
  const sourceParts = [];
  for (const file of owner.sources) {
    const source = await loadShape(owner.sourceTree, file.file, file.sha256);
    if (source) sourceParts.push(source.shape);
  }
  if (sourceParts.length !== owner.sources.length) continue;
  const reference = mergeSourceShapes(sourceParts);
  const triangles = sourceTriangleSet(reference);
  for (const match of matches) {
    const candidate = candidateShapes.get(match.group.id);
    comparisons.push({
      candidate: match.group.id, reference: owner.id, referenceFmaId: owner.fmaId,
      scope, referenceRecordSha256: hash(JSON.stringify(owner)),
      referenceSources: owner.sources,
      originalBoundsNear: match.overlap, extentScreenMatch: match.extent,
      parentRenalArteryContext: match.parentRenalArtery,
      exactSharedTriangles: [...sourceTriangleSet(candidate)].filter((t) => triangles.has(t)).length,
      candidateToReference: distance(candidate, reference),
      referenceToCandidate: distance(reference, candidate),
      translatedDiagnostic: match.extent ? compareTranslatedShape(candidate, reference) : null,
    });
  }
}
if (missing.size) throw Error(`Missing original reference cache for screened comparisons; obtain only these pinned members: ${[...missing].sort().join(', ')}`);

const candidatePairs = [];
for (let a = 0; a < groups.length; a++)
  for (let b = a + 1; b < groups.length; b++) {
    const x = candidateShapes.get(groups[a].id), y = candidateShapes.get(groups[b].id);
    const yTriangles = sourceTriangleSet(y);
    candidatePairs.push({
      a: groups[a].id, b: groups[b].id,
      exactSharedTriangles: [...sourceTriangleSet(x)].filter((t) => yTriangles.has(t)).length,
      aToB: distance(x, y), bToA: distance(y, x),
    });
  }
const result = {
  schemaVersion: 1,
  evidence, supplementalEvidence,
  sourceArchives: rawCatalog.sources,
  license: rawCatalog.license, credit: rawCatalog.credit,
  renalCatalogSha256: hash(renalCatalogBytes),
  coordinateSystem: rootCatalog.coordinateSystem,
  groups, screened, comparisons, candidatePairs,
  geometryModified: false, admissionApproved: false, clinicalApproval: false,
  limitations: [
    'These five complete source definitions are a bounded proposal, not a complete renal arterial tree.',
    'A source label, archive CRC and closed manifold do not establish anatomical identity or correctness.',
    'Original-coordinate exact triangles and bounded bidirectional surface samples diagnose overlap, not joined lumen, branch continuity, perfusion territory or surgical anatomy.',
    'Root and nested renal catalogue envelopes are screened; compatible sources are sampled. Bounds and sampling do not prove absence of intersection.',
    'No candidate geometry is repaired, aligned, exported or admitted. Revision-bound radiologist sign-off remains pending.',
  ],
};
const text = JSON.stringify(result, null, 2) + '\n';
if (process.argv.includes('--check'))
  assert.equal((await readFile(outputPath, 'utf8')).replace(/\r\n/g, '\n'), text);
else await writeFile(outputPath, text);
console.log(JSON.stringify({
  auditSha256: hash(text), groups: groups.length,
  rootScreened: rootCatalog.structures.length,
  nestedRenalScreened: renalCatalog.structures.length,
  comparisons: comparisons.length, candidatePairs: candidatePairs.length,
  nonManifold: groups.filter((g) => !g.topology.closedOrientedManifold).map((g) => g.id),
  admitted: false,
}));
