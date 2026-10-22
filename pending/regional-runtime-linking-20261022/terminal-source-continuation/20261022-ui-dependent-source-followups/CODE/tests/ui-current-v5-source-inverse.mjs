// Test-only exact later UI source inverse; never a delivery validator or runtime fallback.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
export function restoreUiV5Source(bytes){
 assert.equal(sha(bytes),'89125a0699029efb7186800ba761ecbe0748c052753424fc02fc36231f5f5913','Exact complete later UI source required');
 let text=bytes.toString('utf8');assert.deepEqual(Buffer.from(text),bytes);
 for(const[from,to]of [["  assert.equal(delivery.reviewSourceFiles, 1558);","  assert.equal(delivery.reviewSourceFiles, 1553);"],["  assert.equal(inputs.inputs.length, 1723);","  assert.equal(inputs.inputs.length, 1710);"],["    assert.equal(runtime.sourceCommit, delivery.runtimeSources[name], name);","    assert.equal(runtime.sourceCommit, current, name);"]]){
  assert.equal(text.split(from).length,2,'One exact later UI seam');text=text.replace(from,to);
 }
 const restored=Buffer.from(text);
 assert.equal(sha(restored),'8dac3b76e058953603aac3b7124fb19f3b754870cac0d88166ba2531efde13a8','Entire historical V5 UI source retained');return restored;
}
