// Authenticate the October 30 shoulder tests and invert only their later source-pin edits.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const seamBytes=readFileSync(new URL('./release18-shoulder-current-seams.json',import.meta.url));
assert.equal(sha(seamBytes),'a683ec2455d48f9ed38a7c4bc51823e3372c44a5b0f8de5787ee9666ce1225b6','Reviewed shoulder seam manifest');
const cases=JSON.parse(seamBytes);

export function restoreRelease18ShoulderCurrent(name,currentBytes){
 const item=cases[name];
 if(!item)return currentBytes;
 assert.equal(sha(currentBytes),item.current,'Exact current shoulder source: '+name);
 const prior=readFileSync(new URL('./fixtures/release18-shoulder-prior/'+name+'.raw',import.meta.url));
 assert.equal(sha(prior),item.prior,'Authentic October 30 shoulder witness: '+name);
 const pieces=[];let offset=0;
 for(const edit of item.edits){
  const old=Buffer.from(edit.old,'utf8');
  assert(edit.oldStart>=offset&&edit.oldStart+old.length<=prior.length,'Ordered shoulder seam: '+name);
  assert.deepEqual(prior.subarray(edit.oldStart,edit.oldStart+old.length),old,'Exact historical seam: '+name);
  pieces.push(prior.subarray(offset,edit.oldStart),Buffer.from(edit.new,'utf8'));
  offset=edit.oldStart+old.length;
 }
 pieces.push(prior.subarray(offset));
 assert.deepEqual(Buffer.concat(pieces),Buffer.from(currentBytes),'Only reviewed current source edits: '+name);
 return prior;
}
