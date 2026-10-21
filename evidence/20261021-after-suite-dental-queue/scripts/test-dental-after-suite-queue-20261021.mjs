import assert from 'node:assert/strict';
import { test } from 'node:test';
import { runState, displayDelta } from './queue-dental-after-suite-20261021.mjs';
const start = { runnerPid: 262080, testPid: 255564, entrySha256: 'entries', sourceSha256: 'files' };
const manifest = { entries: Array(1050).fill('entry'), entrySha256: 'entries', sourceSha256: 'files' };
const runner = { ProcessId: 262080, ParentProcessId: 117344, CreationDate: '/Date(1792538408682)/', CommandLine: 'node scripts/run-website-tests.mjs --run' };
const child = { ProcessId: 255564, ParentProcessId: 262080,
  CreationDate: '/Date(1792538411786)/',
  CommandLine: 'node --test-concurrency=1 2026-10-20T23-20-11-575Z-314c80d2-a04f-4372-af8e-e9f086c9cc86' };
const receipt = { schema: 'vm-complete-test-receipt-1', mode: 'run', launched: true,
  entryCount: 1050, testInputDrift: false, publicPreviewAssetDrift: false,
  child: { signal: null, exitCode: 1 }, counts: { tests: 1100, cancelled: 0 }, passingClaim: false };
test('real run identities hold slot, even if a receipt appears before process exit', () => {
  assert.equal(runState([runner, child], null, start, manifest), 'waiting');
  assert.equal(runState([runner], receipt, start, manifest), 'waiting');
  assert.equal(runState([child], receipt, start, manifest), 'waiting');
});
test('wrong process identity and parent cannot release or occupy the admitted slot', () => {
  for (const changed of [{ ...runner, ParentProcessId: 0 }, { ...runner, CommandLine: 'foreign' }])
    assert.throws(() => runState([changed], null, start, manifest));
  assert.throws(() => runState([{ ...child, ParentProcessId: 3 }], null, start, manifest));
  assert.throws(() => runState([{ ...child, CommandLine: 'foreign' }], null, start, manifest));
  assert.throws(() => runState([{ ...runner, CreationDate: '/Date(1792538408683)/' }], null, start, manifest));
  assert.throws(() => runState([{ ...child, CreationDate: '/Date(1792538411787)/' }], null, start, manifest));
});
test('vanished run without a terminal receipt refuses; genuine failure remains a failure', () => {
  assert.throws(() => runState([], null, start, manifest));
  assert.equal(runState([], receipt, start, manifest), 'ready');
  assert.equal(receipt.passingClaim, false);
});
test('drift, cancellation, resource exit, missing counts and wrong inventory require triage', () => {
  for (const patch of [{ testInputDrift: true }, { publicPreviewAssetDrift: true },
    { child: { exitCode: 137, signal: null } }, { child: { exitCode: 1, signal: 'SIGTERM' } },
    { counts: null }, { counts: { tests: 10, cancelled: 1 } }, { entryCount: 1049 }, { mode: 'list' }])
    assert.throws(() => runState([], { ...receipt, ...patch }, start, manifest));
  assert.throws(() => runState([], receipt, { ...start, sourceSha256: 'foreign' }, manifest));
});
const old = { schema: 'synthetic-test-only', pins: Array.from({ length: 1104 }, (_, i) => ({
  structureId: 'synthetic-' + i, sha256: 'a'.repeat(64),
})) };
const selected = old.pins.slice(0, 28).map(p => p.structureId);
const next = structuredClone(old);
for (const pin of next.pins.slice(0, 28)) pin.sha256 = 'b'.repeat(64);
test('exact28pin delta conserves all1104ordered identities and metadata', () => {
  assert.deepEqual(displayDelta(old, next, selected), selected);
  assert.equal(old.pins[0].sha256, 'a'.repeat(64));
});
test('unrelated, missing, unchanged, reordered or malformed pins refuse', () => {
  for (const edit of [value => { value.pins[28].sha256 = 'b'.repeat(64); },
    value => { value.pins[0].sha256 = 'a'.repeat(64); }, value => value.pins.pop(),
    value => value.pins.reverse(), value => { value.pins[0].sha256 = 'foreign'; },
    value => { value.schema = 'foreign'; }, value => { value.pins[0].extra = true; }]) {
    const value = structuredClone(next); edit(value);
    assert.throws(() => displayDelta(old, value, selected));
  }
  assert.throws(() => displayDelta(old, next, selected.slice(1)));
});
