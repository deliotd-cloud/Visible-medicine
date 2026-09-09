import { writeFile } from 'node:fs/promises';
import { loadSourceHolds } from './load-source-holds.mjs';

export async function auditSourceHolds() {
  const { policy, inventory, catalog, records, evidence } =
    await loadSourceHolds();
  const affected = records
    .filter((r) => r.files.length)
    .flatMap((record) => {
      const result = policy.inspect(record);
      if (result.status !== 'blocked-known-source-hold') return [];
      const previous = inventory.records.find(
        (r) => r.tree === record.tree && r.id === record.id,
      );
      return [
        {
          tree: record.tree,
          id: record.id,
          name: record.name,
          inventoryStatus: previous.status,
          directHold: Boolean(result.directReason),
          components: result.components,
        },
      ];
    });
  const displayed = catalog.structures.map((s) => ({
    tree: s.sourceTree,
    id: s.fmaId,
    name: s.sourceName,
    files: s.sources.map((f) => f.file),
  }));
  policy.assertNoKnownHolds(displayed);
  const heldKeys = new Set(
    affected.flatMap((r) => r.components.map((c) => `${r.tree}/${c.file}`)),
  );
  const heldAssets = inventory.assets.filter((a) =>
    heldKeys.has(`${a.tree}/${a.file}`),
  );
  return {
    schemaVersion: 1,
    evidence,
    summary: {
      screenedDefinitions: records.length,
      blockedDefinitions: affected.length,
      directlyHeldDefinitions: affected.filter((r) => r.directHold).length,
      propagatedDefinitions: affected.filter((r) => !r.directHold).length,
      unusedAvailableWithComponentHolds: affected.filter(
        (r) => r.inventoryStatus === 'unused-available',
      ).length,
      heldTreeSpecificFiles: heldKeys.size,
      heldFilesWithExistingGeometryFingerprint: heldAssets.filter(
        (a) => a.geometrySha256,
      ).length,
      heldFilesWithoutGeometryFingerprint: heldAssets.filter(
        (a) => !a.geometrySha256,
      ).length,
      currentDisplayedDefinitionsWithoutKnownSameTreeHold: displayed.length,
    },
    affected,
    admissionApproved: false,
    geometryEquivalenceChecked: false,
    limitations: [
      'This separate report leaves the historical availability inventory unchanged. Available is not approved.',
      'Blocks explicit held concepts and exact held component IDs within the same source tree, including broader parent definitions and partial selections.',
      'Cross-archive filenames are not compared as geometry. Known and unknown cross-archive, reordered, translated and near-overlap aliases require a separate byte/geometry audit.',
      'Most held files lack fingerprints in the inventory. Missing hashes are unknown evidence, never clearance.',
      'The existing central-canal representation remains a space, not a whole spinal cord. This screen does not adjudicate that cross-archive source alias.',
      'Passing this screen does not validate laterality, boundaries, extent, licences, source version drift or clinical accuracy.',
    ],
  };
}

if (
  process.argv[1] &&
  new URL(import.meta.url).pathname.endsWith(
    '/' + process.argv[1].replaceAll('\\', '/').split('/').pop(),
  )
) {
  const report = await auditSourceHolds();
  await writeFile(
    'docs/source-hold-audit.json',
    JSON.stringify(report, null, 2) + '\n',
  );
  console.log(JSON.stringify(report.summary, null, 2));
}
