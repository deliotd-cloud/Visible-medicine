import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { context, snapshot, hash } from './pin-pica-clinical.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';
import prior from '../content/limb-bone-imaging-pins.json' with { type: 'json' };

const parentCommit = '8cd5588714338f7fd03950ab2506bf61e0bbc26f';
const { display } = await context({ current: true });
const api = await exactSourceHistoryApi(parentCommit);
assert.deepEqual(api.bodyDisplayCatalog(display), display);
const ids = ['FMA24474', 'FMA24475', 'FMA24477', 'FMA24478', 'FMA24480',
  'FMA24481', 'FMA23464', 'FMA23465', 'FMA23467', 'FMA23468'];
const entries = ids.map(fmaId => {
  const matches = display.structures.filter(s => s.fmaId === fmaId);
  assert.equal(matches.length, 1);
  const identity = matches[0], old = prior.entries.find(e => e.identity.fmaId === fmaId);
  assert(old); assert.deepEqual(identity, old.identity);
  assert.equal(identity.system, 'skeleton');
  const previous = { ultrasound: api.bodyLesson(identity, 'ultrasound') };
  assert.equal(previous.ultrasound.readiness, 'pending');
  return { identity, group: old.group, topics: ['ultrasound'], previous };
});
const bundles = display.bundles.filter(b => entries.some(e => e.identity.bundle === b.id));
for (const b of bundles) {
  const bytes = await readFile('public' + b.url.split('?')[0]);
  assert.equal(bytes.length, b.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), b.sha256);
}
const pins = { parentCommit, coordinateSystem: display.coordinateSystem, bundles,
  previousAllLessonsAndRecipesHash: hash(snapshot(api, display)), entries };
const filename = 'content/limb-bone-ultrasound-pins.json';
if (process.argv.includes('--check')) assert.deepEqual(JSON.parse(await readFile(filename)), pins);
else await writeFile(filename, JSON.stringify(pins, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ identities: 10, placements: 10, pinsHash: hash(pins),
  beforeHash: pins.previousAllLessonsAndRecipesHash }));
