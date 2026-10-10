import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

const baseline = '88cea927d48729769b96ad8fe680b0872b7e6687';
const api = await exactSourceHistoryApi(baseline, 'display');
const old = path => execFileSync('git', ['show', `${baseline}:${path}`], {
  windowsHide: true, maxBuffer: 32e6,
});
const catalog = api.bodyDisplayCatalog(JSON.parse(old('public/models/bodyparts3d/full-body/catalog.json')));
const specs = [
  ['calcaneus', 'FMA24498', 'left', 'FJ3256', 'skeleton', 'bone', 'foot-skeleton'],
  ['calcaneus', 'FMA24497', 'right', 'FJ3360', 'skeleton', 'bone', 'foot-skeleton'],
  ['talus', 'FMA24483', 'left', 'FJ3280', 'skeleton', 'bone', 'foot-skeleton'],
  ['talus', 'FMA24482', 'right', 'FJ3385', 'skeleton', 'bone', 'foot-skeleton'],
  ['navicular', 'FMA24501', 'left', 'FJ3307', 'skeleton', 'bone', 'foot-skeleton'],
  ['navicular', 'FMA24500', 'right', 'FJ3308', 'skeleton', 'bone', 'foot-skeleton'],
  ['longPlantar', 'FMA44250', 'left', 'FJ1424M', 'connective', 'ligament', 'foot-connective-recovery'],
  ['longPlantar', 'FMA44249', 'right', 'FJ1424', 'connective', 'ligament', 'foot-connective-recovery'],
];
const entries = specs.map(([family, fmaId, laterality, file, system, category, bundle]) => {
  const rows = catalog.structures.filter(s => s.fmaId === fmaId);
  assert.equal(rows.length, 1, fmaId);
  const identity = rows[0];
  assert.equal(identity.region, 'foot');
  assert.equal(identity.system, system);
  assert.equal(identity.category, category);
  assert.equal(identity.laterality, laterality);
  assert.equal(identity.bundle, bundle);
  assert.deepEqual(identity.sources.map(s => s.file), [file]);
  const previous = {ultrasound: api.bodyLesson(identity, 'ultrasound')};
  assert.equal(previous.ultrasound.readiness, 'pending', `${fmaId} ultrasound`);
  return {family, identity, previous};
});
assert.equal(catalog.structures.length, 1104);
assert.equal(api.contentTabs.length, 9);
const hash = value => createHash('sha256')
  .update(typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value))
  .digest('hex');
const snapshot = {
  catalog,
  body: catalog.structures.map(s => ({
    id: s.id,
    topics: Object.fromEntries(api.contentTabs.map(tab => [tab, api.bodyLesson(s, tab)])),
  })),
  shoulder: api.structures,
  recipes: api.dissectionProfiles,
};
const bundles = catalog.bundles.filter(b => entries.some(e => e.identity.bundle === b.id));
assert.deepEqual(bundles.map(b => b.id).sort(), ['foot-connective-recovery', 'foot-skeleton']);
for (const bundle of bundles) {
  const path = `public${bundle.url.split('?')[0]}`;
  const bytes = readFileSync(path);
  assert.equal(hash(bytes), bundle.sha256, `${bundle.id} local hash`);
  assert.deepEqual(bytes, old(path), `${bundle.id} baseline bytes`);
}
const record = {
  baseline,
  sourceVersion: catalog.sourceVersion,
  license: catalog.license,
  coordinateSystem: catalog.coordinateSystem,
  bundles,
  beforeAllTeachingSnapshotHash: hash(snapshot),
  entries,
};
const path = 'content/foot-surface-imaging-pins.json';
const text = `${JSON.stringify(record, null, 2)}\n`;
if (process.argv.includes('--check'))
  assert.equal(readFileSync(path, 'utf8').replaceAll('\r\n', '\n'), text);
else
  writeFileSync(path, text, {flag: 'wx'});
console.log(JSON.stringify({
  sources: entries.length,
  topics: entries.reduce((n, e) => n + Object.keys(e.previous).length, 0),
  fullSnapshotTopics: catalog.structures.length * api.contentTabs.length,
  snapshotHash: record.beforeAllTeachingSnapshotHash,
  pinsHash: hash(record),
}));
