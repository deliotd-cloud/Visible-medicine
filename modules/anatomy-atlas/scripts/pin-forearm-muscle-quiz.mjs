import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { contentContext } from './content-contract-tools.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';
import imagingPins from '../content/forearm-muscle-imaging-pins.json' with { type: 'json' };

const parentCommit = '1dc7916410479346c5f96ed0d9a42461eaada69b';
assert(process.argv.slice(2).every(arg => arg === '--check'));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const groups = {
  extensorCarpiUlnaris: 'extensorCarpiUlnaris',
  flexorDigitorumSuperficialis: 'flexorDigitorumSuperficialis',
  abductorPollicisLongus: 'abductorPollicisLongus',
  brachioradialis: 'brachioradialis',
  extensorCarpiRadialisBrevis: 'extensorCarpiRadialisBrevis',
  extensorCarpiRadialisLongus: 'extensorCarpiRadialisLongus',
  extensorDigitiMinimi: 'extensorDigitiMinimi',
  extensorDigitorum: 'extensorDigitorum',
  extensorIndicis: 'extensorIndicis',
  extensorPollicisBrevis: 'extensorPollicisBrevis',
  extensorPollicisLongus: 'extensorPollicisLongus',
  flexorCarpiRadialis: 'flexorCarpiRadialis',
  flexorDigitorumProfundus: 'flexorDigitorumProfundus',
  flexorPollicisLongus: 'flexorPollicisLongus',
  palmarisLongus: 'palmarisLongus',
  pronatorQuadratus: 'pronatorQuadratus',
  supinator: 'supinator',
  humeralPronatorTeres: 'pronatorTeres', ulnarPronatorTeres: 'pronatorTeres',
  humeralFlexorCarpiUlnaris: 'flexorCarpiUlnaris', ulnarFlexorCarpiUlnaris: 'flexorCarpiUlnaris',
};
const { api, catalog } = await contentContext();
const before = await exactSourceHistoryApi(parentCommit, 'display-review');
const display = api.bodyDisplayCatalog(catalog);
assert.deepEqual(display, before.bodyDisplayCatalog(catalog));
const entries = imagingPins.entries.map(({ identity: imaged, group: imagingGroup }) => {
  const group = groups[imagingGroup];
  assert(group, imagingGroup);
  const matches = display.structures.filter(s => s.id === imaged.id);
  assert.equal(matches.length, 1, imaged.id);
  const identity = matches[0];
  assert.deepEqual(identity, imaged);
  const previous = before.bodyLesson(identity, 'quiz');
  assert.equal(previous.readiness, 'generated-identification', identity.id);
  assert.equal(previous.correctAnswer, undefined, identity.id);
  return { identity, group, previous };
});
assert.equal(entries.length, 42);
assert.equal(new Set(entries.map(e => e.identity.id)).size, 42);
assert.equal(new Set(entries.map(e => e.group)).size, 19);
const counts = Object.fromEntries([...new Set(Object.values(groups))].map(g => [g, g === 'pronatorTeres' || g === 'flexorCarpiUlnaris' ? 4 : 2]));
assert.deepEqual(Object.fromEntries(Object.keys(counts).map(g => [g, entries.filter(e => e.group === g).length])), counts);
const bundles = display.bundles.filter(b => entries.some(e => e.identity.bundle === b.id));
assert.equal(bundles.length, 2);
for (const bundle of bundles) {
  const bytes = await readFile('public' + bundle.url.split('?')[0]);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256);
}
const record = { parentCommit, catalogHash: hash(display), coordinateSystem: display.coordinateSystem, bundles, entries };
const path = new URL('../content/forearm-muscle-quiz-pins.json', import.meta.url);
const output = JSON.stringify(record, null, 2) + '\n';
if (process.argv.includes('--check')) assert.equal((await readFile(path, 'utf8')).replaceAll('\r\n', '\n'), output);
else await writeFile(path, output, { flag: 'wx' });
console.log(JSON.stringify({ identities: entries.length, groups: 19, pinsHash: hash(record), clinicalApproval: false }));
