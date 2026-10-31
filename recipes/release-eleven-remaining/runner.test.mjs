import test from 'node:test';
import assert from 'node:assert/strict';
import {runController} from './runner.mjs';

function fixture(overrides = {}) {
  let saved = null, source = 'source-1';
  const calls = [], writes = [];
  const adapters = {
    steps:['adjacent','partition-11'], fingerprint:'source-1',
    verifySource:async () => source,
    execute:async id => { calls.push(id); return {code:0, receipt:{id, source}}; },
    validateReceipt:async (id, receipt, fingerprint) => receipt?.id === id && receipt.source === fingerprint,
    loadState:async () => saved,
    writeState:async value => { saved = structuredClone(value); writes.push(structuredClone(value)); },
    now:() => 'fixed-time', ...overrides,
  };
  return {adapters, calls, writes, get saved() {return saved;}, set saved(value) {saved = structuredClone(value);}, setSource(value) {source = value;}};
}

test('ordered pass persists each step and a clean terminal state', async () => {
  const f = fixture(); const result = await runController(f.adapters);
  assert.equal(result.status, 'passed'); assert.equal(result.terminal, true);
  assert.deepEqual(f.calls, ['adjacent','partition-11']);
  assert.deepEqual(result.completed.map(x => x.id), f.adapters.steps);
  assert.equal(result.current, null);
  assert.ok(f.writes.some(x => x.current?.phase === 'child'));
  const writeCount = f.writes.length;
  assert.equal((await runController(f.adapters)).status, 'passed');
  assert.deepEqual(f.calls, ['adjacent','partition-11']); assert.equal(f.writes.length, writeCount);
});

test('admission refusal is terminal deferred, then resumes only the pending step', async () => {
  const f = fixture(); let refuse = true;
  f.adapters.execute = async id => { f.calls.push(id); if (id === 'partition-11' && refuse) return {kind:'deferred', reason:'RAM admission refused'}; return {code:0, receipt:{id,source:'source-1'}}; };
  const first = await runController(f.adapters);
  assert.equal(first.status, 'deferred'); assert.equal(first.terminal, true);
  assert.deepEqual(first.completed.map(x => x.id), ['adjacent']);
  assert.equal(first.current.id, 'partition-11');
  refuse = false;
  const resumed = await runController(f.adapters);
  assert.equal(resumed.status, 'passed');
  assert.deepEqual(f.calls, ['adjacent','partition-11','partition-11']);
});

test('thrown admission refusal also remains deferred without completing the step', async () => {
  const f = fixture({execute:async () => {throw Object.assign(new Error('memory gate'), {code:'ADMISSION_DEFERRED'});}});
  const result = await runController(f.adapters);
  assert.equal(result.status, 'deferred'); assert.equal(result.completed.length, 0);
  assert.equal(result.current.id, 'adjacent');
});

test('source drift after child fails terminal and preserves pending step', async () => {
  const f = fixture();
  f.adapters.execute = async id => {f.setSource('changed'); return {code:0,receipt:{id,source:'source-1'}};};
  const result = await runController(f.adapters);
  assert.equal(result.status, 'failed'); assert.match(result.error, /Source drift/);
  assert.equal(result.current.id, 'adjacent'); assert.equal(result.completed.length, 0);
  await assert.rejects(runController(f.adapters), /nonterminal or failed/);
});

for (const [label, execute] of [
  ['child throw', async () => {throw new Error('spawn error');}],
  ['child nonzero', async () => ({code:1, receipt:{id:'adjacent',source:'source-1'}})],
  ['invalid receipt', async () => ({code:0, receipt:{id:'wrong',source:'source-1'}})],
]) test(label + ' fails terminal without false completion', async () => {
  const f = fixture({execute}); const result = await runController(f.adapters);
  assert.equal(result.status, 'failed'); assert.equal(result.current.id, 'adjacent');
  assert.equal(result.completed.length, 0); assert.equal(f.saved.terminal, true);
});

test('resume refuses changed fingerprint, order, nonterminal state and invalid saved receipt', async () => {
  const f = fixture(); let refusal = true;
  f.adapters.execute = async id => id === 'partition-11' && refusal ? {kind:'deferred'} : {code:0,receipt:{id,source:'source-1'}};
  assert.equal((await runController(f.adapters)).status, 'deferred');
  await assert.rejects(runController({...f.adapters, fingerprint:'other'}), /fingerprint or ordered step plan/);
  await assert.rejects(runController({...f.adapters, steps:['partition-11','adjacent']}), /fingerprint or ordered step plan/);
  const deferred = f.saved;
  f.saved = {...deferred, terminal:false};
  await assert.rejects(runController(f.adapters), /nonterminal or failed/);
  f.saved = {...deferred, completed:[{id:'adjacent',receipt:{id:'wrong',source:'source-1'}}]};
  const invalid = await runController(f.adapters);
  assert.equal(invalid.status, 'failed'); assert.match(invalid.error, /Saved receipt invalid/);
  assert.equal(invalid.completed.length, 1); assert.equal(invalid.current.id, 'partition-11');
  refusal = false;
  await assert.rejects(runController(f.adapters), /nonterminal or failed/);
});

test('pre-step source drift fails before child launch', async () => {
  const f = fixture(); f.setSource('changed');
  const result = await runController(f.adapters);
  assert.equal(result.status, 'failed'); assert.deepEqual(f.calls, []);
  assert.equal(result.completed.length, 0);
});

test('completed receipts are checked before a deferred run launches again', async () => {
  const f=fixture();
  f.adapters.execute=async id=>id==='partition-11'?{kind:'deferred'}:{code:0,receipt:{id,source:'source-1'}};
  await runController(f.adapters);
  let launches=0;
  f.adapters.execute=async()=>{launches++;return {code:0};};
  f.adapters.validateReceipt=async()=>{throw new Error('saved evidence changed');};
  const result=await runController(f.adapters);
  assert.equal(result.status,'failed');assert.equal(launches,0);
  assert.match(result.error,/saved evidence changed/);
});

test('later child interruption preserves earlier completion without starting more work', async () => {
  const f=fixture({steps:['one','two','three']});
  f.adapters.execute=async id=>{f.calls.push(id);return id==='two'?{code:0,signal:'SIGTERM'}:{code:0,receipt:{id,source:'source-1'}};};
  const result=await runController(f.adapters);
  assert.equal(result.status,'failed');assert.deepEqual(f.calls,['one','two']);
  assert.deepEqual(result.completed.map(x=>x.id),['one']);assert.equal(result.current.id,'two');
});

test('source change during admission refusal is failure, not resumable deferral', async () => {
  const f=fixture();
  f.adapters.execute=async()=>{f.setSource('changed');return {kind:'deferred'};};
  const result=await runController(f.adapters);
  assert.equal(result.status,'failed');assert.equal(result.completed.length,0);
});

test('invalid step plans and fabricated completion prefixes cannot launch', async () => {
  const f=fixture();
  await assert.rejects(runController({...f.adapters,steps:['same','same']}),/unique/);
  await assert.rejects(runController({...f.adapters,steps:[]}),/unique/);
  f.saved={schema:'vm-sequential-verification/1',fingerprint:'source-1',steps:f.adapters.steps,
    terminal:true,status:'deferred',current:{id:'adjacent'},completed:[{id:'partition-11',receipt:{}}]};
  await assert.rejects(runController(f.adapters),/exact prefix/);assert.deepEqual(f.calls,[]);
});
