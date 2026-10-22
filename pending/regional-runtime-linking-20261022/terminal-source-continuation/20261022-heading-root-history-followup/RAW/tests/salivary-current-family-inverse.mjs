// Exact-byte current6d7 salivary test → frozen cache-epoch test source.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const oldHash='a6fea25a4dd1bde5c87d02cf993459a44c255a735e73ef9e0e7b20331309696a';
const currentHash='6d39291eb25118e1fb5c915acd940caa240139f0d4e23bd04705962158369f60';
const hunkHashes=['34b5a5cab7bf53d750cedadb60f5f68ddfbff9c7302fe2e2aeba47f51fdf8c04',
 '440a518cc42dce7cbdf535635efcb0ac3ac581c9c7a95476b22e144a5cfc2028',
 'f470759b6034cee3acb6826eaeccefa51b74758d9938918743beb44de9255fac',
 'e45b292d6df34195d65253f3ff15ab8ab8c5a4b3b2ba5deb2963790361b6b303',
 'e9811c364db9ac8fc7a53ee178c80c29c322567a1c631da32bdbf07c07d10d2e',
 '09c19c9ed026abca0a36e8c8e14cdfe967e91c026f7eb1f1bcd154cbee1a3a6c'];
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
export function restoreSalivaryCurrentPrior(currentBytes,{readPrior=readFileSync}={}){
 assert.equal(sha(currentBytes),currentHash,'Exact current salivary source bytes');
 const prior=readPrior(new URL('./fixtures/salivary-family-prior/clinical-review-salivary-stylohyoid-quiz.test.ts.raw',import.meta.url));
 assert.equal(sha(prior),oldHash,'Exact full frozen cache-epoch source');
 const before=prior.toString('utf8'),after=Buffer.from(currentBytes).toString('utf8');
 assert.deepEqual(Buffer.from(after),currentBytes,'Lossless current UTF-8');
 assert.equal((before.match(/\r/g)||[]).length,0,'No CR in frozen source');
 assert.equal((after.match(/\r/g)||[]).length,0,'No CR in current source');
 const edits=hunks(before,after);
 assert.deepEqual(edits.map(e=>sha(JSON.stringify([e.removed,e.added]))),hunkHashes,'Only exact reviewed source-family hunks');
 for(const edit of edits){
  assert(edit.added.length>0,'No deletion-only hunk');
  const lines=after.split('\n');
  assert.equal(lines.filter((_,i)=>
   lines.slice(i,i+edit.added.length).join('\n')===edit.added.join('\n')).length,1,'Unique full-line current hunk');
 }
 const restored=after.split('\n');
 for(const edit of edits.toReversed()){
  assert.deepEqual(restored.slice(edit.afterStart,edit.afterStart+edit.added.length),edit.added);
  restored.splice(edit.afterStart,edit.added.length,...edit.removed);
 }
 const bytes=Buffer.from(restored.join('\n'));
 assert.deepEqual(bytes,prior,'Complete source inverse');
 return bytes;
}
export function restoreSalivaryGuardPrior(currentBytes,{readPrior=readFileSync}={}){
 const guardCurrent='646bb8dc4a841aa97aedd5cf84cc3bdef1e99f14bfc53d98a9e0c9525155f69d';
 const guardPrior='15daeb7333adf104dfa6d7ab211d51d716872ce0a3b7da4a9797be62550e954e';
 const guardHunks=['1d9fb23cc1adb338b7f476050e4f481777cc2b5022652d63cf6a1de82cb09ffd',
  '3925cdfab5d7a328cee1f94570db545cd9285d78fe7c95ec7ba1089f79253010',
  'af7e4361e756596dc489e14455eb7694362968a1ba91505963e1172a37d34847',
  '39ae268c27a3112ff7249f4de3215fd0e4806286a63cf8456d2359a1aa506ce1'];
 assert.equal(sha(currentBytes),guardCurrent,'Exact current salivary guard bytes');
 const prior=readPrior(new URL('./fixtures/salivary-family-prior/salivary-cache-guard-adaptation.test.mjs.raw',import.meta.url));
 assert.equal(sha(prior),guardPrior,'Exact full frozen guard source');
 const before=prior.toString('utf8'),after=Buffer.from(currentBytes).toString('utf8');
 assert.deepEqual(Buffer.from(after),currentBytes,'Lossless guard UTF-8');
 assert.equal((before.match(/\r/g)||[]).length,0,'No CR in frozen guard');
 assert.equal((after.match(/\r/g)||[]).length,0,'No CR in current guard');
 const edits=hunks(before,after);
 assert.deepEqual(edits.map(e=>sha(JSON.stringify([e.removed,e.added]))),guardHunks,'Only exact guard-composition hunks');
 for(const edit of edits){
  assert(edit.added.length>0,'No deletion-only guard hunk');
  const lines=after.split('\n');
  assert.equal(lines.filter((_,i)=>
   lines.slice(i,i+edit.added.length).join('\n')===edit.added.join('\n')).length,1,'Unique full-line current guard hunk');
 }
 const restored=after.split('\n');
 for(const edit of edits.toReversed()){
  assert.deepEqual(restored.slice(edit.afterStart,edit.afterStart+edit.added.length),edit.added);
  restored.splice(edit.afterStart,edit.added.length,...edit.removed);
 }
 const bytes=Buffer.from(restored.join('\n'));
 assert.deepEqual(bytes,prior,'Complete current→frozen guard inverse');
 return bytes;
}
