import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const revision=CURRENT_ATLAS_REVISION;
const atlasRoot=currentAtlasDeliveryRoot();
const expected=new Map([
 ['app/scene-label-layer.tsx','8e6ce78a2c26a305bc9d491b660a8f3c9ed9578e1f4983dbf75c3a4d3fe61be8'],
 ['lib/scene-label-focus.ts','469ad6a6517bab66ea2c50ae445c489d62fb62f706e067220c484d857cb76f0d'],
]);
const read=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const sha=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
const parent='7d77c973aab2a7135635ab2e65a2831f3e7d22c4';
const preToolbar='51de4546a0b33a1ce93bfec4c9c43f760bf82b4e';
const preSource190='5c7ed0612f94b9a3ad99d9e49566c655495b98a6';
const sourceBytes=(commit:string,path:string)=>execFileSync('git',['show',`${commit}:${path}`],{cwd:atlasRoot,windowsHide:true,maxBuffer:32e6,
 env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});

test('all four learner runtimes deliver the reviewed screen-position keyboard implementation',()=>{
 const pin=validateCurrentAtlasDelivery();
 for(const module of ['head-neck','shoulder','lower-limb','female-pelvis']){
  const root='public/atlas-runtime/'+module,manifest=read(root+'/manifest.json');
  assert.equal(manifest.sourceCommit,pin.runtimeSources[module],module);assert.equal(manifest.clinicalApproved,false);
  assert.equal(manifest.patientDataIncluded,false);
  const inputs=read(root+'/source-inputs.json');
  for(const [path,hash] of expected)assert.equal(inputs.find((f:{path:string})=>f.path===path)?.sha256,hash,module+': '+path);
  const code=manifest.files.filter((f:{path:string})=>f.path.endsWith('.js')).map((f:{path:string;sha256:string})=>{
   const bytes=readFileSync(root+'/'+f.path);assert.equal(sha(bytes),f.sha256);return bytes.toString();
  }).join('\n');
  assert(code.includes('Use arrow keys to move between visible labels'));
  assert(code.includes('ArrowUp ArrowDown ArrowLeft ArrowRight Home End'));
  assert(code.includes('getBoundingClientRect')&&code.includes('isComposing'));
 }
});

test('protected Review uses the same keyboard source and revised shoulder display bindings',()=>{
 const manifest=read('atlas-review/manifest.json');assert.equal(manifest.revision,revision);
 for(const [path,hash] of expected){
  const file=manifest.files.find((f:{path:string})=>f.path===path);
  assert.equal(file?.sourceSha256,hash);
  assert.equal(sha(sourceBytes(revision,path)),hash,'committed Atlas label source');
  assert.equal(sha(readFileSync('atlas-review/'+path)),file?.importedSha256,'protected Review import');
 }
 const source=read('atlas-review/content/review-revisions.json');
 for(const [path,hash] of expected)assert.equal(new Map(source.display).get(path),hash);
 const id='vm:anatomy:upper-limb:shoulder:right:bone:scapula';
 // Regenerated shoulder display binding includes regional teaching delivery;
 // source model bytes and teaching remain unchanged.
 assert.equal(new Map(source.display).get('app/imaging-link.tsx'),
  '34fdad522b0b2d4a7facf925c6c7a67ee77dbad1fcba57878c52bed34892eb84');
 const committed=JSON.parse(sourceBytes(revision,'content/review-revisions.json').toString());
 const prior=JSON.parse(sourceBytes(parent,'content/review-revisions.json').toString());
 const preToolbarSource=JSON.parse(sourceBytes(preToolbar,'content/review-revisions.json').toString());
 const preSource190Revision=JSON.parse(sourceBytes(preSource190,'content/review-revisions.json').toString());
 const ae84KeyboardSource=JSON.parse(sourceBytes('6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1','content/review-revisions.json').toString());
 assert.equal(preToolbarSource.revisions[id].geometry,
  '4951765b13c67738acaea60f32416954384b08e762dd9fbaeb36842abf3b9fe8',
  'Original keyboard-era shoulder geometry remains pinned at its immutable source commit');
 assert.equal(preToolbarSource.revisions[id].teaching,
  '7b9dfb26d73375a22ed0f55e076bb4a45abf807acdcdfe53d43cf7bf2fee78d2',
  'Original keyboard-era shoulder teaching remains pinned');
 assert.equal(preSource190Revision.revisions[id].geometry,
  '1f133c87b46363382545b5919ddab0bf98777e484b8b76f1210b9e849492203b',
  'Previous committed shoulder display geometry remains pinned at its source commit');
 assert.equal(ae84KeyboardSource.revisions[id].geometry,
  '00067d00809923231bb91f559c1f8e737c6e6a36d1259c9584ee7880e79eae54',
  'Original ae84 shoulder display geometry remains pinned at its immutable source');
 assert.equal(source.sourceRevisions[id].geometry,committed.revisions[id].geometry);
 assert.equal(prior.revisions[id].geometry,'05edd30a1f8afb5c3f5bb7e889e1228e042a50be1010227d4dff5ced8a010188');
 assert.equal(prior.revisions[id].teaching,'7b9dfb26d73375a22ed0f55e076bb4a45abf807acdcdfe53d43cf7bf2fee78d2');
 assert.equal(source.sourceRevisions[id].teaching,
  'b0fea14f4dcc531cb8f39f98c1eb9b426831cc778c443f1fc3df63d68039afe2');
 assert.equal(source.sourceRevisions[id].teaching,committed.revisions[id].teaching);
 assert.deepEqual(sourceBytes(revision,'public/models/bodyparts3d/manifest.json'),
  sourceBytes(parent,'public/models/bodyparts3d/manifest.json'),'Source model manifest and mesh hashes stay exact');
 for(const track of ['geometry','teaching'])assert.equal(source.revisions[id][track],
  createHash('sha256').update(JSON.stringify({source:source.sourceRevisions[id][track],website:manifest.websiteIntegrationSha256})).digest('hex'));
});
