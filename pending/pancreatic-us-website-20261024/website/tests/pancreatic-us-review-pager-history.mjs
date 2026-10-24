// Authenticate the complete review-pager epoch without relabelling it current.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {assertReviewPagerCurrentDisplay,isReviewPagerUiRoot} from 'file:///F:/VisibleMedicine/staging/20261024-review-pager-website/website/tests/review-pager-ui-source-role.mjs';
import {assertCurrentTourSource as originalTourSource} from 'file:///F:/VisibleMedicine/staging/20261024-review-pager-website/website/tests/adjacent-current-tour-source-role.mjs';
const parent='F:/VisibleMedicine/staging/20261024-review-pager-website';
const bytes=readFileSync(parent+'/SOURCE_BOUND.json');
const sha=value=>createHash('sha256').update(value).digest('hex');
assert.equal(sha(bytes),'4058a3a368dc9573efc74c16d3b7e636057566bebfbb88232095322a459d21ea');
const receipt=JSON.parse(bytes);
for(const path of ['tests/review-pager-ui-source-role.mjs','tests/adjacent-current-tour-source-role.mjs','tests/current-atlas-delivery.mjs']){
 const row=receipt.sourceRows.find(row=>row.path===path);assert(row);
 assert.equal(sha(readFileSync(parent+'/website/'+path)),row.sha256,path);
}
export {assertReviewPagerCurrentDisplay,isReviewPagerUiRoot};
export function assertCurrentTourSource(options){
 assert.equal(options,undefined,'This historical theorem has one exact source context');
 return originalTourSource({atlasRoot:'F:/VisibleMedicine/staging/20261024-toolbar-button-contrast/atlas',sourceCommit:'b8ec59eeb0ec554b86d7ce01be992967e203b6a5'});
}
