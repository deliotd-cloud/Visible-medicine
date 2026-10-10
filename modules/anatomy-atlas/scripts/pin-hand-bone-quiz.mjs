import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { contentContext } from './content-contract-tools.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';

const parentCommit = 'e802f0b8b24a6b74caf3e6c40c0454d8cef39914';
assert(process.argv.slice(2).every(arg => arg === '--check'));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const toGroup = name => {
  let match = /^(?:left|right) (first|second|third|fourth|fifth) metacarpal bone$/i.exec(name);
  if (match) return match[1].toLowerCase() + 'Metacarpal';
  match = /^(proximal|middle|distal) phalanx of (?:left|right) (thumb|index|middle|ring|little) finger$/i.exec(name);
  if (!match) match = /^(proximal|middle|distal) phalanx of (?:left|right) (thumb)$/i.exec(name);
  if (!match) return undefined;
  const level = match[1].toLowerCase(), thumb = match[2].toLowerCase() === 'thumb';
  assert(level !== 'middle' || !thumb);
  return level + (thumb ? 'Thumb' : 'Finger');
};
const counts = { firstMetacarpal: 2, secondMetacarpal: 2, thirdMetacarpal: 2, fourthMetacarpal: 2, fifthMetacarpal: 2,
  proximalThumb: 2, proximalFinger: 8, middleFinger: 8, distalThumb: 2, distalFinger: 8 };
const { api, catalog } = await contentContext();
const before = await exactSourceHistoryApi(parentCommit, 'display-review');
const display = api.bodyDisplayCatalog(catalog);
assert.deepEqual(display, before.bodyDisplayCatalog(catalog));
const entries = display.structures.flatMap(identity => {
  if (identity.system !== 'skeleton' || identity.region !== 'hand') return [];
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
const path = new URL('../content/hand-bone-quiz-pins.json', import.meta.url);
const output = JSON.stringify(record, null, 2) + '\n';
if (process.argv.includes('--check')) assert.equal((await readFile(path, 'utf8')).replaceAll('\r\n', '\n'), output);
else await writeFile(path, output, { flag: 'wx' });
console.log(JSON.stringify({ identities: entries.length, groups: Object.keys(counts).length, pinsHash: hash(record), clinicalApproval: false }));
