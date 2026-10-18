import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {createHash} from 'node:crypto';
import test from 'node:test';

const historicalWebsite='f2f7adbb34af7d7a3bb9affa3ada082fe423ecf6';
function historicalFile(path:string,encoding:'utf8'):string;
function historicalFile(path:string):Buffer;
function historicalFile(path:string,encoding?:'utf8'){
 const bytes=Buffer.from(execFileSync('git',['show',historicalWebsite+':'+path],{encoding:null,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}));
 return encoding==='utf8'?bytes.toString('utf8'):bytes;
}
const earlierWebsite='440bfade45f4a330665eea2539f3a7b7dff82e1b';
function earlierFile(path:string,encoding:'utf8'):string;
function earlierFile(path:string):Buffer;
function earlierFile(path:string,encoding?:'utf8'){
 const bytes=Buffer.from(execFileSync('git',['show',earlierWebsite+':'+path],{encoding:null,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}));
 return encoding==='utf8'?bytes.toString('utf8'):bytes;
}
test('historical regional selection return preserves both actual source epochs without changing models or access',()=>{
 const base='public/atlas-runtime/head-neck/';
 const manifestBytes=historicalFile(base+'manifest.json');
 const manifest=JSON.parse(manifestBytes.toString());
 const inventory=JSON.parse(historicalFile('lib/atlas-model-inventory.json','utf8'));
 const registration=inventory.sources.find((s:{module:string})=>s.module==='head-neck');
 assert(registration);
 assert.equal(createHash('sha256').update(manifestBytes).digest('hex'),registration.manifestSha256);
 assert.equal(manifest.sourceCommit,registration.sourceCommit);
 const inputs=JSON.parse(historicalFile(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
 const earlierInputs=JSON.parse(earlierFile(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
 const earlierManifestBytes=earlierFile(base+'manifest.json');
 const earlierManifest=JSON.parse(earlierManifestBytes.toString());
 const earlierInventory=JSON.parse(earlierFile('lib/atlas-model-inventory.json','utf8'));
 const earlierRegistration=earlierInventory.sources.find((s:{module:string})=>s.module==='head-neck');
 assert(earlierRegistration);
 assert.equal(createHash('sha256').update(earlierManifestBytes).digest('hex'),earlierRegistration.manifestSha256);
 assert.equal(earlierManifest.sourceCommit,earlierRegistration.sourceCommit);
 assert.equal(earlierManifest.sourceCommit,'8b809ca6d8c70afc824acd41dbbf4d10df138fcd');
 assert.equal(manifest.sourceCommit,'88cea927d48729769b96ad8fe680b0872b7e6687');
 for(const [path,sha256]of [
  ['app/atlas-workspace.tsx','fb0b89748213755782a9eeb4522193425e912da976020249eaa80ecb56ef653d'],
  ['app/body-explorer.tsx','2dad1c22dfec424db6a4cdf578cb4f9cafe6a0e3295f95ed7d3318976aa62dc0'],
  ['app/workspace-session.ts','7a2a73775b9eebebc50df257cc520f2f33499ebb7130f496a4b2cdfb46fc379a'],
 ])assert.deepEqual((path==='app/atlas-workspace.tsx'?earlierInputs:inputs).filter(i=>i.path===path),[{path,sha256}]);
 assert.equal(inventory.models.length,137);
 assert.equal(inventory.models.flatMap((m:{paths:string[]})=>m.paths).length,144);
 assert.equal(earlierInventory.models.length,137);
 assert.equal(earlierInventory.models.flatMap((m:{paths:string[]})=>m.paths).length,144);
 for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection']){
  assert.equal(manifest[flag],false);
  assert.equal(earlierManifest[flag],false);
 }
 for(const exportManifest of [manifest,earlierManifest])assert(!(exportManifest.files as {path:string}[]).some(f=>/ct-handoff|\.local\/|\.(dcm|dicom|nii|nrrd)(\.|$)/i.test(f.path)));
});

test('current regional selection return binds exact source without changing models or access',()=>{
 const base='public/atlas-runtime/head-neck/';
 const manifestBytes=readFileSync(base+'manifest.json');
 const manifest=JSON.parse(manifestBytes.toString());
 const inventory=JSON.parse(readFileSync('lib/atlas-model-inventory.json','utf8'));
 const registration=inventory.sources.find((s:{module:string})=>s.module==='head-neck');
 assert(registration);
 const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
 assert.equal(sha(manifestBytes),registration.manifestSha256);
 assert.equal(manifest.sourceCommit,registration.sourceCommit);
 assert.equal(manifest.sourceCommit,CURRENT_ATLAS_REVISION);
 const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
 const source=(path:string)=>execFileSync('git',['show',CURRENT_ATLAS_REVISION+':'+path],{encoding:null,cwd:currentAtlasDeliveryRoot(),maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
 for(const path of ['app/atlas-workspace.tsx','app/body-explorer.tsx','app/workspace-session.ts']){
  assert.deepEqual(inputs.filter(i=>i.path===path),[{path,sha256:sha(source(path))}]);
 }
 assert.equal(inventory.models.length,137);
 assert.equal(inventory.models.flatMap((m:{paths:string[]})=>m.paths).length,144);
 for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
 assert(!(manifest.files as {path:string}[]).some(f=>/ct-handoff|\.local\/|\.(dcm|dicom|nii|nrrd)(\.|$)/i.test(f.path)));
 const read=(name:string)=>readFileSync(name);
 validateCurrentAtlasDelivery({read});
 const tamper=(alter:(data:any)=>void)=>()=>validateCurrentAtlasDelivery({read:(name:string)=>{
  if(name!==base+'source-inputs.json')return read(name);
  const data=JSON.parse(read(name).toString());alter(data);return Buffer.from(JSON.stringify(data));
 }});
 assert.throws(tamper(data=>{data.find((f:any)=>f.path==='app/atlas-workspace.tsx').sha256='0'.repeat(64);}));
 assert.throws(tamper(data=>{data.find((f:any)=>f.path==='app/body-explorer.tsx').path='app/foreign-explorer.tsx';}));
 assert.throws(tamper(data=>{data.push(data.find((f:any)=>f.path==='app/workspace-session.ts'));}));
});
