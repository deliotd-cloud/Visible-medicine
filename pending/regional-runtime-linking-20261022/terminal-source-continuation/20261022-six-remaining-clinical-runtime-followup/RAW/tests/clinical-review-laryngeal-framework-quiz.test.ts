import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {build} from 'esbuild';
import {admitPreservedClinicalReview} from './clinical-review-current-admission.mjs';

const sha=(value:Uint8Array|string)=>createHash('sha256').update(value).digest('hex');
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const historicalFeature='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const parent='662a1e8c45673c15d7ed3acbebebe912cb0db9b8';
const sourceHashes:Record<string,string>={
 'content/laryngeal-framework-quiz.ts':'8072f6fadc8d0f94b614137ae7ecff345fab04fbc555ce442078e08ad42a9b83',
 'content/laryngeal-framework-quiz-pins.json':'6939f949134674656c8bfd05389ba16509c341e85eed03906331e2a1dd42cab1',
 'lib/laryngeal-framework-quiz.ts':'c0c79f996d9640af78a7428c2c23a38df22cc32f9a59395d24f91a1cad5900ae',
};
const expectedFma:Record<string,string[]>={
 thyroid:['FMA55099'],cricoid:['FMA9615'],arytenoid:['FMA55113','FMA55114'],
 corniculate:['FMA55115','FMA55116'],cuneiform:['FMA55117','FMA55118'],
 epiglottis:['FMA55130'],medianThyrohyoid:['FMA55138'],
 lateralThyrohyoid:['FMA55140','FMA55141'],hyoepiglottic:['FMA55227'],
 thyroepiglottic:['FMA55230'],medianCricothyroid:['FMA55237'],
 vocal:['FMA55245','FMA55246'],thyrohyoidMembrane:['FMA55133','FMA55134'],
};
const expectedBundles:Record<string,[number,string]>={
 'head-neck-connective-recovery':[175092,'2243b05c7b505ee666ac4a36becfe5298735558b0e86b4d8e4476115f372ce05'],
 'head-neck-connective-gaps':[692376,'c2073b8bfca9d8aa41c5c4810738138ba54fe6db1f5bfd935a3231414a38c3f8'],
 'head-neck-organs-visceral-detail':[65180,'87b0684fd3a8d120d622f2f96edb49059cd530ba927423d5ac5f28d1069c2f84'],
 'head-neck-connective-laryngeal-detail':[178112,'a4788313cc86677900a528208e8ac7045f07bee300ea17073386bf0c12c83de4'],
};

test('19 laryngeal selections retain exact source, learner quiz and protected Review draft evidence',async()=>{
 const currentRevision=admitPreservedClinicalReview({revision:historicalFeature,sourceHashes,learnerModules:['head-neck','shoulder']});
 const review=json('atlas-review/manifest.json');
 const pins=json('atlas-review/content/laryngeal-framework-quiz-pins.json');
 assert.equal(review.revision,currentRevision);
 assert.equal(pins.parentCommit,parent);
 assert.equal(sha(JSON.stringify(pins)),'847e2f7151145eff34e0b153897b710e11b236fdc70876befa8b2d275ac64b9c');
 assert.equal(pins.entries.length,19);
 assert.equal(new Set(pins.entries.map((entry:{identity:{id:string}})=>entry.identity.id)).size,19);
 assert.deepEqual([...new Set(pins.entries.map((entry:{group:string})=>entry.group))].sort(),Object.keys(expectedFma).sort());
 for(const [group,fma] of Object.entries(expectedFma))assert.deepEqual(
  pins.entries.filter((entry:{group:string})=>entry.group===group).map((entry:{identity:{fmaId:string}})=>entry.identity.fmaId).sort(),fma.slice().sort(),group);
 assert.deepEqual(pins.bundles.map((bundle:{id:string;bytes:number;sha256:string})=>[bundle.id,bundle.bytes,bundle.sha256]),
  Object.entries(expectedBundles).map(([id,[bytes,hash]])=>[id,bytes,hash]));
 assert.deepEqual(new Set(pins.entries.map((entry:{identity:{bundle:string}})=>entry.identity.bundle)),new Set(Object.keys(expectedBundles)));
 for(const [path,expected] of Object.entries(sourceHashes)){
  const file=review.files.find((entry:{path:string})=>entry.path===path);
  assert(file,`Review missing ${path}`);
  assert.equal(file.sourceSha256,expected,path);
  assert.equal(file.importedSha256,expected,path);
  assert.equal(sha(readFileSync('atlas-review/'+path)),expected,path);
 }

 const ids=pins.entries.map((entry:{identity:{id:string}})=>entry.identity.id);
 const learnerBundles:string[]=[];
 for(const module of ['head-neck','female-pelvis','lower-limb','shoulder']){
  const base=`public/atlas-runtime/${module}/`;
  const manifest=json(base+'manifest.json');
  const inputs=json(base+'source-inputs.json');
  assert.equal(manifest.sourceCommit,currentRevision,module);
  assert.equal(manifest.patientDataIncluded,false,module);
  assert.equal(manifest.clinicalApproved,false,module);
  for(const [path,expected] of Object.entries(sourceHashes)){
   const input=inputs.find((entry:{path:string})=>entry.path===path);
   if(module==='head-neck'||module==='shoulder')assert.equal(input?.sha256,expected,`${module}: ${path}`);
   else assert.equal(input,undefined,`${module}: unexpected ${path}`);
  }
  if(module!=='head-neck'&&module!=='shoulder')continue;
  if(module==='head-neck')assert(manifest.regionalScopes.some((scope:{region:string;regionalIds:string[]})=>
   scope.region==='head-neck'&&ids.every((id:string)=>scope.regionalIds.includes(id))),'head-neck scope missing quiz selections');
  for(const bundle of module==='head-neck'?pins.bundles:[]){
   const path=bundle.url.slice(1).split('?')[0];
   const record=manifest.files.find((file:{path:string})=>file.path===path);
   assert(record,`${module}: ${path}`);
   assert.equal(record.bytes,bundle.bytes,`${module}: ${path}`);
   assert.equal(record.sha256,bundle.sha256,`${module}: ${path}`);
   const bytes=readFileSync(base+path);
   assert.equal(bytes.byteLength,bundle.bytes,`${module}: ${path}`);
   assert.equal(sha(bytes),bundle.sha256,`${module}: ${path}`);
  }
  learnerBundles.push(manifest.files.filter((file:{path:string})=>file.path.endsWith('.js')).map((file:{path:string;sha256:string})=>{
   const bytes=readFileSync(base+file.path);
   assert.equal(sha(bytes),file.sha256,`${module}: ${file.path}`);
   return new TextDecoder('utf-8',{fatal:true}).decode(bytes);
  }).join('\n'));
 }

 const compiled=await build({stdin:{contents:[
  "export {bodyLesson} from './atlas-review/app/body-content';",
  "export {laryngealFrameworkQuizLesson} from './atlas-review/lib/laryngeal-framework-quiz';",
  "export {laryngealFrameworkQuizQuestions} from './atlas-review/content/laryngeal-framework-quiz';",
  "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
  "export {bodyReviewContext} from './atlas-review/lib/body-review-context';",
  "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
  "export {postBodyDecision} from './atlas-review/lib/body-review-api';",
 ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
 assert.deepEqual(Object.keys(api.laryngealFrameworkQuizQuestions).sort(),Object.keys(expectedFma).sort());
 assert.equal(new Set(Object.values(api.laryngealFrameworkQuizQuestions).map((q:any)=>q.body)).size,13);
 for(const entry of pins.entries){
  const {identity,group,previous}=entry,id=identity.id;
  const q=api.laryngealFrameworkQuizQuestions[group];
  assert(q,group);
  assert.equal(identity.region,'head-neck',id);
  assert.equal(identity.nodeName,identity.fmaId,id);
  assert.equal(identity.validation.status,'unvalidated',id);
  assert.equal(identity.validation.anatomicalReview,false,id);
  assert.equal(previous.readiness,'generated-identification',id);
  assert.equal(previous.correctAnswer,undefined,id);
  assert.equal(q.choices.length,4,group);
  assert.equal(q.choices.filter((answer:string)=>answer===q.correctAnswer).length,1,group);
  const lesson=api.laryngealFrameworkQuizLesson(identity,'quiz');
  assert(lesson,id);
  assert.equal(lesson.readiness,'draft',id);
  assert.equal(lesson.body,q.body,id);
  assert.deepEqual(lesson.bullets,[...q.choices],id);
  assert.equal(lesson.correctAnswer,q.correctAnswer,id);
  assert.equal(lesson.explanation,q.explanation,id);
  assert.deepEqual(lesson.citations,[...q.references],id);
  assert.match(lesson.note,/revision-bound radiologist review pending/i,id);
  assert.deepEqual(api.bodyLesson(identity,'quiz'),lesson,id);
  for(const learner of learnerBundles)for(const value of [lesson.body,lesson.explanation,...lesson.bullets,...lesson.citations])
   assert(learner.includes(value),`${id}: missing learner text ${value}`);
  const packet=wire(await api.bodyReviewMaterial(id));
  assert(packet,id);
  assert.equal(packet.approval,false,id);
  assert.equal(packet.status,'worksheet-not-submitted',id);
  assert.deepEqual(packet.source.structure,identity,id);
  assert.equal(packet.source.bundle.sha256,expectedBundles[identity.bundle][1],id);
  assert.deepEqual(packet.topics.find((topic:{tab:string})=>topic.tab==='quiz'),{tab:'quiz',...lesson},id);
  for(const topic of packet.topics.filter((topic:{tab:string})=>topic.tab!=='quiz'))
   assert.deepEqual(topic,{tab:topic.tab,...api.bodyLesson(identity,topic.tab)},`${id}: ${topic.tab}`);
  const context=await api.bodyReviewContext(id);
  assert(context,id);
  assert.equal(context.structureId,id);
  assert.equal(context.sourceHash,packet.fingerprints.source);
  assert.equal(context.teachingHash,packet.fingerprints.teaching);
  assert.equal(context.materialHash,packet.materialHash);
  assert.deepEqual(await api.parseBodyReviewResponse(packet,id),packet,id);
  for(const change of ['prior','question','answer','explanation','citation','source','identity']){
   const altered=wire(packet),topic=altered.topics.find((item:{tab:string})=>item.tab==='quiz');
   if(change==='prior')Object.assign(topic,{tab:'quiz',...previous});
   if(change==='question')topic.body='Stale question';
   if(change==='answer')topic.correctAnswer='Foreign answer';
   if(change==='explanation')topic.explanation='Foreign explanation';
   if(change==='citation')topic.citations[0]='https://foreign.example/';
   if(change==='source')altered.source.structure.sources[0].sha256='0'.repeat(64);
   if(change==='identity')altered.source.structure.fmaId='FMA0';
   assert.equal(await api.parseBodyReviewResponse(altered,id),null,`${id}: ${change}`);
  }
  // Display evidence is checked by the parser; save-time claims are checked
  // against the current server context by postBodyDecision before storage.
  for(const claim of ['materialHash','revisionHash'] as const){
   const input={catalogScope:context.catalogScope,structureId:id,track:'teaching',
    expectedVersion:0,materialHash:context.materialHash,revisionHash:context.revisions.teaching,
    checklistVersion:context.checklistVersion,draft:{}};
   input[claim]='0'.repeat(64);
   const response=await api.postBodyDecision(new Request('https://review.test/api/body-review',{
    method:'POST',headers:{'oai-authenticated-user-id':'test-reviewer','origin':'https://review.test',
     'content-type':'application/json'},body:JSON.stringify(input)}),undefined);
   assert.equal(response.status,409,`${id}: stale ${claim}`);
   assert.match((await response.json()).error,/material or checklist changed/i);
  }
  for(const change of ['source','source-empty','source-order','bundle','id','fma','side','region','system','category','node','bounds','review','extra']){
   const altered=wire(identity);
   if(change==='source')altered.sources[0].sha256='0'.repeat(64);
   if(change==='source-empty')altered.sources=[];
   if(change==='source-order'){
    if(altered.sources.length<2)continue;
    altered.sources.reverse();
   }
   if(change==='bundle')altered.bundle='foreign';
   if(change==='id')altered.id+='-foreign';
   if(change==='fma')altered.fmaId='FMA0';
   if(change==='side')altered.laterality='foreign';
   if(change==='region')altered.region='foreign';
   if(change==='system')altered.system='foreign';
   if(change==='category')altered.category='foreign';
   if(change==='node')altered.nodeName='foreign';
   if(change==='bounds')altered.bounds.min=[0,0,0];
   if(change==='review')altered.validation.anatomicalReview=true;
   if(change==='extra')altered.unexpected=true;
   assert.equal(api.laryngealFrameworkQuizLesson(altered,'quiz'),undefined,`${id}: ${change}`);
  }
  for(const tab of ['anatomy','clinical','ct'])assert.equal(api.laryngealFrameworkQuizLesson(identity,tab),undefined,`${id}: ${tab}`);
 }
});
