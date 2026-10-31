import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const beforeSha='65407ec32882f84f215f0df3210b0c632452592a0cef63b5c76eb3849c85d159';
const afterSha='4a6ead3cfb9d2e70fcf2cede92a1ebd230758767808c08944a6535624c5f77d9';
const before="onClick={()=>{setActiveId('');setSelected(null);setLearningPosition(previous=>({...previous,conceptId:null}));writeNavigation(null,null);rememberCurrentSelection(null);}}>Clear selection";
const after="onClick={event=>{if(event.detail===0&&event.currentTarget.ownerDocument.activeElement===event.currentTarget&&!indexSearchRef.current?.disabled)indexSearchRef.current?.focus({preventScroll:true});setActiveId('');setSelected(null);setLearningPosition(previous=>({...previous,conceptId:null}));writeNavigation(null,null);rememberCurrentSelection(null);}}>Clear selection";

// This successor only reverses the focus addition. The existing historical
// adapter remains responsible for all earlier source roles and fixed digests.
export function restoreHeadClearFocusViewer(currentBytes){
 assert(Buffer.isBuffer(currentBytes),'viewer bytes');
 assert.equal(sha(currentBytes),afterSha,'clear-focus exact current binding');
 const current=currentBytes.toString('utf8');
 assert.deepEqual(Buffer.from(current),currentBytes,'lossless viewer text');
 assert.equal(current.split(after).length,2,'one exact Clear selection seam');
 const prior=current.replace(after,before);
 assert.equal(sha(Buffer.from(prior)),beforeSha,'original fixed viewer source');
 assert.equal(prior.split(before).length,2,'one original Clear selection seam');
 assert.equal(prior.replace(before,after),current,'whole successor source rebuilt');
 return Buffer.from(prior);
}
