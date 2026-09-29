import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';

test('practice return ships its exact tested source and retains private-source boundaries',()=>{
 const base='public/atlas-runtime/head-neck/';
 const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
 const bytes=readFileSync(base+'manifest.json'), manifest=JSON.parse(bytes.toString());
 assert.equal(sha(bytes),'f6be93dbff8c9ac4a98502633444c7ca220ee4f863af14c3ec390f8bc2e33bfa');
 assert.equal(manifest.sourceCommit,'9ddeaed1a045cc86aeda7ac40d0dd48bf6a405b1');
 const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
 assert.deepEqual(inputs.filter(i=>i.path==='app/body-explorer.tsx'),[{
  path:'app/body-explorer.tsx',sha256:'6e93637ab53c186a8513a0314fd5d8fdfacbf6665e1443d3b6a31f6b411b9ba9',
 }]);
 const files=manifest.files as {path:string;sha256:string}[];
 const chunks=files.filter(f=>/\/index-[^/]+\.js$/.test(f.path));assert.equal(chunks.length,1);
 const chunk=readFileSync(base+chunks[0].path);assert.equal(sha(chunk),chunks[0].sha256);
 for(const marker of ['Exit practice','Finish practice','Retry missed','selectedId','camera'])assert(chunk.toString().includes(marker),marker);
 for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
 assert(!files.some(f=>/ct-handoff|\.local\/|\.(dcm|dicom|nii|nrrd)(\.|$)/i.test(f.path)));
});
