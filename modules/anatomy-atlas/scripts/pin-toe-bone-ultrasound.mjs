import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

const baseline = 'a1cb14f05b3070b8553e85e3596f634b2bf36a5d';
const api = await exactSourceHistoryApi(baseline, 'display');
const old = path => execFileSync('git', ['show', `${baseline}:${path}`], {windowsHide: true, maxBuffer: 32e6});
const catalog = api.bodyDisplayCatalog(JSON.parse(old('public/models/bodyparts3d/full-body/catalog.json')));
const familyFor = s => {
  const name = s.name.toLowerCase();
  assert.match(name, /phalanx of (?:left|right) (?:big|second|third|fourth|little) toe$/);
  const bigToe = /big toe$/.test(name);
  if (/^proximal phalanx/.test(name)) return bigToe ? 'halluxProximal' : 'lesserProximal';
  if (/^middle phalanx/.test(name) && !bigToe) return 'middle';
  if (/^distal phalanx/.test(name)) return bigToe ? 'halluxDistal' : 'lesserDistal';
  throw Error(`Unclassified pending toe bone: ${s.id}`);
};
const selected = catalog.structures.filter(s => s.region === 'foot' && s.bundle === 'foot-skeleton' && s.system === 'skeleton' && s.category === 'bone' && /phalanx.*toe$/i.test(s.name) && api.bodyLesson(s, 'ultrasound').readiness === 'pending');
assert.equal(selected.length, 28);
const entries = selected.map(identity => {
  assert(['left', 'right'].includes(identity.laterality));
  assert.equal(identity.sources.length, 1);
  assert.match(identity.sources[0].file, /^FJ\d+[A-Z]?$/);
  assert.match(identity.fmaId, /^FMA\d+$/);
  const previous = {ultrasound: api.bodyLesson(identity, 'ultrasound')};
  assert.equal(previous.ultrasound.readiness, 'pending');
  return {family: familyFor(identity), identity, previous};
});
const expectedFamilies = {halluxProximal: 2, lesserProximal: 8, middle: 8, halluxDistal: 2, lesserDistal: 8};
for (const [family, count] of Object.entries(expectedFamilies)) assert.equal(entries.filter(e => e.family === family).length, count, family);
assert.deepEqual([...new Set(entries.map(e => e.family))].sort(), Object.keys(expectedFamilies).sort());
const hash = value => createHash('sha256').update(typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value)).digest('hex');
const snapshot = {catalog, body: catalog.structures.map(s => ({id: s.id, topics: Object.fromEntries(api.contentTabs.map(tab => [tab, api.bodyLesson(s, tab)]))})), shoulder: api.structures, recipes: api.dissectionProfiles};
assert.equal(catalog.structures.length, 1104);
assert.equal(api.contentTabs.length, 9);
const bundles = catalog.bundles.filter(b => entries.some(e => e.identity.bundle === b.id));
assert.deepEqual(bundles.map(b => b.id), ['foot-skeleton']);
for (const bundle of bundles) {
  const file = `public${bundle.url.split('?')[0]}`;
  const bytes = readFileSync(file);
  assert.equal(hash(bytes), bundle.sha256);
  assert.deepEqual(bytes, old(file));
}
const record = {baseline, sourceVersion: catalog.sourceVersion, license: catalog.license, coordinateSystem: catalog.coordinateSystem, bundles, beforeAllTeachingSnapshotHash: hash(snapshot), entries};
const file = 'content/toe-bone-ultrasound-pins.json';
const output = JSON.stringify(record, null, 2) + '\n';
if (process.argv.includes('--check')) assert.equal(readFileSync(file, 'utf8').replaceAll('\r\n', '\n'), output);
else writeFileSync(file, output, {flag: 'wx'});
console.log(JSON.stringify({sources: entries.length, families: expectedFamilies, fullSnapshotTopics: 9936, snapshotHash: record.beforeAllTeachingSnapshotHash, pinsHash: hash(record)}));
