import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  archiveReader,
  parallelMap,
  sourceTable,
} from './bodyparts-archive.mjs';
import { geometryFingerprint, inventoryHolds } from './anatomy-inventory.mjs';
import { prepareShape } from './vessel-shape-math.mjs';
const hash = (b) => createHash('sha256').update(b).digest('hex');
const catalogRaw = await fs.readFile(
    'public/models/bodyparts3d/full-body/catalog.json',
  ),
  catalog = JSON.parse(catalogRaw);
const inventoryRaw = await fs.readFile('content/source-inventory.json'),
  inventory = JSON.parse(inventoryRaw);
assert.equal(
  hash(catalogRaw),
  'b9888bf57e7eee61638c2c6920677fe3e6b6bd55ad97df3d19f45829865c13d5',
);
assert.equal(inventory.catalogSha256, hash(catalogRaw));
const candidates = [
  ['FMA59582', 'FJ1349'],
  ['FMA59583', 'FJ1298'],
  ['FMA59555', 'FJ1353'],
  ['FMA59556', 'FJ1302'],
  ['FMA59545', 'FJ1360'],
  ['FMA59546', 'FJ1309'],
  ['FMA59091', 'FJ1375'],
  ['FMA59092', 'FJ1324'],
  ['FMA59089', 'FJ1379'],
  ['FMA59090', 'FJ1328'],
];
const table = inventory.tables.find((t) => t.name === 'isa_element_parts.txt');
assert.equal(
  hash(await sourceTable(table.name)),
  table.sha256,
  'Cached ISA definitions must match the committed official table',
);
const zip = await archiveReader('isa');
const results = await parallelMap(candidates, 4, async ([fmaId, file]) => {
  const definition = inventory.records.find(
    (r) => r.tree === 'isa' && r.id === fmaId,
  );
  assert(definition);
  assert.equal(definition.status, 'unused-available');
  assert.deepEqual(definition.files, [file]);
  const aliases = inventory.records
    .filter((r) => r.files.includes(file))
    .map((r) => ({
      tree: r.tree,
      id: r.id,
      name: r.name,
      componentCount: r.files.length,
      candidateFiles: r.files.filter((f) => f === file),
      recordSha256: hash(JSON.stringify(r)),
    }));
  const holds = aliases
    .filter((a) => inventoryHolds[a.id])
    .map((a) => ({ id: a.id, reason: inventoryHolds[a.id] }));
  const owners = catalog.structures.filter((s) =>
    s.sources.some((f) => f.file === file),
  );
  const raw = await zip.get(file),
    vertices = [],
    faces = [];
  for (const line of raw.toString().split(/\r?\n/)) {
    const fields = line.trim().split(/\s+/);
    if (fields[0] === 'v') vertices.push(fields.slice(1).map(Number));
    if (fields[0] === 'f')
      faces.push(
        fields.slice(1).map((field) => {
          const n = Number(field.split('/')[0]);
          return n < 0 ? vertices.length + n : n - 1;
        }),
      );
  }
  const shape = prepareShape(vertices, faces),
    fingerprint = geometryFingerprint(raw);
  const exactRenderedMatches = inventory.assets
    .filter((a) => a.geometrySha256 === fingerprint && a.representedBy.length)
    .map((a) => ({
      tree: a.tree,
      file: a.file,
      representedBy: a.representedBy,
    }));
  const expectedSide = /\bright\b/.test(definition.name)
    ? 'right'
    : /\bleft\b/.test(definition.name)
      ? 'left'
      : 'unspecified';
  const lateralityMatches =
    expectedSide === 'right'
      ? shape.centre[0] < 0
      : expectedSide === 'left'
        ? shape.centre[0] > 0
        : null;
  const result = {
    fmaId,
    name: definition.name,
    file,
    sourceUrl: zip.source,
    bytes: raw.length,
    sha256: hash(raw),
    geometrySha256: fingerprint,
    vertices: vertices.length,
    triangles: faces.length,
    degenerateTriangles: shape.triangles.filter((t) => t.degenerate).length,
    sourceBounds: { min: shape.min, max: shape.max },
    sourceCentre: shape.centre,
    sourceExtent: shape.extent,
    expectedSide,
    lateralityMatchesSourceConvention: lateralityMatches,
    aliases,
    holds,
    renderedOwners: owners.map((s) => s.id),
    exactRenderedMatches,
    admitted: false,
    decision: holds.length
      ? 'existing-hold-applies'
      : owners.length || exactRenderedMatches.length
        ? 'rendered-owner-or-exact-shape-review-required'
        : lateralityMatches === false
          ? 'laterality-review-required'
          : 'adjacency-and-extent-audit-required',
  };
  console.log(
    JSON.stringify({
      fmaId,
      file,
      vertices: result.vertices,
      triangles: result.triangles,
      decision: result.decision,
    }),
  );
  return result;
});
const crossCandidateMatches = results.flatMap((a, i) =>
  results
    .slice(i + 1)
    .filter((b) => b.geometrySha256 === a.geometrySha256)
    .map((b) => [a.fmaId, b.fmaId]),
);
const report = {
  sourceCommit: '12bf83e1a520be2565109f87c8d406be6ea5c3e0',
  sourceVersion: '4.0',
  checked: '2026-09-06',
  catalogSha256: hash(catalogRaw),
  inventorySha256: hash(inventoryRaw),
  sourceTableSha256: table.sha256,
  license: inventory.license,
  credit: inventory.credit,
  licenseUrl: 'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html',
  downloadPage:
    'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html',
  sourceUrl: zip.source,
  results,
  crossCandidateMatches,
  admissionsChanged: false,
  clinicalValidation: false,
  limitations:
    'Ten explicit same-version ocular candidates only. ZIP member CRC/size, exact source definitions/aliases, finite triangular geometry, raw/canonical hashes, source bounds, side-centre convention and exact rendered fingerprint matches are checked. No near-surface, interior, adjacency, attachment, tear-drainage continuity or clinical extent validation; none is admitted by this preparatory audit. Original source meshes are not reshaped or inferred from diagrams.',
};
await fs.writeFile(
  'content/ocular-candidate-audit.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log({
  candidates: results.length,
  sourceBytes: results.reduce((n, r) => n + r.bytes, 0),
  exactRenderedMatches: results.filter((r) => r.exactRenderedMatches.length)
    .length,
  crossCandidateMatches,
  admitted: 0,
});
