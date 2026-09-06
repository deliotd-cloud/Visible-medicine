import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import {
  parseSourceTables,
  reconcileInventory,
  geometryFingerprint,
  inventoryHolds,
} from './anatomy-inventory.mjs';
import { inventorySelections } from './inventory-selections.mjs';
import { applyJunctionTransition } from './junction-transition.mjs';
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
let checks = 0;
const same = (a, b, label) => {
  checks++;
  assert.deepEqual(a, b, label);
};
const check = (value, label) => {
  checks++;
  assert.ok(value, label);
};
const throws = (fn) => {
  checks++;
  assert.throws(fn);
};
const catalogBytes = await fs.readFile(
  'public/models/bodyparts3d/full-body/catalog.json',
);
const catalog = JSON.parse(catalogBytes);
const baseline = JSON.parse(
  await fs.readFile('content/inventory-baseline.json', 'utf8'),
);
const inventory = JSON.parse(
  await fs.readFile('content/source-inventory.json', 'utf8'),
);
const tables = {},
  trees = {};
for (const item of inventory.tables) {
  const text = await fs.readFile(item.path, 'utf8');
  same(hash(text), item.sha256, 'Exact official table evidence retained');
  same(Buffer.byteLength(text), item.bytes);
  tables[item.name] = text;
}
for (const tree of ['isa', 'partof'])
  trees[tree] = parseSourceTables(
    tables[tree + '_parts_list_e.txt'],
    tables[tree + '_element_parts.txt'],
  );
const reconciled = reconcileInventory({
  trees,
  catalog,
  assets: inventory.assets,
});
same(
  reconciled.summary,
  inventory.summary,
  'Every official source definition is reconciled',
);
same(reconciled.records, inventory.records, 'Classification is reproducible');
same(reconciled.assets, inventory.assets, 'Rendered ownership is reproducible');
same(
  inventory.catalogSha256,
  hash(catalogBytes.toString().replace(/\r\n/g, '\n')),
  'Inventory expires when the catalogue changes',
);
same(inventory.summary.conceptDefinitions, 4273);
same(inventory.summary.uniqueConceptIds, 3432);
same(inventory.assets.length, 3492);
same(inventory.summary.archiveEntriesWithoutConcept, 0);
same(new Set(inventory.records.map((r) => r.tree + '/' + r.id)).size, 4273);
same(new Set(inventory.assets.map((a) => a.tree + '/' + a.file)).size, 3492);
for (const r of inventory.records) {
  check(
    r.files.every((f) =>
      inventory.assets.some((a) => a.tree === r.tree && a.file === f),
    ),
    'Every source component has archive evidence',
  );
  if (inventoryHolds[r.id])
    same(r.status, 'held-source-review', 'Source holds survive reconciliation');
  if (r.status === 'admitted')
    check(r.displayedId && r.representedBy.includes(r.displayedId));
  if (r.status === 'unused-available')
    same(r.representedBy, [], 'Unused definitions never silently map by name');
}
same(
  catalog.coordinateSystem,
  baseline.coordinateSystem,
  'Source frame unchanged',
);
same(catalog.excluded, baseline.excluded, 'Existing quarantines preserved');
same(baseline.structures.length, 823);
same(baseline.bundles.length, 61);
await applyJunctionTransition(baseline, catalog);
for (const previous of baseline.structures) {
  const current = catalog.structures.find((s) => s.id === previous.id);
  check(current, 'Previously included identity retained');
  same(
    hash(JSON.stringify(current)),
    previous.sha256,
    'All original structure fields unchanged',
  );
}
for (const previous of baseline.bundles) {
  same(
    catalog.bundles.find((b) => b.id === previous.id),
    previous,
  );
  same(
    hash(
      await fs.readFile(
        'public/models/bodyparts3d/full-body/' + previous.id + '.glb',
      ),
    ),
    previous.sha256,
    'All original mesh bundles unchanged',
  );
}
const maps = Object.fromEntries(
  Object.entries(trees).map(([tree, rows]) => [
    tree,
    new Map(rows.map((r) => [r.id, r])),
  ]),
);
const additions = inventorySelections(maps.isa, maps.partof);
same(additions.length, 36);
same(catalog.structures.length, 925);
same(catalog.bundles.length, 74);
const baselineIds = new Set(baseline.structures.map((s) => s.id));
const newRecords = catalog.structures.filter(
  (s) => !baselineIds.has(s.id) && s.bundle.endsWith('-inventory'),
);
same(newRecords.length, 36);
for (const addition of additions) {
  const current = newRecords.find((s) => s.fmaId === addition.fma);
  check(current, 'Every deliberate admission is present');
  same(current.sourceName, addition.name);
  same(current.sourceTree, addition.tree);
  same(current.system, addition.system);
  same(current.region, addition.region);
  same(
    current.sources.map((s) => s.file),
    addition.files,
  );
  check(current.bundle.endsWith('-inventory'));
  same(current.provenance.license, 'CC-BY-4.0');
  same(current.provenance.sourceVersion, '4.0');
  same(current.validation, { status: 'unvalidated', anatomicalReview: false });
  const source = inventory.assets.find(
    (a) => a.tree === addition.tree && a.file === addition.files[0],
  );
  same(source.sha256, current.sources[0].sha256);
  check(source.geometrySha256);
  same(
    source.representedBy,
    [current.id],
    'No duplicate source geometry in the rendered atlas',
  );
  check(!Object.keys(inventoryHolds).includes(addition.fma));
  const selectedDefinitions = inventory.records.filter(
    (r) => r.id === current.fmaId && r.tree === current.sourceTree,
  );
  same(selectedDefinitions[0].status, 'admitted');
}
same(
  Object.fromEntries(
    ['vessels', 'organs', 'nerves'].map((system) => [
      system,
      newRecords.filter((s) => s.system === system).length,
    ]),
  ),
  { vessels: 29, organs: 5, nerves: 2 },
);
for (const id of Object.keys(inventoryHolds))
  check(
    !catalog.structures.some((s) => s.fmaId === id),
    'Held identity not admitted',
  );
// Parser and geometry identity contracts: headers/comments may differ, shape/winding may not.
const parts = 'concept id\trepresentation id\ten\nFMA1\tBP1\tExample\n';
const elements = 'concept id\tname\telement file id\nFMA1\tExample\tFJ1\n';
same(parseSourceTables(parts, elements)[0].files, ['FJ1']);
throws(() => parseSourceTables(parts, elements.replace('Example', 'Mismatch')));
throws(() => parseSourceTables(parts, elements.replace('FJ1', '../escape')));
throws(() => parseSourceTables(parts, elements + 'FMA1\tExample\tFJ1\n'));
throws(() => parseSourceTables(parts.replace('concept id', 'id'), elements));
const obj = 'v 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 3\n';
same(
  geometryFingerprint(obj),
  geometryFingerprint(
    '# different archive header\r\n' + obj.replaceAll('\n', '\r\n'),
  ),
);
same(
  geometryFingerprint(obj),
  geometryFingerprint(obj.replace('f 1 2 3', 'f 1/2/3 2/3/4 3/4/5')),
);
same(
  geometryFingerprint(obj),
  geometryFingerprint(obj.replace('f 1 2 3', 'f -3 -2 -1')),
);
check(
  geometryFingerprint(obj) !==
    geometryFingerprint(obj.replace('v 1 0 0', 'v 2 0 0')),
  'Coordinates are not rounded to force a match',
);
check(
  geometryFingerprint(obj) !==
    geometryFingerprint(obj.replace('f 1 2 3', 'f 3 2 1')),
  'Face winding preserved',
);
throws(() => geometryFingerprint(obj.replace('v 1 0 0', 'v NaN 0 0')));
throws(() => geometryFingerprint(obj + 'surf 1 2 3\n'));
const result = {
  passed: true,
  checks,
  conceptDefinitions: 4273,
  archiveEntries: 3492,
  preservedIdentities: 823,
  unchangedPriorRecords: 821,
  preservedBundles: 60,
  documentedJunctionChanges: { records: 2, bundles: 1 },
  newStructures: 36,
  newBundles: 5,
  newAssetBytes: catalog.bundles
    .filter((b) => b.id.endsWith('-inventory'))
    .reduce((sum, b) => sum + b.bytes, 0),
  sourceVersion: '4.0',
  license: 'CC-BY-4.0',
  clinicalValidation: false,
  browserInteractionTesting: false,
};
await fs.writeFile(
  'docs/inventory-validation.json',
  JSON.stringify(result, null, 2) + '\n',
);
console.log(JSON.stringify(result, null, 2));
