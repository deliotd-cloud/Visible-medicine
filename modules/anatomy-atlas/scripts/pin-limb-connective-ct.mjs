import assert from 'node:assert/strict';
import { readFile, writeFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { contentContext } from './content-contract-tools.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';

const parentCommit = 'c440ae47d7e9a2451156caa5a9906550a35bcb50';
assert(process.argv.slice(2).every(arg => arg === '--check'));
const checking = process.argv.includes('--check');
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const specs = [
  ['FMA44249', 'right', 'FJ1424', 'foot', ['foot'], 'ligament'],
  ['FMA44250', 'left', 'FJ1424M', 'foot', ['foot'], 'ligament'],
  ['FMA40120', 'right', 'FJ1471', 'hand', ['hand', 'forearm'], 'ligament'],
  ['FMA40121', 'left', 'FJ1471M', 'hand', ['hand', 'forearm'], 'ligament'],
  ['FMA58776', 'right', 'FJ1423', 'thigh', ['thigh', 'pelvis', 'leg'], 'fascia'],
  ['FMA58777', 'left', 'FJ1423M', 'thigh', ['thigh', 'pelvis', 'leg'], 'fascia'],
];
const { api, catalog } = await contentContext();
const before = await exactSourceHistoryApi(parentCommit, 'display-review');
const display = api.bodyDisplayCatalog(catalog);
assert.deepEqual(display, before.bodyDisplayCatalog(catalog));
const entries = specs.map(([fma, side, file, region, regions, category]) => {
  const matches = display.structures.filter(s => s.fmaId === fma);
  assert.equal(matches.length, 1, fma);
  const identity = matches[0];
  assert.equal(identity.laterality, side);
  assert.equal(identity.system, 'connective');
  assert.equal(identity.category, category);
  assert.equal(identity.region, region);
  assert.equal(identity.sourceTree, 'isa');
  assert.deepEqual([...identity.regions].sort(), [...regions].sort());
  assert.deepEqual(identity.sources.map(s => s.file), [file]);
  const previous = before.bodyLesson(identity, 'ct');
  assert.equal(previous.readiness, 'pending');
  if (!checking) assert.deepEqual(api.bodyLesson(identity, 'ct'), previous);
  return { identity, previous };
});
assert.equal(new Set(entries.map(e => e.identity.id)).size, 6);
const bundles = display.bundles.filter(b => entries.some(e => e.identity.bundle === b.id));
assert.equal(bundles.length, new Set(entries.map(e => e.identity.bundle)).size);
for (const b of bundles) {
  const bytes = await readFile('public' + b.url.split('?')[0]);
  assert.equal(bytes.length, b.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), b.sha256);
}
const record = { parentCommit, catalogHash: hash(display), sourceVersion: display.sourceVersion,
  license: display.license, coordinateSystem: display.coordinateSystem, bundles, entries };
const path = new URL('../content/limb-connective-ct-pins.json', import.meta.url);
const output = JSON.stringify(record, null, 2) + '\n';
if (checking) assert.equal((await readFile(path, 'utf8')).replaceAll('\r\n', '\n'), output);
else {
  assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), parentCommit);
  await assert.rejects(access(path), 'Never overwrite existing source pins');
  await writeFile(path, output, { flag: 'wx' });
}
console.log(JSON.stringify({ selections: entries.length, placements: 6, pinsHash: hash(record), clinicalApproval: false }));
