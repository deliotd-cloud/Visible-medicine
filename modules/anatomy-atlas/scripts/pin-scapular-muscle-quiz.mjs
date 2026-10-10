import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {contentContext} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

const parentCommit = 'f2e1a56027bbe0efe9eef1720ccc699ae7da90fe';
assert(process.argv.slice(2).every(arg => arg === '--check'));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const expected = new Map([
  ['FMA13412', 'subclavius'], ['FMA13411', 'subclavius'],
  ['FMA33581', 'ascending'], ['FMA33583', 'ascending'],
  ['FMA33584', 'transverse'], ['FMA33585', 'transverse'],
  ['FMA33586', 'descending'], ['FMA33587', 'descending'],
]);
const {api, catalog} = await contentContext();
const before = await exactSourceHistoryApi(parentCommit, 'display-review');
const display = api.bodyDisplayCatalog(catalog);
assert.deepEqual(display, before.bodyDisplayCatalog(catalog));
const entries = display.structures.flatMap(identity => {
  const group = expected.get(identity.fmaId);
  if (!group) return [];
  assert.equal(identity.system, 'muscles', identity.fmaId);
  assert.equal(identity.category, 'muscle', identity.fmaId);
  assert.equal(identity.nodeName, identity.fmaId, identity.fmaId);
  assert.equal(identity.sources.length, 1, identity.fmaId);
  assert.match(identity.name.toLowerCase(), new RegExp(group === 'subclavius' ? 'subclavius' : `trapezius.*${group}|${group}.*trapezius`));
  const previous = before.bodyLesson(identity, 'quiz');
  assert.equal(previous.readiness, 'generated-identification', identity.id);
  assert.equal(previous.correctAnswer, undefined, identity.id);
  return [{identity, group, previous}];
});
assert.equal(entries.length, 8);
assert.equal(new Set(entries.map(e => e.identity.fmaId)).size, 8);
assert.equal(new Set(entries.map(e => e.identity.id)).size, 8);
for (const [fmaId, group] of expected) assert.equal(entries.filter(e => e.identity.fmaId === fmaId && e.group === group).length, 1, fmaId);
const bundles = display.bundles.filter(bundle => entries.some(entry => entry.identity.bundle === bundle.id));
assert.equal(new Set(bundles.map(bundle => bundle.id)).size, new Set(entries.map(entry => entry.identity.bundle)).size);
for (const bundle of bundles) {
  const bytes = await readFile('public' + bundle.url.split('?')[0]);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256);
}
const record = {parentCommit, catalogHash: hash(display), coordinateSystem: display.coordinateSystem, bundles, entries};
const path = new URL('../content/scapular-muscle-quiz-pins.json', import.meta.url);
const output = JSON.stringify(record, null, 2) + '\n';
if (process.argv.includes('--check')) assert.equal((await readFile(path, 'utf8')).replaceAll('\r\n', '\n'), output);
else {
  assert.equal((await readFile(path, 'utf8')).replaceAll('\r\n', '\n'), '{"entries":[]}\n', 'Only exact new bootstrap stub may be replaced');
  await writeFile(path, output);
}
console.log(JSON.stringify({identities: entries.length, groups: new Set(entries.map(e => e.group)).size, bundles: bundles.length, pinsHash: hash(record), clinicalApproval: false}));
