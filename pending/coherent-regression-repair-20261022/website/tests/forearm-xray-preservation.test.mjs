// Pure byte/line preservation proof. Both original registered theorems also run natively later.
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {restorePriorCurrentEpoch} from './current-epoch-source-adapter.mjs';

const original=new URL('./fixtures/clinical-review-forearm-vascular-xray.original.ts.raw',import.meta.url);
const candidate=new URL('./clinical-review-forearm-vascular-xray.test.ts',import.meta.url);
const loader=new URL('./forearm-admission-import-history.mjs',import.meta.url);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const originalSha='59af4032c50b8352a1664d9296f522d2dd63bb0fbda5653ccd7c26168103bc62';
const candidateSha='108d94b7a5b0ead7e302ab576b2f295d44eb7cd7c2229de686115402379b6778';
const loaderSha='d6b519e7a24b27163b8417fa46829dd41dc8978a97b58df1b7ae453d75c86629';
const expectedHunks=[
 '5104dd811a6bbd05d1437521d87dee5febe09da5aa5977bc7ea96bc453e68cd6',
 'f8c56d325255f9cefdb365431ee1fa279b0b2663f87b8d0a696d9535b4462b50',
 'e4301fe16d9e4714285918b4c67e7fc9fba1d51b520dbf6ec71990b52fdbcc3b',
 '6e674b9a6663845e3e5216847681dd1debda80b6d2a01cfa824ac886614133eb',
 '10b91f6e387ef276e5fc5bf5075c216260164976bc0a5f4a74bfb7726d7dfcbe',
 '08ef19f51bb3697229c8b2beb25529d1a265bd3a2722341ddbcf8283b3c1bc28',
 'ccf9323d311507af06542e86a0427c0f7eba6d996c0a0d5a21765c06b47be479',
 '98cb043d2386dc6fdf98f57a4b9c01da80a32253815b156055c368cfb44a9020',
 'b7dfae4a3d9ebe22edccbde815d6b12d0b275179fb4b8c0ae45ec9ca0d3d6d44',
 '01cc4c809cd20b26db4d7c604e74a54cff05c65b1fa1bfc74a20c38553947d4d',
 '898c1bdaa5b90b87f99c1fd821d60c45bd4d01d967e4b710a4ffea9b92010554',
 'b8d9850965c15766e45f8a17f5640cdbca275c243a0af040f4c72eb1256081ec',
 '5aba1fd6aa7796df32094c5e8771aa814c9cfe20b2aa462f29387eebfc80acdb',
 '6aa7f7b8efbe1af40126cae65c99da2c4edbb029a83ed6a0395662a2807e40aa',
 'ea6030e2ca13f9e597671d12a965866456ccf17efb1bc74b72da1cb5edf461bc',
 '532d10b37cebe86fe9447f7504dafec1e5285823e402655a85498afaa24795ca',
 'ac27530780de0ab144936a96dfdf8bfad080d522d8d43b2813cc4d9de92c47b9',
 '424a3b4e5e9792cca58c54f88324739e68592ce863d9e3fb556f2c0f9251d32e',
 '73ec1929828e7623afd24f37535573e6ffde214788c9b358f07622728e438461',
 '313c67b95a34d6695b02eb31fbf027b00078cfce6fd000ee4519cb9a10d15cd5',
 '7772b6d8f8a66298bcce8c484677afe5fd6469f14cee2207a939a1da500b7335',
 'b36732b8edc6e33756a72ca77766e4233341a8de1c0c45a74912166cf42458d6',
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
 assert.equal(originalBytes.length,Buffer.byteLength(oldText),'Original is UTF-8');
 assert.equal(bytes.length,Buffer.byteLength(newText),'Proposal is UTF-8');
 assert.equal((oldText.match(/\r\n/g)||[]).length,(newText.match(/\r\n/g)||[]).length,'No EOL migration');
 assert.equal((oldText.match(/\r\n/g)||[]).length,0,'Original LF scope');
 const edits=hunks(oldText,newText);
 const fingerprints=edits.map(({removed,added})=>sha(JSON.stringify([removed,added])));
 assert.deepEqual(fingerprints,expectedHunks,'Only reviewed epoch/path/admission edits');
 const reconstructed=newText.split('\n');
 for(const edit of edits.toReversed()){
  assert.deepEqual(reconstructed.slice(edit.afterStart,edit.afterStart+edit.added.length),edit.added);
  reconstructed.splice(edit.afterStart,edit.added.length,...edit.removed);
 }
 assert.equal(sha(Buffer.from(reconstructed.join('\n'))),originalSha,'Complete inverse restores original bytes');
 assert.equal((oldText.match(/\btest\('/g)||[]).length,2);
 assert.equal((newText.match(/\btest\('/g)||[]).length,2,'Both original tests still registered');
 for(const part of [
  '[8,9928,8,1096,0]',"['missing','body','citation','source','readiness','approval']",
  'status,409,s.id','status,422,s.id','stale continuation reached DB reads',
  'oldSnapshot=json(oldSnapshotPath)','pendingForearm.length,16','middle.length,2',
 ])assert(newText.includes(part),'Preserved history/security assertion: '+part);
 for(const part of [
  'loadForearmAdmissionImport()','admitPreservedClinicalReview({revision,sourceHashes:',
  "+'&t=teaching'",'deliveredPacket.source.structure,identity',
  'parseBodyReviewResponse(deliveredPacket,entry.id)',
  "addition('completed','portal','portal-hepatic-venous-relationships',48)",
  "addition('venous','calf','right-posterior-calf-achilles-orientation',51)",
  'closed 9f import has all 51 genuine later tours',
 ])assert(newText.includes(part),'Required current/historical binding: '+part);
 return {edits:edits.length,originalLines:oldText.split('\n').length,candidateLines:newText.split('\n').length};
}

if(process.argv.includes('--print-hunks')){
 const originalText=readFileSync(original,'utf8'),candidateText=restorePriorCurrentEpoch(
  'clinical-review-forearm-vascular-xray.test.ts',readFileSync(candidate)).toString('utf8');
 process.stdout.write(JSON.stringify(hunks(originalText,candidateText).map(({removed,added})=>sha(JSON.stringify([removed,added]))),null,2)+'\n');
}else test('forearm original test and strict loader invert exactly; weakened contracts fail',()=>{
 const bytes=restorePriorCurrentEpoch('clinical-review-forearm-vascular-xray.test.ts',readFileSync(candidate));
 const text=bytes.toString(),proof=verify(bytes);
 assert(proof.edits>0);
 for(const [from,to] of [
  ['[8,9928,8,1096,0]','[7,9928,8,1096,0]'],
  ["+'&t=teaching'","+''"],
  ['status,422,s.id','status,200,s.id'],
  ['forearm-admission-import-history','elbow-admission-import-history'],
 ]){
  assert(text.includes(from),'Unique tamper source exists: '+from);
  assert.throws(()=>verify(Buffer.from(text.replace(from,to))));
 }
 assert.throws(()=>verify(Buffer.from('if(false){\n'+text+'\n}')));
});
