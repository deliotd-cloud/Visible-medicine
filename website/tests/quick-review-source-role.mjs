import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
const raw=readFileSync(new URL('./fixtures/quick-review-source-transition.json',import.meta.url));
assert.equal(sha(raw),'07eee183276ef67827abc8ac6744212276a91a71d792c5d7aed505c738eb34b7');
const {records}=JSON.parse(raw);
/** Historical source reconstruction only; never used by runtime or behavioral tests. */
export function beforeQuickReviewSource(path,current){
 const record=records.find(r=>r.path===path);if(!record||sha(current)!==record.afterSha256)return current;
 const text=current.toString();assert.equal(text.slice(record.start,record.start+record.inserted.length),record.inserted);
 const prior=text.slice(0,record.start)+record.removed+text.slice(record.start+record.inserted.length);
 assert.equal(sha(prior),record.beforeSha256);assert.equal(prior.slice(0,record.start)+record.inserted+prior.slice(record.start+record.removed.length),text);
 return typeof current==='string'?prior:Buffer.from(prior);
}
