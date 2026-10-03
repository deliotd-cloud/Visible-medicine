import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';

test('specimen reassembly ships the exact focus-preserving component and safety flags',()=>{
 const base='public/atlas-runtime/head-neck/';
 const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
 const bytes=readFileSync(base+'manifest.json'), manifest=JSON.parse(bytes.toString());
 assert.equal(sha(bytes),'3f4e446f3941fa0d6f874dfa37ad9592d74aa98737906630f6592497cf2873e4');
 assert.equal(manifest.sourceCommit,'e6168496a8a59927164fc84c9297583d8ae01339');
 const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
 for(const [path,sha256] of [
  ['app/specimen-removal-focus.ts','eb7b9f29bbab0e9524a5162e0254d6c0561a773ad8bf9c7ca89cc59fefe3f362'],
  ['app/um-knee-study.tsx','e100830b33643dc1696ebffed0e8f26254fdfbfc49f0911e1a649d56f0a4f7d7'],
 ])assert.deepEqual(inputs.filter(i=>i.path===path),[{path,sha256}]);
 const files=manifest.files as {path:string;sha256:string}[];
 const chunks=files.filter(f=>/\/um-knee-study-[^/]+\.js$/.test(f.path));assert.equal(chunks.length,1);
 const chunk=readFileSync(base+chunks[0].path);assert.equal(sha(chunk),chunks[0].sha256);
 for(const marker of ['.um-knee-separation','input[type="range"]','Return to source positions','preventScroll','specialist review pending'])assert(chunk.toString().includes(marker),marker);
 for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
 assert(!files.some(f=>/ct-handoff|\.local\/|\.(dcm|dicom|nii|nrrd)(\.|$)/i.test(f.path)));
});
