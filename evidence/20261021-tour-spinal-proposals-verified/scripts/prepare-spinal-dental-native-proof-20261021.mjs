import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { read, json, sha } from './source-only-backup-20261019.mjs';
const stage = 'F:/VisibleMedicine/staging/20261021-spinal-dental-native-proof';
const proposal = 'F:/VisibleMedicine/staging/20261021-spinal-dental-epoch-proposal';
const site = 'F:/VisibleMedicine/staging/20261021-source190-website/website';
const atlas = 'F:/VisibleMedicine/staging/20261021-atlas-combined-source';
const frozen = json('F:/VisibleMedicine/staging/20261021-source190-complete-suite/SOURCE_INPUTS.json');
const subject = 'tests/atlas-spinal-muscle-xray.test.mjs';
assert.equal(sha(read(site + '/' + subject)), '075354d9e1da283b5209c39478eb89e6f5fc9243441d0cd25701f84f43ea564a');
assert.equal(sha(read(proposal + '/atlas-spinal-muscle-xray.test.mjs')), '6c202daf177a84a4cfd210673dd8a3975bc47cd77bcd47754139a9bffd6bdddc');
const guards = ['spinal-ct-save-refusal-preservation.test.mjs', 'spinal-later-six-preservation.test.mjs'];
for (const name of guards) {
  const original = read(site + '/tests/' + name).toString(), next = read(proposal + '/tests/' + name).toString();
  const body = text => text.slice(text.indexOf('function verify('), text.indexOf('\ntest('));
  assert(body(original).startsWith('function verify('));
  assert.equal(body(next), body(original), name + ': full original verifier body retained byte-for-byte');
}
const originalAttrs = read(site + '/.gitattributes');
assert(originalAttrs.toString().includes('tests/fixtures/** -text'));
assert.equal(sha(originalAttrs), frozen.find(row => row.path === '.gitattributes').sha256);
const fixtures = fs.readdirSync(proposal + '/tests/fixtures').sort();
assert.equal(fixtures.length, 7);
assert(fixtures.every(name => /^[a-z0-9.-]+\.raw$/.test(name)));
const rows = [
  { path: subject, from: proposal + '/atlas-spinal-muscle-xray.test.mjs' },
  ...[...guards, 'spinal-current-source-inverse.mjs'].map(name => ({ path: 'tests/' + name, from: proposal + '/tests/' + name })),
  ...fixtures.map(name => ({ path: 'tests/fixtures/' + name, from: proposal + '/tests/fixtures/' + name })),
].map(row => {
  const bytes = read(row.from), previous = frozen.find(input => input.path === row.path);
  assert(!bytes.includes(0) && bytes.length < 200000);
  if (previous) assert.equal(sha(read(site + '/' + row.path)), previous.sha256);
  else assert(!fs.existsSync(site + '/' + row.path));
  return { ...row, sha256: sha(bytes), bytes: bytes.length, beforeSha256: previous?.sha256 ?? null };
});
for (const row of frozen) assert.equal(sha(read(site + '/' + row.path)), row.sha256, row.path);
assert(!fs.existsSync(stage)); fs.mkdirSync(stage);
const harness = stage + '/native-check'; fs.mkdirSync(harness);
for (const row of rows) {
  const target = harness + '/' + row.path; fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(row.from, target, fs.constants.COPYFILE_EXCL);
  assert.equal(sha(read(target)), row.sha256);
}
for (const p of ['fixtures/atlas-spinal-muscle-xray-original.raw', 'fixtures/atlas-spinal-muscle-xray-after-first-lifecycle.mjs.raw']) {
  fs.copyFileSync(site + '/tests/' + p, harness + '/tests/' + p, fs.constants.COPYFILE_EXCL);
}
const prep = { stage, site, atlas, harness, changes: rows, originalGuardBodiesUnchanged: true,
  existingFrozenFixtureAttributesSufficient: true, attributeChangeRequired: false,
  candidateChanged: false, ownerPagesTouched: false,
  scope: 'Pure native SHA/FS/exact inverse guards only. Do not execute the costly spinal teaching theorem until the existing whole suite is genuinely terminal. No broad validator, types or build.' };
fs.writeFileSync(stage + '/PREPARATION.json', JSON.stringify(prep, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ stage, harness, paths: rows.length, newPaths: rows.filter(row => !row.beforeSha256).length, guardBodiesUnchanged: true }));
