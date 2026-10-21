import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { read, json, sha } from './source-only-backup-20261019.mjs';
const stage = 'F:/VisibleMedicine/staging/20261021-tour-epoch-native-proof';
const proposal = 'F:/VisibleMedicine/staging/20261021-tour-epoch-proposal';
const site = 'F:/VisibleMedicine/staging/20261021-source190-website/website';
const atlas = 'F:/VisibleMedicine/staging/20261021-atlas-combined-source';
const frozen = json('F:/VisibleMedicine/staging/20261021-source190-complete-suite/SOURCE_INPUTS.json');
const contracts = [
  ['tests/atlas-tour-completion.test.mjs', '29eabe4a82543be6cb4616f2092f80d005a07373e6eb51b94dbb2b2cf53116d1'],
  ['tests/atlas-tour-library-pause.test.ts', 'afe577ade8afc43e0bdc3f07192913e6f9d3c481e249a64274cd3152812366c7'],
  ['tests/atlas-tour-reading-focus.test.ts', 'bea48a12d979c106fa5332d8d278d3493c7280b1ced2d35bb448050b147d9855'],
].map(([p, hash]) => {
  const before = frozen.find(row => row.path === p); assert(before);
  assert.equal(sha(read(site + '/' + p)), before.sha256, p);
  assert.equal(sha(read(proposal + '/' + p)), hash, p);
  return { path: p, beforeSha256: before.sha256, sha256: hash, from: proposal + '/' + p };
});
for (const row of frozen) assert.equal(sha(read(site + '/' + row.path)), row.sha256, row.path);
assert(!fs.existsSync(stage)); fs.mkdirSync(stage);
const harness = stage + '/native-check'; fs.mkdirSync(harness);
const links = ['atlas-review', 'public', 'lib', 'docs', 'scripts', 'node_modules'];
for (const name of links) {
  const target = site + '/' + name;
  assert(fs.statSync(target).isDirectory());
  fs.symlinkSync(target, harness + '/' + name, 'junction');
}
for (const p of ['package.json', 'tests/current-atlas-delivery.mjs', 'tests/atlas-source-repo.mjs', 'tests/fixtures/current-atlas-delivery.json']) {
  const target = harness + '/' + p; fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(site + '/' + p, target, fs.constants.COPYFILE_EXCL);
}
for (const row of contracts) {
  const target = harness + '/' + row.path;
  fs.copyFileSync(row.from, target, fs.constants.COPYFILE_EXCL);
  assert.equal(sha(read(target)), row.sha256);
}
const prep = { stage, site, atlas, harness, contracts, links,
  readOnlySourceJunctions: true, candidateChanged: false, ownerPagesTouched: false,
  scope: 'Explicit native Node/FS/Git/TypeScript syntax-tree tests only; no build, whole TypeScript check, broad validator or full-suite rerun. Do not recursively delete/package this harness through its read-only junctions.' };
fs.writeFileSync(stage + '/PREPARATION.json', JSON.stringify(prep, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ stage, harness, contracts: contracts.length, frozen: frozen.length }));
