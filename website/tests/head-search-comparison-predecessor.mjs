import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';
const spec=JSON.parse(fs.readFileSync(new URL('./fixtures/head-search-comparison-source.json',import.meta.url)));
const sha=text=>createHash('sha256').update(text).digest('hex');
export function headSearchComparisonPredecessor(current){
 assert.equal(sha(current),spec.after,'Exact current comparison UI');
 let old=current;for(const[a,b]of spec.seams.toReversed()){assert.equal(old.split(b).length,2);old=old.replace(b,a);}
 assert.equal(sha(old),spec.before,'Complete predecessor UI retained');
 let rebuilt=old;for(const[a,b]of spec.seams){assert.equal(rebuilt.split(a).length,2);rebuilt=rebuilt.replace(a,b);}assert.equal(rebuilt,current);
 const paging=JSON.parse(fs.readFileSync(new URL('./fixtures/head-search-comparison-paging-predecessor.json',import.meta.url)));
 assert.equal(sha(old),paging.after);const paged=old;
 for(const[a,b]of paging.seams.toReversed()){assert.equal(old.split(b).length,2);old=old.replace(b,a);}
 assert.equal(sha(old),paging.before);let forward=old;
 for(const[a,b]of paging.seams){assert.equal(forward.split(a).length,2);forward=forward.replace(a,b);}assert.equal(forward,paged);
 return old;
}
