// Preserve immutable pre-admission fingerprints; validators do not need the old Git history.
import fs from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const sourceCommit = '2cb4f447208844f7f3f0caa282952210ff502977';
const bytes = execFileSync(
  'git',
  ['show', sourceCommit + ':public/models/bodyparts3d/full-body/catalog.json'],
  { maxBuffer: 8 * 1024 * 1024 },
);
const catalog = JSON.parse(bytes);
const hash = (value) => createHash('sha256').update(value).digest('hex');
if (catalog.structures.length !== 823 || catalog.bundles.length !== 61)
  throw Error('Unexpected inventory baseline');
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
};
const output = JSON.stringify(baseline, null, 2) + '\n';
const target = 'content/inventory-baseline.json';
const existing = await fs.readFile(target, 'utf8').catch(() => null);
if (existing && existing !== output)
  throw Error('Refusing to replace an existing baseline');
if (!existing) await fs.writeFile(target, output);
console.log(
  'Pinned 823 identities and 61 bundle fingerprints from the pre-inventory atlas.',
);
