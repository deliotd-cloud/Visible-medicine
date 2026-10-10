import assert from 'node:assert/strict';
import { readFile, writeFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { contentContext } from './content-contract-tools.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';

const parentCommit = 'd5c55031e1e032392469288a205bc88d48013eb0';
assert(process.argv.slice(2).every(arg => arg === '--check'));
const checking = process.argv.includes('--check');
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const targetSpecs = [
  ['FMA13325', 'right', 'FJ2272', 'cephalic', ['ct']],
  ['FMA13326', 'left', 'FJ2220', 'cephalic', ['ct']],
  ['FMA22909', 'right', 'FJ2270', 'basilic', ['ct']],
  ['FMA22910', 'left', 'FJ2218', 'basilic', ['ct']],
  ['FMA22964', 'right', 'FJ2287', 'medianCubital', ['ct', 'mri']],
  ['FMA22965', 'left', 'FJ2235', 'medianCubital', ['ct', 'mri']],
  ['FMA22968', 'right', 'FJ2286', 'medianAntebrachial', ['ct', 'mri']],
  ['FMA22969', 'left', 'FJ2234', 'medianAntebrachial', ['ct', 'mri']],
];
const { api, catalog } = await contentContext();
const before = await exactSourceHistoryApi(parentCommit, 'display-review');
const display = api.bodyDisplayCatalog(catalog);
assert.deepEqual(display, before.bodyDisplayCatalog(catalog));
const entries = targetSpecs.map(([fma, side, file, group, topics]) => {
  const matches = display.structures.filter(s => s.fmaId === fma);
  assert.equal(matches.length, 1, fma);
  const identity = matches[0];
  assert.equal(identity.laterality, side);
  assert.equal(identity.sourceTree, 'isa');
  assert.equal(identity.system, 'vessels');
  assert.equal(identity.category, 'vessel');
  assert.equal(identity.region, 'forearm');
  assert.deepEqual([...identity.regions].sort(), ['forearm', 'shoulder-arm'].sort());
  assert.deepEqual(identity.sources.map(s => s.file), [file]);
  const previous = Object.fromEntries(topics.map(tab => {
    const old = before.bodyLesson(identity, tab);
    assert.equal(old.readiness, 'pending', identity.id + ':' + tab);
    if (!checking) assert.deepEqual(api.bodyLesson(identity, tab), old);
    return [tab, old];
  }));
  return { identity, group, topics, previous };
});
assert.equal(entries.length, 8);
assert.equal(new Set(entries.map(e => e.identity.id)).size, 8);
assert.equal(entries.reduce((n, e) => n + e.topics.length, 0), 12);
for (const entry of entries.slice(0, 4)) {
  assert.equal(before.bodyLesson(entry.identity, 'mri').readiness, 'draft');
  assert.deepEqual(api.bodyLesson(entry.identity, 'mri'), before.bodyLesson(entry.identity, 'mri'));
}
const bundles = display.bundles.filter(b => entries.some(e => e.identity.bundle === b.id));
assert.equal(bundles.length, 2);
for (const b of bundles) {
  const bytes = await readFile('public' + b.url.split('?')[0]);
  assert.equal(bytes.length, b.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), b.sha256);
}
const record = {
  parentCommit, catalogHash: hash(display), sourceVersion: display.sourceVersion,
  license: display.license, coordinateSystem: display.coordinateSystem, bundles, entries,
};
const path = new URL('../content/forearm-venous-cross-sectional-pins.json', import.meta.url);
const output = JSON.stringify(record, null, 2) + '\n';
if (checking) assert.equal((await readFile(path, 'utf8')).replaceAll('\r\n', '\n'), output);
else {
  assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), parentCommit);
  await assert.rejects(access(path), 'Never overwrite existing source pins');
  await writeFile(path, output, { flag: 'wx' });
}
console.log(JSON.stringify({ selections: entries.length, placements: 12, pinsHash: hash(record), clinicalApproval: false }));
