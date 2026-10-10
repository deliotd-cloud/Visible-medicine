import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { contentContext } from './content-contract-tools.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';
import imagingPins from '../content/hand-muscle-imaging-pins.json' with { type: 'json' };

const parentCommit = '9b66b2d0ca4a6f02c14826fbfbd5f973ddcf5605';
assert(process.argv.slice(2).every(arg => arg === '--check'));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const groups = {
  abductorDigitiMinimi: 'abductorDigitiMinimi',
  flexorDigitiMinimiBrevis: 'flexorDigitiMinimiBrevis',
  opponensDigitiMinimi: 'opponensDigitiMinimi',
  abductorPollicisBrevis: 'abductorPollicisBrevis',
  opponensPollicis: 'opponensPollicis',
  adductorOblique: 'adductorPollicis', adductorTransverse: 'adductorPollicis',
  lumbricalGroup: 'lumbricalGroup',
  palmarInterosseousGroup: 'palmarInterosseousGroup',
  dorsalInterosseousGroup: 'dorsalInterosseousGroup',
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
assert.equal(entries.length, 20);
assert.equal(new Set(entries.map(e => e.identity.id)).size, 20);
assert.equal(new Set(entries.map(e => e.group)).size, 9);
assert.deepEqual(entries.reduce((count, e) => ({ ...count, [e.group]: (count[e.group] ?? 0) + 1 }), {}),
  { abductorDigitiMinimi: 2, flexorDigitiMinimiBrevis: 2, opponensDigitiMinimi: 2,
    abductorPollicisBrevis: 2, opponensPollicis: 2, adductorPollicis: 4,
    lumbricalGroup: 2, palmarInterosseousGroup: 2, dorsalInterosseousGroup: 2 });
const bundles = display.bundles.filter(b => entries.some(e => e.identity.bundle === b.id));
assert.equal(bundles.length, 4);
for (const bundle of bundles) {
  const bytes = await readFile('public' + bundle.url.split('?')[0]);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256);
}
const record = { parentCommit, catalogHash: hash(display), coordinateSystem: display.coordinateSystem, bundles, entries };
const path = new URL('../content/hand-muscle-quiz-pins.json', import.meta.url);
const output = JSON.stringify(record, null, 2) + '\n';
if (process.argv.includes('--check')) assert.equal((await readFile(path, 'utf8')).replaceAll('\r\n', '\n'), output);
else await writeFile(path, output, { flag: 'wx' });
console.log(JSON.stringify({ identities: entries.length, groups: 9, pinsHash: hash(record), clinicalApproval: false }));
