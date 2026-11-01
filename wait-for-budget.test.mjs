import assert from 'node:assert/strict';
import test from 'node:test';
import {waitForBudget} from './wait-for-budget.mjs';
const run=(samples,extra={})=>{
 let time=0,index=0;
 return waitForBudget({minimum:3072,aggregate:1024,timeout:30,interval:10,now:()=>time,sleep:async ms=>{time+=ms;},sample:async()=>samples[Math.min(index++,samples.length-1)],...extra});
};
const mem=(available,commit=55)=>({AvailableMBytes:available,PercentCommittedBytesInUse:commit});
test('waits for two consecutive acceptable samples without weakening the threshold',async()=>{
 const r=await run([mem(3049),mem(3072),mem(3073)]);assert(r.ready);assert.equal(r.observations.length,3);assert.equal(r.minimum,3072);
});
test('a transient rise or high commit does not qualify; wait remains bounded',async()=>{
 for(const samples of [[mem(3073),mem(3049)],[mem(4096,91)]]){
  const r=await run(samples);assert(!r.ready);assert.equal(r.observations.at(-1).elapsed,30);
 }
});
test('missing measurements, sampling errors and reduced reserve fail closed',async()=>{
 await assert.rejects(run([{}]));
 await assert.rejects(run([],{sample:async()=>{throw Error('measurement unavailable');}}));
 await assert.rejects(run([mem(4096)],{minimum:3049}));
});
