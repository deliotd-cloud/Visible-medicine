import assert from 'node:assert/strict';
import test from 'node:test';
import {waitForStableMemory} from './admission-wait.mjs';
const run=async(readings)=>{let index=0,delays=0;const result=await waitForStableMemory({minimum:4096,attempts:readings.length,sample:()=>readings[index++],delay:async()=>{delays++;}});return {result,delays};};
const memory=(free,commit=41)=>({AvailableMBytes:free,PercentCommittedBytesInUse:commit});
test('requires consecutive headroom observations after a transient dip',async()=>{const {result,delays}=await run([memory(4300),memory(3900),memory(4230),memory(4300)]);assert(result.ready);assert.equal(result.observations.length,4);assert.equal(delays,3);});
test('times out without weakening existing admission or commit ceiling',async()=>{for(const readings of [[memory(4096),memory(4223)],[memory(4500,91),memory(4500,91)],[memory(4300),memory(3900)]]){const {result}=await run(readings);assert.equal(result.ready,false);assert.equal(result.minimumMiB,4096);}});
test('invalid counters and invalid limits refuse before launch',async()=>{for(const reading of [{},memory(-1),memory(5000,NaN),memory(5000,101)])await assert.rejects(run([reading,reading]),/Invalid memory/);await assert.rejects(waitForStableMemory({minimum:2000,sample:()=>memory(5000),delay:async()=>{}}));});
