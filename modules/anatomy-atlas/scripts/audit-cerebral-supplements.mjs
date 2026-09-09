import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { archiveReader, cache } from './bodyparts-archive.mjs';
import { loadSourceHolds } from './load-source-holds.mjs';
import {
  sourceObjShape,
  sourceTriangleSet,
  sourceSurfaceDistance,
} from './source-surface-audit.mjs';
import { sourceTopology } from './source-topology.mjs';

const hash = (v) => createHash('sha256').update(v).digest('hex');
const pinnedHashes = {
  FJ1837: '2fb61c24b880e134ff2034558fa6abbfcbcd8506b0aca18ee2cc844fa6783de6',
  FJ1838: '342678a0d5a35ca049870e95536c19b9d66915c7f636f0b738162e5db833746b',
  FJ1839: 'a26f20cb2f22b373ea82a0ab8d8adc815d5e7ec81fd7ea93947c3322ce79ad77',
  FJ1840: '4d68654bdf8e258a8253decbd2f246d388f693b6b2a37f809ffcfdd4d4bc25f7',
  FJ1748: 'b7553aaa8a282d5882d9d2809f5fedd7b35ef50710773ac103cfa82f9f184245',
  FJ1787: 'de3c1098d95fc81060b72603e72a4a2a55529b0fb82063dbd0dfc4f3955d720c',
};
const { inventory, catalog, records, policy, evidence } =
  await loadSourceHolds();
const parent = catalog.structures.find((s) => s.fmaId === 'FMA50801');
const definitions = [
  [
    'FMA72801',
    'anterior part of left superior temporal gyrus',
    'FJ1837',
    'FJ1789',
  ],
  [
    'FMA72800',
    'anterior part of right superior temporal gyrus',
    'FJ1838',
    'FJ1790',
  ],
  [
    'FMA72805',
    'posterior part of left superior temporal gyrus',
    'FJ1839',
    'FJ1789',
  ],
  [
    'FMA72804',
    'posterior part of right superior temporal gyrus',
    'FJ1840',
    'FJ1790',
  ],
];
const archive = process.argv.includes('--fetch')
  ? await archiveReader('isa')
  : null;
const read = async (file) => {
  const pinned = inventory.assets.find(
    (a) => a.tree === 'isa' && a.file === file,
  );
  assert(pinned?.available);
  if (archive) {
    const entry = archive.entries.get(file + '.obj');
    assert.equal(entry.unpacked, pinned.bytes);
    assert.equal(entry.crc, pinned.crc32);
  }
  const raw = archive
    ? await archive.get(file)
    : await readFile(`${cache}/isa/${file}.obj`);
  assert.equal(raw.length, pinned.bytes);
  assert.equal(
    hash(raw),
    pinnedHashes[file],
    'Previously ZIP-CRC-verified source must not drift',
  );
  return raw;
};
const registrationReferences = [];
for (const file of ['FJ1748', 'FJ1787']) {
  const raw = await read(file),
    existing = parent.sources.find((s) => s.file === file);
  const existingBytes = await readFile(`${cache}/partof/${file}.obj`);
  assert.equal(hash(existingBytes), existing.sha256);
  const a = sourceTriangleSet(sourceObjShape(raw)),
    b = sourceTriangleSet(sourceObjShape(existingBytes));
  assert.deepEqual(
    a,
    b,
    'Exact source-coordinate geometry agreement, not guessed alignment',
  );
  registrationReferences.push({
    file,
    isaSha256: hash(raw),
    partofSha256: hash(existingBytes),
    byteIdentical: raw.equals(existingBytes),
    exactSharedTriangles: a.size,
    geometryIdentical: true,
  });
}
const parentTriangles = new Set();
for (const source of parent.sources) {
  const raw = await readFile(`${cache}/partof/${source.file}.obj`);
  assert.equal(hash(raw), source.sha256);
  for (const face of sourceTriangleSet(sourceObjShape(raw)))
    parentTriangles.add(face);
}
const candidates = [];
for (const [fmaId, name, file, neighbour] of definitions) {
  const definition = records.find((r) => r.tree === 'isa' && r.id === fmaId);
  assert.equal(definition.name, name);
  assert.deepEqual(definition.files, [file]);
  policy.assertNoKnownHolds([definition]);
  const raw = await read(file),
    shape = sourceObjShape(raw),
    topology = sourceTopology(shape);
  const adjacent = sourceObjShape(
    await readFile(`${cache}/partof/${neighbour}.obj`),
  );
  candidates.push({
    fmaId,
    name,
    file,
    tree: 'isa',
    sha256: hash(raw),
    bytes: raw.length,
    archiveCrc32: inventory.assets.find(
      (a) => a.tree === 'isa' && a.file === file,
    ).crc32,
    topology,
    exactSharedParentTriangles: [...sourceTriangleSet(shape)].filter((f) =>
      parentTriangles.has(f),
    ).length,
    neighbour,
    candidateToNeighbour: sourceSurfaceDistance(shape, adjacent),
    neighbourToCandidate: sourceSurfaceDistance(adjacent, shape),
    inParentSourceList: parent.sources.some((s) => s.file === file),
  });
}
const report = {
  sourceVersion: '4.0',
  license: catalog.license,
  evidence,
  registrationReferences,
  candidates,
  limitation:
    'Source geometry and bounded surface samples only; no anatomical continuity, full-overlap exclusion, clinical approval or patient registration is inferred.',
  clinicalApproval: false,
};
if (process.argv.includes('--check')) {
  assert.deepEqual(
    report,
    JSON.parse(await readFile('content/cerebral-supplement-audit.json')),
    'Supplement source evidence is stale',
  );
} else {
  await writeFile(
    'content/cerebral-supplement-audit.json',
    JSON.stringify(report, null, 2) + '\n',
  );
}
console.log(
  JSON.stringify(
    {
      registrationReferences,
      candidates: candidates.map(({ topology, ...r }) => ({
        ...r,
        topology: {
          triangles: topology.triangles,
          components: topology.components,
          closedOrientedManifold: topology.closedOrientedManifold,
        },
      })),
    },
    null,
    2,
  ),
);
