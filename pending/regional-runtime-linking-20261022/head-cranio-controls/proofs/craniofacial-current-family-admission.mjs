import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';

const stage='F:/VisibleMedicine/staging/20261022-craniofacial-current-family-admission';
const website='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking/website';
const relative='tests/craniofacial-ct-current-delivery.test.mjs';
const sha=value=>createHash('sha256').update(value).digest('hex');
const read=path=>readFileSync(path,'utf8');
const raw=read(join(stage,'RAW',relative));
const code=read(join(stage,'CODE',relative));
assert.equal(sha(raw),'b08d39c2e6a54cf1ea04f5cdf0b5c5a92a5b6adb2e68182796f9672a686ce76a');
assert.equal(sha(code),'5d3b6ce69f3db7e91eacca50c78e76d91dc6f2648f5f8232ca097358dd1c5e92');
assert.equal(read(join(website,relative)),raw,'RAW must match the untouched candidate source');

function section(text,start,end){
 const at=text.indexOf(start),stop=text.indexOf(end,at+start.length);
 assert(at>=0&&stop>at,`Missing source seam ${start}`);
 assert.equal(text.indexOf(start,at+1),-1,`Duplicate source seam ${start}`);
 return text.slice(at,stop);
}
function once(text,from,to){
 assert.equal(text.split(from).length,2,`Missing or repeated exact seam ${from.slice(0,60)}`);
 return text.replace(from,to);
}
const seams=[
 ['const runtimeSource=','const old=','const source=','const old=','4c187d36fb0484d918f9799de43083221568ad83f7c2d3795188225ad1168c42'],
 [' const refusalStart=',' const portalOriginal=',' const refusalStart=',' const portalOriginal=','5d9ddef736b86ab20e6b2abb5a0a41166ec091d843b683d839565fd70bf7588a'],
 [' const delivery=validateCurrentAtlasDelivery();',' for(const path of',' const delivery=validateCurrentAtlasDelivery();',' for(const path of','ba842f6499fb0f3d6632cb63526ace3aade9cb0576272fdcd5da817b7649cd29'],
];
function inverse(text){
 for(const [newStart,newEnd,oldStart,oldEnd,digest] of seams){
  const added=section(text,newStart,newEnd),original=section(raw,oldStart,oldEnd);
  assert.equal(sha(added),digest,`Changed proposed seam ${newStart}`);
  text=once(text,added,original);
 }
 assert.equal(text,raw,'All untouched original bytes and complete cases survive');
 return text;
}
inverse(code);
assert.throws(()=>inverse(once(code,"test('former delivery58 stays authentic","test('former delivery57 stays authentic")));
assert.throws(()=>inverse(once(code,"runtimeSource='190a63238eadcf906abe89dcbb6a67c88afe70b9'","runtimeSource='0000000000000000000000000000000000000000'")));

const titles=text=>[...text.matchAll(/^test\('([^']+)'/gm)].map(match=>match[1]);
assert.deepEqual(titles(code),titles(raw));
assert.equal(titles(code).length,6);

const historical=read(join(website,'tests/fixtures/craniofacial-ct-current-atlas-3dc.mjs.raw'));
assert.equal(sha(historical),'70397d1a602d1de4a1cb76da2687cf138f81ace50b9322a60c3ce327cd193e5d');
const current=read(join(website,'tests/current-atlas-delivery.test.mjs'));
const refusalStart='for(const [label,edit]of [';
const refusalEnd='previous8d';
const originalBlock=section(historical,refusalStart,refusalEnd);
let currentBlock=section(current,refusalStart,refusalEnd);
const addedRows=[
 " ['missing runtime source',p=>{delete p.runtimeSources.shoulder;}],\n",
 " ['foreign runtime source',p=>{p.runtimeSources.specimen='0'.repeat(40);}],\n",
 " ['malformed runtime source',p=>{p.runtimeSources['lower-limb']='HEAD';}],\n",
];
for(const row of addedRows)currentBlock=once(currentBlock,row,'');
const moduleStart="for(const module of ['head-neck','shoulder','lower-limb','female-pelvis']){";
const moduleEnd='for(const [label,path,edit]of [';
const moduleRefusals=section(currentBlock,moduleStart,moduleEnd);
assert.equal(sha(moduleRefusals),'899cfbf95c11f82a0bfafeada065cb7ef85384f381548e1523c62bac1cf0ad09');
currentBlock=once(currentBlock,moduleRefusals,'');
assert.equal(currentBlock,originalBlock,'Complete historical refusal block survives the exact runtime additions');
assert.throws(()=>{
 let changed=once(current,"['foreign runtime source'","['foreign runtime sourxe'");
 let block=section(changed,refusalStart,refusalEnd);
 for(const row of addedRows)block=once(block,row,'');
});

const pin=JSON.parse(read(join(website,'tests/fixtures/current-atlas-delivery.json')));
const review=JSON.parse(read(join(website,'atlas-review/manifest.json')));
const inputs=JSON.parse(read(join(website,'atlas-review/integration-inputs.json')));
const head=JSON.parse(read(join(website,'public/atlas-runtime/head-neck/manifest.json')));
assert.equal(pin.source,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
assert.equal(pin.sourceTree,'e9165d7122361f809a267af1414b337b69097fe2');
assert.equal(pin.reviewSourceFiles,1558);
assert.equal(review.revision,pin.source);
assert.equal(review.files.length,pin.reviewSourceFiles);
assert.equal(inputs.inputs.length,1723);
assert.equal(head.sourceCommit,pin.source);
assert.deepEqual(pin.runtimeSources,{
 'head-neck':pin.source,
 shoulder:'190a63238eadcf906abe89dcbb6a67c88afe70b9',
 'lower-limb':'190a63238eadcf906abe89dcbb6a67c88afe70b9',
 'female-pelvis':'190a63238eadcf906abe89dcbb6a67c88afe70b9',
});
console.log(JSON.stringify({rawSha256:sha(raw),codeSha256:sha(code),historicalSha256:sha(historical),originalCases:titles(raw).length,refusalInverse:true,mutationsRefused:3,currentSource:pin.source,reviewFiles:review.files.length,inputs:inputs.inputs.length}));
