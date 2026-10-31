import assert from 'node:assert/strict';import test from 'node:test';
import {waitForAvailableMemory} from './memory-admission.mjs';
test('ready memory starts immediately at the unchanged exact floor',async()=>{
  const result=await waitForAvailableMemory({sample:()=>4096,sleep:()=>assert.fail('No delay for ready memory'),onWait:()=>assert.fail('No wait notice for ready memory')});
  assert.deepEqual(result,{availableMiB:4096,requiredMiB:4096,admitted:true,samples:[4096],waitedMs:0});
});
test('a brief dip requires a fresh passing sample before admission',async()=>{
  const values=[4095,3980,4200],waits=[],notices=[];
  const result=await waitForAvailableMemory({sample:()=>values.shift(),sleep:ms=>waits.push(ms),onWait:v=>notices.push(v)});
  assert(result.admitted);assert.equal(result.availableMiB,4200);assert.equal(result.waitedMs,30000);
  assert.deepEqual(waits,[15000,15000]);assert.deepEqual(notices.map(v=>v.availableMiB),[4095,3980]);
  assert(notices.every(v=>v.requiredMiB===4096&&v.maximumWaitMs===60000));
});
test('sustained low memory remains deferred after at most one minute',async()=>{
  let probes=0;const waits=[];
  const result=await waitForAvailableMemory({sample:()=>{probes++;return 4000;},sleep:ms=>waits.push(ms)});
  assert.equal(probes,5);assert.equal(result.admitted,false);assert.equal(result.availableMiB,4000);
  assert.equal(result.waitedMs,60000);assert.deepEqual(waits,[15000,15000,15000,15000]);assert.equal(result.requiredMiB,4096);
});
test('invalid memory readings fail closed without a retry or admission',async()=>{
  for(const value of [NaN,Infinity,-1,'5000',null,undefined])await assert.rejects(waitForAvailableMemory({sample:()=>value,sleep:()=>assert.fail('Invalid probes cannot sleep')}),/finite non-negative/);
});
test('probe, wait and observer failures propagate before any admission',async()=>{
  await assert.rejects(waitForAvailableMemory({sample:()=>{throw new Error('probe failed');}}),/probe failed/);
  await assert.rejects(waitForAvailableMemory({sample:()=>3500,sleep:()=>{throw new Error('wait failed');}}),/wait failed/);
  await assert.rejects(waitForAvailableMemory({sample:()=>3500,onWait:()=>{throw new Error('observer failed');},sleep:()=>assert.fail('No sleep after observer failure')}),/observer failed/);
});
