// One bounded local successor job, not a recurring automation or release gate.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { read, json, sha, runGit } from './source-only-backup-20261019.mjs';

export function runState(processes, terminal, start, manifest) {
  assert.equal(start.runnerPid, 262080); assert.equal(start.testPid, 255564);
  assert.equal(manifest.entries.length, 1050);
  assert.equal(start.entrySha256, manifest.entrySha256);
  assert.equal(start.sourceSha256, manifest.sourceSha256);
  const runner = processes.find(p => p.ProcessId === start.runnerPid);
  const child = processes.find(p => p.ProcessId === start.testPid);
  const created = value => {
    const match = /^\/Date\((\d+)\)\/$/.exec(value ?? '');
    return match ? Number(match[1]) : Date.parse(value);
  };
  if (runner || child) {
    if (runner) {
      assert.equal(runner.ParentProcessId, 117344);
      assert(runner.CommandLine.includes('scripts/run-website-tests.mjs --run'));
      assert.equal(created(runner.CreationDate), 1792538408682, 'Runner PID was reused');
    }
    if (child) {
      assert.equal(child.ParentProcessId, start.runnerPid);
      assert(child.CommandLine.includes('2026-10-20T23-20-11-575Z-314c80d2-a04f-4372-af8e-e9f086c9cc86'));
      assert(child.CommandLine.includes('--test-concurrency=1'));
      assert.equal(created(child.CreationDate), 1792538411786, 'Test PID was reused');
    }
    return 'waiting'; // A receipt alone never releases a live process slot.
  }
  assert(terminal, 'Full run vanished without its actual stock terminal receipt');
  assert.equal(terminal.schema, 'vm-complete-test-receipt-1');
  assert.equal(terminal.mode, 'run'); assert.equal(terminal.launched, true);
  assert.equal(terminal.entryCount, 1050);
  assert.equal(terminal.testInputDrift, false);
  assert.equal(terminal.publicPreviewAssetDrift, false);
  assert.equal(terminal.child.signal, null);
  assert([0, 1].includes(terminal.child.exitCode), 'Resource/interrupted run needs coordinator triage');
  assert(terminal.counts && terminal.counts.tests > 0);
  assert.equal(terminal.counts.cancelled, 0);
  return 'ready'; // A failed Website run is preserved, not turned into a pass.
}

export function displayDelta(before, after, ids) {
  const { pins: oldPins, ...oldMetadata } = before;
  const { pins: newPins, ...newMetadata } = after;
  assert.deepEqual(newMetadata, oldMetadata);
  assert.equal(oldPins.length, 1104); assert.equal(newPins.length, 1104);
  assert.deepEqual(newPins.map(p => p.structureId), oldPins.map(p => p.structureId));
  const selected = new Set(ids);
  assert.equal(selected.size, 28);
  const changed = [];
  for (let i = 0; i < oldPins.length; i++) {
    const old = oldPins[i], next = newPins[i];
    assert.match(next.sha256, /^[a-f0-9]{64}$/);
    if (selected.has(old.structureId)) {
      assert.notEqual(next.sha256, old.sha256, old.structureId);
      assert.deepEqual(Object.keys(next), Object.keys(old));
      changed.push(old.structureId);
    } else assert.deepEqual(next, old, old.structureId + ': unrelated display pin changed');
  }
  assert.deepEqual([...changed].sort(), [...selected].sort());
  return changed;
}

export async function main() {
  assert.equal(process.argv.length, 2, 'No alternate queue modes or source overrides');
  const coordinator = path.dirname(fileURLToPath(import.meta.url));
  const stage = 'F:/VisibleMedicine/staging/20261021-after-suite-dental';
  const fullStage = 'F:/VisibleMedicine/staging/20261021-complete-website-assurance';
  const prep = json(fullStage + '/PREPARATION.json');
  const output = prep.site + '/.local/website-test-runs/2026-10-20T23-20-11-575Z-314c80d2-a04f-4372-af8e-e9f086c9cc86';
  const start = json(output + '/started.json'), manifest = json(output + '/manifest.json');
  const admission = json('F:/VisibleMedicine/recovery/checkpoints/20261021-transition-contracts-ready/checkpoint.json');
  const target = admission.target, sourceStage = 'F:/VisibleMedicine/staging/20261021-atlas-source-assembly';
  assert.equal(admission.sourcePaths.length, 20);
  assert.equal(admission.source, '485df97c2530e8e81a8d39a5ee61073ce76d93db');
  assert(!fs.existsSync(stage), 'Create-only job; never restart after a timeout');
  const stopped = () => fs.existsSync(stage + '/STOP_REQUESTED');
  const verifySource = (generated = false) => {
    assert.equal(runGit(['-C', target, 'rev-parse', 'HEAD']).toString().trim(), admission.source);
    for (const row of admission.sourcePaths) assert.equal(sha(read(target + '/' + row.path)), row.sha256, row.path);
    const changes = runGit(['-C', target, 'status', '--porcelain=v1', '-z', '--untracked-files=all'])
      .toString().split('\0').filter(Boolean).map(line => line.slice(3).replaceAll('\\', '/')).sort();
    assert.deepEqual(changes, [...admission.sourcePaths.map(row => row.path),
      ...(generated ? ['content/body-review-display-pins.json'] : [])].sort());
    return changes.map(p => ({ path: p, sha256: sha(read(target + '/' + p)) }));
  };
  verifySource();
  fs.mkdirSync(stage);
  const state = { at: new Date().toISOString(), pid: process.pid, phase: 'starting',
    target, source: admission.source, waitsFor: { runnerPid: start.runnerPid, testPid: start.testPid, output },
    steps: [], canonicalInstalled: false, fullSuitePass: false, clinicalApproval: false,
    spatialRegistration: false, automaticCommitImportOrCutover: false,
    pauseControl: stage + '/STOP_REQUESTED',
    scope: 'After actual full Website terminal receipt and5053input verification, run only trusted display-pin generation, unchanged stock renderer check and real full dental transition. One heavy job at a time; stop on first failure. No install/source commit/Website mutation/review database/publication.' };
  const save = phase => { state.at = new Date().toISOString(); state.phase = phase;
    fs.writeFileSync(stage + '/state.json', JSON.stringify(state, null, 2) + '\n'); };
  const processes = () => {
    const result = execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command',
      "@(Get-CimInstance Win32_Process -Filter 'ProcessId = 262080 OR ProcessId = 255564' | Select-Object ProcessId,ParentProcessId,CreationDate,CommandLine) | ConvertTo-Json -Depth 3 -Compress"],
    { windowsHide: true, encoding: 'utf8', timeout: 15000 });
    if (!result.trim()) return [];
    const value = JSON.parse(result); return Array.isArray(value) ? value : value ? [value] : [];
  };
  save('checking-specific-live-run');
  while (true) {
    if (stopped()) { save('stopped-before-next-step'); return; }
    let actual;
    try { actual = processes(); }
    catch (error) {
      state.lastObservationError = String(error); save('observation-error-no-restart');
      await new Promise(resolve => setTimeout(resolve, 45000)); continue;
    }
    const terminal = fs.existsSync(output + '/receipt.json') ? json(output + '/receipt.json') : null;
    const status = runState(actual, terminal, start, manifest);
    state.lastProcesses = actual;
    if (status === 'ready') {
      state.websiteTerminal = { receiptSha256: sha(read(output + '/receipt.json')),
        counts: terminal.counts, child: terminal.child, passingClaim: terminal.passingClaim };
      break;
    }
    state.lastVerifiedLiveAt = new Date().toISOString(); save('waiting-specific-live-run');
    if (!state.announced) { console.log(JSON.stringify({ queued: true, pid: process.pid, waitsFor: state.waitsFor })); state.announced = true; }
    await new Promise(resolve => setTimeout(resolve, 45000));
  }
  save('verifying-full-run-frozen-inputs');
  for (const row of json(prep.sourceInputs)) assert.equal(sha(read(prep.site + '/' + row.path)), row.sha256, row.path);
  assert.equal(runGit(['-C', prep.atlas, 'rev-parse', 'HEAD']).toString().trim(), admission.source);
  assert.equal(runGit(['-C', prep.atlas, 'status', '--porcelain']).toString().trim(), '');
  verifySource();
  fs.copyFileSync(target + '/content/body-review-display-pins.json', stage + '/display-before.json.raw', fs.constants.COPYFILE_EXCL);
  const steps = [
    ['QUEUED_DENTAL_DISPLAY_PINS', 'scripts/generate-body-review-display-pins.mjs'],
    ['QUEUED_DENTAL_RENDERER_CHECK', 'scripts/body-renderer-revisions.mjs', '--check'],
    ['QUEUED_DENTAL_FULL_TRANSITION', 'scripts/verify-dental-mri-transition.mjs'],
  ];
  for (const [label, script, ...args] of steps) {
    if (stopped()) { save('stopped-before-next-step'); return; }
    verifySource(label !== 'QUEUED_DENTAL_DISPLAY_PINS');
    save('running-' + label);
    const child = spawn(process.execPath, [path.join(coordinator, 'run-visible-medicine-check.mjs'),
      sourceStage, label, process.execPath, script, ...args],
    { cwd: coordinator, windowsHide: true, stdio: 'inherit' });
    state.activeChildPid = child.pid; save('running-' + label);
    const result = await new Promise((resolve, reject) => { child.once('error', reject); child.once('close', (code, signal) => resolve({ code, signal })); });
    delete state.activeChildPid;
    const receipt = json(sourceStage + '/' + label + '.json');
    assert.equal(receipt.code, result.code); assert.equal(receipt.signal, result.signal);
    assert.equal(sha(read(receipt.log)), receipt.logSha256);
    state.steps.push({ label, ...result, receipt: sourceStage + '/' + label + '.json',
      receiptSha256: sha(read(sourceStage + '/' + label + '.json')) });
    if (result.code !== 0 || result.signal !== null) { save('failed-' + label); process.exitCode = 1; return; }
    state.currentSourcePaths = verifySource(true);
    if (label === 'QUEUED_DENTAL_DISPLAY_PINS') {
      state.changedDisplayIds = displayDelta(json(stage + '/display-before.json.raw'),
        json(target + '/content/body-review-display-pins.json'),
        json(target + '/content/dental-mri-pins.json').entries.map(row => row.identity.id));
    }
    if (label === 'QUEUED_DENTAL_FULL_TRANSITION') {
      const theorem = read(receipt.log).toString().split(/\r?\n/).filter(line => line.startsWith('{'))
        .map(line => JSON.parse(line)).find(row => row.changedTopics === 28 && row.preservedTopics === 9908);
      assert(theorem && theorem.changedPackets === 28 && theorem.preservedPackets === 1076 && theorem.storageCalls === 0);
      assert.equal(theorem.clinicalApproval, false);
      state.actualFullTheorem = theorem;
    }
    save('completed-' + label);
  }
  state.actualFullDentalGatePass = true;
  save('complete-needs-coordinator-review');
  console.log(JSON.stringify({ state: stage + '/state.json', actualFullDentalGatePass: true, installed: false }));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    const statePath = 'F:/VisibleMedicine/staging/20261021-after-suite-dental/state.json';
    if (fs.existsSync(statePath)) {
      const previous = json(statePath);
      if (previous.pid === process.pid) fs.writeFileSync(statePath, JSON.stringify({ ...previous,
        phase: 'failed-needs-coordinator-review', previousPhase: previous.phase,
        error: String(error), at: new Date().toISOString() }, null, 2) + '\n');
    }
    console.error(error); process.exitCode = 1;
  });
}
