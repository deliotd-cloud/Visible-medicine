import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {pulmonaryImagingApi,pulmonaryImagingBase,hash} from './pulmonary-imaging-tools.mjs';
import {nestedBeforePulmonaryImaging} from './pulmonary-imaging-history.mjs';
import {nestedBeforePulmonaryXray} from './pulmonary-xray-history.mjs';
const current=await pulmonaryImagingApi(),saved=await pulmonaryImagingApi({saved:true}),projected=nestedBeforePulmonaryXray(current),before=nestedBeforePulmonaryImaging(projected);
assert.deepEqual(before.nestedConcepts,saved.nestedConcepts);assert.deepEqual(before.nestedTeachingReferences,saved.nestedTeachingReferences);
assert.equal(nestedBeforePulmonaryImaging(before),before);
const raw=JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json')),catalog=projected.bodyDisplayCatalog(raw);
assert.deepEqual(catalog,saved.bodyDisplayCatalog(raw));
for(const path of ['content/nested-teaching-bindings.v1.json','content/femoral-component-teaching-bindings.v1.json','public/models/bodyparts3d/pulmonary/catalog.json']){
 assert.deepEqual(await readFile(path),execFileSync('git',['show',pulmonaryImagingBase+':'+path],{maxBuffer:16e6}));
}
const targets=projected.nestedStudyTargets(catalog),priorTargets=saved.nestedStudyTargets(catalog);assert.deepEqual(targets,priorTargets);
let changed=0,unchanged=0,groups=0;
for(const target of targets){
 const parent=catalog.structures.find(s=>s.id===target.parentId),live=projected.nestedTeachingFor(parent,target.study,target.structure),concept=live&&projected.nestedConcepts.find(c=>c.id===live.id),prior=saved.nestedTeachingFor(parent,target.study,target.structure);
 if(!concept){assert.equal(prior,null);continue;}
 if(target.study==='pulmonary')groups++;
 for(const topic of ['anatomy','function','clinical','pathology','ct','mri','ultrasound','xray','quiz']){
  const now=projected.nestedTopicLesson(concept,topic),old=saved.nestedTopicLesson(prior,topic);
  if(target.study==='pulmonary'&&['mri','ultrasound'].includes(topic)){
   assert.equal(old.readiness,'pending');assert.equal(now.readiness,'draft');assert.equal(now.citations.length,1);
   assert.match(now.note,/specialist review pending/);assert.match(now.note,/No scan access or synchronization/);changed++;
  }else{assert.deepEqual(now,old);unchanged++;}
 }
}
assert.equal(groups,5);assert.equal(changed,10);
const bad=structuredClone(projected.nestedConcepts);bad.find(c=>c.study==='pulmonary').imaging.ct.body+=' altered';
assert.throws(()=>nestedBeforePulmonaryImaging({...projected,nestedConcepts:bad}),/Unrecorded/);
const partial=structuredClone(projected.nestedConcepts);delete partial.find(c=>c.study==='pulmonary').imaging.mri;
assert.throws(()=>nestedBeforePulmonaryImaging({...projected,nestedConcepts:partial}),/Unrecorded/);
const report={source:pulmonaryImagingBase,newConceptTopics:6,draftPlacements:changed,sourceRepresentations:groups,unchangedNestedTopics:unchanged,priorConceptsAndReferencesExact:true,sourceBindingsUnchanged:true,geometryChanged:false,clinicalApproval:false,browserAcceptance:false};
await writeFile('docs/pulmonary-imaging-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
