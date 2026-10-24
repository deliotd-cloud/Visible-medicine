// Only the seven small pure EUS cases; never a full graph/build or generator.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { execFileSync, spawnSync } from 'node:child_process';
import { read, json, sha } from './source-only-backup-20261019.mjs';
const stage = 'F:/VisibleMedicine/staging/20261024-combined-atlas', atlas = stage + '/atlas';
const folder = stage + '/checks/eus-unit-bounded-v1';
assert(!fs.existsSync(folder), 'Never rerun an unchanged unit attempt blindly; inspect its terminal first');
const sourceReceipt = stage + '/COMPOSITION.json';
assert.equal(sha(read(sourceReceipt)), 'd707e62ad55ec2d4d6c9d8721cb6d4bc3dbd95aec6b254d23679044766bae05a');
const source = json(sourceReceipt), files = [
  'scripts/test-right-gastric-eus-unit.mjs', 'scripts/workspace-test-build.mjs', 'scripts/exact-source-history-api.mjs', 'scripts/git-object-reader.mjs',
  'lib/abdominal-eus-orientation.ts', 'content/abdominal-eus-orientation.ts', 'content/abdominal-branch-imaging-pins.json', 'content/central-vessel-imaging-pins.json',
  'lib/body-source-additions.ts', 'lib/body-presentation-parts.ts', 'app/body-types.ts', 'app/anatomy-data.ts', 'lib/content-types.ts', 'package.json', 'package-lock.json',
];
const rows = files.map(file => {
  const expected = source.sourceRows.find(row => row.path === file); assert(expected, file); assert.equal(sha(read(atlas + '/' + file)), expected.sha256); return expected;
});
for (const row of source.changedRows) assert.equal(sha(read(atlas + '/' + row.path)), row.sha256);
const fromHere = createRequire(atlas + '/package.json'), packageFile = fromHere.resolve('esbuild/package.json');
const runtime = { node: process.version, executable: process.execPath, esbuild: json(packageFile).version, esbuildPackageSha256: sha(read(packageFile)) };
const measured = JSON.parse(execFileSync('powershell', ['-NoProfile', '-Command', "Get-CimInstance Win32_PerfFormattedData_PerfOS_Memory | Select-Object AvailableMBytes,PercentCommittedBytesInUse | ConvertTo-Json -Compress"], { encoding: 'utf8', windowsHide: true }));
const allowed = typeof measured.AvailableMBytes === 'number' && measured.AvailableMBytes >= 512 && typeof measured.PercentCommittedBytesInUse === 'number' && measured.PercentCommittedBytesInUse <= 90;
if (!allowed) {
  console.log(JSON.stringify({ started: false, resourceDeferred: true, memory: measured, phaseFolderCreated: false }));
} else {
  assert.equal(json('CURRENT_CHECKPOINT.json').activeWork.current.ownerPreviewPolicy.restartPermitted, false);
  fs.mkdirSync(folder, { recursive: true });
  const write = (name, value) => fs.writeFileSync(folder + '/' + name, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
  const args = ['--max-old-space-size=64', '--test', '--test-concurrency=1', '--test-reporter=tap', 'scripts/test-right-gastric-eus-unit.mjs'];
  const env = { ...process.env, NODE_OPTIONS: '--max-old-space-size=64', GOMAXPROCS: '1', GOMEMLIMIT: '64MiB', RAYON_NUM_THREADS: '1' };
  write('STARTED.json', { at: new Date().toISOString(), sourceReceipt, sourceReceiptSha256: sha(read(sourceReceipt)), rows, runtime, args, memory: measured, nodeV8HeapLimitMiB: 64, goMemoryTargetMiB: 64, goThreads: 1, warning: 'Heap limit/Go target are not a total-process RAM guarantee. Narrow module unit only; no Three.js, model parsing, full application imports, generator, typecheck or production build.', previewChanged: false });
  const result = spawnSync(process.execPath, args, { cwd: atlas, encoding: 'utf8', windowsHide: true, maxBuffer: 4e6, env });
  fs.writeFileSync(folder + '/stdout.log', result.stdout ?? '', { flag: 'wx' }); fs.writeFileSync(folder + '/stderr.log', result.stderr ?? '', { flag: 'wx' });
  for (const row of rows) assert.equal(sha(read(atlas + '/' + row.path)), row.sha256);
  for (const row of source.changedRows) assert.equal(sha(read(atlas + '/' + row.path)), row.sha256);
  const counts = Object.fromEntries(['tests', 'pass', 'fail', 'cancelled', 'skipped', 'todo'].map(key => [key, Number(result.stdout?.match(new RegExp('^# ' + key + ' (\\d+)$', 'm'))?.[1] ?? -1)]));
  write('TERMINAL.json', { at: new Date().toISOString(), exitCode: result.status, signal: result.signal, error: result.error?.message ?? null, counts, sourceReceiptSha256: sha(read(sourceReceipt)), rows, runtime, stdoutSha256: sha(read(folder + '/stdout.log')), stderrSha256: sha(read(folder + '/stderr.log')), sourcesUnchanged: true, narrowUnitOnly: true, fullApplicationOrBrowserAcceptance: false, previewChanged: false, clinicalApproval: false });
  console.log(JSON.stringify({ started: true, terminal: folder + '/TERMINAL.json', code: result.status, counts }));
  if (result.status !== 0 || counts.tests !== 7 || counts.pass !== 7 || counts.fail !== 0 || counts.skipped !== 0 || counts.cancelled !== 0 || counts.todo !== 0) process.exitCode = 1;
}
