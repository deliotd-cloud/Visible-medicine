import fs from 'node:fs';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { hash, json } from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root = 'G:/VisibleMedicine-temp/staging/20261031-review-shared-filters-ready', pin = root + '/SOURCE.json', source = json(pin), site = source.website;
assert.equal(hash(pin), '4a0db69ce9d84d24da84bff5aeed8da5ea65c750d09bc8de6543dadf97961700');
const verify = () => { for (const row of source.sourceRows) assert.equal(hash(site + '/' + row.path), row.sha256, row.path); }; verify();
const roots = ['clinical-review-inbox-ui.test.mjs', 'clinical-review-quick-start-ui.test.mjs', 'clinical-review-quick-start.test.mjs',
 'clinical-review-inbox-filter-history.test.mjs', 'clinical-review-inbox-filter-recovery.test.mjs', 'clinical-review-inbox-pagination-focus.test.mjs',
 'clinical-review-inbox-auto-return.test.mjs', 'clinical-review-inbox-deferred-return.test.mjs', 'clinical-review-inbox-failure-focus.test.mjs', 'clinical-review-quick-return-focus.test.ts'].map(p => 'tests/' + p);
const result = spawnSync(process.execPath, ['--max-old-space-size=256', '--experimental-strip-types', '--test', '--test-concurrency=1', '--test-reporter=tap', ...roots], {
 cwd: site, encoding: 'utf8', windowsHide: true, maxBuffer: 8 * 1024 * 1024,
 env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=256', GOMEMLIMIT: '64MiB', GOMAXPROCS: '1', TEMP: root + '/tmp', TMP: root + '/tmp' } });
fs.writeFileSync(root + '/FOCUSED.tap', result.stdout + result.stderr, { flag: 'wx' });
const counts = {}; for (const key of ['tests', 'pass', 'fail', 'cancelled', 'skipped', 'todo']) {
 const matches = [...result.stdout.matchAll(new RegExp('^# ' + key + ' (\\d+)\\r?$', 'gm'))]; counts[key] = matches.length === 1 ? Number(matches[0][1]) : null;
}
verify(); const passed = result.status === 0 && counts.tests > 0 && counts.pass === counts.tests && ['fail', 'cancelled', 'skipped', 'todo'].every(key => counts[key] === 0);
fs.writeFileSync(root + '/VERIFIED.json', JSON.stringify({ at: new Date().toISOString(), source: { path: pin, sha256: hash(pin) }, roots, counts, passed,
 sourceUnchanged: true, fullBuildPassed: false, wholeSuitePassing: false, installed: false }, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ passed, counts })); if (!passed) process.exitCode = 1;
