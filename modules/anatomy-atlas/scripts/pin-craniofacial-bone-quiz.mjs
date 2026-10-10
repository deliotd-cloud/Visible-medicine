import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { contentContext } from './content-contract-tools.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';

const parentCommit = '115f02e297f1f35827daf2837792857f36946df8';
assert(process.argv.slice(2).every(arg => arg === '--check'));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const expected = new Map([
  ['FMA52749', ['Hyoid bone', 'hyoid', 'midline', ['FJ2772', 'FJ3201']]],
  ['FMA54738', ['Left inferior nasal concha', 'inferiorConcha', 'left', ['FJ3263']]],
  ['FMA54737', ['Right inferior nasal concha', 'inferiorConcha', 'right', ['FJ3369']]],
  ['FMA53646', ['Left lacrimal bone', 'lacrimal', 'left', ['FJ3265']]],
  ['FMA53645', ['Right lacrimal bone', 'lacrimal', 'right', ['FJ3371']]],
  ['FMA53650', ['Left maxilla', 'maxilla', 'left', ['FJ3269']]],
  ['FMA53649', ['Right maxilla', 'maxilla', 'right', ['FJ3375']]],
  ['FMA53648', ['Left nasal bone', 'nasal', 'left', ['FJ3272']]],
  ['FMA53647', ['Right nasal bone', 'nasal', 'right', ['FJ3378']]],
  ['FMA53656', ['Left palatine bone', 'palatine', 'left', ['FJ3273']]],
  ['FMA53655', ['Right palatine bone', 'palatine', 'right', ['FJ3379']]],
  ['FMA52893', ['Left zygomatic bone', 'zygomatic', 'left', ['FJ3287']]],
  ['FMA52892', ['Right zygomatic bone', 'zygomatic', 'right', ['FJ3392']]],
  ['FMA52748', ['Mandible', 'mandible', 'midline', ['FJ3289']]],
  ['FMA9710', ['Vomer', 'vomer', 'midline', ['FJ3395']]],
]);
const { api, catalog } = await contentContext();
const before = await exactSourceHistoryApi(parentCommit, 'display-review');
const display = api.bodyDisplayCatalog(catalog);
assert.deepEqual(display, before.bodyDisplayCatalog(catalog));
const entries = display.structures.flatMap(identity => {
  const match = expected.get(identity.fmaId);
  if (!match) return [];
  assert.equal(identity.name, match[0], identity.fmaId);
  assert.equal(identity.system, 'skeleton', identity.fmaId);
  assert.equal(identity.category, 'bone', identity.fmaId);
  assert.equal(identity.laterality, match[2], identity.fmaId);
  assert.equal(identity.region, 'head-neck', identity.fmaId);
  assert.equal(identity.sourceTree, 'isa', identity.fmaId);
  assert.deepEqual(identity.sources.map(source => source.file), match[3], identity.fmaId);
  const previous = before.bodyLesson(identity, 'quiz');
  assert.equal(previous.readiness, 'generated-identification', identity.id);
  assert.equal(previous.correctAnswer, undefined, identity.id);
  return [{ identity, group: match[1], previous }];
});
assert.equal(entries.length, 15);
assert.equal(new Set(entries.map(e => e.identity.fmaId)).size, 15);
assert.equal(new Set(entries.map(e => e.identity.id)).size, 15);
for (const [fma] of expected) assert.equal(entries.filter(e => e.identity.fmaId === fma).length, 1);
for (const [group, count] of [['hyoid', 1], ['inferiorConcha', 2], ['lacrimal', 2], ['maxilla', 2], ['nasal', 2], ['palatine', 2], ['zygomatic', 2], ['mandible', 1], ['vomer', 1]]) assert.equal(entries.filter(e => e.group === group).length, count);
const eligible = display.structures.filter(identity => identity.region === 'head-neck' && identity.system === 'skeleton' && identity.category === 'bone' && before.bodyLesson(identity, 'quiz')?.readiness === 'generated-identification');
assert.deepEqual(entries.map(e => e.identity.id), eligible.map(e => e.id));
const bundles = display.bundles.filter(bundle => entries.some(entry => entry.identity.bundle === bundle.id));
assert.equal(bundles.length, 1);
for (const bundle of bundles) {
  const bytes = await readFile('public' + bundle.url.split('?')[0]);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256);
}
const record = { parentCommit, catalogHash: hash(display), coordinateSystem: display.coordinateSystem, bundles, entries };
const path = new URL('../content/craniofacial-bone-quiz-pins.json', import.meta.url);
const output = JSON.stringify(record, null, 2) + '\n';
if (process.argv.includes('--check')) assert.equal((await readFile(path, 'utf8')).replaceAll('\r\n', '\n'), output);
else {
  assert.equal((await readFile(path, 'utf8')).replaceAll('\r\n', '\n'), '{"entries":[]}\n', 'Only the bootstrap stub may be replaced');
  await writeFile(path, output);
}
console.log(JSON.stringify({ identities: entries.length, groups: 9, pinsHash: hash(record), clinicalApproval: false }));
