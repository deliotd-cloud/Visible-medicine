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
test('historical pulmonary X-ray drafts ship source-bound text without offline history or imaging access',()=>{
  const base='public/atlas-runtime/head-neck/';
  const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
  const bytes=historicalFile(base+'manifest.json');
  const manifest=JSON.parse(bytes.toString());
  const inventory=JSON.parse(historicalFile('lib/atlas-model-inventory.json','utf8'));
  const registered=inventory.sources.find((s:{module:string})=>s.module==='head-neck');
  assert(registered);
  assert.equal(sha(bytes),registered.manifestSha256);
  assert.equal(manifest.sourceCommit,registered.sourceCommit);
  const inputs=JSON.parse(historicalFile(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,sha256] of [
    ['content/pulmonary-teaching.ts','0abe50a77f1a4e64eabd51bc2be39a0798ea2aa567625acb5201b58872934b0a'],
    ['content/nested-teaching.ts','415e77735aced6c54c46182c362682f26348c99317628548b4d80d1906d0691b'],
    ['lib/nested-teaching.ts','3fe0bbfd7078554e013c00e2e58c70aa96af34074540bf4e959b8269941a356f'],
    ['app/nested-teaching.tsx','502e0a1d13c65875963bc760ca01260bde329368fe6d3bf4162f98cf3de42744'],
  ])assert.deepEqual(inputs.filter(i=>i.path===path),[{path,sha256}]);
  assert.deepEqual(inputs.filter(f=>f.path.startsWith('scripts/')).map(f=>f.path),[
    'scripts/export-head-neck-module.mjs','scripts/export-space-preflight.mjs','scripts/head-neck-module-inputs.mjs','scripts/independent-source-contract.mjs',
  ]);
  const files=manifest.files as {path:string;sha256:string}[];
  for(const list of [inputs,files])assert(!list.some(f=>/\.before\.json|\.transition\.json|\.local\/|pulmonary-imaging-stage-history|ct-handoff/.test(f.path)));
  const chunks=files.filter(f=>/^assets\/index-[^/]+\.js$/.test(f.path));
  assert.equal(chunks.length,1);
  const chunk=historicalFile(base+chunks[0].path);
  assert.equal(sha(chunk),chunks[0].sha256);
  for(const marker of [
    'Compare frontal and lateral chest radiographs when learning lobar relationships',
    'The right middle lobe is separated from the upper lobe by the horizontal fissure',
    'The oblique fissure separates each lower lobe from the other lobes on that side',
    'https://ehealth.kcl.ac.uk/tel/radiology/CXR/03-02-lungs.html',
    'https://www.radiologyinfo.org/en/info/chestrad',
    'No scan access or synchronization is provided',
  ])assert(chunk.toString().includes(marker),marker);
  for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
});

test('current pulmonary X-ray source and teaching remain exact without imaging access',()=>{
 const base='public/atlas-runtime/head-neck/';
 const sha=(bytes:Buffer|string)=>createHash('sha256').update(bytes).digest('hex');
 const manifestBytes=readFileSync(base+'manifest.json');
 const manifest=JSON.parse(manifestBytes.toString());
 const inventory=JSON.parse(readFileSync('lib/atlas-model-inventory.json','utf8'));
 const registered=inventory.sources.find((s:{module:string})=>s.module==='head-neck');
 assert(registered);
 assert.equal(sha(manifestBytes),registered.manifestSha256);
 assert.equal(manifest.sourceCommit,registered.sourceCommit);
 assert.equal(manifest.sourceCommit,CURRENT_ATLAS_REVISION);
 const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
 const source=(path:string)=>execFileSync('git',['show',CURRENT_ATLAS_REVISION+':'+path],{encoding:null,cwd:currentAtlasDeliveryRoot(),maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
 for(const path of ['content/pulmonary-teaching.ts','content/nested-teaching.ts','lib/nested-teaching.ts','app/nested-teaching.tsx']){
  assert.deepEqual(inputs.filter(i=>i.path===path),[{path,sha256:sha(source(path))}]);
 }
 assert.deepEqual(inputs.filter(f=>f.path.startsWith('scripts/')).map(f=>f.path),[
  'scripts/export-head-neck-module.mjs','scripts/export-space-preflight.mjs','scripts/head-neck-module-inputs.mjs','scripts/independent-source-contract.mjs','scripts/regional-teaching-snapshots.mjs',
 ]);
 const files=manifest.files as {path:string;sha256:string}[];
 assert.deepEqual(inputs.filter(f=>/\.before\.json$/.test(f.path)),[
  {path:'content/lower-limb-connective-xray.before.json',sha256:sha(source('content/lower-limb-connective-xray.before.json'))},
 ]);
 assert(!files.some(f=>/\.before\.json$/.test(f.path)));
 for(const list of [inputs,files])assert(!list.some(f=>/\.transition\.json|\.local\/|pulmonary-imaging-stage-history|ct-handoff/.test(f.path)));
 const chunks=files.filter(f=>/^assets\/index-[^/]+\.js$/.test(f.path));
 assert.equal(chunks.length,1);
 const chunk=readFileSync(base+chunks[0].path);
 assert.equal(sha(chunk),chunks[0].sha256);
 for(const marker of [
  'Compare frontal and lateral chest radiographs when learning lobar relationships',
  'The right middle lobe is separated from the upper lobe by the horizontal fissure',
  'The oblique fissure separates each lower lobe from the other lobes on that side',
  'https://ehealth.kcl.ac.uk/tel/radiology/CXR/03-02-lungs.html',
  'https://www.radiologyinfo.org/en/info/chestrad',
  'No scan access or synchronization is provided',
 ])assert(chunk.toString().includes(marker),marker);
 for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
 const read=(path:string)=>readFileSync(path);
 validateCurrentAtlasDelivery({read});
 const tamper=(alter:(data:any)=>void)=>()=>validateCurrentAtlasDelivery({read:(path:string)=>{
  if(path!==base+'source-inputs.json')return read(path);
  const data=JSON.parse(read(path).toString());alter(data);return Buffer.from(JSON.stringify(data));
 }});
 assert.throws(tamper(data=>{data.find((i:any)=>i.path==='content/pulmonary-teaching.ts').sha256='0'.repeat(64);}));
 assert.throws(tamper(data=>{data.find((i:any)=>i.path==='content/nested-teaching.ts').sha256='0'.repeat(64);}));
 assert.throws(tamper(data=>{data.find((i:any)=>i.path==='lib/nested-teaching.ts').path='lib/foreign-teaching.ts';}));
 assert.throws(tamper(data=>{data.push(data.find((i:any)=>i.path==='app/nested-teaching.tsx'));}));
});
