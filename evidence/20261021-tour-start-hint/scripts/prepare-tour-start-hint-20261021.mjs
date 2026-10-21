import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { read, sha, runGit } from './source-only-backup-20261019.mjs';
const source = 'F:/VisibleMedicine/staging/20261020-inbox-material-source';
const stage = 'F:/VisibleMedicine/staging/20261021-tour-start-hint';
const head = '485df97c2530e8e81a8d39a5ee61073ce76d93db';
assert(!fs.existsSync(stage));
assert.equal(runGit(['-C', source, 'rev-parse', 'HEAD']).toString().trim(), head);
assert.equal(runGit(['-C', source, 'status', '--porcelain']).toString().trim(), '');
const paths = ['app/regional-guided-learning.tsx', 'scripts/test-regional-tour-player.mjs'];
const rows = [];
for (const p of paths) {
  const b = read(source + '/' + p);
  assert.deepEqual(b, runGit(['-C', source, 'show', head + ':' + p]));
  for (const to of [stage + '/' + p, stage + '/originals/' + p + '.raw']) {
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.writeFileSync(to, b, { flag: 'wx' });
  }
  rows.push({ path: p, beforeSha256: sha(b) });
}
fs.writeFileSync(stage + '/PREPARATION.json', JSON.stringify({ stage, source, head, paths: rows,
  scope: 'Two-path local-only tour pre-start clarity proposal. Existing native full player test will gain a new assertion; do not run its heavy complete resolver while the full Website suite is live. A lightweight AST/inverse check is not runtime acceptance.' }, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ stage, paths: paths.length, installed: false }));
