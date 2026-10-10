import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { contentContext } from './content-contract-tools.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';

const parentCommit = '9d40a9fcad09cbe3fc6eb89692cb0e2eaaa3b763';
assert(process.argv.slice(2).every(arg => arg === '--check'));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const expected = new Map([
  ['FMA72826', ['Right caudate nucleus', 'caudate', 'right', 'FJ1802']],
  ['FMA72827', ['Left caudate nucleus', 'caudate', 'left', 'FJ1754']],
  ['FMA72828', ['Right putamen', 'putamen', 'right', 'FJ1823']],
  ['FMA72829', ['Left putamen', 'putamen', 'left', 'FJ1776']],
  ['FMA72830', ['Right globus pallidus', 'globusPallidus', 'right', 'FJ1805']],
  ['FMA72831', ['Left globus pallidus', 'globusPallidus', 'left', 'FJ1757']],
  ['FMA258714', ['Right thalamus', 'thalamus', 'right', 'FJ1827']],
  ['FMA258716', ['Left thalamus', 'thalamus', 'left', 'FJ1782']],
  ['FMA73303', ['Right lateral geniculate body', 'lateralGeniculate', 'right', 'FJ1813']],
  ['FMA73304', ['Left lateral geniculate body', 'lateralGeniculate', 'left', 'FJ1766']],
  ['FMA73309', ['Right medial geniculate body', 'medialGeniculate', 'right', 'FJ1816']],
  ['FMA73310', ['Left medial geniculate body', 'medialGeniculate', 'left', 'FJ1816M']],
]);
const { api, catalog } = await contentContext();
const before = await exactSourceHistoryApi(parentCommit, 'display-review');
const display = api.bodyDisplayCatalog(catalog);
assert.deepEqual(display, before.bodyDisplayCatalog(catalog));
const entries = display.structures.flatMap(identity => {
  const match = expected.get(identity.fmaId);
  if (!match) return [];
  const [name, group, laterality, file] = match;
  for (const [key, value] of Object.entries({ name, laterality, system: 'nerves', category: 'organ', region: 'head-neck', sourceTree: 'isa', bundle: 'head-neck-nerves-deep-brain' })) assert.equal(identity[key], value, identity.fmaId);
  assert.deepEqual(identity.sources.map(source => source.file), [file], identity.fmaId);
  const previous = before.bodyLesson(identity, 'quiz');
  assert.equal(previous.readiness, 'generated-identification', identity.id);
  assert.equal(previous.correctAnswer, undefined, identity.id);
  return [{ identity, group, previous }];
});
assert.equal(entries.length, 12);
assert.equal(new Set(entries.map(e => e.identity.fmaId)).size, 12);
assert.equal(new Set(entries.map(e => e.identity.id)).size, 12);
for (const [fma] of expected) assert.equal(entries.filter(e => e.identity.fmaId === fma).length, 1);
for (const group of ['caudate', 'putamen', 'globusPallidus', 'thalamus', 'lateralGeniculate', 'medialGeniculate']) assert.equal(entries.filter(e => e.group === group).length, 2);
const bundles = display.bundles.filter(bundle => entries.some(entry => entry.identity.bundle === bundle.id));
assert.equal(bundles.length, 1);
for (const bundle of bundles) {
  const bytes = await readFile('public' + bundle.url.split('?')[0]);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256);
}
const record = { parentCommit, catalogHash: hash(display), coordinateSystem: display.coordinateSystem, bundles, entries };
const path = new URL('../content/deep-brain-quiz-pins.json', import.meta.url);
const output = JSON.stringify(record, null, 2) + '\n';
if (process.argv.includes('--check')) assert.equal((await readFile(path, 'utf8')).replaceAll('\r\n', '\n'), output);
else {
  assert.equal((await readFile(path, 'utf8')).replaceAll('\r\n', '\n'), '{"entries":[]}\n', 'Only the bootstrap stub may be replaced');
  await writeFile(path, output);
}
console.log(JSON.stringify({ identities: entries.length, groups: 6, pinsHash: hash(record), clinicalApproval: false }));
