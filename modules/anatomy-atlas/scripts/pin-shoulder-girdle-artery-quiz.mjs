import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {contentContext} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

const parentCommit = 'fa74cf70009f5ad8e21087ab12e4589547ebf741';
assert(process.argv.slice(2).every(arg => arg === '--check'));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const pairs = [
  ['thyrocervical', '3992', '4084', side => `${side} thyrocervical trunk`],
  ['costocervical', '5039', '4086', side => `${side} costocervical trunk`],
  ['dorsalScapular', '4057', '10552', side => `${side} dorsal scapular artery`],
  ['suprascapular', '10698', '10681', side => `${side} suprascapular artery`],
];
const expected = new Map(pairs.flatMap(([group, right, left, name]) => [
  ['FMA' + right, {group, name: name('Right'), side: 'right'}],
  ['FMA' + left, {group, name: name('Left'), side: 'left'}],
]));
const {api, catalog} = await contentContext();
const before = await exactSourceHistoryApi(parentCommit, 'display-review');
const display = api.bodyDisplayCatalog(catalog);
assert.deepEqual(display, before.bodyDisplayCatalog(catalog));
const entries = display.structures.flatMap(identity => {
  const match = expected.get(identity.fmaId);
  if (!match) return [];
  assert.equal(identity.name, match.name, identity.fmaId);
  assert.equal(identity.laterality, match.side, identity.fmaId);
  assert.equal(identity.system, 'vessels', identity.fmaId);
  assert.equal(identity.category, 'vessel', identity.fmaId);
  assert.equal(identity.region, 'shoulder-arm', identity.fmaId);
  assert(identity.regions.includes('thorax'), identity.fmaId);
  const previous = before.bodyLesson(identity, 'quiz');
  assert.equal(previous.readiness, 'generated-identification', identity.id);
  assert.equal(previous.correctAnswer, undefined, identity.id);
  return [{identity, group: match.group, previous}];
});
assert.equal(entries.length, 8);
assert.equal(new Set(entries.map(e => e.identity.fmaId)).size, 8);
assert.equal(new Set(entries.map(e => e.identity.id)).size, 8);
for (const [group] of pairs) assert.equal(entries.filter(e => e.group === group).length, 2, group);
const bundles = display.bundles.filter(bundle => entries.some(entry => entry.identity.bundle === bundle.id));
assert.equal(bundles.length, 1);
for (const bundle of bundles) {
  const bytes = await readFile('public' + bundle.url.split('?')[0]);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256);
}
const record = {parentCommit, catalogHash: hash(display), coordinateSystem: display.coordinateSystem, bundles, entries};
const path = new URL('../content/shoulder-girdle-artery-quiz-pins.json', import.meta.url);
const output = JSON.stringify(record, null, 2) + '\n';
if (process.argv.includes('--check')) assert.equal((await readFile(path, 'utf8')).replaceAll('\r\n', '\n'), output);
else {
  assert.equal((await readFile(path, 'utf8')).replaceAll('\r\n', '\n'), '{"entries":[]}\n', 'Only exact new bootstrap stub may be replaced');
  await writeFile(path, output);
}
console.log(JSON.stringify({identities: entries.length, groups: pairs.length, pinsHash: hash(record), clinicalApproval: false}));
