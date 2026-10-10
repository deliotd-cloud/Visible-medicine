import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { bodyDisplayCatalog } from '../lib/body-display-catalog.ts';

const fmaIds = ['FMA3802', 'FMA3855', 'FMA3862', 'FMA3895', 'FMA7088'];
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const raw = await readFile('public/models/bodyparts3d/full-body/catalog.json');
const catalog = bodyDisplayCatalog(JSON.parse(raw));
const entries = fmaIds.map((fmaId) => {
  const matches = catalog.structures.filter((s) => s.fmaId === fmaId);
  assert.equal(matches.length, 1, `One source record required for ${fmaId}`);
  assert.equal(matches[0].region, 'thorax');
  return matches[0];
});
assert.equal(new Set(entries.map((s) => s.id)).size, entries.length);
const files = entries.flatMap((s) => s.sources.map((source) => source.file));
assert.equal(new Set(files).size, files.length, 'Target and heart source files must be disjoint');
const bundleIds = [...new Set(entries.map((s) => s.bundle))];
const bundles = bundleIds.map((id) => {
  const matches = catalog.bundles.filter((b) => b.id === id);
  assert.equal(matches.length, 1, `One bundle required for ${id}`);
  return matches[0];
});
for (const bundle of bundles) {
  assert.equal(sha256(await readFile(`public${bundle.url.split('?')[0]}`)), bundle.sha256);
}
const pin = {
  sourceCatalogSha256: sha256(raw),
  sourceVersion: catalog.sourceVersion,
  license: catalog.license,
  credit: catalog.credit,
  coordinateSystem: catalog.coordinateSystem,
  entries,
  bundles,
};
const path = 'content/coronary-arterial-study-pins.json';
const output = `${JSON.stringify(pin, null, 2)}\n`;
if (process.argv.includes('--check')) {
  assert.equal((await readFile(path, 'utf8')).replace(/\r\n/g, '\n'), output);
} else {
  await writeFile(path, output, { flag: 'wx' });
}
console.log(JSON.stringify({ entries: entries.length, bundles: bundles.length, geometryWritten: false }));
