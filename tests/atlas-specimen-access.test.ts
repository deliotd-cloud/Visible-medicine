import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const historical='F:/VisibleMedicine/staging/20261016-isolated-atlas-integration/canonical-original/';
const revision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const expected=new Map([
 ['app/eye-layers.tsx','9abf25778d49814d8ffa637bae3586473bc456424e825b55fe453289657de060'],
 ['app/femoral-components.tsx','9e12401f85e5c3465da8260338c39d78833792465f0b6cccafe424d909ce1ef4'],
 ['app/um-knee-study.tsx','958e48062c92a627d05656746dd11902867671c6e335e6c0ec1803bd41650d78'],
 ['app/um-limb-learning.tsx','0f4c06d9e205aa991112374edab392fe30adfb98f2972788cbfed760a8a8c158'],
]);
const read=(root:string,path:string)=>JSON.parse(readFileSync(root+path,'utf8'));
const sha=(value:Uint8Array)=>createHash('sha256').update(value).digest('hex');
assert.equal(sha(readFileSync(new URL('./fixtures/access-feedback-before-20261017/atlas-specimen-access.test.ts.txt',import.meta.url))),'9ccae36bc1fec9757449bb7262d8f2babe8c41b8c6bcedba8493369a8d3b0e45');
const source=(revision:string,path:string)=>execFileSync('git',['--no-replace-objects','-C',currentAtlasDeliveryRoot(),'show',revision+':'+path],{maxBuffer:32e6});

function check(root:string,sourceRevision:string,historic:boolean){
 const base='public/atlas-runtime/head-neck/',learner=read(root,base+'manifest.json');
 const review=read(root,'atlas-review/manifest.json'),viewer=read(root,'public/atlas-review-viewer/manifest.json');
 const inputs=read(root,base+'source-inputs.json'),renderer=read(root,'atlas-review/content/body-renderer-revision.json');
 assert.equal(learner.sourceCommit,sourceRevision);assert.equal(review.revision,sourceRevision);assert.equal(viewer.sourceCommit,sourceRevision);
 for(const [path,oldHash]of expected){
  const hash=historic?oldHash:sha(source(sourceRevision,path));
  if(historic)assert.equal(sha(source(sourceRevision,path)),oldHash,'Immutable Atlas source: '+path);
  assert.equal(inputs.find((f:{path:string})=>f.path===path)?.sha256,hash);
  assert.equal(renderer.dependencies.find((f:{path:string})=>f.path===path)?.sha256,hash);
  const imported=review.files.find((f:{path:string})=>f.path===path);
  assert.equal(imported?.sourceSha256,hash);assert.equal(sha(readFileSync(root+'atlas-review/'+path)),imported.importedSha256);
 }
 for(const [path,manifest]of [[base,learner],['public/atlas-review-viewer/',viewer]] as const){
  const code=manifest.files.filter((f:{path:string})=>f.path.endsWith('.js')).map((f:{path:string;sha256:string})=>{
   const bytes=readFileSync(root+path+f.path);assert.equal(sha(bytes),f.sha256);return bytes.toString();
  }).join('\n');
  for(const copy of ['Some model files require sign-in.','The website refused access to some model files.','Check access again','Return to dissection to retry.'])assert(code.includes(copy),copy);
 }
 const arterial=readFileSync(root+'atlas-review/app/femoral-components.tsx','utf8');
 assert(arterial.includes('setFailureReason(reason)'));
 assert(!arterial.includes("setHealth('starting')"),'Asset retry must not invent a canvas restart');
 assert.equal(learner.clinicalApproved,false);assert.equal(learner.patientDataIncluded,false);
}

test('historical specimen feedback and retry keep exact source and emitted proof',()=>{
 assert.equal(sha(readFileSync(historical+'public/atlas-runtime/head-neck/manifest.json')),'09189d13a033c9c251de2a21672b3d34fbc32fc743cdaf439bffa450e47ef34b');
 assert.equal(sha(readFileSync(historical+'public/atlas-runtime/head-neck/source-inputs.json')),'51810a1c996c188141fec6467dfd0ff2ef6d79062e0797908f63aeac49bd3579');
 assert.equal(sha(readFileSync(historical+'atlas-review/manifest.json')),'8647dbb18e0f5b9f568ce0d630ea66c5761f7de052cec1883e8c46b756050603');
 assert.equal(sha(readFileSync(historical+'public/atlas-review-viewer/manifest.json')),'2b472c6b5af1ce91334d23ca2c7fd2c215b036ed80271c4869357113893a9805');
 assert.equal(sha(readFileSync(historical+'atlas-review/content/body-renderer-revision.json')),'8e10d053925c3313fb0a03c7a3b9cb8a4751d06417e409a1b5bc5947fa89cf31');
 check(historical,revision,true);
});

test('current specimen feedback and retry follow the closed delivery',()=>{
 assert.equal(validateCurrentAtlasDelivery().source,CURRENT_ATLAS_REVISION);
 check('',CURRENT_ATLAS_REVISION,false);
});
