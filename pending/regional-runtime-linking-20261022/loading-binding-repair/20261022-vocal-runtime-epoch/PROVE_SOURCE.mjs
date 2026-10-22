import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const stage=fileURLToPath(new URL('.',import.meta.url));
const website='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking/website';
const receipt='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking/PRODUCT_SOURCE_V6.json';
const atlas='F:/VisibleMedicine/atlas';
const rel='tests/clinical-review-vocal-tissue-teaching.test.ts';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const raw=readFileSync(stage+'RAW/'+rel+'.raw');
const code=readFileSync(stage+'CODE/'+rel);
const source=readFileSync(website+'/'+rel);
assert.equal(sha(readFileSync(receipt)),'44b20981b029abc59f4a5efcaa2c8e6a9fbddb7e2e00886c0db914646681169c');
assert.equal(sha(raw),'36d9b0a2d2b33c1426207c95103279966e53bbba5c61b325ecff757482a59c91');
assert.deepEqual(raw,source,'Frozen V6 preimage changed');
const replaceOnce=(text,after,before)=>{
 assert.equal(text.split(after).length,2,'One exact inverse seam required');
 return text.replace(after,before);
};
let inverse=code.toString('utf8');
inverse=replaceOnce(inverse,"import {execFileSync} from 'node:child_process';\n",'');
inverse=replaceOnce(inverse,"import {currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';",
 "import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';");
inverse=replaceOnce(inverse,` const atlas=currentAtlasDeliveryRoot();
 const exactSource=(revision:string,path:string):Buffer=>execFileSync('git',['show',\`\${revision}:\${path}\`],
  {cwd:atlas,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
`,'');
inverse=replaceOnce(inverse,` assert.equal(review.revision,pin.source);
 assert.equal(pin.runtimeSources['head-neck'],'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
 assert.equal(pin.runtimeSources.shoulder,'190a63238eadcf906abe89dcbb6a67c88afe70b9');
`,'');
inverse=replaceOnce(inverse,`   assert.equal(rawSha(exactSource(pin.source,path)),record.sourceSha256,'Current Review source '+path);
   const runtimeHash=rawSha(exactSource(pin.runtimeSources[name],path));
   assert.equal(inputs.find((file:any)=>file.path===path)?.sha256,runtimeHash,name+' '+path);
   if(name==='head-neck'||path!=='app/body-content.ts')assert.equal(runtimeHash,record.sourceSha256,name+' '+path);
   else assert.notEqual(runtimeHash,record.sourceSha256,'Historical shoulder body-content retains its own source');`,
 "   assert.equal(inputs.find((file:any)=>file.path===path)?.sha256,record.sourceSha256,name+' '+path);");
assert.deepEqual(Buffer.from(inverse),raw,'Complete CODE to V6 inverse');

const git=(...args)=>execFileSync('git',args,{cwd:atlas,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}).toString('utf8').trim();
assert.equal(git('rev-parse','HEAD'),'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
assert.equal(git('status','--porcelain'),'');
const pin=JSON.parse(readFileSync(website+'/tests/fixtures/current-atlas-delivery.json'));
const review=JSON.parse(readFileSync(website+'/atlas-review/manifest.json'));
assert.equal(pin.source,review.revision);
assert.equal(pin.runtimeSources['head-neck'],pin.source);
assert.equal(pin.runtimeSources.shoulder,'190a63238eadcf906abe89dcbb6a67c88afe70b9');
const paths=['content/vocal-tissue-teaching-pins.json','content/vocal-tissue-teaching.ts','lib/vocal-tissue-teaching.ts','app/body-content.ts'];
const families=[];
const callbacks={sourceChecks:0,refusals:0};
const verify=(name,inputs)=>{
 const epoch=pin.runtimeSources[name];
 for(const path of paths){
  const record=review.files.find(file=>file.path===path);
  assert(record,path);
  const imported=readFileSync(website+'/atlas-review/'+path);
  const current=execFileSync('git',['show',`${pin.source}:${path}`],{cwd:atlas,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
  const historical=execFileSync('git',['show',`${epoch}:${path}`],{cwd:atlas,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
  assert.equal(sha(imported),record.importedSha256);
  assert.equal(sha(current),record.sourceSha256);
  assert.equal(inputs.find(file=>file.path===path)?.sha256,sha(historical));
  if(name==='head-neck'||path!=='app/body-content.ts')assert.equal(sha(historical),record.sourceSha256);
  else assert.notEqual(sha(historical),record.sourceSha256);
  callbacks.sourceChecks++;
 }
};
for(const name of ['head-neck','shoulder']){
 const base=website+'/public/atlas-runtime/'+name+'/';
 const manifest=JSON.parse(readFileSync(base+'manifest.json'));
 const inputs=JSON.parse(readFileSync(base+'source-inputs.json'));
 assert.equal(manifest.sourceCommit,pin.runtimeSources[name]);
 assert.equal(manifest.patientDataIncluded,false);
 assert.equal(manifest.clinicalApproved,false);
 verify(name,inputs);
 families.push({name,epoch:manifest.sourceCommit,bodyContentSha256:inputs.find(file=>file.path==='app/body-content.ts').sha256});
}
const baselineSourceChecks=callbacks.sourceChecks;
assert.equal(baselineSourceChecks,8);
const shoulderInputs=JSON.parse(readFileSync(website+'/public/atlas-runtime/shoulder/source-inputs.json'));
for(const mutate of [
 rows=>{rows.find(file=>file.path==='app/body-content.ts').sha256='0'.repeat(64)},
 rows=>{rows.find(file=>file.path==='lib/vocal-tissue-teaching.ts').sha256='0'.repeat(64)},
 rows=>{rows.find(file=>file.path==='app/body-content.ts').sha256=review.files.find(file=>file.path==='app/body-content.ts').sourceSha256},
]){
 const rows=structuredClone(shoulderInputs);mutate(rows);
 assert.throws(()=>verify('shoulder',rows));callbacks.refusals++;
}
const evidence={baselineReceiptSha256:sha(readFileSync(receipt)),path:rel,rawSha256:sha(raw),codeSha256:sha(code),inverseSha256:sha(Buffer.from(inverse)),families,baselineSourceChecks,mutationRefusals:callbacks.refusals,actualNativeCallbacks:'not run; esbuild/native excluded',currentReviewRevision:review.revision,productChanged:false};
writeFileSync(stage+'EVIDENCE.json',JSON.stringify(evidence,null,2)+'\n');
process.stdout.write(JSON.stringify(evidence)+'\n');
