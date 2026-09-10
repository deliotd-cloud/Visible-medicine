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
import { candidateContact } from './source-spatial-math.mjs';
import { sourceTopology } from './source-topology.mjs';
import { cache, archiveReader } from './bodyparts-archive.mjs';
import { gingivaCandidates } from './gingiva-candidates.mjs';
import { upperDentalIds, lowerDentalIds } from '../lib/head-detail.ts';

const hash = (b) => createHash('sha256').update(b).digest('hex');
const { catalog, records, inventory, policy, evidence } =
  await loadSourceHolds();
const sources = new Map();
const archives = new Map();
async function source(tree, file, expected) {
  const key = `${tree}/${file}`;
  if (!sources.has(key)) {
    if (process.argv.includes('--download')) {
      if (!archives.has(tree)) archives.set(tree, archiveReader(tree));
      await (await archives.get(tree)).get(file);
    }
    const bytes = await readFile(`${cache}/${key}.obj`);
    sources.set(key, {
      bytes,
      sha256: hash(bytes),
      shape: sourceObjShape(bytes),
    });
  }
  const result = sources.get(key);
  if (expected) assert.equal(result.sha256, expected, `Source changed: ${key}`);
  return result;
}
const shapes = new Map();
const candidates = [];
for (const c of gingivaCandidates) {
  const definition = records.find((r) => r.tree === c.tree && r.id === c.id);
  assert.equal(definition?.name, c.name);
  assert.deepEqual(definition.files, [c.file]);
  policy.assertNoKnownHolds([definition]);
  const { bytes, shape } = await source(c.tree, c.file, c.sha256);
  shapes.set(c.id, shape);
  const fingerprint = geometryFingerprint(bytes);
  candidates.push({
    ...c,
    definition,
    bytes: bytes.length,
    geometrySha256: fingerprint,
    aliases: records
      .filter((r) => r.files.includes(c.file))
      .map((r) => ({
        tree: r.tree,
        id: r.id,
        name: r.name,
        files: r.files,
        definitionSha256: hash(JSON.stringify(r)),
        // Same filenames across archives do not establish the same raw geometry.
        rawBytesCompared: r.tree === c.tree,
      })),
    directOwners: catalog.structures
      .filter(
        (s) =>
          s.sourceTree === c.tree && s.sources.some((f) => f.file === c.file),
      )
      .map((s) => s.id),
    sameFilenameOtherTree: catalog.structures
      .filter(
        (s) =>
          s.sourceTree !== c.tree && s.sources.some((f) => f.file === c.file),
      )
      .map((s) => s.id),
    exactInventoryMatches: inventory.assets.filter(
      (a) => a.geometrySha256 === fingerprint && a.representedBy.length,
    ),
    topology: sourceTopology(shape),
    holdScreen: policy.inspect(definition),
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
    bounds: { min: box.min.toArray(), max: box.max.toArray() },
  };
});
const rootShapes = new Map();
async function rootShape(owner) {
  if (!rootShapes.has(owner.id))
    rootShapes.set(
      owner.id,
      mergeSourceShapes(
        await Promise.all(
          owner.sources.map(
            async (f) =>
              (await source(owner.sourceTree, f.file, f.sha256)).shape,
          ),
        ),
      ),
    );
  return rootShapes.get(owner.id);
}
const shared = (a, b) => {
  const triangles = sourceTriangleSet(b);
  return [...sourceTriangleSet(a)].filter((t) => triangles.has(t)).length;
};
const comparisons = [];
for (const e of rootEnvelopeScreen) {
  const near = candidates.filter((c) =>
    sourceBoundsNear(shapes.get(c.id), e.bounds, 1.01),
  );
  if (!near.length) continue;
  const owner = catalog.structures.find((s) => s.id === e.id);
  const reference = await rootShape(owner);
  for (const c of near)
    comparisons.push({
      candidate: c.id,
      reference: owner.id,
      referenceFmaId: owner.fmaId,
      referenceName: owner.sourceName,
      referenceRecordSha256: e.recordSha256,
      referenceSources: owner.sources,
      exactSharedTriangles: shared(shapes.get(c.id), reference),
      contact: candidateContact(shapes.get(c.id), reference),
    });
}
const targets = [
  { id: 'upper-jaw-bones', fmaIds: ['FMA53649', 'FMA53650'] },
  { id: 'lower-jaw-bone', fmaIds: ['FMA52748'] },
  { id: 'upper-teeth', fmaIds: upperDentalIds },
  { id: 'lower-teeth', fmaIds: lowerDentalIds },
];
const dentalContext = [];
for (const target of targets) {
  const owners = target.fmaIds.map((id) => {
    const matches = catalog.structures.filter((s) => s.fmaId === id);
    assert.equal(matches.length, 1);
    return matches[0];
  });
  const reference = mergeSourceShapes(await Promise.all(owners.map(rootShape)));
  dentalContext.push({
    ...target,
    rootRecordsSha256: hash(JSON.stringify(owners)),
    sourceBounds: { min: reference.min, max: reference.max },
    contacts: candidates.map((c) => ({
      candidate: c.id,
      exactSharedTriangles: shared(shapes.get(c.id), reference),
      ...candidateContact(shapes.get(c.id), reference),
    })),
  });
}
const result = {
  schemaVersion: 1,
  admitted: false,
  evidence,
  license: catalog.license,
  credit: catalog.credit,
  sourceArchives: catalog.sources,
  coordinateSystem: catalog.coordinateSystem,
  candidates,
  rootEnvelopeScreen,
  comparisons,
  dentalContext,
  candidatePair: {
    exactSharedTriangles: shared(
      shapes.get(candidates[0].id),
      shapes.get(candidates[1].id),
    ),
    contact: candidateContact(
      shapes.get(candidates[0].id),
      shapes.get(candidates[1].id),
    ),
  },
  limitations: [
    'Identity and topology are source diagnostics, not clinical approval or proof of tissue boundaries, gingival margins, occlusion, a periodontal pocket or a surgical plane.',
    'Every root envelope is screened at a 1.01 mm margin. Nearby references use their hash-pinned original sources; full candidate vertices and all area-weighted triangle centroids are queried. Reverse target vertices are sampled with an explicitly reported stride.',
    'Unsigned distance, bounding boxes and exact-triangle comparisons do not certify non-intersection, regional similarity, tissue thickness or complete duplicate absence. Normal anatomy can be close without being duplicate geometry.',
    'The upper source contains small detached components, including a duplicate triangle. All original vertices, faces and winding are retained by this audit. No repair or anatomical reconstruction is authorized by a clean topology result.',
    'No crown/root boundary, tissue subdivision, tooth numbering, periodontium, dental pathology geometry or scan registration is inferred.',
    'Filename aliases in the other source archive are reported as definitions only. They have not been assigned new anatomy or assumed to have identical bytes.',
  ],
};
const destination = 'docs/gingiva-source-audit.json';
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
    'Pinned audit changed; investigate explicitly rather than overwrite',
  );
else await writeFile(destination, output, { flag: 'wx' });
console.log(
  JSON.stringify({
    candidates: candidates.length,
    rootEnvelopes: rootEnvelopeScreen.length,
    nearbyComparisons: comparisons.length,
    contextGroups: dentalContext.length,
    auditSha256: hash(output),
    admitted: false,
  }),
);
