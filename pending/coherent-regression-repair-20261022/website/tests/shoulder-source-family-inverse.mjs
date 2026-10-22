// Pure exact-byte current→frozen adapter for the five shoulder-family test changes.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const sha=b=>createHash('sha256').update(b).digest('hex');
const cases={
 'clinical-review-shoulder-ct.test.ts':{
  current:'f36524c1d89314e3e3d8cf1274106f6dde644da695b8ece84e9ec3cc0fc40a99',
  prior:'1f07449dc566d996bd436cbe0b96abd5fc5aa48e5ddc1774b2ba2c30fec69d51',
  hunks:['7cfd35088f99f1944667e824e075695a5113282396fb225585d7466b91f46208','688e84d892b50f8ec7fcdd2aa4b5961070ba5abf70d87f927013b95eb9a0c46e','9a04b26bb571a0dab83eb31f2787123b5e04ca31c39afe4a9a8d3ecf554d1018'],
 },
 'clinical-review-shoulder-girdle-artery-quiz.test.ts':{
  current:'d1414974a356a1015d93b55fd8853f3ef780c19ed5c97667c5968344e06e88e5',
  prior:'efa18987a9fa80a339bf9e8ce2d4c38dae2e8ea99cc5f03f978b4ca544b5768a',
  hunks:['aaeae2c43d53049fc14c06ea21c04a11956a7dfd26fd2c3596b6e74869b1e3b9','dfec2706ce2a8be8d38f73978b1726b4d4b14f5ce50cf0668d6cbdfb84ee1143','2541c61c64b271698c2d2ec56615b4c9da97148c10999ff89a67abf0ce767808'],
 },
 'clinical-review-shoulder-muscle-xray.test.ts':{
  current:'5ea35b2607c3a7db43f598317f549bddee1b006d0c04464c6a2012c09d5f699e',
  prior:'96c629bb05433675fc44cb92f60604fb6bb83f76b40829b4750782e4d7db61b4',
  hunks:['b46ba614c4f98ce072bbcb08ecd87489c8ca3566a22346ea2d00d58780fea086','aae9ec9076af9b7425f987f55198d403966732059da5946b077c4ec2910a9983','01d1806ae3a418d7a7fa8789cd28ef69c76bc1972eba9086fd126f58650b27cd','e45b292d6df34195d65253f3ff15ab8ab8c5a4b3b2ba5deb2963790361b6b303','adde2a273c6dd2b96873d1453b2e8be568b9e8730655a29db84a1a3514457a39','f059e873efb01be9251bf35ae3095953b946914b42e9477f307a29e37701fc65'],
 },
 'clinical-review-shoulder-vessel-xray.test.ts':{
  current:'757a909f6a1149897db57543cd2ec8622752ba88330527c59e9180924d019be0',
  prior:'44516bd1dfcbc003c209de635cbbcb6a10c435299fb42e4ea7cdebd94cc2d6b5',
  hunks:['bdcb676a196cd96d9b7ce1d181bbd6f8e68a8eb97f3c8abdbd18c6015d46c7a7','1af6f874bbed43fe22027e5122eb8910e7ce3e5576bfaa45f73b33fa8d57a331','56a8b1cec6b1185135660757acf2ea7b8901e3a0cd51dece8d9e5afb1a4623e3','7d2b5dadbf8af4c19c8db88a71327a993ace2523bd06c793834fde7191be2a39','31a9f353c4311625b3c641a82eabe652e2ca4d7cf449159cd5c619dc60f44197'],
 },
 'clinical-review-thoracoacromial-ultrasound.test.ts':{
  current:'b6455564bb8d413ac0ab8d4b782ee1c0807aec45ce59a4064a5fa2821ee6546e',
  prior:'95e0cf5da289ced211518a5b6056dd3c221d502b2770253ccee9c63c3c1425c1',
  hunks:['95982f203aad2ef4f0d6399d54bb65d51682cc36ee995f4b443ee3fad5373a5f','6e4db3ac286b3dc239da20d1c407cbc6025726b966e2c218f9284b9aad78f430','0284410de7b439545cad0efab41143adac7d76bbb8bc1082609bc9cd4894d1b3','6fbf6e7117462ad5689a03e98c6cdba3d1f20b51620d716f017a2649648fba07','2ebd3fd32d67bfb0f7ad93d2eeeafe623e23adede826cc08f3b8f2061a828c5c'],
 },
};
export const shoulderFamilyNames=Object.freeze(Object.keys(cases));
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
export function restorePriorShoulderFamily(name,currentBytes,{readPrior=readFileSync}={}){
 const item=cases[name];assert(item,'Only five declared shoulder-family test transitions admitted');
 assert.equal(sha(currentBytes),item.current,'Exact current source bytes: '+name);
 const prior=readPrior(new URL('./fixtures/shoulder-family-prior/'+name+'.raw',import.meta.url));
 assert.equal(sha(prior),item.prior,'Exact complete frozen prior fixture: '+name);
 const before=prior.toString('utf8'),after=Buffer.from(currentBytes).toString('utf8');
 assert.deepEqual(Buffer.from(after),currentBytes,'Lossless current UTF-8: '+name);
 assert.equal((before.match(/\r/g)||[]).length,(before.match(/\r\n/g)||[]).length,'No bare CR in prior: '+name);
 assert.equal((after.match(/\r/g)||[]).length,(after.match(/\r\n/g)||[]).length,'No bare CR in current: '+name);
 assert.equal(before.replaceAll('\r\n','').includes('\n'),after.replaceAll('\r\n','').includes('\n'),
  'Original EOL style preserved: '+name);
 const edits=hunks(before,after);
 assert.deepEqual(edits.map(e=>sha(JSON.stringify([e.removed,e.added]))),item.hunks,'Only exact reviewed role hunks: '+name);
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
