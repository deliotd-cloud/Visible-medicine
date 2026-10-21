import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { backup, read, json, sha, runGit } from './source-only-backup-20261019.mjs';
const root = 'F:/VisibleMedicine/recovery/checkpoints/20261021-after-suite-dental-queue';
const stage = 'F:/VisibleMedicine/staging/20261021-atlas-source-assembly';
const queue = 'F:/VisibleMedicine/staging/20261021-after-suite-dental';
const target = 'F:/VisibleMedicine/staging/20261021-atlas-combined-source';
const previous = json('F:/VisibleMedicine/recovery/checkpoints/20261021-transition-contracts-ready/checkpoint.json');
const observationPath = 'F:/VisibleMedicine/staging/20261021-complete-website-assurance/observations/2026-10-21T02-09-12.957Z/observation.json';
const observation = json(observationPath);
assert.equal(sha(read(observationPath)), '82a1bd440474393482f9c97952a7452006c2122e1e9fa6c6aebd2cd705aedb52');
assert(observation.processesConfirmedLive && !observation.terminalReceiptObserved && observation.ownerPreviewRunning);
assert.equal(observation.namedInputsVerified, 5053);
assert(!fs.existsSync(root));
const receipts = ['AFTER_SUITE_QUEUE_TEST', 'AFTER_SUITE_QUEUE_SYNTAX'].map(label => {
  const r = json(stage + '/' + label + '.json');
  assert.equal(r.code, 0); assert.equal(r.signal, null); assert.equal(sha(read(r.log)), r.logSha256);
  if (label.endsWith('_TEST')) for (const text of ['tests 6', 'pass 6', 'fail 0', 'skipped 0'])
    assert(r.footer.some(line => line.endsWith(text)));
  return r;
});
const raw = execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command',
  "Get-CimInstance Win32_Process -Filter 'ProcessId = 238208' | Select-Object ProcessId,ParentProcessId,CreationDate,CommandLine | ConvertTo-Json -Compress"],
{ encoding: 'utf8', windowsHide: true });
const process = JSON.parse(raw);
assert.equal(process.ProcessId, 238208); assert.equal(process.ParentProcessId, 232948);
assert(process.CommandLine.includes('queue-dental-after-suite-20261021.mjs'));
const state = json(queue + '/state.json');
assert.equal(state.pid, process.ProcessId); assert.equal(state.phase, 'waiting-specific-live-run');
assert.deepEqual(state.steps, []);
const scripts = ['queue-dental-after-suite-20261021.mjs', 'test-dental-after-suite-queue-20261021.mjs',
  'checkpoint-after-suite-queue-20261021.mjs'];
const scriptPins = scripts.map(p => ({ path: p, sha256: sha(read(p)) }));
const summary = { at: new Date().toISOString(), phase: 'bounded local successor actually running and waiting for live full Website run',
  previousGoalTurnClassification: 'progress: separate full dental gate, stock1479input renderer generation/check, exact corpus CT contract proposal and verified602blob filtered backup',
  source: previous.source, target, sourcePaths: previous.sourcePaths,
  sourceCheckpoint: 'F:/VisibleMedicine/recovery/checkpoints/20261021-transition-contracts-ready/checkpoint.json',
  queue: { stage: queue, pid: state.pid, parentPid: process.ParentProcessId, execSessionId: 20530,
    phaseAtCheckpoint: state.phase, liveProcessConfirmed: true, statePath: queue + '/state.json',
    lastVerifiedWebsiteLiveAt: state.lastVerifiedLiveAt, scripts: scriptPins,
    action: 'After exact runner/test PID+command+parent+creation identities have exited and the stock terminal receipt proves no input/asset drift or interruption, verify5053frozen bytes, then run stock trusted display-pin generation, stock renderer --check and actual full dental transition sequentially. Preserve nonzero Website result. Assert exactly28changed/1076unchanged display pins; stop at first failure. No automatic commit/import/site cutover/review decision.',
    pause: 'On explicit owner pause, create STOP_REQUESTED at queue root; waiting job exits before mutation, or current admitted gate finishes and no next step starts. Do not kill/restart the original full suite on observation timeout.',
    actualQueuedSourceStepsExecuted: 0, actualFullDentalGatePass: false,
    sourceMayLaterHaveOneAdditionalGeneratedPinFile: true,
    nextTurn: 'Revalidate actual PID238208/command and exact state/receipts, not this snapshot alone. While it is live, do not start another heavy check or duplicate generator. Once terminal, inspect actual full Website inventory and queued theorem/failure logs. Source21pin identity must come from actual state after generation, not prior20hash assumption.' },
  receipts, protocolUnitCases: 6, fullSuiteObservation: { path: observationPath, sha256: sha(read(observationPath)),
    live: true, terminal: false, namedInputs: 5053 },
  resourceObservation: 'Windows available physical memory was359336KiB during delayed light-driver startups and later4514704KiB. Original live handles were retained; both original light checks eventually passed without retry/termination. No unrelated app closed and no memory/pagefile/security setting changed. This correlation is not a diagnosed causal claim.',
  testsScope: 'Six scheduler-only protocol cases prove identity/reuse/terminal/drift/interruption/pin-delta refusal; they do not execute or substitute the actual full dental/theory/Website tests.',
  sourceCommitted: false, websiteImported: false, canonicalInstalled: false, fullSuitePass: false,
  clinicalApproval: false, spatialRegistration: false, publicDeployment: false, fullGoalActive: true };
fs.mkdirSync(root); const files = [], selected = [];
const copy = (from, rel, remote = true) => {
  const b = read(from), to = root + '/' + rel; fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.writeFileSync(to, b, { flag: 'wx' }); assert.equal(sha(read(to)), sha(b));
  const row = { path: rel, bytes: b.length, sha256: sha(b), remoteSelected: remote };
  files.push(row); if (remote) selected.push(row);
};
for (const p of scripts) copy(p, 'scripts/' + p);
for (const label of ['AFTER_SUITE_QUEUE_TEST', 'AFTER_SUITE_QUEUE_SYNTAX'])
  for (const ext of ['log', 'json']) copy(stage + '/' + label + '.' + ext, 'evidence/' + label + '.' + ext);
copy(queue + '/state.json', 'local/queue-state-at-checkpoint.json', false);
copy(observationPath, 'local/full-suite-observation.json', false);
fs.writeFileSync(root + '/MAIN_REVIEW.json', JSON.stringify(summary, null, 2) + '\n', { flag: 'wx' });
copy(root + '/MAIN_REVIEW.json', 'evidence/MAIN_REVIEW.json');
const verify = () => {
  assert.equal(runGit(['-C', target, 'rev-parse', 'HEAD']).toString().trim(), previous.source);
  for (const row of previous.sourcePaths) assert.equal(sha(read(target + '/' + row.path)), row.sha256);
  for (const row of scriptPins) assert.equal(sha(read(row.path)), row.sha256);
  for (const row of files) assert.equal(sha(read(root + '/' + row.path)), row.sha256);
}; verify();
const parentRoot = 'F:/VisibleMedicine/recovery/checkpoints/20261021-transition-contracts-backup';
const parent = json(parentRoot + '/github-backup.json'); assert(parent.sourceBackupVerified);
const old = json(parentRoot + '/remote-source-restored/.source-backup/manifest.json');
const values = new Map(old.files.map(row => { const b = read(parentRoot + '/remote-source-restored/' + row.path);
  assert.equal(sha(b), row.sha256); return [row.path, b]; }));
for (const row of selected) values.set('evidence/20261021-after-suite-dental-queue/' + row.path, read(root + '/' + row.path));
const backupRoot = 'F:/VisibleMedicine/recovery/checkpoints/20261021-after-suite-dental-queue-backup';
backup({ root: backupRoot, repo: 'F:/VisibleMedicine/history/website-work/github-atlas-dental-queue-20261021.git',
  branch: 'backup/atlas-dental-queue-20261021',
  files: [...values].map(([path, b]) => ({ path, bytes: b.length, sha256: sha(b) })).sort((a,b) => a.path.localeCompare(b.path)),
  bytesFor: p => values.get(p), verifySource: verify,
  sourceIdentity: { atlasBase: previous.source, queueScripts: scriptPins, canonicalInstalled: false },
  parent: parent.head, parentTree: parent.tree, parentRepo: parentRoot + '/independent-readback.git',
  proof: { protocolCases: 6, actualQueuedSourceStepsExecuted: 0, fullSuitePass: false, clinicalApproval: false },
  scope: 'Three local bounded successor/checkpoint scripts, six-case protocol test receipts and explicit limits on prior filtered source ancestry. Queue/process snapshots and coordination stay F-local. No full source/raw canonical ancestry/models/dependencies/scans/masks/private data/browser pixels/DOM. Not whole/runnable/private-data backup or actual full transition pass.' });
const remote = json(backupRoot + '/github-backup.json');
fs.writeFileSync(root + '/checkpoint.json', JSON.stringify({ ...summary, files,
  backup: { receipt: backupRoot + '/github-backup.json', receiptSha256: sha(read(backupRoot + '/github-backup.json')),
    head: remote.head, tree: remote.tree, restoredPaths: remote.restoredPaths } }, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ checkpoint: root + '/checkpoint.json', sha256: sha(read(root + '/checkpoint.json')),
  queuePid: state.pid, protocolCases: 6, actualStepsExecuted: 0, backup: remote.head,
  tree: remote.tree, restoredPaths: remote.restoredPaths, installed: false }));
