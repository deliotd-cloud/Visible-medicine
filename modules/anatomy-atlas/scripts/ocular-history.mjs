import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { reconcileInventory } from './anatomy-inventory.mjs';

const hash = (b) => createHash('sha256').update(b).digest('hex');
// Reconstruct the exact pinned pre-admission evidence without Site Git history.
// Never trust a reconstruction unless its complete serialized hash agrees.
export function ocularHistory(catalog, inventory, baseline, preparation) {
  const structures = baseline.structures.map((old) => {
    const current = catalog.structures.find((s) => s.id === old.id);
    assert.equal(hash(JSON.stringify(current)), old.sha256);
    return current;
  });
  const historicalCatalog = {
    ...catalog,
    structures,
    bundles: baseline.bundles,
  };
  const catalogRaw = Buffer.from(JSON.stringify(historicalCatalog, null, 2));
  assert.equal(hash(catalogRaw), baseline.catalogSha256);
  const newFiles = new Set(preparation.results.map((r) => r.file));
  const trees = Object.fromEntries(
    ['isa', 'partof'].map((tree) => [
      tree,
      inventory.records
        .filter((r) => r.tree === tree)
        .map(({ id, name, representation, files }) => ({
          id,
          name,
          representation,
          files,
        })),
    ]),
  );
  const assets = inventory.assets.map(({ representedBy: _owners, ...asset }) =>
    newFiles.has(asset.file)
      ? { ...asset, sha256: null, geometrySha256: null }
      : asset,
  );
  const historicalInventory = {
    ...inventory,
    catalogSha256: baseline.catalogSha256,
    ...reconcileInventory({ trees, catalog: historicalCatalog, assets }),
  };
  const inventoryRaw = Buffer.from(
    JSON.stringify(historicalInventory, null, 2) + '\n',
  );
  assert.equal(hash(inventoryRaw), preparation.inventorySha256);
  return {
    catalog: historicalCatalog,
    inventory: historicalInventory,
    catalogRaw,
    inventoryRaw,
  };
}
