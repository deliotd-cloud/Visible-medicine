import assert from 'node:assert/strict';
// Admission only: this helper never starts, stops or changes a job.
// Five samples, 15 seconds apart, tolerate a transient dip without changing the floor.
export async function waitForAvailableMemory({sample, sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms)), onWait=()=>{}}){
  assert.equal(typeof sample,'function');assert.equal(typeof sleep,'function');assert.equal(typeof onWait,'function');
  const requiredMiB=4096,samples=[];
  for(let attempt=1;attempt<=5;attempt++){
    const availableMiB=await sample();
    assert(Number.isFinite(availableMiB)&&availableMiB>=0,'Memory probe must return a finite non-negative MiB value');
    samples.push(availableMiB);
    if(availableMiB>=requiredMiB||attempt===5)return {availableMiB,requiredMiB,admitted:availableMiB>=requiredMiB,samples,waitedMs:(attempt-1)*15000};
    await onWait({availableMiB,requiredMiB,attempt,maximumWaitMs:60000});
    await sleep(15000);
  }
  throw new Error('Unreachable admission state');
}
