import assert from 'node:assert/strict';
import { readFile, writeFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { footBoneFmas } from '../content/foot-joints.ts';
const raw = await readFile('public/models/bodyparts3d/full-body/catalog.json');
assert.equal(
  createHash('sha256').update(raw).digest('hex'),
  '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7',
);
const catalog = JSON.parse(raw),
  ids = Object.values(footBoneFmas).flat();
assert.equal(ids.length, 56);
assert.equal(new Set(ids).size, 56);
const entries = catalog.structures.filter((s) => ids.includes(s.fmaId));
assert.equal(entries.length, 56);
for (const pair of Object.values(footBoneFmas))
  for (const [i, fma] of pair.entries()) {
    const matches = entries.filter((s) => s.fmaId === fma);
    assert.equal(matches.length, 1);
    assert.equal(matches[0].system, 'skeleton');
    assert.equal(matches[0].laterality, i === 0 ? 'right' : 'left');
    assert(!/sesamoid/i.test(matches[0].name));
  }
const output =
  JSON.stringify(
    {
      sourceCommit: '95c2abe36043b777319e2ee3217af3d45e19ddb9',
      sourceVersion: catalog.sourceVersion,
      license: catalog.license,
      coordinateSystem: catalog.coordinateSystem,
      bundles: catalog.bundles.filter((b) =>
        entries.some((s) => s.bundle === b.id),
      ),
      entries,
    },
    null,
    2,
  ) + '\n';
const path = 'content/foot-joint-pins.json';
if (process.argv.includes('--check'))
  assert.equal((await readFile(path, 'utf8')).replace(/\r\n/g, '\n'), output);
else {
  await assert.rejects(access(path), 'Do not overwrite source admissions');
  await writeFile(path, output);
}
console.log(
  JSON.stringify({
    bones: entries.length,
    check: process.argv.includes('--check'),
  }),
);
