import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { geometryFingerprint, inventoryHolds } from './anatomy-inventory.mjs';
import { conceptMap, cache } from './bodyparts-archive.mjs';
import { junctionSelections, junctionParents } from './junction-selection.mjs';
const sourceCommit = '0b1c27632fb4fc7d7cd21b8c500c6f883bd6c645';
const hash = (b) => createHash('sha256').update(b).digest('hex');
const root = 'public/models/bodyparts3d/full-body/';
const bytes = execFileSync(
  'git',
  ['show', sourceCommit + ':' + root + 'catalog.json'],
  { maxBuffer: 8e6 },
);
const catalog = JSON.parse(bytes);
assert.equal(
  hash(bytes),
  '9b2cb3eb0b530491c9a4d0f54c4d89058e14f7475f05597f4babf9fb3ea8bdc7',
);
const inventory = JSON.parse(
  execFileSync(
    'git',
    ['show', sourceCommit + ':content/source-inventory.json'],
    { maxBuffer: 16e6 },
  ),
);
assert.equal(junctionSelections(await conceptMap('isa')).length, 1);
const parents = catalog.structures.filter((s) =>
  junctionParents.includes(s.fmaId),
);
assert.equal(parents.length, 2);
assert.deepEqual(
  catalog.structures
    .filter((s) => s.sources.some((f) => f.file === 'FJ2599'))
    .map((s) => s.id),
  parents.map((s) => s.id),
);
const aliases = inventory.records.filter((r) => r.files.includes('FJ2599'));
assert(!aliases.some((r) => inventoryHolds[r.id]));
const raw = [];
for (const tree of ['isa', 'partof']) {
  const data = await fs.readFile(cache + '/' + tree + '/FJ2599.obj');
  const asset = inventory.assets.find(
    (a) => a.tree === tree && a.file === 'FJ2599',
  );
  assert.equal(data.length, asset.bytes);
  assert.equal(hash(data), asset.sha256);
  assert.equal(geometryFingerprint(data), asset.geometrySha256);
  assert.equal(
    asset.geometrySha256,
    '9c74414ea9fc7e30ac5ceaf0c8850f96dc1d49be05298df51046f5c0eb24eb4e',
  );
  raw.push({
    tree,
    file: 'FJ2599',
    bytes: data.length,
    sha256: hash(data),
    geometrySha256: geometryFingerprint(data),
    crc32: asset.crc32,
  });
}
const baseline = {
  sourceCommit,
  catalogSha256: hash(bytes),
  coordinateSystem: catalog.coordinateSystem,
  excluded: catalog.excluded,
  structures: catalog.structures.map((s) => ({
    id: s.id,
    sha256: hash(JSON.stringify(s)),
  })),
  bundles: catalog.bundles,
  parents,
};
for (const [file, value] of [
  ['content/junction-baseline.json', baseline],
  [
    'content/junction-source-audit.json',
    {
      sourceCommit,
      sourceVersion: '4.0',
      license: 'CC-BY-4.0',
      licenseUrl: 'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html',
      licenseChecked: '2026-09-06',
      method:
        'Cached source bytes matched to previously archived source SHA-256 and canonical geometry evidence; no claim of a new archive download.',
      raw,
      exactAliases: aliases
        .filter((r) => r.files.length === 1)
        .map((r) => ({ tree: r.tree, fmaId: r.id, name: r.name })),
      previousOwners: parents.map((s) => s.id),
      intendedSourceIdentity: 'FMA11338',
      action:
        'Separate one existing component from both parent display aggregates; keep a single independently selectable source owner.',
      clinicalValidation: false,
      newAnatomicalTissue: false,
    },
  ],
]) {
  const text = JSON.stringify(value, null, 2) + '\n';
  const existing = await fs.readFile(file, 'utf8').catch(() => null);
  if (existing)
    assert.equal(
      existing.replace(/\r\n/g, '\n'),
      text,
      'Pinned evidence is immutable',
    );
  else await fs.writeFile(file, text);
}
console.log({
  passed: true,
  duplicateOwners: parents.length,
  cachedRawSourcesVerified: raw.length,
  clinicalValidation: false,
});
