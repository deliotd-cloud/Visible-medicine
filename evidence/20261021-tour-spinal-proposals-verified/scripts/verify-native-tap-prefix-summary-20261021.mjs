import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { sha, read } from './source-only-backup-20261019.mjs';
const stage = 'F:/VisibleMedicine/staging/20261021-native-prefix-observer-proof';
assert(!fs.existsSync(stage), 'Create-only proof');
fs.mkdirSync(stage);
const inputs = ['native-tap-prefix-summary.mjs', 'test-native-tap-prefix-summary.mjs', 'observe-source190-suite-20261021.mjs']
  .map(path => ({ path, sha256: sha(read(path)) }));
const result = spawnSync(process.execPath, ['--test', 'test-native-tap-prefix-summary.mjs'], {
  encoding: 'utf8', windowsHide: true, maxBuffer: 1024 * 1024 });
const log = result.stdout + result.stderr;
fs.writeFileSync(stage + '/native.log', log, { flag: 'wx' });
assert.equal(result.status, 0);
for (const expected of ['tests 3', 'pass 3', 'fail 0', 'cancelled 0', 'skipped 0', 'todo 0'])
  assert(new RegExp('^[ℹ#] ' + expected + '$', 'm').test(log), expected);
for (const row of inputs) assert.equal(sha(read(row.path)), row.sha256);
const receipt = { at: new Date().toISOString(), inputs, command: ['node', '--test', 'test-native-tap-prefix-summary.mjs'],
  code: result.status, tests: 3, pass: 3, fail: 0, skipped: 0, log: stage + '/native.log', logSha256: sha(read(stage + '/native.log')),
  scope: 'Metadata parser only; not Website, full-suite, clinical or release acceptance. No frozen candidate edits or private assertion payload copied.' };
fs.writeFileSync(stage + '/receipt.json', JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ receipt: stage + '/receipt.json', sha256: sha(read(stage + '/receipt.json')), pass: 3 }));
