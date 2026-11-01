import assert from 'node:assert/strict';

// Wait only for already-authorized resource release. This never stops processes
// or relaxes the subsequent Windows job memory/commit supervision.
export async function waitForBudget({sample,minimum,aggregate,now=Date.now,sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms)),timeout=30000,interval=2000}){
 assert(Number.isInteger(minimum)&&Number.isInteger(aggregate)&&aggregate>0&&minimum>=aggregate+2048);
 assert(Number.isInteger(timeout)&&timeout>=0&&timeout<=30000);
 assert(Number.isInteger(interval)&&interval>0&&interval<=timeout);
 const started=now(),observations=[];let consecutive=0;
 while(true){
  const memory=await sample(),elapsed=now()-started;
  assert(Number.isFinite(memory.AvailableMBytes)&&memory.AvailableMBytes>=0);
  assert(Number.isFinite(memory.PercentCommittedBytesInUse)&&memory.PercentCommittedBytesInUse>=0&&memory.PercentCommittedBytesInUse<=100);
  const adequate=memory.AvailableMBytes>=minimum&&memory.PercentCommittedBytesInUse<=90;
  observations.push({elapsed,...memory,adequate});
  consecutive=adequate?consecutive+1:0;
  if(consecutive>=2&&elapsed<=timeout)return {ready:true,minimum,aggregate,observations};
  if(elapsed>=timeout)return {ready:false,minimum,aggregate,observations};
  await sleep(Math.min(interval,timeout-elapsed));
 }
}
