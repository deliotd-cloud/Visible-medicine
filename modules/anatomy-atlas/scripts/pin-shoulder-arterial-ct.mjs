import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';
const groups = { anteriorHumeral: ['FMA22682', 'FMA22683'], posteriorHumeral: ['FMA22685', 'FMA22687'], scapular: ['FMA23180', 'FMA23181'], thoracodorsal: ['FMA66321', 'FMA66322'] };
const names = { anteriorHumeral: /anterior circumflex humeral/i, posteriorHumeral: /posterior circumflex humeral/i, scapular: /circumflex scapular/i, thoracodorsal: /thoracodorsal/i };
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const parentCommit = 'b3995e784dfab02686e03a995e6e1e4e0ae150d9';
const api = await exactSourceHistoryApi(parentCommit);
const catalog = JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json'));
const display = api.bodyDisplayCatalog(catalog);
const entries = Object.entries(groups).flatMap(([group, ids]) => ids.map((fma, index) => {
  const matches = display.structures.filter(s => s.fmaId === fma); assert.equal(matches.length, 1);
  const identity = matches[0], previous = api.bodyLesson(identity, 'ct');
  assert.match(identity.name, names[group]);
  assert.equal(identity.laterality, index === 0 ? 'right' : 'left');
  assert.equal(previous.readiness, 'pending');
  return { identity, group, topics: ['ct'], previous: { ct: previous } };
}));
assert.equal(entries.length, 8);
const bundles = display.bundles.filter(b => entries.some(e => e.identity.bundle === b.id));
for (const bundle of bundles) {
  const bytes = await readFile('public' + bundle.url.split('?')[0]);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256);
}
const snapshot = { body: display.structures.map(s => ({ id: s.id, sections: Object.fromEntries(api.contentTabs.map(t => [t, api.bodyLesson(s, t)])) })), shoulder: api.structures, recipes: api.dissectionProfiles };
const pins = { parentCommit, coordinateSystem: display.coordinateSystem, bundles, previousAllLessonsAndRecipesHash: hash(snapshot), entries };
await writeFile('content/shoulder-arterial-ct-pins.json', JSON.stringify(pins, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ pinsHash: hash(pins), entries: entries.map(e => ({ fma: e.identity.fmaId, name: e.identity.name, side: e.identity.laterality, files: e.identity.sourceFiles })) }));
