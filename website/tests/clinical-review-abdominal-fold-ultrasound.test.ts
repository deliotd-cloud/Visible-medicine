import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {build} from 'esbuild';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {verifyAbdominalFoldTitleTransition} from './abdominal-fold-title-transition.mjs';

const sha=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const revision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const atlas=currentAtlasDeliveryRoot();
const parent='057640ca58032d1e88680ce0d99797e12532836d';
const ids=[
 'vm:anatomy:body:abdomen:midline:membrane:mesentery-of-small-intestine',
 'vm:anatomy:body:abdomen:midline:membrane:transverse-mesocolon',
 'vm:anatomy:body:abdomen:unspecified:membrane:mesoappendix',
];
const sourceHashes:Record<string,string>={
 'content/abdominal-fold-ultrasound.ts':'884980bc5090348fc0c78a081f026f4b9923e3458171bce2499323eceab1df0d',
 'content/abdominal-fold-ultrasound-pins.json':'14443071c39d0d0179e5830151f462ac068b3a6e29ddba17e653c7a9c8c07e59',
 'lib/abdominal-fold-ultrasound.ts':'c34ab10048031c2ee6b90f4fde2506d8a7a0d6b2fb309567dbc1e8f792a747f4',
};

test('three abdominal folds retain exact ultrasound source, learner and protected Review evidence',async()=>{
 const admission=validateCurrentAtlasDelivery();
 assert.equal(admission.source,CURRENT_ATLAS_REVISION);
 const review=json('atlas-review/manifest.json');
 const pins=json('atlas-review/content/abdominal-fold-ultrasound-pins.json');
 assert.equal(review.revision,CURRENT_ATLAS_REVISION);
 assert.equal(pins.parentCommit,parent);
 assert.equal(pins.sourceVersion,'4.0');
 assert.equal(pins.license,'CC-BY-4.0');
 assert.equal(pins.previousAllLessonsAndRecipesHash,'f2493f1d3790a54b67067d4d40bcfc0014ebe5f9a5dc86bf82077edad33c7007');
 assert.deepEqual(pins.bundles.map((bundle:{id:string;bytes:number;sha256:string})=>[bundle.id,bundle.bytes,bundle.sha256]),[
  ['abdomen-connective-mesenteric',727116,'45d592f6eaef66743c7fe88ec944d68a6e6ddf2496d59331e353b15f99b91845'],
 ]);
 assert.deepEqual(pins.entries.map((entry:{identity:{id:string;fmaId:string;laterality:string};topic:string})=>
  [entry.identity.id,entry.identity.fmaId,entry.identity.laterality,entry.topic]),[
  [ids[0],'FMA14643','midline','mesentery'],
  [ids[1],'FMA14647','midline','mesocolon'],
  [ids[2],'FMA16549','unspecified','mesoappendix'],
 ]);
 for(const entry of pins.entries){
  const {identity,topics,previous}=entry;
  assert.equal(identity.bundle,'abdomen-connective-mesenteric');
  assert.equal(identity.region,'abdomen');
  assert.equal(identity.system,'connective');
  assert.equal(identity.category,'membrane');
  assert.equal(identity.nodeName,identity.fmaId);
  assert.equal(identity.validation.status,'unvalidated');
  assert.equal(identity.validation.anatomicalReview,false);
  assert.deepEqual(topics,['ultrasound']);
  assert.equal(previous.ultrasound.readiness,'pending',identity.id);
 }

 const historicalContent=execFileSync('git',['show',`${revision}:content/abdominal-fold-ultrasound.ts`],
  {cwd:atlas,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
 const currentContent=execFileSync('git',['show',`${CURRENT_ATLAS_REVISION}:content/abdominal-fold-ultrasound.ts`],
  {cwd:atlas,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
 const titleCommitContent=execFileSync('git',['show','a01ea4a00740dee0905204a33893761b8ae1ff1e:content/abdominal-fold-ultrasound.ts'],
  {cwd:atlas,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
 assert.deepEqual(currentContent,titleCommitContent,'Current content retains exact recorded a01 title transition');
 assert.deepEqual(readFileSync(atlas+'/content/abdominal-fold-ultrasound.ts'),currentContent,
  'Atlas checkout retains committed current content');
 const currentContentSha=verifyAbdominalFoldTitleTransition(historicalContent,currentContent);

 for(const [path,expected] of Object.entries(sourceHashes)){
  assert.equal(sha(execFileSync('git',['show',`${revision}:${path}`],{cwd:atlas,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}})),
   expected,`${path}: 9f Git source`);
  const record=review.files.find((file:{path:string})=>file.path===path);
  assert(record,`Review missing ${path}`);
  const delivered=path==='content/abdominal-fold-ultrasound.ts'?currentContentSha:expected;
  assert.equal(record.sourceSha256,delivered,path);
  assert.equal(record.importedSha256,delivered,path);
  assert.equal(sha(readFileSync('atlas-review/'+path)),delivered,path);
 }
 const sourceModules=new Set(['head-neck','shoulder']);
 const learnerBundles:string[]=[];
 for(const module of ['head-neck','female-pelvis','lower-limb','shoulder']){
  const base=`public/atlas-runtime/${module}/`;
  const manifest=json(base+'manifest.json');
  const inputs=json(base+'source-inputs.json');
  assert.equal(manifest.sourceCommit,admission.runtimeSources[module],module);
  assert.equal(manifest.patientDataIncluded,false,module);
  assert.equal(manifest.clinicalApproved,false,module);
  for(const [path,expected] of Object.entries(sourceHashes)){
   const input=inputs.find((file:{path:string})=>file.path===path);
   const delivered=path==='content/abdominal-fold-ultrasound.ts'?currentContentSha:expected;
   if(sourceModules.has(module))assert.equal(input?.sha256,delivered,`${module}: ${path}`);
   else assert.equal(input,undefined,`${module}: unexpected ${path}`);
  }
  if(!sourceModules.has(module))continue;
  if(module==='head-neck')assert(manifest.regionalScopes.some((scope:{region:string;regionalIds:string[]})=>
   scope.region==='abdomen'&&ids.every(id=>scope.regionalIds.includes(id))));
  learnerBundles.push(manifest.files.filter((file:{path:string})=>file.path.endsWith('.js')).map((file:{path:string;sha256:string})=>{
   const bytes=readFileSync(base+file.path);
   assert.equal(sha(bytes),file.sha256,`${module}: ${file.path}`);
   return new TextDecoder('utf-8',{fatal:true}).decode(bytes);
  }).join('\n'));
 }

 const compiled=await build({stdin:{contents:[
  "export {bodyLesson} from './atlas-review/app/body-content';",
  "export {abdominalFoldUltrasoundLesson} from './atlas-review/lib/abdominal-fold-ultrasound';",
  "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
  "export {bodyReviewContext} from './atlas-review/lib/body-review-context';",
  "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
  "export {postBodyDecision} from './atlas-review/lib/body-review-api';",
 ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
 const currentTitles:Record<string,string>={[ids[0]]:'Small-bowel mesentery · Ultrasound',
  [ids[1]]:'Ultrasound and EUS',[ids[2]]:'Ultrasound'};
 for(const {identity} of pins.entries){
  const id=identity.id;
  const packet=wire(await api.bodyReviewMaterial(id));
  assert(packet,id);
  assert.equal(packet.approval,false,id);
  assert.equal(packet.status,'worksheet-not-submitted',id);
  assert.deepEqual(packet.source.structure,identity,id);
  assert.equal(packet.source.bundle.sha256,pins.bundles[0].sha256,id);
  const context=await api.bodyReviewContext(id);
  assert(context,id);
  assert.equal(context.structureId,id);
  assert.equal(context.sourceHash,packet.fingerprints.source);
  assert.equal(context.teachingHash,packet.fingerprints.teaching);
  assert.equal(context.materialHash,packet.materialHash);
  assert.equal(context.revisions.imaging,null);
  assert.deepEqual(await api.parseBodyReviewResponse(packet,id),packet);
  for(const [change,claim] of [['material','materialHash'],['revision','revisionHash']] as const){
   const input={catalogScope:context.catalogScope,structureId:id,track:'teaching',
    expectedVersion:0,materialHash:context.materialHash,revisionHash:context.revisions.teaching,
    checklistVersion:context.checklistVersion,draft:{}};
   input[claim]='0'.repeat(64);
   const response=await api.postBodyDecision(new Request('https://review.test/api/body-review',{
    method:'POST',headers:{'oai-authenticated-user-id':'test-reviewer','origin':'https://review.test',
     'content-type':'application/json'},body:JSON.stringify(input)}),undefined);
   assert.equal(response.status,409,`${id}: changed ${change} claim`);
   assert.match((await response.json()).error,/material or checklist changed/i);
  }
  const lesson=api.abdominalFoldUltrasoundLesson(identity,'ultrasound');
  assert(lesson,id);
  assert.equal(lesson.title,`${identity.name} · ${currentTitles[id]} · draft`,id);
  assert.equal(lesson.readiness,'draft',id);
  assert.deepEqual(api.bodyLesson(identity,'ultrasound'),lesson,id);
  assert.deepEqual(packet.topics.find((topic:{tab:string})=>topic.tab==='ultrasound'),
   {tab:'ultrasound',...lesson},id);
  assert.match(lesson.note,/radiologist review pending/i);
  assert.match(lesson.note,/No images or publisher text imported/i);
  assert.match(lesson.note,/diagnostic thresholds, patient registration or clinical approval/i);
  for(const bundle of learnerBundles)for(const value of [lesson.body,...lesson.bullets,...lesson.citations])
   assert(bundle.includes(value),`${id}: ultrasound: missing learner text ${value}`);
  for(const change of ['pending','body','bullet','citation','source','identity']){
   const altered=wire(packet);
   const topic=altered.topics.find((item:{tab:string})=>item.tab==='ultrasound');
   if(change==='pending')topic.readiness='pending';
   if(change==='body')topic.body='Foreign teaching';
   if(change==='bullet')topic.bullets[0]='Foreign claim';
   if(change==='citation')topic.citations[0]='https://foreign.example/';
   if(change==='source')altered.source.structure.sources[0].sha256='0'.repeat(64);
   if(change==='identity')altered.source.structure.fmaId='FMA0';
   assert.equal(await api.parseBodyReviewResponse(altered,id),null,`${id}: ultrasound: ${change}`);
  }
  for(const change of [{id:id+'-foreign'},{fmaId:'FMA0'},{bundle:'foreign'},
   {laterality:identity.laterality==='midline'?'unspecified':'midline'},
   {sources:[{file:'FJ0',sha256:'0'.repeat(64)}]},
   {bounds:{...identity.bounds,min:[0,0,0]}}])
   assert.equal(api.abdominalFoldUltrasoundLesson({...identity,...change},'ultrasound'),undefined,
    `${id}: ultrasound: foreign identity`);
  for(const tab of ['ct','mri','xray','clinical','pathology'])
   assert.equal(api.abdominalFoldUltrasoundLesson(identity,tab),undefined,`${id}: ${tab}`);
 }
});
