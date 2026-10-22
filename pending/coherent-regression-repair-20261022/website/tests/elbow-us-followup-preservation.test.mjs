// Pure source inverse. The two original registered tests must also run natively.
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {restorePriorCurrentEpoch} from './current-epoch-source-adapter.mjs';

const original=new URL('./fixtures/clinical-review-elbow-us-followup.original.ts.raw',import.meta.url);
const candidate=new URL('./clinical-review-elbow-us-followup.test.ts',import.meta.url);
const loader=new URL('./elbow-admission-import-history.mjs',import.meta.url);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const originalSha='aad244f03fc81cec834dbed52eed7681f8a680f6d6d52cc82a9c17cde84fab0c';
const candidateSha='9b0b950ead7cc57f0dfe069d1a359a65b96e15a51aa004dca536f52e0ed3b443';
const loaderSha='f994bb22c3e12330d82fe9c25d33e1a48a2bee8dd9ebf47a3b5d222ca004232d';
const laterXraySha='cdd84bd2693941783da9f058cc4860ac7a32361913e687dab1699f66fa9a0f1f';
const playbackSha='52ebcddab39cc165bf4c3c94dee0659abfea6814c92e55f85bf86f25eb6c57d8';
function one(text,before,after){
 assert.equal(text.split(before).length,2,`One exact later-X-ray seam: ${before.slice(0,70)}`);
 return text.replace(before,after);
}
function section(text,start,end,replacement=''){
 assert.equal(text.split(start).length,2,`One exact block start: ${start.slice(0,60)}`);
 const from=text.indexOf(start),to=text.indexOf(end,from+start.length);
 assert(to>from,`Exact block end: ${end.slice(0,60)}`);
 return text.slice(0,from)+replacement+text.slice(to);
}
function inversePlayback(bytes){
 assert.equal(sha(bytes),playbackSha,'Exact playback-packet candidate bytes');
 let text=bytes.toString('utf8');
 assert.deepEqual(Buffer.from(text),bytes,'Lossless LF playback postimage');
 text=one(text,"  assert(playbackTourCount>0,'the selected packets contain genuine later playback evidence');\n",'');
 text=one(text,'    for(const tour of completedInverse.guidedTours)delete tour.continuousPlayback;\n','');
 text=section(text,"    const calfPacket=wire(await epochs.get('calf').bodyReviewMaterial(s.id));\n",
  '    const pin:Pin=', '');
 text=one(text,'  let laterForearmXray=0,laterArmXray=0,playbackTourCount=0;\n',
  '  let laterForearmXray=0,laterArmXray=0;\n');
 text=section(text,"  const playbackEpoch='c978ecee3bdddfeaf2995ecbf62d5178e719c4fb';\n",
  "  assert.equal(git(['rev-parse',`${revision}:lib/regional-tours.ts`])",'');
 const restored=Buffer.from(text);
 assert.equal(sha(restored),laterXraySha,'Exact prior reviewed later-X-ray postimage recovered');
 return restored;
}
function inverseLaterXray(bytes){
 assert.equal(sha(bytes),laterXraySha,'Exact later-X-ray candidate bytes');
 let text=bytes.toString('utf8');
 assert.deepEqual(Buffer.from(text),bytes,'Lossless LF postimage');
 text=one(text,"  assert.deepEqual([laterForearmXray,laterArmXray],[4,2],\n    'exact four forearm and two arm collateral later X-ray cells');\n",'');
 text=section(text,"      for(const [baseline,parser] of [[packet,completed],[deliveredPacket,api]] as const){\n",
  "    }\n    const oldContext",[
   "      const bad=wire(packet),topic=bad.topics.find((row:any)=>row.tab==='ultrasound');",
   "      if(change==='missing')bad.topics.splice(bad.topics.indexOf(topic),1);",
   "      if(change==='body')topic.body+=' forged';",
   "      if(change==='citation')topic.citations[0]='https://forged.invalid';",
   "      if(change==='source')bad.source.structure.sources[0].sha256='0'.repeat(64);",
   "      if(change==='readiness')topic.readiness='approved';",
   "      if(change==='approval')bad.approval=true;",
   "      assert.equal(await api.parseBodyReviewResponse(bad,s.id),null,`${s.id}: ${change}`);",
  ].join('\n')+'\n');
 text=section(text,'    assert.deepEqual(await completed.parseBodyReviewResponse(packet,s.id),packet,\n',
  '    assert.equal(await api.parseBodyReviewResponse(previous,s.id)',
  '    assert.deepEqual(await api.parseBodyReviewResponse(packet,s.id),packet,s.id);\n');
 text=section(text,'    const deliveredPacket=wire(await api.bodyReviewMaterial(s.id));\n',
  '    assert.equal(packet.approval,false);',
  '    assert.deepEqual(wire(await api.bodyReviewMaterial(s.id)),packet,`${s.id}: completed US packet persists in historical integration`);\n');
 text=one(text,'        assert.deepEqual(currentImport.bodyLesson(s,tab),lesson,`${s.id}: unchanged checked-current US`);\n','');
 text=one(text,'  let laterForearmXray=0,laterArmXray=0;\n','');
 text=one(text,"  const currentImport=await imported();\n  assert.deepEqual(currentImport.regionalTours,api.regionalTours,'current delivery retains closed 9f tours');\n",
  "  assert.deepEqual((await imported()).regionalTours,api.regionalTours,'current delivery retains closed 9f tours');\n");
 text=section(text,'  // The completed US packet predates these two exact-source X-ray introductions.\n',
  "  assert.equal(git(['rev-parse',`${completedEpoch}^{tree}`])",'');
 const restored=Buffer.from(text);
 assert.equal(sha(restored),candidateSha,'Exact prior reviewed elbow postimage recovered');
 return restored;
}
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
 'e6686798465668778f990b6f7a264ab1f6b618639e1796fdc0010bab1097c63c',
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
  "addition('completed','portal','portal-hepatic-venous-relationships',48)",
  "addition('venous','calf','right-posterior-calf-achilles-orientation',51)",
  'closed 9f import has all 51 genuine later tours',
 ])assert(newText.includes(part),'Required current/historical binding: '+part);
 return {edits:edits.length,originalLines:oldText.split('\n').length,candidateLines:newText.split('\n').length};
}

if(process.argv.includes('--print-hunks')){
 const originalText=readFileSync(original,'utf8'),candidateText=restorePriorCurrentEpoch(
  'clinical-review-elbow-us-followup.test.ts',readFileSync(candidate)).toString('utf8');
 process.stdout.write(JSON.stringify(hunks(originalText,candidateText).map(({removed,added})=>sha(JSON.stringify([removed,added]))),null,2)+'\n');
}else test('elbow original test and strict loader invert exactly; weakened contracts fail',()=>{
 const bytes=restorePriorCurrentEpoch('clinical-review-elbow-us-followup.test.ts',readFileSync(candidate));
 const text=bytes.toString(),inverse=changed=>inverseLaterXray(inversePlayback(changed));
 const proof=verify(inverse(bytes));
 assert(proof.edits>0);
 for(const [from,to] of [
  ['[6,9930,6,1098,0]','[5,9930,6,1098,0]'],
  ["+'&t=teaching'","+''"],
  ['status,422,s.id','status,200,s.id'],
  ['elbow-admission-import-history','colic-admission-import-history'],
 ]){
  assert(text.includes(from),'Unique tamper source exists: '+from);
  assert.throws(()=>inverse(Buffer.from(text.replace(from,to))));
 }
 for(const [from,to] of [
  ['laterForearmXray,laterArmXray],[4,2]','laterForearmXray,laterArmXray],[3,2]'],
  ['completedInverse,packet','completedInverse,deliveredPacket'],
  ['completed.parseBodyReviewResponse(packet','api.parseBodyReviewResponse(packet'],
 ])assert.throws(()=>inverse(Buffer.from(text.replace(from,to))),`Reject later X-ray tamper: ${from}`);
 for(const [from,to] of [
  ['playbackTourCount>0','playbackTourCount>=0'],
  ['completedInverse.guidedTours)delete tour.continuousPlayback','completedInverse.guidedTours)tour.continuousPlayback=undefined'],
  ['captionWordsPerMinute:180','captionWordsPerMinute:181'],
 ])assert.throws(()=>inverse(Buffer.from(text.replace(from,to))),`Reject playback tamper: ${from}`);
 assert.throws(()=>inverse(Buffer.from('if(false){\n'+text+'\n}')));
});
if(!process.argv.includes('--print-hunks'))test('current epoch adapter refuses missing, duplicate and substituted source or helper edits',()=>{
 const helper=readFileSync(new URL('./current-epoch-source-adapter.mjs',import.meta.url));
 assert.equal(sha(helper),'2634cef4dc4e8c916cbe82d6ccb1d7d8068db259fb6b9f28dd8d3be11f8e6f65');
 for(const [name,url] of [
  ['clinical-review-elbow-us-followup.test.ts',candidate],
  ['clinical-review-forearm-vascular-xray.test.ts',new URL('./clinical-review-forearm-vascular-xray.test.ts',import.meta.url)],
 ]){
  const current=readFileSync(url,'utf8');
  const seam="assert.equal(checkedCurrent.source,CURRENT_ATLAS_REVISION,'Active Review source is authenticated current Atlas');";
  assert.equal(current.split(seam).length,2,'One exact current-source seam: '+name);
  for(const mutant of [current.replace(seam,''),current+seam,current.replace(seam,seam+' /* forged */')])
   assert.throws(()=>restorePriorCurrentEpoch(name,Buffer.from(mutant)),
    'Missing, duplicate or substituted current source refused: '+name);
 }
 assert.throws(()=>restorePriorCurrentEpoch('unlisted-current-source',Buffer.alloc(0)));
});
