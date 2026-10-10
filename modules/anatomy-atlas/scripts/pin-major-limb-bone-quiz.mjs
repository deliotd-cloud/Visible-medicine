import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { contentContext } from './content-contract-tools.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';

const parentCommit = '242a1b5315cd1ed7ed7e9fef3f7d69bb0faf3ffe';
assert(process.argv.slice(2).every(arg => arg === '--check'));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const groups = ['hip bone', 'femur', 'fibula', 'patella', 'tibia', 'clavicle', 'humerus', 'radius', 'scapula', 'ulna'];
const toGroup = name => name === 'hip bone' ? 'hipBone' : name;
const { api, catalog } = await contentContext();
const before = await exactSourceHistoryApi(parentCommit, 'display-review');
const display = api.bodyDisplayCatalog(catalog);
assert.deepEqual(display, before.bodyDisplayCatalog(catalog));
const entries = display.structures.flatMap(identity => {
  if (identity.system !== 'skeleton') return [];
  const match = /^(left|right) (hip bone|femur|fibula|patella|tibia|clavicle|humerus|radius|scapula|ulna)$/i.exec(identity.name);
  if (!match || !groups.includes(match[2].toLowerCase())) return [];
  if (['clavicle', 'humerus', 'scapula'].includes(match[2].toLowerCase()) && match[1].toLowerCase() !== 'left') return [];
  const previous = before.bodyLesson(identity, 'quiz');
  assert.equal(previous.readiness, 'generated-identification', identity.id);
  assert.equal(previous.correctAnswer, undefined, identity.id);
  return [{ identity, group: toGroup(match[2].toLowerCase()), previous }];
});
assert.equal(entries.length, 17);
assert.equal(new Set(entries.map(e => e.identity.id)).size, 17);
const counts = { hipBone: 2, femur: 2, fibula: 2, patella: 2, tibia: 2, clavicle: 1, humerus: 1, radius: 2, scapula: 1, ulna: 2 };
assert.deepEqual(Object.fromEntries(Object.keys(counts).map(group => [group, entries.filter(e => e.group === group).length])), counts);
const bundles = display.bundles.filter(bundle => entries.some(entry => entry.identity.bundle === bundle.id));
for (const bundle of bundles) {
  const bytes = await readFile('public' + bundle.url.split('?')[0]);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256);
}
const record = { parentCommit, catalogHash: hash(display), coordinateSystem: display.coordinateSystem, bundles, entries };
const path = new URL('../content/major-limb-bone-quiz-pins.json', import.meta.url);
const output = JSON.stringify(record, null, 2) + '\n';
if (process.argv.includes('--check')) assert.equal((await readFile(path, 'utf8')).replaceAll('\r\n', '\n'), output);
else await writeFile(path, output, { flag: 'wx' });
console.log(JSON.stringify({ identities: entries.length, groups: Object.keys(counts).length, pinsHash: hash(record), clinicalApproval: false }));
