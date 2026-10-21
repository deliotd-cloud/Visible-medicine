// Emit a bounded apply_patch after independently proving the only semantic edit.
import assert from 'node:assert/strict';
import {read,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261021-hepatic-xray-contract-proposal/tests';
const prior='F:/VisibleMedicine/staging/20261021-clinical-assurance-ready/files/tests';
const previous=read(prior+'/clinical-review-hepatic-venous-xray.test.ts');
const candidate=read(root+'/clinical-review-hepatic-venous-xray.test.ts');
const proof=read(root+'/hepatic-xray-preservation.test.mjs');
const original=read(root+'/fixtures/clinical-review-hepatic-venous-xray.original.ts.raw');
assert.equal(sha(previous),'182d5a2130226f0deaa4b32ae8458c804a8a05f72d44bb619fa62b786b29edb5');
assert.equal(sha(candidate),'9d598a559ec9543a6be1bfa9521559c61d9531519aadc2483efc8b1f529e0b6c');
assert.equal(sha(proof),'e425bc21bc5f8046da4a4d49b3f07af27486a24994a4546be332119cfbf7099d');
assert.equal(sha(original),'0e1caf978b937fc60ee32aa4410b2e5e99e706866c8be4d330181fcc3225c8b1');
assert.equal(sha(read(root+'/hepatic-admission-import-history.mjs')),'1b59db5168de418dc208334df0db8e53b907d270faed7df8144205536054148f');
const before="import {existsSync,readFileSync} from 'node:fs';\nimport {isAbsolute,realpathSync,relative,resolve} from 'node:path';";
const after="import {existsSync,readFileSync,realpathSync} from 'node:fs';\nimport {isAbsolute,relative,resolve} from 'node:path';";
assert.equal(previous.toString().split(before).length,2);
assert.deepEqual(Buffer.from(previous.toString().replace(before,after)),candidate,'Only the two exact built-in import lines differ');
function hunks(before,after){
 const a=before.split('\n'),b=after.split('\n'),dp=Array.from({length:a.length+1},()=>new Uint16Array(b.length+1));
 for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)dp[i][j]=a[i]===b[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
 const result=[];let i=0,j=0,open=null;const flush=()=>{if(open){result.push(open);open=null;}};
 while(i<a.length||j<b.length){
  if(i<a.length&&j<b.length&&a[i]===b[j]){flush();i++;j++;continue;}
  if(!open)open={beforeStart:i,afterStart:j,removed:[],added:[]};
  if(i<a.length&&(j===b.length||dp[i+1][j]>=dp[i][j+1]))open.removed.push(a[i++]);else open.added.push(b[j++]);
 }
 flush();return result.map(({removed,added})=>sha(JSON.stringify([removed,added])));
}
const text=proof.toString(),oldBlock=text.match(/const expectedHunks=\[\n[\s\S]*?\n\];/)?.[0];assert(oldBlock);
assert.deepEqual(oldBlock.match(/[a-f0-9]{64}/g),hunks(original.toString(),previous.toString()),'Previous reviewed hunk contract is exact');
const newBlock='const expectedHunks=[\n'+hunks(original.toString(),candidate.toString()).map(h=>" '"+h+"',").join('\n')+'\n];';
const oldPin="const candidateSha='182d5a2130226f0deaa4b32ae8458c804a8a05f72d44bb619fa62b786b29edb5';";
const newPin="const candidateSha='9d598a559ec9543a6be1bfa9521559c61d9531519aadc2483efc8b1f529e0b6c';";
assert.equal(text.split(oldPin).length,2);
console.log('*** Begin Patch\n*** Update File: '+root+'/hepatic-xray-preservation.test.mjs\n@@\n-'+oldPin+'\n+'+newPin+'\n@@\n'
 +oldBlock.split('\n').map(v=>'-'+v).join('\n')+'\n'+newBlock.split('\n').map(v=>'+'+v).join('\n')+'\n*** End Patch');
