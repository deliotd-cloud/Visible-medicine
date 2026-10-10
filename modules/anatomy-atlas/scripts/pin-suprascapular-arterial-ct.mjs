import assert from 'node:assert/strict';
import { readFile, writeFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { contentContext } from './content-contract-tools.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';

const parentCommit = '65f1a9e3e67de052a6a2faa96b606b5be251e7b7';
assert(process.argv.slice(2).every(arg => arg === '--check'));
const checking = process.argv.includes('--check');
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const specs = [['FMA10698', 'right', 'FJ2303'], ['FMA10681', 'left', 'FJ2251']];
const { api, catalog } = await contentContext();
const before = await exactSourceHistoryApi(parentCommit, 'display-review');
const display = api.bodyDisplayCatalog(catalog);
assert.deepEqual(display, before.bodyDisplayCatalog(catalog));
const entries = specs.map(([fma, side, file]) => {
  const matches = display.structures.filter(s => s.fmaId === fma);
  assert.equal(matches.length, 1, fma);
  const identity = matches[0];
  assert.equal(identity.laterality, side);
  assert.equal(identity.system, 'vessels');
  assert.equal(identity.category, 'vessel');
  assert.equal(identity.region, 'shoulder-arm');
  assert.equal(identity.sourceTree, 'isa');
  assert.deepEqual([...identity.regions].sort(), ['shoulder-arm', 'thorax'].sort());
  assert.deepEqual(identity.sources.map(s => s.file), [file]);
  const previous = before.bodyLesson(identity, 'ct');
  assert.equal(previous.readiness, 'pending');
  if (!checking) assert.deepEqual(api.bodyLesson(identity, 'ct'), previous);
  assert.equal(before.bodyLesson(identity, 'mri').readiness, 'draft');
  assert.deepEqual(api.bodyLesson(identity, 'mri'), before.bodyLesson(identity, 'mri'));
  return { identity, previous };
});
assert.equal(entries.length, 2);
assert.equal(new Set(entries.map(e => e.identity.id)).size, 2);
const bundles = display.bundles.filter(b => entries.some(e => e.identity.bundle === b.id));
assert.equal(bundles.length, 1);
for (const b of bundles) {
  const bytes = await readFile('public' + b.url.split('?')[0]);
  assert.equal(bytes.length, b.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), b.sha256);
}
const record = { parentCommit, catalogHash: hash(display), sourceVersion: display.sourceVersion,
  license: display.license, coordinateSystem: display.coordinateSystem, bundles, entries };
const path = new URL('../content/suprascapular-arterial-ct-pins.json', import.meta.url);
const output = JSON.stringify(record, null, 2) + '\n';
if (checking) assert.equal((await readFile(path, 'utf8')).replaceAll('\r\n', '\n'), output);
else {
  assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), parentCommit);
  await assert.rejects(access(path), 'Never overwrite existing source pins');
  await writeFile(path, output, { flag: 'wx' });
}
console.log(JSON.stringify({ selections: entries.length, placements: 2, pinsHash: hash(record), clinicalApproval: false }));
