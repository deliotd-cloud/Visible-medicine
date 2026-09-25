import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';

test('pulmonary X-ray drafts ship source-bound text without offline history or imaging access',()=>{
  const base='public/atlas-runtime/head-neck/';
  const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
  const bytes=readFileSync(base+'manifest.json');
  const manifest=JSON.parse(bytes.toString());
  const inventory=JSON.parse(readFileSync('lib/atlas-model-inventory.json','utf8'));
  const registered=inventory.sources.find((s:{module:string})=>s.module==='head-neck');
  assert(registered);
  assert.equal(sha(bytes),registered.manifestSha256);
  assert.equal(manifest.sourceCommit,registered.sourceCommit);
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,sha256] of [
    ['content/pulmonary-teaching.ts','0abe50a77f1a4e64eabd51bc2be39a0798ea2aa567625acb5201b58872934b0a'],
    ['content/nested-teaching.ts','7bfb61c51a22046b50c5c411ba09223a5d0536b7adfef07990dd54b6caabbbd8'],
    ['lib/nested-teaching.ts','aa2423a1cc53f70f992c19b601160000d44937eda47faae422d6898902edd23d'],
    ['app/nested-teaching.tsx','502e0a1d13c65875963bc760ca01260bde329368fe6d3bf4162f98cf3de42744'],
  ])assert.deepEqual(inputs.filter(i=>i.path===path),[{path,sha256}]);
  assert.deepEqual(inputs.filter(f=>f.path.startsWith('scripts/')).map(f=>f.path),[
    'scripts/export-head-neck-module.mjs','scripts/head-neck-module-inputs.mjs','scripts/independent-source-contract.mjs',
  ]);
  const files=manifest.files as {path:string;sha256:string}[];
  for(const list of [inputs,files])assert(!list.some(f=>/\.before\.json|\.transition\.json|\.local\/|pulmonary-imaging-stage-history|ct-handoff/.test(f.path)));
  const chunks=files.filter(f=>/^assets\/index-[^/]+\.js$/.test(f.path));
  assert.equal(chunks.length,1);
  const chunk=readFileSync(base+chunks[0].path);
  assert.equal(sha(chunk),chunks[0].sha256);
  for(const marker of [
    'Compare frontal and lateral chest radiographs when learning lobar relationships',
    'The right middle lobe is separated from the upper lobe by the horizontal fissure',
    'The oblique fissure separates each lower lobe from the other lobes on that side',
    'https://ehealth.kcl.ac.uk/tel/radiology/CXR/03-02-lungs.html',
    'https://www.radiologyinfo.org/en/info/chestrad',
    'No scan access or synchronization is provided',
  ])assert(chunk.toString().includes(marker),marker);
  for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
});
