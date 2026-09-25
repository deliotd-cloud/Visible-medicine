import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';

test('specimen runtime binds verified removal/history focus without publishing CT preflight data',()=>{
  const base='public/atlas-runtime/head-neck/';
  const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
  const bytes=readFileSync(base+'manifest.json');
  assert.equal(sha(bytes),'ea4747c2e34b3aaa2de4602c31d263f6ab22bc12d262e2af8384c4f73c671fad');
  const manifest=JSON.parse(bytes.toString());
  assert.equal(manifest.sourceCommit,'77eaf754b12e039abc710f2fab21db28b2385f2f');
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,sha256] of [
    ['app/specimen-removal-focus.ts','053b100b13f90044bd9ff7ff2c8580d7de30fcd083b08ef482234796c9e41b57'],
    ['app/um-knee-study.tsx','7bafd4d2d2f07a7960dd87c5e6f0c434e66588f9994fb25c76e5561b0031950d'],
  ])assert.deepEqual(inputs.filter(i=>i.path===path),[{path,sha256}]);
  assert(!inputs.some(i=>/ct-handoff-preflight|\.local\//.test(i.path)));
  const files=manifest.files as {path:string;sha256:string}[];
  assert(!files.some(f=>/ct-handoff|preflight|\.local\//.test(f.path)));
  const chunks=files.filter(f=>/\/um-knee-study-[^/]+\.js$/.test(f.path));
  assert.equal(chunks.length,1);
  const chunk=readFileSync(base+chunks[0].path);
  assert.equal(sha(chunk),chunks[0].sha256);
  for(const marker of ['ownerDocument','activeElement','isConnected','preventScroll','scrollTop','Set aside'])
    assert(chunk.toString().includes(marker),marker);
  for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])
    assert.equal(manifest[flag],false);
});
