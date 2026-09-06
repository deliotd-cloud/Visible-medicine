import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { Box3, Matrix4, Vector3 } from 'three';
import { ocularHistory } from './ocular-history.mjs';
import { supportingGeometryDefinitions } from './supporting-geometry-candidates.mjs';
import { geometryFingerprint } from './anatomy-inventory.mjs';
import { cache } from './bodyparts-archive.mjs';
import {
  sourceObjShape,
  mergeSourceShapes,
  sourceBoundsNear,
  compareSourceSurfaces,
} from './source-surface-audit.mjs';
import { shapeCandidate } from './vessel-shape-math.mjs';

const rawSourceCheck = process.argv.includes('--raw-source');
const hash = (b) => createHash('sha256').update(b).digest('hex');
const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const read = async (p) => JSON.parse(await fs.readFile(p));
let checks = 0,
  recomputedSurfacePairs = 0;
const same = (a, b, m) => {
  checks++;
  assert.deepEqual(a, b, m);
};
const check = (v, m) => {
  checks++;
  assert(v, m);
};
const reportRaw = await fs.readFile('content/supporting-geometry-audit.json');
same(
  hash(reportRaw),
  '8d278e82bb6ef9bb18fe284e34890913d55a51966dd572b3a869dfacc48aae98',
);
const report = JSON.parse(reportRaw),
  baseline = await read('content/supporting-geometry-baseline.json');
const currentCatalog = await read(
  'public/models/bodyparts3d/full-body/catalog.json',
);
const currentInventory = await read('content/source-inventory.json');
const { catalog, inventory, catalogRaw, inventoryRaw } = ocularHistory(
  currentCatalog,
  currentInventory,
  baseline,
  report,
);
same(
  hash(catalogRaw),
  '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7',
);
same(
  hash(inventoryRaw),
  'c0f838bf17f5d34fd92c08a4004c6a9205f4e5fa5f6e7cb58b8d94f8a5be0c3f',
);
same(report.sourceCommit, 'bc48e1e2d627e4d1d88139b0e3023370720eb747');
same(baseline.sourceCommit, report.sourceCommit);
same(report.catalogSha256, baseline.catalogSha256);
same(report.inventorySha256, baseline.inventorySha256);
same(report.sourceVersion, '4.0');
same(report.license, 'CC-BY-4.0');
same(report.credit, catalog.credit);
same(
  report.sourceTableSha256,
  inventory.tables.find((t) => t.name === 'isa_element_parts.txt').sha256,
);
same(report.results.length, 6);
same(report.screened.length, 1022);
same(report.consideredPairs, 6147);
same(report.comparedExistingStructures, 109);
same(report.comparisons.length, 167);
same(report.translatedShapeComparisons, []);
same(report.screeningMarginMm, 1.01);
same(currentCatalog.coordinateSystem, baseline.coordinateSystem);
for (const b of baseline.bundles)
  same(
    hash(
      await fs.readFile('public/models/bodyparts3d/full-body/' + b.id + '.glb'),
    ),
    b.sha256,
  );

const shapes = new Map();
for (const [id, name, file, side, role] of supportingGeometryDefinitions) {
  const r = report.results.find((v) => v.fmaId === id);
  const definition = inventory.records.find(
    (v) => v.tree === 'isa' && v.id === id,
  );
  same([r.name, r.file, r.expectedSide, r.role], [name, file, side, role]);
  same([definition.name, definition.files], [name, [file]]);
  same(
    definition.status,
    role === 'held-control' ? 'held-source-review' : 'unused-available',
  );
  same(r.admitted, false);
  same(r.clinicalValidation, false);
  same(r.sideCentrePass, role === 'candidate');
  same(r.oppositeSideVertices, role === 'candidate' ? 0 : r.vertices);
  same(r.degenerateTriangles, 0);
  same(r.renderedOwners, []);
  same(r.exactRenderedMatches, []);
  same(
    r.aliases,
    inventory.records
      .filter((v) => v.files.includes(file))
      .map((v) => ({
        tree: v.tree,
        id: v.id,
        name: v.name,
        componentCount: v.files.length,
        candidateFiles: v.files.filter((f) => f === file),
        recordSha256: hash(JSON.stringify(v)),
      })),
  );
  same(
    r.holds,
    r.aliases
      .filter((v) => baseline.inventoryHolds[v.id])
      .map((v) => ({ id: v.id, reason: baseline.inventoryHolds[v.id] })),
  );
  // This milestone is evidence only: do not quietly admit an alias or alternative.
  same(
    currentCatalog.structures.some((s) =>
      s.sources.some((f) => f.file === file),
    ),
    false,
  );
  if (rawSourceCheck) {
    const bytes = await fs.readFile(`${cache}/isa/${file}.obj`),
      shape = sourceObjShape(bytes);
    same(hash(bytes), r.sha256);
    same(bytes.length, r.bytes);
    same(geometryFingerprint(bytes), r.geometrySha256);
    same(shape.min, r.bounds.min);
    same(shape.max, r.bounds.max);
    same(shape.centre, r.centre);
    same(shape.extent, r.extent);
    same(shape.vertices.length, r.vertices);
    same(shape.faces.length, r.triangles);
    same(shape.triangles.filter((t) => t.degenerate).length, 0);
    same(
      shape.vertices.filter((v) => (side === 'right' ? v[0] >= 0 : v[0] <= 0))
        .length,
      r.oppositeSideVertices,
    );
    shapes.set(id, shape);
  }
}

const inverse = new Matrix4()
  .fromArray(catalog.coordinateSystem.sourceToSceneColumnMajor)
  .invert();
const expectedKeys = new Set();
let nearby = 0;
for (const row of report.screened) {
  const s = catalog.structures.find((v) => v.fmaId === row.id);
  check(s);
  same(hash(JSON.stringify(s)), row.recordSha256);
  const box = new Box3(
    new Vector3(...s.bounds.min),
    new Vector3(...s.bounds.max),
  ).applyMatrix4(inverse);
  const envelope = {
    min: box.min.toArray(),
    max: box.max.toArray(),
    extent: box.getSize(new Vector3()).toArray(),
  };
  same(
    row.nearCandidates,
    report.results
      .filter((c) => sourceBoundsNear(c.bounds, envelope, 1.01))
      .map((c) => c.fmaId),
  );
  same(
    row.translatedCandidates,
    ['muscles', 'connective'].includes(s.system)
      ? report.results
          .filter(
            (c) =>
              (c.expectedSide === s.laterality ||
                !['left', 'right'].includes(s.laterality)) &&
              shapeCandidate(c, envelope),
          )
          .map((c) => c.fmaId)
      : [],
  );
  for (const id of row.nearCandidates) expectedKeys.add(id + '/' + row.id);
  if (row.nearCandidates.length || row.translatedCandidates.length) {
    nearby++;
    if (rawSourceCheck) {
      const parts = [];
      for (const f of s.sources) {
        const bytes = await fs.readFile(
          `${cache}/${s.sourceTree}/${f.file}.obj`,
        );
        same(hash(bytes), f.sha256);
        parts.push(sourceObjShape(bytes));
      }
      shapes.set(s.fmaId, mergeSourceShapes(parts));
    }
  }
}
same(nearby, 109);
for (let i = 0; i < report.results.length; i++)
  for (let j = i + 1; j < report.results.length; j++) {
    const a = report.results[i],
      b = report.results[j];
    if (sourceBoundsNear(a.bounds, b.bounds, 1.01))
      expectedKeys.add(a.fmaId + '/' + b.fmaId);
    // No pair qualified for translation diagnostics in this exact dataset.
    same(a.expectedSide === b.expectedSide && shapeCandidate(a, b), false);
  }
const keys = new Set();
for (const r of report.comparisons) {
  check(!keys.has(r.a + '/' + r.b));
  keys.add(r.a + '/' + r.b);
  same(r.exactTriangles, 0);
  for (const d of [r.aToB, r.bToA]) {
    check(d.samples > 0 && d.samples <= 128);
    check(Number.isFinite(d.medianMm) && d.medianMm >= 0);
    check(Number.isFinite(d.maxMm) && d.maxMm >= d.medianMm);
    check(
      d.withinTenthMm <= d.withinQuarterMm &&
        d.withinQuarterMm <= d.withinOneMm &&
        d.withinOneMm <= d.samples,
    );
    same(d.closePointBounds !== null, d.withinQuarterMm > 0);
  }
  same(
    r.flagged,
    [r.aToB, r.bToA].some((d) => d.withinQuarterMm / d.samples >= 0.25),
  );
  if (rawSourceCheck) {
    same(compareSourceSurfaces(shapes.get(r.a), shapes.get(r.b)), {
      exactTriangles: r.exactTriangles,
      aToB: r.aToB,
      bToA: r.bToA,
      flagged: r.flagged,
    });
    recomputedSurfacePairs++;
  }
}
same([...keys].sort(compare), [...expectedKeys].sort(compare));
same(
  report.comparisons
    .filter((r) => r.flagged)
    .map((r) => r.a + '/' + r.b)
    .sort(compare),
  [
    'FMA54159/FMA49048',
    'FMA54159/FMA59091',
    'FMA65198/FMA37390',
    'FMA65198/FMA40120',
    'FMA65199/FMA37391',
    'FMA65199/FMA40121',
  ].sort(compare),
);
for (const id of ['FMA37388', 'FMA37389'])
  same(
    currentInventory.records.find((r) => r.tree === 'isa' && r.id === id)
      .status,
    'held-source-review',
  );
const result = {
  passed: true,
  checks,
  rawSourceCheck,
  recomputedSurfacePairs,
  sourceCandidates: 4,
  heldControls: 2,
  screenedRecords: 1022,
  nearbySources: nearby,
  consideredPairs: 6147,
  comparedPairs: 167,
  flaggedPairs: 6,
  admitted: 0,
  holdsLifted: 0,
  clinicalValidation: false,
  sourceAuditSha256: hash(reportRaw),
  limitations:
    'Pinned complete historical evidence and conservative screening; optional exact raw-source reproduction of all 167 sampled near-surface comparisons. Proximity and source labels do not establish anatomical correctness or attachments. No meshes are imported, repaired or relabelled.',
};
await fs.writeFile(
  'docs/supporting-geometry-validation.json',
  JSON.stringify(result, null, 2) + '\n',
);
console.log(result);
