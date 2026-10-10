import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {contentContext} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

const parentCommit = 'a8500d445240bd025900ff1fafc63287839ad72a';
assert(process.argv.length === 2 || (process.argv.length === 3 && process.argv[2] === '--check'));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const expected = new Map([
  ['FMA46580', 'lateral'], ['FMA46581', 'lateral'],
  ['FMA46577', 'posterior'], ['FMA46578', 'posterior'],
  ['FMA46584', 'oblique'], ['FMA46585', 'oblique'],
  ['FMA46589', 'thyroarytenoid'], ['FMA46590', 'thyroarytenoid'],
  ['FMA46592', 'vocalis'], ['FMA46593', 'vocalis'],
  ['FMA46582', 'transverse'],
]);
const {api, catalog} = await contentContext(), before = await exactSourceHistoryApi(parentCommit, 'display-review');
const display = api.bodyDisplayCatalog(catalog);
assert.deepEqual(display, before.bodyDisplayCatalog(catalog));
const entries = display.structures.flatMap(identity => {
  const group = expected.get(identity.fmaId);
  if (!group) return [];
  assert.equal(identity.system, 'muscles');
  assert.equal(identity.category, 'muscle');
  assert.equal(identity.region, 'head-neck');
  assert.equal(identity.bundle, 'head-neck-muscles');
  assert.equal(identity.nodeName, identity.fmaId);
  assert.deepEqual(identity.sources.map(source => source.file), identity.fmaId === 'FMA46590' ? ['FJ2784', 'FJ2785'] : identity.fmaId === 'FMA46589' ? ['FJ2802', 'FJ2803'] : [{FMA46581: 'FJ2778', FMA46585: 'FJ2780', FMA46578: 'FJ2782', FMA46593: 'FJ2788', FMA46580: 'FJ2796', FMA46584: 'FJ2798', FMA46577: 'FJ2800', FMA46592: 'FJ2806', FMA46582: 'FJ2809'}[identity.fmaId]]);
  assert(identity.name.toLowerCase().includes(group === 'thyroarytenoid' ? 'thyro-arytenoid' : group === 'lateral' || group === 'posterior' ? `${group} crico-arytenoid` : group === 'oblique' ? 'oblique arytenoid' : group === 'transverse' ? 'transverse arytenoid' : 'vocalis'));
  assert.equal(identity.laterality, group === 'transverse' ? 'midline' : identity.name.startsWith('Left') ? 'left' : 'right');
  const previous = before.bodyLesson(identity, 'quiz');
  assert.equal(previous.readiness, 'generated-identification');
  assert.equal(previous.correctAnswer, undefined);
  return [{identity, group, previous}];
});
assert.equal(entries.length, 11);
assert.equal(new Set(entries.map(e => e.identity.id)).size, 11);
for (const [fma, group] of expected) assert.equal(entries.filter(e => e.identity.fmaId === fma && e.group === group).length, 1);
for (const group of ['lateral', 'posterior', 'oblique', 'thyroarytenoid', 'vocalis'])
  assert.deepEqual(entries.filter(e => e.group === group).map(e => e.identity.laterality).sort(), ['left', 'right']);
assert.deepEqual(entries.filter(e => e.group === 'transverse').map(e => e.identity.laterality), ['midline']);
const bundles = display.bundles.filter(bundle => entries.some(e => e.identity.bundle === bundle.id));
assert.equal(bundles.length, 1);
for (const bundle of bundles) {
  const bytes = await readFile('public' + bundle.url.split('?')[0]);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256);
}
const record = {parentCommit, catalogHash: hash(display), coordinateSystem: display.coordinateSystem, bundles, entries};
const path = new URL('../content/laryngeal-muscle-quiz-pins.json', import.meta.url), output = JSON.stringify(record, null, 2) + '\n';
if (process.argv.includes('--check')) assert.equal((await readFile(path, 'utf8')).replaceAll('\r\n', '\n'), output);
else {
  assert.equal((await readFile(path, 'utf8')).replaceAll('\r\n', '\n'), '{"entries":[]}\n');
  await writeFile(path, output);
}
console.log(JSON.stringify({identities: entries.length, groups: 6, bundles: bundles.length, pinsHash: hash(record), clinicalApproval: false}));
