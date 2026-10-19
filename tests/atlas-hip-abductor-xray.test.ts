import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import test from 'node:test';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
import {currentAtlasDeliveryRoot,CURRENT_ATLAS_REVISION} from './current-atlas-delivery.mjs';

test('hip abductor X-ray drafts ship their exact source-bound implementation without history or scan data',()=>{
  const base='public/atlas-runtime/head-neck/';
  const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
  const epoch='f2f7adbb34af7d7a3bb9affa3ada082fe423ecf6';
  const archived=(path:string)=>execFileSync('git',['show',`${epoch}:${path}`],{maxBuffer:32e6});
  const bytes=archived(base+'manifest.json');
  assert.equal(sha(bytes),'eaaf8eb1d53dc3728e07a5f3497a4a7c8018afdf0838f5b90a313282d77a2381');
  const manifest=JSON.parse(bytes.toString());
  assert.equal(manifest.sourceCommit,'88cea927d48729769b96ad8fe680b0872b7e6687');
  const inputs=JSON.parse(archived(base+'source-inputs.json').toString()) as {path:string;sha256:string}[];
  for(const [path,sha256] of [
    ['app/body-content.ts','4df58aeec6728cefb67332fd9578f9c4e66ec204ec92d10690b9bd9b75b019d8'],
    ['content/hip-abductor-xray.ts','cbec6faa8e72189f423c3a76fdddb876b9fb1eb8579aa02629f03c187663a691'],
    ['lib/hip-abductor-xray.ts','1c5829f35585e0097025bac08f8159ea519a119ee7ae493235b5b2fc4c94be8a'],
  ])assert.deepEqual(inputs.filter(i=>i.path===path),[{path,sha256}]);
  const files=manifest.files as {path:string;sha256:string}[];
  assert.deepEqual(inputs.filter(f=>f.path.startsWith('scripts/')).map(f=>f.path),[
    'scripts/export-head-neck-module.mjs','scripts/export-space-preflight.mjs','scripts/head-neck-module-inputs.mjs','scripts/independent-source-contract.mjs',
  ]);
  assert(!inputs.some(f=>/\.before\.json|\.transition\.json|\.local\//.test(f.path)));
  assert(!files.some(f=>/ct-handoff|lacrimal-drainage-imaging-history|\.local\//.test(f.path)));
  const chunk=files.filter(f=>f.path.endsWith('.js')).map(f=>{
    const emitted=archived(base+f.path);
    assert.equal(sha(emitted),f.sha256,`${f.path}: exact historical emitted bytes`);
    return emitted.toString();
  }).join('\n');
  for(const marker of ['Use the ilium and greater trochanter','Relate the selected gluteus minimus','does not establish an intact abductor tendon','Anatomy/radiology review pending'])
    assert(chunk.toString().includes(marker),marker);
  for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);

  const currentBytes=readFileSync(base+'manifest.json');
  const current=JSON.parse(currentBytes.toString());
  assert.equal(current.sourceCommit,CURRENT_ATLAS_REVISION);
  const currentInputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const path of ['app/body-content.ts','content/hip-abductor-xray.ts','lib/hip-abductor-xray.ts']){
    const committed=execFileSync('git',['-C','F:/VisibleMedicine/atlas','show',`${CURRENT_ATLAS_REVISION}:${path}`],{maxBuffer:32e6});
    assert.deepEqual(currentInputs.filter(row=>row.path===path),[{path,sha256:sha(committed)}],
      `${path}: exact current source input`);
    if(path!=='app/body-content.ts')assert.equal(sha(committed),
      inputs.find(row=>row.path===path)?.sha256,`${path}: historical feature source retained`);
  }
  const currentChunk=emittedTeaching(base,current.files as {path:string;sha256:string}[],true);
  for(const marker of ['Use the ilium and greater trochanter','Relate the selected gluteus minimus','does not establish an intact abductor tendon','Anatomy/radiology review pending'])
    assert(currentChunk.includes(marker),`${marker}: current emitted teaching`);
  for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])
    assert.equal(current[flag],false,`current ${flag}`);
});

test('current delivery source admission matches Atlas HEAD',()=>{assert(currentAtlasDeliveryRoot());});
