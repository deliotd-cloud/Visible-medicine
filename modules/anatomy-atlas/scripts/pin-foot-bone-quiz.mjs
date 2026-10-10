import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { contentContext } from './content-contract-tools.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';

const parentCommit = '1dc4f82f677c3a9ccd04f2d0d875210ac0d1ef98';
assert(process.argv.slice(2).every(arg => arg === '--check'));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const toGroup = name => {
  let match = /^((?:first|second|third|fourth|fifth)) metatarsal bone$/i.exec(name.replace(/^(left|right) /i, ''));
  if (match) return match[1].toLowerCase() + 'Metatarsal';
  match = /^(proximal|middle|distal) phalanx of (?:left|right) (big|second|third|fourth|little) toe$/i.exec(name);
  if (!match) return undefined;
  const level = match[1].toLowerCase(), hallux = match[2].toLowerCase() === 'big';
  assert(level !== 'middle' || !hallux);
  return level + (hallux ? 'Hallux' : 'Lesser');
};
const counts = { firstMetatarsal: 2, secondMetatarsal: 2, thirdMetatarsal: 2, fourthMetatarsal: 2, fifthMetatarsal: 2,
  proximalHallux: 2, proximalLesser: 8, middleLesser: 8, distalHallux: 2, distalLesser: 8 };
const { api, catalog } = await contentContext();
const before = await exactSourceHistoryApi(parentCommit, 'display-review');
const display = api.bodyDisplayCatalog(catalog);
assert.deepEqual(display, before.bodyDisplayCatalog(catalog));
const entries = display.structures.flatMap(identity => {
  if (identity.system !== 'skeleton' || identity.region !== 'foot') return [];
  const group = toGroup(identity.name);
  if (!group) return [];
  assert(group in counts, identity.id);
  const previous = before.bodyLesson(identity, 'quiz');
  assert.equal(previous.readiness, 'generated-identification', identity.id);
  assert.equal(previous.correctAnswer, undefined, identity.id);
  return [{ identity, group, previous }];
});
assert.equal(entries.length, 38);
assert.equal(new Set(entries.map(e => e.identity.id)).size, 38);
assert.deepEqual(Object.fromEntries(Object.keys(counts).map(group => [group, entries.filter(e => e.group === group).length])), counts);
const bundles = display.bundles.filter(bundle => entries.some(entry => entry.identity.bundle === bundle.id));
for (const bundle of bundles) {
  const bytes = await readFile('public' + bundle.url.split('?')[0]);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256);
}
const record = { parentCommit, catalogHash: hash(display), coordinateSystem: display.coordinateSystem, bundles, entries };
const path = new URL('../content/foot-bone-quiz-pins.json', import.meta.url);
const output = JSON.stringify(record, null, 2) + '\n';
if (process.argv.includes('--check')) assert.equal((await readFile(path, 'utf8')).replaceAll('\r\n', '\n'), output);
else await writeFile(path, output, { flag: 'wx' });
console.log(JSON.stringify({ identities: entries.length, groups: Object.keys(counts).length, pinsHash: hash(record), clinicalApproval: false }));
