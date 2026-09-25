import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';

test('epigastric vein drafts ship exact source-bound teaching without imaging or approval',()=>{
 const base='public/atlas-runtime/head-neck/';
 const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
 const manifest=JSON.parse(readFileSync(base+'manifest.json','utf8'));
 const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
 for(const [path,sha256]of [
  ['lib/epigastric-vein-pathology.ts','bb96582a47f415ce7800119d0917925a8b2cafa8d2bd5aa81040f2bb2ba1b9b5'],
  ['content/epigastric-vein-pathology.ts','6afb107f31de04311a005ffa98ed8cf011dcdc7c3198cdf8c9c8ed70641c80a3'],
 ])assert.deepEqual(inputs.filter(i=>i.path===path),[{path,sha256}]);
 const files=manifest.files as {path:string;sha256:string}[];
 const chunks=files.filter(f=>f.path.endsWith('.js'));assert(chunks.length>0);
 const compiled=chunks.map(f=>{const bytes=readFileSync(base+f.path);assert.equal(sha(bytes),f.sha256);return bytes.toString();}).join('\n');
 for(const marker of ['FMA21164','FMA21163','Catheter malposition: a reported complication','without asserting a left-sided case','single case illustrates a localisation pitfall','Keep this deep vein distinct from the superficial epigastric vein.','10.1155/2012/492594','Atlas, imaging-case and paid-lecture access remain independent.'])assert(compiled.includes(marker),marker);
 for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
 assert(!files.some(f=>/ct-handoff|\.local\/|\.(dcm|dicom|nii|nrrd)(\.|$)/i.test(f.path)));
});
