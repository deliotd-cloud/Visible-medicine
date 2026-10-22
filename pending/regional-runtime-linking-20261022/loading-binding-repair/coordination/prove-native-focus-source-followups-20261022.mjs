import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import vm from 'node:vm';
import {fullSourceInverse} from './review-source-packet-20261022.mjs';

const stage='F:/VisibleMedicine/staging/20261022-native-focus-current-source-followups';
const website='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking/website';
const sha=b=>createHash('sha256').update(b).digest('hex');
const evidence=JSON.parse(fs.readFileSync(stage+'/EVIDENCE.json'));
const delivery=await import(pathToFileURL(website+'/tests/current-atlas-delivery.mjs'));
const code=new Map(evidence.files.map(row=>[row.path,fs.readFileSync(stage+'/CODE/'+row.path)]));
const raw=new Map(evidence.files.map(row=>[row.path,fs.readFileSync(stage+'/RAW/'+row.path)]));
for(const row of evidence.files){
 assert.equal(sha(raw.get(row.path)),row.rawSha256);assert.equal(sha(code.get(row.path)),row.codeSha256);
 assert.deepEqual(fullSourceInverse(raw.get(row.path),code.get(row.path)),row.hunks);
 assert.deepEqual(raw.get(row.path),fs.readFileSync(website+'/'+row.path));
}
async function run(name,packets){
 const results=[];
 const read=(input,encoding)=>{
  const at=(input instanceof URL?fileURLToPath(input):resolve(website,input)).replaceAll('\\','/');
  const relative=at.startsWith(website+'/')?at.slice(website.length+1):null;
  const bytes=packets.get(relative)??fs.readFileSync(at);return encoding?bytes.toString(encoding):bytes;
 };
 const test=(title,fn)=>{try{assert.equal(typeof fn,'function');const value=fn();assert.equal(value,undefined,'Only synchronous source bodies are admitted');results.push({title,pass:true});}catch(error){results.push({title,pass:false,message:error.message,actual:error.actual,expected:error.expected});}};
 const context=vm.createContext({Buffer,URL,console});
 const module=new vm.SourceTextModule(packets.get(name).toString(),{context,identifier:stage+'/'+name,
  initializeImportMeta(meta){meta.url=pathToFileURL(website+'/'+name).href;}});
 const available={'node:assert/strict':{default:assert},'node:test':{default:test},'node:crypto':{createHash},
  'node:fs':{readFileSync:read},'./current-atlas-delivery.mjs':{...delivery}};
 await module.link(specifier=>{const values=available[specifier];assert(values,'Unlisted dependency: '+specifier);
  return new vm.SyntheticModule(Object.keys(values),function(){for(const[key,value]of Object.entries(values))this.setExport(key,value);},{context});});
 await module.evaluate();return results;
}
const focus='tests/native-focus-review-binding.test.mjs',witness='tests/head-binding-role-preservation-20261021.test.mjs';
const baseline=await run(focus,raw);
assert.equal(baseline.length,2);assert.equal(baseline[0].pass,false);
assert.equal(baseline[0].actual,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
assert.equal(baseline[0].expected,'190a63238eadcf906abe89dcbb6a67c88afe70b9');
assert.equal(baseline[1].pass,true,'The complete historical desktop transition already passes');
const current=await run(focus,code);assert.equal(current.length,2);assert(current.every(row=>row.pass));
const origins=await run(witness,code);assert(origins.length>0&&origins.every(row=>row.pass));
const mutated=new Map(code),text=code.get(focus).toString();
const from='assert.equal(binding.inputs.length,1723);';assert.equal(text.split(from).length,2);
mutated.set(focus,Buffer.from(text.replace(from,'')));
const refused=await run(witness,mutated);assert(refused.some(row=>!row.pass&&row.title.includes('native-focus')));
const result={at:new Date().toISOString(),sourceReceipt:evidence.sourceReceipt,sourceReceiptSha256:evidence.sourceReceiptSha256,
 files:evidence.files.map(({path,rawSha256,codeSha256})=>({path,rawSha256,codeSha256})),
 baseline,current,historicalSourceBodies:origins,removedCurrentBindingRefused:true,
 fullCodeToV6Inverses:true,nativeNodeTestExecuted:false,esbuildExecuted:false,
 candidateChanged:false,ownerPreviewChanged:false,clinicalApproval:false};
fs.writeFileSync(stage+'/MAIN_SOURCE_PROOF.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({sourceBodiesPassed:current.length+origins.length,baselineMismatchReproduced:true,
 removedBindingRefused:true,receipt:stage+'/MAIN_SOURCE_PROOF.json',sha256:sha(fs.readFileSync(stage+'/MAIN_SOURCE_PROOF.json')),nativeExecuted:false}));
