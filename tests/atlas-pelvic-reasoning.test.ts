import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {execFileSync} from 'node:child_process';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const featureWebsite='f2f7adbb34af7d7a3bb9affa3ada082fe423ecf6';
const feature=(path:string)=>Buffer.from(execFileSync('git',['show',`${featureWebsite}:${path}`],{encoding:null,maxBuffer:32e6,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}));
const sourceRepo=currentAtlasDeliveryRoot();
test('pelvic reasoning ships as generated draft teaching without new anatomy or access claims',()=>{
 const base='public/atlas-runtime/head-neck/';
 const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
 const bytes=feature(base+'manifest.json'),manifest=JSON.parse(bytes.toString());
 assert.equal(sha(bytes),'eaaf8eb1d53dc3728e07a5f3497a4a7c8018afdf0838f5b90a313282d77a2381');
 assert.equal(manifest.sourceCommit,'88cea927d48729769b96ad8fe680b0872b7e6687');
 const inputs=JSON.parse(feature(base+'source-inputs.json').toString('utf8')) as {path:string;sha256:string}[];
 assert.deepEqual(inputs.filter(i=>i.path==='lib/pelvic-organ-reasoning.ts'),[{path:'lib/pelvic-organ-reasoning.ts',sha256:'f951d93412bcc797afabef89ca1d3ea7a0a6716a15493b9b9eabebb292487824'}]);
 const files=manifest.files as {path:string;sha256:string}[];
 const chunks=files.filter(f=>f.path.endsWith('.js'));assert(chunks.length>0);
 const compiled=chunks.map(f=>{const bytes=feature(base+f.path);assert.equal(sha(bytes),f.sha256);return bytes.toString();}).join('\n');
 for(const marker of ['pelvic-bladder','pelvic-prostate','pelvic-rectum','pelvic-urethra','pelvic-testis','pelvic-epididymis','pelvic-seminal-vesicle','pelvic-ureter','Which paired structure behind the bladder contributes seminal fluid?','This is a male reference surface','Case, Atlas and paid-lecture access remain independent.'])assert(compiled.includes(marker),marker);
 for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
 assert(!files.some(f=>/ct-handoff|\.local\/|\.(dcm|dicom|nii|nrrd)(\.|$)/i.test(f.path)));
});

test('closed current atlas-pelvic-reasoning delivery retains exact source, Review import and learner evidence',()=>{
 const pin=validateCurrentAtlasDelivery();
 assert.equal(pin.source,CURRENT_ATLAS_REVISION);
 const base='public/atlas-runtime/head-neck/';
 const manifest=JSON.parse(readFileSync(base+'manifest.json','utf8'));
 const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));
 const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
 assert.equal(manifest.sourceCommit,pin.source);
 assert.equal(review.revision,pin.source);
 for(const flag of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false,flag);
 for(const path of ['lib/pelvic-organ-reasoning.ts']){
   const source=execFileSync('git',['show',`${pin.source}:${path}`],{encoding:null,cwd:sourceRepo,maxBuffer:32e6,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
   assert.deepEqual(inputs.filter((row:{path:string})=>row.path===path),[{path,sha256:sha(source)}]);
   const entry=review.files.find((file:{path:string})=>file.path===path);
   assert(entry,`Review missing ${path}`);
   assert.equal(entry.sourceSha256,sha(source),path);
   assert.equal(entry.importedSha256,sha(readFileSync('atlas-review/'+path)),path);
 }
 const runtime=(manifest.files as {path:string;sha256:string}[]).filter(file=>file.path.endsWith('.js')).map(file=>{
   const bytes=readFileSync(base+file.path);assert.equal(sha(bytes),file.sha256,file.path);return bytes.toString();
 }).join('\n');
 for(const marker of ['pelvic-bladder','Which paired structure behind the bladder contributes seminal fluid?'])assert(runtime.includes(marker),marker);
 const altered=structuredClone(manifest);altered.sourceCommit='0'.repeat(40);
 assert.throws(()=>validateCurrentAtlasDelivery({pin,read:path=>path==='public/atlas-runtime/head-neck/manifest.json'?Buffer.from(JSON.stringify(altered)):readFileSync(path)}),/Current delivery changed: public\/atlas-runtime\/head-neck\/manifest.json/);
});
