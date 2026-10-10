import assert from 'node:assert/strict';
import { readFile, writeFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { contentContext } from './content-contract-tools.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';

const parentCommit = '4890de3dc9f0ab70aaad78f0bf281570bfde6afc';
assert(process.argv.slice(2).every(arg => arg === '--check'));
const checking = process.argv.includes('--check');
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const targetSpecs = [
  ['FMA55138', 'midline', 'FJ2790', 'medianThyrohyoid', ['ct', 'mri']],
  ['FMA55140', 'right', 'FJ2797', 'lateralThyrohyoid', ['ct', 'mri']],
  ['FMA55141', 'left', 'FJ2779', 'lateralThyrohyoid', ['ct', 'mri']],
  ['FMA55227', 'unspecified', 'FJ2771', 'hyoEpiglottic', ['ct', 'mri']],
  ['FMA55230', 'midline', 'FJ2807', 'thyroEpiglottic', ['ct', 'mri']],
  ['FMA55237', 'midline', 'FJ2789', 'medianCricothyroid', ['ct', 'mri']],
  ['FMA55245', 'right', 'FJ2805', 'vocal', ['ct', 'mri']],
  ['FMA55246', 'left', 'FJ2787', 'vocal', ['ct', 'mri']],
  ['FMA55133', 'right', 'FJ2804', 'thyrohyoidMembrane', ['ct', 'mri']],
  ['FMA55134', 'left', 'FJ2786', 'thyrohyoidMembrane', ['ct', 'mri']],
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
  assert.equal(identity.system, 'connective');
  assert.equal(identity.category, group === 'thyrohyoidMembrane' ? 'membrane' : 'ligament');
  assert.equal(identity.region, 'head-neck');
  assert.deepEqual([...identity.regions].sort(), ['head-neck']);
  assert.deepEqual(identity.sources.map(s => s.file), [file]);
  const previous = Object.fromEntries(topics.map(tab => {
    const old = before.bodyLesson(identity, tab);
    assert.equal(old.readiness, 'pending', identity.id + ':' + tab);
    if (!checking) assert.deepEqual(api.bodyLesson(identity, tab), old);
    return [tab, old];
  }));
  return { identity, group, topics, previous };
});
assert.equal(entries.length, 10);
assert.equal(new Set(entries.map(e => e.identity.id)).size, 10);
assert.equal(entries.reduce((n, e) => n + e.topics.length, 0), 20);

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
const path = new URL('../content/laryngeal-support-imaging-pins.json', import.meta.url);
const output = JSON.stringify(record, null, 2) + '\n';
if (checking) assert.equal((await readFile(path, 'utf8')).replaceAll('\r\n', '\n'), output);
else {
  assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), parentCommit);
  await assert.rejects(access(path), 'Never overwrite existing source pins');
  await writeFile(path, output, { flag: 'wx' });
}
console.log(JSON.stringify({ selections: entries.length, placements: 20, pinsHash: hash(record), clinicalApproval: false }));
