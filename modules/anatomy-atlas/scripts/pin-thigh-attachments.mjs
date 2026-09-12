import assert from 'node:assert/strict';
import { readFile, writeFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import {
  thighAttachments,
  thighAttachmentBones,
} from '../content/thigh-attachments.ts';
const raw = await readFile('public/models/bodyparts3d/full-body/catalog.json');
assert.equal(
  createHash('sha256').update(raw).digest('hex'),
  '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7',
);
const catalog = JSON.parse(raw);
const pairs = [
  ...thighAttachments.map((a) => a.fmas),
  ...Object.values(thighAttachmentBones),
];
const ids = pairs.flat();
assert.equal(new Set(ids).size, 30);
const entries = catalog.structures.filter((s) => ids.includes(s.fmaId));
assert.equal(entries.length, 30);
for (const pair of pairs)
  for (const [i, fma] of pair.entries()) {
    const found = entries.filter((s) => s.fmaId === fma);
    assert.equal(found.length, 1);
    assert.equal(found[0].laterality, i === 0 ? 'right' : 'left');
    assert.equal(
      found[0].system,
      thighAttachments.some((a) => a.fmas.includes(fma))
        ? 'muscles'
        : 'skeleton',
    );
  }
const bundles = catalog.bundles.filter((b) =>
  entries.some((s) => s.bundle === b.id),
);
for (const b of bundles)
  assert.equal(
    createHash('sha256')
      .update(await readFile('public' + b.url))
      .digest('hex'),
    b.sha256,
  );
const output =
  JSON.stringify(
    {
      sourceCommit: 'acf8acb3a2fc6e4fc698583865cb506b3f7b55c9',
      sourceVersion: catalog.sourceVersion,
      license: catalog.license,
      coordinateSystem: catalog.coordinateSystem,
      bundles,
      entries,
    },
    null,
    2,
  ) + '\n';
const path = 'content/thigh-attachment-pins.json';
if (process.argv.includes('--check'))
  assert.equal((await readFile(path, 'utf8')).replace(/\r\n/g, '\n'), output);
else {
  await assert.rejects(access(path), 'Never overwrite source pins');
  await writeFile(path, output);
}
console.log(
  JSON.stringify({
    muscles: 20,
    bones: 10,
    bundles: bundles.length,
    check: process.argv.includes('--check'),
  }),
);
