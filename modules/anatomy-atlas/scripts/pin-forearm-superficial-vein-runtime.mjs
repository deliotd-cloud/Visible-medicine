import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { build } from './workspace-test-build.mjs';

const hash = value => createHash('sha256').update(value).digest('hex');
const source = JSON.parse(await readFile('content/forearm-superficial-vein-pins.json'));
const bytes = await readFile('public/models/bodyparts3d/full-body/catalog.json');
assert.equal(hash(bytes), source.catalogSha256);
const compiled = await build({
  stdin: { contents: "export {bodyDisplayCatalog} from './lib/body-display-catalog';", resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, write: false, format: 'esm', platform: 'node',
});
const { bodyDisplayCatalog } = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const catalog = bodyDisplayCatalog(JSON.parse(bytes));
const ids = [...source.targets, ...source.context].map(row => row[0]);
assert.equal(new Set(ids).size, 12);
const entries = ids.map(id => {
  const matches = catalog.structures.filter(s => s.fmaId === id);
  assert.equal(matches.length, 1);
  assert.equal(hash(JSON.stringify(matches[0])), source.recordSha256[id]);
  return matches[0];
});
const bundles = source.bundles.map(([id, digest]) => {
  const matches = catalog.bundles.filter(b => b.id === id);
  assert.equal(matches.length, 1);
  assert.equal(matches[0].sha256, digest);
  return matches[0];
});
const record = {
  sourceVersion: catalog.sourceVersion,
  license: catalog.license,
  coordinateSystem: catalog.coordinateSystem,
  entries,
  bundles,
};
const path = 'content/forearm-superficial-vein-runtime-pins.json';
const text = JSON.stringify(record, null, 2) + '\n';
if (process.argv.includes('--check'))
  assert.equal((await readFile(path, 'utf8')).replace(/\r\n/g, '\n'), text);
else
  await writeFile(path, text, { flag: 'wx' });
console.log(JSON.stringify({ entries: entries.length, bundles: bundles.length, sourceChanged: false }));
