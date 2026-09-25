import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';

test('hip abductor X-ray drafts ship their exact source-bound implementation without history or scan data',()=>{
  const base='public/atlas-runtime/head-neck/';
  const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
  const bytes=readFileSync(base+'manifest.json');
  assert.equal(sha(bytes),'162e12a35c6e34b4b4c9f0306690fbae882be2f42de302676bca932d2920787c');
  const manifest=JSON.parse(bytes.toString());
  assert.equal(manifest.sourceCommit,'0cdca340b7a4b67b387389a0fa794e5d36d547e7');
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,sha256] of [
    ['app/body-content.ts','eeb30dc9fbd8646dd016c2644e617abfd370f5b48d98fdcdcef2a9e2fbd10fe2'],
    ['content/hip-abductor-xray.ts','cbec6faa8e72189f423c3a76fdddb876b9fb1eb8579aa02629f03c187663a691'],
    ['lib/hip-abductor-xray.ts','1c5829f35585e0097025bac08f8159ea519a119ee7ae493235b5b2fc4c94be8a'],
  ])assert.deepEqual(inputs.filter(i=>i.path===path),[{path,sha256}]);
  const files=manifest.files as {path:string;sha256:string}[];
  assert.deepEqual(inputs.filter(f=>f.path.startsWith('scripts/')).map(f=>f.path),[
    'scripts/export-head-neck-module.mjs','scripts/head-neck-module-inputs.mjs','scripts/independent-source-contract.mjs',
  ]);
  assert(!inputs.some(f=>/\.before\.json|\.transition\.json|\.local\//.test(f.path)));
  assert(!files.some(f=>/ct-handoff|lacrimal-drainage-imaging-history|\.local\//.test(f.path)));
  const chunks=files.filter(f=>/\/slider-[^/]+\.js$/.test(f.path));
  assert.equal(chunks.length,1);
  const chunk=readFileSync(base+chunks[0].path);assert.equal(sha(chunk),chunks[0].sha256);
  for(const marker of ['Use the ilium and greater trochanter','Relate the selected gluteus minimus','does not establish an intact abductor tendon','Anatomy/radiology review pending'])
    assert(chunk.toString().includes(marker),marker);
  for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
});
