import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';
import {headLearningPresentationPredecessor} from './head-learning-presentation-predecessor.mjs';
const spec=JSON.parse(fs.readFileSync(new URL('./fixtures/head-learning-return-source.json',import.meta.url)));
const sha=text=>createHash('sha256').update(text).digest('hex');
export function headLearningReturnPredecessor(current){
 current=headLearningPresentationPredecessor(current);
 assert.equal(sha(current),spec.after,'Exact tour return UI');
 let old=current,delta=spec.chunks.reduce((n,c)=>n+c.after.length-c.before.length,0);
 for(const c of spec.chunks.toReversed()){delta-=c.after.length-c.before.length;const start=c.offset+delta;assert.equal(old.slice(start,start+c.after.length),c.after);old=old.slice(0,start)+c.before+old.slice(start+c.after.length);}
 assert.equal(sha(old),spec.before,'Whole preceding tour UI');let forward=old;
 for(const c of spec.chunks.toReversed()){assert.equal(forward.slice(c.offset,c.offset+c.before.length),c.before);forward=forward.slice(0,c.offset)+c.after+forward.slice(c.offset+c.before.length);}
 assert.equal(forward,current);return old;
}
