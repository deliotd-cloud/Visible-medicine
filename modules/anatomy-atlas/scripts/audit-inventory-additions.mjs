import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import {
  conceptMap,
  archiveReader,
  parallelMap,
} from './bodyparts-archive.mjs';
import { inventorySelections } from './inventory-selections.mjs';
import { objBounds } from './audit-legacy-anatomy.mjs';
import { geometryFingerprint, inventoryHolds } from './anatomy-inventory.mjs';
const [isa, partof, isaZip, partofZip] = await Promise.all([
  conceptMap('isa'),
  conceptMap('partof'),
  archiveReader('isa'),
  archiveReader('partof'),
]);
const catalog = JSON.parse(
  await fs.readFile('public/models/bodyparts3d/full-body/catalog.json', 'utf8'),
);
const baseline = JSON.parse(
  await fs.readFile('content/inventory-baseline.json', 'utf8'),
);
const baselineIds = new Set(baseline.structures.map((s) => s.id));
const inventory = JSON.parse(
  await fs.readFile('content/source-inventory.json', 'utf8'),
);
const renderedGeometry = new Set(
  inventory.assets
    .filter((a) => a.representedBy.some((id) => baselineIds.has(id)))
    .map((a) => a.geometrySha256),
);
const report = await parallelMap(
  inventorySelections(isa, partof),
  6,
  async (r) => {
    if (inventoryHolds[r.fma]) throw Error('Held identity cannot be admitted');
    const bytes = await (r.tree === 'isa' ? isaZip : partofZip).get(r.files[0]);
    const bounds = objBounds(bytes),
      geometrySha256 = geometryFingerprint(bytes);
    const sourceOverlap = catalog.structures
      .filter(
        (s) =>
          baselineIds.has(s.id) &&
          s.sources.some((f) => r.files.includes(f.file)),
      )
      .map((s) => s.id);
    const x = (bounds.min[0] + bounds.max[0]) / 2;
    if (sourceOverlap.length || renderedGeometry.has(geometrySha256))
      throw Error('Source already represented: ' + r.name);
    if (
      !bounds.vertices ||
      [...bounds.min, ...bounds.max].some((v) => !Number.isFinite(v))
    )
      throw Error('Invalid coordinates');
    if (
      (/\bright\b/.test(r.name) && x >= 0) ||
      (/\bleft\b/.test(r.name) && x <= 0)
    )
      throw Error('Laterality mismatch: ' + r.name);
    return {
      ...r,
      sourceSha256: createHash('sha256').update(bytes).digest('hex'),
      geometrySha256,
      bounds,
      sourceOverlap,
      clinicalValidation: false,
    };
  },
);
await fs.writeFile(
  '../work/inventory-additions-audit.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(
  report
    .map(
      (r) =>
        r.fma +
        ' | ' +
        r.name +
        ' | ' +
        r.bounds.min.map((v) => v.toFixed(1)).join(',') +
        ' → ' +
        r.bounds.max.map((v) => v.toFixed(1)).join(','),
    )
    .join('\n'),
);
console.log(
  'Candidates passing source/identity/bounds checks: ' +
    report.length +
    '. This is not clinical validation.',
);
