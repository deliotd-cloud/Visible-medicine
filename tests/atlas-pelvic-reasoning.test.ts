import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';

test('pelvic reasoning ships as generated draft teaching without new anatomy or access claims',()=>{
 const base='public/atlas-runtime/head-neck/';
 const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
 const bytes=readFileSync(base+'manifest.json'),manifest=JSON.parse(bytes.toString());
 assert.equal(sha(bytes),'2e956520237c8639142d2dad44ea46edb7eb03e1e0a3f3ac95a21ee984b775af');
 assert.equal(manifest.sourceCommit,'944f57b801471c3b005a64ec83314188b2f06cf5');
 const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
 assert.deepEqual(inputs.filter(i=>i.path==='lib/pelvic-organ-reasoning.ts'),[{path:'lib/pelvic-organ-reasoning.ts',sha256:'f951d93412bcc797afabef89ca1d3ea7a0a6716a15493b9b9eabebb292487824'}]);
 const files=manifest.files as {path:string;sha256:string}[];
 const chunks=files.filter(f=>f.path.endsWith('.js'));assert(chunks.length>0);
 const compiled=chunks.map(f=>{const bytes=readFileSync(base+f.path);assert.equal(sha(bytes),f.sha256);return bytes.toString();}).join('\n');
 for(const marker of ['pelvic-bladder','pelvic-prostate','pelvic-rectum','pelvic-urethra','pelvic-testis','pelvic-epididymis','pelvic-seminal-vesicle','pelvic-ureter','Which paired structure behind the bladder contributes seminal fluid?','This is a male reference surface','Case, Atlas and paid-lecture access remain independent.'])assert(compiled.includes(marker),marker);
 for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
 assert(!files.some(f=>/ct-handoff|\.local\/|\.(dcm|dicom|nii|nrrd)(\.|$)/i.test(f.path)));
});
