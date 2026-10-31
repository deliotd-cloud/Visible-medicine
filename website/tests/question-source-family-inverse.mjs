// Exact-byte current→frozen adapter for three question/imaging clinical tests.
import assert from 'node:assert/strict';
import {restoreSpinalOriginalRuntime} from './spinal-current-runtime-inverse-1031.mjs';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const cases={
 'clinical-review-spinal-disc-ultrasound.test.ts':{
  prior:'0c28be9eefcd1378b3e498e3aa1de9f2be2f9c3be1e3652d487b3a4f587522bf',
  current:'223b09e5473e293925b1e990b5a572b2d5fa084178939201c43e578fece1fd59',
  hunks:['aaeae2c43d53049fc14c06ea21c04a11956a7dfd26fd2c3596b6e74869b1e3b9','0f1391f494181b7ab526de30d52125e6ee27643af3d5d5d0ac0a59ff2f369f33','6fbf6e7117462ad5689a03e98c6cdba3d1f20b51620d716f017a2649648fba07','1c8b63fc762461a49dd2cc686d7142ec732650329bd325ad383287e713bb9338','2ebd3fd32d67bfb0f7ad93d2eeeafe623e23adede826cc08f3b8f2061a828c5c'],
 },
 'clinical-review-thoracic-quiz.test.ts':{
  prior:'3cfd396b7380760b75443b4ba76e1e0aa9bd85433c700bcd7f22da230543936a',
  current:'891cc344b49840b6f259989b8fdff6c652c37a6c76e4f12027d08b4ac2b0afd0',
  hunks:['683d42e9649bacc579e11da4ec1c600329f51cbe4a0606cabb3120cda474576d','5280f157c6333110d280da568050e5d62859b7d7653ae5807b26a3c448e37e72','44e08f0d62f702f09a9fc91a4e27dfd4155466683c420f013bf3fc31b43cd417','9f7a1862fbf006bf58108a17acc1aff39c13d2fe23ec6075e49ec3d3b9b6115f'],
 },
 'clinical-review-suprahyoid-quiz.test.ts':{
  prior:'302c5bf4d5bdb567932497cd2cdf7d71d8e286a4ff5274908fc04905f6f31b43',
  current:'a3b05ac7918d48cad0231a4a01dd36a743492b0bc3bfc9713e896e15f905d0c1',
  hunks:['aaeae2c43d53049fc14c06ea21c04a11956a7dfd26fd2c3596b6e74869b1e3b9','567656740a25d95f000b97bf0fad2c474a6e454979c2f4275b1cf39073cd7201','90cfa75a8d2fd5301fd92a8ba2a59087446dbfd8ce01f73318c706a73dcba96e','dc7e988ddb3982c8154d372e5e2a1452882f385124c052ec52472b1ba32f00ba','0fc5fbe279ac675589fcb7991ec68d274e824f50859f2875ea3db18d11b50856'],
 },
};
export const questionFamilyNames=Object.freeze(Object.keys(cases));
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
export function restoreQuestionFamilyPrior(name,currentBytes,{readPrior=readFileSync}={}){
 const item=cases[name];assert(item,'Only three declared question-family transitions admitted');
 if(name==='clinical-review-spinal-disc-ultrasound.test.ts')currentBytes=restoreSpinalOriginalRuntime(currentBytes);
 assert.equal(sha(currentBytes),item.current,'Exact current source bytes: '+name);
 const prior=readPrior(new URL('./fixtures/question-family-prior/'+name+'.raw',import.meta.url));
 assert.equal(sha(prior),item.prior,'Exact complete frozen prior fixture: '+name);
 const before=prior.toString('utf8'),after=Buffer.from(currentBytes).toString('utf8');
 assert.deepEqual(Buffer.from(after),currentBytes,'Lossless current UTF-8: '+name);
 assert.equal((before.match(/\r/g)||[]).length,0,'No CR in frozen source: '+name);
 assert.equal((after.match(/\r/g)||[]).length,0,'No CR in current source: '+name);
 const edits=hunks(before,after);
 assert.deepEqual(edits.map(e=>sha(JSON.stringify([e.removed,e.added]))),item.hunks,'Only exact reviewed source-role hunks: '+name);
 for(const edit of edits){
  assert(edit.added.length>0,'No deletion-only hunk: '+name);
  assert.equal(after.split(edit.added.join('\n')).length,2,'Unique current hunk: '+name);
 }
 const restored=after.split('\n');
 for(const edit of edits.toReversed()){
  assert.deepEqual(restored.slice(edit.afterStart,edit.afterStart+edit.added.length),edit.added);
  restored.splice(edit.afterStart,edit.added.length,...edit.removed);
 }
 const bytes=Buffer.from(restored.join('\n'));
 assert.deepEqual(bytes,prior,'Complete current→frozen source inverse: '+name);
 return bytes;
}
