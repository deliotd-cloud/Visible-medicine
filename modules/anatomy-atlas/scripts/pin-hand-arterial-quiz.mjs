import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { contentContext } from './content-contract-tools.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';
import { handUsSelections } from './pin-hand-arterial-ultrasound.mjs';
import ultrasoundPins from '../content/hand-arterial-ultrasound-pins.json' with { type: 'json' };

const parentCommit = 'f9bc493071ef316b527f2b55ddbf22e1ae2ec843';
assert(process.argv.slice(2).every(arg => arg === '--check'));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const { api, catalog } = await contentContext();
const before = await exactSourceHistoryApi(parentCommit, 'display-review');
const display = api.bodyDisplayCatalog(catalog);
assert.deepEqual(display, before.bodyDisplayCatalog(catalog));
const selected = new Map(ultrasoundPins.entries.map(entry => [entry.identity.fmaId, entry]));
assert.equal(selected.size, 28);
const entries = Object.entries(handUsSelections).flatMap(([group, fmas]) => fmas.map(fmaId => {
  const reference = selected.get(fmaId);
  assert(reference && reference.group === group, fmaId);
  const matches = display.structures.filter(s => s.fmaId === fmaId);
  assert.equal(matches.length, 1, fmaId);
  const identity = matches[0];
  assert.deepEqual(identity, reference.identity, fmaId);
  const previous = before.bodyLesson(identity, 'quiz');
  assert.equal(previous.readiness, 'generated-identification', identity.id);
  assert.equal(previous.correctAnswer, undefined, identity.id);
  return { identity, group, previous };
}));
assert.equal(entries.length, 28);
assert.equal(new Set(entries.map(entry => entry.identity.id)).size, 28);
for (const [group, fmas] of Object.entries(handUsSelections)) assert.equal(entries.filter(entry => entry.group === group).length, fmas.length);
const bundles = display.bundles.filter(bundle => entries.some(entry => entry.identity.bundle === bundle.id));
assert.deepEqual(bundles, ultrasoundPins.bundles);
for (const bundle of bundles) {
  const bytes = await readFile('public' + bundle.url.split('?')[0]);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256);
}
const record = { parentCommit, catalogHash: hash(display), coordinateSystem: display.coordinateSystem, bundles, entries };
const path = new URL('../content/hand-arterial-quiz-pins.json', import.meta.url);
const output = JSON.stringify(record, null, 2) + '\n';
if (process.argv.includes('--check')) assert.equal((await readFile(path, 'utf8')).replaceAll('\r\n', '\n'), output);
else {
  assert.equal((await readFile(path, 'utf8')).replaceAll('\r\n', '\n'), '{"entries":[]}\n', 'Only the bootstrap stub may be replaced');
  await writeFile(path, output);
}
console.log(JSON.stringify({ identities: entries.length, groups: Object.keys(handUsSelections).length, pinsHash: hash(record), clinicalApproval: false }));
