import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { contentContext } from './content-contract-tools.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';
import imagingPins from '../content/foot-muscle-imaging-pins.json' with { type: 'json' };

const parentCommit = '7952a8a136a92700c6905908ab97aa0838b21e55';
assert(process.argv.slice(2).every(arg => arg === '--check'));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const groups = {
  firstLumbrical: 'lumbricals', secondLumbrical: 'lumbricals',
  thirdLumbrical: 'lumbricals', fourthLumbrical: 'lumbricals',
  firstPlantarInterosseous: 'plantarInterossei',
  secondPlantarInterosseous: 'plantarInterossei',
  thirdPlantarInterosseous: 'plantarInterossei',
  medialFlexorHallucisBrevis: 'flexorHallucisBrevis',
  lateralFlexorHallucisBrevis: 'flexorHallucisBrevis',
};
const { api, catalog } = await contentContext();
const before = await exactSourceHistoryApi(parentCommit, 'display-review');
const display = api.bodyDisplayCatalog(catalog);
assert.deepEqual(display, before.bodyDisplayCatalog(catalog));
const entries = imagingPins.entries.flatMap(({ identity: imaged, group: imagingGroup }) => {
  const group = groups[imagingGroup];
  if (!group) return [];
  const matches = display.structures.filter(s => s.id === imaged.id);
  assert.equal(matches.length, 1, imaged.id);
  const identity = matches[0];
  assert.deepEqual(identity, imaged);
  const previous = before.bodyLesson(identity, 'quiz');
  assert.equal(previous.readiness, 'generated-identification', identity.id);
  assert.equal(previous.correctAnswer, undefined, identity.id);
  return [{ identity, group, previous }];
});
assert.equal(entries.length, 18);
assert.equal(new Set(entries.map(e => e.identity.id)).size, 18);
assert.deepEqual([...new Set(entries.map(e => e.group))].sort(), Object.values(groups).filter((v, i, a) => a.indexOf(v) === i).sort());
assert.deepEqual(entries.reduce((count, e) => ({ ...count, [e.group]: (count[e.group] ?? 0) + 1 }), {}),
  { lumbricals: 8, plantarInterossei: 6, flexorHallucisBrevis: 4 });
const bundles = display.bundles.filter(b => entries.some(e => e.identity.bundle === b.id));
assert.equal(bundles.length, 2);
for (const bundle of bundles) {
  const bytes = await readFile('public' + bundle.url.split('?')[0]);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256);
}
const record = { parentCommit, catalogHash: hash(display), coordinateSystem: display.coordinateSystem, bundles, entries };
const path = new URL('../content/forefoot-muscle-quiz-pins.json', import.meta.url);
const output = JSON.stringify(record, null, 2) + '\n';
if (process.argv.includes('--check')) assert.equal((await readFile(path, 'utf8')).replaceAll('\r\n', '\n'), output);
else await writeFile(path, output, { flag: 'wx' });
console.log(JSON.stringify({ identities: entries.length, groups: 3, pinsHash: hash(record), clinicalApproval: false }));
