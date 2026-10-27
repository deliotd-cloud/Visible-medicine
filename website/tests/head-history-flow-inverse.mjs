// Exact current history fixture -> sealed prior fixture. Never used as product behavior.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const raw=readFileSync(new URL('./head-history-flow-inverse-hunks.json',import.meta.url));
assert.equal(sha(raw),'d7aadaf3df7c2e699234a0477a02f43ef60835e00a43bd65be5e534aa9dcc68c','Exact history repair manifest');
const spec=JSON.parse(raw);
export function restoreHeadHistoryFlow(bytes){
 assert(Buffer.isBuffer(bytes),'Buffer source required');
 assert.equal(sha(bytes),spec.after,'Exact current viewport harness / history flow');
 const text=bytes.toString('utf8');assert.deepEqual(Buffer.from(text),bytes);assert(!text.includes('\r'));
 const prior=text.split('\n');
 for(const h of spec.hunks.toReversed()){assert.deepEqual(prior.slice(h.newStart,h.newStart+h.added.length),h.added);prior.splice(h.newStart,h.added.length,...h.removed);}
 const result=Buffer.from(prior.join('\n'));assert.equal(sha(result),spec.before,'Complete prior history assertions recovered');
 const rebuilt=prior.slice();for(const h of spec.hunks.toReversed()){assert.deepEqual(rebuilt.slice(h.oldStart,h.oldStart+h.removed.length),h.removed);rebuilt.splice(h.oldStart,h.removed.length,...h.added);}
 assert.deepEqual(Buffer.from(rebuilt.join('\n')),bytes,'Exact forward reconstruction');return result;
}
