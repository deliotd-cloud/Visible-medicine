import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { archiveReader } from './bodyparts-archive.mjs';
import { geometryFingerprint } from './anatomy-inventory.mjs';
const files = ['FJ1662', 'FJ1663', 'FJ1692', 'FJ3481', 'FJ3581', 'FJ3582', 'FJ3584'];
const hash = (b) => createHash('sha256').update(b).digest('hex');
const check = process.argv.includes('--check');
const inventory = JSON.parse(await readFile('content/source-inventory.json'));
const sources = [];
for (const tree of ['isa', 'partof']) {
  const archive = check ? null : await archiveReader(tree);
  if (archive) {
    const entries = [...archive.entries]
      .filter(([name]) => name.endsWith('.obj'))
      .sort(([a], [b]) => a.localeCompare(b));
    assert.equal(
      hash(JSON.stringify(entries)),
      inventory.archives.find((a) => a.tree === tree).directorySha256,
      'Official archive directory changed',
    );
  }
  const directory = `content/prototypes/reference-cross-tree/${tree}`;
  if (!check) await mkdir(directory, { recursive: true });
  for (const file of files) {
    const path = `${directory}/${file}.obj`;
    const bytes = check ? await readFile(path) : await archive.get(file);
    const archived = inventory.assets.find(
      (a) => a.tree === tree && a.file === file,
    );
    assert.equal(bytes.length, archived.bytes);
    const row = {
      tree,
      file,
      path,
      bytes: bytes.length,
      sha256: hash(bytes),
      geometrySha256: geometryFingerprint(bytes),
    };
    if (!check) {
      try {
        assert.deepEqual(
          await readFile(path),
          bytes,
          'Preserve changed source evidence',
        );
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
        await writeFile(path, bytes);
      }
    }
    sources.push(row);
  }
}
const comparisons = files.map((file) => {
  const pair = sources.filter((s) => s.file === file);
  return {
    file,
    identicalBytes: pair[0].sha256 === pair[1].sha256,
    identicalGeometry: pair[0].geometrySha256 === pair[1].geometrySha256,
  };
});
const report = {
  schemaVersion: 1,
  sourceVersion: '4.0',
  license: 'CC-BY-4.0',
  credit:
    'BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International',
  scope:
    'Audit-only retained original source bytes; no mesh admission, clinical approval, geometry repair or patient registration.',
  archives: inventory.archives,
  sources,
  comparisons,
};
const output = JSON.stringify(report, null, 2) + '\n',
  target = 'docs/reference-cross-tree-audit.json';
if (check)
  assert.equal(
    (await readFile(target, 'utf8')).replace(/\r\n/g, '\n'),
    output,
    'Cross-tree proof is stale',
  );
else await writeFile(target, output);
console.log(
  JSON.stringify(
    {
      mode: check ? 'checked' : 'generated',
      sources: sources.length,
      comparisons,
      noAdmission: true,
    },
    null,
    2,
  ),
);
