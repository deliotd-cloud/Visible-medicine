import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {build} from './workspace-test-build.mjs';
import {hraDigest} from './hra-pelvis-source.mjs';
const compile=async(contents,resolveDir=process.cwd())=>{
 const out=await build({stdin:{contents,resolveDir,loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
 return import('data:text/javascript;base64,'+Buffer.from(out.outputFiles[0].text).toString('base64'));
};
const api=await compile("export * from './lib/hra-pelvis.ts';export * from './lib/hra-pelvis-teaching.ts';export * from './lib/hra-renal.ts';export * from './lib/hra-renal-teaching.ts';export * from './lib/independent-study-links.ts';export * from './lib/specimen-review-material.ts';");
const oldSource=execFileSync('git',['show','0de624cafde784fdb98c66f2a1a56c69051b3b7d:lib/hra-pelvis.ts'],{encoding:'utf8'});
const old=await compile(oldSource,process.cwd()+'/lib'),def=api.hraPelvisDefinition,previous=old.hraPelvisDefinition;
assert.deepEqual(def.studies.slice(0,8),previous.studies,'All eight previous studies retained exactly');
assert.deepEqual(def.surfaces.slice(0,41),previous.surfaces);
assert.deepEqual(def.catalog.structures.slice(0,41),previous.catalog.structures);
assert.deepEqual(def.catalog.bundles[0],previous.catalog.bundles[0]);
assert.deepEqual(def.catalog.coordinateSystem,previous.catalog.coordinateSystem);
assert.equal(def.surfaces.length,43);assert.equal(def.catalog.bundles.length,2);assert.equal(new Set(def.surfaces.map(s=>s.id)).size,43);
assert.equal(def.initialStudy,previous.initialStudy);assert.deepEqual(def.studies.slice(8).map(s=>s.id),['urinary','urinary-left','urinary-right']);
const additions=def.surfaces.slice(41);assert.deepEqual(additions.map(s=>s.sourceName),['VH_F_right_ureter','VH_F_left_ureter']);
for(const s of additions){
 assert.deepEqual(s,api.hraRenalSurfaces.find(r=>r.id===s.id));
 const lesson=api.hraPelvicTeaching(def,s);assert.deepEqual(lesson,api.hraRenalTeaching(api.hraRenalDefinition,s));
 const refs=[...lesson.references,...Object.values(lesson.extended.topics).flatMap(t=>t.references),...lesson.extended.selfCheck.references];
 assert(refs.every(r=>typeof api.hraPelvicContextReferenceTitles[r]==='string'));
 const study=def.studies.find(r=>r.id==='urinary-'+s.laterality);assert(study.ids.includes(s.id));assert.equal(study.ids.length,7);
 assert(!study.ids.includes(additions.find(r=>r.id!==s.id).id));
 const link=await api.makeIndependentStudyLink(def,{selectedId:s.id,studyId:study.id,view:study.view});assert(link?.includes('refStructure='));
 const material=await api.specimenReviewMaterial(def.key,s.id);assert(material);assert.equal(material.context.structureId,s.id);
 assert.equal(material.context.sourceFrame,'hra-united-female-v1.10:lps-mm');
 assert(material.topics?.length || material.context.teachingTabs.length);
 // A changed companion bundle must not retain teaching/practice eligibility.
 for(const mutate of [d=>d.catalog.bundles[1].sha256='0'.repeat(64),d=>d.catalog.coordinateSystem.sourceToSceneColumnMajor[0]*=-1,d=>d.surfaces.at(-1).sources[0].sha256='0'.repeat(64),d=>d.studies.at(-1).ids.pop()]){
  const bad=structuredClone(def);mutate(bad);assert.equal(api.hraPelvicTeaching(bad,s),null);assert.deepEqual(api.hraPelvicPractice.eligibleIds(bad,bad.surfaces.map(r=>r.id)),[]);
 }
 const changed={...s,nodeName:'VH_F_ureteral_orifice_L'};assert.equal(api.hraPelvicTeaching(def,changed),null);
}
assert(def.surfaces.every(s=>!/orifice|round_ligament|abdominal_ostium|cornua|posterior_wall_of_uterus|anterior_wall_of_uterus/.test(s.sourceName)));
assert.equal(def.studies.find(s=>s.id==='urinary').ids.length,10);
const sourceHashes={'hra-pelvis/pelvis.glb':'f18f1f0e3c6e8c0562b6b66864a8d786ffdb9e6a688da9288550fad6e491b866','hra-renal/kidneys.glb':'bd5d2affb912f135c8c8da7e7892fbc906ebae017ed7042e900646c2b6332cfc'};
for(const [path,hash]of Object.entries(sourceHashes))assert.equal(hraDigest(await readFile('public/models/'+path)),hash);
console.log(JSON.stringify({preservedPelvicSurfaces:41,preservedRecipes:8,unchangedModelBundles:2,reusedUreters:2,newStudies:3,teachingAndSourceIdentity:true,foreignDefinitionRejected:true,clinicalApproval:false}));
