import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';

test('specimen runtime binds verified removal/history focus without publishing CT preflight data',()=>{
  const base='public/atlas-runtime/head-neck/';
  const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
  const bytes=readFileSync(base+'manifest.json');
  assert.equal(sha(bytes),'ac941b1da5484e8453c026352130dc210eb111a232862bef88c4fd96150aedd1');
  const manifest=JSON.parse(bytes.toString());
  assert.equal(manifest.sourceCommit,'d5ebe0712d71f4f352ebac679373f00b8d7d94e1');
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,sha256] of [
    ['app/specimen-removal-focus.ts','eb7b9f29bbab0e9524a5162e0254d6c0561a773ad8bf9c7ca89cc59fefe3f362'],
    ['app/um-knee-study.tsx','da403c020632fc371ef2bcbb4ebf30f28761fcfd5d05231d63aaba806c8cbc48'],
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
