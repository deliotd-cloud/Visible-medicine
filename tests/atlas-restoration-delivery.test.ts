import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {createHash} from 'node:crypto';

const historicalWebsite='f2f7adbb34af7d7a3bb9affa3ada082fe423ecf6';
function historicalFile(path:string,encoding:'utf8'):string;
function historicalFile(path:string):Buffer;
function historicalFile(path:string,encoding?:'utf8'){
 const bytes=Buffer.from(execFileSync('git',['show',historicalWebsite+':'+path],{encoding:null,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}));
 return encoding==='utf8'?bytes.toString('utf8'):bytes;
}
test('historical regional and whole-body delivery contains tested restoration and source-bound drafts',()=>{
  const base='public/atlas-runtime/head-neck/';
  const manifest=JSON.parse(historicalFile(base+'manifest.json','utf8'));
  const inputs=JSON.parse(historicalFile(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  assert.equal(manifest.sourceCommit,'88cea927d48729769b96ad8fe680b0872b7e6687');
  for(const [path,hash] of Object.entries({
    'app/body-explorer.tsx':'2dad1c22dfec424db6a4cdf578cb4f9cafe6a0e3295f95ed7d3318976aa62dc0',
    'content/achilles-ct.ts':'90957fbb728c1b72aa29b5db1f0aca01269035d49022d93d3fe5bf413a05cd21',
    'content/foot-vascular-quiz.ts':'3dc9fd1aa39ea472ea2d01b3e682a02524fdd902da2e44a71b3132714759bde9',
    'lib/foot-vascular-quiz.ts':'df617fe8a552a1d0b808c212497c77c879a18192a4094e269a4e0d94fc3eb791',
  })) assert.equal(inputs.find(f=>f.path===path)?.sha256,hash,path);
  assert.equal(manifest.regionalScopes.length,12);
  assert.equal(manifest.regionalScopes.find((s:{region:string})=>s.region==='whole-body').regionalIds.length,1104);
  for(const flag of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
  for(const file of manifest.files)assert.equal(createHash('sha256').update(historicalFile(base+file.path)).digest('hex'),file.sha256,file.path);
  // Exact source and artifact evidence above; actual interaction behavior is
  // exercised by the Atlas handler tests and the integrated browser acceptance.
});

test('current regional and whole-body delivery retains exact source and artifact boundaries',()=>{
 const base='public/atlas-runtime/head-neck/';
 const manifest=JSON.parse(readFileSync(base+'manifest.json','utf8'));
 const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
 assert.equal(manifest.sourceCommit,CURRENT_ATLAS_REVISION);
 const source=(path:string)=>execFileSync('git',['show',CURRENT_ATLAS_REVISION+':'+path],{encoding:null,cwd:currentAtlasDeliveryRoot(),maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
 const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
 for(const path of ['app/body-explorer.tsx','content/achilles-ct.ts','content/foot-vascular-quiz.ts','lib/foot-vascular-quiz.ts']){
  assert.deepEqual(inputs.filter(f=>f.path===path),[{path,sha256:sha(source(path))}]);
 }
 assert.equal(manifest.regionalScopes.length,12);
 assert.equal(manifest.regionalScopes.find((s:{region:string})=>s.region==='whole-body').regionalIds.length,1104);
 for(const flag of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
 for(const file of manifest.files)assert.equal(sha(readFileSync(base+file.path)),file.sha256,file.path);
 const read=(name:string)=>readFileSync(name);
 validateCurrentAtlasDelivery({read});
 const tamper=(alter:(data:any)=>void)=>()=>validateCurrentAtlasDelivery({read:(name:string)=>{
  if(name!==base+'source-inputs.json')return read(name);
  const data=JSON.parse(read(name).toString());alter(data);return Buffer.from(JSON.stringify(data));
 }});
 assert.throws(tamper(data=>{data.find((f:any)=>f.path==='app/body-explorer.tsx').sha256='0'.repeat(64);}));
 assert.throws(tamper(data=>{data.find((f:any)=>f.path==='content/achilles-ct.ts').path='content/foreign-ct.ts';}));
 assert.throws(tamper(data=>{data.push(data.find((f:any)=>f.path==='content/foot-vascular-quiz.ts'));}));
});
