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
test('historical mediastinal X-ray drafts ship from tested source without scan or access claims',()=>{
 const base='public/atlas-runtime/head-neck/';
 const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
 const bytes=historicalFile(base+'manifest.json'),manifest=JSON.parse(bytes.toString());
 assert.equal(sha(bytes),'eaaf8eb1d53dc3728e07a5f3497a4a7c8018afdf0838f5b90a313282d77a2381');
 assert.equal(manifest.sourceCommit,'88cea927d48729769b96ad8fe680b0872b7e6687');
 const inputs=JSON.parse(historicalFile(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
 for(const [path,sha256] of [
  ['content/mediastinal-xray.ts','8ae8c1235315cb5b78c63332e90a52667e54c8a695d909fd8753aed905e9b9e6'],
  ['lib/mediastinal-xray.ts','975fc201ee76040704827e669e2a438dcd5517823c02b673459b4ed29241e615'],
 ])assert.deepEqual(inputs.filter(i=>i.path===path),[{path,sha256}]);
 const files=manifest.files as {path:string;sha256:string}[];
 // Teaching is shared by lazy-loaded viewers, not necessarily the entry chunk.
 const chunks=files.filter(f=>f.path.endsWith('.js'));assert(chunks.length>0);
 const compiled=chunks.map(f=>{const bytes=historicalFile(base+f.path);assert.equal(sha(bytes),f.sha256);return bytes.toString();}).join('\n');
 for(const marker of ['Age-related aortic unfolding','left outer contour of the arch','down from the knuckle','right border of the vascular pedicle','not a stand-alone diagnosis of heart failure','Chest X-ray orientation','Case, Atlas and paid-lecture access remain independent.'])assert(compiled.includes(marker),marker);
 for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
 assert(!files.some(f=>/ct-handoff|\.local\/|\.(dcm|dicom|nii|nrrd)(\.|$)/i.test(f.path)));
});

test('current mediastinal X-ray source reaches the emitted learner without cross-epoch admission',()=>{
 const base='public/atlas-runtime/head-neck/';
 const sha=(b:Buffer|string)=>createHash('sha256').update(b).digest('hex');
 const manifestBytes=readFileSync(base+'manifest.json');
 const manifest=JSON.parse(manifestBytes.toString());
 assert.equal(manifest.sourceCommit,CURRENT_ATLAS_REVISION);
 const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
 const source=(path:string)=>execFileSync('git',['show',CURRENT_ATLAS_REVISION+':'+path],{encoding:null,cwd:currentAtlasDeliveryRoot(),maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
 for(const path of ['content/mediastinal-xray.ts','lib/mediastinal-xray.ts']){
  const exact=sha(source(path));
  assert.deepEqual(inputs.filter(i=>i.path===path),[{path,sha256:exact}]);
 }
 const files=manifest.files as {path:string;sha256:string}[];
 const chunks=files.filter(f=>f.path.endsWith('.js'));
 assert(chunks.length>0);
 const compiled=chunks.map(f=>{const bytes=readFileSync(base+f.path);assert.equal(sha(bytes),f.sha256);return bytes.toString();}).join('\n');
 for(const marker of ['Age-related aortic unfolding','left outer contour of the arch','down from the knuckle','right border of the vascular pedicle','not a stand-alone diagnosis of heart failure','Chest X-ray orientation','Case, Atlas and paid-lecture access remain independent.'])assert(compiled.includes(marker),marker);
 for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
 assert(!files.some(f=>/ct-handoff|\.local\/|\.(dcm|dicom|nii|nrrd)(\.|$)/i.test(f.path)));
 const read=(path:string)=>readFileSync(path);
 validateCurrentAtlasDelivery({read});
 const tamper=(alter:(data:any)=>void)=>()=>{
  validateCurrentAtlasDelivery({read:(path:string)=>{
   if(path!==base+'source-inputs.json')return read(path);
   const data=JSON.parse(read(path).toString());alter(data);return Buffer.from(JSON.stringify(data));
  }});
 };
 assert.throws(tamper(data=>{data.find((i:any)=>i.path==='content/mediastinal-xray.ts').sha256='0'.repeat(64);}));
 assert.throws(tamper(data=>{data.find((i:any)=>i.path==='lib/mediastinal-xray.ts').path='lib/foreign-source.ts';}));
 assert.throws(tamper(data=>{data.push(data.find((i:any)=>i.path==='content/mediastinal-xray.ts'));}));
});
