import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';
import { elbowArterialCtGroups } from '../content/elbow-arterial-ct.ts';
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const snapshot = (api, display) => ({ body: display.structures.map(s => ({ id: s.id, sections: Object.fromEntries(api.contentTabs.map(t => [t, api.bodyLesson(s, t)])) })), shoulder: api.structures, recipes: api.dissectionProfiles });

const parentCommit = '98562916526b9530cd3e9c67cc9511fbb09bfbe9';
const api = await exactSourceHistoryApi(parentCommit);
const catalog = JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json'));
const display = api.bodyDisplayCatalog(catalog);
const source = JSON.parse(await readFile('public/models/bodyparts3d/elbow-arteries/catalog.json'));
const entries = Object.entries(elbowArterialCtGroups).flatMap(([group, ids]) => ids.map(fma => {
  const matches = display.structures.filter(s => s.fmaId === fma); assert.equal(matches.length, 1);
  const identity = matches[0], previous = api.bodyLesson(identity, 'ct');
  assert.deepEqual(identity, source.structures.find(s => s.id === identity.id));
  assert.equal(identity.system, 'vessels'); assert.equal(identity.category, 'vessel');
  assert.equal(previous.readiness, 'pending');
  return { identity, group, topics: ['ct'], previous: { ct: previous } };
}));
assert.equal(entries.length, 14); assert.equal(source.structures.length, 14);
const bundles = display.bundles.filter(b => entries.some(e => e.identity.bundle === b.id));
for (const bundle of bundles) {
  const bytes = await readFile('public' + bundle.url.split('?')[0]); assert.equal(bytes.length, bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256);
}
const pins = { parentCommit, coordinateSystem: display.coordinateSystem, bundles,
  previousAllLessonsAndRecipesHash: hash(snapshot(api, display)), entries };
await writeFile('content/elbow-arterial-ct-pins.json', JSON.stringify(pins, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ pinsHash: hash(pins), beforeHash: pins.previousAllLessonsAndRecipesHash, placements: entries.length }));
