import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { context, snapshot, hash } from './pin-pica-clinical.mjs';

const parentCommit = '4e47ebaad006d0b7a9472cfe8d958a40e4b85236';
const { api, display } = await context({ current: true });
const specs = [
  ['FMA55099', 'thyroid', ['FJ2808'], ['ultrasound']],
  ['FMA9615', 'cricoid', ['FJ2440', 'FJ2769'], ['ultrasound']],
  ['FMA55113', 'arytenoid', ['FJ2792'], ['ct', 'mri', 'ultrasound']],
  ['FMA55114', 'arytenoid', ['FJ2775'], ['ct', 'mri', 'ultrasound']],
];
const entries = specs.map(([fma, group, files, topics]) => {
  const matches = display.structures.filter(s => s.fmaId === fma);
  assert.equal(matches.length, 1);
  const identity = matches[0];
  assert.deepEqual(identity.sources.map(s => s.file), files);
  return { identity, group, topics, previous: Object.fromEntries(topics.map(t => [t, api.bodyLesson(identity, t)])) };
});
const bundles = display.bundles.filter(b => entries.some(e => e.identity.bundle === b.id));
for (const b of bundles) {
  const bytes = await readFile('public' + b.url.split('?')[0]);
  assert.equal(bytes.length, b.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), b.sha256);
}
const file = 'content/laryngeal-framework-imaging-pins.json';
if (process.argv.includes('--check')) {
  const pins = JSON.parse(await readFile(file));
  assert.equal(pins.parentCommit, parentCommit);
  assert.deepEqual(pins.bundles, bundles);
  assert.deepEqual(pins.coordinateSystem, display.coordinateSystem);
  assert.deepEqual(pins.entries.map(({ previous: _previous, ...e }) => e), entries.map(({ previous: _previous, ...e }) => e));
  for (const e of pins.entries) for (const t of e.topics) assert.equal(e.previous[t].readiness, 'pending');
  console.log('Four exact laryngeal framework identities and bundle bytes verified.');
} else {
  assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), parentCommit);
  for (const e of entries) for (const t of e.topics) assert.equal(e.previous[t].readiness, 'pending');
  const pins = { parentCommit, coordinateSystem: display.coordinateSystem, bundles, previousAllLessonsAndRecipesHash: hash(snapshot(api, display)), entries };
  await writeFile(file, JSON.stringify(pins, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ pinsHash: hash(pins), beforeHash: pins.previousAllLessonsAndRecipesHash, placements: 8 }));
}
