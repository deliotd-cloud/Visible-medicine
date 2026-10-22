// Pure byte inverse of the current Review/runtime index test to the selected predecessor.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const currentHash='bc6c4172fe97f496320cb4d3170c83aeccbaa68f6b13b9786804fb2dd0f2e589';
const priorHash='9aa23fa7e8f91752145f5b3c1e4f9e99b77b8982032cc4df136dcc189cdc8811';
function hunks(before,after){
 const a=before.split('\n'),b=after.split('\n');
 const dp=Array.from({length:a.length+1},()=>new Uint16Array(b.length+1));
 for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)
  dp[i][j]=a[i]===b[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
 const edits=[];let i=0,j=0,open=null;
 const flush=()=>{if(open){edits.push(open);open=null;}};
 while(i<a.length||j<b.length){
  if(i<a.length&&j<b.length&&a[i]===b[j]){flush();i++;j++;continue;}
  if(!open)open={afterStart:j,removed:[],added:[]};
  if(i<a.length&&(j===b.length||dp[i+1][j]>=dp[i][j+1]))open.removed.push(a[i++]);
  else open.added.push(b[j++]);
 }
 flush();return edits;
}
export function restoreRegionalReferenceIndexPrior(currentBytes,{readPrior=readFileSync}={}){
 assert.equal(sha(currentBytes),currentHash,'exact new Review/runtime index test');
 const prior=readPrior(new URL('./fixtures/regional-reference-index-prior/regional-reference-review-index.test.ts.raw',import.meta.url));
 assert.equal(sha(prior),priorHash,'exact complete selected index predecessor');
 const before=prior.toString('utf8'),after=Buffer.from(currentBytes).toString('utf8');
 assert.deepEqual(Buffer.from(after),currentBytes,'lossless current UTF-8');
 assert.equal((before.match(/\r/g)||[]).length,0,'prior LF only');
 assert.equal((after.match(/\r/g)||[]).length,0,'current LF only');
 const edits=hunks(before,after);
 assert.equal(edits.length,7,'only seven bounded current-role/history-composition hunks');
 const lines=after.split('\n');
 for(const edit of edits){
  if(edit.added.length)assert.equal(lines.filter((_,i)=>
   lines.slice(i,i+edit.added.length).join('\n')===edit.added.join('\n')).length,1,'unique full-line edit hunk');
  else assert.equal(before.split(edit.removed.join('\n')).length,2,'unique deletion-only prior hunk');
 }
 const restored=[...lines];
 for(const edit of edits.toReversed()){
  assert.deepEqual(restored.slice(edit.afterStart,edit.afterStart+edit.added.length),edit.added,'exact inverse location');
  restored.splice(edit.afterStart,edit.added.length,...edit.removed);
 }
 const result=Buffer.from(restored.join('\n'));
 assert.deepEqual(result,prior,'entire selected predecessor restored');
 return result;
}
