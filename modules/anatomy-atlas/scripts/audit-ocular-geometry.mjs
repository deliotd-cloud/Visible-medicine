import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { cache } from './bodyparts-archive.mjs';
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
const sourceCommit = '7a517628613ce287d156646bf3fc6ef1cdc714d8';
const hash = (b) => createHash('sha256').update(b).digest('hex');
const previous = (path) =>
  execFileSync('git', ['show', sourceCommit + ':' + path], { maxBuffer: 16e6 });
const raw = previous('public/models/bodyparts3d/full-body/catalog.json'),
  catalog = JSON.parse(raw);
assert.equal(
  hash(raw),
  'b9888bf57e7eee61638c2c6920677fe3e6b6bd55ad97df3d19f45829865c13d5',
);
const prepRaw = previous('content/ocular-candidate-audit.json'),
  prep = JSON.parse(prepRaw);
assert.equal(
  hash(prepRaw),
  'e09479a5aefaa62d71a9c7e261131423952b8a9203dc41a37e86247b71bb5d6e',
);
const old = [];
for (const s of catalog.structures.filter((s) =>
  s.regions.includes('head-neck'),
)) {
  const parts = [];
  for (const source of s.sources) {
    const bytes = await fs.readFile(
      `${cache}/${s.sourceTree}/${source.file}.obj`,
    );
    assert.equal(hash(bytes), source.sha256);
    parts.push(sourceObjShape(bytes));
  }
  old.push({
    id: s.fmaId,
    name: s.sourceName,
    system: s.system,
    laterality: s.laterality,
    existing: true,
    shape: mergeSourceShapes(parts),
  });
}
const candidates = [];
for (const p of prep.results) {
  const bytes = await fs.readFile(`${cache}/isa/${p.file}.obj`);
  assert.equal(hash(bytes), p.sha256);
  const shape = sourceObjShape(bytes);
  assert.deepEqual(shape.min, p.sourceBounds.min);
  assert.deepEqual(shape.max, p.sourceBounds.max);
  candidates.push({
    id: p.fmaId,
    name: p.name,
    system: /tarsal plate/.test(p.name) ? 'connective' : 'organs',
    laterality: p.expectedSide,
    existing: false,
    shape,
  });
}
const all = [...old, ...candidates],
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
      if (result.flagged) console.log(JSON.stringify(result));
    } else pruned++;
    // Distinct labels on the same/unspecified side, including distant translated
    // alternatives. Opposite sides may legitimately resemble each other.
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
  catalogSha256: hash(raw),
  coordinateSystem: catalog.coordinateSystem,
  excluded: catalog.excluded,
  structures: catalog.structures.map((s) => ({
    id: s.id,
    sha256: hash(JSON.stringify(s)),
  })),
  bundles: catalog.bundles,
  inventoryHolds: Object.fromEntries(
    JSON.parse(previous('content/source-inventory.json'))
      // Conditional single-file disc holds are reconstructed by the rule, not
      // promoted to ID-wide policy across different source-tree definitions.
      .records.filter(
        (r) =>
          r.heldReason &&
          r.heldReason !==
            'Generic disc surface does not establish the unresolved named level.',
      )
      .map((r) => [r.id, r.heldReason]),
  ),
};
const baselineText = JSON.stringify(baseline, null, 2) + '\n',
  baselinePath = 'content/ocular-baseline.json';
const existing = await fs.readFile(baselinePath, 'utf8').catch(() => null);
if (existing) {
  const prior = JSON.parse(existing);
  // Add pinned historical hold policy to the earlier baseline, preserving every
  // existing field. This makes later inventory-policy changes reproducible.
  if (!prior.inventoryHolds) prior.inventoryHolds = baseline.inventoryHolds;
  assert.deepEqual(prior, baseline);
}
await fs.writeFile(baselinePath, baselineText);
const report = {
  sourceCommit,
  catalogSha256: hash(raw),
  preparationSha256: hash(prepRaw),
  sourceVersion: '4.0',
  license: 'CC-BY-4.0',
  licenseUrl: prep.licenseUrl,
  checked: '2026-09-06',
  existingStructures: old.length,
  considered,
  pruned,
  marginMm: 1,
  results: candidates.map((c) => ({
    fmaId: c.id,
    name: c.name,
    system: c.system,
    vertices: c.shape.vertices.length,
    triangles: c.shape.faces.length,
    bounds: { min: c.shape.min, max: c.shape.max },
    lateralityPass:
      c.laterality === 'right' ? c.shape.max[0] < 0 : c.shape.min[0] > 0,
    admitted: false,
    clinicalValidation: false,
  })),
  comparisons,
  translatedShapeComparisons: translated,
  limits:
    'All existing head/neck source structures plus ten exact candidates; source hashes checked before reading geometry. Raw-coordinate comparisons use at most 128 deterministic vertex samples per direction to all comparison triangles, with degenerate-face segment fallback. Pairs over 1 mm apart in bounds are pruned. Exact shared triangles or at least 25% of samples within 0.25 mm in either direction trigger review. Separate extent-filtered, same/unspecified-side centre-translation diagnostics search for near-translated alternatives. Sampling, finite geometry and source names do not establish tissue boundaries, absence of overlap, flow, attachments, lumen, clinical identity or safety. No admission is made by running this audit.',
};
await fs.writeFile(
  'content/ocular-geometry-audit.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(
  JSON.stringify(
    {
      existing: old.length,
      candidates: candidates.length,
      considered,
      pruned,
      comparisons: comparisons.length,
      flags: comparisons.filter((r) => r.flagged).map((r) => [r.a, r.b]),
      translated: translated.length,
      translatedMatches: translated.filter((r) => r.similar),
    },
    null,
    2,
  ),
);
