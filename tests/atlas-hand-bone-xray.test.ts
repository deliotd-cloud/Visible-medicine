import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {emittedTeaching} from './atlas-emitted-teaching.ts';

test('hand bone X-ray drafts ship their exact source-bound implementation without history or scan data',()=>{
  const base='public/atlas-runtime/head-neck/';
  const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
  const bytes=readFileSync(base+'manifest.json');
  assert.equal(sha(bytes),'10e0857ff5d0d17d1d51f60ee728e5cf6c2b91c3c6e15db6d7f8614be8f35cf4');
  const manifest=JSON.parse(bytes.toString());
  assert.equal(manifest.sourceCommit,'bfaaa27e85ca62864e7e1f9a62c72f79c5608a98');
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,sha256] of [
    ['app/body-content.ts','5d92aa258721f1d7e2ee330281e59a573e93cb403526f4feab8d632a9b00b385'],
    ['content/hand-bone-xray.ts','624460d95748280d06636823375e34fb2779e68f235f6064198268d9430bee6d'],
    ['lib/hand-bone-xray.ts','3c2149eca9c8bcaa380f10feb48363dfaff58828c6400c5f88c8011c0a0417ef'],
  ])assert.deepEqual(inputs.filter(i=>i.path===path),[{path,sha256}]);
  const files=manifest.files as {path:string;sha256:string}[];
  assert.deepEqual(inputs.filter(f=>f.path.startsWith('scripts/')).map(f=>f.path),[
    'scripts/export-head-neck-module.mjs','scripts/export-space-preflight.mjs','scripts/head-neck-module-inputs.mjs','scripts/independent-source-contract.mjs',
  ]);
  assert(!inputs.some(f=>/\.before\.json|\.transition\.json|\.local\//.test(f.path)));
  assert(!files.some(f=>/ct-handoff|lacrimal-drainage-imaging-history|\.local\//.test(f.path)));
  const chunk=emittedTeaching(base,files);
  for(const marker of ['Trace the first metacarpal','A middle phalanx lies between the PIP','The thumb distal phalanx','No radiograph or spatial registration is supplied','Anatomy/radiology review pending'])
    assert(chunk.toString().includes(marker),marker);
  for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
});
