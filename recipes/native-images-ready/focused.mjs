import fs from 'node:fs';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {hash, json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root = 'G:/VisibleMedicine-temp/staging/20261031-native-public-images-ready', pin = root + '/SOURCE.json', source = json(pin), site = source.website;
const files = ['tests/current-atlas-delivery.test.mjs', 'tests/head-epoch-projections.test.mjs', 'tests/site-image.test.mjs', 'tests/atlas-public-brand-image.test.mjs'];
const verify = () => {for (const r of source.sourceRows) assert.equal(hash(site + '/' + r.path), r.sha256, r.path);};
verify();
const result = spawnSync(process.execPath, ['--max-old-space-size=384', '--experimental-strip-types', '--test', '--test-isolation=none', '--test-concurrency=1', '--test-reporter=tap', ...files],
  {cwd: site, encoding: 'utf8', windowsHide: true, timeout: 240000, maxBuffer: 4 * 1024 * 1024,
    env: {...process.env, TEMP: root + '/tmp', TMP: root + '/tmp', VM_ATLAS_SOURCE_REPO: source.atlas, ATLAS_SOURCE_REPO: source.atlas, VM_CURRENT_SOURCE_RECEIPT: pin, VM_CURRENT_SOURCE_SHA256: hash(pin), VM_WEBSITE_ROOT: site}});
fs.writeFileSync(root + '/FOCUSED.tap', result.stdout ?? '', {flag: 'wx'});
fs.writeFileSync(root + '/FOCUSED.stderr.log', result.stderr ?? '', {flag: 'wx'});
const counts = Object.fromEntries(['tests', 'pass', 'fail', 'cancelled', 'skipped', 'todo'].map(k => [k, Number((result.stdout ?? '').match(new RegExp('^# ' + k + ' (\\d+)\\r?$', 'm'))?.[1] ?? -1)]));
verify();
const passing = result.status === 0 && counts.tests >= 60 && counts.pass === counts.tests && ['fail', 'cancelled', 'skipped', 'todo'].every(k => counts[k] === 0);
fs.writeFileSync(root + '/FOCUSED_RESULT.json', JSON.stringify({at: new Date().toISOString(), source: {path: pin, sha256: hash(pin)}, files, counts, status: result.status, signal: result.signal, error: result.error?.message ?? null, sourceUnchanged: true, passing, installed: false}, null, 2) + '\n', {flag: 'wx'});
console.log(JSON.stringify({counts, passing}));
assert(passing);
