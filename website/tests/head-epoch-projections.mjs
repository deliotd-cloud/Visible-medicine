import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const currentReceipt=['F:/VisibleMedicine/staging/20261027-head-epoch-composition/SOURCE_CANDIDATE.json','757931264590f28193ef56d66f6f6cb5a02d64cd1cb2bb64ec322e7a6d86e14b'];
const widerReceipt=['F:/VisibleMedicine/staging/20261022-head-tools-wider-combined/APPLIED_SOURCE.json','f04f3dbcbb43ab16fdc3926c799f6a1d8b743e0a9b7f4ff1d6e557fd1aefccfd'];
const surfaceReceipt=['F:/VisibleMedicine/staging/20261022-head-surface-cancellation-successor/SOURCE.json','67b0f4f7716d062aaa2269c22b759436c3b62e2082248d4a447197d28a3643ed'];
const roles=Object.freeze({
 native:{path:'tests/head-native-history-current-transition.test.mjs',prior:widerReceipt,
  old:'6a2cf5ee21203146e830b696436fa5abc5d41637e818b7e54acfa672d5e5cfb5',current:'9266806b34dd490a7ede8821fd76d648e4252677d579dcab87b179a5d55663c2',hunks:3,patch:'b18d6eb81a10af3957dd1c69610a3f5dccadc774b68460150b9061abca3aed8d'},
 coverage:{path:'tests/current-190-coverage.test.mjs',prior:widerReceipt,
  old:'83f74758a50eff36e3cfa320067e040ef4fc33bf70cb8f78f1a12e3ba186a9b4',current:'76826d8987355f04586a62c95b36b8c79a39a1605fb74f3d5b3d20e9be6eb3fb',hunks:1,patch:'eab35271d721d49892653d4cbb254512efd320011ff93cfcc8e55dcb9c0b83fc'},
 delivery:{path:'tests/current-atlas-delivery.test.mjs',prior:surfaceReceipt,
  old:'6a4d43e4a5ca4a6c88b77c63cbb7269eac95d1a4eb678c3622e4b40b1fb911eb',current:'7a814c4b0d2ef77feda6c12f7fa6f73eb007cc351a8bbec7cf22b8e480c791d6',hunks:5,patch:'03656a74e67969bdba42754d88c9aa3c4dbb8a4ae71e7c62698d91dc799389ff'},
});
function sealed(receiptSpec,path,digest){
 const receiptBytes=readFileSync(receiptSpec[0]);assert.equal(sha(receiptBytes),receiptSpec[1],'Exact source receipt');
 const receipt=JSON.parse(receiptBytes),rows=receipt.sourceRows.filter(row=>row.path===path);
 assert.equal(rows.length,1,'One exact source row: '+path);assert.equal(rows[0].sha256,digest,path+' receipt digest');
 const file=receiptSpec===currentReceipt&&path==='tests/head-history-role-preservation.test.mjs'?'F:/VisibleMedicine/staging/20261027-head-epoch-composition/v1-test-source/'+path:receipt.website+'/'+path,bytes=readFileSync(file);
 assert.equal(bytes.length,rows[0].bytes,path+' byte length');assert.equal(sha(bytes),digest,path+' sealed source bytes');
 return {file,bytes};
}
const lines=text=>text.endsWith('\n')?text.slice(0,-1).split('\n'):text.split('\n');
const join=(items,endsWithNewline)=>items.join('\n')+(endsWithNewline?'\n':'');
function parsePatch(patch,count){
 const matches=[...patch.matchAll(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@[^\n]*\n((?:(?!^@@ ).*\n?)*)/gm)];
 assert.equal(matches.length,count,'Exact bounded hunk count');
 return matches.map(match=>{
  const removed=[],added=[];
  for(const row of match[5].replace(/\n$/,'').split('\n')){
   if(row.startsWith('-'))removed.push(row.slice(1));
   else if(row.startsWith('+'))added.push(row.slice(1));
   else assert.equal(row,'\\ No newline at end of file','Only the Git final-newline marker is allowed');
  }
  const oldCount=Number(match[2]??1),newCount=Number(match[4]??1);
  assert.equal(removed.length,oldCount);assert.equal(added.length,newCount);
  return {oldStart:Number(match[1])-(oldCount===0?0:1),newStart:Number(match[3])-(newCount===0?0:1),removed,added};
 });
}
function exactProjection(prior,current,expectedHunks,expectedPatch){
 const result=spawnSync('git',['-c','core.autocrlf=false','diff','--no-index','--unified=0','--',prior.file,current.file],{encoding:'utf8',windowsHide:true,maxBuffer:1024*1024});
 assert.equal(result.error,undefined);assert.equal(result.status,1,'Exactly one changed source pair');
 const at=result.stdout.indexOf('@@ ');assert(at>=0,'Git emitted exact hunks');
 const patch=result.stdout.slice(at);assert.equal(sha(Buffer.from(patch)),expectedPatch,'Exact transition patch');
 const hunks=parsePatch(patch,expectedHunks),old=prior.bytes.toString('utf8'),now=current.bytes.toString('utf8');
 assert.deepEqual(Buffer.from(old),prior.bytes);assert.deepEqual(Buffer.from(now),current.bytes);
 const reverse=lines(now),forward=lines(old);
 for(const h of hunks.toReversed()){
  assert.deepEqual(reverse.slice(h.newStart,h.newStart+h.added.length),h.added,'Exact reverse hunk');
  reverse.splice(h.newStart,h.added.length,...h.removed);
  assert.deepEqual(forward.slice(h.oldStart,h.oldStart+h.removed.length),h.removed,'Exact forward hunk');
  forward.splice(h.oldStart,h.removed.length,...h.added);
 }
 assert.equal(join(reverse,old.endsWith('\n')),old,'Complete prior source restored');
 assert.equal(join(forward,now.endsWith('\n')),now,'Complete current source reconstructed');
 return prior.bytes;
}
export function projectHeadEpoch(name,actualBytes){
 const role=roles[name];assert(role,'Only three named source epoch projections');
 const current=sealed(currentReceipt,role.path,role.current),prior=sealed(role.prior,role.path,role.old);
 assert(Buffer.isBuffer(actualBytes)&&actualBytes.equals(current.bytes),'Exact current input, not a changed copy');
 return exactProjection(prior,current,role.hunks,role.patch);
}
export function restoreBeforeHeadHistoryProjectionRoot(actualBytes){
 const path='tests/head-history-role-preservation.test.mjs';
 const prior=sealed(currentReceipt,path,'7573d5c5d2c654bbdccfb4c249108448571fd2c4e7ce6b6bf306d2c34da0aa7f');
 const file=fileURLToPath(new URL('./head-history-role-preservation.test.mjs',import.meta.url)),bytes=readFileSync(file);
 assert.equal(sha(bytes),'64b166532af9993bc5d49f899a3259f605533741d8b473712c7ba9a86aaad26d','Exact proposed head-history root');
 assert(Buffer.isBuffer(actualBytes)&&actualBytes.equals(bytes),'Changed head-history root refused');
 return exactProjection(prior,{file,bytes},3,'ced2a047443c08c04e3bf137758a5071953066e1e8d1ad68579ebc18d1ded270');
}
