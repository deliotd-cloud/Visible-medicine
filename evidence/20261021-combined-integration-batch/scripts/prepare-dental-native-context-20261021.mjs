import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { read, sha, runGit } from './source-only-backup-20261019.mjs';
const source = 'F:/VisibleMedicine/staging/20261020-inbox-material-source';
const batch = 'F:/VisibleMedicine/staging/20261021-combined-integration-batch';
const stage = batch + '/native-dental-context';
const head = '485df97c2530e8e81a8d39a5ee61073ce76d93db';
assert(!fs.existsSync(stage), 'Create-only native context');
assert.equal(runGit(['-C', source, 'rev-parse', 'HEAD']).toString().trim(), head);
assert.equal(runGit(['-C', source, 'status', '--porcelain']).toString().trim(), '');
const require = createRequire(source + '/package.json'), ts = require('typescript');
const overrides = new Set(['lib/dental-mri.ts', 'content/dental-mri.ts', 'content/dental-mri-pins.json', 'scripts/test-dental-mri-native.mjs', 'package.json']);
const pending = ['lib/dental-mri.ts', 'content/dental-mri.ts', 'lib/body-display-catalog.ts', 'scripts/workspace-test-build.mjs', 'scripts/test-dental-mri-native.mjs', 'public/models/bodyparts3d/full-body/catalog.json', 'package.json'];
const seen = new Map();
function from(p) { return overrides.has(p) ? batch + '/atlas/' + p : source + '/' + p; }
function resolve(fromPath, name) {
  if (!name.startsWith('.') && !name.startsWith('@/')) return null;
  const base = name.startsWith('@/') ? name.slice(2) : path.posix.normalize(path.posix.dirname(fromPath) + '/' + name);
  assert(!base.startsWith('../') && !path.isAbsolute(base));
  for (const suffix of ['', '.ts', '.tsx', '.mjs', '.js', '.json', '/index.ts', '/index.tsx']) {
    const p = base + suffix;
    if (fs.existsSync(from(p)) && fs.statSync(from(p)).isFile()) return p;
  }
  throw Error('Missing native dependency ' + fromPath + ' -> ' + name);
}
while (pending.length) {
  const p = pending.pop(); if (seen.has(p)) continue;
  assert(!p.includes('..') && /\.(?:ts|tsx|mjs|js|json)$/.test(p));
  assert(!['app/body-content.ts', 'lib/body-lesson.ts', 'lib/body-review-material.ts'].includes(p), 'Exclude full resolver from focused gate');
  const b = read(from(p));
  if (!overrides.has(p)) assert.deepEqual(b, runGit(['-C', source, 'show', head + ':' + p]));
  seen.set(p, { path: p, sha256: sha(b), bytes: b.length, proposed: overrides.has(p) });
  assert([...seen.values()].reduce((n, r) => n + r.bytes, 0) < 12e6, 'Bounded text metadata context');
  if (/\.(?:ts|tsx|mjs|js)$/.test(p)) for (const row of ts.preProcessFile(b.toString(), true, true).importedFiles) {
    const local = resolve(p, row.fileName); if (local) pending.push(local);
  }
}
for (const row of seen.values()) {
  const dest = stage + '/' + row.path; fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(from(row.path), dest, fs.constants.COPYFILE_EXCL);
}
fs.symlinkSync(fs.realpathSync(source + '/node_modules'), stage + '/node_modules', 'junction');
fs.writeFileSync(stage + '/PREPARATION.json', JSON.stringify({ stage, site: stage, atlas: source, head,
  copiedInputs: [...seen.values()].sort((a, b) => a.path.localeCompare(b.path)),
  scope: 'Focused real dental helper and bodyDisplayCatalog dependency closure, raw public metadata and existing hermetic builder; no geometry/scans/private data/full resolver. Dependencies reused, not installed or lockfile-byte attested.' }, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ stage, files: seen.size, bytes: [...seen.values()].reduce((n, r) => n + r.bytes, 0), fullResolverExecuted: false }));
