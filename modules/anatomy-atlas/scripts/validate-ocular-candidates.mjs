import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { inventoryHolds, geometryFingerprint } from './anatomy-inventory.mjs';
import { cache } from './bodyparts-archive.mjs';
import { objBounds } from './audit-legacy-anatomy.mjs';
import { ocularHistory } from './ocular-history.mjs';
const hash = (b) => createHash('sha256').update(b).digest('hex');
let assertions = 0;
const same = (a, b, m) => {
  assertions++;
  assert.deepEqual(a, b, m);
};
const check = (v, m) => {
  assertions++;
  assert(v, m);
};
const raw = await fs.readFile('content/ocular-candidate-audit.json'),
  audit = JSON.parse(raw);
const currentCatalogRaw = await fs.readFile(
  'public/models/bodyparts3d/full-body/catalog.json',
);
const currentInventoryRaw = await fs.readFile('content/source-inventory.json');
const baseline = JSON.parse(await fs.readFile('content/ocular-baseline.json'));
same(
  hash(raw),
  'e09479a5aefaa62d71a9c7e261131423952b8a9203dc41a37e86247b71bb5d6e',
);
const { catalog, inventory, catalogRaw, inventoryRaw } = ocularHistory(
  JSON.parse(currentCatalogRaw),
  JSON.parse(currentInventoryRaw),
  baseline,
  audit,
);
same(
  hash(catalogRaw),
  'b9888bf57e7eee61638c2c6920677fe3e6b6bd55ad97df3d19f45829865c13d5',
);
same(audit.catalogSha256, hash(catalogRaw));
same(audit.inventorySha256, hash(inventoryRaw));
same(audit.sourceCommit, '12bf83e1a520be2565109f87c8d406be6ea5c3e0');
same(audit.sourceVersion, '4.0');
same(audit.license, inventory.license);
same(audit.credit, inventory.credit);
same(
  audit.sourceTableSha256,
  inventory.tables.find((t) => t.name === 'isa_element_parts.txt').sha256,
);
same(audit.admissionsChanged, false);
same(audit.clinicalValidation, false);
same(
  audit.results.map((r) => r.fmaId),
  [
    'FMA59582',
    'FMA59583',
    'FMA59555',
    'FMA59556',
    'FMA59545',
    'FMA59546',
    'FMA59091',
    'FMA59092',
    'FMA59089',
    'FMA59090',
  ],
);
same(new Set(audit.results.map((r) => r.file)).size, 10);
same(audit.crossCandidateMatches, []);
const rawCheck = process.argv.includes('--raw');
for (const r of audit.results) {
  const definition = inventory.records.find(
    (s) => s.tree === 'isa' && s.id === r.fmaId,
  );
  same(r.name, definition.name);
  same([r.file], definition.files);
  same(definition.status, 'unused-available');
  same(
    r.aliases,
    inventory.records
      .filter((s) => s.files.includes(r.file))
      .map((s) => ({
        tree: s.tree,
        id: s.id,
        name: s.name,
        componentCount: s.files.length,
        candidateFiles: s.files.filter((f) => f === r.file),
        recordSha256: hash(JSON.stringify(s)),
      })),
  );
  same(
    r.holds,
    r.aliases
      .filter((s) => inventoryHolds[s.id])
      .map((s) => ({ id: s.id, reason: inventoryHolds[s.id] })),
  );
  same(
    r.renderedOwners,
    catalog.structures
      .filter((s) => s.sources.some((f) => f.file === r.file))
      .map((s) => s.id),
  );
  same(
    r.exactRenderedMatches,
    inventory.assets
      .filter(
        (s) => s.geometrySha256 === r.geometrySha256 && s.representedBy.length,
      )
      .map((s) => ({
        tree: s.tree,
        file: s.file,
        representedBy: s.representedBy,
      })),
  );
  same(r.admitted, false);
  same(r.decision, 'adjacency-and-extent-audit-required');
  same(r.renderedOwners, []);
  same(r.exactRenderedMatches, []);
  same(r.holds, []);
  check(r.bytes > 0 && r.vertices > 0 && r.triangles > 0);
  check(/^[a-f0-9]{64}$/.test(r.sha256));
  check(/^[a-f0-9]{64}$/.test(r.geometrySha256));
  check(
    [
      ...r.sourceBounds.min,
      ...r.sourceBounds.max,
      ...r.sourceCentre,
      ...r.sourceExtent,
    ].every(Number.isFinite),
  );
  same(
    r.sourceCentre,
    r.sourceBounds.min.map((n, k) => (n + r.sourceBounds.max[k]) / 2),
  );
  same(
    r.sourceExtent,
    r.sourceBounds.max.map((n, k) => n - r.sourceBounds.min[k]),
  );
  same(r.expectedSide, /\bright\b/.test(r.name) ? 'right' : 'left');
  same(
    r.lateralityMatchesSourceConvention,
    r.expectedSide === 'right' ? r.sourceCentre[0] < 0 : r.sourceCentre[0] > 0,
  );
  if (rawCheck) {
    const source = await fs.readFile(cache + '/isa/' + r.file + '.obj');
    same(source.length, r.bytes);
    same(hash(source), r.sha256);
    same(geometryFingerprint(source), r.geometrySha256);
    const bounds = objBounds(source);
    same(bounds.min, r.sourceBounds.min);
    same(bounds.max, r.sourceBounds.max);
    same(bounds.vertices, r.vertices);
    same(
      source
        .toString()
        .split(/\r?\n/)
        .filter((line) => line.trim().startsWith('f ')).length,
      r.triangles,
    );
  }
}
const result = {
  passed: true,
  scope:
    'Pinned pre-ocular-admission preparation; current admissions are tested separately',
  assertions,
  rawSourceCheck: rawCheck,
  candidates: audit.results.length,
  sourceBytes: audit.results.reduce((n, r) => n + r.bytes, 0),
  admitted: 0,
  sourceGeometryChanged: false,
  clinicalValidation: false,
  catalogSha256: hash(catalogRaw),
  auditSha256: hash(raw),
  limitations:
    'Identity, alias, component-owner and exact fingerprint checks only. Raw hashes/bounds/face counts are recomputed with --raw; no near-surface or anatomical relationship/continuity validation is asserted.',
};
await fs.writeFile(
  'docs/ocular-candidate-validation.json',
  JSON.stringify(result, null, 2) + '\n',
);
console.log(result);
