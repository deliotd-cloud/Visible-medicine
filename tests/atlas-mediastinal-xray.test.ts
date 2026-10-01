import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';

test('mediastinal X-ray drafts ship from tested source without scan or access claims',()=>{
 const base='public/atlas-runtime/head-neck/';
 const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
 const bytes=readFileSync(base+'manifest.json'),manifest=JSON.parse(bytes.toString());
 assert.equal(sha(bytes),'f2617f864ed37ed1ddffdbfbada12c74e47e72a91347c585060e9108b0edb39c');
 assert.equal(manifest.sourceCommit,'551f7dc0902be9c26c57a74cac4f101925767809');
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
