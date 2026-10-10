import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {contentContext} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

const parentCommit = '975ff5abdba4582884a8cc34289fdc3416318093';
assert(process.argv.slice(2).every(arg => arg === '--check'));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const expected = new Map([
  ['FMA50801', {group: 'brain', name: 'Brain', system: 'nerves', category: 'organ', laterality: 'midline', region: 'head-neck', sources: 59}],
  ['FMA78497', {group: 'centralCanal', name: 'Central canal of spinal cord', system: 'nerves', category: 'space', laterality: 'midline', region: 'spine', sources: 1}],
  ['FMA13889', {group: 'pituitary', name: 'Pituitary gland', system: 'organs', category: 'organ', laterality: 'unpaired', region: 'head-neck', sources: 1}],
  ['FMA12514', {group: 'eyeball', name: 'Right eyeball', system: 'organs', category: 'organ', laterality: 'right', region: 'head-neck', sources: 8}],
  ['FMA12515', {group: 'eyeball', name: 'Left eyeball', system: 'organs', category: 'organ', laterality: 'left', region: 'head-neck', sources: 9}],
  ['FMA83966', {group: 'tentorium', name: 'Tentorium cerebelli (right-sided source only)', system: 'connective', category: 'membrane', laterality: 'right', region: 'head-neck', sources: 1}],
]);
const {api, catalog} = await contentContext();
const before = await exactSourceHistoryApi(parentCommit, 'display-review');
const display = api.bodyDisplayCatalog(catalog);
assert.deepEqual(display, before.bodyDisplayCatalog(catalog));
const entries = display.structures.flatMap(identity => {
  const match = expected.get(identity.fmaId);
  if (!match) return [];
  for (const key of ['name', 'system', 'category', 'laterality', 'region']) assert.equal(identity[key], match[key], identity.fmaId);
  assert.equal(identity.sources.length, match.sources, identity.fmaId);
  assert.equal(identity.nodeName, identity.fmaId, identity.fmaId);
  const previous = before.bodyLesson(identity, 'quiz');
  assert.equal(previous.readiness, 'generated-identification', identity.id);
  assert.equal(previous.correctAnswer, undefined, identity.id);
  return [{identity, group: match.group, previous}];
});
assert.equal(entries.length, 6);
assert.equal(new Set(entries.map(e => e.identity.fmaId)).size, 6);
assert.equal(new Set(entries.map(e => e.identity.id)).size, 6);
for (const [fmaId, match] of expected) assert.equal(entries.filter(e => e.identity.fmaId === fmaId && e.group === match.group).length, 1, fmaId);
const bundles = display.bundles.filter(bundle => entries.some(entry => entry.identity.bundle === bundle.id));
assert.equal(new Set(bundles.map(bundle => bundle.id)).size, new Set(entries.map(entry => entry.identity.bundle)).size);
for (const bundle of bundles) {
  const bytes = await readFile('public' + bundle.url.split('?')[0]);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256);
}
const record = {parentCommit, catalogHash: hash(display), coordinateSystem: display.coordinateSystem, bundles, entries};
const path = new URL('../content/neuro-organ-quiz-pins.json', import.meta.url);
const output = JSON.stringify(record, null, 2) + '\n';
if (process.argv.includes('--check')) assert.equal((await readFile(path, 'utf8')).replaceAll('\r\n', '\n'), output);
else {
  assert.equal((await readFile(path, 'utf8')).replaceAll('\r\n', '\n'), '{"entries":[]}\n', 'Only exact new bootstrap stub may be replaced');
  await writeFile(path, output);
}
console.log(JSON.stringify({identities: entries.length, groups: new Set(entries.map(e => e.group)).size, bundles: bundles.length, pinsHash: hash(record), clinicalApproval: false}));
