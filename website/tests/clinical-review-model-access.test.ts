import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const historical='F:/VisibleMedicine/staging/20261016-isolated-atlas-integration/canonical-original/';
const revision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const sha=(value:Uint8Array|string)=>createHash('sha256').update(value).digest('hex');
assert.equal(sha(readFileSync(new URL('./fixtures/access-feedback-before-20261017/clinical-review-model-access.test.ts.txt',import.meta.url))),'b3fe47762d9fad22882dc0e615ba8af774242959f0d0dedfbb14df06928b50b4');
const read=(root:string,path:string)=>JSON.parse(readFileSync(root+path,'utf8'));
const source=(revision:string,path:string)=>execFileSync('git',['--no-replace-objects','-C',currentAtlasDeliveryRoot(),'show',revision+':'+path],{maxBuffer:32e6});

function check(root:string,sourceRevision:string){
 const base='public/atlas-runtime/head-neck/';
 const learner=read(root,base+'manifest.json'),review=read(root,'atlas-review/manifest.json');
 const inputs=read(root,base+'source-inputs.json'),renderer=read(root,'atlas-review/content/body-renderer-revision.json');
 assert.equal(learner.sourceCommit,sourceRevision);assert.equal(review.revision,learner.sourceCommit);
 for(const path of ['lib/model-load-failure.ts','app/body-scene.tsx','app/body-explorer.tsx','app/ventricles.tsx','app/regional-guided-learning.tsx']){
  const original=source(sourceRevision,path),originalHash=sha(original);
  const sourceInput=inputs.find((f:{path:string})=>f.path===path),imported=review.files.find((f:{path:string})=>f.path===path);
  assert(sourceInput&&imported);assert.equal(sourceInput.sha256,originalHash);assert.equal(imported.sourceSha256,originalHash);
  const code=readFileSync(root+'atlas-review/'+path,'utf8');
  assert.equal(sha(code),imported.importedSha256);
  // Review routes/aliases are transformed by the audited importer; the source
  // and imported digests intentionally describe different byte sequences.
  // The renderer generator hashes LF-normalized source text, not raw Git bytes.
  assert.equal(renderer.dependencies.find((f:{path:string})=>f.path===path)?.sha256,sha(Buffer.from(original).toString('utf8').replace(/\r\n/g,'\n')));
 }
 const guided=readFileSync(root+'atlas-review/app/regional-guided-learning.tsx','utf8');
 assert(guided.includes('modelLoadAccessNotice(failed.map'));
 assert(guided.includes('setFailureReasons({})'));
 assert(guided.includes("accessNotice?.retryLabel??'Retry missing anatomy'"));
 const bundleText=(path:string,manifest:{files:{path:string;sha256:string}[]})=>manifest.files.filter(f=>f.path.endsWith('.js')).map(f=>{
  const bytes=readFileSync(root+path+f.path);assert.equal(sha(bytes),f.sha256);return bytes.toString();
 }).join('\n');
 const reviewViewer=read(root,'public/atlas-review-viewer/manifest.json');
 assert.equal(reviewViewer.sourceCommit,sourceRevision);
 for(const text of [bundleText(base,learner),bundleText('public/atlas-review-viewer/',reviewViewer)])
  for(const copy of ['Some model files require sign-in.','The website refused access to some model files.','Check access again','The 3D view is recovering. Playback remains paused until it is ready.'])assert(text.includes(copy),copy);
 assert.equal(learner.clinicalApproved,false);assert.equal(learner.patientDataIncluded,false);
}

test('historical exact-model access notices retain their source and emitted proof',()=>{
 assert.equal(sha(readFileSync(historical+'public/atlas-runtime/head-neck/manifest.json')),'09189d13a033c9c251de2a21672b3d34fbc32fc743cdaf439bffa450e47ef34b');
 assert.equal(sha(readFileSync(historical+'public/atlas-runtime/head-neck/source-inputs.json')),'51810a1c996c188141fec6467dfd0ff2ef6d79062e0797908f63aeac49bd3579');
 assert.equal(sha(readFileSync(historical+'atlas-review/manifest.json')),'8647dbb18e0f5b9f568ce0d630ea66c5761f7de052cec1883e8c46b756050603');
 assert.equal(sha(readFileSync(historical+'public/atlas-review-viewer/manifest.json')),'2b472c6b5af1ce91334d23ca2c7fd2c215b036ed80271c4869357113893a9805');
 assert.equal(sha(readFileSync(historical+'atlas-review/content/body-renderer-revision.json')),'8e10d053925c3313fb0a03c7a3b9cb8a4751d06417e409a1b5bc5947fa89cf31');
 check(historical,revision);
});

test('current exact-model access notices follow the closed delivery',()=>{
 assert.equal(validateCurrentAtlasDelivery().source,CURRENT_ATLAS_REVISION);
 check('',CURRENT_ATLAS_REVISION);
});
