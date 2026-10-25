import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import test from 'node:test';

test('regional delivery includes verified nested answer focus with clinical and imaging gates closed',()=>{
  const pin=validateCurrentAtlasDelivery();
  assert.equal(pin.source,CURRENT_ATLAS_REVISION);
  const base='public/atlas-runtime/head-neck/';
  const bytes=readFileSync(base+'manifest.json');
  const manifest=JSON.parse(bytes.toString());
  const inventory=JSON.parse(readFileSync('lib/atlas-model-inventory.json','utf8'));
  const registered=inventory.sources.find((s:{module:string})=>s.module==='head-neck');
  assert(registered);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),registered.manifestSha256);
  assert.equal(manifest.sourceCommit,registered.sourceCommit);
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  const path='app/nested-practice.tsx';
  const source=execFileSync('git',['--no-replace-objects','-C',currentAtlasDeliveryRoot(),'show',`${CURRENT_ATLAS_REVISION}:${path}`],{maxBuffer:32e6});
  const sourceHash=createHash('sha256').update(source).digest('hex');
  assert.deepEqual(inputs.filter(i=>i.path==='app/nested-practice.tsx'),[{
    path,sha256:sourceHash,
  }]);
  const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
  const receipt=JSON.parse(readFileSync('atlas-review/integration-inputs.json','utf8'));
  const row=review.files.filter((f:{path:string})=>f.path===path);
  assert.equal(row.length,1);
  assert.equal(review.revision,CURRENT_ATLAS_REVISION);
  assert.equal(row[0].sourceSha256,sourceHash);
  assert.equal(row[0].importedSha256,createHash('sha256').update(readFileSync('atlas-review/'+path)).digest('hex'));
  assert.deepEqual(receipt.inputs.filter((i:{path:string})=>i.path==='atlas-review/'+path),[{path:'atlas-review/'+path,sha256:row[0].importedSha256}]);
  assert.equal(receipt.sourceCommit,CURRENT_ATLAS_REVISION);
  assert.equal(receipt.sha256,review.websiteIntegrationSha256);
  const emitted=manifest.files.filter((f:{path:string})=>/^assets\/[^/]+\.js$/.test(f.path)).filter((f:{path:string;sha256:string})=>{
    const bytes=readFileSync(base+f.path);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),f.sha256,f.path);
    return bytes.includes('Choose once, or skip to reveal the answer.');
  });
  assert.equal(emitted.length,1,'One manifested nested answer-focus chunk');
  const index=manifest.files.find((f:{path:string})=>/^assets\/index-[^/]+\.js$/.test(f.path));
  assert(index);
  const html=manifest.files.find((f:{path:string})=>f.path==='index.html');assert(html);
  const htmlBytes=readFileSync(base+'index.html');
  assert.equal(createHash('sha256').update(htmlBytes).digest('hex'),html.sha256,'Actual manifested HTML entry');
  assert(htmlBytes.includes(index.path),'Actual HTML loads the verified index chunk');
  assert(readFileSync(base+index.path).includes(emitted[0].path),'Nested answer focus reaches the emitted entry graph');
  assert(!inputs.some(i=>/test-nested-practice|\.local\//.test(i.path)));
  for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])
    assert.equal(manifest[flag],false);
});
