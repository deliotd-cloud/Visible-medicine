import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const historical='F:/VisibleMedicine/staging/20261016-isolated-atlas-integration/canonical-original/';
const revision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const expected=new Map([
 ['app/anatomy-scene.tsx','1d516e2d8d5bedca20f2cd97010e872af929bf2546ab95014bc3426f69ce2a0f'],
 ['lib/model-load-failure.ts','c9f7e0dbc6ebeaf8bfd758373c04ecd3bcccdf2394e77861e1a263fc1b7c9814'],
]);
const read=(root:string,path:string)=>JSON.parse(readFileSync(root+path,'utf8'));
const sha=(value:Uint8Array)=>createHash('sha256').update(value).digest('hex');
assert.equal(sha(readFileSync(new URL('./fixtures/access-feedback-before-20261017/atlas-shoulder-access.test.ts.txt',import.meta.url))),'1e28076a13557fb8680047c95c7ecfa326168612ccdf4e8e83d1abcc136dae79');
const source=(revision:string,path:string)=>execFileSync('git',['--no-replace-objects','-C',currentAtlasDeliveryRoot(),'show',revision+':'+path],{maxBuffer:32e6});

function check(root:string,sourceRevision:string,historic:boolean){
 const base='public/atlas-runtime/shoulder/',learner=read(root,base+'manifest.json');
 const review=read(root,'atlas-review/manifest.json'),viewer=read(root,'public/atlas-review-viewer/manifest.json');
 const inputs=read(root,base+'source-inputs.json'),pins=read(root,'atlas-review/content/review-revisions.json');
 assert.equal(learner.sourceCommit,sourceRevision);assert.equal(review.revision,sourceRevision);assert.equal(viewer.sourceCommit,sourceRevision);
 for(const [path,oldHash]of expected){
  const hash=historic?oldHash:sha(source(sourceRevision,path));
  if(historic)assert.equal(sha(source(sourceRevision,path)),oldHash,'Immutable Atlas source: '+path);
  assert.equal(inputs.find((f:{path:string})=>f.path===path)?.sha256,hash);
  const imported=review.files.find((f:{path:string})=>f.path===path);
  assert.equal(imported?.sourceSha256,hash);assert.equal(sha(readFileSync(root+'atlas-review/'+path)),imported.importedSha256);
  assert.equal(new Map(pins.display).get(path),hash);
 }
 for(const [path,manifest]of [[base,learner],['public/atlas-review-viewer/',viewer]] as const){
  const text=manifest.files.filter((f:{path:string})=>f.path.endsWith('.js')).map((f:{path:string;sha256:string})=>{
   const bytes=readFileSync(root+path+f.path);assert.equal(sha(bytes),f.sha256);return bytes.toString();
  }).join('\n');
  for(const copy of ['Some model files require sign-in.','The website refused access to some model files.','Check access again','Retry shoulder anatomy'])assert(text.includes(copy),copy);
 }
 assert.equal(learner.clinicalApproved,false);assert.equal(learner.patientDataIncluded,false);
}

test('historical shoulder access feedback keeps its exact source and emitted proof',()=>{
 assert.equal(sha(readFileSync(historical+'public/atlas-runtime/shoulder/manifest.json')),'3785e32f575d83a5c71bc3caa2f74a0810877a7f33d844a41049ce94cc145cbe');
 assert.equal(sha(readFileSync(historical+'public/atlas-runtime/shoulder/source-inputs.json')),'89fa71285f1d616a69f7069510623ed4e8de558c1933edce4bd834b6fdb9733a');
 assert.equal(sha(readFileSync(historical+'atlas-review/manifest.json')),'8647dbb18e0f5b9f568ce0d630ea66c5761f7de052cec1883e8c46b756050603');
 assert.equal(sha(readFileSync(historical+'public/atlas-review-viewer/manifest.json')),'2b472c6b5af1ce91334d23ca2c7fd2c215b036ed80271c4869357113893a9805');
 assert.equal(sha(readFileSync(historical+'atlas-review/content/review-revisions.json')),'5010e3656b9757e5674dc54f0e902c03b6d841a5d6e1ca1d24e20d015f30e6c9');
 check(historical,revision,true);
});

test('current shoulder access feedback follows the closed delivery',()=>{
 assert.equal(validateCurrentAtlasDelivery().source,CURRENT_ATLAS_REVISION);
 check('',CURRENT_ATLAS_REVISION,false);
});
