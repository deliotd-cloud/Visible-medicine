import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {createHash} from 'node:crypto';
import test from 'node:test';

const laterWebsite='f2f7adbb34af7d7a3bb9affa3ada082fe423ecf6';
const earlierWebsite='440bfade45f4a330665eea2539f3a7b7dff82e1b';
function historicalFile(path:string,encoding:'utf8'):string;
function historicalFile(path:string):Buffer;
function historicalFile(path:string,encoding?:'utf8'){
 const bytes=Buffer.from(execFileSync('git',['show',laterWebsite+':'+path],{encoding:null,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}));
 return encoding==='utf8'?bytes.toString('utf8'):bytes;
}
function earlierFile(path:string,encoding:'utf8'):string;
function earlierFile(path:string):Buffer;
function earlierFile(path:string,encoding?:'utf8'){
 const bytes=Buffer.from(execFileSync('git',['show',earlierWebsite+':'+path],{encoding:null,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}));
 return encoding==='utf8'?bytes.toString('utf8'):bytes;
}
test('historical regional exports bind paired popliteal studies and guarded Search handoff',()=>{
  const base='public/atlas-runtime/head-neck/';
  const manifest=JSON.parse(historicalFile(base+'manifest.json','utf8'));
  assert.equal(manifest.sourceCommit,'88cea927d48729769b96ad8fe680b0872b7e6687');
  const inputs=JSON.parse(historicalFile(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  const earlierInputs=JSON.parse(earlierFile(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  const earlierManifest=JSON.parse(earlierFile(base+'manifest.json','utf8'));
  assert.equal(earlierManifest.sourceCommit,'8b809ca6d8c70afc824acd41dbbf4d10df138fcd');
  for(const [path,sha256] of Object.entries({
    'app/atlas-workspace.tsx':'fb0b89748213755782a9eeb4522193425e912da976020249eaa80ecb56ef653d',
    'app/body-explorer.tsx':'2dad1c22dfec424db6a4cdf578cb4f9cafe6a0e3295f95ed7d3318976aa62dc0',
    'content/popliteal-vessel-study-pins.json':'d0f4f1875c2f3a9b281a90c8d6675f063c7427d4648cda7b3961106ad71eb1f8',
    'content/popliteal-vessel-study.ts':'abc5e21efacfde75edb96b34e3a7e218968983d323f078f5381fe3c950a366f3',
    'lib/popliteal-vessel-study.ts':'836b58cea4a797392e18e38975091ebb8e8918d8302c6e1ab0ee9caa5463f14b',
    'lib/study-close-up-label.ts':'1ad423aaaff68a9c40c8fd33af58bc2f8457460cb70b4d6922e2856dac025438',
  }))assert.deepEqual((path==='app/atlas-workspace.tsx'?earlierInputs:inputs).filter(input=>input.path===path),[{path,sha256}]);
  for(const path of ['content/popliteal-vessel-study-pins.json','content/popliteal-vessel-study.ts','lib/popliteal-vessel-study.ts','lib/study-close-up-label.ts'])
    assert.deepEqual(earlierInputs.filter(input=>input.path===path),inputs.filter(input=>input.path===path));
  for(const flag of ['patientDataIncluded','clinicalApproved','imagingConnection','standaloneReviewConnection'])assert.equal(earlierManifest[flag],false);
  const runtime=(manifest.files as {path:string;sha256:string}[]).filter(file=>file.path.endsWith('.js')).map(file=>{
    const bytes=historicalFile(base+file.path);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),file.sha256);
    return bytes.toString();
  }).join('\n');
  for(const marker of ['knee-popliteal-vessel-pair','Knee: popliteal artery and vein',
    'This study could not be opened with the current source data.',
    'This result is no longer available in the current atlas view.',
    'Whole surfaces extend beyond the view'])assert.ok(runtime.includes(marker),marker);
  for(const flag of ['patientDataIncluded','clinicalApproved','imagingConnection','standaloneReviewConnection'])assert.equal(manifest[flag],false);
});

test('current regional export binds exact popliteal sources and guarded Search handoff',()=>{
 const base='public/atlas-runtime/head-neck/';
 const manifest=JSON.parse(readFileSync(base+'manifest.json','utf8'));
 assert.equal(manifest.sourceCommit,CURRENT_ATLAS_REVISION);
 const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
 const source=(path:string)=>execFileSync('git',['show',CURRENT_ATLAS_REVISION+':'+path],{encoding:null,cwd:currentAtlasDeliveryRoot(),maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
 const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
 for(const path of ['app/atlas-workspace.tsx','app/body-explorer.tsx','content/popliteal-vessel-study-pins.json','content/popliteal-vessel-study.ts','lib/popliteal-vessel-study.ts','lib/study-close-up-label.ts']){
  assert.deepEqual(inputs.filter(input=>input.path===path),[{path,sha256:sha(source(path))}]);
 }
 const runtime=(manifest.files as {path:string;sha256:string}[]).filter(file=>file.path.endsWith('.js')).map(file=>{
  const bytes=readFileSync(base+file.path);
  assert.equal(sha(bytes),file.sha256);
  return bytes.toString();
 }).join('\n');
 for(const marker of ['knee-popliteal-vessel-pair','Knee: popliteal artery and vein',
  'This study could not be opened with the current source data.',
  'This result is no longer available in the current atlas view.',
  'Whole surfaces extend beyond the view'])assert.ok(runtime.includes(marker),marker);
 for(const flag of ['patientDataIncluded','clinicalApproved','imagingConnection','standaloneReviewConnection'])assert.equal(manifest[flag],false);
 const read=(name:string)=>readFileSync(name);
 validateCurrentAtlasDelivery({read});
 const tamper=(alter:(data:any)=>void)=>()=>validateCurrentAtlasDelivery({read:(name:string)=>{
  if(name!==base+'source-inputs.json')return read(name);
  const data=JSON.parse(read(name).toString());alter(data);return Buffer.from(JSON.stringify(data));
 }});
 assert.throws(tamper(data=>{data.find((f:any)=>f.path==='content/popliteal-vessel-study.ts').sha256='0'.repeat(64);}));
 assert.throws(tamper(data=>{data.find((f:any)=>f.path==='app/atlas-workspace.tsx').path='app/foreign-workspace.tsx';}));
 assert.throws(tamper(data=>{data.push(data.find((f:any)=>f.path==='app/body-explorer.tsx'));}));
});
