import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { contentContext } from './content-contract-tools.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';

const parentCommit = 'c27907d841039aaeccb96a755760dfa0fbe36730';
assert(process.argv.slice(2).every(arg => arg === '--check'));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const expected = new Map([
  ['FMA14544', ['Rectum', 'rectum', 'unpaired', 'organs', 'organ', 'pelvis', 'isa', ['FJ2571'], 'pelvis-organs-recovery']],
  ['FMA7875', ['Right first costal cartilage', 'firstCostal', 'right', 'connective', 'cartilage', 'thorax', 'isa', ['FJ3333'], 'thorax-connective-recovery']],
  ['FMA8005', ['Left first costal cartilage', 'firstCostal', 'left', 'connective', 'cartilage', 'thorax', 'isa', ['FJ3239'], 'thorax-connective-recovery']],
  ['FMA7886', ['Right second costal cartilage', 'laterCostal', 'right', 'connective', 'cartilage', 'thorax', 'isa', ['FJ3335'], 'thorax-connective-recovery']],
  ['FMA8031', ['Left second costal cartilage', 'laterCostal', 'left', 'connective', 'cartilage', 'thorax', 'isa', ['FJ3242'], 'thorax-connective-recovery']],
  ['FMA7913', ['Right third costal cartilage', 'laterCostal', 'right', 'connective', 'cartilage', 'thorax', 'isa', ['FJ3337'], 'thorax-connective-recovery']],
  ['FMA8058', ['Left third costal cartilage', 'laterCostal', 'left', 'connective', 'cartilage', 'thorax', 'isa', ['FJ3245'], 'thorax-connective-recovery']],
  ['FMA7976', ['Right fourth costal cartilage', 'laterCostal', 'right', 'connective', 'cartilage', 'thorax', 'isa', ['FJ3339'], 'thorax-connective-recovery']],
  ['FMA8167', ['Left fourth costal cartilage', 'laterCostal', 'left', 'connective', 'cartilage', 'thorax', 'isa', ['FJ3248'], 'thorax-connective-recovery']],
  ['FMA8070', ['Right fifth costal cartilage', 'laterCostal', 'right', 'connective', 'cartilage', 'thorax', 'isa', ['FJ3341'], 'thorax-connective-recovery']],
  ['FMA8112', ['Left fifth costal cartilage', 'laterCostal', 'left', 'connective', 'cartilage', 'thorax', 'isa', ['FJ3251'], 'thorax-connective-recovery']],
  ['FMA8194', ['Right sixth costal cartilage', 'laterCostal', 'right', 'connective', 'cartilage', 'thorax', 'isa', ['FJ3343'], 'thorax-connective-recovery']],
  ['FMA8221', ['Left sixth costal cartilage', 'laterCostal', 'left', 'connective', 'cartilage', 'thorax', 'isa', ['FJ3254'], 'thorax-connective-recovery']],
  ['FMA8248', ['Right seventh costal cartilage', 'laterCostal', 'right', 'connective', 'cartilage', 'thorax', 'isa', ['FJ3345'], 'thorax-connective-recovery']],
  ['FMA8275', ['Left seventh costal cartilage', 'laterCostal', 'left', 'connective', 'cartilage', 'thorax', 'isa', ['FJ3255'], 'thorax-connective-recovery']],
]);
const { api, catalog } = await contentContext();
const before = await exactSourceHistoryApi(parentCommit, 'display-review');
const display = api.bodyDisplayCatalog(catalog);
assert.deepEqual(display, before.bodyDisplayCatalog(catalog));
const entries = display.structures.flatMap(identity => {
  const match = expected.get(identity.fmaId);
  if (!match) return [];
  const [name, group, laterality, system, category, region, sourceTree, sources, bundle] = match;
  for (const [key, value] of Object.entries({ name, laterality, system, category, region, sourceTree, bundle })) assert.equal(identity[key], value, identity.fmaId);
  assert.deepEqual(identity.sources.map(source => source.file), sources, identity.fmaId);
  const previous = before.bodyLesson(identity, 'quiz');
  assert.equal(previous.readiness, 'generated-identification', identity.id);
  assert.equal(previous.correctAnswer, undefined, identity.id);
  return [{ identity, group, previous }];
});
assert.equal(entries.length, 15);
assert.equal(new Set(entries.map(e => e.identity.fmaId)).size, 15);
assert.equal(new Set(entries.map(e => e.identity.id)).size, 15);
for (const [fma] of expected) assert.equal(entries.filter(e => e.identity.fmaId === fma).length, 1);
assert.equal(entries.filter(e => e.group === 'rectum').length, 1);
assert.equal(entries.filter(e => e.group === 'firstCostal').length, 2);
assert.equal(entries.filter(e => e.group === 'laterCostal').length, 12);
const bundles = display.bundles.filter(bundle => entries.some(entry => entry.identity.bundle === bundle.id));
assert.equal(bundles.length, 2);
for (const bundle of bundles) {
  const bytes = await readFile('public' + bundle.url.split('?')[0]);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256);
}
const record = { parentCommit, catalogHash: hash(display), coordinateSystem: display.coordinateSystem, bundles, entries };
const path = new URL('../content/trunk-core-quiz-pins.json', import.meta.url);
const output = JSON.stringify(record, null, 2) + '\n';
if (process.argv.includes('--check')) assert.equal((await readFile(path, 'utf8')).replaceAll('\r\n', '\n'), output);
else {
  assert.equal((await readFile(path, 'utf8')).replaceAll('\r\n', '\n'), '{"entries":[]}\n', 'Only the bootstrap stub may be replaced');
  await writeFile(path, output);
}
console.log(JSON.stringify({ identities: entries.length, groups: 3, pinsHash: hash(record), clinicalApproval: false }));
