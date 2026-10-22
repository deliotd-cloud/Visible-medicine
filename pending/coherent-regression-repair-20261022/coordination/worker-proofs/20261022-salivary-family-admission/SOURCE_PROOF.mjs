// Pure source/Git proof only. No website tests, build tools, or product imports.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {restoreSalivaryCurrentPrior,restoreSalivaryGuardPrior} from './CODE/tests/salivary-current-family-inverse.mjs';
import {restoreSalivaryPrior} from './CODE/tests/salivary-cache-epoch-adapter.mjs';
const root=new URL('.',import.meta.url).pathname.replace(/^\/(?=[A-Z]:\/)/,'');
const sha=b=>createHash('sha256').update(b).digest('hex');
const cases={
 'clinical-review-salivary-stylohyoid-quiz.test.ts':{
  old:'a6fea25a4dd1bde5c87d02cf993459a44c255a735e73ef9e0e7b20331309696a',
  now:'6d39291eb25118e1fb5c915acd940caa240139f0d4e23bd04705962158369f60',
  hunks:['34b5a5cab7bf53d750cedadb60f5f68ddfbff9c7302fe2e2aeba47f51fdf8c04','440a518cc42dce7cbdf535635efcb0ac3ac581c9c7a95476b22e144a5cfc2028','f470759b6034cee3acb6826eaeccefa51b74758d9938918743beb44de9255fac','e45b292d6df34195d65253f3ff15ab8ab8c5a4b3b2ba5deb2963790361b6b303','e9811c364db9ac8fc7a53ee178c80c29c322567a1c631da32bdbf07c07d10d2e','09c19c9ed026abca0a36e8c8e14cdfe967e91c026f7eb1f1bcd154cbee1a3a6c'],
 },
 'salivary-cache-epoch-preservation.test.mjs':{
  old:'f17f2181b380bae251927bda8feeca6e214a251444e8c0e8fb50bf29121cd1e4',
  now:'428f7919317ac6f9ad2ee9ada5148607fa5b662803628c2e4832e3d7d287a2f0',
  hunks:['1d9fb23cc1adb338b7f476050e4f481777cc2b5022652d63cf6a1de82cb09ffd','96822efa774742bde100df70437d7baf1b8a66b0326ee7e3f00376648514643f'],
 },
 'atlas190-current-delivery.test.mjs':{
  old:'ee51701b213d8a7b2720c5243146b286683cb791d48d5775c23f02501f842198',
  now:'b198b7505c9ac9bc826d2a952ac4fcad8760dbdc250d0a488a8c09a0526b9ad3',
  hunks:['1d9fb23cc1adb338b7f476050e4f481777cc2b5022652d63cf6a1de82cb09ffd','a6e42f7fe4cbb0046b045dfb8aea4f1a6e220121b82f87b754db60ba854deb02'],
 },
 'clinical-review-git-root-preservation.test.mjs':{
  old:'59bf61933c8a8944bb7da9bd10cdb517c93ddd65af74ef34b0934c66389397a2',
  now:'5f17dd98df38536edc9456addccca15b5b418af35325d6a284c503dc829992d9',
  hunks:['1d9fb23cc1adb338b7f476050e4f481777cc2b5022652d63cf6a1de82cb09ffd','619e8e71578400631d9b1a2348dd0f475e747c150e4615261a1678045b301f3d'],
 },
 'salivary-cache-guard-adaptation.test.mjs':{
  old:'15daeb7333adf104dfa6d7ab211d51d716872ce0a3b7da4a9797be62550e954e',
  now:'646bb8dc4a841aa97aedd5cf84cc3bdef1e99f14bfc53d98a9e0c9525155f69d',
  hunks:['1d9fb23cc1adb338b7f476050e4f481777cc2b5022652d63cf6a1de82cb09ffd','3925cdfab5d7a328cee1f94570db545cd9285d78fe7c95ec7ba1089f79253010','af7e4361e756596dc489e14455eb7694362968a1ba91505963e1172a37d34847','39ae268c27a3112ff7249f4de3215fd0e4806286a63cf8456d2359a1aa506ce1'],
 },
 'current-head-index-whole-role-transition-20261021.test.mjs':{
  old:'f1d535bf3208894030b528203d7cb75f1c6a8091e07349fccc40dc9737ab24bb',
  now:'866f45ea141b122ecb801edd29ffbd62cbd9e0af923f1a648f26d424914bd133',
  hunks:['9598075daac09732b92f5d089fc451944128143fed1a1c30ef9c956b92fff40e','ab97be7d67a2537dadfc1916cc266a61dc1b28f0e58240f5f0a60e2650cf9a6c'],
 },
};
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
function restoreWitness(name,code,raw){
 const item=cases[name];assert(item,'Only declared six transitions');
 assert.equal(sha(raw),item.old,name+' full original');
 assert.equal(sha(code),item.now,name+' full proposal');
 const before=raw.toString('utf8'),after=code.toString('utf8');
 assert.deepEqual(Buffer.from(before),raw,name+' lossless frozen UTF-8');
 assert.deepEqual(Buffer.from(after),code,name+' lossless proposal UTF-8');
 assert.equal((before.match(/\r/g)||[]).length,(before.match(/\r\n/g)||[]).length,name+' old CRLF integrity');
 assert.equal((after.match(/\r/g)||[]).length,(after.match(/\r\n/g)||[]).length,name+' new CRLF integrity');
 const edits=hunks(before,after);
 assert.deepEqual(edits.map(e=>sha(JSON.stringify([e.removed,e.added]))),item.hunks,name+' only reviewed hunks');
 const lines=after.split('\n');
 for(const edit of edits){
  assert(edit.added.length>0,name+' no deletion-only edit');
  assert.equal(lines.filter((_,i)=>lines.slice(i,i+edit.added.length).join('\n')===edit.added.join('\n')).length,1,
   name+' unique full-line edit');
 }
 const restored=[...lines];
 for(const edit of edits.toReversed()){
  assert.deepEqual(restored.slice(edit.afterStart,edit.afterStart+edit.added.length),edit.added);
  restored.splice(edit.afterStart,edit.added.length,...edit.removed);
 }
 const out=Buffer.from(restored.join('\n'));
 assert.deepEqual(out,raw,name+' complete byte inverse');
 return out;
}
for(const name of Object.keys(cases)){
 const raw=readFileSync(join(root,'RAW/tests',name));
 const code=readFileSync(join(root,'CODE/tests',name));
 assert.deepEqual(restoreWitness(name,code,raw),raw);
 for(const mutant of [code.subarray(1),Buffer.concat([code,code]),
  Buffer.concat([code.subarray(0,1),Buffer.from([code[1]^1]),code.subarray(2)])])
  assert.throws(()=>restoreWitness(name,mutant,raw),name+' missing/duplicate/substitution source refusal');
}
const clinical=readFileSync(join(root,'CODE/tests/clinical-review-salivary-stylohyoid-quiz.test.ts'));
const guard=readFileSync(join(root,'CODE/tests/salivary-cache-guard-adaptation.test.mjs'));
const priorClinical=readFileSync(join(root,'RAW/tests/clinical-review-salivary-stylohyoid-quiz.test.ts'));
const priorGuard=readFileSync(join(root,'RAW/tests/salivary-cache-guard-adaptation.test.mjs'));
assert.deepEqual(restoreSalivaryCurrentPrior(clinical),priorClinical,'actual new salivary adapter');
assert.deepEqual(restoreSalivaryGuardPrior(guard),priorGuard,'actual new guard adapter');
assert.deepEqual(restoreSalivaryPrior(restoreSalivaryCurrentPrior(clinical)),
 readFileSync(join(root,'CODE/tests/fixtures/salivary-cache-epoch-20261021/original.ts.raw')),
 'actual new→old cache epoch adapter composition');
for(const [actual,bytes,prior] of [
 [restoreSalivaryCurrentPrior,clinical,priorClinical],[restoreSalivaryGuardPrior,guard,priorGuard]]){
 for(const mutant of [bytes.subarray(1),Buffer.concat([bytes,bytes]),
  Buffer.concat([bytes.subarray(0,1),Buffer.from([bytes[1]^1]),bytes.subarray(2)])])
  assert.throws(()=>actual(mutant),'actual helper source mutant refusal');
 const bad=Buffer.concat([prior.subarray(0,1),Buffer.from([prior[1]^1]),prior.subarray(2)]);
 assert.throws(()=>actual(bytes,{readPrior:()=>bad}),'actual helper fixture corruption refusal');
}
for(const name of ['salivary-cache-epoch-adapter.mjs','admission485-final-role-transition-20261021.test.mjs'])
 assert.deepEqual(readFileSync(join(root,'RAW/tests',name)),readFileSync(join(root,'CODE/tests',name)),name+' historical unchanged');
assert.equal(sha(readFileSync(join(root,'CODE/tests/salivary-cache-epoch-adapter.mjs'))),
 '8a84ac8dfe143a07113ca237e31ab1443ffe8a80a79c6a9559adef4362aedab0');
const website='F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate/website';
const atlas='F:/VisibleMedicine/atlas';
const pin=JSON.parse(readFileSync(join(website,'tests/fixtures/current-atlas-delivery.json')));
const review=JSON.parse(readFileSync(join(website,'atlas-review/manifest.json')));
const head=JSON.parse(readFileSync(join(website,'public/atlas-runtime/head-neck/manifest.json')));
const shoulder=JSON.parse(readFileSync(join(website,'public/atlas-runtime/shoulder/manifest.json')));
const current='6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1';
const family='190a63238eadcf906abe89dcbb6a67c88afe70b9';
const git=(...args)=>execFileSync('git',['-C',atlas,...args],
 {windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'},maxBuffer:32e6});
assert.equal(git('rev-parse','HEAD').toString().trim(),current);
assert.equal(pin.source,current);assert.equal(review.revision,current);
assert.equal(pin.runtimeSources['head-neck'],current);assert.equal(head.sourceCommit,current);
assert.equal(pin.runtimeSources.shoulder,family);assert.equal(shoulder.sourceCommit,family);
const same=['content/salivary-stylohyoid-quiz-pins.json','content/salivary-stylohyoid-quiz.ts',
 'lib/salivary-stylohyoid-quiz.ts','content/regional-teaching/head-neck.json','LICENSES/THIRD_PARTY_NOTICES.md'];
for(const path of same)assert.deepEqual(git('show',current+':'+path),git('show',family+':'+path),path+' family/current exact bytes');
assert.equal(sha(git('show',current+':app/body-content.ts')),
 '26320b064b5648f4f5b6ca8c123806a02dedefb761b894935707559d530882fc');
assert.equal(sha(git('show',family+':app/body-content.ts')),
 '3deda6b748ed897afcd980ff24256aa20b165f8c1615fdc1e2f887211d69c1d2');
console.log('PASS: six exact whole-source inverses/mutants; direct new→old→historical adapter calls and fixture mutants; old adapter/admission485 unchanged; exact Git roles.');
