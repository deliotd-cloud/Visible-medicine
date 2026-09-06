import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  legacySource,
  legacyBase,
  objBounds,
} from './audit-legacy-anatomy.mjs';
import { parallelMap } from './bodyparts-archive.mjs';
const sha = (b) => createHash('sha256').update(b).digest('hex');
const catalogBytes = await fs.readFile(
  'public/models/bodyparts3d/full-body/catalog.json',
);
const catalog = JSON.parse(catalogBytes);
const inventory = JSON.parse(
  await fs.readFile('content/source-inventory.json', 'utf8'),
);
const source = await legacySource();
const candidates = [
  ['FMA13377', 'right rectus abdominis'],
  ['FMA13378', 'left rectus abdominis'],
  ['FMA13892', 'right internal oblique'],
  ['FMA13893', 'left internal oblique'],
  ['FMA22344', 'right transversus abdominis'],
  ['FMA22345', 'left transversus abdominis'],
];
const results = await parallelMap(candidates, 3, async ([fmaId, name]) => {
  assert.equal(source.names.get(fmaId), name);
  assert(!catalog.structures.some((s) => s.fmaId === fmaId));
  assert(
    !inventory.records.some((r) => r.id === fmaId),
    'New v4 definition now exists: re-audit the decision',
  );
  const files = source.resolve(fmaId);
  const components = await Promise.all(
    files.map(async (file) => {
      const bytes = await source.zip.get(file);
      return { file, sha256: sha(bytes), bounds: objBounds(bytes) };
    }),
  );
  return {
    fmaId,
    name,
    currentV4Definitions: [],
    legacyV3Components: components,
    admitted: false,
    reason:
      'Version-3-only candidate; correspondence, attachment landmarks and a validated local registration to the current version-4 model are absent.',
  };
});
const controls = await parallelMap(
  ['FMA16586', 'FMA13074', 'FMA24474'],
  3,
  async (fmaId) => {
    const current = catalog.structures.find((s) => s.fmaId === fmaId);
    assert(current);
    const parts = await Promise.all(
      source.resolve(fmaId).map(async (file) => {
        const b = await source.zip.get(file);
        return { file, sha256: sha(b), bounds: objBounds(b) };
      }),
    );
    const legacyBounds = {
      min: [0, 1, 2].map((k) => Math.min(...parts.map((p) => p.bounds.min[k]))),
      max: [0, 1, 2].map((k) => Math.max(...parts.map((p) => p.bounds.max[k]))),
    };
    const currentSourceBounds = {
      min: [
        current.bounds.min[0] * 100,
        -current.bounds.max[2] * 100 - 50,
        current.bounds.min[1] * 100 + 800,
      ],
      max: [
        current.bounds.max[0] * 100,
        -current.bounds.min[2] * 100 - 50,
        current.bounds.max[1] * 100 + 800,
      ],
    };
    return {
      fmaId,
      name: current.sourceName,
      legacyParts: parts,
      legacyBounds,
      currentSourceBounds,
      boundingCenterDeltaMm: [0, 1, 2].map(
        (k) =>
          (currentSourceBounds.min[k] +
            currentSourceBounds.max[k] -
            legacyBounds.min[k] -
            legacyBounds.max[k]) /
          2,
      ),
    };
  },
);
const wallAliases = inventory.records
  .filter((r) => ['FMA20278', 'FMA14627', 'FMA78435'].includes(r.id))
  .map((r) => ({
    tree: r.tree,
    id: r.id,
    name: r.name,
    files: r.files,
    representedBy: r.representedBy,
  }));
for (const alias of wallAliases) {
  assert.deepEqual(
    [...alias.files].sort((a, b) => a.localeCompare(b)),
    ['FJ1452', 'FJ1452M'],
  );
  assert(
    alias.representedBy.every((id) =>
      catalog.structures.some(
        (s) => s.id === id && /external oblique/.test(s.sourceName),
      ),
    ),
  );
}
const report = {
  schemaVersion: 1,
  date: '2026-09-06',
  catalogSha256: sha(catalogBytes),
  currentVersion: '4.0',
  legacyVersion: '3.0',
  legacySource: legacyBase,
  currentSourceTables: inventory.tables,
  results,
  wallAliases,
  controls,
  limitation:
    'Bounding-box centres are diagnostic comparisons, not homologous landmarks. These checks neither fit nor validate a registration. General anterior-wall aliases do not establish missing individual muscles. No legacy mesh is bundled, no model is deformed and no clinical approval is implied.',
};
await fs.writeFile(
  'content/abdominal-wall-audit.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log({
  heldLegacyCandidates: results.length,
  unchangedCatalog: sha(catalogBytes),
  controls: controls.map((c) => ({
    name: c.name,
    boundingCenterDeltaMm: c.boundingCenterDeltaMm,
  })),
  legacyMeshesBundled: 0,
});
