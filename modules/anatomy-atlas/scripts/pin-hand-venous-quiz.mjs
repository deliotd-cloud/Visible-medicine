import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { contentContext } from './content-contract-tools.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';
import { handVenousAdmissions } from './hand-venous-selections.mjs';
import imagingPins from '../content/hand-venous-imaging-pins.json' with { type: 'json' };

const parentCommit = '49202472cd917b5f52948279ab6cc7d19b2208d1';
assert(process.argv.slice(2).every(arg => arg === '--check'));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const groups = {
  deepArch: ['FMA22912', 'FMA22913'],
  superficialArch: ['FMA22915', 'FMA22916'],
  dorsalNetwork: ['FMA62506', 'FMA62507'],
  metacarpal: ['FMA22920', 'FMA22921'],
  properDigital: ['FMA85096', 'FMA85097', 'FMA85098', 'FMA85099', 'FMA85100', 'FMA85101'],
};
assert.deepEqual(Object.values(groups).flat(), handVenousAdmissions);
const { api, catalog } = await contentContext();
const before = await exactSourceHistoryApi(parentCommit, 'display-review');
const display = api.bodyDisplayCatalog(catalog);
assert.deepEqual(display, before.bodyDisplayCatalog(catalog));
const selected = new Map(imagingPins.entries.map(entry => [entry.identity.fmaId, entry]));
assert.equal(selected.size, 14);
const entries = Object.entries(groups).flatMap(([group, fmas]) => fmas.map(fmaId => {
  const reference = selected.get(fmaId);
  assert(reference, fmaId);
  const matches = display.structures.filter(s => s.fmaId === fmaId);
  assert.equal(matches.length, 1, fmaId);
  const identity = matches[0];
  assert.deepEqual(identity, reference.identity, fmaId);
  const previous = before.bodyLesson(identity, 'quiz');
  assert.equal(previous.readiness, 'generated-identification', identity.id);
  assert.equal(previous.correctAnswer, undefined, identity.id);
  return { identity, group, previous };
}));
assert.equal(entries.length, 14);
assert.equal(new Set(entries.map(entry => entry.identity.id)).size, 14);
const bundles = display.bundles.filter(bundle => entries.some(entry => entry.identity.bundle === bundle.id));
assert.deepEqual(bundles, imagingPins.bundles);
for (const bundle of bundles) {
  const bytes = await readFile('public' + bundle.url.split('?')[0]);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256);
}
const record = { parentCommit, catalogHash: hash(display), coordinateSystem: display.coordinateSystem, bundles, entries };
const path = new URL('../content/hand-venous-quiz-pins.json', import.meta.url);
const output = JSON.stringify(record, null, 2) + '\n';
if (process.argv.includes('--check')) assert.equal((await readFile(path, 'utf8')).replaceAll('\r\n', '\n'), output);
else {
  assert.equal((await readFile(path, 'utf8')).replaceAll('\r\n', '\n'), '{"entries":[]}\n', 'Only the bootstrap stub may be replaced');
  await writeFile(path, output);
}
console.log(JSON.stringify({ identities: entries.length, groups: Object.keys(groups).length, pinsHash: hash(record), clinicalApproval: false }));
