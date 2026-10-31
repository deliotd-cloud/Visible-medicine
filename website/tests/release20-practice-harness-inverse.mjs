// Authenticate the full current harness before its original historical inverse.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const seamBytes=readFileSync(new URL('./fixtures/release20-practice/head-practice-exit-source-seams.json',import.meta.url));
assert.equal(sha(seamBytes),'a49c6c19da2bf3d5cc456736117f94ec1f90a51c04b79850fc81099201a3f4ca',
 'Reviewed practice-harness transition manifest');
const witness=JSON.parse(seamBytes);
export function restoreRelease20PracticeHarness(currentBytes){
 assert.equal(sha(currentBytes),witness.current,'Complete current practice-exit harness');
 const old=readFileSync(new URL('./fixtures/release20-practice/head-practice-exit.release19.raw',import.meta.url));
 assert.equal(sha(old),witness.prior,'Authentic complete preceding practice-exit harness');
 let offset=0;const pieces=[];
 for(const edit of witness.edits){
  const removed=Buffer.from(edit.old,'utf8');
  assert(edit.oldStart>=offset&&edit.oldStart+removed.length<=old.length,'Ordered practice harness seam');
  assert.deepEqual(old.subarray(edit.oldStart,edit.oldStart+removed.length),removed,'Exact old harness seam');
  pieces.push(old.subarray(offset,edit.oldStart),Buffer.from(edit.new,'utf8'));
  offset=edit.oldStart+removed.length;
 }
 pieces.push(old.subarray(offset));
 assert.deepEqual(Buffer.concat(pieces),Buffer.from(currentBytes),'Only reviewed harness edits');
 return old;
}
