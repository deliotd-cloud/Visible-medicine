import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
const baseline = 'cbca085f2862f14df28007b32a4f2cd688dd01d5';
const api = await exactSourceHistoryApi(baseline, 'display');
const old = path => execFileSync('git', ['show', baseline + ':' + path], {cwd: new URL('../', import.meta.url), windowsHide: true, maxBuffer: 32e6});
const catalog = api.bodyDisplayCatalog(JSON.parse(old('public/models/bodyparts3d/full-body/catalog.json')));
const specifications = [
  ['artery', 'FMA10698', 'right', 'FJ2303'], ['artery', 'FMA10681', 'left', 'FJ2251'],
  ['vein', 'FMA50859', 'right', 'FJ2302'], ['vein', 'FMA50860', 'left', 'FJ2250'],
];
const entries = specifications.map(([family, fma, laterality, file]) => {
  const rows = catalog.structures.filter(s => s.fmaId === fma);
  assert.equal(rows.length, 1, fma);
  const identity = rows[0];
  assert.equal(identity.region, 'shoulder-arm');
  assert.equal(identity.category, 'vessel');
  assert.equal(identity.laterality, laterality);
  assert.deepEqual(identity.sources.map(s => s.file), [file]);
  const previous = api.bodyLesson(identity, 'ultrasound');
  assert.equal(previous.readiness, 'pending', identity.id);
  return {family, identity, previous};
});
assert.equal(catalog.structures.length, 1104);
const snapshot = {catalog, body: catalog.structures.map(s => ({id: s.id, topics: Object.fromEntries(api.contentTabs.map(t => [t, api.bodyLesson(s, t)]))})), shoulder: api.structures, recipes: api.dissectionProfiles};
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const bundles = catalog.bundles.filter(b => entries.some(e => e.identity.bundle === b.id));
for (const b of bundles) {
  const path = 'public' + b.url.split('?')[0];
  const bytes = readFileSync(new URL('../' + path, import.meta.url));
  assert.equal(sha(bytes), b.sha256);
  assert.deepEqual(bytes, old(path));
}
const record = {baseline, sourceVersion: catalog.sourceVersion, license: catalog.license, coordinateSystem: catalog.coordinateSystem,
  bundles, beforeAllTeachingSnapshotHash: sha(JSON.stringify(snapshot)), entries};
const path = new URL('../content/suprascapular-vessel-ultrasound-pins.json', import.meta.url);
const text = JSON.stringify(record, null, 2) + '\n';
if (process.argv.includes('--check')) assert.equal(readFileSync(path, 'utf8').replaceAll('\r\n', '\n'), text);
else writeFileSync(path, text, {flag: 'wx'});
console.log(JSON.stringify({sources: entries.length, snapshotHash: record.beforeAllTeachingSnapshotHash, pinsHash: sha(JSON.stringify(record))}));
