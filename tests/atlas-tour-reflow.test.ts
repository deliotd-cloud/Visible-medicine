import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

test('tour title reflow ships matching learner/review styles without changing anatomy or teaching',()=>{
 const json=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
 const previous=(p:string)=>JSON.parse(execFileSync('git',['show','047d488a:'+p],{encoding:'utf8',maxBuffer:32e6}));
 const review=json('atlas-review/manifest.json'),before=previous('atlas-review/manifest.json');
 assert.equal(review.revision,'8cfd73cda5077ea608720c3c4d88d8e51371e2ef');
 // Keep the exact historical reflow delta pinned to its delivered commit;
 // subsequent independently reviewed runtime fixes advance the current import.
 const reflow=JSON.parse(execFileSync('git',['show','1727b2e3:atlas-review/manifest.json'],{encoding:'utf8',maxBuffer:32e6}));
 assert.equal(reflow.revision,'7dd7f5cfe4690ca1e5542107e52f97fa5142865f');
 assert.deepEqual(reflow.files.filter((f:any)=>before.files.find((p:any)=>p.path===f.path)?.sourceSha256!==f.sourceSha256).map((f:any)=>f.path).sort(),['app/whole-body-guided-learning.css','content/body-renderer-revision.json']);
 assert.deepEqual(review.files.map((f:any)=>f.path).sort(),[...before.files.map((f:any)=>f.path),'lib/renal-tour.ts','lib/tarsal-tour.ts','lib/lower-limb-bone-tour.ts',
  'content/body-review-display-pins.json','lib/body-review-display-evidence.ts','lib/body-review-display-integrity.ts',
  ...['foot-sesamoid-teaching','cerebellar-mca-imaging','tentorium-imaging'].flatMap(kind=>['lib/'+kind+'.ts','content/'+kind+'.ts','content/'+kind+'-pins.json'])].sort());
 const path='app/whole-body-guided-learning.css',css=readFileSync('atlas-review/'+path,'utf8'),entry=review.files.find((f:any)=>f.path===path);
 assert.equal(createHash('sha256').update(css).digest('hex'),entry.importedSha256);
 assert.match(css,/height:auto;/);assert.match(css,/-webkit-line-clamp:unset;/);
 const inputs=json('public/atlas-runtime/head-neck/source-inputs.json');
 assert.equal(inputs.find((f:any)=>f.path===path)?.sha256,entry.sourceSha256);
 for(const module of ['head-neck','shoulder']){
  const prefix='public/atlas-runtime/'+module+'/',manifest=json(prefix+'manifest.json'),old=previous(prefix+'manifest.json');
  assert.equal(manifest.sourceCommit,review.revision);
  assert.deepEqual(manifest.modelBundles,old.modelBundles);assert.deepEqual(manifest.regionalScopes,old.regionalScopes);
  // Original-prose reference notices may be appended by later teaching slices;
  // dependency notices and original geometry/credits must remain byte-identical.
  const retained=(f:any)=>f.path.endsWith('.glb')||f.path==='BUNDLED_NOTICES.txt'||f.path.includes('credits')||f.path==='bundled-dependencies.json';
  assert.deepEqual(manifest.files.filter(retained),old.files.filter(retained));
  const notice=prefix+'LICENSES/THIRD_PARTY_NOTICES.md';
  const earlier=execFileSync('git',['show','047d488a:'+notice],{encoding:'utf8'}).replaceAll('\r','');
  assert.ok(readFileSync(notice,'utf8').replaceAll('\r','').startsWith(earlier),'All earlier notices retained');
  for(const flag of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection'])assert.equal(manifest[flag],false);
 }
 const learner=json('public/atlas-runtime/head-neck/manifest.json');
 const bundled=learner.files.filter((f:any)=>f.path.endsWith('.css')).map((f:any)=>readFileSync('public/atlas-runtime/head-neck/'+f.path,'utf8')).join('\n');
 assert.match(bundled,/\.whole-body-tour-picker button\{[^}]*height:auto/);
 assert.match(bundled,/-webkit-line-clamp:unset/);
 assert.deepEqual(json('lib/atlas-model-inventory.json').models,previous('lib/atlas-model-inventory.json').models);
});
