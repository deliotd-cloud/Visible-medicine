import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {contentContext} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

const parentCommit = '66f11bf5aab91e056035e8ab9e5df11e4307775b';
assert(process.argv.length === 2 || (process.argv.length === 3 && process.argv[2] === '--check'));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const expected = new Map([
  ['FMA59102', {group: 'gland', side: 'right', name: 'Right lacrimal gland', bundle: 'head-neck-organs-gaps', file: 'FJ1350'}],
  ['FMA59103', {group: 'gland', side: 'left', name: 'Left lacrimal gland', bundle: 'head-neck-organs-gaps', file: 'FJ1299'}],
  ['FMA59582', {group: 'canaliculus', side: 'right', name: 'Right lacrimal canaliculus', bundle: 'head-neck-organs-ocular-detail', file: 'FJ1349'}],
  ['FMA59583', {group: 'canaliculus', side: 'left', name: 'Left lacrimal canaliculus', bundle: 'head-neck-organs-ocular-detail', file: 'FJ1298'}],
  ['FMA59555', {group: 'duct', side: 'right', name: 'Right nasolacrimal duct', bundle: 'head-neck-organs-ocular-detail', file: 'FJ1353'}],
  ['FMA59556', {group: 'duct', side: 'left', name: 'Left nasolacrimal duct', bundle: 'head-neck-organs-ocular-detail', file: 'FJ1302'}],
  ['FMA59545', {group: 'sac', side: 'right', name: 'Right lacrimal sac', bundle: 'head-neck-organs-ocular-detail', file: 'FJ1360'}],
  ['FMA59546', {group: 'sac', side: 'left', name: 'Left lacrimal sac', bundle: 'head-neck-organs-ocular-detail', file: 'FJ1309'}],
]);
const {api, catalog} = await contentContext(), before = await exactSourceHistoryApi(parentCommit, 'display-review');
const display = api.bodyDisplayCatalog(catalog);
assert.deepEqual(display, before.bodyDisplayCatalog(catalog));
const entries = display.structures.flatMap(identity => {
  const spec = expected.get(identity.fmaId);
  if (!spec) return [];
  assert.equal(identity.system, 'organs');
  assert.equal(identity.category, 'organ');
  assert.equal(identity.region, 'head-neck');
  assert.equal(identity.bundle, spec.bundle);
  assert.equal(identity.nodeName, identity.fmaId);
  assert.equal(identity.name, spec.name);
  assert.equal(identity.laterality, spec.side);
  assert.deepEqual(identity.sources.map(source => source.file), [spec.file]);
  const previous = before.bodyLesson(identity, 'quiz');
  assert.equal(previous.readiness, 'generated-identification');
  assert.equal(previous.correctAnswer, undefined);
  return [{identity, group: spec.group, previous}];
});
assert.equal(entries.length, 8);
assert.equal(new Set(entries.map(e => e.identity.id)).size, 8);
for (const [fma, spec] of expected) assert.equal(entries.filter(e => e.identity.fmaId === fma && e.group === spec.group).length, 1);
for (const group of ['gland', 'canaliculus', 'sac', 'duct'])
  assert.deepEqual(entries.filter(e => e.group === group).map(e => e.identity.laterality).sort(), ['left', 'right']);
const bundles = display.bundles.filter(bundle => entries.some(e => e.identity.bundle === bundle.id));
assert.equal(bundles.length, 2);
for (const bundle of bundles) {
  const bytes = await readFile('public' + bundle.url.split('?')[0]);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256);
}
const record = {parentCommit, catalogHash: hash(display), coordinateSystem: display.coordinateSystem, bundles, entries};
const path = new URL('../content/lacrimal-quiz-pins.json', import.meta.url), output = JSON.stringify(record, null, 2) + '\n';
if (process.argv.includes('--check')) assert.equal((await readFile(path, 'utf8')).replaceAll('\r\n', '\n'), output);
else {
  assert.equal((await readFile(path, 'utf8')).replaceAll('\r\n', '\n'), '{"entries":[]}\n');
  await writeFile(path, output);
}
console.log(JSON.stringify({identities: entries.length, groups: 4, bundles: bundles.length, pinsHash: hash(record), clinicalApproval: false}));
