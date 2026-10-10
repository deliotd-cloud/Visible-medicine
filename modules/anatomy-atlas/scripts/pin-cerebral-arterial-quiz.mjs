import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { contentContext } from './content-contract-tools.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';

const parentCommit = '25f5dccb6e9f5e7d02450de1ef58144e7eb18718';
assert(process.argv.slice(2).every(arg => arg === '--check'));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const expected = new Map([
  ['FMA50542', ['Basilar artery', 'basilar', 'midline', ['FJ1672', 'FJ1844']]],
  ['FMA50169', ['Anterior communicating artery', 'anteriorCommunicating', 'midline', ['FJ1655']]],
  ['FMA50029', ['Right anterior cerebral artery', 'anteriorCerebral', 'right', ['FJ1654']]],
  ['FMA50030', ['Left anterior cerebral artery', 'anteriorCerebral', 'left', ['FJ1654M']]],
  ['FMA50584', ['Right posterior cerebral artery', 'posteriorCerebral', 'right', ['FJ1661', 'FJ1675', 'FJ1677', 'FJ1678', 'FJ1680', 'FJ1687', 'FJ1691', 'FJ1720', 'FJ1727']]],
  ['FMA50585', ['Left posterior cerebral artery', 'posteriorCerebral', 'left', ['FJ1661M', 'FJ1675M', 'FJ1677M', 'FJ1678M', 'FJ1680M', 'FJ1687M', 'FJ1691M', 'FJ1720M', 'FJ1727M']]],
  ['FMA50085', ['Right posterior communicating artery', 'posteriorCommunicating', 'right', ['FJ1713']]],
  ['FMA50086', ['Left posterior communicating artery', 'posteriorCommunicating', 'left', ['FJ1713M']]],
]);
const { api, catalog } = await contentContext();
const before = await exactSourceHistoryApi(parentCommit, 'display-review');
const display = api.bodyDisplayCatalog(catalog);
assert.deepEqual(display, before.bodyDisplayCatalog(catalog));
const entries = display.structures.flatMap(identity => {
  const match = expected.get(identity.fmaId);
  if (!match) return [];
  const [name, group, laterality, files] = match;
  for (const [key, value] of Object.entries({ name, laterality, system: 'vessels', category: 'vessel', region: 'head-neck', sourceTree: group === 'posteriorCerebral' ? 'partof' : 'isa', bundle: 'head-neck-vessels-recovery' })) assert.equal(identity[key], value, identity.fmaId);
  assert.deepEqual(identity.sources.map(source => source.file), files, identity.fmaId);
  const previous = before.bodyLesson(identity, 'quiz');
  assert.equal(previous.readiness, 'generated-identification', identity.id);
  assert.equal(previous.correctAnswer, undefined, identity.id);
  return [{ identity, group, previous }];
});
assert.equal(entries.length, 8);
assert.equal(new Set(entries.map(entry => entry.identity.id)).size, 8);
for (const [fma] of expected) assert.equal(entries.filter(entry => entry.identity.fmaId === fma).length, 1);
for (const group of ['basilar', 'anteriorCommunicating', 'anteriorCerebral', 'posteriorCommunicating', 'posteriorCerebral']) assert.equal(entries.filter(entry => entry.group === group).length, group === 'basilar' || group === 'anteriorCommunicating' ? 1 : 2);
const bundles = display.bundles.filter(bundle => entries.some(entry => entry.identity.bundle === bundle.id));
assert.equal(bundles.length, 1);
for (const bundle of bundles) {
  const bytes = await readFile('public' + bundle.url.split('?')[0]);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256);
}
const record = { parentCommit, catalogHash: hash(display), coordinateSystem: display.coordinateSystem, bundles, entries };
const path = new URL('../content/cerebral-arterial-quiz-pins.json', import.meta.url);
const output = JSON.stringify(record, null, 2) + '\n';
if (process.argv.includes('--check')) assert.equal((await readFile(path, 'utf8')).replaceAll('\r\n', '\n'), output);
else {
  assert.equal((await readFile(path, 'utf8')).replaceAll('\r\n', '\n'), '{"entries":[]}\n', 'Only the bootstrap stub may be replaced');
  await writeFile(path, output);
}
console.log(JSON.stringify({ identities: entries.length, groups: 5, pinsHash: hash(record), clinicalApproval: false }));
