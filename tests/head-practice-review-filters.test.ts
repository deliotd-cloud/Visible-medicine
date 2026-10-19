import assert from 'node:assert/strict';
import test from 'node:test';
import {filterHeadPracticeReview,headReviewIdentity} from '../lib/head-practice-review-filter.ts';
import type {HeadPracticeReviewItem} from '../lib/head-atlas-practice.ts';
import type {HeadEntry} from '../lib/head-atlas-import.ts';

function entry(id:string,label:string,laterality:string):HeadEntry {
  return {id,label,laterality,family:'synthetic',representation:'mask',color:[1,0,0],opacity:{fill:.2,outline:.8}};
}
const items:HeadPracticeReviewItem[]=[
  {entry:entry('left.pons','Left Pons — regional mask','left'),outcome:'correct'},
  {entry:entry('right.pons','Right Pons — regional mask','right'),outcome:'incorrect'},
  {entry:entry('left.caudate','Left caudate nucleus — regional mask','left'),outcome:'revealed'},
  {entry:entry('right.caudate','Right caudate nucleus — regional mask','right'),outcome:'unanswered'},
];

test('outcome filters classify all first outcomes and retain original indexes',()=>{
  assert.deepEqual(filterHeadPracticeReview(items,'','all').map(result=>result.index),[0,1,2,3]);
  assert.deepEqual(filterHeadPracticeReview(items,'','needs-review').map(result=>result.index),[1,2,3]);
  assert.deepEqual(filterHeadPracticeReview(items,'','correct').map(result=>result.index),[0]);
  assert.deepEqual(filterHeadPracticeReview(items,'RIGHT PONS','needs-review').map(result=>result.index),[1]);
  assert.deepEqual(filterHeadPracticeReview(items,'  cAuDaTe   RIGHT ','all').map(result=>result.index),[3]);
  assert.deepEqual(filterHeadPracticeReview(items,'left right','all'),[]);
});

test('review identity changes for replacement, outcomes, source fields and context',()=>{
  const baseline=headReviewIdentity(items,'CT','revision','Review original set');
  for(const value of [
    headReviewIdentity([...items].reverse(),'CT','revision','Review original set'),
    headReviewIdentity(items.map((item,index)=>index===0?{...item,outcome:'incorrect'}:item),'CT','revision','Review original set'),
    headReviewIdentity(items.map((item,index)=>index===0?{...item,entry:{...item.entry,label:'Changed'}}:item),'CT','revision','Review original set'),
    headReviewIdentity(items,'MRI','revision','Review original set'),
    headReviewIdentity(items,'CT','new revision','Review original set'),
    headReviewIdentity(items,'CT','revision','Review follow-up set'),
  ])assert.notEqual(value,baseline);
  assert.equal(headReviewIdentity([...items],'CT','revision','Review original set'),baseline);
});
