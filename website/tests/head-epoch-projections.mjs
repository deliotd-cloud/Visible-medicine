import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {restorePreHeadFocusCurrentDeliverySource,restorePreRecoveryCurrentDeliverySource} from './current-delivery-predecessor-inverse.mjs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
function restoreBeforeNativeImagesDeliverySource(current){
 assert.equal(sha(current),'f37c68190b412a885a7e4bf9d3bfd33b08608844a6e46d5299d8f6ce1f7fb20e','Exact native-image delivery source');
 const marker="\ntest('native public images add exactly six bound input changes without changing source revisions'";
 assert.equal(current.split(marker).length,2,'One exact native-image successor case');
 let prior=current.slice(0,current.indexOf(marker));
 const one=(from,to)=>{assert.equal(prior.split(from).length,2,'Exact native-image projection seam');prior=prior.replace(from,to);};
 one('assert.equal(inputs,1866);','assert.equal(inputs,1862);');
 one('assert.equal(binding.inputs.length,1866);','assert.equal(binding.inputs.length,1862);');
 one(" const baseline='G:/VisibleMedicine-temp/staging/20261031-release-partition7-anatomy-final/website';\n const receipt=readFileSync('G:/VisibleMedicine-temp/staging/20261031-release-partition7-anatomy-final/SOURCE2.json');assert.equal(sha(receipt),'a4a8e70bd6c17d8960f8f056f64558ced5756095c1a40501d636a6d06dca6356');\n const rows=JSON.parse(receipt).sourceRows;\n const historicalRead=path=>{const matches=rows.filter(row=>row.path===path);assert.equal(matches.length,1,'One exact historical source row: '+path);const bytes=readFileSync(baseline+'/'+path);assert.equal(bytes.length,matches[0].bytes,path+' receipt byte length');assert.equal(sha(bytes),matches[0].sha256,path+' receipt SHA-256');return bytes;};\n",'');
 one("const current=historicalRead('tests/current-atlas-delivery.test.mjs').toString();assert.equal(sha(current),'e968312bb048176b2fb0b3c2452fd4afad818aea99a89d737ab5935500cf075d');","const current=read('tests/current-atlas-delivery.test.mjs').toString();");
 one("const binding=JSON.parse(historicalRead('atlas-review/integration-inputs.json'));","const binding=JSON.parse(read('atlas-review/integration-inputs.json'));");
 one('sha(historicalRead(audit[0].path))','sha(read(audit[0].path))');
 assert.equal(sha(prior),'e968312bb048176b2fb0b3c2452fd4afad818aea99a89d737ab5935500cf075d','Complete retained 1862-input test source');
 return prior;
}
function restoreBeforeDistributionAuditDeliverySource(current){
 assert.equal(sha(current),'e968312bb048176b2fb0b3c2452fd4afad818aea99a89d737ab5935500cf075d','Exact 1862-input delivery source');
 const marker="\ntest('distribution audit binding accounts for the one additional source without changing the preceding contract'";
 assert.equal(current.split(marker).length,2,'One exact distribution audit successor case');
 let prior=current.slice(0,current.indexOf(marker));
 for(const[from,to]of[['assert.equal(inputs,1862);','assert.equal(inputs,1861);'],['assert.equal(binding.inputs.length,1862);','assert.equal(binding.inputs.length,1861);']]){
  assert.equal(prior.split(from).length,2,'One exact additional binding count');
  prior=prior.replace(from,to);
 }
 assert.equal(sha(prior),'dfd4195012a9ac2661ba28b069416bfb2412d5859c96b71c1149aeacdcd2b2f7','Exact pre-audit delivery successor');
 return prior;
}
const currentReceipt=['F:/VisibleMedicine/staging/20261027-head-epoch-composition/SOURCE_CANDIDATE.json','757931264590f28193ef56d66f6f6cb5a02d64cd1cb2bb64ec322e7a6d86e14b'];
const releaseReceipt=['F:/VisibleMedicine/recovery/checkpoints/20261030-review-release-fixtures-verified/SOURCE-VERIFIED-SUBSET.json','9f78953ef58562118d495d30687e9bedb700b339a8b67de6858948f31e28b8c6'];
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
 const matches=[...patch.matchAll(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@[^\n]*\n((?:(?!^@@ ).*(?:\r?\n)?)*)/gm)];
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
 if(name==='delivery'&&Buffer.isBuffer(actualBytes)&&sha(actualBytes)==='2bb765ce69cd47ca7821ba2320ac16659f9c0fc154939d82772228f75ec5f67d'){
  const source=actualBytes.toString('utf8');assert(Buffer.from(source).equals(actualBytes),'Lossless head-focus delivery source');
  actualBytes=Buffer.from(restorePreHeadFocusCurrentDeliverySource(source));
 }
 if(name==='delivery'&&Buffer.isBuffer(actualBytes)&&sha(actualBytes)==='f37c68190b412a885a7e4bf9d3bfd33b08608844a6e46d5299d8f6ce1f7fb20e'){
  const source=actualBytes.toString('utf8');assert(Buffer.from(source).equals(actualBytes),'Lossless native-image delivery source');
  actualBytes=Buffer.from(restoreBeforeNativeImagesDeliverySource(source));
 }
 if(name==='delivery'&&Buffer.isBuffer(actualBytes)&&sha(actualBytes)==='e968312bb048176b2fb0b3c2452fd4afad818aea99a89d737ab5935500cf075d'){
  const source=actualBytes.toString('utf8');assert(Buffer.from(source).equals(actualBytes),'Lossless current delivery source');
  actualBytes=Buffer.from(restoreBeforeDistributionAuditDeliverySource(source));
 }
 if(name==='delivery'&&Buffer.isBuffer(actualBytes)&&sha(actualBytes)==='dfd4195012a9ac2661ba28b069416bfb2412d5859c96b71c1149aeacdcd2b2f7'){
  const source=actualBytes.toString('utf8');assert(Buffer.from(source).equals(actualBytes),'Lossless current delivery source');
  actualBytes=Buffer.from(restorePreRecoveryCurrentDeliverySource(source));
  assert.equal(sha(actualBytes),'95f246d6f65f5b6afb06b8e4a9c6eb47a00313e03aadf22bba271822eaea3fdd','Exact earlier Review successor');
 }
 const current=sealed(currentReceipt,role.path,role.current),prior=sealed(role.prior,role.path,role.old);
 // The current delivery has advanced; authenticate and reverse its complete
 // declared transition before applying the unchanged historical projection.
 if(name==='delivery'&&Buffer.isBuffer(actualBytes)&&!actualBytes.equals(current.bytes)){
  const successor=sealed(['F:/VisibleMedicine/recovery/checkpoints/20261029-review-delivery-repair/SOURCE_CANDIDATE.json','0daa99a5ed9098c7edef48f11bdf4634ab2097ecb5664bc594f44a6fab465b40'],role.path,'95f246d6f65f5b6afb06b8e4a9c6eb47a00313e03aadf22bba271822eaea3fdd');
  assert(actualBytes.equals(successor.bytes),'Exact successor input, not a changed copy');
  exactProjection(current,successor,7,'b85116698eda36c570f9ab19dcaa228ec702b63c317360ebe250fd8ee9820a81');
 }else if(name==='coverage'&&Buffer.isBuffer(actualBytes)&&!actualBytes.equals(current.bytes)){
  // The release continuation explicitly binds the original coverage proof to
  // its verified historical site. Reverse that whole test-source transition.
  const successor=sealed(releaseReceipt,role.path,'0befb850a2ff3eb86312e35616f1f5f4a7cd23a01b967596e2cb0e7da5fa2372');
  assert(actualBytes.equals(successor.bytes),'Exact coverage successor input, not a changed copy');
  exactProjection(current,successor,1,'5e3ead8b588375ad447a5545a16c341fa8cdc74837321aff91c1750c64b410f2');
 }else{
 assert(Buffer.isBuffer(actualBytes)&&actualBytes.equals(current.bytes),'Exact current input, not a changed copy');
 }
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

// Preserve both frozen pilot proofs after the exact, authenticated source-role update.
const pilotSuccessors=[
  {
    "name": "head-neck-pilot-current.test.mjs",
    "path": "tests/head-neck-pilot-current.test.mjs",
    "old": "2891a842e5c4723820ca61cfc51aea533a861809a40c4db8492808584462283d",
    "current": "b9986f08009042b6e12266cb0de311172a3c5521d607eb9423f01bc5666bf3b4",
    "hunks": 2,
    "patch": "23b8ed603b82135d5c88681ae3c94fea58a9065574dd2bf1445ae0f9c1704ddb"
  },
  {
    "name": "head-neck-pilot.test.ts",
    "path": "tests/head-neck-pilot.test.ts",
    "old": "5cb326883f1081550cb9940f4a603b2b9258e57ef41cee068ab3d33d786fc7d9",
    "current": "ba20957e2441f5a6d4f6f0589c7f8c9c1fdb0a7e0124857d3b717339c419e946",
    "hunks": 2,
    "patch": "7ab03cb84e9e819735a60543a9b192cf73f0ff99fd0e208e6d69c23e33448394"
  }
];
export function restorePilotBeforeSourceRoles(name,actualBytes){
 const row=pilotSuccessors.find(r=>r.name===name);assert(row,'Only two named pilot roles');
 const prior=sealed(currentReceipt,row.path,row.old);
 const current=sealed(['F:/VisibleMedicine/recovery/checkpoints/20261029-review-delivery-repair/SOURCE_CANDIDATE.json','0daa99a5ed9098c7edef48f11bdf4634ab2097ecb5664bc594f44a6fab465b40'],row.path,row.current);
 assert(Buffer.isBuffer(actualBytes)&&actualBytes.equals(current.bytes),'Exact pilot successor, not a changed copy');
 return exactProjection(prior,current,row.hunks,row.patch);
}
