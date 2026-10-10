import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
const baseline = '398edc60a43f8d0235d9e6963c1ad56954b3fa98';
const api = await exactSourceHistoryApi(baseline, 'display');
const old = path => execFileSync('git', ['show', baseline + ':' + path], {windowsHide: true, maxBuffer: 32e6});
const catalog = api.bodyDisplayCatalog(JSON.parse(old('public/models/bodyparts3d/full-body/catalog.json')));
const specs = [
  ['fornicealCommissure', 'FMA61970', 'midline', 'FJ1741', ['function', 'clinical', 'pathology']],
  ['septalSource', 'FMA61842', 'midline', 'FJ1832', ['function', 'clinical', 'pathology']],
  ['striaMedullaris', 'FMA73414', 'left', 'FJ1777', ['clinical', 'pathology']],
  ['striaMedullaris', 'FMA73413', 'right', 'FJ1824', ['clinical', 'pathology']],
];
const entries = specs.map(([family, fmaId, laterality, file, tabs]) => {
  const rows = catalog.structures.filter(s => s.fmaId === fmaId);
  assert.equal(rows.length, 1, fmaId);
  const identity = rows[0];
  assert.equal(identity.region, 'head-neck'); assert.equal(identity.system, 'nerves');
  assert.equal(identity.category, 'organ'); assert.equal(identity.laterality, laterality);
  assert.deepEqual(identity.sources.map(s => s.file), [file]);
  const previous = Object.fromEntries(tabs.map(tab => {
    const lesson = api.bodyLesson(identity, tab); assert.equal(lesson.readiness, 'pending'); return [tab, lesson];
  }));
  return {family, identity, previous};
});
assert.equal(catalog.structures.length, 1104);
const hash = x => createHash('sha256').update(typeof x === 'string' || Buffer.isBuffer(x) ? x : JSON.stringify(x)).digest('hex');
const snapshot = {catalog, body: catalog.structures.map(s => ({id: s.id, topics: Object.fromEntries(api.contentTabs.map(t => [t, api.bodyLesson(s, t)]))})), shoulder: api.structures, recipes: api.dissectionProfiles};
const bundles = catalog.bundles.filter(b => entries.some(e => e.identity.bundle === b.id));
for (const b of bundles) {const path = 'public' + b.url.split('?')[0], bytes = readFileSync(path); assert.equal(hash(bytes), b.sha256); assert.deepEqual(bytes, old(path));}
const record = {baseline, sourceVersion: catalog.sourceVersion, license: catalog.license, coordinateSystem: catalog.coordinateSystem,
  bundles, beforeAllTeachingSnapshotHash: hash(snapshot), entries};
const path = 'content/deep-brain-core-teaching-pins.json', text = JSON.stringify(record, null, 2) + '\n';
if (process.argv.includes('--check')) assert.equal(readFileSync(path, 'utf8').replaceAll('\r\n', '\n'), text);
else writeFileSync(path, text, {flag: 'wx'});
console.log(JSON.stringify({sources: entries.length, topics: 10, snapshotHash: record.beforeAllTeachingSnapshotHash, pinsHash: hash(record)}));
