// Proposal-only exact line delta between two independently hash-authenticated files.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const sha=value=>createHash('sha256').update(value).digest('hex');
export function lineDeltaHashes(beforeBytes,afterBytes){
 const text=bytes=>{
  const value=Buffer.from(bytes).toString('utf8');
  assert.deepEqual(Buffer.from(value),Buffer.from(bytes),'Lossless UTF-8 source');
  assert(!value.includes('\r'),'LF-only source');
  return value;
 };
 const a=text(beforeBytes).split('\n'),b=text(afterBytes).split('\n');
 assert(a.length<65000&&b.length<65000,'Line delta size bound');
 const cells=(a.length+1)*(b.length+1);
 assert(Number.isSafeInteger(cells)&&cells<=2_000_000,'Line delta cell bound');
 const dp=Array.from({length:a.length+1},()=>new Uint16Array(b.length+1));
 for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)
  dp[i][j]=a[i]===b[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
 const edits=[];let i=0,j=0,open=null;
 const flush=()=>{if(open){edits.push(open);open=null;}};
 while(i<a.length||j<b.length){
  if(i<a.length&&j<b.length&&a[i]===b[j]){flush();i++;j++;continue;}
  if(!open)open={removed:[],added:[]};
  if(i<a.length&&(j===b.length||dp[i+1][j]>=dp[i][j+1]))open.removed.push(a[i++]);
  else open.added.push(b[j++]);
 }
 flush();
 return edits.map(edit=>sha(JSON.stringify([edit.removed,edit.added])));
}
export function assertExactLineDelta(beforeBytes,afterBytes,expectedHashes,label){
 assert.deepEqual(lineDeltaHashes(beforeBytes,afterBytes),expectedHashes,label+' exact complete change set');
}
