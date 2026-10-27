import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const currentReceipt=['F:/VisibleMedicine/staging/20261027-head-epoch-composition/SOURCE_CANDIDATE_V2.json','9add9cae82405a4648d5afb5548e2040d00afe5cce37db6c1c420c0c073f72a7'];
const widerReceipt=['F:/VisibleMedicine/staging/20261022-head-tools-wider-combined/APPLIED_SOURCE.json','f04f3dbcbb43ab16fdc3926c799f6a1d8b743e0a9b7f4ff1d6e557fd1aefccfd'];
const v1Receipt=['F:/VisibleMedicine/staging/20261027-head-epoch-composition/SOURCE_CANDIDATE.json','757931264590f28193ef56d66f6f6cb5a02d64cd1cb2bb64ec322e7a6d86e14b'];
function readBound(spec,path,digest,archive=null){
 const receiptBytes=readFileSync(spec[0]);assert.equal(sha(receiptBytes),spec[1],'Exact source receipt');
 const receipt=JSON.parse(receiptBytes),rows=receipt.sourceRows.filter(row=>row.path===path);
 assert.equal(rows.length,1,'One exact source row');assert.equal(rows[0].sha256,digest,path+' receipt digest');
 const file=archive??receipt.website+'/'+path,bytes=readFileSync(file);
 assert.equal(bytes.length,rows[0].bytes,path+' byte length');assert.equal(sha(bytes),digest,path+' source bytes');
 return {file,bytes};
}
const lines=text=>text.endsWith('\n')?text.slice(0,-1).split('\n'):text.split('\n');
const join=(items,finalNewline)=>items.join('\n')+(finalNewline?'\n':'');
function exactTransition(prior,current,expectedCount,expectedPatch){
 const result=spawnSync('git',['-c','core.autocrlf=false','diff','--no-index','--unified=0','--',prior.file,current.file],{encoding:'utf8',windowsHide:true,maxBuffer:1024*1024});
 assert.equal(result.error,undefined);assert.equal(result.status,1,'Exact changed source pair');
 const at=result.stdout.indexOf('@@ ');assert(at>=0,'Git emitted source hunks');
 const patch=result.stdout.slice(at);assert.equal(sha(Buffer.from(patch)),expectedPatch,'Exact full transition patch');
 const matches=[...patch.matchAll(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@[^\n]*\n((?:(?!^@@ ).*\n?)*)/gm)];
 assert.equal(matches.length,expectedCount,'Exact bounded hunk count');
 const hunks=matches.map(match=>{
  const removed=[],added=[];
  for(const line of match[5].replace(/\n$/,'').split('\n')){
   if(line.startsWith('-'))removed.push(line.slice(1));
   else if(line.startsWith('+'))added.push(line.slice(1));
   else assert.equal(line,'\\ No newline at end of file','Only the Git final-newline marker is allowed');
  }
  const oldCount=Number(match[2]??1),newCount=Number(match[4]??1);
  assert.equal(removed.length,oldCount);assert.equal(added.length,newCount);
  return {oldStart:Number(match[1])-(oldCount===0?0:1),newStart:Number(match[3])-(newCount===0?0:1),removed,added};
 });
 const old=prior.bytes.toString('utf8'),now=current.bytes.toString('utf8');
 assert(Buffer.from(old).equals(prior.bytes),'Lossless prior UTF-8');assert(Buffer.from(now).equals(current.bytes),'Lossless current UTF-8');
 const reverse=lines(now),forward=lines(old);
 for(const h of hunks.toReversed()){
  assert(h.added.length===reverse.slice(h.newStart,h.newStart+h.added.length).length&&
   h.added.every((line,i)=>reverse[h.newStart+i]===line),'Exact reverse hunk');
  reverse.splice(h.newStart,h.added.length,...h.removed);
  assert(h.removed.length===forward.slice(h.oldStart,h.oldStart+h.removed.length).length&&
   h.removed.every((line,i)=>forward[h.oldStart+i]===line),'Exact forward hunk');
  forward.splice(h.oldStart,h.removed.length,...h.added);
 }
 assert(Buffer.from(join(reverse,old.endsWith('\n'))).equals(prior.bytes),'Complete prior bytes restored');
 assert(Buffer.from(join(forward,now.endsWith('\n'))).equals(current.bytes),'Complete current bytes reconstructed');
 return prior.bytes;
}
export function projectColicDrawableEpoch(actualBytes){
 const path='tests/drawable-epoch-current-admission.test.mjs';
 const prior=readBound(widerReceipt,path,'269e7af836b93760fcf460bf39ce1be296a96c1549452b04076a38a52d24c9ce');
 const current=readBound(currentReceipt,path,'0308f5bf0df4d4291c7015bbb6bb94562effc0e0d4265b83fbd84d936dc38879');
 assert(actualBytes.equals(current.bytes),'Changed drawable source refused');
 return exactTransition(prior,current,12,'e925b72ef04d9936d93dd89234fc82f39b2d2df0740592960bc7275b871611c5');
}
export function restoreBeforeColicFinalCompositionRoot(actualBytes){
 const path='tests/colic-adapter-inverse.test.mjs';
 const prior=readBound(v1Receipt,path,'6926164ef11cbd21c154a85f2f7f14c81dfb1b79a60f4c1b32d31f509107ce54',
  'F:/VisibleMedicine/staging/20261027-head-epoch-composition/v1-test-source/tests/colic-adapter-inverse.test.mjs');
 const file=fileURLToPath(new URL('./colic-adapter-inverse.test.mjs',import.meta.url)),bytes=readFileSync(file);
 assert.equal(sha(bytes),'c095add73bece35427ed6356d60ce317b7635052a4eaf5706a3731b5613ae928','Exact proposed colic proof');
 assert(actualBytes.equals(bytes),'Changed colic proof refused');
 return exactTransition(prior,{file,bytes},5,'9e4c4b4d041a4bab79269b217b12b3d2642715d332e565d3b201960af6f8f53d');
}
