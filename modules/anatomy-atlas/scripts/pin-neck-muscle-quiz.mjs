import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { contentContext } from './content-contract-tools.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';

const parentCommit = 'af69bf38d0ca8a951281db0baf1a14b8d7c68bc5';
assert(process.argv.slice(2).every(arg => arg === '--check'));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const groups = new Map([
  ['scalenus anterior', 'scalenusAnterior'], ['scalenus medius', 'scalenusMedius'],
  ['scalenus posterior', 'scalenusPosterior'], ['sternocleidomastoid', 'sternocleidomastoid'],
  ['platysma', 'platysma'], ['omohyoid', 'omohyoid'], ['sternohyoid', 'sternohyoid'],
  ['sternothyroid', 'sternothyroid'], ['thyrohyoid', 'thyrohyoid'],
]);
export const neckMuscleGroup = name => groups.get(name.toLowerCase().replace(/^(?:left |right )/, ''));
const { api, catalog } = await contentContext();
const before = await exactSourceHistoryApi(parentCommit, 'display-review');
const display = api.bodyDisplayCatalog(catalog);
assert.deepEqual(display, before.bodyDisplayCatalog(catalog));
const entries = display.structures.flatMap(identity => {
  if (identity.system !== 'muscles' || identity.region !== 'head-neck') return [];
  const group = neckMuscleGroup(identity.name);
  if (!group) return [];
  const previous = before.bodyLesson(identity, 'quiz');
  assert.equal(previous.readiness, 'generated-identification', identity.id);
  assert.equal(previous.correctAnswer, undefined, identity.id);
  return [{ identity, group, previous }];
});
assert.equal(entries.length, 18);
assert.equal(new Set(entries.map(e => e.identity.id)).size, 18);
for (const group of groups.values()) assert.equal(entries.filter(e => e.group === group).length, 2, group);
const bundles = display.bundles.filter(bundle => entries.some(entry => entry.identity.bundle === bundle.id));
for (const bundle of bundles) {
  const bytes = await readFile('public' + bundle.url.split('?')[0]);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256);
}
const record = { parentCommit, catalogHash: hash(display), coordinateSystem: display.coordinateSystem, bundles, entries };
const path = new URL('../content/neck-muscle-quiz-pins.json', import.meta.url);
const output = JSON.stringify(record, null, 2) + '\n';
if (process.argv.includes('--check')) assert.equal((await readFile(path, 'utf8')).replaceAll('\r\n', '\n'), output);
else {
  assert.equal((await readFile(path, 'utf8')).replaceAll('\r\n', '\n'), '{"entries":[]}\n', 'Only the bootstrap stub may be replaced');
  await writeFile(path, output);
}
console.log(JSON.stringify({ identities: entries.length, groups: groups.size, pinsHash: hash(record), clinicalApproval: false }));
