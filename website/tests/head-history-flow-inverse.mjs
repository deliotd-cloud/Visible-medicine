// Exact current history fixture -> sealed prior fixture. Never used as product behavior.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const raw=readFileSync(new URL('./head-history-flow-inverse-hunks.json',import.meta.url));
assert.equal(sha(raw),'d7aadaf3df7c2e699234a0477a02f43ef60835e00a43bd65be5e534aa9dcc68c','Exact history repair manifest');
const spec=JSON.parse(raw);
function restoreFocusSuccessor(bytes){
 const receiptPath='G:/VisibleMedicine-temp/staging/20261031-native-public-images-ready/SOURCE.json';
 const priorPath='G:/VisibleMedicine-temp/staging/20261031-release-partition6-focused/SOURCE.json';
 const currentReceipt=readFileSync(receiptPath),priorReceipt=readFileSync(priorPath);
 assert.equal(sha(currentReceipt),'d55c215953aaf46c59515e4533a93984dc1ce0ecbf1d6a8b0a3fec583dbbc27d','Exact focus successor receipt');
 assert.equal(sha(priorReceipt),'422cf9760162b6fd5b87d7ac63f925aa5d2da506598ee82fda8aaaadd1868d30','Exact pre-focus receipt');
 const path='tests/head-image-history.test.ts';
 const current=JSON.parse(currentReceipt),prior=JSON.parse(priorReceipt);
 const one=(receipt,digest)=>{const rows=receipt.sourceRows.filter(row=>row.path===path);assert.equal(rows.length,1,'One exact history source row');assert.equal(rows[0].sha256,digest);return rows[0];};
 const currentRow=one(current,'feffec52b348dcf945b8126f8f8d27776817281cb4716bf72ac792ec78859983');
 const priorRow=one(prior,spec.after);
 assert.equal(bytes.length,currentRow.bytes);assert.equal(sha(bytes),currentRow.sha256,'Exact focus successor input');
 const before=readFileSync(prior.website+'/'+path);assert.equal(before.length,priorRow.bytes);assert.equal(sha(before),priorRow.sha256,'Sealed pre-focus source bytes');
 let source=bytes.toString('utf8');assert.deepEqual(Buffer.from(source),bytes);assert(!source.includes('\r'));
 for(const seam of ["import {focusImagingPane} from '../lib/imaging-pane-focus.ts';\n","name==='../lib/imaging-pane-focus'?{focusImagingPane}:"]){
  assert.equal(source.split(seam).length,2,'One exact focus transition seam');source=source.replace(seam,'');
 }
 const restored=Buffer.from(source);assert.equal(restored.length,priorRow.bytes);assert.equal(sha(restored),spec.after);
 assert.deepEqual(restored,before,'Complete prior history source recovered');
 return restored;
}
export function restoreHeadHistoryFlow(bytes){
 assert(Buffer.isBuffer(bytes),'Buffer source required');
 if(sha(bytes)==='feffec52b348dcf945b8126f8f8d27776817281cb4716bf72ac792ec78859983')bytes=restoreFocusSuccessor(bytes);
 assert.equal(sha(bytes),spec.after,'Exact current viewport harness / history flow');
 const text=bytes.toString('utf8');assert.deepEqual(Buffer.from(text),bytes);assert(!text.includes('\r'));
 const prior=text.split('\n');
 for(const h of spec.hunks.toReversed()){assert.deepEqual(prior.slice(h.newStart,h.newStart+h.added.length),h.added);prior.splice(h.newStart,h.added.length,...h.removed);}
 const result=Buffer.from(prior.join('\n'));assert.equal(sha(result),spec.before,'Complete prior history assertions recovered');
 const rebuilt=prior.slice();for(const h of spec.hunks.toReversed()){assert.deepEqual(rebuilt.slice(h.oldStart,h.oldStart+h.removed.length),h.removed);rebuilt.splice(h.oldStart,h.removed.length,...h.added);}
 assert.deepEqual(Buffer.from(rebuilt.join('\n')),bytes,'Exact forward reconstruction');return result;
}
