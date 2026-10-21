// Pure byte and inverse proof; the two original registered theorems must run separately.
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const original=new URL('./fixtures/clinical-review-hepatic-venous-xray.original.ts.raw',import.meta.url);
const candidate=new URL('./clinical-review-hepatic-venous-xray.test.ts',import.meta.url);
const loader=new URL('./hepatic-admission-import-history.mjs',import.meta.url);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const originalSha='0e1caf978b937fc60ee32aa4410b2e5e99e706866c8be4d330181fcc3225c8b1';
const candidateSha='9d598a559ec9543a6be1bfa9521559c61d9531519aadc2483efc8b1f529e0b6c';
const loaderSha='1b59db5168de418dc208334df0db8e53b907d270faed7df8144205536054148f';
const expectedHunks=[
 'd903c2c02f0cf7e63291ca9a1c224bf60d0da57a291f5a5c9090d1926e6b631b',
 '539a48ae174567f5fa60388b0d2357975a1cd6f373a201917494eedd1d9e64c4',
 '54509ca70bd574a26f79be22cda4f937608cdd5948c1fed1cf02c21509115212',
 'fb009d7a1563f79fda017aed0e7394a472e4579adae3ff98052ec9a91090749b',
 '225aad60dcfda8901aeb1d19b93f783fb3231bc5baa54269462d330e25c51ce8',
 '6b9f91f1e3ed32c9a4eb5ce2255ad736e8c7fa5164a2e7e2030f347cab5a58d3',
 'ac2705402a7736ae24d5275d0a8faf56e081e77107d5a4e8323224644ce1def2',
 '32fd26067c597c647ec07a9e3c0c0f912c628000614ed4b27d066cbfe3acf001',
 'fb0790d5dbd679bcf7a4e811ea37d953726c29b65bb2eda32d60652127c05d9d',
 'a0f866cadcd4650c3512072141fd6f84c770691e74fc6ce5bed6007d595bb501',
 '3d4306564e46ae0a4d75943bf146ffe45034baa65446b00a0294fd6498679884',
 '987d6c5c7e07d0cb5975ae7db5010cc73672db68bee97debc0e503fcfce5b49b',
 '31c72342c5a517a3b0d76f1e1d1605a8cd811e128642a8c4bbe043dbbbfc06fd',
 'f9c021edb8b06aac16bf3f49a069d7afa242774b2e2a730083cf847231bc6428',
 '5f6d83db709d161013ac0805267042c363e6cad9a26954db9848012d20240050',
 'e03b06830a332713b5c9d3d1a4473004c14f5ca17241d2ee11cab163ad19da80',
 '2dad6e9c4ace2592400efed8bfc324ed0b6fd2400b9832408d9b283b542a7749',
 '17b3c1387ca0dc576635c9fcb061055170ccad750b1dfae8b264c0b50840089d',
 'bae8c05b4583fb9f946979f03b18965cf43de348a6fa619b72b10ff96b90ad04',
 '154ec5d77da7c54e6c4be2d718e5c7a9e20449c581eec92b683fb66ea70500ca',
 'c3d89fa4dfd55b666060bce91089efba533d518a10157794c24f28ca0199da80',
 'ac3452fc5bdf655108d7f591c311a70b872b233ab9f8f0bfc0ff0b5ead0458fa',
 '1ad1bc592f7fff7327a7a1dfbd9ca349cff62094ae287572481467091a4cc811',
 'b881d39df8b4d1352f4e6733186d21c0749c264fa539ce2cc807b3efc8542092',
 '77d80be4ac6954a928f6bce5d3f5ae21d76bf8e2614f93be44e58202ccc53341',
];

function hunks(before,after){
 const a=before.split('\n'),b=after.split('\n');
 const dp=Array.from({length:a.length+1},()=>new Uint16Array(b.length+1));
 for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)
  dp[i][j]=a[i]===b[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
 const result=[];let i=0,j=0,open=null;
 const flush=()=>{if(open){result.push(open);open=null;}};
 while(i<a.length||j<b.length){
  if(i<a.length&&j<b.length&&a[i]===b[j]){flush();i++;j++;continue;}
  if(!open)open={beforeStart:i,afterStart:j,removed:[],added:[]};
  if(i<a.length&&(j===b.length||dp[i+1][j]>=dp[i][j+1]))open.removed.push(a[i++]);
  else open.added.push(b[j++]);
 }
 flush();return result;
}
function verify(bytes){
 assert.equal(sha(bytes),candidateSha,'Exact reviewed proposal test');
 const oldBytes=readFileSync(original),loaderBytes=readFileSync(loader);
 assert.equal(sha(oldBytes),originalSha,'Whole raw original fixture');
 assert.equal(sha(loaderBytes),loaderSha,'Exact fail-closed historical loader');
 const oldText=oldBytes.toString(),newText=bytes.toString();
 assert.equal(oldBytes.length,Buffer.byteLength(oldText));assert.equal(bytes.length,Buffer.byteLength(newText));
 assert.equal((oldText.match(/\r\n/g)||[]).length,0,'Original LF scope');
 assert.equal((newText.match(/\r\n/g)||[]).length,0,'Proposal LF scope');
 const edits=hunks(oldText,newText);
 assert.deepEqual(edits.map(({removed,added})=>sha(JSON.stringify([removed,added]))),expectedHunks,'Only reviewed admission edits');
 const reconstructed=newText.split('\n');
 for(const edit of edits.toReversed()){
  assert.deepEqual(reconstructed.slice(edit.afterStart,edit.afterStart+edit.added.length),edit.added);
  reconstructed.splice(edit.afterStart,edit.added.length,...edit.removed);
 }
 assert.equal(sha(Buffer.from(reconstructed.join('\n'))),originalSha,'Inverse restores every original byte');
 assert.equal((oldText.match(/\btest\('/g)||[]).length,2,'Two original registrations');
 assert.equal((newText.match(/\btest\('/g)||[]).length,3,'Both original registrations and a separate current theorem');
 for(const part of [
  "test('four exact hepatic venous X-ray drafts reach body learner and protected Review'",
  "test('admission changes only four of 9,936 lessons and 1,104 worksheets; forged review stays out of storage'",
  '{placements:9936,changed:4,packets:1104,changedPackets:4,storageCalls:0}',
  'assert.equal(placements-changed,9932);assert.equal(packets-changedPackets,1100);',
  "assert.equal(after.approval,false);assert.equal(after.status,'worksheet-not-submitted');",
  "assert.equal(await current.parseBodyReviewResponse(forged,structure.id),null);",
  "assert.equal((await save(forged)).status,422",
  "assert.equal((await save(approval)).status,422",
  "assert.equal((await saveLive(forgedLiveDecision)).status,422",
  "assert.equal((await saveLive(liveApproval)).status,422",
  'loadHepaticAdmissionImport()','admitPreservedClinicalReview({revision:liveCommit,sourceHashes:',
  "packet.source.structure,identity",'await api.parseBodyReviewResponse(packet,id)',
 ])assert(newText.includes(part),'Preserved or added binding: '+part);
 return edits.length;
}

if(process.argv.includes('--print-hunks')){
 const before=readFileSync(original,'utf8'),after=readFileSync(candidate,'utf8');
 process.stdout.write(JSON.stringify(hunks(before,after).map(({removed,added})=>sha(JSON.stringify([removed,added]))),null,2)+'\n');
}else test('hepatic X-ray original and proposal invert exactly; weakening is rejected',()=>{
 const bytes=readFileSync(candidate),text=bytes.toString();assert(verify(bytes)>0);
 for(const [from,to] of [
  ['{placements:9936,changed:4,packets:1104,changedPackets:4,storageCalls:0}',
   '{placements:9936,changed:3,packets:1104,changedPackets:4,storageCalls:0}'],
  ["assert.equal((await save(forged)).status,422","assert.equal((await save(forged)).status,200"],
  ['hepatic-admission-import-history','forearm-admission-import-history'],
 ]){assert(text.includes(from));assert.throws(()=>verify(Buffer.from(text.replace(from,to))));}
 assert.throws(()=>verify(Buffer.from('if(false){\n'+text+'\n}')));
});
