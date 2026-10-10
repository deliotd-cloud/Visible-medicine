import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { contentContext } from './content-contract-tools.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';

const parentCommit = '027f29d54045256c7b4d359eaed45a3dee2c5b25';
assert(process.argv.slice(2).every(arg => arg === '--check'));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const expected = new Map([
  ['FMA22342', ['Right psoas major', 'rightPsoasMajor']],
  ['FMA22343', ['Left psoas major', 'leftPsoasMajor']],
  ['FMA13405', ['Right serratus posterior inferior', 'rightSerratusPosteriorInferior']],
  ['FMA13406', ['Left serratus posterior inferior', 'leftSerratusPosteriorInferior']],
  ['FMA13403', ['Right serratus posterior superior', 'rightSerratusPosteriorSuperior']],
  ['FMA13404', ['Left serratus posterior superior', 'leftSerratusPosteriorSuperior']],
]);
const { api, catalog } = await contentContext();
const before = await exactSourceHistoryApi(parentCommit, 'display-review');
const display = api.bodyDisplayCatalog(catalog);
assert.deepEqual(display, before.bodyDisplayCatalog(catalog));
const entries = display.structures.flatMap(identity => {
  const match = expected.get(identity.fmaId);
  if (!match) return [];
  assert.equal(identity.name, match[0], identity.fmaId);
  assert.equal(identity.system, 'muscles', identity.fmaId);
  assert.equal(identity.region, 'spine', identity.fmaId);
  const previous = before.bodyLesson(identity, 'quiz');
  assert.equal(previous.readiness, 'generated-identification', identity.id);
  assert.equal(previous.correctAnswer, undefined, identity.id);
  return [{ identity, group: match[1], previous }];
});
assert.equal(entries.length, expected.size);
assert.equal(new Set(entries.map(e => e.identity.fmaId)).size, expected.size);
assert.equal(new Set(entries.map(e => e.identity.id)).size, expected.size);
const bundles = display.bundles.filter(bundle => entries.some(entry => entry.identity.bundle === bundle.id));
for (const bundle of bundles) {
  const bytes = await readFile('public' + bundle.url.split('?')[0]);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256);
}
const record = { parentCommit, catalogHash: hash(display), coordinateSystem: display.coordinateSystem, bundles, entries };
const path = new URL('../content/spinal-muscle-quiz-pins.json', import.meta.url);
const output = JSON.stringify(record, null, 2) + '\n';
if (process.argv.includes('--check')) assert.equal((await readFile(path, 'utf8')).replaceAll('\r\n', '\n'), output);
else {
  assert.equal((await readFile(path, 'utf8')).replaceAll('\r\n', '\n'), '{"entries":[]}\n', 'Only the bootstrap stub may be replaced');
  await writeFile(path, output);
}
console.log(JSON.stringify({ identities: entries.length, groups: expected.size, pinsHash: hash(record), clinicalApproval: false }));
