import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { context, snapshot, hash } from './pin-pica-clinical.mjs';

const parentCommit = 'db1572ce7241b60dc98bf15fe0f7ccb372930de8';
assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), parentCommit);
const { api, display } = await context({ current: true });
const entries = ['FMA46580', 'FMA46581'].map(fma => {
  const matches = display.structures.filter(s => s.fmaId === fma);
  assert.equal(matches.length, 1);
  const identity = matches[0], previous = api.bodyLesson(identity, 'ultrasound');
  assert.equal(previous.readiness, 'pending');
  return { identity, topics: ['ultrasound'], previous: { ultrasound: previous } };
});
const bundles = display.bundles.filter(b => entries.some(e => e.identity.bundle === b.id));
for (const bundle of bundles) {
  const bytes = await readFile('public' + bundle.url.split('?')[0]);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256);
}
const pins = { parentCommit, coordinateSystem: display.coordinateSystem, bundles,
  previousAllLessonsAndRecipesHash: hash(snapshot(api, display)), entries };
await writeFile('content/lateral-cricoarytenoid-us-pins.json', JSON.stringify(pins, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ pinsHash: hash(pins), beforeHash: pins.previousAllLessonsAndRecipesHash, placements: entries.length }));
