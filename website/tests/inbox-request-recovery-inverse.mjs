import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const raw=readFileSync(new URL('./fixtures/inbox-request-recovery-inverse.json',import.meta.url));
assert.equal(sha(raw),'e118bc77f1e0583b35f5b4b5a9f644efe5e0558a4dc76b949a380998ea18e10e','Exact recovery source transition');
const record=JSON.parse(raw);assert.equal(record.schema,'vm-inbox-request-recovery-inverse/1');assert.equal(record.records.length,2);
/** Test-only exact reconstruction; runtime and current behavior tests use actual current source. */
export function beforeInboxRequestRecoverySource(path,current){
 const row=record.records.find(r=>r.path===path);if(!row)return current;
 assert(Buffer.isBuffer(current),'Raw source bytes required');
 assert.equal(sha(current),row.afterSha256,'Only exact current inbox bytes admitted');
 const text=current.toString('utf8');assert.deepEqual(Buffer.from(text),current);
 assert.equal(text.slice(row.start,row.start+row.inserted.length),row.inserted,'Exact current recovery span');
 const prior=text.slice(0,row.start)+row.removed+text.slice(row.start+row.inserted.length);
 assert.equal(sha(prior),row.beforeSha256,'Every historical source byte preserved');
 assert.equal(prior.slice(0,row.start)+row.inserted+prior.slice(row.start+row.removed.length),text,'Complete current source reconstructed');
 return Buffer.from(prior);
}
