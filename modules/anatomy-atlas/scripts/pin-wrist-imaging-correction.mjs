import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

const baseline = '90191b8b236bfed00db7c424dbacde915920460d';
const api = await exactSourceHistoryApi(baseline, 'display');
const old = path => execFileSync('git', ['show', `${baseline}:${path}`], {windowsHide: true, maxBuffer: 32e6});
const hash = value => createHash('sha256').update(Buffer.isBuffer(value) ? value : JSON.stringify(value)).digest('hex');
const sourceCatalog = JSON.parse(old('public/models/bodyparts3d/full-body/catalog.json'));
assert.deepEqual(JSON.parse(readFileSync('public/models/bodyparts3d/full-body/catalog.json')), sourceCatalog);
const catalog = api.bodyDisplayCatalog(sourceCatalog);
const admission = JSON.parse(old('content/wrist-imaging-pins.json'));
assert.deepEqual(JSON.parse(readFileSync('content/wrist-imaging-pins.json')), admission);
assert.equal(admission.entries.length, 16);
const tabs = ['ct', 'mri', 'xray'];
const entries = admission.entries.map(({identity}) => {
  assert.deepEqual(catalog.structures.find(s => s.id === identity.id), identity);
  const previous = Object.fromEntries(tabs.map(tab => {
    const lesson = api.bodyLesson(identity, tab);
    assert.equal(lesson.readiness, 'draft');
    assert(lesson.bullets.some(text => text.includes('source relationswrists')));
    return [tab, lesson];
  }));
  return {identity, previous};
});
assert.equal(new Set(entries.map(e => e.identity.id)).size, 16);
const snapshot = {catalog, body: catalog.structures.map(s => ({id: s.id, topics: Object.fromEntries(api.contentTabs.map(tab => [tab, api.bodyLesson(s, tab)]))})), shoulder: api.structures, recipes: api.dissectionProfiles};
assert.equal(catalog.structures.length, 1104); assert.equal(api.contentTabs.length, 9);
const bundles = catalog.bundles.filter(b => entries.some(e => e.identity.bundle === b.id));
for (const bundle of bundles) {
  const file = `public${bundle.url.split('?')[0]}`, bytes = readFileSync(file);
  assert.equal(hash(bytes), bundle.sha256); assert.deepEqual(bytes, old(file));
}
const record = {baseline, sourceVersion: catalog.sourceVersion, license: catalog.license, coordinateSystem: catalog.coordinateSystem, bundles, beforeAllTeachingSnapshotHash: hash(snapshot), entries};
const file = 'content/wrist-imaging-correction-pins.json', output = JSON.stringify(record, null, 2) + '\n';
if (process.argv.includes('--check')) assert.equal(readFileSync(file, 'utf8').replaceAll('\r\n', '\n'), output);
else writeFileSync(file, output, {flag: 'wx'});
console.log(JSON.stringify({selections: 16, topics: 48, pinsHash: hash(record), snapshotHash: record.beforeAllTeachingSnapshotHash}));
