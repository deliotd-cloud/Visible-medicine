import assert from 'node:assert/strict';
import test from 'node:test';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { main } from '../scripts/run-website-tests.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = join(here, '..', '.local', 'diagnostic-fixtures');
mkdirSync(fixtures, { recursive: true });
function fixture() {
  const root = mkdtempSync(join(fixtures, 'source with spaces-'));
  mkdirSync(join(root, 'tests'));
  writeFileSync(join(root, 'package.json'), '{"type":"module"}\n');
  return root;
}

test('list mode retains discovery arguments and creates no TAP stream', async () => {
  const root = fixture();
  writeFileSync(join(root, 'tests', 'one.test.mjs'), "import test from 'node:test';test('synthetic',()=>{});\n");
  const original = console.log; let summary;
  console.log = line => { summary = JSON.parse(line); };
  try { assert.equal(await main(['--root', root, '--list']), 0); }
  finally { console.log = original; }
  const manifest = JSON.parse(readFileSync(join(summary.output, 'manifest.json')));
  assert.deepEqual(manifest.execution.args, ['--test', '--experimental-strip-types', '--test-concurrency=1', 'tests/*.test.ts', 'tests/*.test.mjs']);
  assert.equal(existsSync(join(summary.output, 'child.tap')), false);
  assert.equal(existsSync(join(summary.output, 'child.log')), false);
  assert.equal(summary.launched, false);
});

test('the actual CLI streams assertion details before terminal without changing source, roots or failure status', async () => {
  const root = fixture(), gate = join(root, '.local', 'release-gate');
  writeFileSync(join(root, 'tests', 'failure.test.ts'),
    "import test from 'node:test';import assert from 'node:assert/strict';test('synthetic early failure',()=>assert.deepEqual({observed:1},{observed:2}));\n");
  writeFileSync(join(root, 'tests', 'held.test.mjs'),
    "import test from 'node:test';import assert from 'node:assert/strict';import {existsSync} from 'node:fs';import {setTimeout as delay} from 'node:timers/promises';test('synthetic held sibling',async()=>{for(let i=0;i<1000&&!existsSync('.local/release-gate');i++)await delay(20);assert(existsSync('.local/release-gate'));});\n");
  const env = { ...process.env }; delete env.NODE_TEST_CONTEXT;
  const child = spawn(process.execPath, [join(here, '..', 'scripts', 'run-website-tests.mjs'), '--root', root, '--run'], {
    cwd: root, env, windowsHide: true, shell: false, stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stdout = '', stderr = '';
  child.stdout.on('data', chunk => { stdout += chunk; });
  child.stderr.on('data', chunk => { stderr += chunk; });
  const terminal = new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', (code, signal) => resolve({ code, signal }));
  });
  let output, earlyTap, started;
  try {
    for (let attempt = 0; attempt < 500; attempt++) {
      const runs = join(root, '.local', 'website-test-runs');
      // The runner creates the parent before its uniquely named run directory.
      // An empty parent is a valid intermediate state, not a missing execution.
      if (existsSync(runs) && readdirSync(runs).length > 0) {
        const names = readdirSync(runs); assert.equal(names.length, 1);
        output = join(runs, names[0]);
        const tap = join(output, 'child.tap'), start = join(output, 'started.json');
        if (existsSync(tap) && existsSync(start)) {
          earlyTap = readFileSync(tap, 'utf8');
          if (earlyTap.includes('ERR_ASSERTION') && earlyTap.includes('observed: 1') &&
              earlyTap.includes('observed: 2') && earlyTap.includes('failure.test.ts:')) {
            started = JSON.parse(readFileSync(start));
            break;
          }
        }
      }
      if (child.exitCode !== null || child.signalCode !== null) break;
      await delay(20);
    }
    assert(started, `detailed TAP must arrive before release: ${stderr}`);
    assert.equal(started.runnerPid, child.pid);
    assert.equal(child.exitCode, null); assert.equal(child.signalCode, null);
    assert.doesNotThrow(() => process.kill(started.testPid, 0), 'the exact recorded test child is live now');
    assert.equal(existsSync(join(output, 'receipt.json')), false);
    assert.equal(existsSync(gate), false);
  } finally {
    // Release the bounded synthetic sibling even if a parent assertion fails.
    mkdirSync(join(root, '.local'), { recursive: true });
    writeFileSync(gate, 'release\n', { flag: 'wx' });
    await terminal;
  }
  const end = await terminal;
  assert.deepEqual(end, { code: 1, signal: null });
  assert.equal(stderr, '');
  const summary = JSON.parse(stdout.trim()), receipt = JSON.parse(readFileSync(join(output, 'receipt.json')));
  const manifest = JSON.parse(readFileSync(join(output, 'manifest.json')));
  assert.equal(summary.passingClaim, false); assert.equal(summary.unskippedPassingClaim, false);
  assert.equal(receipt.testInputDrift, false); assert.equal(receipt.child.exitCode, 1);
  assert.deepEqual(receipt.counts, { tests: 2, pass: 1, fail: 1, cancelled: 0, skipped: 0, todo: 0 });
  assert.deepEqual(manifest.entries, ['tests/failure.test.ts', 'tests/held.test.mjs']);
  assert.deepEqual(manifest.execution.executedRoots, manifest.entries);
  assert.deepEqual(manifest.execution.coveredByImport, []);
  assert.deepEqual(receipt.child.args, manifest.execution.args); assert.deepEqual(started.args, manifest.execution.args);
  assert.equal(manifest.execution.args.filter(arg => arg === '--test-concurrency=1').length, 1);
  assert.equal(manifest.execution.args.at(-2), 'tests/*.test.ts');
  assert.equal(manifest.execution.args.at(-1), 'tests/*.test.mjs');
  assert.equal(started.entrySha256, manifest.entrySha256); assert.equal(started.sourceSha256, manifest.sourceSha256);
  assert.match(earlyTap, /ERR_ASSERTION/);
  assert.match(readFileSync(join(output, 'child.log'), 'utf8'), /ℹ fail 1/);
});
