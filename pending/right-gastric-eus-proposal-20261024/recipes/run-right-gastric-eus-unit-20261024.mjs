import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { nativeAtlasEnvironment } from './native-atlas-environment-20261022.mjs';

const stage = 'F:/VisibleMedicine/staging/20261024-right-gastric-eus-proposal';
const root = stage + '/atlas', evidence = stage + '/checks';
const read = p => fs.readFileSync(p);
const sha = b => createHash('sha256').update(b).digest('hex');
const write = (p, value) => fs.writeFileSync(p, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
const preparation = JSON.parse(read(stage + '/PREPARATION.json'));
assert.equal(sha(read(stage + '/PREPARATION.json')), 'e618d406bab6a423d181349a8075f2ae274fdc5ecfce816ecb753fe579d10b06');
const expected = {
  'content/abdominal-eus-orientation.ts': '2bbcce6f530bfca6e1c5cf6733ed8c16d05f8b6b3e990f3724804fa408111431',
  'lib/abdominal-eus-orientation.ts': '18ad65fba17274ddc4f4f60699b88dd4aee88e8cbdeb17a25db0d6bdc0225100',
  'scripts/test-right-gastric-eus-unit.mjs': '6f7a7f72147b52df4874782ed6afc6cc0a5dc49f17a31fa3772989efd777eb65',
};
function verify() {
  assert.equal(sha(read(preparation.parentReceipt)), preparation.parentReceiptSha256);
  nativeAtlasEnvironment({ atlas: preparation.parentNative, revision: preparation.atlasHead, tree: preparation.atlasTree });
  for (const row of preparation.files) {
    assert.equal(sha(read(preparation.parentNative + '/' + row.path)), row.sha256, 'parent ' + row.path);
    assert.equal(sha(read(stage + '/preimages/' + row.path + '.raw')), row.sha256, 'preimage ' + row.path);
    assert.equal(sha(read(root + '/' + row.path)), expected[row.path] ?? row.sha256, 'proposal ' + row.path);
  }
  for (const [name, hash] of Object.entries(expected)) assert.equal(sha(read(root + '/' + name)), hash, name);
}
verify();
assert(!fs.existsSync(evidence), 'Never overwrite or rerun this immutable test record.');
fs.mkdirSync(evidence);
write(evidence + '/STARTED.json', { at: new Date().toISOString(), root, parent: preparation.atlasHead, expected, phase: 'bounded-real-module-unit', fullResolverCohort: false });
const command = ['--max-old-space-size=128', '--test', '--test-reporter=spec', 'scripts/test-right-gastric-eus-unit.mjs'];
const result = spawnSync(process.execPath, command, {
  cwd: root, windowsHide: true, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024,
  env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=128', RAYON_NUM_THREADS: '1', GOMAXPROCS: '2' },
});
fs.writeFileSync(evidence + '/stdout.log', result.stdout ?? '', { flag: 'wx' });
fs.writeFileSync(evidence + '/stderr.log', result.stderr ?? '', { flag: 'wx' });
verify();
const inverse = [];
for (const name of ['content/abdominal-eus-orientation.ts', 'lib/abdominal-eus-orientation.ts']) {
  const before = read(stage + '/preimages/' + name + '.raw');
  const after = read(root + '/' + name);
  let restored = after.toString('utf8');
  const additions = name.startsWith('content/')
    ? [restored.slice(restored.indexOf('  FMA15400: {'), restored.indexOf('} as const;'))]
    : ["  [branchPins, 'FMA15400', 'FJ3595', 'right'],\n", restored.slice(restored.indexOf("  if (fmaId === 'FMA15400' && ("), restored.indexOf('  return [s.id,'))];
  for (const addition of additions) {
    assert(addition.length > 0);
    assert.equal(restored.split(addition).length, 2, 'Expected one exact transition seam');
    restored = restored.replace(addition, '');
  }
  assert.deepEqual(Buffer.from(restored), before, 'Whole original source is preserved: ' + name);
  inverse.push({ path: name, parentSha256: sha(before), proposalSha256: sha(after), additions, wholePriorSourceRestored: true });
}
write(evidence + '/SOURCE_INVERSE.json', { at: new Date().toISOString(), rows: inverse });
const terminal = {
  at: new Date().toISOString(), command: [process.execPath, ...command], cwd: root,
  exitCode: result.status, signal: result.signal, error: result.error?.message ?? null,
  stdoutSha256: sha(read(evidence + '/stdout.log')), stderrSha256: sha(read(evidence + '/stderr.log')),
  parentAndProposalUnchanged: true, exactWholeSourceInverses: inverse.length,
  smallActualModuleBundles: 2, unitCases: result.status === 0 ? 7 : null,
  fullResolverCohort: false, strictTypecheck: false, stockGeneratorsOrBuild: false,
  websiteIntegration: false, previewChanged: false, clinicalApproval: false, patientSpaceRegistration: false,
};
write(evidence + '/TERMINAL.json', terminal);
assert.equal(result.status, 0, 'Unit checks failed; retain logs and inspect.');
assert.match(result.stdout, /pass 7\b/);
assert.match(result.stdout, /fail 0\b/);
assert.match(result.stdout, /cancelled 0\b/);
assert.match(result.stdout, /skipped 0\b/);
console.log(JSON.stringify({ receipt: evidence + '/TERMINAL.json', sha256: sha(read(evidence + '/TERMINAL.json')), unitCases: 7, originalWholeFilesRestored: inverse.length, isolatedOnly: true }));
