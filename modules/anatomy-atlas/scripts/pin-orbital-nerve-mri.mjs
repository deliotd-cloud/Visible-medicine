import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { context, snapshot, hash } from './pin-pica-clinical.mjs';

const parentCommit = '889ed98e63818a9bbc46b2ddd67bb16518289784';
const { api, display } = await context({ current: true });
const specs = [
  ['FMA52575', 'superior-oculomotor', 'FJ1321', 'head-neck-nerves', 'left'],
  ['FMA52574', 'superior-oculomotor', 'FJ1372', 'head-neck-nerves', 'right'],
  ['FMA52577', 'inferior-oculomotor', 'FJ1293', 'head-neck-nerves', 'left'],
  ['FMA52576', 'inferior-oculomotor', 'FJ1344', 'head-neck-nerves', 'right'],
  ['FMA50882', 'trochlear', 'FJ1330', 'head-neck-nerves-gaps', 'left'],
  ['FMA50881', 'trochlear', 'FJ1381', 'head-neck-nerves-gaps', 'right'],
  ['FMA52640', 'frontal', 'FJ1290', 'head-neck-nerves', 'left'],
  ['FMA52639', 'frontal', 'FJ1341', 'head-neck-nerves', 'right'],
  ['FMA52630', 'lacrimal', 'FJ1300', 'head-neck-nerves', 'left'],
  ['FMA52629', 'lacrimal', 'FJ1351', 'head-neck-nerves', 'right'],
  ['FMA52670', 'nasociliary', 'FJ1310', 'head-neck-nerves', 'left'],
  ['FMA52669', 'nasociliary', 'FJ1361', 'head-neck-nerves', 'right'],
  ['FMA53550', 'ciliary-ganglion', 'FJ1288', 'head-neck-nerves-inventory', 'left'],
  ['FMA53549', 'ciliary-ganglion', 'FJ1339', 'head-neck-nerves-inventory', 'right'],
];
const entries = specs.map(([fma, group, file, bundle, side]) => {
  const matches = display.structures.filter(s => s.fmaId === fma);
  assert.equal(matches.length, 1);
  const identity = matches[0], topics = ['mri'];
  assert.deepEqual(identity.sources.map(s => s.file), [file]);
  assert.equal(identity.bundle, bundle);assert.equal(identity.laterality, side);
  assert.equal(identity.system, 'nerves');assert.deepEqual(identity.regions, ['head-neck']);
  return { identity, group, topics, previous: { mri: api.bodyLesson(identity, 'mri') } };
});
const bundles = display.bundles.filter(b => entries.some(e => e.identity.bundle === b.id));
assert.equal(bundles.length, 3);
for (const b of bundles) {
  const bytes = await readFile('public' + b.url.split('?')[0]);
  assert.equal(bytes.length, b.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), b.sha256);
}
const file = 'content/orbital-nerve-mri-pins.json';
if (process.argv.includes('--check')) {
  const pins = JSON.parse(await readFile(file));
  assert.equal(pins.parentCommit, parentCommit);
  assert.deepEqual(pins.bundles, bundles);assert.deepEqual(pins.coordinateSystem, display.coordinateSystem);
  assert.deepEqual(pins.entries.map(({ previous: _previous, ...e }) => e), entries.map(({ previous: _previous, ...e }) => e));
  for (const e of pins.entries) assert.equal(e.previous.mri.readiness, 'pending');
  console.log('Fourteen exact orbital MRI identities and three bundle byte sets verified.');
} else {
  assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), parentCommit);
  for (const e of entries) assert.equal(e.previous.mri.readiness, 'pending');
  const pins = { parentCommit, coordinateSystem: display.coordinateSystem, bundles, previousAllLessonsAndRecipesHash: hash(snapshot(api, display)), entries };
  await writeFile(file, JSON.stringify(pins, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ pinsHash: hash(pins), beforeHash: pins.previousAllLessonsAndRecipesHash, placements: entries.length }));
}
