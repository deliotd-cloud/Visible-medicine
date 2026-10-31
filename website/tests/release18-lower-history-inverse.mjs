// Authenticate and peel the c32 succession addition before the original b79 source-role proof.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const seamBytes=readFileSync(new URL('./release18-lower-history-seams.json',import.meta.url));
assert.equal(sha(seamBytes),'cfa850dadc8ec51b665fe30de8123990b66d4ae02725cbe258904598d803001f',
 'Reviewed complete lower pin-history seam manifest');
const cases=JSON.parse(seamBytes);
export function restoreRelease18LowerHistory(name,currentBytes){
 const item=cases[name];assert(item,'Only two lower pin-history sources admitted');
 assert.equal(sha(currentBytes),item.current,
  name.endsWith('.test.mjs')?'Exact complete current consumer test':'Exact complete current helper');
 const prior=readFileSync(new URL('./fixtures/release18-lower/'+name+'.raw',import.meta.url));
 assert.equal(sha(prior),item.prior,'Authentic complete b79 source: '+name);
 const pieces=[];let offset=0;
 for(const edit of item.edits){
  const old=Buffer.from(edit.old,'utf8');
  assert(edit.oldStart>=offset&&edit.oldStart+old.length<=prior.length,'Ordered lower history seams');
  assert.deepEqual(prior.subarray(edit.oldStart,edit.oldStart+old.length),old,'Exact old lower seam');
  pieces.push(prior.subarray(offset,edit.oldStart),Buffer.from(edit.new,'utf8'));
  offset=edit.oldStart+old.length;
 }
 pieces.push(prior.subarray(offset));
 assert.deepEqual(Buffer.concat(pieces),Buffer.from(currentBytes),'Only reviewed c32 lower history edits');
 return prior;
}
