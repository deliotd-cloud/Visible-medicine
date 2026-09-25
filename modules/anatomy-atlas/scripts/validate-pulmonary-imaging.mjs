import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {pulmonaryImagingApi,pulmonaryImagingBase,pulmonaryImagingTransition,pulmonaryImagingSource} from './pulmonary-imaging-tools.mjs';
import {verifyPulmonaryImagingStages} from './pulmonary-imaging-stage-history.mjs';
import {nestedBeforePulmonaryImaging} from './pulmonary-imaging-history.mjs';
import {nestedBeforePulmonaryXray} from './pulmonary-xray-history.mjs';
const current=await pulmonaryImagingApi(),saved=await pulmonaryImagingApi({revision:pulmonaryImagingBase}),stage=await pulmonaryImagingApi({revision:pulmonaryImagingTransition});
verifyPulmonaryImagingStages(saved,stage);
const projected=nestedBeforePulmonaryXray(current);
nestedBeforePulmonaryImaging(projected);
assert.deepEqual(projected.nestedConcepts.filter(c=>c.study==='pulmonary'),stage.nestedConcepts.filter(c=>c.study==='pulmonary'));
for(const key of ['pulmonaryMRIPhysics','pulmonaryUltrasoundLimits'])assert.deepEqual(projected.nestedTeachingReferences[key],stage.nestedTeachingReferences[key]);
const raw=JSON.parse(pulmonaryImagingSource(pulmonaryImagingBase,'public/models/bodyparts3d/full-body/catalog.json').toString('utf8')),catalog=stage.bodyDisplayCatalog(raw);
assert.deepEqual(catalog,saved.bodyDisplayCatalog(raw));
const targets=stage.nestedStudyTargets(catalog),priorTargets=saved.nestedStudyTargets(catalog);assert.deepEqual(targets,priorTargets);
let changed=0,unchanged=0,groups=0;
for(const target of targets){
 const parent=catalog.structures.find(s=>s.id===target.parentId),live=stage.nestedTeachingFor(parent,target.study,target.structure),concept=live&&stage.nestedConcepts.find(c=>c.id===live.id),prior=saved.nestedTeachingFor(parent,target.study,target.structure);
 if(!concept){assert.equal(prior,null);continue;}
 if(target.study==='pulmonary')groups++;
 for(const topic of ['anatomy','function','clinical','pathology','ct','mri','ultrasound','xray','quiz']){
  const now=stage.nestedTopicLesson(concept,topic),old=saved.nestedTopicLesson(prior,topic);
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
const wrongRefs={...projected.nestedTeachingReferences,pulmonaryMRIPhysics:{...projected.nestedTeachingReferences.pulmonaryMRIPhysics,url:'https://example.org/wrong'}};
assert.throws(()=>nestedBeforePulmonaryImaging({...projected,nestedTeachingReferences:wrongRefs}),/Mixed pulmonary imaging references/);
const mixedRefs={...projected.nestedTeachingReferences};delete mixedRefs.pulmonaryMRIPhysics;
assert.throws(()=>nestedBeforePulmonaryImaging({...projected,nestedTeachingReferences:mixedRefs}),/Mixed pulmonary imaging references/);
const tamperedStage={...stage,nestedConcepts:structuredClone(stage.nestedConcepts)};tamperedStage.nestedConcepts.find(c=>c.study==='pulmonary').imaging.mri.body+=' altered';
assert.throws(()=>verifyPulmonaryImagingStages(saved,tamperedStage),/Historical transition pulmonary concepts changed/);
const changedCorpus={...stage,nestedConcepts:[...stage.nestedConcepts,{id:'unexpected'}]};
assert.throws(()=>verifyPulmonaryImagingStages(saved,changedCorpus),/Historical non-pulmonary concepts changed/);
const currentCatalog=current.bodyDisplayCatalog(JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json')));
const currentTargets=current.nestedStudyTargets(currentCatalog).filter(t=>t.study==='pulmonary');
assert.equal(currentTargets.length,5,'Current pulmonary source representations changed');
for(const target of currentTargets){const parent=currentCatalog.structures.find(s=>s.id===target.parentId);assert(current.nestedTeachingFor(parent,target.study,target.structure),'Current pulmonary source identity changed');}
const report={source:pulmonaryImagingBase,newConceptTopics:6,draftPlacements:changed,sourceRepresentations:groups,unchangedNestedTopics:unchanged,priorConceptsAndReferencesExact:true,sourceBindingsUnchanged:true,geometryChanged:false,clinicalApproval:false,browserAcceptance:false};
await writeFile('docs/pulmonary-imaging-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
