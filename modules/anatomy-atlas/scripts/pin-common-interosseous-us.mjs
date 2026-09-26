import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { context, snapshot, hash } from './pin-pica-clinical.mjs';
import { commonInterosseousUsGroups } from '../content/common-interosseous-us.ts';
const parentCommit = 'aca60179199870ddfdb745fb4224775cb7d0c3d8';
assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), parentCommit);
const { api, display } = await context({ current: true });
const entries = Object.entries(commonInterosseousUsGroups).flatMap(([group, ids]) => ids.map(fma => {
  const matches = display.structures.filter(s => s.fmaId === fma); assert.equal(matches.length, 1);
  const identity = matches[0], previous = api.bodyLesson(identity, 'ultrasound');
  assert.equal(identity.region, 'forearm'); assert.equal(identity.system, 'vessels');
  assert.equal(previous.readiness, 'pending');
  return { identity, group, topics: ['ultrasound'], previous: { ultrasound: previous } };
}));
const bundles = display.bundles.filter(b => entries.some(e => e.identity.bundle === b.id));
for (const bundle of bundles) {
  const bytes = await readFile('public' + bundle.url.split('?')[0]); assert.equal(bytes.length, bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256);
}
const pins = { parentCommit, coordinateSystem: display.coordinateSystem, bundles,
  previousAllLessonsAndRecipesHash: hash(snapshot(api, display)), entries };
await writeFile('content/common-interosseous-us-pins.json', JSON.stringify(pins, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ pinsHash: hash(pins), beforeHash: pins.previousAllLessonsAndRecipesHash, placements: entries.length }));
