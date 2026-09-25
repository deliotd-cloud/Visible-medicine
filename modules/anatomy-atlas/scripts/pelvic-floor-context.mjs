// Offline, source-coordinate context for the held pelvic-floor review only.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { buildPelvicFloorReview } from './pelvic-floor-review.mjs';
import { loadCurrentSourceHolds } from './current-source-holds.mjs';
import { inspectSourceBytes, sha256 } from './source-geometry-screen.mjs';
import { sourceObjShape } from './source-surface-audit.mjs';

export const pinnedPelvicFloorMeasurementsSha256 =
  'b91aae4bcf46ec25459ebba2456df4cdfcc5c1267104543b173ee31d46ea1999';
export const pinnedPelvicFloorCatalogSha256 =
  '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7';

export const pelvicFloorContextDefinitions = Object.freeze([
  { id: 'FMA16586', name: 'Right hip bone', sourceName: 'right hip bone', file: 'FJ3152', category: 'bone', sha256: '99de26e5435a8397b6f39b44ada75319d5e8fa1433e1ea38fdd8de9e079ed9a9' },
  { id: 'FMA16587', name: 'Left hip bone', sourceName: 'left hip bone', file: 'FJ3288', category: 'bone', sha256: 'bfc8b489fee0945cd1d387cf64bd3691af8e033fa72f9fccae45cfd55ac88694' },
  { id: 'FMA16202', name: 'Sacrum', sourceName: 'sacrum', file: 'FJ3393', category: 'bone', sha256: 'cd04cc9f78d758ba34e92896914f647d22d257b9e7e51b97764670f694033489' },
  { id: 'FMA22324', name: 'Right obturator internus', sourceName: 'right obturator internus', file: 'FJ1426', category: 'muscle', sha256: '977a261dc98ce11a53282b2400b4b1f89160000c5e254bbd1755b26bbbab8ed4' },
  { id: 'FMA22325', name: 'Left obturator internus', sourceName: 'left obturator internus', file: 'FJ1426M', category: 'muscle', sha256: '48e688da5e4d5ce01ff70dbedcf4b6232a4a2f64295ee5c8d89f8b4ee7b3889c' },
]);

export function selectPelvicFloorContext(context) {
  assert.equal(context.evidence.catalogSha256, pinnedPelvicFloorCatalogSha256, 'Pinned catalogue digest changed');
  assert.equal(context.inventory.catalogSha256, pinnedPelvicFloorCatalogSha256, 'Inventory catalogue digest changed');
  return pelvicFloorContextDefinitions.map((expected) => {
    const structures = context.catalog.structures.filter((s) => s.fmaId === expected.id);
    assert.equal(structures.length, 1, `Missing or duplicate catalogue context ${expected.id}`);
    const [structure] = structures;
    assert.equal(structure.name, expected.name, `Catalogue context name changed: ${expected.id}`);
    assert.equal(structure.sourceName, expected.sourceName, `Catalogue source name changed: ${expected.id}`);
    assert.equal(structure.sourceTree, 'isa', `Catalogue source tree changed: ${expected.id}`);
    assert.equal(structure.category, expected.category, `Catalogue category changed: ${expected.id}`);
    assert.deepEqual(structure.sources, [{ file: expected.file, sha256: expected.sha256 }], `Catalogue source file/hash changed: ${expected.id}`);
    assert.equal(structure.provenance?.sourceVersion, '4.0', 'Catalogue source version changed');
    assert.equal(structure.provenance?.license, context.inventory.license, 'Catalogue licence changed');
    const records = context.inventory.records.filter((r) => r.tree === 'isa' && r.id === expected.id);
    assert.equal(records.length, 1, `Missing or duplicate inventory context ${expected.id}`);
    const [record] = records;
    assert.equal(record.name, expected.sourceName, `Inventory context name changed: ${expected.id}`);
    assert.deepEqual(record.files, [expected.file], `Inventory context component changed: ${expected.id}`);
    assert.equal(record.status, 'admitted', `Inventory context status changed: ${expected.id}`);
    assert.equal(record.displayedId, structure.id, `Inventory context catalogue ID changed: ${expected.id}`);
    const sourceRecords = context.records.filter((r) => r.tree === 'isa' && r.id === expected.id);
    assert.equal(sourceRecords.length, 1, `Missing or duplicate indexed source context ${expected.id}`);
    assert.equal(sourceRecords[0].name, expected.sourceName, `Indexed source name changed: ${expected.id}`);
    assert.deepEqual(sourceRecords[0].files, [expected.file], `Indexed source component changed: ${expected.id}`);
    assert.equal(context.policy.inspect(sourceRecords[0]).status, 'no-known-source-hold', 'Context source is currently held');
    const assets = context.inventory.assets.filter((a) => a.tree === 'isa' && a.file === expected.file);
    assert.equal(assets.length, 1, `Missing or duplicate original OBJ inventory ${expected.file}`);
    const [asset] = assets;
    assert.equal(asset.sha256, expected.sha256, `Original OBJ inventory hash changed: ${expected.file}`);
    assert.deepEqual(asset.representedBy, [structure.id], `Original OBJ representation changed: ${expected.file}`);
    assert.match(asset.geometrySha256, /^[a-f0-9]{64}$/, `Missing indexed geometry fingerprint: ${expected.file}`);
    return { ...expected, tree: 'isa', catalogueId: structure.id, asset };
  });
}

export function inspectPelvicFloorContextComponent(definition, bytes, inventory) {
  const { asset } = definition;
  const checked = inspectSourceBytes({ tree: 'isa', file: definition.file,
    bytes: asset.bytes, crc32: asset.crc32, candidateFor: [] }, bytes, inventory);
  assert.equal(checked.sha256, definition.sha256, `Original OBJ hash changed: ${definition.file}`);
  assert.equal(checked.geometrySha256, asset.geometrySha256, `Indexed geometry fingerprint changed: ${definition.file}`);
  const shape = sourceObjShape(bytes);
  assert.deepEqual({ min: shape.min, max: shape.max }, checked.bounds, `Source bounds changed: ${definition.file}`);
  assert.equal(shape.vertices.length, checked.vertices);
  assert.equal(shape.faces.length, checked.triangles);
  return {
    entry: { tree: 'isa', id: definition.id, name: definition.name, sourceName: definition.sourceName,
      catalogueId: definition.catalogueId, category: definition.category, file: definition.file,
      bytes: checked.bytes, crc32: checked.crc32, sha256: checked.sha256,
      geometrySha256: checked.geometrySha256, bounds: checked.bounds,
      vertices: checked.vertices, triangles: checked.triangles,
      role: 'existing-atlas-context', clinicalApprovalForPelvicFloor: false },
    shape: { tree: 'isa', id: definition.id, name: definition.name, category: definition.category,
      file: definition.file, vertices: shape.vertices, faces: shape.faces,
      min: shape.min, max: shape.max, centre: shape.centre, extent: shape.extent,
      triangles: shape.triangles },
  };
}

export async function buildPelvicFloorContext({ cacheRoot = resolve('../work/bodyparts3d') } = {}) {
  const [{ report: heldReport, shapes: candidateShapes }, context] = await Promise.all([
    buildPelvicFloorReview({ cacheRoot }), loadCurrentSourceHolds(),
  ]);
  const heldBytes = Buffer.from(`${JSON.stringify(heldReport, null, 2)}\n`);
  assert.equal(sha256(heldBytes), pinnedPelvicFloorMeasurementsSha256, 'Held measurement revision changed');
  assert.deepEqual(heldBytes, await readFile('docs/reviews/pelvic-floor/measurements.json'), 'Saved held measurements changed');
  assert.deepEqual(heldReport.evidence.catalogSha256, context.evidence.catalogSha256, 'Context catalogue differs from held review');
  const definitions = selectPelvicFloorContext(context);
  const inspected = [];
  for (const definition of definitions) {
    const bytes = await readFile(join(cacheRoot, 'isa', `${definition.file}.obj`));
    inspected.push(inspectPelvicFloorContextComponent(definition, bytes, context.inventory));
  }
  return {
    report: { ...heldReport, context: inspected.map((item) => item.entry),
      contextHoldEvidence: context.supplementalEvidence,
      contextLimitations: [
        'Context is existing Atlas source geometry, not newly approved pelvic-floor anatomy or a clinical assessment.',
        'All candidate and context OBJ coordinates are original source coordinates without registration, reflection, repair or transform.',
        'No separately identified coccyx bone is supplied in this context set; this is not a claim that the sacrum source lacks a coccygeal extension. No substitute is inferred.',
        'Projected proximity does not validate attachment, tissue boundaries, source laterality or completeness. Held pelvic-floor definitions remain held pending revision-bound radiologist adjudication.',
      ],
      contextClinicalApproval: false,
    },
    candidateShapes,
    contextShapes: inspected.map((item) => item.shape),
  };
}
