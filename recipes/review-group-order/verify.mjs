import fs from 'node:fs';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { hash, json } from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root = 'G:/VisibleMedicine-temp/staging/20261031-review-group-order-ready', pin = root + '/SOURCE.json', source = json(pin), site = source.website;
assert.equal(hash(pin), 'd719b7a0ab1dba6a89ef67677ed120036e246df46f96a92b3abee0572c968714');
const verify = () => { for (const row of source.sourceRows) assert.equal(hash(site + '/' + row.path), row.sha256, row.path); };
verify();
const roots = ['tests/clinical-review-quick-start.test.mjs', 'tests/clinical-review-quick-start-ui.test.mjs'];
const result = spawnSync(process.execPath, ['--max-old-space-size=256', '--test', '--test-concurrency=1', '--test-reporter=tap', ...roots], { cwd: site, encoding: 'utf8', windowsHide: true, maxBuffer: 1024 * 1024,
  env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=256', TEMP: root + '/tmp', TMP: root + '/tmp' } });
fs.writeFileSync(root + '/FOCUSED.tap', result.stdout + result.stderr, { flag: 'wx' });
assert.equal(result.status, 0, result.stdout + result.stderr);
for (const [key, n] of Object.entries({ tests: 19, pass: 19, fail: 0, cancelled: 0, skipped: 0, todo: 0 })) assert.match(result.stdout, new RegExp('^# ' + key + ' ' + n + '\\r?$', 'm'));
verify();
fs.writeFileSync(root + '/VERIFIED.json', JSON.stringify({ at: new Date().toISOString(), source: { path: pin, sha256: hash(pin) }, roots, tests: 19, pass: 19, fail: 0, skipped: 0,
  sourceUnchanged: true, protectedInputsUnchanged: true, scope: 'Quick review selection and rendered component contracts. Alphabetic display labels retain exact source IDs, issue priority, stale selections, qualifiers, duplicate disambiguation and no approval actions.',
  fullBuildPassed: false, wholeSuitePassing: false, installed: false, clinicalApproval: false }, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ pass: 19, sourceUnchanged: true, installed: false }));
