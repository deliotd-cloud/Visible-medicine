import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';

test('specimen reassembly ships the exact focus-preserving component and safety flags',()=>{
 const base='public/atlas-runtime/head-neck/';
 const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
 const bytes=readFileSync(base+'manifest.json'), manifest=JSON.parse(bytes.toString());
 assert.equal(sha(bytes),'c5317420e5c183940e42f73606445595e826a09d33d31f5db777eaa759d95c58');
 assert.equal(manifest.sourceCommit,'e1aeae3e97e01fe059b7de505e3d901a4f6b3695');
 const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
 for(const [path,sha256] of [
  ['app/specimen-removal-focus.ts','eb7b9f29bbab0e9524a5162e0254d6c0561a773ad8bf9c7ca89cc59fefe3f362'],
  ['app/um-knee-study.tsx','da403c020632fc371ef2bcbb4ebf30f28761fcfd5d05231d63aaba806c8cbc48'],
 ])assert.deepEqual(inputs.filter(i=>i.path===path),[{path,sha256}]);
 const files=manifest.files as {path:string;sha256:string}[];
 const chunks=files.filter(f=>/\/um-knee-study-[^/]+\.js$/.test(f.path));assert.equal(chunks.length,1);
 const chunk=readFileSync(base+chunks[0].path);assert.equal(sha(chunk),chunks[0].sha256);
 for(const marker of ['.um-knee-separation','input[type="range"]','Return to source positions','preventScroll','specialist review pending'])assert(chunk.toString().includes(marker),marker);
 for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
 assert(!files.some(f=>/ct-handoff|\.local\/|\.(dcm|dicom|nii|nrrd)(\.|$)/i.test(f.path)));
});
