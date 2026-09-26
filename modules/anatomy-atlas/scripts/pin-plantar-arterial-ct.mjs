import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { context, snapshot, hash } from './pin-pica-clinical.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';

const parentCommit = '98ec565d1e959466dd5a59da23d10ac9d7c25eaa';
const { display } = await context({ current: true });
const api = await exactSourceHistoryApi(parentCommit);
assert.deepEqual(api.bodyDisplayCatalog(display), display);
const specifications = [
  ['medial', ['FMA43929', 'FMA43930']], ['lateral', ['FMA43931', 'FMA43932']],
  ['arch', ['FMA43943', 'FMA43944']], ['deep', ['FMA69514', 'FMA69515']],
  ['superficial', ['FMA43937', 'FMA43938']],
];
const entries = specifications.flatMap(([group, ids]) => ids.map(fmaId => {
  const matches = display.structures.filter(s => s.fmaId === fmaId);
  assert.equal(matches.length, 1);
  const identity = matches[0];
  assert.equal(identity.system, 'vessels');
  assert.equal(identity.region, 'foot');
  assert(['right', 'left'].includes(identity.laterality));
  const previous = { ct: api.bodyLesson(identity, 'ct') };
  assert.equal(previous.ct.readiness, 'pending');
  return { identity, group, topics: ['ct'], previous };
}));
const bundles = display.bundles.filter(b => entries.some(e => e.identity.bundle === b.id));
for (const bundle of bundles) {
  const bytes = await readFile('public' + bundle.url.split('?')[0]);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256);
}
const pins = { parentCommit, coordinateSystem: display.coordinateSystem, bundles,
  previousAllLessonsAndRecipesHash: hash(snapshot(api, display)), entries };
const filename = 'content/plantar-arterial-ct-pins.json';
if (process.argv.includes('--check')) assert.deepEqual(JSON.parse(await readFile(filename)), pins);
else await writeFile(filename, JSON.stringify(pins, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ identities: 10, placements: 10, pinsHash: hash(pins),
  beforeHash: pins.previousAllLessonsAndRecipesHash }));
