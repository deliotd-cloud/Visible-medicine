import test from 'node:test';
import assert from 'node:assert/strict';
import {runController} from './runner.mjs';
import {oneNewStepPerInvocation} from './one-step-admission.mjs';

function fixture() {
  const steps = Array.from({length: 20}, (_, i) => `partition-${i + 13}`);
  let state = null, source = 'pinned-source';
  const launched = [];
  const adapters = {
    steps, fingerprint: 'pinned-source',
    verifySource: async () => source,
    validateReceipt: async (id, receipt, fingerprint) => receipt?.step === id && receipt?.fingerprint === fingerprint,
    loadState: async () => state,
    writeState: async value => {state = structuredClone(value);},
    now: () => 'fixed-time',
  };
  const run = (execute = async (id, fingerprint) => {
    launched.push(id);
    return {code: 0, receipt: {step: id, fingerprint}};
  }) => runController({...adapters, execute: oneNewStepPerInvocation(execute)});
  return {steps, adapters, launched, run, get state() {return state;}, set state(value) {state = structuredClone(value);}, setSource(value) {source = value;}};
}

test('one invocation completes 13 and defers 14; next completes 14 and defers 15', async () => {
  const f = fixture();
  const first = await f.run();
  assert.equal(first.status, 'deferred');
  assert.equal(first.terminal, true);
  assert.deepEqual(first.completed.map(x => x.id), ['partition-13']);
  assert.equal(first.current.id, 'partition-14');
  assert.deepEqual(first.error, {kind:'invocation-step-limit', maxNewSteps:1, completedHere:1, nextStep:'partition-14'});
  assert.deepEqual(f.launched, ['partition-13']);
  const fingerprint = first.fingerprint;
  const second = await f.run();
  assert.equal(second.status, 'deferred');
  assert.deepEqual(second.completed.map(x => x.id), ['partition-13','partition-14']);
  assert.equal(second.current.id, 'partition-15');
  assert.deepEqual(second.error, {kind:'invocation-step-limit', maxNewSteps:1, completedHere:1, nextStep:'partition-15'});
  assert.deepEqual(f.launched, ['partition-13','partition-14']);
  assert.equal(second.fingerprint, fingerprint);
  assert.deepEqual(second.steps, f.steps);
});

test('saved invalid receipt cannot be bypassed by invocation budget', async () => {
  const f = fixture(); await f.run();
  f.state = {...f.state, completed:[{id:'partition-13', receipt:{step:'partition-13', fingerprint:'wrong'}}]};
  const result = await f.run();
  assert.equal(result.status, 'failed');
  assert.match(result.error, /Saved receipt invalid/);
  assert.deepEqual(f.launched, ['partition-13']);
});

test('source drift fails before advancing a saved deferred state', async () => {
  const f = fixture(); await f.run();
  f.setSource('changed');
  const result = await f.run();
  assert.equal(result.status, 'failed');
  assert.match(result.error, /Source drift/);
  assert.deepEqual(f.launched, ['partition-13']);
});

test('genuine child failure remains failed and stops later steps', async () => {
  const f = fixture(); await f.run();
  const result = await f.run(async id => {f.launched.push(id); return {code:1};});
  assert.equal(result.status, 'failed');
  assert.equal(result.current.id, 'partition-14');
  assert.deepEqual(result.completed.map(x => x.id), ['partition-13']);
  assert.deepEqual(f.launched, ['partition-13','partition-14']);
});
