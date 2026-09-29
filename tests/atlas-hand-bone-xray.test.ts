import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';

test('hand bone X-ray drafts ship their exact source-bound implementation without history or scan data',()=>{
  const base='public/atlas-runtime/head-neck/';
  const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
  const bytes=readFileSync(base+'manifest.json');
  assert.equal(sha(bytes),'6565ac859dd3aeaa39b88887e1021dea0cc4613bb74762b52de2500be58d5c05');
  const manifest=JSON.parse(bytes.toString());
  assert.equal(manifest.sourceCommit,'8386fa7e3c17c7a6da67d6a511604e95f31fdebb');
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,sha256] of [
    ['app/body-content.ts','a974be279f6dc96660d838fa0323f5ccbf48104d536fba688e141de3159dac71'],
    ['content/hand-bone-xray.ts','624460d95748280d06636823375e34fb2779e68f235f6064198268d9430bee6d'],
    ['lib/hand-bone-xray.ts','3c2149eca9c8bcaa380f10feb48363dfaff58828c6400c5f88c8011c0a0417ef'],
  ])assert.deepEqual(inputs.filter(i=>i.path===path),[{path,sha256}]);
  const files=manifest.files as {path:string;sha256:string}[];
  assert.deepEqual(inputs.filter(f=>f.path.startsWith('scripts/')).map(f=>f.path),[
    'scripts/export-head-neck-module.mjs','scripts/export-space-preflight.mjs','scripts/head-neck-module-inputs.mjs','scripts/independent-source-contract.mjs',
  ]);
  assert(!inputs.some(f=>/\.before\.json|\.transition\.json|\.local\//.test(f.path)));
  assert(!files.some(f=>/ct-handoff|lacrimal-drainage-imaging-history|\.local\//.test(f.path)));
  const chunks=files.filter(f=>/\/slider-[^/]+\.js$/.test(f.path));
  assert.equal(chunks.length,1);
  const chunk=readFileSync(base+chunks[0].path);assert.equal(sha(chunk),chunks[0].sha256);
  for(const marker of ['Trace the first metacarpal','A middle phalanx lies between the PIP','The thumb distal phalanx','No radiograph or spatial registration is supplied','Anatomy/radiology review pending'])
    assert(chunk.toString().includes(marker),marker);
  for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
});
