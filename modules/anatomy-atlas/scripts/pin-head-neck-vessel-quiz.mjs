import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { contentContext } from './content-contract-tools.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';

const parentCommit = 'ae0a56e5d074b921f259dc45c6c9167d6aac9125';
assert(process.argv.slice(2).every(arg => arg === '--check'));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const expected = new Map([
  ['FMA3941', ['Right common carotid artery', 'commonCarotid', 'right', ['FJ3564']]],
  ['FMA4058', ['Left common carotid artery', 'commonCarotid', 'left', ['FJ3483']]],
  ['FMA3949', ['Right internal carotid artery', 'internalCarotid', 'right', ['FJ1682']]],
  ['FMA4062', ['Left internal carotid artery', 'internalCarotid', 'left', ['FJ1682M']]],
  ['FMA3958', ['Right vertebral artery', 'vertebral', 'right', ['FJ1725']]],
  ['FMA4066', ['Left vertebral artery', 'vertebral', 'left', ['FJ1725M']]],
  ['FMA4754', ['Right internal jugular vein', 'internalJugular', 'right', ['FJ3585']]],
  ['FMA4762', ['Left internal jugular vein', 'internalJugular', 'left', ['FJ3485']]],
]);
const { api, catalog } = await contentContext();
const before = await exactSourceHistoryApi(parentCommit, 'display-review');
const display = api.bodyDisplayCatalog(catalog);
assert.deepEqual(display, before.bodyDisplayCatalog(catalog));
const entries = display.structures.flatMap(identity => {
  const match = expected.get(identity.fmaId);
  if (!match) return [];
  assert.equal(identity.name, match[0], identity.fmaId);
  assert.equal(identity.system, 'vessels', identity.fmaId);
  assert.equal(identity.category, 'vessel', identity.fmaId);
  assert.equal(identity.laterality, match[2], identity.fmaId);
  assert.equal(identity.region, 'head-neck', identity.fmaId);
  assert.equal(identity.sourceTree, 'isa', identity.fmaId);
  assert.deepEqual(identity.sources.map(source => source.file), match[3], identity.fmaId);
  const previous = before.bodyLesson(identity, 'quiz');
  assert.equal(previous.readiness, 'generated-identification', identity.id);
  assert.equal(previous.correctAnswer, undefined, identity.id);
  return [{ identity, group: match[1], previous }];
});
assert.equal(entries.length, 8);
assert.equal(new Set(entries.map(e => e.identity.fmaId)).size, 8);
assert.equal(new Set(entries.map(e => e.identity.id)).size, 8);
for (const [fma] of expected) assert.equal(entries.filter(e => e.identity.fmaId === fma).length, 1);
for (const group of ['commonCarotid', 'internalCarotid', 'vertebral', 'internalJugular']) assert.equal(entries.filter(e => e.group === group).length, 2);
const bundles = display.bundles.filter(bundle => entries.some(entry => entry.identity.bundle === bundle.id));
assert.equal(bundles.length, 1);
for (const bundle of bundles) {
  const bytes = await readFile('public' + bundle.url.split('?')[0]);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256);
}
const record = { parentCommit, catalogHash: hash(display), coordinateSystem: display.coordinateSystem, bundles, entries };
const path = new URL('../content/head-neck-vessel-quiz-pins.json', import.meta.url);
const output = JSON.stringify(record, null, 2) + '\n';
if (process.argv.includes('--check')) assert.equal((await readFile(path, 'utf8')).replaceAll('\r\n', '\n'), output);
else {
  assert.equal((await readFile(path, 'utf8')).replaceAll('\r\n', '\n'), '{"entries":[]}\n', 'Only the bootstrap stub may be replaced');
  await writeFile(path, output);
}
console.log(JSON.stringify({ identities: entries.length, groups: 4, pinsHash: hash(record), clinicalApproval: false }));
