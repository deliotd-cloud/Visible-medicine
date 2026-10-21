// Observes the already-running job only; never launches or stops a test.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { summarizeTapPrefix } from './native-tap-prefix-summary.mjs';
import { json, read, sha } from './source-only-backup-20261019.mjs';

const stage = 'F:/VisibleMedicine/staging/20261021-source190-complete-suite';
const output = 'F:/VisibleMedicine/staging/20261021-source190-website/website/.local/website-test-runs/2026-10-21T05-37-11-497Z-a5ab569e-0361-46d1-91d6-64fd8586c1c0';
const start = json(output + '/started.json'), manifest = json(output + '/manifest.json');
assert.equal(start.runnerPid, 263984);
assert.equal(start.testPid, 271752);
assert.equal(manifest.entryCount, 1063);
assert.equal(manifest.entrySha256, '3290e941ac8bd7b4412ad2e3fe0a0aaecb132abc311afbe0b64521fbc42a3b30');
assert.equal(manifest.sourceSha256, '2306e61509d74ecad033b35c677145d3458e5286bc2b12a35306f9d795f1c1b5');
assert.equal(start.sourceSha256, manifest.sourceSha256);
const raw = execFileSync('powershell.exe', ['-NoProfile', '-Command',
  "Get-CimInstance Win32_Process -Filter 'ProcessId = 263984 OR ProcessId = 271752 OR ProcessId = 260328' | Select-Object ProcessId,ParentProcessId,CommandLine | ConvertTo-Json -Compress"],
  { encoding: 'utf8', windowsHide: true });
const parsed = raw.trim() ? JSON.parse(raw) : [], processes = Array.isArray(parsed) ? parsed : [parsed];
const runner = processes.find(row => row.ProcessId === start.runnerPid);
const child = processes.find(row => row.ProcessId === start.testPid);
const live = !!(runner?.CommandLine.includes('scripts/run-website-tests.mjs --run') &&
  child?.ParentProcessId === start.runnerPid && child.CommandLine.includes('2026-10-21T05-37-11-497Z-a5ab569e-0361-46d1-91d6-64fd8586c1c0'));
const receipt = fs.existsSync(output + '/receipt.json') ? json(output + '/receipt.json') : null;
assert(live || receipt, 'Require actual same-process evidence or native terminal receipt');
const bytes = read(output + '/child.tap');
assert(bytes.length < 256 * 1024 * 1024, 'Refuse unbounded diagnostic input');
const prefix = summarizeTapPrefix(bytes.toString('utf8'));
const observed = { schema: 'vm-source190-suite-prefix/1', at: new Date().toISOString(), output,
  sameNativeProcessesLive: live, sourceSha256: manifest.sourceSha256, entrySha256: manifest.entrySha256,
  nativeEntryCount: manifest.entryCount, tapBytes: bytes.length, tapSha256: sha(bytes),
  ...prefix, nativeTerminalReceiptObserved: !!receipt, nativeCounts: receipt?.counts ?? null,
  nativePassingClaim: receipt?.passingClaim === true,
  ownerPreviewSameProcess: processes.some(row => row.ProcessId === 260328 && row.CommandLine.includes('scripts/start-stable-preview.mjs')),
  canonicalInstalled: false, sourceChanged: false, ownerPagesTouched: false };
const folder = stage + '/observations/' + observed.at.replace(/[:.]/g, '-') + '-' + randomUUID();
fs.mkdirSync(folder, { recursive: true });
fs.writeFileSync(folder + '/observation.json', JSON.stringify(observed, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ observation: folder + '/observation.json', sha256: sha(read(folder + '/observation.json')),
  live, rootResultMarkers: prefix.rootResultMarkers, failureMarkers: prefix.failureMarkers,
  nativeTerminalReceiptObserved: !!receipt, nativeCounts: receipt?.counts ?? null,
  lastFailureFiles: prefix.failures.slice(-4).map(row => row.file) }));
