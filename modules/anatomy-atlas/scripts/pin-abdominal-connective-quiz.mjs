import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { contentContext } from './content-contract-tools.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';

const parentCommit = 'fc6177b5be441aa47694c0d032d2aed4245d5c34';
assert(process.argv.slice(2).every(arg => arg === '--check'));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const expected = new Map([
  ['FMA11336', ['Linea alba', 'lineaAlba', 'fascia', 'midline', 'FJ1448']],
  ['FMA14643', ['Mesentery of small intestine', 'smallBowelMesentery', 'membrane', 'midline', 'FJ3396']],
  ['FMA14647', ['Transverse mesocolon', 'transverseMesocolon', 'membrane', 'midline', 'FJ3398']],
  ['FMA16549', ['Mesoappendix', 'mesoappendix', 'membrane', 'unspecified', 'FJ3397']],
]);
const { api, catalog } = await contentContext();
const before = await exactSourceHistoryApi(parentCommit, 'display-review');
const display = api.bodyDisplayCatalog(catalog);
assert.deepEqual(display, before.bodyDisplayCatalog(catalog));
const entries = display.structures.flatMap(identity => {
  const match = expected.get(identity.fmaId);
  if (!match) return [];
  assert.equal(identity.name, match[0], identity.fmaId);
  assert.equal(identity.system, 'connective', identity.fmaId);
  assert.equal(identity.category, match[2], identity.fmaId);
  assert.equal(identity.laterality, match[3], identity.fmaId);
  assert.equal(identity.region, 'abdomen', identity.fmaId);
  assert.equal(identity.sourceTree, 'isa', identity.fmaId);
  assert.deepEqual(identity.sources.map(source => source.file), [match[4]], identity.fmaId);
  const previous = before.bodyLesson(identity, 'quiz');
  assert.equal(previous.readiness, 'generated-identification', identity.id);
  assert.equal(previous.correctAnswer, undefined, identity.id);
  return [{ identity, group: match[1], previous }];
});
assert.equal(entries.length, 4);
assert.equal(new Set(entries.map(e => e.identity.fmaId)).size, 4);
assert.equal(new Set(entries.map(e => e.identity.id)).size, 4);
for (const [fma] of expected) assert.equal(entries.filter(e => e.identity.fmaId === fma).length, 1);
const bundles = display.bundles.filter(bundle => entries.some(entry => entry.identity.bundle === bundle.id));
assert.equal(bundles.length, 2);
for (const bundle of bundles) {
  const bytes = await readFile('public' + bundle.url.split('?')[0]);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256);
}
const record = { parentCommit, catalogHash: hash(display), coordinateSystem: display.coordinateSystem, bundles, entries };
const path = new URL('../content/abdominal-connective-quiz-pins.json', import.meta.url);
const output = JSON.stringify(record, null, 2) + '\n';
if (process.argv.includes('--check')) assert.equal((await readFile(path, 'utf8')).replaceAll('\r\n', '\n'), output);
else {
  assert.equal((await readFile(path, 'utf8')).replaceAll('\r\n', '\n'), '{"entries":[]}\n', 'Only the bootstrap stub may be replaced');
  await writeFile(path, output);
}
console.log(JSON.stringify({ identities: entries.length, groups: expected.size, pinsHash: hash(record), clinicalApproval: false }));
