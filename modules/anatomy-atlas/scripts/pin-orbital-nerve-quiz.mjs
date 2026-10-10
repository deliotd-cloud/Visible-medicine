import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { contentContext } from './content-contract-tools.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';

const parentCommit = 'b436df6fd03170d27c08d20bf6b29c7d27e0c320';
assert(process.argv.slice(2).every(arg => arg === '--check'));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const pairs = [
  ['anteriorEthmoidal', '52677', '52676', 'Left anterior ethmoidal nerve', 'Right anterior ethmoidal nerve'],
  ['frontal', '52640', '52639', 'Left frontal nerve', 'Right frontal nerve'],
  ['inferiorOculomotor', '52577', '52576', 'Inferior branch of left oculomotor nerve', 'Inferior branch of right oculomotor nerve'],
  ['infratrochlear', '52699', '52698', 'Left infratrochlear nerve', 'Right infratrochlear nerve'],
  ['lacrimal', '52630', '52629', 'Left lacrimal nerve', 'Right lacrimal nerve'],
  ['nasociliary', '52670', '52669', 'Left nasociliary nerve', 'Right nasociliary nerve'],
  ['ciliaryConnection', '52674', '52673', 'Communicating branch of left nasociliary nerve with left ciliary ganglion', 'Communicating branch of right nasociliary nerve with right ciliary ganglion'],
  ['ophthalmic', '52623', '52622', 'Left ophthalmic nerve', 'Right ophthalmic nerve'],
  ['posteriorEthmoidal', '52716', '52715', 'Left posterior ethmoidal nerve', 'Right posterior ethmoidal nerve'],
  ['longCiliary', '82735', '82734', 'Left long ciliary nerve', 'Right long ciliary nerve'],
  ['superiorOculomotor', '52575', '52574', 'Superior branch of left oculomotor nerve', 'Superior branch of right oculomotor nerve'],
  ['supraorbital', '52657', '52656', 'Left supra-orbital nerve', 'Right supra-orbital nerve'],
  ['supratrochlear', '52644', '52643', 'Left supratrochlear nerve', 'Right supratrochlear nerve'],
  ['trochlear', '50882', '50881', 'Left trochlear nerve', 'Right trochlear nerve'],
  ['ciliaryGanglion', '53550', '53549', 'Left ciliary ganglion', 'Right ciliary ganglion'],
];
const expected = new Map(pairs.flatMap(([group, left, right, leftName, rightName]) => [
  ['FMA' + left, [leftName, group]], ['FMA' + right, [rightName, group]],
]));
const { api, catalog } = await contentContext();
const before = await exactSourceHistoryApi(parentCommit, 'display-review');
const display = api.bodyDisplayCatalog(catalog);
assert.deepEqual(display, before.bodyDisplayCatalog(catalog));
const entries = display.structures.flatMap(identity => {
  const match = expected.get(identity.fmaId);
  if (!match) return [];
  assert.equal(identity.name, match[0], identity.fmaId);
  assert.equal(identity.system, 'nerves', identity.fmaId);
  assert.equal(identity.category, match[1] === 'ciliaryGanglion' ? 'organ' : 'nerve', identity.fmaId);
  assert.equal(identity.region, 'head-neck', identity.fmaId);
  const previous = before.bodyLesson(identity, 'quiz');
  assert.equal(previous.readiness, 'generated-identification', identity.id);
  assert.equal(previous.correctAnswer, undefined, identity.id);
  return [{ identity, group: match[1], previous }];
});
assert.equal(entries.length, expected.size);
assert.equal(new Set(entries.map(e => e.identity.fmaId)).size, expected.size);
assert.equal(new Set(entries.map(e => e.identity.id)).size, expected.size);
const bundles = display.bundles.filter(bundle => entries.some(entry => entry.identity.bundle === bundle.id));
assert.equal(bundles.length, 3);
for (const bundle of bundles) {
  const bytes = await readFile('public' + bundle.url.split('?')[0]);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256);
}
const record = { parentCommit, catalogHash: hash(display), coordinateSystem: display.coordinateSystem, bundles, entries };
const path = new URL('../content/orbital-nerve-quiz-pins.json', import.meta.url);
const output = JSON.stringify(record, null, 2) + '\n';
if (process.argv.includes('--check')) assert.equal((await readFile(path, 'utf8')).replaceAll('\r\n', '\n'), output);
else {
  assert.equal((await readFile(path, 'utf8')).replaceAll('\r\n', '\n'), '{"entries":[]}\n', 'Only the bootstrap stub may be replaced');
  await writeFile(path, output);
}
console.log(JSON.stringify({ identities: entries.length, groups: pairs.length, pinsHash: hash(record), clinicalApproval: false }));
