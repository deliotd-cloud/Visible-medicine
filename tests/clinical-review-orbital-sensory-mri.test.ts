import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {build} from 'esbuild';

const revision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const parentCommit='b436df6fd03170d27c08d20bf6b29c7d27e0c320';
const sha=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const sourceHashes:Record<string,string>={
 'content/orbital-sensory-mri.ts':'4940181686b480bfa11356943aeaa9306585174ce6ff47e5df8932bd352019d7',
 'lib/orbital-sensory-mri.ts':'7c9ce4eb10cc6c907e15342a1ddb01ac7719e022b6434886cfbe8d4398c63697',
 'content/orbital-nerve-quiz-pins.json':'f6f74503abb6aae0f28532b9cf49da58041aae3451b4b4eaf6187a35fe05edaf',
};
const groups={
 anteriorEthmoidal:['FMA52677','FMA52676'],
 posteriorEthmoidal:['FMA52716','FMA52715'],
 infratrochlear:['FMA52699','FMA52698'],
 ophthalmic:['FMA52623','FMA52622'],
 ciliaryConnection:['FMA52674','FMA52673'],
 longCiliary:['FMA82735','FMA82734'],
 supraorbital:['FMA52657','FMA52656'],
 supratrochlear:['FMA52644','FMA52643'],
};
type Pin={group:string;identity:{id:string;fmaId:string;name:string;region:string;laterality:string;bundle:string;category:string;validation:{anatomicalReview:boolean};sources:{file:string;sha256:string}[];bounds:{min:number[]}}};
// Exact pre-import MRI fallback in Atlas d77054e28f42b4fe99e6ad9519defde7603c7485,
// app/body-content.ts. The pin file's `previous` field is a Quiz lesson.
const priorMri={
 readiness:'pending',
 title:'MRI content pending',
 body:'No imaging study or validated modality-specific teaching material is loaded for this structure. This is a spatial anatomy model, not a substitute for diagnostic imaging.',
 note:'Future imaging registration must use a verified patient coordinate frame; source-model coordinates are not patient coordinates.',
};

test('16 orbital sensory MRI drafts bind exact learner and protected Review evidence',async()=>{
 const review=json('atlas-review/manifest.json');
 const pins=json('atlas-review/content/orbital-nerve-quiz-pins.json');
 assert.equal(review.revision,revision);
 assert.equal(pins.parentCommit,parentCommit);
 assert.equal(pins.entries.length,30);
 const entries:Pin[]=Object.entries(groups).flatMap(([group,fmas])=>fmas.map(fma=>{
  const matches:Pin[]=pins.entries.filter((entry:Pin)=>entry.group===group&&entry.identity.fmaId===fma);
  assert.equal(matches.length,1,`${group}: ${fma}`);
  return matches[0];
 }));
 assert.equal(Object.keys(groups).length,8);
 assert.equal(entries.length,16);
 assert.equal(new Set(entries.map(({identity})=>identity.id)).size,16);
 assert.deepEqual(entries.filter(entry=>entry.group==='ciliaryConnection').map(entry=>entry.identity.id),[
  'vm:anatomy:body:head-neck:left:nerve:communicating-branch-of-left-nasociliary-nerve-with-left-ciliary-ganglion',
  'vm:anatomy:body:head-neck:right:nerve:communicating-branch-of-right-nasociliary-nerve-with-right-ciliary-ganglion',
 ]);
 for(const [group,fmas] of Object.entries(groups)){
  const pair=entries.filter(entry=>entry.group===group);
  assert.deepEqual(pair.map(entry=>entry.identity.fmaId),fmas);
  assert.deepEqual(new Set(pair.map(entry=>entry.identity.laterality)),new Set(['left','right']));
 }
 for(const {identity} of entries){
  assert.equal(identity.region,'head-neck',identity.id);
  assert.equal(identity.category,'nerve',identity.id);
  assert.equal(identity.validation.anatomicalReview,false,identity.id);
 }
 for(const [path,expected] of Object.entries(sourceHashes)){
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
  assert.equal(manifest.sourceCommit,revision,module);
  assert.equal(manifest.patientDataIncluded,false,module);
  assert.equal(manifest.clinicalApproved,false,module);
  for(const [path,expected] of Object.entries(sourceHashes)){
   const input=inputs.find((file:{path:string})=>file.path===path);
   if(module==='head-neck'||module==='shoulder')assert.equal(input?.sha256,expected,`${module}: ${path}`);
   else assert.equal(input,undefined,`${module}: unexpected ${path}`);
  }
  if(module!=='head-neck'&&module!=='shoulder')continue;
  if(module==='head-neck')assert(manifest.regionalScopes.some((scope:{region:string;regionalIds:string[]})=>
   scope.region==='head-neck'&&entries.every(({identity})=>scope.regionalIds.includes(identity.id))));
  learnerBundles.push(manifest.files.filter((file:{path:string})=>file.path.endsWith('.js')).map((file:{path:string;sha256:string})=>{
   const bytes=readFileSync(base+file.path);
   assert.equal(sha(bytes),file.sha256,`${module}: ${file.path}`);
   return new TextDecoder('utf-8',{fatal:true}).decode(bytes);
  }).join('\n'));
 }

 const compiled=await build({stdin:{contents:[
  "export {bodyLesson} from './atlas-review/app/body-content';",
  "export {orbitalSensoryMriLesson} from './atlas-review/lib/orbital-sensory-mri';",
  "export {orbitalSensoryMriGroups,orbitalSensoryMriTopics} from './atlas-review/content/orbital-sensory-mri';",
  "export {orbitalNerveMriLesson} from './atlas-review/lib/orbital-nerve-mri';",
  "export {shortCiliaryLesson} from './atlas-review/lib/short-ciliary';",
  "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
  "export {bodyReviewContext} from './atlas-review/lib/body-review-context';",
  "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
  "export {postBodyDecision} from './atlas-review/lib/body-review-api';",
 ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
 assert.deepEqual(wire(api.orbitalSensoryMriGroups),groups);
 assert.equal(Object.keys(api.orbitalSensoryMriTopics).length,8);
 for(const {identity,group} of entries){
  const id=identity.id;
  const lesson=api.orbitalSensoryMriLesson(identity,'mri');
  assert(lesson,id);
  assert.equal(lesson.readiness,'draft',id);
  assert.deepEqual(api.bodyLesson(identity,'mri'),lesson,id);
  assert.equal(lesson.body,api.orbitalSensoryMriTopics[group].body,id);
  assert.deepEqual(lesson.citations,api.orbitalSensoryMriTopics[group].citations,id);
  assert.match(lesson.note,/revision-bound radiologist review pending/i);
  assert.match(lesson.note,/No scans, article text, figures, diagnostic thresholds or acquisition protocol imported/i);
  assert(lesson.bullets.some((bullet:string)=>/No validated patient registration/.test(bullet)),id);
  assert.notDeepEqual(lesson,priorMri,id);
  for(const bundle of learnerBundles)for(const value of [lesson.body,...lesson.bullets,...lesson.citations])
   assert(bundle.includes(value),`${id}: missing learner text ${value}`);

  const packet=wire(await api.bodyReviewMaterial(id));
  assert(packet,id);
  assert.equal(packet.approval,false,id);
  assert.equal(packet.status,'worksheet-not-submitted',id);
  assert.deepEqual(packet.source.structure,identity,id);
  assert.equal(packet.source.bundle.sha256,pins.bundles.find((bundle:{id:string})=>bundle.id===identity.bundle)?.sha256,id);
  assert.deepEqual(packet.topics.find((topic:{tab:string})=>topic.tab==='mri'),{tab:'mri',...lesson},id);
  const context=await api.bodyReviewContext(id);
  assert(context,id);
  assert.equal(context.structureId,id);
  assert.equal(context.sourceHash,packet.fingerprints.source);
  assert.equal(context.teachingHash,packet.fingerprints.teaching);
  assert.equal(context.materialHash,packet.materialHash);
  assert.equal(context.revisions.imaging,null);
  assert(context.blockers.imaging.some((blocker:string)=>/No validated acquired-image series or spatial registration/.test(blocker)),id);
  assert.deepEqual(await api.parseBodyReviewResponse(packet,id),packet);
  for(const change of ['prior','readiness','body','bullet','citation','source']){
   const altered=wire(packet);
   const index=altered.topics.findIndex((item:{tab:string})=>item.tab==='mri');
   const topic=altered.topics[index];
   if(change==='prior')altered.topics[index]={tab:'mri',...priorMri};
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
   {sources:[{file:'FJ0',sha256:'0'.repeat(64)}]},
   {bounds:{...identity.bounds,min:[0,0,0]}}])
   assert.equal(api.orbitalSensoryMriLesson({...identity,...change},'mri'),undefined,
    `${id}: foreign identity`);
  for(const tab of ['ct','xray','ultrasound','clinical','pathology'])
   assert.equal(api.orbitalSensoryMriLesson(identity,tab),undefined,`${id}: ${tab}`);
 }
 const existingPins=json('atlas-review/content/orbital-nerve-mri-pins.json');
 assert.equal(existingPins.entries.length,14);
 for(const entry of existingPins.entries){
  assert.equal(api.orbitalSensoryMriLesson(entry.identity,'mri'),undefined,entry.identity.id);
  assert.deepEqual(api.bodyLesson(entry.identity,'mri'),api.orbitalNerveMriLesson(entry.identity,'mri'),entry.identity.id);
 }
 for(const entry of pins.entries.filter((entry:Pin)=>!entries.some(target=>target.identity.id===entry.identity.id)))
  assert.equal(api.orbitalSensoryMriLesson(entry.identity,'mri'),undefined,entry.identity.id);
 const shortCatalog=json('atlas-review/public/models/bodyparts3d/short-ciliary/catalog.json');
 for(const identity of shortCatalog.structures){
  assert.equal(api.orbitalSensoryMriLesson(identity,'mri'),undefined,identity.id);
  assert.deepEqual(api.bodyLesson(identity,'mri'),api.shortCiliaryLesson(identity,'mri'),identity.id);
 }
});
