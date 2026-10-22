import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import vm from 'node:vm';
import {fullSourceInverse} from './review-source-packet-20261022.mjs';

const stage='F:/VisibleMedicine/staging/20261022-ui-dependent-source-followups';
const website='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking/website';
const sha=b=>createHash('sha256').update(b).digest('hex');
const helper=await import(pathToFileURL(stage+'/CODE/tests/ui-current-v5-source-inverse.mjs'));
const delivery=await import(pathToFileURL(website+'/tests/current-atlas-delivery.mjs'));
const ui=readFileSync('F:/VisibleMedicine/staging/20261022-corpus-ui-current-followups/CODE/tests/ui-teaching-current-delivery.test.mjs');
assert.deepEqual(helper.restoreUiV5Source(ui),readFileSync(website+'/tests/ui-teaching-current-delivery.test.mjs'));
const refused=[];
for(const[from,to]of[
 ['assert.equal(storage.calls, 0,','assert.equal(storage.calls, 1,'],
 ['assert.equal(delivery.reviewSourceFiles, 1558);','assert.equal(delivery.reviewSourceFiles, 1553);'],
 ['assert.equal(runtime.sourceCommit, delivery.runtimeSources[name], name);','assert.equal(runtime.sourceCommit, current, name);'],
]){
 const text=ui.toString();assert(text.includes(from));
 assert.throws(()=>helper.restoreUiV5Source(Buffer.from(text.replace(from,to))));refused.push(from);
}
const evidence=JSON.parse(readFileSync(stage+'/EVIDENCE.json'));
const pending=[],cases=[];
for(const row of evidence.files){
 const raw=readFileSync(stage+'/RAW/'+row.path),code=readFileSync(stage+'/CODE/'+row.path);
 assert.equal(sha(raw),row.rawSha256);assert.equal(sha(code),row.codeSha256);
 assert.deepEqual(fullSourceInverse(raw,code),row.hunks);
 const read=(input,encoding)=>{
  const at=input instanceof URL?fileURLToPath(input):resolve(website,input);
  const bytes=at.replaceAll('\\','/').toLowerCase()===(website+'/tests/ui-teaching-current-delivery.test.mjs').toLowerCase()?ui:readFileSync(at);
  return encoding?bytes.toString(encoding):bytes;
 };
 const test=(title,body)=>{
  assert.equal(typeof body,'function');
  const result=body();
  pending.push(Promise.resolve(result).then(()=>cases.push({path:row.path,title,pass:true})));
 };
 const context=vm.createContext({Buffer,URL,console,process:{env:{VM_WEBSITE_ROOT:website}}});
 const available={
  'node:assert/strict':{default:assert},'node:test':{default:test},
  'node:fs':{readFileSync:read},'node:crypto':{createHash},
  'node:path':{join},'node:url':{fileURLToPath},
  './ui-current-v5-source-inverse.mjs':{restoreUiV5Source:helper.restoreUiV5Source},
  './current-atlas-delivery.mjs':{...delivery},
 };
 const module=new vm.SourceTextModule(code.toString(),{context,identifier:stage+'/CODE/'+row.path,
  initializeImportMeta(meta){meta.url=pathToFileURL(website+'/'+row.path).href;}});
 await module.link(specifier=>{
  const exports=available[specifier];assert(exports,'No unlisted source-proof dependency: '+specifier);
  return new vm.SyntheticModule(Object.keys(exports),function(){for(const[name,value]of Object.entries(exports))this.setExport(name,value);},{context});
 });
 await module.evaluate();
}
await Promise.all(pending);
assert.equal(cases.length,14,'All historical lifecycle/admission/disclosure bodies and the new inverse refusal execute');
const result={at:new Date().toISOString(),files:evidence.files.map(({path,rawSha256,codeSha256})=>({path,rawSha256,codeSha256})),
 helperSha256:sha(readFileSync(stage+'/CODE/tests/ui-current-v5-source-inverse.mjs')),
 fullSourceInverses:true,actualSourceCallbacks:cases,mutationsRefused:refused,
 nativeNodeTestExecuted:false,esbuildExecuted:false,currentValidatorChanged:false,candidateChanged:false,ownerPreviewChanged:false};
writeFileSync(stage+'/MAIN_SOURCE_PROOF.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({casesPassed:cases.length,mutationsRefused:refused.length,receipt:stage+'/MAIN_SOURCE_PROOF.json',sha256:sha(readFileSync(stage+'/MAIN_SOURCE_PROOF.json')),nativeExecuted:false}));
