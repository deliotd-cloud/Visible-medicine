import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { context, snapshot, hash } from './pin-pica-clinical.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';

const parentCommit = '1af9a485525fa130842bd5c77afa9429d2930f9a';
const { display } = await context({ current: true });
const api = await exactSourceHistoryApi(parentCommit);
assert.deepEqual(api.bodyDisplayCatalog(display), display);
const matches = display.structures.filter(s => s.fmaId === 'FMA14647');
assert.equal(matches.length, 1);
const identity = matches[0];
assert.equal(identity.system, 'connective');
assert.equal(identity.region, 'abdomen');
assert.equal(identity.laterality, 'midline');
const previous = { mri: api.bodyLesson(identity, 'mri') };
assert.equal(previous.mri.readiness, 'pending');
const entries = [{ identity, topics: ['mri'], previous }];
const bundles = display.bundles.filter(b => entries.some(e => e.identity.bundle === b.id));
for (const bundle of bundles) {
  const bytes = await readFile('public' + bundle.url.split('?')[0]);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256);
}
const pins = { parentCommit, coordinateSystem: display.coordinateSystem, bundles,
  previousAllLessonsAndRecipesHash: hash(snapshot(api, display)), entries };
const filename = 'content/transverse-mesocolon-mri-pins.json';
if (process.argv.includes('--check')) assert.deepEqual(JSON.parse(await readFile(filename)), pins);
else await writeFile(filename, JSON.stringify(pins, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ identities: 1, placements: 1, pinsHash: hash(pins),
  beforeHash: pins.previousAllLessonsAndRecipesHash }));


