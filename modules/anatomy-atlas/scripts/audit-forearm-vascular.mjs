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
import { forearmVascularDefinitions } from './forearm-vascular-candidates.mjs';

const sourceCommit = 'baac701cffa779c6a652637a5d39d241bb081f9e';
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const previous = (path) =>
  execFileSync('git', ['show', sourceCommit + ':' + path], { maxBuffer: 16e6 });
const catalogRaw = previous('public/models/bodyparts3d/full-body/catalog.json');
const inventoryRaw = previous('content/source-inventory.json');
assert.equal(
  hash(catalogRaw),
  '8868c391ee285c13cfe54ffd3a5e4051d4a2e41d956a22acbaeb94bc8e4920a7',
);
assert.equal(
  hash(inventoryRaw),
  '339eb68f016a33545aac745d921e1a678927a6b3d813afb5f5a0eda75ce12fac',
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
  forearmVascularDefinitions,
  4,
  async ([fmaId, name, file]) => {
    const definition = inventory.records.find(
      (r) => r.tree === 'isa' && r.id === fmaId,
    );
    assert.equal(definition.name, name);
    assert.deepEqual(definition.files, [file]);
    assert.equal(definition.status, 'unused-available');
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
    const laterality = name.startsWith('right ') ? 'right' : 'left';
    const result = {
      fmaId,
      name,
      file,
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

// Screen every preceding structure, not only those tagged as forearm. The
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
  const translated =
    s.system === 'vessels'
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
const baselinePath = 'content/forearm-vascular-baseline.json';
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
  consideredPairs: catalog.structures.length * candidates.length + 6,
  results: candidates.map((c) => c.result),
  comparisons,
  translatedShapeComparisons,
  limitations:
    'Four exact v4 sources only. Every preceding catalogue structure is bounds-screened in original mm using the inverse authoritative coordinate transform, with 1.01 mm tolerance for scene-float rounding. Nearby source files are hash checked; at most 128 deterministic vertex samples per direction are compared to all target triangles, with degenerate-face segment fallback. Exact shared triangles or >=25% of samples within 0.25 mm flag review, not anatomical error. Same/unspecified-side vessels with similar extent additionally receive translation-only shape diagnostics; no product geometry is transformed. Source names, laterality and numerical proximity do not establish parent continuity, lumen, blood flow, branch completeness, operative safety or clinical validation. This audit admits no anatomy.',
};
await fs.writeFile(
  'content/forearm-vascular-source-audit.json',
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
