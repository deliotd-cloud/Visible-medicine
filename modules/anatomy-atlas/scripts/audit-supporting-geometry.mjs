import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { Box3, Matrix4, Vector3 } from 'three';
import {
  cache,
  archiveReader,
  sourceTable,
  parallelMap,
} from './bodyparts-archive.mjs';
import { geometryFingerprint } from './anatomy-inventory.mjs';
import { ocularHistory } from './ocular-history.mjs';
import {
  sourceObjShape,
  mergeSourceShapes,
  sourceBoundsNear,
  compareSourceSurfaces,
} from './source-surface-audit.mjs';
import {
  shapeCandidate,
  compareTranslatedShape,
} from './vessel-shape-math.mjs';
import { supportingGeometryDefinitions } from './supporting-geometry-candidates.mjs';

const sourceCommit = 'bc48e1e2d627e4d1d88139b0e3023370720eb747';
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const previous = (path) =>
  execFileSync('git', ['show', sourceCommit + ':' + path], { maxBuffer: 16e6 });
const baselinePath = 'content/supporting-geometry-baseline.json';
const savedBaseline = await fs.readFile(baselinePath, 'utf8').catch(() => null);
const history = savedBaseline
  ? ocularHistory(
      JSON.parse(
        await fs.readFile('public/models/bodyparts3d/full-body/catalog.json'),
      ),
      JSON.parse(await fs.readFile('content/source-inventory.json')),
      JSON.parse(savedBaseline),
      JSON.parse(savedBaseline),
    )
  : null;
const catalogRaw =
  history?.catalogRaw ??
  previous('public/models/bodyparts3d/full-body/catalog.json');
const inventoryRaw =
  history?.inventoryRaw ?? previous('content/source-inventory.json');
assert.equal(
  hash(catalogRaw),
  '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7',
);
assert.equal(
  hash(inventoryRaw),
  'c0f838bf17f5d34fd92c08a4004c6a9205f4e5fa5f6e7cb58b8d94f8a5be0c3f',
);
const catalog = JSON.parse(catalogRaw),
  inventory = JSON.parse(inventoryRaw);
const table = inventory.tables.find((t) => t.name === 'isa_element_parts.txt');
assert.equal(hash(await sourceTable(table.name)), table.sha256);
const archive = await archiveReader('isa');
const historicalHolds = Object.fromEntries(
  inventory.records
    .filter(
      (r) =>
        r.heldReason &&
        r.heldReason !==
          'Generic disc surface does not establish the unresolved named level.',
    )
    .map((r) => [r.id, r.heldReason]),
);
const candidates = await parallelMap(
  supportingGeometryDefinitions,
  4,
  async ([fmaId, name, file, laterality, role]) => {
    const definition = inventory.records.find(
      (r) => r.tree === 'isa' && r.id === fmaId,
    );
    assert.equal(definition.name, name);
    assert.deepEqual(definition.files, [file]);
    assert.equal(
      definition.status,
      role === 'held-control' ? 'held-source-review' : 'unused-available',
    );
    const bytes = await archive.get(file),
      shape = sourceObjShape(bytes),
      fingerprint = geometryFingerprint(bytes);
    const aliases = inventory.records
      .filter((r) => r.files.includes(file))
      .map((r) => ({
        tree: r.tree,
        id: r.id,
        name: r.name,
        componentCount: r.files.length,
        candidateFiles: r.files.filter((f) => f === file),
        recordSha256: hash(JSON.stringify(r)),
      }));
    const result = {
      fmaId,
      name,
      file,
      role,
      expectedSide: laterality,
      bytes: bytes.length,
      crc32: archive.entries.get(file + '.obj').crc,
      sha256: hash(bytes),
      geometrySha256: fingerprint,
      vertices: shape.vertices.length,
      triangles: shape.faces.length,
      degenerateTriangles: shape.triangles.filter((t) => t.degenerate).length,
      bounds: { min: shape.min, max: shape.max },
      centre: shape.centre,
      extent: shape.extent,
      sideCentrePass:
        laterality === 'right' ? shape.centre[0] < 0 : shape.centre[0] > 0,
      oppositeSideVertices: shape.vertices.filter((v) =>
        laterality === 'right' ? v[0] >= 0 : v[0] <= 0,
      ).length,
      aliases,
      holds: aliases
        .filter((r) => historicalHolds[r.id])
        .map((r) => ({ id: r.id, reason: historicalHolds[r.id] })),
      renderedOwners: catalog.structures
        .filter((s) => s.sources.some((f) => f.file === file))
        .map((s) => s.id),
      exactRenderedMatches: inventory.assets
        .filter(
          (a) => a.geometrySha256 === fingerprint && a.representedBy.length,
        )
        .map((a) => ({
          tree: a.tree,
          file: a.file,
          representedBy: a.representedBy,
        })),
      admitted: false,
      clinicalValidation: false,
    };
    console.log(
      JSON.stringify({
        id: fmaId,
        vertices: result.vertices,
        triangles: result.triangles,
        bounds: result.bounds,
        side: result.sideCentrePass,
      }),
    );
    return { id: fmaId, name, laterality, shape, result, existing: false };
  },
);

// Screen every preceding structure, not only head/neck and hand. The
// inverse transform is used for conservative bounds pruning, never mesh edits.
const inverse = new Matrix4()
  .fromArray(catalog.coordinateSystem.sourceToSceneColumnMajor)
  .invert();
const sourceEnvelope = (s) => {
  const box = new Box3(
    new Vector3(...s.bounds.min),
    new Vector3(...s.bounds.max),
  ).applyMatrix4(inverse);
  return {
    min: box.min.toArray(),
    max: box.max.toArray(),
    extent: box.getSize(new Vector3()).toArray(),
  };
};
const sameSide = (a, b) =>
  a.laterality === b.laterality || !['left', 'right'].includes(b.laterality);
const existing = [],
  screened = [];
for (const s of catalog.structures) {
  const envelope = sourceEnvelope(s);
  const near = candidates
    .filter((c) => sourceBoundsNear(c.shape, envelope, 1.01))
    .map((c) => c.id);
  const translated = ['muscles', 'connective'].includes(s.system)
    ? candidates
        .filter((c) => sameSide(c, s) && shapeCandidate(c.shape, envelope))
        .map((c) => c.id)
    : [];
  screened.push({
    id: s.fmaId,
    recordSha256: hash(JSON.stringify(s)),
    nearCandidates: near,
    translatedCandidates: translated,
  });
  if (!near.length && !translated.length) continue;
  const parts = [];
  for (const f of s.sources) {
    const bytes = await fs.readFile(`${cache}/${s.sourceTree}/${f.file}.obj`);
    assert.equal(hash(bytes), f.sha256);
    parts.push(sourceObjShape(bytes));
  }
  existing.push({
    id: s.fmaId,
    name: s.sourceName,
    laterality: s.laterality,
    shape: mergeSourceShapes(parts),
    existing: true,
    near,
    translated,
  });
}
const comparisons = [],
  translatedShapeComparisons = [];
for (const c of candidates)
  for (const e of existing) {
    if (e.near.includes(c.id))
      comparisons.push({
        a: c.id,
        b: e.id,
        nameA: c.name,
        nameB: e.name,
        aExisting: false,
        bExisting: true,
        ...compareSourceSurfaces(c.shape, e.shape),
      });
    if (e.translated.includes(c.id))
      translatedShapeComparisons.push({
        a: c.id,
        b: e.id,
        ...compareTranslatedShape(c.shape, e.shape),
      });
  }
for (let i = 0; i < candidates.length; i++)
  for (let j = i + 1; j < candidates.length; j++) {
    const a = candidates[i],
      b = candidates[j];
    if (sourceBoundsNear(a.shape, b.shape, 1.01))
      comparisons.push({
        a: a.id,
        b: b.id,
        nameA: a.name,
        nameB: b.name,
        aExisting: false,
        bExisting: false,
        ...compareSourceSurfaces(a.shape, b.shape),
      });
    if (sameSide(a, b) && shapeCandidate(a.shape, b.shape))
      translatedShapeComparisons.push({
        a: a.id,
        b: b.id,
        ...compareTranslatedShape(a.shape, b.shape),
      });
  }
const baseline = {
  sourceCommit,
  catalogSha256: hash(catalogRaw),
  inventorySha256: hash(inventoryRaw),
  coordinateSystem: catalog.coordinateSystem,
  excluded: catalog.excluded,
  structures: catalog.structures.map((s) => ({
    id: s.id,
    sha256: hash(JSON.stringify(s)),
  })),
  bundles: catalog.bundles,
  inventoryHolds: historicalHolds,
};
const old = await fs.readFile(baselinePath, 'utf8').catch(() => null);
if (old) assert.deepEqual(JSON.parse(old), baseline);
await fs.writeFile(baselinePath, JSON.stringify(baseline, null, 2) + '\n');
const report = {
  sourceCommit,
  catalogSha256: hash(catalogRaw),
  inventorySha256: hash(inventoryRaw),
  sourceVersion: '4.0',
  license: 'CC-BY-4.0',
  credit: inventory.credit,
  licenseUrl: 'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html',
  sourceUrl: archive.source,
  sourceTableSha256: table.sha256,
  checked: '2026-09-06',
  screeningMarginMm: 1.01,
  screened,
  comparedExistingStructures: existing.length,
  consideredPairs: catalog.structures.length * candidates.length + 15,
  results: candidates.map((c) => c.result),
  comparisons,
  translatedShapeComparisons,
  limitations:
    'Four exact v4 candidates and two previously held thumb-muscle comparison controls only. Every preceding catalogue structure is bounds-screened in original mm using the inverse authoritative coordinate transform, with 1.01 mm tolerance for scene-float rounding. Nearby source files are hash checked; at most 128 deterministic vertex samples per direction are compared to all target triangles, with degenerate-face segment fallback. Exact shared triangles or >=25% of samples within 0.25 mm flag review, not anatomical error. Same/unspecified-side muscle/connective sources with similar extent additionally receive translation-only shape diagnostics; no product geometry is transformed. All source-space proximity checks include held controls regardless of their named side. Source names, laterality and numerical proximity do not establish a tendon parent, attachments, muscle-head completeness, operative safety or clinical validation. Held-control labels are not corrected or admitted. This audit admits no anatomy.',
};
await fs.writeFile(
  'content/supporting-geometry-audit.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(
  JSON.stringify(
    {
      candidates: candidates.length,
      screened: screened.length,
      existing: existing.length,
      compared: comparisons.length,
      flags: comparisons.filter((r) => r.flagged),
      translatedFlags: translatedShapeComparisons.filter((r) => r.similar),
    },
    null,
    2,
  ),
);
