import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';
const achillesCtGroups = { right: ['FMA258847'], left: ['FMA264844'] };
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const snapshot = (api, display) => ({ body: display.structures.map(s => ({ id: s.id, sections: Object.fromEntries(api.contentTabs.map(t => [t, api.bodyLesson(s, t)])) })), shoulder: api.structures, recipes: api.dissectionProfiles });

const parentCommit = '36c53fb9e19fca1c7e579f79d6d4807e4778ac19';
const api = await exactSourceHistoryApi(parentCommit);
const catalog = JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json'));
const display = api.bodyDisplayCatalog(catalog);

const entries = Object.entries(achillesCtGroups).flatMap(([group, ids]) => ids.map(fma => {
  const matches = display.structures.filter(s => s.fmaId === fma); assert.equal(matches.length, 1);
  const identity = matches[0], previous = api.bodyLesson(identity, 'ct');
  assert.equal(identity.laterality, group);
  assert.match(identity.name, /calcaneal|Achilles/i);
  assert.equal(previous.readiness, 'pending');
  return { identity, group, topics: ['ct'], previous: { ct: previous } };
}));
assert.equal(entries.length, 2);
const bundles = display.bundles.filter(b => entries.some(e => e.identity.bundle === b.id));
for (const bundle of bundles) {
  const bytes = await readFile('public' + bundle.url.split('?')[0]); assert.equal(bytes.length, bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256);
}
const pins = { parentCommit, coordinateSystem: display.coordinateSystem, bundles,
  previousAllLessonsAndRecipesHash: hash(snapshot(api, display)), entries };
await writeFile('content/achilles-ct-pins.json', JSON.stringify(pins, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ pinsHash: hash(pins), beforeHash: pins.previousAllLessonsAndRecipesHash, placements: entries.length }));
