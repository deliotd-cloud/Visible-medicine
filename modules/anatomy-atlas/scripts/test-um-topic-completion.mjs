import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {build} from './workspace-test-build.mjs';
const baseline='33566ee21aa65ed1a370a5e7653337048656a13e';
const oldFile=path=>execFileSync('git',['show',baseline+':'+path],{maxBuffer:32e6});
const prior=JSON.parse(oldFile('content/um-limb-teaching-bindings.v1.json'));
const built=await build({stdin:{contents:"export * from './lib/um-limb-teaching'; export {limbDefinitions} from './lib/um-limb-studies'; export {specimenClinicalLessons,specimenClinicalReferences} from './content/um-limb-clinical';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const api=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
const oldReferencesBuild=await build({stdin:{contents:"export {specimenClinicalReferences} from './content/um-limb-clinical';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',plugins:[{name:'original-um-references',setup(builder){builder.onLoad({filter:/[\\/]content[\\/]um-limb-clinical\.ts$/},()=>({contents:oldFile('content/um-limb-clinical.ts').toString(),loader:'ts',resolveDir:process.cwd()+'/content'}));}}]});
const oldReferences=await import('data:text/javascript;base64,'+Buffer.from(oldReferencesBuild.outputFiles[0].text).toString('base64'));
for(const [key,reference] of Object.entries(oldReferences.specimenClinicalReferences))
 assert.deepEqual(api.specimenClinicalReferences[key],reference,key+': existing reading title and URL retained');
const whole=api.limbDefinitions.whole,topics=['clinical','pathology','ct','mri','xray','ultrasound'];
const counts={ct:0,mri:0,xray:0,ultrasound:0},referenceWords={},titles=Object.fromEntries(Object.values(api.specimenClinicalReferences).map(r=>[r.url,r.title]));
let preserved=0,changed=0,grouped=0,foreignRejects=0;
assert.equal(whole.surfaces.length,67);assert.equal(Object.keys(api.specimenClinicalLessons).length,65);
for(const surface of whole.surfaces){
 const before=prior.bindings.find(b=>b.surface.id===surface.id);assert(before);
 assert.deepEqual(surface,before.surface);
 const after=api.specimenTeachingFor(whole,surface);assert(after);
 const oldCore=structuredClone(before.lesson),newCore=structuredClone(after);delete oldCore.extended;delete newCore.extended;
 assert.deepEqual(newCore,oldCore,surface.slug+': anatomy/function/attachments/motor/core evidence retained');
 if(!before.lesson.extended){
  grouped++;assert.deepEqual(after,before.lesson,surface.slug+': grouped identity hold retained');
  assert.deepEqual(api.availableSpecimenTopics(whole,surface.id),['anatomy','function']);continue;
 }
 changed++;
 const oldExtended=structuredClone(before.lesson.extended),newExtended=structuredClone(after.extended);
 delete oldExtended.topics;delete newExtended.topics;assert.deepEqual(newExtended,oldExtended,surface.slug+': original model limits/self-check references');
 assert.deepEqual(Object.keys(after.extended.topics).sort(),[...topics].sort());
 for(const t of topics){
  const old=before.lesson.extended.topics[t],now=after.extended.topics[t];
  if(old){preserved++;assert.deepEqual(now,old,surface.slug+'/'+t+': previous populated topic');}
  else{
   assert(Object.hasOwn(counts,t));counts[t]++;
   assert.equal(now.readiness,'draft');assert(now.body.length>100);assert(now.references.length>0);
   assert(!/FMA\d|FJ\d|scan registered|clinically approved|diagnostic accuracy of (?:100|99)/i.test(now.body));
   assert(now.references.every(url=>titles[url]),surface.slug+'/'+t+': named reading links');
  }
  for(const url of now.references)referenceWords[url]=(referenceWords[url]??0)+now.body.trim().split(/\s+/).length;
 }
 for(const url of after.extended.selfCheck.references)referenceWords[url]=(referenceWords[url]??0)+(after.extended.selfCheck.question+' '+after.extended.selfCheck.answer).trim().split(/\s+/).length;
 const detached=structuredClone(after);after.extended.topics.ct.body='mutated';
 assert.deepEqual(api.specimenTeachingFor(whole,surface),detached);
 for(const patch of [{name:'Foreign anatomy'},{id:surface.id+'-foreign'},{bounds:{...surface.bounds,min:[surface.bounds.min[0]+1,...surface.bounds.min.slice(1)]}},{sources:surface.sources.map(s=>({...s,sha256:'foreign'}))}]){
  assert.equal(api.specimenTeachingFor(whole,{...surface,...patch}),null);foreignRejects++;
 }
}
assert.equal(preserved,235);assert.equal(changed,65);assert.equal(grouped,2);
assert.deepEqual(counts,{ct:54,mri:29,xray:34,ultrasound:38});assert.equal(foreignRejects,260);
for(const[url,words]of Object.entries(referenceWords))assert(words<=200,`Keep existing aggregate reference limit: ${url} (${words})`);
for(const path of ['lib/um-limb-studies.ts','lib/um-limb-teaching.ts','lib/um-limb-navigation.ts','content/um-limb-motor.ts','public/models/um-limb/catalog.json','public/models/um-knee/catalog.json'])
 assert.equal(readFileSync(path).toString().replaceAll('\r',''),oldFile(path).toString().replaceAll('\r',''),path+': geometry/frame/navigation/motor contracts unchanged');
console.log(JSON.stringify({baseline,newTopics:counts,totalAdded:155,previousTopicsRetained:preserved,mappedSelections:changed,heldGroups:grouped,foreignRejects,aggregateReferenceLimitRetained:true,clinicalApproval:false}));
