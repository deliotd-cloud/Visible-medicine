import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { hash, json } from './seal-simple-website-successor.mjs';

const stage = 'F:/VisibleMedicine/staging/20261024-pancreatic-venous-us-draft';
const prep = json(stage + '/PREPARATION.json'), parent = json(prep.parentReceipt), root = prep.atlas;
const phase = process.argv[2], spec = {
  unit: [192, ['--test', '--test-concurrency=1', '--test-reporter=tap', 'scripts/test-pancreatic-venous-us-unit.mjs']],
  unitV2: [192, ['--test', '--test-concurrency=1', '--test-reporter=tap', 'scripts/test-pancreatic-venous-us-unit.mjs']],
  integration: [512, ['scripts/test-body-pancreatic-venous-us.mjs']],
  types: [768, [path.resolve('check-pancreatic-venous-us-types-20261024.mjs'), stage + '/checks/types/RESULT.json']],
  cohort: [512, ['--test', '--test-concurrency=1', '--test-reporter=tap', 'scripts/test-pancreatic-venous-us-cohort.mjs']],
  cohortV2: [512, ['--test', '--test-concurrency=1', '--test-reporter=tap', 'scripts/test-pancreatic-venous-us-cohort.mjs']],
  regional: [512, ['scripts/regional-teaching-snapshots.mjs']],
  regionalCheck: [512, ['scripts/regional-teaching-snapshots.mjs', '--check']],
  renderer: [256, ['scripts/body-renderer-revisions.mjs']],
  display: [512, ['scripts/generate-body-review-display-pins.mjs']],
  rendererCheck: [256, ['scripts/body-renderer-revisions.mjs', '--check']],
  displayCheck: [512, ['scripts/generate-body-review-display-pins.mjs', '--check']],
  typesV2: [768, [path.resolve('check-pancreatic-venous-us-types-20261024.mjs'), stage + '/checks/typesV2/RESULT.json']],
  build: [512, [path.resolve('build-ventricular-atlas-20261023.mjs')]],
}[phase];
assert(spec, 'Unknown focused verification/generator phase');
const index = path.resolve('CURRENT_CHECKPOINT.json');
const current = json(index);
assert.equal(current.goal.status, 'active');
assert.equal(current.activeWork.current.ownerPreviewPolicy.restartPermitted, false);
assert.equal(current.activeWork.current.activeExecutionSessions.length, 0);
assert.equal(hash(prep.parentReceipt), prep.parentReceiptSha256);
const sourcePaths = [...new Set([...parent.sourceRows.map(row => row.path), ...prep.expectedChanges, 'scripts/test-pancreatic-venous-us-cohort.mjs'])].sort();
const inputs = sourcePaths.map(p => ({ path: p, sha256: hash(root + '/' + p) }));
for (const row of parent.sourceRows) assert.equal(hash(prep.parentAtlas + '/' + row.path), row.sha256);
const out = stage + '/checks/' + phase;
assert(!fs.existsSync(out)); fs.mkdirSync(out, { recursive: true });
const write = (p, value) => fs.writeFileSync(p, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
write(out + '/INPUTS.json', inputs);
const [heap, args] = spec, stdout = fs.createWriteStream(out + '/stdout.log', { flags: 'wx' }), stderr = fs.createWriteStream(out + '/stderr.log', { flags: 'wx' });
const child = spawn(process.execPath, ['--max-old-space-size=' + heap, ...args], {
  cwd: root, windowsHide: true,
  env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=' + heap, RAYON_NUM_THREADS: '1', GOMAXPROCS: '2' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
child.stdout.pipe(stdout); child.stderr.pipe(stderr);
write(out + '/STARTED.json', { at: new Date().toISOString(), phase, pid: child.pid, driverPid: process.pid, root, heap, args, inputManifestSha256: hash(out + '/INPUTS.json'), normalPreviewChanged: false });
const live = active => {
  const value = json(index);
  value.activeWork.current.activeExecutionSessions = value.activeWork.current.activeExecutionSessions.filter(row => row.role !== 'pancreatic-venous-us');
  if (active) value.activeWork.current.activeExecutionSessions.push({ role: 'pancreatic-venous-us', phase, pid: child.pid, driverPid: process.pid, evidence: out, normalPreviewChanged: false });
  const text = JSON.stringify(value, null, 2) + '\n'; assert(Buffer.byteLength(text) < 65536); fs.writeFileSync(index, text);
};
live(true); console.log(JSON.stringify({phase, pid: child.pid}));
const result = await new Promise(resolve => { child.once('error', error => resolve({code: null, error: error.message})); child.once('close', (code, signal) => resolve({code, signal})); });
await Promise.all([stdout, stderr].map(stream => new Promise(resolve => stream.closed ? resolve() : stream.once('close', resolve))));
let sourceError;
const allowedWrites = { regional: ['content/regional-teaching/abdomen.json'], renderer: ['content/body-renderer-revision.json'], display: ['content/body-review-display-pins.json'], build: ['content/body-renderer-revision.json', 'content/review-revisions.json'] }[phase] ?? [];
const generatedChanges = [];
try {
  for (const row of inputs) {
    const actual = hash(root + '/' + row.path);
    if (actual !== row.sha256) {
      assert(allowedWrites.includes(row.path), 'Unexpected generator write: ' + row.path);
      generatedChanges.push({path: row.path, beforeSha256: row.sha256, afterSha256: actual});
    }
  }
  for (const row of parent.sourceRows) assert.equal(hash(prep.parentAtlas + '/' + row.path), row.sha256);
} catch (error) { sourceError = error.message; }
const text = fs.readFileSync(out + '/stdout.log', 'utf8');
const counts = Object.fromEntries(['tests', 'pass', 'fail', 'skipped', 'cancelled'].map(key => [key, Number(text.match(new RegExp('^# ' + key + ' (\\d+)$', 'm'))?.[1] ?? -1)]));
write(out + '/TERMINAL.json', { at: new Date().toISOString(), phase, ...result, counts, sourceError, generatedChanges, sourcePathsCheckedBeforeAndAfter: inputs.length, unchangedParentPaths: parent.sourceRows.length, inputManifestSha256: hash(out + '/INPUTS.json'), stdoutSha256: hash(out + '/stdout.log'), stderrSha256: hash(out + '/stderr.log'), normalPreviewChanged: false, fullSuitePassing: false, buildPassed: false });
live(false);
console.log(JSON.stringify({phase, ...result, counts, sourceError, sourcePaths: inputs.length}));
if (result.code !== 0 || sourceError) process.exitCode = 1;
