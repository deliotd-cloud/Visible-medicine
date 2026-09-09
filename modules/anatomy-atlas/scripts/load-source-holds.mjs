import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import {
  parseSourceTables,
  inventoryHolds,
  reconcileInventory,
} from './anatomy-inventory.mjs';
import { createSourceHoldPolicy } from './source-hold-policy.mjs';

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
export async function loadSourceHolds() {
  const inventoryBytes = await readFile('content/source-inventory.json');
  const inventory = JSON.parse(inventoryBytes);
  const catalogBytes = await readFile(
    'public/models/bodyparts3d/full-body/catalog.json',
  );
  const catalog = JSON.parse(catalogBytes);
  assert.equal(inventory.sourceVersion, '4.0');
  assert.equal(
    inventory.catalogSha256,
    hash(catalogBytes.toString().replace(/\r\n/g, '\n')),
    'Source inventory is stale',
  );
  const trees = {};
  for (const tree of ['isa', 'partof']) {
    const tables = [];
    for (const name of [
      `${tree}_parts_list_e.txt`,
      `${tree}_element_parts.txt`,
    ]) {
      const path = `LICENSES/bodyparts3d-v4-index/${name}`;
      const evidence = inventory.tables.filter(
        (t) => t.name === name && t.path === path,
      );
      assert.equal(
        evidence.length,
        1,
        'Missing or ambiguous pinned source table',
      );
      const bytes = await readFile(path);
      assert.equal(
        bytes.length,
        evidence[0].bytes,
        'Source table size changed',
      );
      assert.equal(
        hash(bytes),
        evidence[0].sha256,
        'Source table hash changed',
      );
      tables.push(bytes.toString());
    }
    trees[tree] = parseSourceTables(...tables);
  }
  const current = reconcileInventory({
    trees,
    catalog,
    assets: inventory.assets,
  });
  assert.deepEqual(
    current.records,
    inventory.records,
    'Source hold inventory needs reconciliation',
  );
  const records = Object.entries(trees).flatMap(([tree, rows]) =>
    rows.map((row) => ({ ...row, tree })),
  );
  const policy = createSourceHoldPolicy(records);
  return {
    policy,
    inventory,
    catalog,
    records,
    evidence: {
      sourceVersion: '4.0',
      inventorySha256: hash(inventoryBytes),
      catalogSha256: inventory.catalogSha256,
      holdsSha256: hash(JSON.stringify(inventoryHolds)),
      tables: inventory.tables.map(({ name, sha256 }) => ({ name, sha256 })),
    },
  };
}
