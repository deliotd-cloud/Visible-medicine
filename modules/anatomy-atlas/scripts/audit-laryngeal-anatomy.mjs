import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
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
import { laryngealDefinitions } from './laryngeal-candidates.mjs';

const sourceCommit = '67d08d64cc681552d284512745a158aa458a50da';
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const previous = (path) =>
  execFileSync('git', ['show', sourceCommit + ':' + path], { maxBuffer: 16e6 });
const catalogRaw = previous('public/models/bodyparts3d/full-body/catalog.json'),
  catalog = JSON.parse(catalogRaw);
const inventoryRaw = previous('content/source-inventory.json'),
  inventory = JSON.parse(inventoryRaw);
const historicalHolds = Object.fromEntries(
  inventory.records
    // The generic-disc hold is conditional on one tree's single-file definition,
    // not an ID-wide policy. Reconciliation reconstructs that rule separately.
    .filter(
      (r) =>
        r.heldReason &&
        r.heldReason !==
          'Generic disc surface does not establish the unresolved named level.',
    )
    .map((r) => [r.id, r.heldReason]),
);
assert.equal(
  hash(catalogRaw),
  '01a253d3d67a933d41bb3b08693ab13279b4e12c0767f2e4b8d68fa9f6078d86',
);
assert.equal(
  hash(inventoryRaw),
  '2d86813da40c4b48b641b995fc494ac2c05b4b2bc9320ccaa4791d7e1aa01ba7',
);
const table = inventory.tables.find((t) => t.name === 'isa_element_parts.txt');
assert.equal(hash(await sourceTable(table.name)), table.sha256);
const archive = await archiveReader('isa');
const candidates = await parallelMap(
  laryngealDefinitions,
  4,
  async ([fmaId, name, file, system, category]) => {
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
    const side = name.startsWith('right ') ? 'right' : 'left';
    const oppositeVertexIds = new Set(
      shape.vertices.flatMap((v, i) =>
        (side === 'right' ? v[0] > 0 : v[0] < 0) ? [i] : [],
      ),
    );
    const oppositeFaces = shape.faces.flatMap((f, i) =>
      f.some((v) => oppositeVertexIds.has(v)) ? [i] : [],
    );
    const result = {
      fmaId,
      name,
      file,
      system,
      category,
      expectedSide: side,
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
        side === 'right' ? shape.centre[0] < 0 : shape.centre[0] > 0,
      oppositeSideFragments: {
        sourceMidplaneX: 0,
        vertices: oppositeVertexIds.size,
        triangles: oppositeFaces.length,
        triangleAreaMm2: oppositeFaces.reduce(
          (n, i) => n + shape.triangles[i].triangle.getArea(),
          0,
        ),
        allTriangleAreaMm2: shape.triangles.reduce(
          (n, t) => n + t.triangle.getArea(),
          0,
        ),
      },
      grossEnvelopePass:
        shape.min[0] > -100 &&
        shape.max[0] < 100 &&
        shape.min[2] > 1350 &&
        shape.max[2] < 1550,
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
        name,
        vertices: result.vertices,
        triangles: result.triangles,
        side: result.sideCentrePass,
        envelope: result.grossEnvelopePass,
      }),
    );
    return {
      id: fmaId,
      name,
      laterality: side,
      shape,
      result,
      existing: false,
    };
  },
);
const existing = [];
for (const s of catalog.structures.filter((s) =>
  s.regions.includes('head-neck'),
)) {
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
  });
}
const all = [...existing, ...candidates],
  comparisons = [],
  translated = [];
let considered = 0,
  pruned = 0;
for (let i = 0; i < all.length; i++)
  for (let j = i + 1; j < all.length; j++) {
    const a = all[i],
      b = all[j];
    if (a.existing && b.existing) continue;
    considered++;
    if (sourceBoundsNear(a.shape, b.shape)) {
      const result = {
        a: a.id,
        b: b.id,
        nameA: a.name,
        nameB: b.name,
        aExisting: a.existing,
        bExisting: b.existing,
        ...compareSourceSurfaces(a.shape, b.shape),
      };
      comparisons.push(result);
      if (result.flagged) console.log('FLAG ' + JSON.stringify(result));
    } else pruned++;
    if (
      a.laterality !== b.laterality &&
      ['left', 'right'].includes(a.laterality) &&
      ['left', 'right'].includes(b.laterality)
    )
      continue;
    if (shapeCandidate(a.shape, b.shape))
      translated.push({
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
  inventoryHolds: Object.fromEntries(
    inventory.records
      .filter(
        (r) =>
          r.heldReason &&
          r.heldReason !==
            'Generic disc surface does not establish the unresolved named level.',
      )
      .map((r) => [r.id, r.heldReason]),
  ),
};
const baselineText = JSON.stringify(baseline, null, 2) + '\n',
  baselinePath = 'content/laryngeal-baseline.json';
const prior = await fs.readFile(baselinePath, 'utf8').catch(() => null);
if (prior) {
  const old = JSON.parse(prior);
  if (!old.inventoryHolds) old.inventoryHolds = baseline.inventoryHolds;
  assert.deepEqual(old, baseline);
}
await fs.writeFile(baselinePath, baselineText);
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
  existingStructures: existing.length,
  considered,
  pruned,
  marginMm: 1,
  results: candidates.map((c) => c.result),
  comparisons,
  translatedShapeComparisons: translated,
  limitations:
    'Original raw source mm, all preceding head/neck structures and eight explicitly named candidates. ZIP CRC/size and source hashes are checked. At most 128 deterministic vertex samples per direction to all target triangles, with degenerate-face segment fallback; bounds beyond 1 mm are pruned. Exact shared triangles or at least 25% of samples within 0.25 mm in either direction flag review. Separate extent-pruned same/unspecified-side translation diagnostics do not move any product/source geometry. Broad neck envelope and side-centre checks are engineering filters, not proof of anatomical extent, tissue boundaries, attachments, innervation, airway lumen, swallowing, phonation, operative safety or patient registration. No admission is made by this audit.',
};
await fs.writeFile(
  'content/laryngeal-source-audit.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(
  JSON.stringify(
    {
      candidates: candidates.length,
      existing: existing.length,
      considered,
      pruned,
      compared: comparisons.length,
      flags: comparisons.filter((r) => r.flagged).map((r) => [r.a, r.b]),
      translated: translated.length,
      translatedFlags: translated.filter((r) => r.similar),
    },
    null,
    2,
  ),
);
