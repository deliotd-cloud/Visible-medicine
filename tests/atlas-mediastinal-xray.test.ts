import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';

test('mediastinal X-ray drafts ship from tested source without scan or access claims',()=>{
 const base='public/atlas-runtime/head-neck/';
 const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
 const bytes=readFileSync(base+'manifest.json'),manifest=JSON.parse(bytes.toString());
 assert.equal(sha(bytes),'3f4e446f3941fa0d6f874dfa37ad9592d74aa98737906630f6592497cf2873e4');
 assert.equal(manifest.sourceCommit,'e6168496a8a59927164fc84c9297583d8ae01339');
 const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
 for(const [path,sha256] of [
  ['content/mediastinal-xray.ts','8ae8c1235315cb5b78c63332e90a52667e54c8a695d909fd8753aed905e9b9e6'],
  ['lib/mediastinal-xray.ts','975fc201ee76040704827e669e2a438dcd5517823c02b673459b4ed29241e615'],
 ])assert.deepEqual(inputs.filter(i=>i.path===path),[{path,sha256}]);
 const files=manifest.files as {path:string;sha256:string}[];
 // Teaching is shared by lazy-loaded viewers, not necessarily the entry chunk.
 const chunks=files.filter(f=>f.path.endsWith('.js'));assert(chunks.length>0);
 const compiled=chunks.map(f=>{const bytes=readFileSync(base+f.path);assert.equal(sha(bytes),f.sha256);return bytes.toString();}).join('\n');
 for(const marker of ['Age-related aortic unfolding','left outer contour of the arch','down from the knuckle','right border of the vascular pedicle','not a stand-alone diagnosis of heart failure','Chest X-ray orientation','Case, Atlas and paid-lecture access remain independent.'])assert(compiled.includes(marker),marker);
 for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
 assert(!files.some(f=>/ct-handoff|\.local\/|\.(dcm|dicom|nii|nrrd)(\.|$)/i.test(f.path)));
});
