import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {cardiacBeforeCavityDepth,cardiacCavityDepthReferenceKeys} from './cardiac-cavity-depth-history.mjs';
import pins from '../content/cardiac-cavity-depth-pins.json' with {type:'json'};
import {cardiacCavityDepthSections,cardiacCavityDepthReferences} from '../content/cardiac-cavity-depth.ts';
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
assert.equal(pins.baseline,'c52c9c690d790e4e921bde7ed5a943ef30a95001');
assert.equal(hash(pins),'88272f65d33121607eb8978ea408ac1251856611e7640e125ad63b37e9aaf0c1');
assert.equal(hash(cardiacCavityDepthSections),'7e546b30639bda7e620f9b6d49faad6a150549358f5d3ad21f93a2eba9ce9bb6');
assert.equal(hash(cardiacCavityDepthReferences),'c26a45865a951864ed1d7c09752cf48d41f30b3bfab1f5002c0d7b2887935879');
const exports="export * from './content/nested-teaching';export * from './lib/nested-teaching';export * from './lib/nested-anatomy';export * from './lib/nested-review-material';export * from './lib/nested-review-client';export * from './lib/nested-review-api';export * from './lib/nested-review';export {bodyDisplayCatalog} from './lib/body-display-catalog';export {bodyLesson,bodyContent} from './app/body-content';export {bodyReviewMaterial} from './lib/body-review-material';export {contentTabs} from './lib/content-types';export {regionalTours} from './lib/regional-tours';";
const compiled=await build({stdin:{contents:exports,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const prior=await exactSourceHistoryApi(pins.baseline,'nested-review-security');
const raw=JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json'));
const catalog=api.bodyDisplayCatalog(raw);
assert.deepEqual(catalog,prior.bodyDisplayCatalog(raw));
assert.equal(catalog.sourceVersion,pins.sourceVersion);assert.deepEqual(catalog.coordinateSystem,pins.coordinateSystem);
assert.deepEqual(api.regionalTours,prior.regionalTours);
assert.deepEqual(cardiacBeforeCavityDepth(api).nestedConcepts,prior.nestedConcepts);
assert.deepEqual(cardiacBeforeCavityDepth(api).nestedTeachingReferences,prior.nestedTeachingReferences);
assert.deepEqual(cardiacBeforeCavityDepth(prior).nestedConcepts,prior.nestedConcepts);
for(const mutate of [
 a=>a.nestedConcepts.find(c=>c.id==='cardiac-right-atrium').sections.anatomy.body+=' foreign',
 a=>delete a.nestedTeachingReferences.cardiacCavityBloodFlow,
 a=>a.nestedTeachingReferences.cardiacCavityLeftAtrium.url+='?foreign',
]){const changed={nestedConcepts:structuredClone(api.nestedConcepts),nestedTeachingReferences:structuredClone(api.nestedTeachingReferences)};mutate(changed);assert.throws(()=>cardiacBeforeCavityDepth(changed));}
const expectedIds=['cardiac-right-atrium','cardiac-left-atrium','cardiac-right-ventricle','cardiac-left-ventricle'];
assert.deepEqual(Object.keys(cardiacCavityDepthSections),expectedIds);
assert.deepEqual(Object.keys(cardiacCavityDepthReferences),cardiacCavityDepthReferenceKeys);
const beforeUrls=new Set(Object.values(prior.nestedTeachingReferences).map(r=>r.url));
for(const [key,ref] of Object.entries(cardiacCavityDepthReferences)){
 assert.equal(prior.nestedTeachingReferences[key],undefined);assert(!beforeUrls.has(ref.url));
 assert.equal(ref.scopedToConcept,true);assert(ref.title.trim());assert(/^https:\/\//.test(ref.url));
}
assert.equal(new Set(Object.values(cardiacCavityDepthReferences).map(r=>r.url)).size,8);
const targets=api.nestedStudyTargets(catalog);assert.equal(targets.length,108);
assert.deepEqual(targets,prior.nestedStudyTargets(catalog));
const changes=new Map(pins.entries.map(e=>[e.target.structureId,e]));
let changedTopics=0,unchangedTopics=0,changedReview=0,unchangedReview=0,rootTopics=0,rootPackets=0,sourceRefusals=0,staleSaves=0;
let storageCalls=0;
const noStorage={prepare(){storageCalls++;throw Error('Stale request reached storage');}};
const referenceWords={};
for(const c of api.nestedConcepts)for(const section of [...Object.values(c.sections),...Object.values(c.imaging??{}),{body:c.quiz.question+' '+c.quiz.answer,references:c.quiz.references}])
 for(const ref of section.references)if(Object.hasOwn(cardiacCavityDepthReferences,ref)||['cardiacChambers','cardiacFlow'].includes(ref))referenceWords[ref]=(referenceWords[ref]??0)+section.body.trim().split(/\s+/).length;
for(const [ref,words] of Object.entries(referenceWords))assert(words<=200,ref+' conservative word budget: '+words);
for(const target of targets){
 const parent=catalog.structures.find(s=>s.id===target.parentId),before=prior.nestedTeachingFor(parent,target.study,target.structure),current=api.nestedTeachingFor(parent,target.study,target.structure);
 assert(before&&current);const entry=changes.get(target.structureId);
 if(entry){
  assert.deepEqual(target,entry.target);assert.deepEqual(parent,entry.parent);assert.deepEqual(before,entry.previous);
  assert.deepEqual({...current,sections:{...current.sections,anatomy:before.sections.anatomy,function:before.sections.function}},before);
  assert.deepEqual({anatomy:current.sections.anatomy,function:current.sections.function},cardiacCavityDepthSections[entry.id]);
  for(const tab of ['anatomy','function']){
   const lesson=api.nestedTopicLesson(current,tab);assert.equal(lesson.body,cardiacCavityDepthSections[entry.id][tab].body);
   assert.equal(lesson.readiness,'draft');assert(lesson.citations.length);assert.match(lesson.body,/cavity|selection/);
   assert.notDeepEqual(lesson,prior.nestedTopicLesson(before,tab));changedTopics++;
  }
  const fresh=structuredClone(current);current.sections.anatomy.references.push('foreign');current.sections.function.body='foreign';
  assert.deepEqual(api.nestedTeachingFor(parent,target.study,target.structure),fresh);
  for(const [label,identity] of [['parent',parent],['child',target.structure]]){
   for(const field of Object.keys(identity)){
    const missing=structuredClone(identity);delete missing[field];
    const forged=structuredClone(identity);forged[field]=typeof forged[field]==='string'?forged[field]+'-foreign':null;
    for(const bad of [missing,forged]){assert.equal(api.nestedTeachingFor(label==='parent'?bad:parent,target.study,label==='child'?bad:target.structure),null);sourceRefusals++;}
   }
   for(const mutate of [v=>v.unexpected=true,v=>v.bounds.min[0]+=.01,v=>v.sources[0].sha256='0'.repeat(64),v=>v.sources[0].file+=' foreign',v=>v.provenance.citation+=' foreign']){
    const bad=structuredClone(identity);mutate(bad);assert.equal(api.nestedTeachingFor(label==='parent'?bad:parent,target.study,label==='child'?bad:target.structure),null);sourceRefusals++;
   }
  }
  assert.equal(api.nestedTeachingFor(parent,'pulmonary',target.structure),null);sourceRefusals++;
 }else assert.deepEqual(current,before);
 const clean=api.nestedTeachingFor(parent,target.study,target.structure);
 for(const tab of api.contentTabs)if(!entry||!['anatomy','function'].includes(tab)){assert.deepEqual(api.nestedTopicLesson(clean,tab),prior.nestedTopicLesson(before,tab));unchangedTopics++;}
 const row=api.nestedReviewRows.find(r=>r.parentId===parent.id&&r.study===target.study);
 const p=await api.nestedReviewMaterial(row.key,target.structureId),old=await prior.nestedReviewMaterial(row.key,target.structureId);
 assert.deepEqual(p.source,old.source);assert.equal(p.context.sourceHash,old.context.sourceHash);assert.equal(p.atlasLink,old.atlasLink);
 for(const key of ['catalogScope','nestedKey','sourceFrame','structureId','checklistVersion','checklists','blockers','teachingTabs'])assert.deepEqual(p.context[key],old.context[key]);
 assert.equal(p.context.revisions.imaging,null);
 if(entry){
  assert.notEqual(p.context.teachingHash,old.context.teachingHash);assert.notEqual(p.context.revisions.teaching,old.context.revisions.teaching);assert.notEqual(p.context.materialHash,old.context.materialHash);changedReview++;
  const synthetic={catalogScope:old.context.catalogScope,nestedKey:old.context.nestedKey,sourceFrame:old.context.sourceFrame,structureId:old.context.structureId,checklistVersion:old.context.checklistVersion,track:'teaching',revisionHash:old.context.revisions.teaching,status:'approved'};
  assert(api.nestedReviewStale(synthetic,p.context));assert.equal(api.nestedDecisionLabel(synthetic,p.context),'Re-review required');
  const reset=api.nestedDraftFromSaved({...api.blankNestedReview(old.context,'teaching'),...synthetic,attested:true},p.context,'teaching');
  assert.equal(reset.attested,false);assert(Object.values(reset.checks).every(x=>x===false));
  const payload={...synthetic,expectedVersion:0,materialHash:old.context.materialHash,draft:api.blankNestedReview(old.context,'teaching')};
  for(const requestPayload of [payload,{...payload,materialHash:p.context.materialHash}]){
   const request=new Request('https://atlas.test/api/nested-review',{method:'POST',headers:{Origin:'https://atlas.test','Content-Type':'application/json','oai-authenticated-user-id':'SOFTWARE_TEST_ONLY'},body:JSON.stringify(requestPayload)});
   assert.equal((await api.postNestedReview(request,noStorage)).status,409);staleSaves++;
  }
 }else{assert.deepEqual(p.teaching,old.teaching);assert.equal(p.context.teachingHash,old.context.teachingHash);assert.equal(p.context.revisions.teaching,old.context.revisions.teaching);unchangedReview++;}
}
assert.equal(storageCalls,0);
for(const s of catalog.structures){
 for(const tab of api.contentTabs){assert.deepEqual(api.bodyLesson(s,tab),prior.bodyLesson(s,tab));rootTopics++;}
 assert.deepEqual(await api.bodyReviewMaterial(s.id),await prior.bodyReviewMaterial(s.id));rootPackets++;
}
assert.equal(changedTopics,8);assert.equal(unchangedTopics,964);assert.equal(changedReview,4);assert.equal(unchangedReview,104);
assert.equal(rootTopics,9936);assert.equal(rootPackets,1104);assert.equal(staleSaves,8);
console.log(JSON.stringify({changedTopics,unchangedTopics,changedReview,unchangedReview,rootTopics,rootPackets,sourceRefusals,staleSaves,storageCalls,referenceWords,clinicalApproval:false,modelChanges:false,patientOrPrivateRecordsRead:false,browserAcceptance:false}));
