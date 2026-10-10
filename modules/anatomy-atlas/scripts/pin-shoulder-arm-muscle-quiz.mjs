import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { contentContext } from './content-contract-tools.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';
import imagingPins from '../content/shoulder-arm-muscle-imaging-pins.json' with { type: 'json' };

const parentCommit = '0141a7060c9b9dd160ec39c877cbd61bc961a1ac';
assert(process.argv.slice(2).every(arg => arg === '--check'));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const groups = {
  'serratus-anterior': 'serratusAnterior', anconeus: 'anconeus', brachialis: 'brachialis',
  coracobrachialis: 'coracobrachialis', infraspinatus: 'infraspinatus',
  subscapularis: 'subscapularis', supraspinatus: 'supraspinatus',
  'teres-major': 'teresMajor', 'teres-minor': 'teresMinor', 'levator-scapulae': 'levatorScapulae',
  'rhomboid-major': 'rhomboids', 'rhomboid-minor': 'rhomboids',
  'deltoid-clavicular': 'deltoid', 'deltoid-acromial': 'deltoid', 'deltoid-spinal': 'deltoid',
  'biceps-short-head': 'bicepsBrachii', 'biceps-long-head': 'bicepsBrachii',
  'triceps-medial-head': 'tricepsBrachii', 'triceps-lateral-head': 'tricepsBrachii',
  'triceps-long-head': 'tricepsBrachii',
};
const { api, catalog } = await contentContext();
const before = await exactSourceHistoryApi(parentCommit, 'display-review');
const display = api.bodyDisplayCatalog(catalog);
assert.deepEqual(display, before.bodyDisplayCatalog(catalog));
const entries = imagingPins.entries.map(({ identity: imaged, group: imagingGroup }) => {
  const group = groups[imagingGroup];
  assert(group, imagingGroup);
  const matches = display.structures.filter(s => s.id === imaged.id);
  assert.equal(matches.length, 1, imaged.id);
  const identity = matches[0];
  assert.deepEqual(identity, imaged);
  const previous = before.bodyLesson(identity, 'quiz');
  assert.equal(previous.readiness, 'generated-identification', identity.id);
  assert.equal(previous.correctAnswer, undefined, identity.id);
  return { identity, group, previous };
});
assert.equal(entries.length, 32);
assert.equal(new Set(entries.map(e => e.identity.id)).size, 32);
assert.equal(new Set(entries.map(e => e.group)).size, 14);
const counts = { serratusAnterior: 2, anconeus: 2, brachialis: 2, coracobrachialis: 2,
  infraspinatus: 1, subscapularis: 1, supraspinatus: 1, teresMajor: 2, teresMinor: 1,
  levatorScapulae: 2, rhomboids: 4, deltoid: 3, bicepsBrachii: 3, tricepsBrachii: 6 };
assert.deepEqual(Object.fromEntries(Object.keys(counts).map(g => [g, entries.filter(e => e.group === g).length])), counts);
const bundles = display.bundles.filter(b => entries.some(e => e.identity.bundle === b.id));
assert.equal(bundles.length, 2);
for (const bundle of bundles) {
  const bytes = await readFile('public' + bundle.url.split('?')[0]);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256);
}
const record = { parentCommit, catalogHash: hash(display), coordinateSystem: display.coordinateSystem, bundles, entries };
const path = new URL('../content/shoulder-arm-muscle-quiz-pins.json', import.meta.url);
const output = JSON.stringify(record, null, 2) + '\n';
if (process.argv.includes('--check')) assert.equal((await readFile(path, 'utf8')).replaceAll('\r\n', '\n'), output);
else await writeFile(path, output, { flag: 'wx' });
console.log(JSON.stringify({ identities: entries.length, groups: 14, pinsHash: hash(record), clinicalApproval: false }));
