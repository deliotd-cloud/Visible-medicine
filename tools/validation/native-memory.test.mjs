import assert from 'node:assert/strict';import test from 'node:test';
import {wholeMiB,availablePhysicalMiB} from './native-memory.mjs';
import {waitForAvailableMemory} from './memory-admission.mjs';
test('physical bytes are rounded down and never promote a below-floor sample',()=>{
  assert.equal(wholeMiB(4096*1048576-1),4095);assert.equal(wholeMiB(4096*1048576),4096);
  assert.equal(wholeMiB(4096*1048576+1048575),4096);assert.equal(wholeMiB(0),0);
});
test('malformed byte measurements fail closed',()=>{
  for(const bytes of [NaN,Infinity,-1,1.5,Number.MAX_SAFE_INTEGER+1,'4294967296',null,undefined])assert.throws(()=>wholeMiB(bytes),/valid non-negative/);
});
test('the Windows probe reads a fresh value once and refuses unverified platforms',()=>{
  let reads=0;const readBytes=()=>{reads++;return 5000*1048576;};
  assert.equal(availablePhysicalMiB({readBytes,platform:'win32'}),5000);assert.equal(reads,1);
  assert.throws(()=>availablePhysicalMiB({readBytes,platform:'linux'}),/verified for Windows/);assert.equal(reads,1);
});
test('retry admission still waits when the native byte count is one byte below 4GiB',async()=>{
  const bytes=[4096*1048576-1,4096*1048576],waits=[];
  const result=await waitForAvailableMemory({sample:()=>availablePhysicalMiB({readBytes:()=>bytes.shift(),platform:'win32'}),sleep:ms=>waits.push(ms)});
  assert(result.admitted);assert.deepEqual(result.samples,[4095,4096]);assert.deepEqual(waits,[15000]);assert.equal(result.requiredMiB,4096);
});
