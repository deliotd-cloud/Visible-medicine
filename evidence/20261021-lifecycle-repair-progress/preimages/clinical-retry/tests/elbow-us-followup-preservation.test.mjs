// Pure source inverse. The two original registered tests must also run natively.
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const original=new URL('./fixtures/clinical-review-elbow-us-followup.original.ts.raw',import.meta.url);
const candidate=new URL('./clinical-review-elbow-us-followup.test.ts',import.meta.url);
const loader=new URL('./elbow-admission-import-history.mjs',import.meta.url);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const originalSha='aad244f03fc81cec834dbed52eed7681f8a680f6d6d52cc82a9c17cde84fab0c';
const candidateSha='666eadec1b2b71bed584db21d022a5af97d4e6f5e8b589ab0c7d77704b63800e';
const loaderSha='f994bb22c3e12330d82fe9c25d33e1a48a2bee8dd9ebf47a3b5d222ca004232d';
const expectedHunks=[
 '5104dd811a6bbd05d1437521d87dee5febe09da5aa5977bc7ea96bc453e68cd6',
 'd4430081da676b3cf0f4108fa52d24092e446d53f969093da87bc686b0179fab',
 '1941e39cbf0b4e3ac37a74809fd72406a28853cd4e6383b2944d5dcc80f22f7b',
 '6e674b9a6663845e3e5216847681dd1debda80b6d2a01cfa824ac886614133eb',
 '7d602b9185ff498ae1bda114d619784530f171a68d8f4596bb2a2fb9f3bbaac2',
 'ac65894d1fafddfc90bef3b4b0be48b3892df993a2e28134ec398c5ec3b68aed',
 'ccf9323d311507af06542e86a0427c0f7eba6d996c0a0d5a21765c06b47be479',
 '98cb043d2386dc6fdf98f57a4b9c01da80a32253815b156055c368cfb44a9020',
 'f8375b8e4bc84a591fe4fbf9f4b3976c39f5fbaaa4f31da0def94ede3918b7fa',
 'ffbe9187090dda611d134e2eced52fb4403e9b89004dbc7c9f40963f47a12b32',
 '898c1bdaa5b90b87f99c1fd821d60c45bd4d01d967e4b710a4ffea9b92010554',
 'b8d9850965c15766e45f8a17f5640cdbca275c243a0af040f4c72eb1256081ec',
 '5aba1fd6aa7796df32094c5e8771aa814c9cfe20b2aa462f29387eebfc80acdb',
 '965c5f69c24e87972d407b8d00b927a2ec0f18bd0f6590271c7f58d99efd7f64',
 '24cc7c0f37f6bbba05b50b02f19eb63b92e27a4b89347a551167f4a9a632dcaa',
 '532d10b37cebe86fe9447f7504dafec1e5285823e402655a85498afaa24795ca',
 'ac27530780de0ab144936a96dfdf8bfad080d522d8d43b2813cc4d9de92c47b9',
 '424a3b4e5e9792cca58c54f88324739e68592ce863d9e3fb556f2c0f9251d32e',
 '4108b5880fa5a1f3fc9b1ceb9686b9671641ed524207cc58e79d856a45d81783',
 'fc1197d021aa41176f546ccbe7e30dce30ffe031507c160a6b03536047253c76',
 '48cc0879fea4f70341b8d251f804f4599c360b023924f0393a99e4a3470bc9b2',
 '109ddc3e0d71373575a537472cd444f9bc161e3e4489eb1d9d432a4d159d0c40',
 '7772b6d8f8a66298bcce8c484677afe5fd6469f14cee2207a939a1da500b7335',
 'fc8316e00946cae171642c916d320f73f10294edd636d88df2537256b2f58fce',
 '95a7540f45c69e97288382ceb66c059ccf6ffea1eb2572f092561dac061a2ce5',
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
 assert.equal(sha(bytes),candidateSha,'Exact reviewed proposed test');
 const originalBytes=readFileSync(original),loaderBytes=readFileSync(loader);
 assert.equal(sha(originalBytes),originalSha,'Byte-exact complete original test');
 assert.equal(sha(loaderBytes),loaderSha,'Exact strict historical loader');
 const oldText=originalBytes.toString(),newText=bytes.toString();
 const edits=hunks(oldText,newText);
 const fingerprints=edits.map(({removed,added})=>sha(JSON.stringify([removed,added])));
 assert.deepEqual(fingerprints,expectedHunks,'Only reviewed epoch/path/admission edits');
 const reconstructed=newText.split('\n');
 for(const edit of edits.toReversed()){
  assert.deepEqual(reconstructed.slice(edit.afterStart,edit.afterStart+edit.added.length),edit.added);
  reconstructed.splice(edit.afterStart,edit.added.length,...edit.removed);
 }
 assert.equal(sha(Buffer.from(reconstructed.join('\n'))),originalSha,'Complete inverse restores original bytes');
 const originalTests=oldText.match(/\btest\('/g)||[],currentTests=newText.match(/\btest\('/g)||[];
 assert.equal(originalTests.length,2);assert.equal(currentTests.length,2,'Both original registered theorems still run');
 for(const part of [
  '[6,9930,6,1098,0]',
  "['missing','body','citation','source','readiness','approval']",
  'status,409,s.id',
  'status,422,s.id',
  "stale continuation reached DB reads",
  "oldSnapshot=json(oldSnapshotPath)",
 ])assert(newText.includes(part),'Preserved history/security assertion: '+part);
 for(const part of [
  'loadElbowAdmissionImport()',
  'admitPreservedClinicalReview({revision,sourceHashes:',
  "+'&t=teaching'",
  "deliveredPacket.source.structure,identity",
  "parseBodyReviewResponse(deliveredPacket,entry.id)",
 ])assert(newText.includes(part),'Required current/historical binding: '+part);
 return {edits:edits.length,originalLines:oldText.split('\n').length,candidateLines:newText.split('\n').length};
}

test('elbow original test and strict loader invert exactly; weakened contracts fail',()=>{
 const bytes=readFileSync(candidate),text=bytes.toString(),proof=verify(bytes);
 assert(proof.edits>0);
 for(const [from,to] of [
  ['[6,9930,6,1098,0]','[5,9930,6,1098,0]'],
  ["+'&t=teaching'","+''"],
  ['status,422,s.id','status,200,s.id'],
  ['elbow-admission-import-history','colic-admission-import-history'],
 ]){
  assert(text.includes(from),'Unique tamper source exists: '+from);
  assert.throws(()=>verify(Buffer.from(text.replace(from,to))));
 }
 assert.throws(()=>verify(Buffer.from('if(false){\n'+text+'\n}')));
});
