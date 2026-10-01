import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {dirname} from 'node:path';
import {build} from './workspace-test-build.mjs';
const baseline='33566ee21aa65ed1a370a5e7653337048656a13e';
const oldFile=path=>execFileSync('git',['show',baseline+':'+path],{encoding:'utf8',maxBuffer:32e6});
async function load(previous=false){
 const built=await build({stdin:{contents:"export * from './lib/specimen-review-material'; export * from './lib/specimen-review'; export * from './lib/specimen-review-api'; export {specimenClinicalReferences} from './content/um-limb-clinical';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',plugins:previous?[{name:'before-um-modality-completion',setup(api){
  for(const path of ['content/um-limb-teaching-bindings.v1.json','content/body-renderer-revision.json','lib/specimen-review-material.ts','content/um-limb-clinical.ts'])
   api.onLoad({filter:new RegExp(path.replaceAll('/','[\\\\/]')+'$')},args=>({contents:oldFile(path),loader:path.endsWith('.json')?'json':'ts',resolveDir:dirname(args.path)}));
 }}]:[]});
 return import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
}
const[current,previous]=await Promise.all([load(),load(true)]),storage=new Proxy({},{get(){throw Error('Stale UM request reached storage');}});
const titles=Object.fromEntries(Object.values(current.specimenClinicalReferences).map(r=>[r.url,r.title]));
let contexts=0,changed=0,unchanged=0,lessonChanges=0,metadataOnly=0,unblocked=0,rejected=0,pending=0;
const additions={ct:0,mri:0,xray:0,ultrasound:0};
for(const row of current.specimenReviewRows)for(const surface of row.surfaces){
 const label=row.key+'/'+surface.id,[before,after]=await Promise.all([previous.specimenReviewMaterial(row.key,surface.id),current.specimenReviewMaterial(row.key,surface.id)]);assert(before&&after,label);contexts++;
 assert.deepEqual(after.source,before.source,label+': source packet');assert.equal(after.context.sourceHash,before.context.sourceHash);
 assert.equal(after.atlasLink,before.atlasLink);assert.equal(after.atlasPath,before.atlasPath);
 assert.deepEqual(after.context.checklists,before.context.checklists);
 for(const track of ['geometry','teaching','imaging'])assert.deepEqual(after.context.blockers[track],before.context.blockers[track]);
 assert.equal(after.context.revisions.imaging,null);assert(after.context.blockers.imaging.length>0);
 pending+=after.teaching.topics.filter(t=>t.body===null).length;
 if(before.context.blockers.teaching.length&&!after.context.blockers.teaching.length)unblocked++;
 if(!row.key.startsWith('um-5t6tz7-v1-2:')){
  unchanged++;assert.deepEqual(after.teaching,before.teaching,label+': unrelated teaching');assert.equal(after.context.teachingHash,before.context.teachingHash);continue;
 }
 changed++;assert.deepEqual(before.teaching.referenceTitles,{});assert.deepEqual(after.teaching.referenceTitles,titles);
 const missing=before.teaching.topics.filter(t=>Object.hasOwn(additions,t.tab)&&t.body===null);
 if(before.teaching.lesson.extended){lessonChanges++;assert(missing.length>0);}
 else{metadataOnly++;assert.deepEqual(after.teaching.lesson,before.teaching.lesson,label+': grouped teaching hold');}
 assert.notEqual(after.context.teachingHash,before.context.teachingHash);assert.notEqual(after.context.revisions.teaching,before.context.revisions.teaching);
 const oldTeaching=structuredClone(before.teaching),newTeaching=structuredClone(after.teaching);delete oldTeaching.topics;delete newTeaching.topics;delete oldTeaching.referenceTitles;delete newTeaching.referenceTitles;
 if(oldTeaching.lesson?.extended)delete oldTeaching.lesson.extended.topics;if(newTeaching.lesson?.extended)delete newTeaching.lesson.extended.topics;
 assert.deepEqual(newTeaching,oldTeaching,label+': core/self-check/motor/limits');
 for(const topic of after.teaching.topics){
  const old=before.teaching.topics.find(t=>t.tab===topic.tab);assert(old);
  if(before.teaching.lesson.extended&&missing.some(t=>t.tab===topic.tab)){
   assert(topic.body.length>100);assert(topic.references.length>0);assert(topic.references.every(url=>titles[url]));additions[topic.tab]++;
   assert.equal(after.teaching.lesson.extended.topics[topic.tab].readiness,'draft');
  }else assert.deepEqual(topic,old,label+'/'+topic.tab+': existing topic/pending hold');
 }
 const draft=current.blankSpecimenReview(after.context,'teaching');assert.equal(draft.status,'draft');assert.equal(draft.attested,false);assert(Object.values(draft.checks).every(v=>v===false));
 assert(current.specimenApprovalProblems({...draft,reviewer:'Synthetic',qualification:'Synthetic',scope:'Synthetic',attested:true,evidence:['https://example.test']},after.context,'teaching').includes('Complete every checklist item.'));
 for(const patch of [{revisionHash:before.context.revisions.teaching},{materialHash:before.context.materialHash},{sourceFrame:'foreign-frame'}]){
  const response=await current.postSpecimenReview(new Request('https://atlas.test/api/review/specimens',{method:'POST',headers:{origin:'https://atlas.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_UM_TOPICS'},body:JSON.stringify({catalogScope:after.context.catalogScope,specimenKey:row.key,structureId:surface.id,sourceFrame:after.context.sourceFrame,materialHash:after.context.materialHash,revisionHash:after.context.revisions.teaching,checklistVersion:after.context.checklistVersion,track:'teaching',expectedVersion:0,draft,...patch})}),storage);
  assert.equal(response.status,409,label+': reject stale/foreign before storage');rejected++;
 }
 const untouched=structuredClone(after);after.teaching.referenceTitles[Object.keys(titles)[0]]='mutated';if(after.teaching.lesson.extended)after.teaching.lesson.extended.topics.ct.body='mutated';
 assert.deepEqual(await current.specimenReviewMaterial(row.key,surface.id),untouched,label+': clone isolation');
}
assert.equal(contexts,356);assert.equal(changed,154);assert.equal(lessonChanges,150);assert.equal(metadataOnly,4);assert.equal(unchanged,202);assert.equal(rejected,462);assert.equal(unblocked,0);assert.equal(pending,24);
assert.deepEqual(additions,{ct:119,mri:64,xray:75,ultrasound:86});
console.log(JSON.stringify({baseline,contexts,unchangedSourceContexts:356,changedTeachingContexts:changed,unchangedTeachingContexts:unchanged,lessonChanges,metadataOnly,newTopicPlacements:additions,totalContextAdditions:344,pending,rejectedStalePackets:rejected,newSoftwarePrerequisiteContexts:unblocked,clinicalApproval:false}));
