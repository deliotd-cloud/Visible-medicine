import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import test from 'node:test';
import {build} from 'esbuild';

const revision='190a63238eadcf906abe89dcbb6a67c88afe70b9';
const historicalRevision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const sourceCommit='59a567c7fb76c954cf3d91eeec62124e207bbbf9';
const sha=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const sourceHashes:Record<string,string>={
 'content/spinal-disc-ultrasound.ts':'e7fd4f2a3020d1a34137b70b3ad0ec5c1a5fcc030a922c7d17ddc34dfc2a79b8',
 'lib/spinal-disc-ultrasound.ts':'bd916458cfcbf09b2b62dbd916c62fc22e1000f50a8ded8922368d2a7dcfeda3',
 'content/spine-imaging-pins.json':'4976164571345045f0a0c8d1a16f12afa4122858ecd522fc9ea3949ff18bc6de',
};
const groups={
 cervicalDisc:['FMA13896','FMA13897','FMA13898','FMA13899','FMA13900'],
 thoracicDisc:['FMA13495','FMA13500','FMA13501','FMA13502','FMA13503','FMA13504','FMA13505','FMA13506','FMA13507','FMA13508'],
 lumbarDisc:['FMA16033','FMA16034','FMA16035','FMA16036'],
};

test('19 spinal-disc Ultrasound drafts bind the committed learner and protected Review evidence',async()=>{
 const pin=validateCurrentAtlasDelivery();
 assert.equal(pin.runtimeSources.shoulder,revision);
 assert.equal(pin.runtimeSources['head-neck'],pin.source);
 const review=json('atlas-review/manifest.json');
 const pins=json('atlas-review/content/spine-imaging-pins.json');
 assert.equal(review.revision,pin.source);
 assert.equal(pins.sourceCommit,sourceCommit);
 assert.equal(pins.sourceVersion,'4.0');
 const entries=Object.entries(groups).flatMap(([group,fmas])=>fmas.map(fma=>{
  const matches=pins.entries.filter((entry:{group:string;identity:{fmaId:string}})=>entry.group===group&&entry.identity.fmaId===fma);
  assert.equal(matches.length,1,`${group}: ${fma}`);
  return matches[0];
 }));
 assert.equal(entries.length,19);
 assert.equal(new Set(entries.map(({identity}:{identity:{id:string}})=>identity.id)).size,19);
 assert.deepEqual(pins.entries.filter((entry:{group:string;identity:{id:string;fmaId:string}})=>
  Object.hasOwn(groups,entry.group)&&!entries.some(({identity}:{identity:{id:string}})=>identity.id===entry.identity.id))
  .map((entry:{identity:{fmaId:string}})=>entry.identity.fmaId),['FMA25058','FMA10458','FMA16037']);
 for(const {identity} of entries){
  assert.equal(identity.region,'spine',identity.id);
  assert.equal(identity.category,'cartilage',identity.id);
  assert.equal(identity.laterality,'midline',identity.id);
  assert.equal(identity.validation.anatomicalReview,false,identity.id);
 }
 for(const [path,expected] of Object.entries(sourceHashes)){
  const sourceRoot=currentAtlasDeliveryRoot();
  const committed=(revision:string)=>execFileSync('git',['-C',sourceRoot,'show',revision+':'+path],
   {windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
  assert.deepEqual(committed(revision),committed(historicalRevision),path+' exact 9f source retained');
  assert.deepEqual(committed(pin.source),committed(revision),path+' exact current Review source retained');
  assert.equal(sha(committed(revision)),expected,path+' committed source');
  const record=review.files.find((file:{path:string})=>file.path===path);
  assert(record,`Review missing ${path}`);
  assert.equal(record.sourceSha256,expected,path);
  assert.equal(record.importedSha256,expected,path);
  assert.equal(sha(readFileSync('atlas-review/'+path)),expected,path);
 }

 const learnerBundles:string[]=[];
 for(const module of ['head-neck','female-pelvis','lower-limb','shoulder']){
  const base=`public/atlas-runtime/${module}/`;
  const manifest=json(base+'manifest.json');
  const inputs=json(base+'source-inputs.json');
  assert.equal(manifest.sourceCommit,pin.runtimeSources[module],module);
  assert.equal(manifest.patientDataIncluded,false,module);
  assert.equal(manifest.clinicalApproved,false,module);
  for(const [path,expected] of Object.entries(sourceHashes)){
   const input=inputs.find((file:{path:string})=>file.path===path);
   if(module==='head-neck'||module==='shoulder')assert.equal(input?.sha256,expected,`${module}: ${path}`);
   else assert.equal(input,undefined,`${module}: unexpected ${path}`);
  }
  if(module!=='head-neck'&&module!=='shoulder')continue;
  if(module==='head-neck')assert(manifest.regionalScopes.some((scope:{region:string;regionalIds:string[]})=>
   scope.region==='spine'&&entries.every(({identity}:{identity:{id:string}})=>scope.regionalIds.includes(identity.id))));
  learnerBundles.push(manifest.files.filter((file:{path:string})=>file.path.endsWith('.js')).map((file:{path:string;sha256:string})=>{
   const bytes=readFileSync(base+file.path);
   assert.equal(sha(bytes),file.sha256,`${module}: ${file.path}`);
   return new TextDecoder('utf-8',{fatal:true}).decode(bytes);
  }).join('\n'));
 }

 const compiled=await build({stdin:{contents:[
  "export {bodyLesson} from './atlas-review/app/body-content';",
  "export {spinalDiscUltrasoundLesson} from './atlas-review/lib/spinal-disc-ultrasound';",
  "export {spinalDiscUltrasoundGroups,spinalDiscUltrasoundTopics} from './atlas-review/content/spinal-disc-ultrasound';",
  "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
  "export {bodyReviewContext} from './atlas-review/lib/body-review-context';",
  "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
  "export {postBodyDecision} from './atlas-review/lib/body-review-api';",
 ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
 assert.deepEqual(wire(api.spinalDiscUltrasoundGroups),groups);
 assert.equal(Object.keys(api.spinalDiscUltrasoundTopics).length,3);
 for(const {identity,group} of entries){
  const id=identity.id;
  const lesson=api.spinalDiscUltrasoundLesson(identity,'ultrasound');
  assert(lesson,id);
  assert.equal(lesson.readiness,'draft',id);
  assert.deepEqual(api.bodyLesson(identity,'ultrasound'),lesson,id);
  assert.equal(lesson.body,api.spinalDiscUltrasoundTopics[group].body,id);
  assert.deepEqual(lesson.citations,api.spinalDiscUltrasoundTopics[group].citations,id);
  assert.match(lesson.note,/revision-bound radiologist review pending/i);
  assert.match(lesson.note,/No sonograms, publisher text, diagnostic thresholds or procedural instructions imported/i);
  for(const bundle of learnerBundles)for(const value of [lesson.body,...lesson.bullets,...lesson.citations])
   assert(bundle.includes(value),`${id}: missing learner text ${value}`);

  const packet=wire(await api.bodyReviewMaterial(id));
  assert(packet,id);
  assert.equal(packet.approval,false,id);
  assert.equal(packet.status,'worksheet-not-submitted',id);
  assert.deepEqual(packet.source.structure,identity,id);
  assert.equal(packet.source.bundle.sha256,pins.bundles.find((bundle:{id:string})=>bundle.id===identity.bundle)?.sha256,id);
  assert.deepEqual(packet.topics.find((topic:{tab:string})=>topic.tab==='ultrasound'),{tab:'ultrasound',...lesson},id);
  const context=await api.bodyReviewContext(id);
  assert(context,id);
  assert.equal(context.structureId,id);
  assert.equal(context.sourceHash,packet.fingerprints.source);
  assert.equal(context.teachingHash,packet.fingerprints.teaching);
  assert.equal(context.materialHash,packet.materialHash);
  assert.equal(context.revisions.imaging,null);
  assert.deepEqual(await api.parseBodyReviewResponse(packet,id),packet);
  for(const change of ['readiness','body','bullet','citation','source']){
   const altered=wire(packet);
   const topic=altered.topics.find((item:{tab:string})=>item.tab==='ultrasound');
   if(change==='readiness')topic.readiness='pending';
   if(change==='body')topic.body+=' foreign';
   if(change==='bullet')topic.bullets[0]+=' foreign';
   if(change==='citation')topic.citations[0]='https://foreign.example/';
   if(change==='source')altered.source.structure.sources[0].sha256='0'.repeat(64);
   assert.equal(await api.parseBodyReviewResponse(altered,id),null,`${id}: altered ${change}`);
  }
  for(const claim of ['materialHash','revisionHash'] as const){
   const input={catalogScope:context.catalogScope,structureId:id,track:'teaching',expectedVersion:0,
    materialHash:context.materialHash,revisionHash:context.revisions.teaching,
    checklistVersion:context.checklistVersion,draft:{}};
   input[claim]='0'.repeat(64);
   const response=await api.postBodyDecision(new Request('https://review.test/api/body-review',{
    method:'POST',headers:{'oai-authenticated-user-id':'test-reviewer','origin':'https://review.test',
     'content-type':'application/json'},body:JSON.stringify(input)}),undefined);
   assert.equal(response.status,409,`${id}: altered ${claim}`);
   assert.match((await response.json()).error,/material or checklist changed/i);
  }
  for(const change of [{id:id+'-foreign'},{fmaId:'FMA0'},{bundle:'foreign'},
   {sources:[{file:'FJ3211',sha256:'0'.repeat(64)}]},
   {bounds:{...identity.bounds,min:[0,0,0]}}])
   assert.equal(api.spinalDiscUltrasoundLesson({...identity,...change},'ultrasound'),undefined,
    `${id}: foreign identity`);
  for(const tab of ['ct','mri','xray','clinical','pathology'])
   assert.equal(api.spinalDiscUltrasoundLesson(identity,tab),undefined,`${id}: ${tab}`);
 }
 for(const entry of pins.entries.filter((entry:{identity:{fmaId:string}})=>
  ['FMA25058','FMA10458','FMA16037'].includes(entry.identity.fmaId)))
  assert.equal(api.spinalDiscUltrasoundLesson(entry.identity,'ultrasound'),undefined,entry.identity.id);
});
