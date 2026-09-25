import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';

test('practice return ships its exact tested source and retains private-source boundaries',()=>{
 const base='public/atlas-runtime/head-neck/';
 const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
 const bytes=readFileSync(base+'manifest.json'), manifest=JSON.parse(bytes.toString());
 assert.equal(sha(bytes),'2bba43e74ecc65bc1f401b74add346bfc6f9689e7a2a94037d6c307b2af7d6a4');
 assert.equal(manifest.sourceCommit,'5e3667fe3c9f012cbc21e679ba2e834f527dcc3f');
 const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
 assert.deepEqual(inputs.filter(i=>i.path==='app/body-explorer.tsx'),[{
  path:'app/body-explorer.tsx',sha256:'99d1b8bb12d137bf5d89eaab489560c7fa7464197d07411843a210b6e5fdf1e0',
 }]);
 const files=manifest.files as {path:string;sha256:string}[];
 const chunks=files.filter(f=>/\/index-[^/]+\.js$/.test(f.path));assert.equal(chunks.length,1);
 const chunk=readFileSync(base+chunks[0].path);assert.equal(sha(chunk),chunks[0].sha256);
 for(const marker of ['Exit practice','Finish practice','Retry missed','selectedId','camera'])assert(chunk.toString().includes(marker),marker);
 for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
 assert(!files.some(f=>/ct-handoff|\.local\/|\.(dcm|dicom|nii|nrrd)(\.|$)/i.test(f.path)));
});
