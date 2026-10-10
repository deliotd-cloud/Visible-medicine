import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';

const parentCommit = 'd944f63c7517498fc571536271b96b111ce8ab05';
assert(process.argv.slice(2).every(arg => arg === '--check'));
const before = await exactSourceHistoryApi(parentCommit, 'display-review');
const raw = JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json'));
const display = before.bodyDisplayCatalog(raw);
const expected = new Map([
  ['FMA49067', ['Trochlea of right superior oblique', 'trochlea', 'right']],
  ['FMA49068', ['Trochlea of left superior oblique', 'trochlea', 'left']],
  ['FMA49072', ['Right common tendinous ring', 'ring', 'right']],
  ['FMA49073', ['Left common tendinous ring', 'ring', 'left']],
]);
const entries = display.structures.flatMap(identity => {
  const match = expected.get(identity.fmaId);
  if (!match) return [];
  assert.equal(identity.name, match[0]);
  assert.equal(identity.region, 'head-neck');
  assert.equal(identity.laterality, match[2]);
  const previous = before.bodyLesson(identity, 'quiz');
  assert.equal(previous.readiness, 'generated-identification');
  assert.equal(previous.correctAnswer, undefined);
  return [{identity, group: match[1], previous}];
});
assert.equal(entries.length, 4);
assert.equal(new Set(entries.map(e => e.identity.fmaId)).size, 4);
const bundles = display.bundles.filter(b => entries.some(e => e.identity.bundle === b.id));
for (const b of bundles) {
  const bytes = await readFile('public' + b.url.split('?')[0]);
  assert.equal(bytes.length, b.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), b.sha256);
}
const record = {parentCommit, coordinateSystem: display.coordinateSystem, bundles, entries};
const path = 'content/orbital-support-quiz-pins.json';
const output = JSON.stringify(record, null, 2) + '\n';
const existing = (await readFile(path, 'utf8')).replaceAll('\r\n', '\n');
if (process.argv.includes('--check')) assert.equal(existing, output);
else {
  assert.equal(existing, '{"entries":[]}\n', 'Only bootstrap stub may be replaced');
  await writeFile(path, output);
}
console.log(JSON.stringify({identities: entries.length, bundles: bundles.length, clinicalApproval: false}));
