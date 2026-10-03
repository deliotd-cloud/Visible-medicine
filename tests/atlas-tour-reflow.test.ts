import assert from 'node:assert/strict';
import {withoutEyeCrossSectionalNotice} from './atlas-eye-notice-history.ts';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {desktopLayoutImportMilestone} from './atlas-cubital-ultrasound-history.ts';

test('tour title reflow ships matching learner/review styles without changing anatomy or teaching',()=>{
 const json=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
 const previous=(p:string)=>JSON.parse(execFileSync('git',['show','047d488a:'+p],{encoding:'utf8',maxBuffer:32e6}));
 const review=json('atlas-review/manifest.json'),before=previous('atlas-review/manifest.json');
 assert.equal(review.revision,'6e134825dd189873d60846cacdc98a11983d6d16');
 // Keep the exact historical reflow delta pinned to its delivered commit;
 // subsequent independently reviewed runtime fixes advance the current import.
 const reflow=JSON.parse(execFileSync('git',['show','1727b2e3:atlas-review/manifest.json'],{encoding:'utf8',maxBuffer:32e6}));
 assert.equal(reflow.revision,'7dd7f5cfe4690ca1e5542107e52f97fa5142865f');
 assert.deepEqual(reflow.files.filter((f:any)=>before.files.find((p:any)=>p.path===f.path)?.sourceSha256!==f.sourceSha256).map((f:any)=>f.path).sort(),['app/whole-body-guided-learning.css','content/body-renderer-revision.json']);
 assert.deepEqual(desktopLayoutImportMilestone().files.map((f:any)=>f.path).sort(),[...before.files.map((f:any)=>f.path),'lib/renal-tour.ts','lib/tarsal-tour.ts','lib/lower-limb-bone-tour.ts','lib/upper-limb-bone-tour.ts',
  'content/body-review-display-pins.json','lib/body-review-display-evidence.ts','lib/body-review-display-integrity.ts',
  'lib/hra-pelvic-guided-dissection.ts','lib/hra-renal-guided-dissection.ts','lib/specimen-guided-dissection.ts',
  'lib/um-limb-guided-dissection.ts','lib/um-proximal-guided-dissection.ts','lib/um-distal-guided-dissection.ts',
  'lib/abdominal-guided-dissection.ts','lib/back-guided-dissection.ts',
  'content/abdominal-bone-teaching.ts','content/eye-cross-sectional-teaching.ts','content/nested-ct-orientation.ts','lib/pelvic-ring-tour.ts','lib/nested-review-queue.ts','lib/eye-layer-guide.ts','lib/nested-guided-learning.ts','content/nested-guided-learning-bindings.v1.json',
  'content/um-proximal-topic-completion.ts','content/um-distal-topic-completion.ts','content/um-limb-modality-references.ts',
  ...['foot-sesamoid-teaching','cerebellar-mca-imaging','tentorium-imaging','cranial-bone-quiz'].flatMap(kind=>['lib/'+kind+'.ts','content/'+kind+'.ts','content/'+kind+'-pins.json'])].sort());
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
  const currentNotice=withoutEyeCrossSectionalNotice(readFileSync(notice,'utf8').replaceAll('\r',''));
  const retainedNotice=execFileSync('git',['show','c0da7e2bf6a9f6f3e262b8c5326c369e5e6cafd2:'+notice],{encoding:'utf8'}).replaceAll('\r','');
  const renalNotice=execFileSync('git',['show','abfd5cf175f2b28417f43a34d34c3c730b453a4e:'+notice],{encoding:'utf8'}).replaceAll('\r','');
  const backNotice=execFileSync('git',['show','1377cba878403777924a82515a12faedb679363d:'+notice],{encoding:'utf8'}).replaceAll('\r','');
  assert.ok(renalNotice.startsWith(retainedNotice),'Entire wall/back notice retained byte-for-byte');
  assert.match(renalNotice.slice(retainedNotice.length),/^\n## Renal source-guided learning and abdominal skeletal drafts \(1 October 2026\)\n/);
  assert.ok(backNotice.startsWith(renalNotice),'Entire preceding renal notice retained byte-for-byte');
  assert.match(backNotice.slice(renalNotice.length),/^\n## Back-specimen teaching completion \(1 October 2026\)\n/);
  assert.ok(currentNotice.startsWith(backNotice),'Entire preceding back notice retained byte-for-byte');
  assert.match(currentNotice.slice(backNotice.length),/^\n## HRA renal modality-topic completion \(1 October 2026\)\n/);
  const completedRenalNotice=execFileSync('git',['show','afca2757914d0fc35af577fe1d736caf8549a99f:'+notice],{encoding:'utf8'}).replaceAll('\r','');
  assert.ok(completedRenalNotice.startsWith(backNotice),'Entire preceding back and renal notices retained byte-for-byte');
  assert.ok(currentNotice.startsWith(completedRenalNotice),'Entire preceding renal notice retained byte-for-byte');
  assert.match(currentNotice.slice(completedRenalNotice.length),/^\n## HRA pelvic modality-topic completion \(1 October 2026\)\n/);
  const beforeWallBack=retainedNotice.replace(/^# Third-party notices\n\n## Abdominal wall and back source-guided dissection \(1 October 2026\)\n[\s\S]+?\n(?=## )/,'# Third-party notices\n\n');
  assert.equal(beforeWallBack,execFileSync('git',['show','c5448a86:'+notice],{encoding:'utf8'}).replaceAll('\r',''),'Historical wall/back notice was the only earlier addition');
  assert.ok(beforeWallBack.startsWith(earlier),'All earlier notices retained');
  for(const flag of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection'])assert.equal(manifest[flag],false);
 }
 const learner=json('public/atlas-runtime/head-neck/manifest.json');
 const bundled=learner.files.filter((f:any)=>f.path.endsWith('.css')).map((f:any)=>readFileSync('public/atlas-runtime/head-neck/'+f.path,'utf8')).join('\n');
 assert.match(bundled,/\.whole-body-tour-picker button\{[^}]*height:auto/);
 assert.match(bundled,/-webkit-line-clamp:unset/);
 assert.deepEqual(json('lib/atlas-model-inventory.json').models,previous('lib/atlas-model-inventory.json').models);
});
