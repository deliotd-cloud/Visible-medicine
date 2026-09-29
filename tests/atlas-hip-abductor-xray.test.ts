import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {emittedTeaching} from './atlas-emitted-teaching.ts';

test('hip abductor X-ray drafts ship their exact source-bound implementation without history or scan data',()=>{
  const base='public/atlas-runtime/head-neck/';
  const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
  const bytes=readFileSync(base+'manifest.json');
  assert.equal(sha(bytes),'04288e0089e8e802949661a93acafaa5b29efbe825a427322aa6bc2672e561f1');
  const manifest=JSON.parse(bytes.toString());
  assert.equal(manifest.sourceCommit,'e4a2eb560e8e586164a5eca9a2a8dfa658d24a8d');
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,sha256] of [
    ['app/body-content.ts','a974be279f6dc96660d838fa0323f5ccbf48104d536fba688e141de3159dac71'],
    ['content/hip-abductor-xray.ts','cbec6faa8e72189f423c3a76fdddb876b9fb1eb8579aa02629f03c187663a691'],
    ['lib/hip-abductor-xray.ts','1c5829f35585e0097025bac08f8159ea519a119ee7ae493235b5b2fc4c94be8a'],
  ])assert.deepEqual(inputs.filter(i=>i.path===path),[{path,sha256}]);
  const files=manifest.files as {path:string;sha256:string}[];
  assert.deepEqual(inputs.filter(f=>f.path.startsWith('scripts/')).map(f=>f.path),[
    'scripts/export-head-neck-module.mjs','scripts/export-space-preflight.mjs','scripts/head-neck-module-inputs.mjs','scripts/independent-source-contract.mjs',
  ]);
  assert(!inputs.some(f=>/\.before\.json|\.transition\.json|\.local\//.test(f.path)));
  assert(!files.some(f=>/ct-handoff|lacrimal-drainage-imaging-history|\.local\//.test(f.path)));
  const chunk=emittedTeaching(base,files);
  for(const marker of ['Use the ilium and greater trochanter','Relate the selected gluteus minimus','does not establish an intact abductor tendon','Anatomy/radiology review pending'])
    assert(chunk.toString().includes(marker),marker);
  for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
});
