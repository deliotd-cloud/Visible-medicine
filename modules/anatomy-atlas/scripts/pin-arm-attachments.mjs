import assert from 'node:assert/strict';
import { readFile, writeFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { armAttachments, attachmentBones } from '../content/arm-attachments.ts';
const raw = await readFile('public/models/bodyparts3d/full-body/catalog.json');
assert.equal(
  createHash('sha256').update(raw).digest('hex'),
  '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7',
);
const catalog = JSON.parse(raw);
const pairs = [
  ...armAttachments.map((a) => a.fmas),
  ...Object.values(attachmentBones),
];
const ids = pairs.flat();
assert.equal(new Set(ids).size, 32);
const entries = catalog.structures.filter((s) => ids.includes(s.fmaId));
assert.equal(entries.length, 32);
for (const pair of pairs)
  for (const [i, fma] of pair.entries()) {
    const found = entries.filter((s) => s.fmaId === fma);
    assert.equal(found.length, 1);
    assert.equal(found[0].laterality, i === 0 ? 'right' : 'left');
    assert.equal(
      found[0].system,
      armAttachments.some((a) => a.fmas.includes(fma)) ? 'muscles' : 'skeleton',
    );
  }
const output =
  JSON.stringify(
    {
      sourceCommit: '8b68cf700afcd78a343ca124151f45185bc2d3b1',
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
const path = 'content/arm-attachment-pins.json';
if (process.argv.includes('--check'))
  assert.equal((await readFile(path, 'utf8')).replace(/\r\n/g, '\n'), output);
else {
  await assert.rejects(access(path), 'Never overwrite source pins');
  await writeFile(path, output);
}
console.log(
  JSON.stringify({
    muscles: 24,
    bones: 8,
    check: process.argv.includes('--check'),
  }),
);
