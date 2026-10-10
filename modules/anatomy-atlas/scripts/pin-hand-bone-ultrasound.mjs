import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

const baseline = 'cdc6ad23ad5c3c13a2f6588019a057d0a063818f';
const api = await exactSourceHistoryApi(baseline, 'display');
const old = path => execFileSync('git', ['show', `${baseline}:${path}`], {windowsHide: true, maxBuffer: 32e6});
const catalog = api.bodyDisplayCatalog(JSON.parse(old('public/models/bodyparts3d/full-body/catalog.json')));
const familyFor = s => {
  const name = s.name.toLowerCase();
  const thumb = /thumb/.test(name);
  if (/metacarpal/.test(name)) return /first metacarpal/.test(name) ? 'thumbMetacarpal' : 'metacarpal';
  if (/proximal phalanx/.test(name)) return thumb ? 'thumbProximal' : 'proximal';
  if (/middle phalanx/.test(name)) return 'middle';
  if (/distal phalanx/.test(name)) return thumb ? 'thumbDistal' : 'distal';
  for (const family of ['capitate', 'trapezium', 'trapezoid', 'triquetral']) if (name.includes(family)) return family;
  throw Error(`Unclassified pending hand bone: ${s.id}`);
};
const selected = catalog.structures.filter(s => s.region === 'hand' && s.bundle === 'hand-skeleton' && s.category === 'bone' && api.bodyLesson(s, 'ultrasound').readiness === 'pending');
assert.equal(selected.length, 46);
const entries = selected.map(identity => {
  assert.equal(identity.system, 'skeleton');
  assert(['left', 'right'].includes(identity.laterality));
  assert.equal(identity.sources.length, 1);
  assert.match(identity.sources[0].file, /^FJ\d+[A-Z]?$/);
  assert.match(identity.fmaId, /^FMA\d+$/);
  return {family: familyFor(identity), identity, previous: {ultrasound: api.bodyLesson(identity, 'ultrasound')}};
});
const expectedFamilies = {metacarpal: 8, thumbMetacarpal: 2, proximal: 8, thumbProximal: 2, middle: 8, distal: 8, thumbDistal: 2, capitate: 2, trapezium: 2, trapezoid: 2, triquetral: 2};
for (const [family, count] of Object.entries(expectedFamilies)) assert.equal(entries.filter(e => e.family === family).length, count, family);
assert.deepEqual([...new Set(entries.map(e => e.family))].sort(), Object.keys(expectedFamilies).sort());
const hash = value => createHash('sha256').update(typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value)).digest('hex');
const snapshot = {catalog, body: catalog.structures.map(s => ({id: s.id, topics: Object.fromEntries(api.contentTabs.map(tab => [tab, api.bodyLesson(s, tab)]))})), shoulder: api.structures, recipes: api.dissectionProfiles};
assert.equal(catalog.structures.length, 1104);
assert.equal(api.contentTabs.length, 9);
const bundles = catalog.bundles.filter(b => entries.some(e => e.identity.bundle === b.id));
assert.deepEqual(bundles.map(b => b.id), ['hand-skeleton']);
for (const bundle of bundles) {
  const file = `public${bundle.url.split('?')[0]}`;
  const bytes = readFileSync(file);
  assert.equal(hash(bytes), bundle.sha256);
  assert.deepEqual(bytes, old(file));
}
const record = {baseline, sourceVersion: catalog.sourceVersion, license: catalog.license, coordinateSystem: catalog.coordinateSystem, bundles, beforeAllTeachingSnapshotHash: hash(snapshot), entries};
const file = 'content/hand-bone-ultrasound-pins.json';
const output = JSON.stringify(record, null, 2) + '\n';
if (process.argv.includes('--check')) assert.equal(readFileSync(file, 'utf8').replaceAll('\r\n', '\n'), output);
else writeFileSync(file, output, {flag: 'wx'});
console.log(JSON.stringify({sources: entries.length, families: expectedFamilies, fullSnapshotTopics: 9936, snapshotHash: record.beforeAllTeachingSnapshotHash, pinsHash: hash(record)}));
