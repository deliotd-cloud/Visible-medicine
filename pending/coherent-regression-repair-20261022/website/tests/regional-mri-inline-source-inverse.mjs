// Pure exact-byte new MRI inline test → frozen prior source adapter.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const priorHash='05435a2b21ff1036064bc5d8e83f6c11ff3990afa8360599050e0da49b4fcfd8';
const currentHash='6467bfb098644b04464969d98cbae9f8ca2974d9a54c320d29af39c1c419e716';
const hunkHashes=['1bc0e81c12cc5fe2c8bcdd92192c1d488536ab9b82c57c753000d3a48f15c2ee',
 '5b8fb82e62fbe6ddf1f54c9b0a493e2579c241bcbc8d37aa0480076e1111ee69',
 '6c9e11bd6e22876769f0edeba23ff1b8c96893c6d071fd0f46ee435290a0a00d',
 'ac64b9abb97e69b996c7abc59eb3078d0fc284c1aa1e793074f2c6da453f63f1',
 'a0570c385a0afa51254112a07925e87281e722758bcd73e14884fdd137353fb4',
 'e70da2ec5016ef49bc455c5a01aae41d9eea26a7086e609d35cd9bde61ba16d3',
 '9a4a03e40279128d9050c2abb16a1aad527a47c7e5292cf49c16bdfbd2765a66',
 'aa1914bf5050449672c95c53cd18d01f2ee12744d148f4a564a1e43f8b69be89'];
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
export function restoreRegionalMriInlinePrior(currentBytes,{readPrior=readFileSync}={}){
 assert.equal(sha(currentBytes),currentHash,'Exact new MRI inline test source');
 const prior=readPrior(new URL('./fixtures/regional-mri-inline-prior/regional-mri-inline-inspection.test.ts.raw',import.meta.url));
 assert.equal(sha(prior),priorHash,'Exact full frozen MRI inline test source');
 const before=prior.toString('utf8'),after=Buffer.from(currentBytes).toString('utf8');
 assert.deepEqual(Buffer.from(after),currentBytes,'Lossless current UTF-8');
 assert.equal((before.match(/\r/g)||[]).length,0,'No CR in frozen source');
 assert.equal((after.match(/\r/g)||[]).length,0,'No CR in current source');
 const edits=hunks(before,after);
 assert.deepEqual(edits.map(e=>sha(JSON.stringify([e.removed,e.added]))),hunkHashes,'Only exact reviewed MRI product hunks');
 const lines=after.split('\n');
 for(const edit of edits){
  if(edit.added.length)assert.equal(lines.filter((_,i)=>
   lines.slice(i,i+edit.added.length).join('\n')===edit.added.join('\n')).length,1,'Unique full-line new hunk');
  else assert.equal(before.split(edit.removed.join('\n')).length,2,'Unique frozen deletion-only hunk');
 }
 const restored=[...lines];
 for(const edit of edits.toReversed()){
  assert.deepEqual(restored.slice(edit.afterStart,edit.afterStart+edit.added.length),edit.added);
  restored.splice(edit.afterStart,edit.added.length,...edit.removed);
 }
 const bytes=Buffer.from(restored.join('\n'));
 assert.deepEqual(bytes,prior,'Complete exact MRI inline test inverse');
 return bytes;
}
