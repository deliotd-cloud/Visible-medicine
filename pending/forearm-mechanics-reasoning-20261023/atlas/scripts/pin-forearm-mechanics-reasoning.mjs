// Reproduce twelve existing displayed ISA muscles, retaining ordered compound sources.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { build } from './workspace-test-build.mjs';

const flags = process.argv.slice(2);
assert(flags.length === 0 || flags.length === 1 && flags[0] === '--check');
const root = new URL('../', import.meta.url);
const compiled = await build({ stdin: { contents: "export {bodyDisplayCatalog} from './lib/body-display-catalog';", resolveDir: fileURLToPath(root), loader: 'ts' }, bundle: true, write: false, platform: 'node', format: 'esm' });
const api = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const catalog = api.bodyDisplayCatalog(JSON.parse(fs.readFileSync(new URL('public/models/bodyparts3d/full-body/catalog.json', root))));
const groups = [
  ['flexor-digitorum-superficialis', ['FMA38470', 'FMA38471'], [['FJ1475', 'FJ1499'], ['FJ1475M', 'FJ1499M']]],
  ['flexor-digitorum-profundus', ['FMA38479', 'FMA38480'], [['FJ1497'], ['FJ1497M']]],
  ['extensor-carpi-radialis-brevis', ['FMA38498', 'FMA38499'], [['FJ1489'], ['FJ1489M']]],
  ['extensor-carpi-ulnaris', ['FMA38507', 'FMA38508'], [['FJ1472', 'FJ1517'], ['FJ1472M', 'FJ1517M']]],
  ['extensor-digitorum', ['FMA38501', 'FMA38502'], [['FJ1492'], ['FJ1492M']]],
  ['extensor-indicis', ['FMA38525', 'FMA38526'], [['FJ1493'], ['FJ1493M']]],
];
const entries = groups.flatMap(([slug, fmas, files]) => fmas.map((fma, i) => {
  const rows = catalog.structures.filter(s => s.fmaId === fma);
  assert.equal(rows.length, 1, fma);
  const identity = rows[0];
  assert.equal(identity.region, 'forearm');
  assert.deepEqual(identity.regions, ['forearm']);
  assert.equal(identity.system, 'muscles');
  assert.equal(identity.category, 'muscle');
  assert.equal(identity.bundle, 'forearm-muscles');
  assert.equal(identity.sourceTree, 'isa');
  assert.equal(identity.laterality, i === 0 ? 'right' : 'left');
  assert.deepEqual(identity.sources.map(source => source.file), files[i]);
  return { key: 'forearm-mechanics-' + slug, identity };
}));
const value = { schemaVersion: 1, parentSource: 'b0ad9e786f2f26727cd627ec028c0d3894048c72', entries };
const output = new URL('content/forearm-mechanics-reasoning-pins.json', root);
if (flags.length) assert.deepEqual(JSON.parse(fs.readFileSync(output)), value);
else fs.writeFileSync(output, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ pins: entries.length, checked: flags.length > 0, geometryChanged: false }));
