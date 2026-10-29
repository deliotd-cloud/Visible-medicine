import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';
const spec=JSON.parse(fs.readFileSync(new URL('./fixtures/head-learning-presentation-source.json',import.meta.url)));
const sha=text=>createHash('sha256').update(text).digest('hex');
export function headLearningPresentationPredecessor(current){
 // Allow the exact already-restored predecessor when history helpers compose.
 if(sha(current)===spec.before)return current;
 assert.equal(sha(current),spec.after,'Exact consolidated tour UI');
 let old=current,delta=spec.chunks.reduce((n,c)=>n+c.after.length-c.before.length,0);
 for(const c of spec.chunks.toReversed()){delta-=c.after.length-c.before.length;const start=c.offset+delta;assert.equal(old.slice(start,start+c.after.length),c.after);old=old.slice(0,start)+c.before+old.slice(start+c.after.length);}
 assert.equal(sha(old),spec.before,'Whole pre-consolidation tour UI');let forward=old;
 for(const c of spec.chunks.toReversed()){assert.equal(forward.slice(c.offset,c.offset+c.before.length),c.before);forward=forward.slice(0,c.offset)+c.after+forward.slice(c.offset+c.before.length);}
 assert.equal(forward,current);return old;
}
