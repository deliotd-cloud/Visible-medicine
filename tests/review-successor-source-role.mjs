import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
const raw=readFileSync(new URL('./fixtures/review-successor-source-transitions.json',import.meta.url));
assert.equal(sha(raw),'4c277313483349dac2bc1f334b7de9f7481cf1a33aecfe94500b22a886901f4c','Exact declared source transition evidence');
const {records}=JSON.parse(raw);
assert.equal(new Set(records.map(r=>r.path)).size,4);
export function restoreExactReviewSource(record,current){
 assert(Buffer.isBuffer(current),'Exact source bytes required');
 if(sha(current)===record.beforeSha256)return current;
 assert.equal(sha(current),record.afterSha256,'Only the exact authenticated successor is admitted');
 const text=current.toString('utf8');assert.deepEqual(Buffer.from(text),current);
 assert(Number.isSafeInteger(record.start)&&record.start>=0&&record.start<=text.length);
 assert.equal(text.slice(record.start,record.start+record.inserted.length),record.inserted,'Exact inserted source span');
 const prior=text.slice(0,record.start)+record.removed+text.slice(record.start+record.inserted.length);
 assert.equal(sha(prior),record.beforeSha256,'Every preceding source byte is retained');
 assert.equal(prior.slice(0,record.start)+record.inserted+prior.slice(record.start+record.removed.length),text,'Complete forward reconstruction');
 return Buffer.from(prior);
}
export function beforeReviewSuccessorSource(path,current){
 const record=records.find(r=>r.path===path);assert(record,'Only four declared source roles');
 const bytes=typeof current==='string'?Buffer.from(current):current;
 const before=restoreExactReviewSource(record,bytes);return typeof current==='string'?before.toString():before;
}
