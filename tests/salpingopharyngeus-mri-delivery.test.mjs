// Current delivery proof. The exact feature-era transition remains in the Atlas source suite.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {emittedTeaching} from './atlas-emitted-teaching.ts';

const root=fileURLToPath(new URL('../',import.meta.url));
const feature='3e66d2a7cb1807f792929cbe292a4cfc81e4e79e';
const featureTree='19f3e1e58a2ff8fe479352bccbad8a487bf14f8a';
const paths=['content/pharyngeal-muscle-teaching-pins.json','content/salpingopharyngeus-mri.ts',
 'lib/salpingopharyngeus-mri.ts','app/body-content.ts'];
const specs=[['left','FMA46670','FJ2745'],['right','FMA46669','FJ2757']];
const read=path=>readFileSync(resolve(root,path));
const json=path=>JSON.parse(read(path));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const same=(a,b,label)=>assert.deepEqual(structuredClone(a),structuredClone(b),label);
const git=(atlas,...args)=>execFileSync('git',['-C',atlas,...args],
 {windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});

let fixture;
async function setup(){
 if(fixture)return fixture;
 const pin=validateCurrentAtlasDelivery();
 assert.equal(pin.source,CURRENT_ATLAS_REVISION);
 const atlas=currentAtlasDeliveryRoot();
 assert.equal(git(atlas,'rev-parse',`${feature}^{tree}`).toString().trim(),featureTree);
 git(atlas,'merge-base','--is-ancestor',feature,pin.source);
 const requireSite=createRequire(resolve(root,'package.json'));
 const {build}=requireSite('esbuild');
 const entry=[
  "export {bodyLesson,bodyContent} from './atlas-review/app/body-content';",
  "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
  "export {salpingopharyngeusMriLesson} from './atlas-review/lib/salpingopharyngeus-mri';",
  "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
  "export {bodyReviewContext} from './atlas-review/lib/body-review-context';",
  "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
  "export {postBodyDecision} from './atlas-review/lib/body-review-api';",
  "export {blankBodyReview} from './atlas-review/lib/body-review-decisions';",
 ].join('');
 const built=await build({stdin:{contents:entry,resolveDir:root,loader:'ts'},
  bundle:true,write:false,format:'esm',platform:'node'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
 fixture={pin,atlas,api,pins:json('atlas-review/content/pharyngeal-muscle-teaching-pins.json'),
  catalog:api.bodyDisplayCatalog(json('atlas-review/public/models/bodyparts3d/full-body/catalog.json'))};
 return fixture;
}

test('two MRI drafts bind committed source, Review import and emitted learner code',async()=>{
 const {pin,atlas,api,pins,catalog}=await setup();
 const review=json('atlas-review/manifest.json');
 assert.equal(review.revision,pin.source);
 for(const path of paths){
  const row=review.files.find(item=>item.path===path);
  assert(row,`Review imports ${path}`);
  assert.equal(row.sourceSha256,sha(readFileSync(resolve(atlas,path))),path);
  assert.equal(row.importedSha256,sha(read(`atlas-review/${path}`)),path);
  assert.equal(row.importedSha256,row.sourceSha256,`byte-exact Review import: ${path}`);
 }
 for(const path of paths.slice(0,3))
  assert.equal(sha(git(atlas,'show',`${feature}:${path}`)),sha(git(atlas,'show',`${pin.source}:${path}`)),
   `feature source retained: ${path}`);
 const targets=pins.entries.filter(entry=>entry.family==='salpingo');
 assert.equal(targets.length,2);
 same(targets.map(({identity})=>[identity.laterality,identity.fmaId,identity.sources[0]?.file]).sort(),
  specs,'exact source identities');
 const lessons=new Map();
 for(const {identity} of targets){
  const selected=catalog.structures.find(item=>item.id===identity.id);
  same(selected,identity,`display identity ${identity.id}`);
  const lesson=api.bodyLesson(selected,'mri');
  assert.equal(lesson.readiness,'draft');
  same(lesson,api.salpingopharyngeusMriLesson(selected,'mri'),'real resolver');
  const {readiness,...shown}=lesson;
  same(api.bodyContent(selected,'mri'),shown,'learner section');
  assert.match(lesson.body,/19 cadavers and 15 healthy participants/);
  assert.match(lesson.body,/high-resolution 3D MRI/);
  assert.match(lesson.bullets.join(' '),/does not establish visibility on routine MRI/);
  assert.match(lesson.note,/revision-bound radiologist review pending/);
  assert.match(lesson.note,/no MRI signal, patient-specific mask, registration or validated muscle boundary/);
  assert.match(lesson.note,/Atlas, imaging-case and lecture access remain independent/);
  assert.deepEqual(lesson.citations,['https://pubs.asha.org/doi/abs/10.1044/2021_JSLHR-20-00483']);
  const worksheet=await api.bodyReviewMaterial(selected.id);
  assert(worksheet);assert.equal(worksheet.approval,false);
  same(worksheet.topics.find(topic=>topic.tab==='mri'),{tab:'mri',...lesson},'protected Review topic');
  same(await api.parseBodyReviewResponse(worksheet,selected.id),worksheet,'current worksheet parses');
  lessons.set(identity.id,lesson);
 }
 const inventory=json('lib/atlas-model-inventory.json');
 for(const name of ['head-neck','shoulder','lower-limb','female-pelvis']){
  const base=`public/atlas-runtime/${name}/`;
  const manifest=json(base+'manifest.json'),inputs=json(base+'source-inputs.json');
  assert.equal(manifest.sourceCommit,pin.source);
  assert.equal(manifest.patientDataIncluded,false);
  assert.equal(manifest.clinicalApproved,false);
  assert.equal(inventory.sources.find(item=>item.module===name)?.manifestSha256,sha(read(base+'manifest.json')));
  // Lower-limb and female-pelvis are independent regional viewers, not consumers
  // of root head/neck teaching. Keep them pinned without inventing that linkage.
  if(!['head-neck','shoulder'].includes(name)){
   for(const path of paths)assert(!inputs.some(item=>item.path===path),`${name}: unrelated head/neck teaching excluded`);
   continue;
  }
  for(const path of paths){
   const input=inputs.find(item=>item.path===path);
   assert(input,`${name} source closure: ${path}`);
   assert.equal(input.sha256,sha(readFileSync(resolve(atlas,path))),`${name}: ${path}`);
  }
  const emitted=emittedTeaching(base,manifest.files,true);
  for(const [id,lesson] of lessons){
   assert(emitted.includes(id),`${name}: ${id}`);
   for(const text of [lesson.body,...lesson.bullets,...lesson.citations])
    assert(emitted.includes(text)||emitted.includes(JSON.stringify(text).slice(1,-1)),
     `${name}: emitted MRI teaching`);
  }
 }
});

test('changed identities, forged worksheets and stale decisions stop before storage',async()=>{
 const {api,pins,catalog}=await setup();
 let storageCalls=0;
 for(const {identity} of pins.entries.filter(entry=>entry.family==='salpingo')){
  const selected=catalog.structures.find(item=>item.id===identity.id);
  for(const edit of [item=>{item.sources[0].sha256='0'.repeat(64);},
   item=>{item.bounds.min[0]+=.01;},item=>{item.fmaId='FMA0';}]){
   const changed=structuredClone(selected);edit(changed);
   assert.equal(api.salpingopharyngeusMriLesson(changed,'mri'),undefined);
   assert.notEqual(api.bodyLesson(changed,'mri').readiness,'draft');
  }
  const worksheet=await api.bodyReviewMaterial(selected.id);
  for(const edit of [item=>{item.topics.find(topic=>topic.tab==='mri').body+=' foreign';},
   item=>{item.topics.find(topic=>topic.tab==='mri').readiness='approved';},
   item=>{item.source.structure.sources=[];},item=>{item.approval=true;}]){
   const forged=structuredClone(worksheet);edit(forged);
   assert.equal(await api.parseBodyReviewResponse(forged,selected.id),null);
  }
  const context=await api.bodyReviewContext(selected.id);
  assert.equal(context.revisions.imaging,null);
  const stale={catalogScope:context.catalogScope,structureId:selected.id,track:'teaching',
   expectedVersion:0,materialHash:'0'.repeat(64),revisionHash:'0'.repeat(64),
   checklistVersion:context.checklistVersion,draft:api.blankBodyReview(context,'teaching')};
  for(const body of [stale,{...stale,materialHash:context.materialHash}]){
   const response=await api.postBodyDecision(new Request('https://atlas.test/api/body-review/decisions',{
    method:'POST',headers:{origin:'https://atlas.test','content-type':'application/json',
     'oai-authenticated-user-id':'SYNTHETIC_SALPINGOPHARYNGEUS_REVIEWER'},body:JSON.stringify(body),
   }),{prepare(){storageCalls++;throw Error('Rejected decision reached storage');}});
   assert.equal(response.status,409);
  }
 }
 assert.equal(storageCalls,0);
});
