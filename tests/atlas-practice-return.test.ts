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
test('historical practice return ships its exact tested source and retains private-source boundaries',()=>{
 const base='public/atlas-runtime/head-neck/';
 const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
 const bytes=historicalFile(base+'manifest.json'), manifest=JSON.parse(bytes.toString());
 assert.equal(sha(bytes),'eaaf8eb1d53dc3728e07a5f3497a4a7c8018afdf0838f5b90a313282d77a2381');
 assert.equal(manifest.sourceCommit,'88cea927d48729769b96ad8fe680b0872b7e6687');
 const inputs=JSON.parse(historicalFile(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
 assert.deepEqual(inputs.filter(i=>i.path==='app/body-explorer.tsx'),[{
  path:'app/body-explorer.tsx',sha256:'2dad1c22dfec424db6a4cdf578cb4f9cafe6a0e3295f95ed7d3318976aa62dc0',
 }]);
 const files=manifest.files as {path:string;sha256:string}[];
 const chunks=files.filter(f=>/\/index-[^/]+\.js$/.test(f.path));assert.equal(chunks.length,1);
 const chunk=historicalFile(base+chunks[0].path);assert.equal(sha(chunk),chunks[0].sha256);
 for(const marker of ['Exit practice','Finish practice','Retry missed','selectedId','camera'])assert(chunk.toString().includes(marker),marker);
 for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
 assert(!files.some(f=>/ct-handoff|\.local\/|\.(dcm|dicom|nii|nrrd)(\.|$)/i.test(f.path)));
});

test('current practice return ships exact Atlas source and retains private-source boundaries',()=>{
 const base='public/atlas-runtime/head-neck/';
 const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
 const bytes=readFileSync(base+'manifest.json'),manifest=JSON.parse(bytes.toString());
 assert.equal(manifest.sourceCommit,CURRENT_ATLAS_REVISION);
 const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
 const path='app/body-explorer.tsx';
 const source=execFileSync('git',['show',CURRENT_ATLAS_REVISION+':'+path],{encoding:null,cwd:currentAtlasDeliveryRoot(),maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
 assert.deepEqual(inputs.filter(i=>i.path===path),[{path,sha256:sha(source)}]);
 const files=manifest.files as {path:string;sha256:string}[];
 const chunks=files.filter(f=>/\/index-[^/]+\.js$/.test(f.path));assert.equal(chunks.length,1);
 const chunk=readFileSync(base+chunks[0].path);assert.equal(sha(chunk),chunks[0].sha256);
 for(const marker of ['Exit practice','Finish practice','Retry missed','selectedId','camera'])assert(chunk.toString().includes(marker),marker);
 for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
 assert(!files.some(f=>/ct-handoff|\.local\/|\.(dcm|dicom|nii|nrrd)(\.|$)/i.test(f.path)));
 const read=(name:string)=>readFileSync(name);
 validateCurrentAtlasDelivery({read});
 assert.throws(()=>validateCurrentAtlasDelivery({read:(name:string)=>{
  if(name!==base+'source-inputs.json')return read(name);
  const data=JSON.parse(read(name).toString());
  data.find((f:any)=>f.path===path).sha256='0'.repeat(64);
  return Buffer.from(JSON.stringify(data));
 }}));
});
