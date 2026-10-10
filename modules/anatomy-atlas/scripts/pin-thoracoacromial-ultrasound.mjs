import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

const baseline = '97ae6cea1b580c88d8de9ae9d0270400acac1dac';
assert(process.argv.slice(2).every(arg => arg === '--check'));
const old = path => execFileSync('git', ['show', `${baseline}:${path}`],
  {maxBuffer: 32e6, windowsHide: true, env: {...process.env, GIT_NO_REPLACE_OBJECTS: '1'}});
const api = await exactSourceHistoryApi(baseline, 'display-review');
const catalog = api.bodyDisplayCatalog(JSON.parse(old('public/models/bodyparts3d/full-body/catalog.json')));
const specs = [['trunk', '66563', '66564'], ['acromial', '23068', '23069'], ['deltoid', '23072', '23073']];
const entries = specs.flatMap(([family, right, left]) => [[right, 'right'], [left, 'left']].map(([fma, laterality]) => {
  const rows = catalog.structures.filter(s => s.fmaId === 'FMA' + fma);
  assert.equal(rows.length, 1, fma);
  const identity = rows[0];
  assert.equal(identity.system, 'vessels', fma);
  assert.equal(identity.category, 'vessel', fma);
  assert.equal(identity.region, 'shoulder-arm', fma);
  assert.equal(identity.laterality, laterality, fma);
  const previous = api.bodyLesson(identity, 'ultrasound');
  assert.equal(previous.readiness, 'pending', identity.id);
  return {family, identity, previous};
}));
assert.equal(entries.length, 6);
assert.equal(new Set(entries.map(e => e.identity.id)).size, 6);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const bundles = catalog.bundles.filter(bundle => entries.some(e => e.identity.bundle === bundle.id));
assert.equal(bundles.length, 1);
for (const bundle of bundles) {
  const path = 'public' + new URL(bundle.url, 'https://local.invalid').pathname;
  const bytes = readFileSync(path);
  assert.deepEqual(bytes, old(path));
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(sha(bytes), bundle.sha256);
}
const report = {baseline, sourceVersion: catalog.sourceVersion, license: catalog.license,
  coordinateSystem: catalog.coordinateSystem, bundles, entries};
const output = JSON.stringify(report, null, 2) + '\n';
const path = 'content/thoracoacromial-ultrasound-pins.json';
if (process.argv.includes('--check')) assert.equal(readFileSync(path, 'utf8').replaceAll('\r\n', '\n'), output);
else writeFileSync(path, output, {flag: 'wx'});
console.log(JSON.stringify({entries: entries.length, bundles: bundles.length, baseline}));
