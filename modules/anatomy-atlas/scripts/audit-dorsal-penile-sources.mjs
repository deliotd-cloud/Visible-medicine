import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { crc32 } from 'node:zlib';
import { readFile, writeFile } from 'node:fs/promises';
import { build } from './workspace-test-build.mjs';
import { Box3, Matrix4, Vector3 } from 'three';
import { loadCurrentSourceHolds } from './current-source-holds.mjs';
import { geometryFingerprint } from './anatomy-inventory.mjs';
import { sourceObjShape, mergeSourceShapes, sourceBoundsNear, sourceTriangleSet } from './source-surface-audit.mjs';
import { sourceTopology, fullSourceContact } from './source-topology.mjs';
import { spatialDistanceIndex, uniqueSourceVertices, distanceSummary } from './source-spatial-math.mjs';
import { shapeCandidate, compareTranslatedShape } from './vessel-shape-math.mjs';
import { dorsalPenileSources } from './dorsal-penile-sources.mjs';

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const outputPath = 'docs/dorsal-penile-source-audit.json';
const sourceCommit = '15029f9075b6a252d0b594e6e8229bea2bf01d94';
const { catalog: raw, inventory, records, policy, evidence, supplementalEvidence } = await loadCurrentSourceHolds();
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
const display = bodyDisplayCatalog(raw);
assert.equal(dorsalPenileSources.length, 3);
assert.equal(new Set(dorsalPenileSources.map((candidate) => candidate.id)).size, 3);
const definitions = dorsalPenileSources.map((candidate) => {
  const definition = records.find((record) => record.tree === candidate.tree && record.id === candidate.id);
  assert(definition, `Missing exact definition ${candidate.id}`);
  assert.equal(definition.name, candidate.name);
  assert.equal(definition.representation, candidate.representation);
  assert.deepEqual(definition.files, candidate.files, `Changed complete definition ${candidate.id}`);
  assert.deepEqual(candidate.files, candidate.sources.map((source) => source.file));
  return definition;
});

const missing = new Set();
const shapeCache = new Map();
async function loadShape(tree, file, expectedSha256) {
  const key = `${tree}/${file}`;
  if (!shapeCache.has(key)) {
    let bytes;
    try {
      bytes = await readFile(`../work/bodyparts3d/${key}.obj`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        missing.add(key);
        return null;
      }
      throw error;
    }
    const pin = inventory.assets.find((asset) => asset.tree === tree && asset.file === file);
    assert(pin?.available, `Missing source inventory pin ${key}`);
    assert.equal(bytes.length, pin.bytes, `Source inventory byte count changed: ${key}`);
    assert.equal(crc32(bytes), pin.crc32, `Source inventory CRC changed: ${key}`);
    const sha256 = hash(bytes);
    shapeCache.set(key, { bytes, sha256, shape: sourceObjShape(bytes), pin });
  }
  const loaded = shapeCache.get(key);
  if (expectedSha256) assert.equal(loaded.sha256, expectedSha256, `Raw source SHA-256 changed: ${key}`);
  return loaded;
}
const groups = [];
const components = [];
const groupShapes = new Map();
for (let index = 0; index < dorsalPenileSources.length; index++) {
  const candidate = dorsalPenileSources[index];
  const definition = definitions[index];
  const loaded = await Promise.all(candidate.sources.map((source) => loadShape(candidate.tree, source.file, source.sha256)));
  if (loaded.some((source) => !source)) continue;
  const shape = mergeSourceShapes(loaded.map((source) => source.shape));
  groupShapes.set(candidate.id, shape);
  const sourceRows = loaded.map((source, part) => {
    const file = candidate.files[part];
    const topology = sourceTopology(source.shape);
    const row = {
      file, sha256: source.sha256, bytes: source.bytes.length, crc32: crc32(source.bytes),
      geometrySha256: geometryFingerprint(source.bytes),
      inventory: { available: source.pin.available, bytes: source.pin.bytes, crc32: source.pin.crc32 },
      bounds: { min: source.shape.min, max: source.shape.max, extent: source.shape.extent },
      topology,
      directOwners: display.structures.filter((owner) => owner.sourceTree === candidate.tree && owner.sources.some((part) => part.file === file))
        .map((owner) => ({ id: owner.id, fmaId: owner.fmaId })),
      aliases: records.filter((record) => record.tree === candidate.tree && record.files.includes(file))
        .map((record) => ({ id: record.id, name: record.name, representation: record.representation,
          files: record.files, definitionSha256: hash(JSON.stringify(record)) })),
      sameFilenameOtherTree: display.structures.filter((owner) => owner.sourceTree !== candidate.tree && owner.sources.some((part) => part.file === file))
        .map((owner) => owner.id),
      exactInventoryMatches: inventory.assets.filter((asset) => asset.geometrySha256 === geometryFingerprint(source.bytes) && asset.representedBy.length)
        .map((asset) => ({ tree: asset.tree, file: asset.file, representedBy: asset.representedBy })),
    };
    components.push({ groupId: candidate.id, ...row });
    return row;
  });
  groups.push({
    id: candidate.id, name: candidate.name, representation: candidate.representation,
    tree: candidate.tree, files: candidate.files, sources: sourceRows,
    definition, definitionSha256: hash(JSON.stringify(definition)),
    holdScreen: policy.inspect(definition),
    groupedBounds: { min: shape.min, max: shape.max, extent: shape.extent },
    groupedTopology: sourceTopology(shape),
    geometryModified: false, admissionApproved: false,
  });
}
if (missing.size) throw Error(`Missing pinned candidate originals: ${[...missing].sort().join(', ')}`);
assert.equal(groups.length, 3);
assert.equal(components.length, 5);
assert(components.every((part) => part.topology.closedOrientedManifold));

const inverse = new Matrix4().fromArray(display.coordinateSystem.sourceToSceneColumnMajor).invert();
function sourceBounds(sceneBounds) {
  const box = new Box3(new Vector3(...sceneBounds.min), new Vector3(...sceneBounds.max)).applyMatrix4(inverse);
  return { min: box.min.toArray(), max: box.max.toArray(), extent: box.getSize(new Vector3()).toArray() };
}
const sampled = (shape) => {
  const points = uniqueSourceVertices(shape);
  const stride = Math.max(1, Math.ceil(points.length / 128));
  return { points: points.filter((_, index) => index % stride === 0), totalVertices: points.length, stride };
};
const nearestCache = new WeakMap();
const nearest = (shape) => {
  if (!nearestCache.has(shape)) nearestCache.set(shape, spatialDistanceIndex(shape));
  return nearestCache.get(shape);
};
const distance = (a, b) => {
  const selection = sampled(a);
  return { totalVertices: selection.totalVertices, stride: selection.stride,
    summary: distanceSummary(selection.points, nearest(b)) };
};
const allVertexDistance = (a, b) => ({
  method: 'all unique stored source vertices to opposite original triangle surface; unsigned',
  summary: distanceSummary(uniqueSourceVertices(a), nearest(b)),
});
const shared = (a, b) => {
  const triangles = sourceTriangleSet(b);
  return [...sourceTriangleSet(a)].filter((triangle) => triangles.has(triangle)).length;
};

// Include every current display root, including the admitted corpus spongiosum.
// Source files for every selected comparison are mandatory, even in --check.
const screened = [];
const comparisons = [];
for (const owner of display.structures) {
  const bounds = sourceBounds(owner.bounds);
  const matches = groups.map((group) => {
    const candidate = groupShapes.get(group.id);
    const boundsNear = sourceBoundsNear(candidate, bounds, 1.01);
    const translatedShapeCandidate = owner.system === 'vessels' && shapeCandidate(candidate, bounds);
    const namedContext = /internal pudendal/i.test(owner.name) ||
      ['FMA19667', 'FMA15900', 'FMA9600'].includes(owner.fmaId);
    return { group, boundsNear, translatedShapeCandidate, namedContext };
  }).filter((match) => match.boundsNear || match.translatedShapeCandidate || match.namedContext);
  screened.push({ id: owner.id, fmaId: owner.fmaId, recordSha256: hash(JSON.stringify(owner)),
    bounds, candidateIds: matches.map((match) => match.group.id) });
  if (!matches.length) continue;
  const sourceParts = await Promise.all(owner.sources.map((source) => loadShape(owner.sourceTree, source.file, source.sha256)));
  if (sourceParts.some((part) => !part)) continue;
  const reference = mergeSourceShapes(sourceParts.map((part) => part.shape));
  for (const match of matches) {
    const candidate = groupShapes.get(match.group.id);
    comparisons.push({
      candidate: match.group.id, reference: owner.id, referenceFmaId: owner.fmaId,
      referenceSystem: owner.system, referenceRecordSha256: hash(JSON.stringify(owner)),
      referenceSources: owner.sources,
      originalBoundsNear: match.boundsNear, extentScreenMatch: match.translatedShapeCandidate,
      namedContext: match.namedContext,
      exactSharedTriangles: shared(candidate, reference),
      distanceMethod: 'sampled unique vertices, stride recorded in each direction',
      candidateToReference: distance(candidate, reference),
      referenceToCandidate: distance(reference, candidate),
      fullContact: match.group.id === 'FMA21354' &&
        (owner.fmaId === 'FMA19617' || owner.fmaId === 'FMA18918')
        ? { candidateToReference: fullSourceContact(candidate, reference),
            referenceToCandidate: fullSourceContact(reference, candidate),
            allVertexCandidateToReference: allVertexDistance(candidate, reference),
            allVertexReferenceToCandidate: allVertexDistance(reference, candidate) }
        : null,
      translatedDiagnostic: match.translatedShapeCandidate ? compareTranslatedShape(candidate, reference) : null,
    });
  }
}
if (missing.size) throw Error(`Missing pinned comparison originals: ${[...missing].sort().join(', ')}`);

// Cross-file diagnostics use original coordinates. No fitting, including mirror
// alignment, is applied to the arterial components or opposite sides.
const componentPairs = [];
for (let a = 0; a < components.length; a++)
  for (let b = a + 1; b < components.length; b++) {
    const left = await loadShape('isa', components[a].file, components[a].sha256);
    const right = await loadShape('isa', components[b].file, components[b].sha256);
    componentPairs.push({
      a: components[a].file, aGroup: components[a].groupId,
      b: components[b].file, bGroup: components[b].groupId,
      sameDefinition: components[a].groupId === components[b].groupId,
      exactSharedTriangles: shared(left.shape, right.shape),
      distanceMethod: 'all unique source vertices and all triangle centroids; original coordinates',
      aToB: fullSourceContact(left.shape, right.shape),
      bToA: fullSourceContact(right.shape, left.shape),
      allVertexAToB: allVertexDistance(left.shape, right.shape),
      allVertexBToA: allVertexDistance(right.shape, left.shape),
    });
  }
const groupPairs = [];
for (let a = 0; a < groups.length; a++)
  for (let b = a + 1; b < groups.length; b++) {
    const left = groupShapes.get(groups[a].id), right = groupShapes.get(groups[b].id);
    groupPairs.push({ a: groups[a].id, b: groups[b].id,
      exactSharedTriangles: shared(left, right),
      distanceMethod: 'sampled unique vertices, stride recorded in each direction',
      aToB: distance(left, right), bToA: distance(right, left) });
  }
const result = {
  schemaVersion: 1, sourceCommit, evidence, supplementalEvidence,
  sourceArchive: 'https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/isa_BP3D_4.0_obj_99.zip',
  sourceArchives: raw.sources, license: raw.license, credit: raw.credit,
  coordinateSystem: display.coordinateSystem,
  groups, screened, comparisons, componentPairs, groupPairs,
  geometryModified: false, admitted: false, clinicalApproval: false,
  limitations: [
    'Three complete archived isa definitions are audited offline; the artery definitions each contain two individually closed source files, not certified branches.',
    'Closed combinatorial manifold and source labels do not establish anatomical correctness, continuity between arterial components, a lumen, flow or a surgical plane.',
    'Exact triangles and bounded bidirectional vertex-to-surface samples diagnose proximity only; no mirrored fitting or patient registration was performed.',
    'All current display roots were screened, including corpus spongiosum. Bounds and samples do not prove absence of intersection.',
    'No geometry was repaired, exported or admitted. Revision-bound radiologist review remains pending.',
  ],
};
const output = JSON.stringify(result, null, 2) + '\n';
if (process.argv.includes('--check'))
  assert.equal((await readFile(outputPath, 'utf8')).replace(/\r\n/g, '\n'), output);
else await writeFile(outputPath, output);
console.log(JSON.stringify({ auditSha256: hash(output), definitions: groups.length,
  sourceFiles: components.length, rootScreened: screened.length,
  comparisons: comparisons.length, componentPairs: componentPairs.length,
  groupPairs: groupPairs.length, missing: [...missing], admitted: false }));
