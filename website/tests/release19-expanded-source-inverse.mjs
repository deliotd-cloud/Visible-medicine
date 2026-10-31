// Check every new admission-test edit against its authenticated release18 source.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const seamBytes=readFileSync(new URL('./release19-expanded-source-seams.json',import.meta.url));
assert.equal(sha(seamBytes),'5147386c5d7ea6e0c6b2f51621447ddc22dd45ce3fa1354c5b31f22d9c9b2d51',
 'Reviewed expanded-admission source seams');
const witness=JSON.parse(seamBytes);
export function restoreRelease19ExpandedSource(currentBytes){
 assert.equal(sha(currentBytes),witness.current,'Complete current expanded admission test');
 const prior=readFileSync(new URL('./fixtures/release19-expanded/expanded-review-delivery-admission.release18-final.raw',import.meta.url));
 assert.equal(sha(prior),witness.prior,'Authentic complete release18 admission test');
 const pieces=[];let offset=0;
 for(const edit of witness.edits){
  const old=Buffer.from(edit.old,'utf8');
  assert(edit.oldStart>=offset&&edit.oldStart+old.length<=prior.length,'Ordered admission seams');
  assert.deepEqual(prior.subarray(edit.oldStart,edit.oldStart+old.length),old,'Exact original admission seam');
  pieces.push(prior.subarray(offset,edit.oldStart),Buffer.from(edit.new,'utf8'));
  offset=edit.oldStart+old.length;
 }
 pieces.push(prior.subarray(offset));
 assert.deepEqual(Buffer.concat(pieces),Buffer.from(currentBytes),'Only eight reviewed admission edits');
 return prior;
}
