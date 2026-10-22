import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {join} from 'node:path';

const website='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking/website';
const atlas='F:/VisibleMedicine/atlas';
const stage='F:/VisibleMedicine/staging/20261022-inferior-thyroid-history-followup';
const path='tests/inferior-thyroid-mra-current-delivery.test.mjs';
const sourceReceipt=readFileSync('F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking/PRODUCT_SOURCE_V5.json');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const git=(...args)=>{
 const result=spawnSync('git',['-C',atlas,...args],{encoding:null,maxBuffer:32e6,windowsHide:true,
  env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
 assert.equal(result.status,0,`Git ${args.join(' ')}: ${result.stderr}`);
 return result.stdout;
};
assert.equal(sha(sourceReceipt),'49a132ab76102e0fb2845df9ab111047630ecdafc0f0a2e61e81fef70a62a03f');
const row=JSON.parse(sourceReceipt).sourceRows.find(item=>item.path===path);
assert(row);
const raw=readFileSync(join(stage,path+'.RAW'));
const code=readFileSync(join(stage,path));
assert.equal(sha(readFileSync(join(website,path))),row.sha256,'Frozen candidate V5 remains exact');
assert.equal(sha(raw),row.sha256,'Full original test is preserved');
assert.equal(sha(code),'0ff16b6d81a20d018a78eb49b416e431ef70dcfcbcd950e8e79dfdfa7de1b44d');

const difference=spawnSync('git',['diff','--no-index','--no-ext-diff','--unified=0','--',
 join(stage,path+'.RAW'),join(stage,path)],{encoding:'utf8',windowsHide:true,maxBuffer:2e6});
assert.equal(difference.status,1,'A reviewed source change exists');
const patch=difference.stdout;
const patchSha=sha(patch);
assert.equal(patchSha,'c5570eb45c828be74800ae0fe91b08152ef93c323e5a7bfc6dd84945900f9ffc','Exact complete reviewed test delta');
function inverse(post,delta){
 const lines=post.toString('utf8').split('\n');
 const diff=delta.split('\n');
 const original=[];
 let cursor=0,seen=0;
 for(let i=0;i<diff.length;i++){
  const match=/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(diff[i]);
  if(!match)continue;
  const oldStart=Number(match[1]),oldCount=Number(match[2]??1);
  const newStart=Number(match[3]),newCount=Number(match[4]??1);
  const oldIndex=oldCount===0?oldStart:oldStart-1;
  const newIndex=newCount===0?newStart:newStart-1;
  assert(newIndex>=cursor&&newIndex<=lines.length);
  original.push(...lines.slice(cursor,newIndex));cursor=newIndex;
  assert.equal(original.length,oldIndex,'Exact original hunk location');
  let removed=0,added=0;
  while(i+1<diff.length&&!diff[i+1].startsWith('@@ ')){
   const part=diff[++i];
   if(!part.startsWith('+')&&!part.startsWith('-')){i--;break;}
   if(part.startsWith('+')){assert.equal(lines[cursor++],part.slice(1));added++;}
   else{original.push(part.slice(1));removed++;}
  }
  assert.equal(removed,oldCount);assert.equal(added,newCount);
  seen++;
 }
 assert(seen>0);
 original.push(...lines.slice(cursor));
 return Buffer.from(original.join('\n'));
}
assert.deepEqual(inverse(code,patch),raw,'Full CODE→V5 inverse retains all original assertions and registrations');
assert.throws(()=>assert.equal(sha(Buffer.concat([code,Buffer.from('altered')])),sha(code)));

const historical='87ed7e343260c7df48a40d53503f25bbfd34cfa5';
const current='6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1';
const prior='6036a7a59dcc1fd75eee4a23af34ca2a568d86b6';
assert.equal(git('rev-parse','HEAD').toString().trim(),current);
assert.equal(git('status','--porcelain').toString().trim(),'');
assert.equal(git('merge-base',prior,historical).toString().trim(),prior);
assert.equal(git('merge-base',historical,current).toString().trim(),historical);
assert.equal(git('rev-parse',`${historical}^{tree}`).toString().trim(),'bfcfa898ace1d25083f21b681274c5bc816564d7');
assert.equal(git('rev-parse',`${current}^{tree}`).toString().trim(),'e9165d7122361f809a267af1414b337b69097fe2');
const read=path=>readFileSync(join(website,path));
const review=JSON.parse(read('atlas-review/manifest.json'));
const pin=JSON.parse(read('tests/fixtures/current-atlas-delivery.json'));
assert.equal(pin.source,current);assert.equal(review.revision,current);
assert.deepEqual(pin.runtimeSources,{
 'head-neck':current,shoulder:'190a63238eadcf906abe89dcbb6a67c88afe70b9',
 'lower-limb':'190a63238eadcf906abe89dcbb6a67c88afe70b9',
 'female-pelvis':'190a63238eadcf906abe89dcbb6a67c88afe70b9',
});
const imported=[];
for(const sourcePath of ['content/arterial-evidence-limits.ts',
 'content/arterial-evidence-limits-pins.json','lib/arterial-evidence-limits.ts','app/body-content.ts']){
 const bytes=git('show',`${current}:${sourcePath}`);
 const row=review.files.find(item=>item.path===sourcePath);
 assert(row);
 assert.deepEqual(read('atlas-review/'+sourcePath),bytes);
 assert.equal(row.sourceSha256,sha(bytes));assert.equal(row.importedSha256,sha(bytes));
 if(sourcePath!=='app/body-content.ts')assert.deepEqual(bytes,git('show',`${historical}:${sourcePath}`));
 imported.push({path:sourcePath,sha256:sha(bytes)});
}
let dispatcher=git('show',`${current}:app/body-content.ts`).toString();
for(const added of [
 "import {dentalMriLesson} from '../lib/dental-mri';\n",
 "import { colicArteryUltrasoundLesson } from '../lib/colic-artery-ultrasound';\n",
 '  const dentalMri=dentalMriLesson(s,tab);\n  if(dentalMri)return dentalMri;\n',
 '  const colicUltrasound = colicArteryUltrasoundLesson(s, tab);\n  if (colicUltrasound) return colicUltrasound;\n',
]){
 assert.equal(dispatcher.split(added).length,2);
 dispatcher=dispatcher.replace(added,'');
}
assert.deepEqual(Buffer.from(dispatcher),git('show',`${historical}:app/body-content.ts`));
const historicalTopic=git('show',`${historical}:content/arterial-evidence-limits.ts`);
assert.equal(sha(historicalTopic),'b746ada70e8f96906cb30289cd2649530f380f942f69b34fbf5e370282c21c24');
const pins=JSON.parse(git('show',`${historical}:content/arterial-evidence-limits-pins.json`));
assert.deepEqual(pins.entries.filter(item=>item.family==='inferiorThyroidMri').map(item=>[item.identity.laterality,item.identity.fmaId,item.tab]),
 [['left','FMA10680','mri'],['right','FMA10697','mri']]);
console.log(JSON.stringify({kind:'source-only inferior thyroid history proof',sourceReceiptSha256:sha(sourceReceipt),
 baselineSha256:sha(raw),codeSha256:sha(code),patchSha256:patchSha,reviewSourceFiles:imported,
 completeSourceInverse:true,historicalTopicSha256:sha(historicalTopic),historicalSelected:2,
 nativeComparisonsExecuted:false},null,2));
